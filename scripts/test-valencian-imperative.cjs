'use strict';
/* Valenciano verbal en Latín de 4.º: vista previa, control de pregunta, Word y archivo autónomo. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const translations=fs.readFileSync(path.join(root,'lexicon-valenciano.js'),'utf8');
const scoring=fs.readFileSync(path.join(root,'exam-scoring.js'),'utf8');
const rawOld=/[Tt]radueix/g;
assert(!rawOld.test(index),'No debe quedar un imperativo catalán oriental en el generador valenciano');
assert(!rawOld.test(translations),'No debe quedar tradueix en las glosas valencianas');
for(const phrase of [
 'Analitza i traduïx les oracions següents.',
 'Traduïx les oracions següents',
 'Lèxic: traduïx al valencià'
]) assert(index.includes(phrase),'Enunciado valenciano no actualizado: '+phrase);
assert(translations.includes('"Analiza y traduce las siguientes oraciones": "Analitza i traduïx les oracions següents"'));
assert(translations.includes('"Traduce las siguientes oraciones": "Traduïx les oracions següents"'));
assert(scoring.includes('tradueix les|traduix les'),
 'El clasificador de puntuaciones debe reconocer la nueva forma después de normalizar la diéresis');
assert(index.includes('Analiza y traduce las siguientes oraciones.'),
 'No se puede cambiar la versión castellana');

function zipEntry(bytes,wanted){
 let off=0;
 while(off+30<=bytes.length&&bytes.readUInt32LE(off)===0x04034b50){
  const len=bytes.readUInt32LE(off+18),n=bytes.readUInt16LE(off+26),extra=bytes.readUInt16LE(off+28);
  const name=bytes.toString('utf8',off+30,off+30+n),start=off+30+n+extra;
  if(name===wanted){
   assert.equal(bytes.readUInt16LE(off+8),0,'Compresión Word inesperada');
   return bytes.toString('utf8',start,start+len);
  }
  off=start+len;
 }
 throw Error('No se encontró '+wanted);
}
async function choose(page,language){
 return page.evaluate(lang=>{
  const set=(id,value)=>{
   const el=document.getElementById(id);
   if(!el)throw Error('Selector no localizado: '+id);
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  set('course','latin4');
  set('model','tablas');
  set('lang',lang);
  const unit=[...document.querySelectorAll('#unitChoices .unit-choice')]
    .find(el=>units[Number(el.value)]==='UD4');
  if(!unit)throw Error('Falta la UD4 de Latín de 4.º');
  document.querySelectorAll('#unitChoices .unit-choice').forEach(el=>{el.checked=el===unit});
  unit.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  generate();
  window.ExaminaScoring?.sync?.();
  const paper=document.getElementById('paper');
  const questions=[...paper.querySelectorAll('.exam-question')];
  const sentence=questions.find(el=>el.dataset.examKind==='sent'||
    /oraciones|oracions/i.test(el.textContent));
  if(!sentence)throw Error('No se generó la pregunta de oraciones de Latín 4.º');
  const prompt=sentence.textContent.trim();
  const scoringRows=window.ExaminaScoring?.rows()?.length||0;
  return {prompt,lang:document.documentElement.lang,questions:questions.length,
   scoringRows,paper:paper.textContent};
 },language);
}
async function word(page){
 const value=await page.evaluate(async()=>{
  const original=downloadBlob;
  let name,blob;
  const guard=window.ExaminaTeacherReview;
  const old=guard?.evidenceMayExport;
  try{
   if(guard)guard.evidenceMayExport=()=>true;
   downloadBlob=(filename,data)=>{name=filename;blob=data};
   exportWord(false);
  }finally{
   downloadBlob=original;
   if(guard)guard.evidenceMayExport=old;
  }
  if(!blob)throw Error('La exportación Word de Latín 4.º no creó ningún DOCX');
  return {name,bytes:Array.from(new Uint8Array(await blob.arrayBuffer()))};
 });
 assert.match(value.name,/\.docx$/);
 return zipEntry(Buffer.from(value.bytes),'word/document.xml')
  .replace(/<[^>]*>/g,'').replaceAll('&amp;','&');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1140,height:820}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(pathToFileURL(path.join(root,filename)).href,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ExaminaScoring?.rows);
    const val=await choose(page,'va');
    assert.equal(val.lang,'ca-valencia',filename+': idioma incorrecto');
    assert.match(val.prompt,/Analitza i traduïx les oracions següents/,filename+': pregunta valenciana incorrecta');
    assert(!val.paper.includes('tradueix')&&!val.paper.includes('Tradueix'),
     filename+': se filtró una variante no valenciana al examen');
    assert.equal(val.questions,val.scoringRows,filename+': el cambio altera el reconocimiento de las preguntas');
    const valXml=await word(page);
    assert(valXml.includes('traduïx'),filename+': Word no utiliza el imperativo valenciano');
    assert(!valXml.includes('tradueix')&&!valXml.includes('Tradueix'),
     filename+': Word conserva el imperativo anterior');
    const esp=await choose(page,'es');
    assert.match(esp.prompt,/Analiza y traduce las siguientes oraciones/,filename+': castellano alterado');
    assert.equal(esp.questions,esp.scoringRows,filename+': el cambio afecta la puntuación castellana');
    const esXml=await word(page);
    assert(esXml.includes('traduce'),filename+': Word castellano alterado');
    assert(!esXml.includes('traduïx'),filename+': Word mezcla las dos lenguas');
    assert.deepEqual(errors,[],filename+': fallo de JavaScript tras cambiar de idioma');
   }finally{await page.close()}
  }
  console.log('Latín 4.º: Traduïx/Analitza i traduïx, puntuación, Word ES/VA e index/offline correctos.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
