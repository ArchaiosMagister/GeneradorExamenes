'use strict';
// Regresión: no mostrar desgloses por elemento; puntos enteros automáticos,
// decimales manuales, fichas sin nota, Word, borradores y temas de sustantivos en -er.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

function zipEntry(bytes,wanted){
 let off=0;
 while(off+30<=bytes.length&&bytes.readUInt32LE(off)===0x04034b50){
  const len=bytes.readUInt32LE(off+18),n=bytes.readUInt16LE(off+26),extra=bytes.readUInt16LE(off+28);
  const name=bytes.toString('utf8',off+30,off+30+n),start=off+30+n+extra;
  if(name===wanted){assert.equal(bytes.readUInt16LE(off+8),0);return bytes.toString('utf8',start,start+len)}
  off=start+len;
 }
 throw Error('No se ha encontrado '+wanted);
}
async function configure(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const kind=document.getElementById('sheetType');kind.value='exam';
  const c=document.getElementById('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=document.getElementById('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  choices.forEach(x=>x.checked=units[Number(x.value)]===unit);
  choices.find(x=>x.checked)?.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  if(course==='greek1')greekExamState=null;
  generate();window.ExaminaScoring.sync();
 },{course,model,unit});
 await page.waitForFunction(()=>window.ExaminaScoring?.rows()?.length>0);
}
async function wordXml(page){
 const bytes=await page.evaluate(async()=>{
  if(window.ExaminaTeacherReview)window.ExaminaTeacherReview.evidenceMayExport=()=>true;
  const original=downloadBlob;let result;
  try{
   downloadBlob=(_name,blob)=>{result=blob};
   exportWord(false);
  }finally{downloadBlob=original}
  if(!result)throw Error('Exportación Word ausente');
  return Array.from(new Uint8Array(await result.arrayBuffer()));
 });
 return zipEntry(Buffer.from(bytes),'word/document.xml');
}
async function testIntegers(page,name){
 const cases=[
  ['latin1','tablas','UD7'],['latin1','morf','UD7'],['latin1','mixto','UD7'],
  ['latin4','tablas','UD7'],['latin4','morf','UD7'],['latin4','mixto','UD7'],
  ['greek1','complete','UD7'],['greek1','morphology','UD7'],['greek1','translation','UD7']
 ];
 for(const [course,model,unit] of cases){
  await configure(page,course,model,unit);
  const data=await page.evaluate(()=>{
   const s=window.ExaminaScoring;
   return {rows:s.rows(),total:s.total(),display:[...document.querySelectorAll('#paper [data-exam-subscore]')].length,
    subFields:[...document.querySelectorAll('#examScoring [data-subscore-key]')].length,
    breakdowns:document.querySelectorAll('.exam-subscore-details').length,
    scoreNodes:document.querySelectorAll('#paper .exam-question-points').length};
  });
  assert(data.rows.length>0,name+' '+course+'/'+model+': no hay preguntas');
  assert(data.rows.every(x=>x.points%100===0),
   name+' '+course+'/'+model+': puntuación automática con decimales '+JSON.stringify(data.rows));
  if(['morf','morphology'].includes(model))
   assert(data.rows.every(x=>x.points===100),name+' '+course+'/'+model+': morfología no tiene 1 p. por pregunta '+JSON.stringify(data.rows));
  assert.equal(data.display,0,name+': hay subpuntos en la vista previa');
  assert.equal(data.subFields,0,name+': hay editores de subpuntos');
  assert.equal(data.breakdowns,0,name+': hay acordeones de desgloses');
  assert.equal(data.scoreNodes,data.rows.length,name+': deben permanecer solo las notas por pregunta');
 }
}
async function testManualAndReview(page,name){
 await configure(page,'latin1','tablas','UD7');
 const input=page.locator('#examScoring .exam-scoring-row input[data-scoring-key]:not([disabled])').first();
 assert(await input.count(),name+': no hay puntuación de pregunta editable');
 await input.fill('1,25');
 const edited=await page.evaluate(()=>{
  const s=window.ExaminaScoring,el=document.querySelector('#examScoring .exam-scoring-row input[data-scoring-key]:not([disabled])');
  const row=s.rows().find(r=>r.key===el.dataset.scoringKey);
  return {row,text:document.querySelector('#paper [data-scoring-key="'+el.dataset.scoringKey+'"].exam-question-points')?.textContent||''};
 });
 assert.equal(edited.row.points,125,name+': decimal manual redondeado');
 assert.match(edited.text,/1,25p\./,name+': decimal manual no sincronizado con vista previa');
 await page.evaluate(()=>document.getElementById('saveDraft').click());
 const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem('examina_draft_v14')).scores[key],edited.row.key);
 assert.equal(stored,125,name+': decimal manual ausente de borrador');
 // No se generan nuevas cifras en el desglose histórico al editar la nota global.
 assert.equal(await page.locator('#paper [data-exam-subscore]').count(),0);

 await page.evaluate(()=>{
  const kind=document.getElementById('sheetType');
  kind.value='review';kind.dispatchEvent(new Event('change',{bubbles:true}));
  window.ExaminaScoring.sync();
 });
 const review=await page.evaluate(()=>{
  const q=[...document.querySelectorAll('#paper .exam-question')];
  const s=window.ExaminaScoring;
  const checkbox=document.getElementById('examFinalMode');checkbox.checked=true;
  return {kind:s.isReview(),q:q.length,texts:q.map(el=>el.textContent),pts:document.querySelectorAll('#paper .exam-question-points').length,
   breakdown:document.querySelectorAll('#paper [data-exam-subscore]').length,
   menu:document.querySelectorAll('#examQuestionMenus .exam-question-score-row').length,
   main:document.getElementById('examScoring').getBoundingClientRect().height,
   preflight:s.preflight(),canExport:s.canExport(),
   wordQuestion:q[0]?wordExamParagraph(q[0]):''};
 });
 assert(review.kind&&review.q>0,name+': ficha de repaso no activada');
 assert.equal(review.pts,0,name+': se muestra puntuación en la ficha');
 assert.equal(review.breakdown,0,name+': hay subpuntos en la ficha');
 assert.equal(review.menu,0,name+': hay campos de nota en el menú de la ficha');
 assert.equal(review.main,0,name+': panel de puntuación visible en la ficha');
 assert(review.texts.every(s=>!/\(\s*\d+(?:[,.]\d+)?\s*p\.?\s*\)/i.test(s)),
  name+': enunciado de ficha con puntuación');
 assert.equal(review.preflight.mode,'repaso',name+': validación de examen en ficha');
 assert(review.preflight.ok&&review.canExport,name+': exportación de ficha bloqueada');
 assert(!/1,25p\.|2p\.\)/.test(review.wordQuestion),name+': puntuación de ficha en XML de párrafo');
 const xml=await wordXml(page);
 assert(xml.includes('Ficha')||xml.includes('Fitxa'),name+': Word no conserva cabecera de ficha');

 await page.evaluate(()=>document.getElementById('saveDraft').click());
 await page.evaluate(()=>{
  const kind=document.getElementById('sheetType');
  kind.value='exam';kind.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('restoreDraft').click();
 });
 await page.waitForFunction(()=>window.ExaminaScoring.isReview()&&
  !document.querySelector('#paper .exam-question-points'));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_draft_v14')).sheetType),'review',
  name+': ficha no persiste como tal en el borrador');
}
async function testLatinEr(page,name){
 await configure(page,'latin4','morf','UD3');
 const result=await page.evaluate(()=>{
  const forms=entry=>mNoun(entry)?.forms.flat();
  const actual=latinExamFormCandidates(['UD3'],true).flat()
   .filter(x=>x.category==='nouns'&&normLex(headLex(x.entry))==='magister').map(x=>x.form);
  return {magister:forms('măgīstĕr, –tri'),magisterPlain:forms('magister, -tri'),
   magisterFull:forms('magister, magistri'),liber:forms('liber, –bri'),
   ager:forms('ager, –gri'),puer:forms('puer, –i'),actual};
 });
 const expected={magister:['magister','magistri','magistrum','magistrorum','magistris'],
  magisterPlain:['magister','magistri','magistrum'],
  magisterFull:['magister','magistri','magistrum'],
  liber:['liber','libri','librum'],ager:['ager','agri','agrum'],
  puer:['puer','pueri','puerum']};
 for(const [key,wanted] of Object.entries(expected)){
  assert(result[key],name+': sustantivo -er no reconocido '+key);
  for(const form of wanted)assert(result[key].includes(form),name+': falta '+form+' en '+key);
  assert(!result[key].some(x=>/^(?:tri|trum|bri|brum|gri|grum)$/.test(x)),
   name+': fragmento del genitivo usado como palabra en '+key);
 }
 assert(result.actual.includes('magistri')&&result.actual.includes('magistrum'),
  name+': el banco de morfología de 4.º no ofrece formas completas de magister');
 assert(!result.actual.some(x=>/^(tri|trum)$/.test(x)),
  name+': siguen existiendo formas espurias de magister en 4.º');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage();
   page.on('dialog',d=>d.accept());
   await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.ExaminaScoring,{timeout:25000});
   await testIntegers(page,file);
   await testManualAndReview(page,file);
   await testLatinEr(page,file);
   await page.close();
   console.log('OK: puntos enteros, ficha sin nota/Word, decimales manuales y magister en '+file);
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
