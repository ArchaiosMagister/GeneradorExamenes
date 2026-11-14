'use strict';
// Fase VI: 10 p. en exámenes completos, pruebas morfológicas parciales a 1 p. por pregunta.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

function extract(bytes,wanted){
 let p=0;
 while(p+30<=bytes.length&&bytes.readUInt32LE(p)===0x04034b50){
  const size=bytes.readUInt32LE(p+18),n=bytes.readUInt16LE(p+26),extra=bytes.readUInt16LE(p+28);
  const name=bytes.toString('utf8',p+30,p+30+n),begin=p+30+n+extra;
  assert(begin+size<=bytes.length,'DOCX truncado: '+name);
  if(name===wanted){assert.equal(bytes.readUInt16LE(p+8),0);return bytes.toString('utf8',begin,begin+size)}
  p=begin+size;
 }
 throw Error('Falta '+wanted);
}
const form=async(page,course,model,unit)=>{
 await page.evaluate(({course,model,unit})=>{
  const c=document.getElementById('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=document.getElementById('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  for(const el of choices)el.checked=units[Number(el.value)]===unit;
  choices.find(el=>el.checked)?.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  if(course==='greek1')greekExamState=null;
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>window.ExaminaScoring?.rows().length>0);
 await page.evaluate(()=>window.ExaminaScoring.sync());
};
async function policySweep(page,filename){
 for(const [course,model,unit] of [
  ['latin1','tablas','UD7'],['latin1','morf','UD7'],['latin1','mixto','UD7'],
  ['latin4','tablas','UD7'],['latin4','morf','UD7'],['latin4','mixto','UD7'],
  ['greek1','complete','UD7'],['greek1','morphology','UD7'],['greek1','translation','UD7']
 ]){
  await form(page,course,model,unit);
  const label=filename+' '+course+'/'+model;
  const result=await page.evaluate(()=>{
   const e=window.ExaminaScoring;
   const initial={total:e.total(),mode:e.finalMode(),rows:e.rows()};
   const check=document.getElementById('examFinalMode');
   check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
   const definitive=e.preflight();
   check.checked=false;check.dispatchEvent(new Event('change',{bubbles:true}));
   const draft=e.preflight();
   return {initial,definitive,draft,effectiveModel:document.getElementById('model').value};
  });
  assert(result.initial.rows.length>0,label+': sin preguntas');
  assert(result.initial.total>0,label+': ninguna pregunta puntuada');
  assert.equal(result.initial.mode,false,label+': modo definitivo activado sin consentimiento');
  assert.equal(result.definitive.normalized,false,label+': normalización implícita');
  const partial=['morf','morphology'].includes(result.effectiveModel);
  assert.equal(result.definitive.mode,partial?'parcial':'definitivo',label+': modalidad final incorrecta');
  assert.equal(result.definitive.ok,partial?
   result.initial.rows.every(x=>x.points===100):result.initial.total===1000,
   label+': validación no estricta');
  assert.equal(result.draft.ok,true,label+': no se admite el borrador');
  assert.equal(result.draft.mode,'borrador',label+': estado del borrador');
  const text=await page.locator('#examScoringTotal').innerText();
  if(partial)assert.match(text,/prova parcial|prueba parcial/i,label+': morfología no identificada como prueba parcial');
  else if(result.initial.total!==1000)assert.match(text,/10|morfolog/i,label+': falta aviso de puntuación');
 }
}
async function testPreservation(page,filename){
 await form(page,'latin1','mixto','UD7');
 await page.evaluate(()=>{
  const count=document.getElementById('count-sent');
  count.value='7';count.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForFunction(()=>window.ExaminaScoring.rows().some(x=>x.key.endsWith('/sent')));
 const before=await page.evaluate(()=>{
  const scoring=window.ExaminaScoring;
  return {total:scoring.total(),rows:scoring.rows()};
 });
 const sent=before.rows.find(x=>x.key.endsWith('/sent'));
 assert(sent,filename+': falta pregunta de oraciones');
 assert.equal(sent.points,700,'Una oración debe aportar 1 punto');
 const stable=before.rows.filter(x=>x.key!==sent.key);
 await page.evaluate(()=>{
  const count=document.getElementById('count-sent');
  count.value='6';count.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForFunction(()=>window.ExaminaScoring.rows().find(x=>x.key.endsWith('/sent'))?.points===600);
 const after=await page.evaluate(()=>({total:window.ExaminaScoring.total(),rows:window.ExaminaScoring.rows()}));
 assert.equal(after.total,before.total-100,filename+': redistribución silenciosa del total');
 assert.deepEqual(after.rows.filter(x=>x.key!==sent.key),stable,filename+': se alteraron puntos de otra pregunta');
 // El profesor puede guardar, modificar y recuperar borradores incompletos.
 await page.evaluate(()=>{
  const input=[...document.querySelectorAll('#examScoring .exam-scoring-rows input[data-scoring-key]')]
   .find(x=>!x.disabled);
  if(!input)throw Error('No hay campo editable');
  window.__phaseSixKey=input.dataset.scoringKey;
  input.value='1,25';input.dispatchEvent(new Event('input',{bubbles:true}));
  document.getElementById('saveDraft').click();
 });
 const saved=await page.evaluate(()=>{
  const key=window.__phaseSixKey,draft=JSON.parse(localStorage.getItem('examina_draft_v14')||'null');
  return {key,score:draft?.scores?.[key],total:window.ExaminaScoring.total(),saved:!!draft};
 });
 assert(saved.saved&&saved.score===125,filename+': puntuación del borrador incompleta');
 await page.evaluate(()=>{
  const input=document.querySelector('#examScoring .exam-scoring-rows input[data-scoring-key="'+window.__phaseSixKey+'"]');
  input.value='3';input.dispatchEvent(new Event('input',{bubbles:true}));
  document.getElementById('restoreDraft').click();
 });
 await page.waitForFunction(()=>window.ExaminaScoring.snapshot()[window.__phaseSixKey]===125);
 assert.equal(await page.evaluate(()=>window.ExaminaScoring.total()),saved.total,
  filename+': puntuación del borrador perdida');
 const vals=await page.evaluate(()=>{
  const s=window.ExaminaScoring,check=document.getElementById('examFinalMode');
  check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
  return {preflight:s.preflight(),canExport:s.canExport(),total:s.total()};
 });
 assert.equal(vals.preflight.ok,vals.total===1000,filename+': no se exige el total exacto');
 assert.equal(vals.canExport,vals.preflight.ok,filename+': bloqueo incoherente');
 await page.evaluate(()=>{
  const s=window.ExaminaScoring,check=document.getElementById('examFinalMode');
  check.checked=false;check.dispatchEvent(new Event('change',{bubbles:true}));
  if(!s.canExport())throw Error('Se ha bloqueado el borrador');
 });
}
async function actualWord(page,filename){
 await form(page,'latin1','tablas','UD4');
 await page.evaluate(()=>{
  // Aislar la comprobación de puntuación de la revisión filológica, cubierta por
  // test-academic-evidence-browser.cjs, sin modificar el código de producción.
  if(window.ExaminaTeacherReview)window.ExaminaTeacherReview.evidenceMayExport=()=>true;
  window.__phaseSixDownloads=[];
  downloadBlob=(_name,blob)=>window.__phaseSixDownloads.push(blob);
 });
 const first=await page.evaluate(async()=>{
  document.getElementById('examFinalMode').checked=true;
  const score=window.ExaminaScoring;
  const row=[...document.querySelectorAll('#examScoring .exam-scoring-rows input[data-scoring-key]')]
    .find(x=>!x.disabled);
  if(!row)throw Error('No hay pregunta ajustable');
  const original=score.parse(row.value);
  row.value=score.format(original+25);row.dispatchEvent(new Event('input',{bubbles:true}));
  const invalid=score.preflight();
  document.getElementById('docx').click();
  const blocked=window.__phaseSixDownloads.length;
  row.value=score.format(original);row.dispatchEvent(new Event('input',{bubbles:true}));
  const corrected=score.preflight();
  document.getElementById('docx').click();
  return {invalid,blocked,corrected,downloaded:window.__phaseSixDownloads.length};
 });
 assert.equal(first.invalid.ok,false,filename+': definitivo mal puntuado permitido');
 assert.equal(first.blocked,0,filename+': se descargó DOCX con puntuación inválida');
 assert.equal(first.corrected.ok,true,filename+': no se recuperó el total exacto');
 assert.equal(first.downloaded,1,filename+': no se exportó DOCX corregido');
 const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await window.__phaseSixDownloads[0].arrayBuffer())));
 const doc=extract(Buffer.from(bytes),'word/document.xml');
 assert(doc.includes('<w:document')&&doc.includes('<w:sectPr'),filename+': DOCX mal formado');
}
async function run(browser,filename){
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(filename)).href,{waitUntil:'load'});
 await page.waitForFunction(()=>window.ExaminaScoring?.rows&&!!document.getElementById('saveDraft'));
 await policySweep(page,filename);
 await testPreservation(page,filename);
 await actualWord(page,filename);
 assert.deepEqual(errors,[],filename+': errores JavaScript');
 await context.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{for(const f of ['index.html','offline.html'])await run(browser,f)}
 finally{await browser.close()}
 console.log('Fase VI: puntuación exacta y estable, nueve modelos, borradores, bloqueo y DOCX en web y offline.');
})().catch(e=>{console.error(e);process.exitCode=1});
