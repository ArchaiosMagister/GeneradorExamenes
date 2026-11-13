'use strict';
// Auditoría de integración fase III: operaciones combinadas, no solo casos aislados.
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((request,response)=>{
 const name=decodeURIComponent((request.url||'/').split('?')[0]).replace(/^\/+/, '')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(file,(error,bytes)=>{
  if(error){response.writeHead(404).end();return}
  response.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript');
  response.end(bytes);
 });
});
function zipEntry(bytes,wanted){
 let pos=0;
 while(pos+30<=bytes.length&&bytes.readUInt32LE(pos)===0x04034b50){
  const size=bytes.readUInt32LE(pos+18),nameLength=bytes.readUInt16LE(pos+26);
  const extraLength=bytes.readUInt16LE(pos+28);
  const name=bytes.toString('utf8',pos+30,pos+30+nameLength);
  const start=pos+30+nameLength+extraLength;
  assert(start+size<=bytes.length,'DOCX truncado: '+name);
  if(name===wanted){
   assert.equal(bytes.readUInt16LE(pos+8),0,'Compresión inesperada: '+name);
   return bytes.toString('utf8',start,start+size);
  }
  pos=start+size;
 }
 throw Error('No aparece '+wanted+' en el Word');
}
async function select(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=$('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=$('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>
   x.checked=units[Number(x.value)]===unit);
  examSelectionCache.clear();if(course==='greek1')greekExamState=null;
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>window.ExaminaScoring?.rows().some(x=>x.key.endsWith('/sent'))===true);
}
async function auditLatin(page,file){
 await select(page,'latin1','tablas','UD9–10');
 const r=await page.evaluate(()=>{
  const paper=$('paper'),original=paper.querySelector('.exam-sheet');
  const header=original.querySelector('.exam-header');
  const sentences=original.querySelector('.exam-sentences');
  const key=original.querySelector('#answerkey');
  const forms=original.querySelector('.exam-question[data-exam-kind="forms"]');
  const prefix=original.querySelector('.lex-subquestion[data-lex-kind="prefixes"]');
  const phonetic=original.querySelector('.lex-subquestion[data-lex-kind="phonetics"]');
  if(!header||!sentences||!forms||!prefix||!phonetic||!key)throw Error('Faltan apartados de Latín I');
  header.append(' AUDITORIA-DOCENTE');
  const editor=$('newSentences');editor.value='Puella amat.\n\nNauta navigat.';
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  const slot=original.querySelector('[data-sentence-slot="0"]');
  const other=original.querySelector('.exam-question[data-exam-kind="verb"]');
  other?.append(' AUDITORIA-VERBOS');
  regenerateExamQuestion('forms');
  const afterForms=paper.querySelector('.exam-sheet');
  const changeForms=afterForms.querySelector('.exam-question[data-exam-kind="forms"]')!==forms;
  const unchangedAfterForms=afterForms===original&&afterForms.querySelector('.exam-header')===header&&
   afterForms.querySelector('.exam-sentences')===sentences&&afterForms.querySelector('#answerkey')===key;
  const prefixOk=regenerateLatinLexPart('prefixes');
  const afterLex=paper.querySelector('.exam-sheet');
  const lexicalStable=afterLex===original&&afterLex.contains(slot)&&afterLex.contains(other)&&
   afterLex.querySelector('.lex-subquestion[data-lex-kind="prefixes"]')!==prefix;
  const control=[...document.querySelectorAll('[data-lat1-phonetic-norms] input[data-phonetic-code]')]
   .find(input=>{
    if(input.disabled||!input.checked)return false;
    selectedPhoneticRules.delete(input.value);
    const n=new Set(latinLexPool('latin1','phonetics',selectedUnits()).map(latinLexTermKey)).size;
    selectedPhoneticRules.add(input.value);
    return n>=4;
   });
  if(!control)throw Error('No hay norma fonética compatible para la auditoría conjunta');
  control.checked=false;control.dispatchEvent(new Event('change',{bubbles:true}));
  const afterFilter=paper.querySelector('.exam-sheet');
  const filterStable=afterFilter===original&&afterFilter.contains(slot)&&afterFilter.contains(key)&&
   afterFilter.querySelector('.lex-subquestion[data-lex-kind="phonetics"]')!==phonetic;
  const textPreserved=header.textContent.includes('AUDITORIA-DOCENTE')&&
   other.textContent.includes('AUDITORIA-VERBOS')&&
   slot.textContent==='Puella amat.'&&
   [...original.querySelectorAll('[data-sentence-slot]')].map(x=>x.textContent)[2]==='Nauta navigat.';
  const preflight=window.ExaminaScoring.preflight();
  $('saveDraft').click();
  const saved=JSON.parse(localStorage.getItem('examina_draft_v14')||'null');
  $('count-sent').value='3';$('count-sent').dispatchEvent(new Event('change',{bubbles:true}));
  $('restoreDraft').click();
  const restored=paper.querySelector('.exam-sheet');
  const values=[...restored.querySelectorAll('[data-sentence-slot]')].map(x=>x.textContent);
  return {
   changeForms,unchangedAfterForms,prefixOk,lexicalStable,filterStable,textPreserved,
   initialPoints:preflight.total,savedCount:saved?.sentenceCount,
   restoredCount:Number($('count-sent').value),restoredValues:values,
   restoredHeader:restored.textContent.includes('AUDITORIA-DOCENTE'),
   restoredOther:restored.textContent.includes('AUDITORIA-VERBOS'),
   preservedPoints:window.ExaminaScoring.total()
  };
 });
 for(const k of ['changeForms','unchangedAfterForms','prefixOk','lexicalStable','filterStable',
  'textPreserved','restoredHeader','restoredOther'])assert.equal(r[k],true,file+'/Latín '+k+': '+JSON.stringify(r));
 assert.equal(r.initialPoints,1000,file+': se perdieron los 10 puntos tras regeneraciones');
 assert.equal(r.preservedPoints,1000,file+': la restauración cambió la puntuación');
 assert.equal(r.savedCount,5);
 assert.equal(r.restoredCount,5);
 assert.deepEqual(r.restoredValues,['Puella amat.','','Nauta navigat.','',''],
  file+': el borrador ha desplazado oraciones');
 const exported=await page.evaluate(async()=>{
  const original=downloadBlob;let blob;
  try{downloadBlob=(_name,value)=>{blob=value};exportWord(false)}
  finally{downloadBlob=original}
  if(!blob)throw Error('No se ha exportado el examen latino');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
 });
 const word=zipEntry(Buffer.from(exported),'word/document.xml');
 assert(word.includes('Puella amat.')&&word.includes('Nauta navigat.'),
  file+': Word no conserva las oraciones tras el ciclo de regeneraciones y borradores');
}
async function auditGreek(page,file){
 await select(page,'greek1','complete','UD12');
 const r=await page.evaluate(()=>{
  const paper=$('paper'),original=paper.querySelector('.exam-sheet');
  const key=original.querySelector('#answerkey');
  const header=original.querySelector('.exam-header');
  const sentences=original.querySelector('.exam-sentences');
  const other=original.querySelector('.exam-question[data-greek-kind="forms"]');
  const etym=original.querySelector('.exam-question[data-greek-kind="etymology"]');
  if(!key||!header||!sentences||!etym||!other)throw Error('Faltan apartados de Griego I');
  header.append(' ΕΛΕΓΧΟΣ');
  other.append(' DOCENTE-GRIEGO');
  const editor=$('newSentences');editor.value='ὁ ἄνθρωπος λέγει.\n\nὁ δοῦλος γράφει.';
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  const sentence=original.querySelector('[data-sentence-slot="0"]');
  const success=greekRegenerate('etymology');
  const after=paper.querySelector('.exam-sheet');
  const values=[...after.querySelectorAll('[data-sentence-slot]')].map(x=>x.textContent);
  return {success,sameRoot:after===original,sameKey:after.querySelector('#answerkey')===key,
   sameHeader:after.querySelector('.exam-header')===header,
   sameSentences:after.querySelector('.exam-sentences')===sentences,
   sameOther:after.contains(other),sameSentence:after.contains(sentence),
   changedEtym:after.querySelector('.exam-question[data-greek-kind="etymology"]')!==etym,
   headerMark:after.textContent.includes('ΕΛΕΓΧΟΣ'),otherMark:after.textContent.includes('DOCENTE-GRIEGO'),
   values,points:window.ExaminaScoring.total()};
 });
 for(const k of ['success','sameRoot','sameKey','sameHeader','sameSentences','sameOther',
  'sameSentence','changedEtym','headerMark','otherMark'])assert.equal(r[k],true,file+'/Griego '+k+': '+JSON.stringify(r));
 assert.equal(r.points,1000,file+': puntuación de Griego tras regenerar etimología');
 assert.deepEqual(r.values.slice(0,3),['ὁ ἄνθρωπος λέγει.','','ὁ δοῦλος γράφει.']);
}
async function run(browser,filename){
 const context=await browser.newContext({viewport:{width:1450,height:920}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
 await page.waitForFunction(()=>window.ExaminaTeacherLexBankReady===true&&!!window.ExaminaScoring?.preflight,
  null,{timeout:25000});
 await auditLatin(page,filename);
 await auditGreek(page,filename);
 assert.deepEqual(errors,[],filename+': errores Javascript combinando operaciones');
 await context.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  await run(browser,'index.html');
  await run(browser,'offline.html');
  console.log('FASE III INTEGRADA OK: edición, regeneración, reglas, borradores, puntuación y Word; Latín/Griego, web/offline.');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});