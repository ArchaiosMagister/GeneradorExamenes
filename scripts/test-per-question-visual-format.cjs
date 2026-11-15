'use strict';
/* Valores independientes por pregunta en pantalla, Word, borradores y PWA. */
const assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
function zipEntry(bytes,wanted){
 let off=0;
 while(off+30<=bytes.length&&bytes.readUInt32LE(off)===0x04034b50){
  const length=bytes.readUInt32LE(off+18),nameLen=bytes.readUInt16LE(off+26),extra=bytes.readUInt16LE(off+28);
  const name=bytes.toString('utf8',off+30,off+30+nameLen),start=off+30+nameLen+extra;
  if(name===wanted){assert.equal(bytes.readUInt16LE(off+8),0);return bytes.toString('utf8',start,start+length)}
  off=start+length;
 }
 throw Error('No se encontró '+wanted);
}
async function wordXml(page){
 const data=await page.evaluate(async()=>{
  const original=downloadBlob,review=window.ExaminaTeacherReview,old=review?.evidenceMayExport;
  let blob;
  try{
   if(review)review.evidenceMayExport=()=>true;
   downloadBlob=(_name,b)=>blob=b;
   exportWord(false);
  }finally{
   downloadBlob=original;
   if(review)review.evidenceMayExport=old;
  }
  if(!blob)throw Error('El exportador no produjo un DOCX');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
 });
 return zipEntry(Buffer.from(data),'word/document.xml');
}
const point=pt=>pt*96/72;
function closeTo(value,pt){
 assert(Math.abs(parseFloat(value)-point(pt))<1.6,
  'Espaciado CSS esperado '+pt+' pt, obtenido '+value);
}
function key(course,model,kind,scope='exam'){return course+'/'+model+'/'+scope+':'+kind}
async function configure(page,course,model,lang,ud){
 return page.evaluate(({course,model,lang,ud})=>{
  const choose=(id,value)=>{
   const el=document.getElementById(id);
   if(!el)throw Error('No existe el control '+id);
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  choose('course',course);choose('model',model);choose('lang',lang);
  const choice=[...document.querySelectorAll('#unitChoices .unit-choice')].find(el=>units[Number(el.value)]===ud);
  if(!choice)throw Error('No se encuentra '+course+' '+ud);
  document.querySelectorAll('#unitChoices .unit-choice').forEach(el=>{el.checked=el===choice});
  choice.dispatchEvent(new Event('change',{bubbles:true}));
  if(course==='latin4'){
   document.getElementById('culture').checked=true;
   examQuestionChoiceState['latin4/tablas/culture']=true;
  }
  examSelectionCache.clear();generate();
  window.ExaminaScoring?.sync?.();
  return {
   headings:[...document.querySelectorAll('#paper .exam-sheet > p.exam-question')]
    .map(x=>({kind:x.dataset.examKind||x.dataset.morphKind||x.dataset.greekKind,
      text:x.textContent.trim()})),
   scoreCount:window.ExaminaScoring.rows().length,
   body:document.querySelector('#paper .exam-sheet')?.textContent
  };
 },{course,model,lang,ud});
}
async function setPer(page,k,field,value){
 await page.locator('#examVisualSettings').evaluate(el=>el.open=true);
 const el=page.locator('#examVisualQuestionRows input[data-exam-visual-key="'+k+'"][data-exam-visual-field="'+field+'"]');
 assert.equal(await el.count(),1,'No hay control individual '+k+' / '+field);
 await el.fill(String(value));await el.press('Tab');
 return el;
}
function paragraphs(xml){
 return [...xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map(x=>x[0]);
}
function para(xml,needle){
 const p=paragraphs(xml).find(p=>p.includes(needle));
 assert(p,'No se ha encontrado el párrafo de Word '+needle);
 return p;
}
function margin(xml,text,pts){
 const p=para(xml,text);
 assert(p.includes('w:before="'+Math.round(pts*20)+'"'),
  text+': Word no aplica '+pts+' pt a su enunciado');
}
async function latin4(page,file){
 const state=await configure(page,'latin4','tablas','es','UD4');
 assert(state.headings.length>=5,file+': faltan preguntas de Latín 4.º');
 assert.equal(state.scoreCount,state.headings.length,file+': puntuación distinta de preguntas');
 const settings=page.locator('#examVisualSettings');
 await settings.evaluate(el=>el.open=true);
 for(const kind of ['decl','verb','forms','culture','sent'])
  assert.equal(await page.locator('#examVisualQuestionRows [data-exam-visual-key="'+key('latin4','tablas',kind)+'"]').count()>0,true,
   file+': falta fila '+kind);
 assert.equal(await page.locator('#examVisualQuestionRows input[data-exam-visual-field="items"][data-exam-visual-key="'+key('latin4','tablas','verb')+'"]').count(),0,
  file+': la tabla verbal única no debe tener un espaciado inoperante');
 assert.equal(await page.locator('#examQuestionBeforePt').inputValue(),'12',file+': se perdieron los 12 pt globales');
 assert.equal(await page.locator('#examCultureGapPt').inputValue(),'5',file+': se perdieron los 5 pt de cultura');
 const before=await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML);
 await setPer(page,key('latin4','tablas','verb'),'before',16);
 await setPer(page,key('latin4','tablas','culture'),'before',22);
 await setPer(page,key('latin4','tablas','forms'),'items',4);
 await setPer(page,key('latin4','tablas','culture'),'items',9.5);
 await setPer(page,key('latin4','tablas','sent'),'items',30);
 const decl=page.locator('#examVisualQuestionRows input[data-exam-visual-key="'+key('latin4','tablas','decl')+'"][data-exam-visual-field="items"]');
 if(await decl.count())await setPer(page,key('latin4','tablas','decl'),'items',10);
 assert.equal(await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML),before,
  file+': variar el formato alteró el HTML, las formas o la puntuación del examen');
 const values=await page.evaluate(()=>{
  const sheet=document.querySelector('#paper .exam-sheet');
  const elem=x=>getComputedStyle(sheet.querySelector(x)).marginTop;
  return {
   culture:elem('p.exam-question[data-exam-kind="culture"]'),
   verb:elem('p.exam-question[data-exam-kind="verb"]'),
   forms:elem('p.exam-question[data-exam-kind="forms"]'),
   cultureItem:elem('.exam-culture-items>li+li'),
   formItem:elem('p.exam-question[data-exam-kind="forms"]+ol.task>li+li'),
   sentenceItem:elem('.exam-sentences>li+li'),
   nouns:[...sheet.querySelectorAll('table.exam-nouns')].map(t=>getComputedStyle(t).marginTop),
   cultureTexts:[...sheet.querySelectorAll('.exam-culture-items>li')].map(el=>el.firstChild?.textContent.trim()),
   saved:window.ExaminaVisualFormat.snapshot()
  };
 });
 closeTo(values.culture,22);closeTo(values.verb,16);closeTo(values.forms,12);
 closeTo(values.cultureItem,9.5);closeTo(values.formItem,4);closeTo(values.sentenceItem,30);
 assert.equal(values.saved.perQuestion[key('latin4','tablas','culture')].items,9.5);
 const xml=await wordXml(page);
 margin(xml,'Cultura clásica',22);margin(xml,'Conjuga en',16);margin(xml,'Analiza morfológicamente',12);
 const culturePara=para(xml,values.cultureTexts[1]);
 assert(culturePara.includes('w:before="190"'),file+': los 9,5 pt culturales no llegaron a Word');
 assert(xml.includes('w:before="600"'),file+': los 30 pt de oraciones no llegaron a Word');
 assert(xml.includes('w:before="80"'),file+': los 4 pt de análisis no llegaron a Word');
 if(values.nouns.length>1){
  closeTo(values.nouns[1],10);
  assert(xml.includes('w:line="200" w:lineRule="exact"'),file+': los 10 pt entre tablas no llegan al DOCX');
 }
 // Una pregunta sin personalización sigue el valor general; otra se mantiene independiente.
 const global=page.locator('#examQuestionBeforePt');
 await global.fill('15');await global.press('Tab');
 const computed=await page.evaluate(()=>{
  const sheet=document.querySelector('#paper .exam-sheet');
  const get=kind=>getComputedStyle(sheet.querySelector('p.exam-question[data-exam-kind="'+kind+'"]')).marginTop;
  return [get('decl'),get('verb'),get('culture')];
 });
 closeTo(computed[0],15);closeTo(computed[1],16);closeTo(computed[2],22);
 const snapshot=await page.evaluate(()=>window.ExaminaUnifiedCurrentExam());
 await setPer(page,key('latin4','tablas','culture'),'items',1);
 await setPer(page,key('latin4','tablas','verb'),'before',2);
 await page.evaluate(snap=>window.ExaminaUnifiedRestoreDraft(snap),snapshot);
 assert.equal(await page.locator('input[data-exam-visual-key="'+key('latin4','tablas','culture')+'"][data-exam-visual-field="items"]').inputValue(),'9.5',
  file+': restaurar el borrador ha perdido el espacio cultural individual');
 assert.equal(await page.locator('input[data-exam-visual-key="'+key('latin4','tablas','verb')+'"][data-exam-visual-field="before"]').inputValue(),'16',
  file+': restaurar el borrador ha perdido el margen verbal individual');
 await page.reload({waitUntil:'load'});
 await page.waitForFunction(()=>!!window.ExaminaVisualFormat);
 const persisted=await page.evaluate(()=>window.ExaminaVisualFormat.snapshot());
 assert.equal(persisted.perQuestion[key('latin4','tablas','culture')].items,9.5,
  file+': no se ha persistido la configuración individual de cultura');
 assert.equal(persisted.perQuestion[key('latin4','tablas','verb')].before,16);
 const va=await configure(page,'latin4','tablas','va','UD4');
 assert.equal(va.scoreCount,va.headings.length,file+': el valenciano cambia la puntuación');
 assert.match(await page.locator('#examVisualIndividualsTitle').textContent(),/Per pregunta/);
 assert.equal(await page.locator('input[data-exam-visual-key="'+key('latin4','tablas','culture')+'"][data-exam-visual-field="items"]').inputValue(),'9.5',
  file+': al cambiar idioma desaparece el espaciado individual');
 const vaXML=await wordXml(page);
 margin(vaXML,'Cultura clàssica',22);
 assert.deepEqual(va.headings.some(x=>x.text.includes('Cultura clàssica')),true);
}
async function morph(page,file){
 // El identificador del apartado debe funcionar también en los exámenes
 // morfológicos de los dos cursos y en el exportador Word.
 for(const [course,model,unit] of [['latin1','morf','UD4'],['greek1','morphology','UD8']]){
  const state=await configure(page,course,model,'es',unit);
  assert(state.headings.length>0,file+': sin preguntas de '+course);
  const formsKey=key(course,model,'forms','morph');
  const before=page.locator('input[data-exam-visual-key="'+formsKey+'"][data-exam-visual-field="before"]');
  assert.equal(await before.count(),1,file+': el formato no reconoce la pregunta morfológica '+course);
  await setPer(page,formsKey,'before',19);
  const xml=await wordXml(page);
  const forms=state.headings.find(x=>x.kind==='forms');
  assert(forms,file+': no aparece análisis de palabras en '+course);
  // Se distingue de la pregunta de verbos: sus títulos empiezan igual.
  const title=forms.text.replace(/^\d+\.\s*/,'').trim().slice(0,70);
  margin(xml,title,19);
  if(await page.locator('input[data-exam-visual-key="'+formsKey+'"][data-exam-visual-field="items"]').count()){
   await setPer(page,formsKey,'items',6);
   const item=await page.locator('#paper .reference-analysis-item').nth(1).evaluate(el=>getComputedStyle(el).marginTop);
   closeTo(item,6);
   const formatted=await wordXml(page);
   assert(formatted.includes('w:before="120"'),file+': los 6 pt de análisis de '+course+' no llegan a Word');
  }
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const context=await browser.newContext({viewport:{width:1180,height:850}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(pathToFileURL(path.join(ROOT,file)).href,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ExaminaVisualFormat&&!!window.ExaminaScoring?.rows);
    await latin4(page,file);
    await morph(page,file);
    assert.deepEqual(errors,[],file+': excepciones JavaScript tras cambiar valores por pregunta');
   }finally{await context.close()}
  }
  console.log('OK: espaciado individual y valores generales por pregunta, listas/tablas, Word ES/VA, tres cursos, borradores y PWA sin regenerar.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
