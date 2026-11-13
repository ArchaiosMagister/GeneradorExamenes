'use strict';
// Fase III: 1 p. por oración, 10 puntos, huecos estables, borradores y DOCX.
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent((req.url||'/').split('?')[0]).replace(/^\/+/, '')||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(error,bytes)=>{
  if(error){res.writeHead(404).end();return}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript');
  res.end(bytes);
 });
});
function storedEntry(bytes,wanted){
 let pos=0;
 while(pos+30<=bytes.length&&bytes.readUInt32LE(pos)===0x04034b50){
  const method=bytes.readUInt16LE(pos+8),size=bytes.readUInt32LE(pos+18);
  const nameLength=bytes.readUInt16LE(pos+26),extraLength=bytes.readUInt16LE(pos+28);
  const name=bytes.toString('utf8',pos+30,pos+30+nameLength);
  const start=pos+30+nameLength+extraLength;
  assert(start+size<=bytes.length,'ZIP truncado: '+name);
  if(name===wanted){assert.equal(method,0);return bytes.toString('utf8',start,start+size)}
  pos=start+size;
 }
 throw Error('Falta el documento Word: '+wanted);
}
async function select(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=$('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=$('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>
   x.checked=units[Number(x.value)]===unit);
  const count=$('count-sent');count.value=['mixto','translation'].includes(model)?'7':'5';
  greekExamState=null;
  examSelectionCache.clear();
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>window.ExaminaScoring?.rows().some(x=>x.key.endsWith('/sent'))===true);
}
async function report(page){
 return await page.evaluate(()=>{
  const rows=window.ExaminaScoring.rows(),sent=rows.find(x=>x.key.endsWith('/sent'));
  const slots=[...$('paper').querySelectorAll('.exam-sentences [data-sentence-slot]')];
  const input=[...document.querySelectorAll('#examScoring .exam-scoring-rows input[data-scoring-key]')]
   .find(x=>x.dataset.scoringKey===sent?.key);
  return {total:window.ExaminaScoring.total(),sentCents:sent?.points,
   slots:slots.length,indices:slots.map(x=>Number(x.dataset.sentenceSlot)),
   disabled:input?.disabled,pointText:sent&&[...document.querySelectorAll('.exam-question-points')]
    .find(x=>x.dataset.scoringKey===sent.key)?.textContent};
 });
}
async function run(browser,file){
 const context=await browser.newContext({viewport:{width:1450,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+file,{waitUntil:'load'});
 await page.waitForFunction(()=>!!window.ExaminaScoring?.preflight&&!!document.getElementById('examFinalMode'));
 const cases=[
  ['latin1','tablas','UD7',5],
  ['latin1','mixto','UD7',7],
  ['latin4','tablas','UD7',5],
  ['greek1','complete','UD12',5],
  ['greek1','translation','UD12',7]
 ];
 for(const [course,model,unit,count] of cases){
  await select(page,course,model,unit);
  const r=await report(page);
  assert.equal(r.slots,count,file+'/'+course+'/'+model+': huecos');
  assert.equal(r.sentCents,count*100,file+'/'+course+'/'+model+': 1p. por oración '+JSON.stringify(r));
  assert.equal(r.total,1000,file+'/'+course+'/'+model+': total 10 '+JSON.stringify(r));
  assert.equal(r.disabled,true,file+'/'+course+'/'+model+': valor fijo');
  assert.deepEqual(r.indices,Array.from({length:count},(_,i)=>i),
   file+'/'+course+'/'+model+': posiciones');
 }
 await select(page,'latin1','mixto','UD7');
 await page.evaluate(()=>{
  const count=$('count-sent');count.value='6';count.dispatchEvent(new Event('change',{bubbles:true}));
 });
 let r=await report(page);
 assert.equal(r.total,1000,file+': no se redistribuyeron los puntos tras cambiar a seis oraciones');
 assert.equal(r.sentCents,600,file+': seis oraciones no suman 6 p.');
 await page.evaluate(()=>{
  const t=$('newSentences');t.value='Puella amat.\n\nNauta navigat.';
  t.dispatchEvent(new Event('input',{bubbles:true}));
  $('saveDraft').click();
  const count=$('count-sent');count.value='3';count.dispatchEvent(new Event('change',{bubbles:true}));
  // El restaurador pertenece al módulo de borradores y se invoca desde su botón público.
  document.getElementById('restoreDraft').click();
 });
 const restored=await page.evaluate(()=>{
  const saved=JSON.parse(localStorage.getItem('examina_draft_v14'));
  return {savedCount:saved.sentenceCount,control:$('count-sent').value,
   slots:[...$('paper').querySelectorAll('[data-sentence-slot]')].map(x=>x.textContent),
   editor:$('newSentences').value.split('\n')};
 });
 assert.equal(restored.savedCount,6,file+': el borrador omite la cantidad');
 assert.equal(restored.control,'6',file+': el selector no restaura la cantidad');
 assert.deepEqual(restored.slots,['Puella amat.','','Nauta navigat.','','',''],
  file+': se perdieron huecos intermedios o finales');
 assert.deepEqual(restored.editor,restored.slots,file+': edición no sincronizada después de restaurar');
 r=await report(page);
 assert.equal(r.sentCents,600,file+': puntuación de oraciones incorrecta tras restaurar');
 const savedXml=await page.evaluate(async()=>{
  let output=null;const original=downloadBlob;
  try{downloadBlob=(_filename,bytes)=>{output=bytes};exportWord(false)}
  finally{downloadBlob=original}
  if(!output)throw Error('Exportación Word no generada');
  return Array.from(new Uint8Array(await output.arrayBuffer()));
 });
 const word=storedEntry(Buffer.from(savedXml),'word/document.xml');
 assert(word.includes('Puella amat.')&&word.includes('Nauta navigat.'),
  file+': el Word no reproduce las oraciones');
 assert(word.includes('f.'),file+': el Word no conserva el sexto hueco');
 await page.evaluate(()=>{
  const control=$('count-sent');control.value='9';control.dispatchEvent(new Event('change',{bubbles:true}));
  const final=$('examFinalMode');final.checked=true;final.dispatchEvent(new Event('change',{bubbles:true}));
 });
 const excessive=await page.evaluate(()=>window.ExaminaScoring.preflight());
 assert.equal(excessive.ok,false,file+': 9 oraciones + léxico obligatorio supera 10 y no debe aprobarse');
 assert.equal(excessive.total>1000,true,file+': la puntuación imposible se ocultó');
 assert.deepEqual(errors,[],file+': errores JavaScript');
 await context.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  await run(browser,'index.html');
  await run(browser,'offline.html');
  console.log('FASE III: huecos/borradores/DOCX y 1p. por oración, total de 10 y bloqueo de excesos (web/offline) OK');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
