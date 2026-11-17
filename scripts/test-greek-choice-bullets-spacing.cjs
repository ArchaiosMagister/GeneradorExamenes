'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const out=path.resolve('test-artifacts/greek1-bullets-spacing');fs.mkdirSync(out,{recursive:true});
function entry(b,name){let p=0;while(b.readUInt32LE(p)===0x04034b50){const n=b.readUInt16LE(p+26),e=b.readUInt16LE(p+28),size=b.readUInt32LE(p+18),s=p+30+n+e;if(b.toString('utf8',p+30,p+30+n)===name)return b.toString('utf8',s,s+size);p=s+size}throw Error(name)}
async function gap(page,model,kind,value){
 await page.locator('#examPanelShortcuts>button[data-target="examVisualSettings"]').click();
 await page.locator('#examVisualSettings').evaluate(n=>n.open=true);
 const input=page.locator('input[data-exam-visual-key="greek1/'+model+'/exam:'+kind+'"][data-exam-visual-field="items"]');
 assert.equal(await input.count(),1);await input.fill(String(value));await input.press('Tab');
}
const shape=page=>page.evaluate(()=>({
 subheads:[...document.querySelectorAll('.greek-choice-subquestion > .exam-letter')].map(x=>x.textContent),
 markers:[...document.querySelectorAll('.greek-choice-option .exam-form > .exam-letter,.greek-choice-option .exam-etymology [data-corpus-id] > .exam-letter,.greek-choice-generated-item > .exam-letter')].map(x=>x.textContent),
 number:[...document.querySelectorAll('[data-greek-choice-slot^="change-number:"]')].map(x=>x.textContent),
 customInputs:[...document.querySelectorAll('[data-greek-custom-edit]')].map(x=>x.value),
 score:ExaminaScoring.total()
}));
(async()=>{const browser=await chromium.launch();const cases=[];try{
for(const file of ['index.html','offline.html'])for(const model of ['complete','translation'])for(const lang of ['es','va']){
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 await ctx.route(/^https?:\/\//,r=>r.abort());const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(file)).href);
 await page.evaluate(({model,lang})=>{$('course').value='greek1';$('course').dispatchEvent(new Event('change',{bubbles:true}));$('model').value=model;$('model').dispatchEvent(new Event('change',{bubbles:true}));$('lang').value=lang;$('lang').dispatchEvent(new Event('change',{bubbles:true}));document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=units[Number(x.value)]==='UD7');generate()},{model,lang});
 await page.waitForFunction(()=>ExaminaScoring.total()===1000&&document.querySelectorAll('.greek-choice-option').length===7);
 const initial=await shape(page);assert.deepEqual(initial.subheads,['a.','b.','c.','d.','e.','a.','b.']);assert(initial.markers.length>=14&&initial.markers.every(x=>x==='◦'));
 assert(initial.number.every(x=>!/(?:singular|plural):/i.test(x)));
 assert(initial.customInputs.every(x=>!/^\s*◦/.test(x)),'La viñeta no pertenece al contenido del editor');
 await page.evaluate(()=>{window.__spacingSheet=document.querySelector('#paper .exam-sheet');window.__spacingRows=[...document.querySelectorAll('[data-greek-choice-slot]')];document.querySelector('#paper .exam-header').append(' ESPACIO_DOCENTE')});
 const html=await page.locator('#paper .exam-sheet').innerHTML();
 await gap(page,model,'greek-competence',14);
 await gap(page,model,'greek-plurilingual',9);
 assert.equal(await page.locator('#paper .exam-sheet').innerHTML(),html,'El formato no regenera ni modifica el examen');
 const metrics=await page.evaluate(()=>{
  const numbers=[...document.querySelectorAll('[data-greek-choice-slot^="change-number:"]')];
  const etym=document.querySelector('.greek-choice-option .exam-etymology');
  const rows=[...document.querySelectorAll('[data-greek-choice-slot]')];
  return {same:window.__spacingSheet===document.querySelector('#paper .exam-sheet')&&rows.every((x,i)=>x===window.__spacingRows[i]),
   first:getComputedStyle(numbers[0]).marginTop,gap:getComputedStyle(numbers[1]).marginTop,etym:getComputedStyle(etym).rowGap,
   word:wordBlock(numbers[1]),wordEtym:wordBlock(etym)};
 });
 assert(metrics.same);assert.equal(parseFloat(metrics.first),0);assert(Math.abs(parseFloat(metrics.gap)-14*96/72)<.2);assert(Math.abs(parseFloat(metrics.etym)-9*96/72)<.2);
 assert(metrics.word.includes('◦')&&metrics.word.includes('w:before="280"'));assert(metrics.wordEtym.includes('w:before="180"'));
 const pdfMetrics=await page.evaluate(()=>{
  const doc=ExaminaPdfExport.prepareDocument(),mount=document.createElement('div');mount.style.cssText='position:absolute;left:-100000px';mount.append(doc);document.body.append(mount);
  try{return {number:getComputedStyle(doc.querySelectorAll('[data-greek-choice-slot^="change-number:"]')[1]).marginTop,etym:getComputedStyle(doc.querySelector('.greek-choice-option .exam-etymology')).rowGap}}finally{mount.remove()}
 });assert.equal(pdfMetrics.number,metrics.gap);assert.equal(pdfMetrics.etym,metrics.etym);
 await page.evaluate(()=>{$('saveDraft').click()});await gap(page,model,'greek-competence',2);await page.evaluate(()=>window.ExaminaUnifiedRestoreDraft(JSON.parse(localStorage.getItem('examina_draft_v14'))));
 assert.equal(await page.locator('input[data-exam-visual-key="greek1/'+model+'/exam:greek-competence"][data-exam-visual-field="items"]').inputValue(),'14');
 assert.match(await page.locator('#paper').textContent(),/ESPACIO_DOCENTE/);
 // Compatibilidad con borradores anteriores: letras, cifras e indicaciones antiguas.
 await page.evaluate(()=>{
  const draft=ExaminaUnifiedCurrentExam(),host=document.createElement('div');host.innerHTML=draft.html;
  host.querySelectorAll('[data-greek-choice-group]').forEach(x=>delete x.dataset.greekChoiceGroup);
  host.querySelectorAll('.greek-choice-generated-item').forEach((x,i)=>{
   x.querySelector('.exam-letter').textContent=(i+1)+'.';
   if(x.dataset.greekChoiceSlot.startsWith('change-number:'))x.childNodes[1].textContent=' A plural: '+x.childNodes[1].textContent;
  });
  host.querySelectorAll('.exam-etymology .exam-letter').forEach(x=>x.textContent='a.');
  draft.html=host.innerHTML;ExaminaUnifiedRestoreDraft(draft);
 });
 const migrated=await shape(page);assert(migrated.markers.every(x=>x==='◦'));assert(migrated.number.every(x=>!/(?:singular|plural):/i.test(x)));
 assert.equal(await page.locator('.greek-choice-option:not([data-greek-choice-group])').count(),0);
 assert(await page.evaluate(()=>ExaminaGreekChoiceGroups.replaceGenerated('change-number',0)));
 const after=await shape(page);assert(after.markers.every(x=>x==='◦'));assert(after.number.every(x=>!/(?:singular|plural):/i.test(x)));assert.equal(after.score,1000);
 // Edición de etimología: mantener viñeta, palabra y el vínculo de edición.
 const edited=await page.evaluate(()=>{
  const target=document.querySelector('.greek-choice-option .exam-etymology [data-corpus-id]');
  const input=document.querySelector('input[data-exam-editor-link="'+target.dataset.examEditorLink+'"]');
  if(!input)throw Error('Editor etimológico ausente');input.value='λόγος';input.dispatchEvent(new Event('input',{bubbles:true}));
  return {text:target.textContent,marker:target.querySelector('.exam-letter')?.textContent,input:input.value};
 });assert.equal(edited.marker,'◦');assert(edited.text.includes('λόγος'));assert.equal(edited.input,'λόγος');
 const bytes=Buffer.from(await page.evaluate(async()=>{const old=downloadBlob;let b;try{downloadBlob=(_n,x)=>b=x;exportWord(false)}finally{downloadBlob=old}if(!b)throw Error('Word bloqueado');return [...new Uint8Array(await b.arrayBuffer())]}));
 const xml=entry(bytes,'word/document.xml');assert(xml.includes('◦'));assert(!/A (?:singular|plural):/.test(xml));assert(xml.includes('w:before="280"')&&xml.includes('w:before="180"'));assert(xml.includes('<w:u w:val="single"/>'));
 const stem=file.replace('.html','')+'-'+model+'-'+lang;fs.writeFileSync(path.join(out,stem+'.docx'),bytes);
 const pending=page.waitForEvent('download');await page.locator('#pdfDownload').click({force:true});await (await pending).saveAs(path.join(out,stem+'.pdf'));
 assert.deepEqual(errors,[]);cases.push({file,model,lang,markers:after.markers.length,points:after.score,spacing:[14,9],draft:true,pdf:true,word:true});await ctx.close();
}
fs.writeFileSync(path.join(out,'feature-results.json'),JSON.stringify(cases,null,2));console.log('GRIEGO I: círculos huecos, subpreguntas a–e, sintagmas sin dirección, espaciado independiente 1/2, edición, borradores, Word y PDF sin red: 8 contextos OK');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
