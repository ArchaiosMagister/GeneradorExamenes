'use strict';
// Regresión docente: enunciados (sin soluciones) del cambio de número griego.
// Web / offline, ES / VA, UD3 / UD5, regeneración, controles y Word / PDF.
// La batería comprueba únicamente enunciados, sin facilitar la solución.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
function entry(bytes,name){
 let i=0;
 while(bytes.readUInt32LE(i)===0x04034b50){
  const filenameLength=bytes.readUInt16LE(i+26),extra=bytes.readUInt16LE(i+28);
  const length=bytes.readUInt32LE(i+18),from=i+30+filenameLength+extra;
  if(bytes.toString('utf8',i+30,i+30+filenameLength)===name)return bytes.toString('utf8',from,from+length);
  i=from+length;
 }
 throw Error('No se encuentra '+name);
}
async function configure(page,unit,lang,model='complete'){
 await page.evaluate(({unit,lang,model})=>{
  const change=(id,value)=>{const x=$(id);x.value=value;x.dispatchEvent(new Event('change',{bubbles:true}))};
  change('course','greek1');change('model',model);change('lang',lang);
  const selected=[...document.querySelectorAll('.unit-choice')]
   .find(x=>units[Number(x.value)]==='UD'+unit);
  if(!selected)throw Error('UD'+unit+' ausente');
  document.querySelectorAll('.unit-choice').forEach(x=>{x.checked=x===selected});
  selected.dispatchEvent(new Event('change',{bubbles:true}));
  $('autoGloss').checked=true;$('autoGloss').dispatchEvent(new Event('change',{bubbles:true}));
  generate();
 },{unit,lang,model});
}
async function audit(page,lang,unit){
 return page.evaluate(({lang,unit})=>{
  const chosen=ExaminaGreekNumber.current();
  const host=document.querySelector('#examSentenceGlossary');
  const terms=[...host?.querySelectorAll('.gloss-item')||[]].map(x=>x.textContent.trim());
  const added=[...host?.querySelectorAll('[data-greek-number-entry]')||[]].map(x=>x.textContent.trim());
  const heading=host?.querySelector('p[data-greek-number-glossary]');
  const pdf=ExaminaPdfExport.prepareDocument();
  const sources=chosen.map(x=>greekVerifiedCorpus.find(noun=>noun.id===x.source)).filter(Boolean);
  const expectedNouns=[...new Set(sources.map(greekNominalEnunciation))];
  return {
   chosen:chosen.map(x=>({id:x.id,source:x.source,prompt:x.prompt,answer:x.answer,adjective:x.adjective,pronoun:x.pronoun})),
   title:host?.querySelector('.exam-gloss-title')?.textContent.trim(),
   numberTitle:heading?.querySelector('strong')?.textContent,
   headingBeforeEntries:heading?.nextElementSibling?.firstElementChild?.hasAttribute('data-greek-number-entry'),
   pdfNumberTitle:pdf.querySelector('p[data-greek-number-glossary] strong')?.textContent,
   terms,added,legacy:!!document.querySelector('#greekNumberGlossary'),expectedNouns,selectedGroup:!!document.querySelector('.greek-choice-option[data-greek-option="change-number"]'),
   className:host?.className||'',contenteditable:host?.getAttribute('contenteditable'),
   pdf:!!pdf.querySelector('#examSentenceGlossary .final-gloss .gloss-item'),
   unit,lang,
  };
 },{lang,unit});
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])for(const lang of ['es','va']){
   const page=await browser.newPage({viewport:{width:1380,height:940},acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
   const numberTitle=lang==='va'?'Paraules per al canvi de nombre':'Palabras para cambio de número';
   for(const unit of [3,5]){
    await configure(page,unit,lang);
    const start=await audit(page,lang,unit);
    assert(start.selectedGroup,'No aparece la actividad de cambio de número');
    assert(start.terms.length>0,'Glosario vacío con actividad elegida');
    assert(start.title.includes(lang==='va'?'Vocabulari':'Vocabulario'),'No se unifica en el vocabulario de oraciones');
    assert.equal(start.legacy,false,'Persistió el glosario independiente');
    assert(start.added.length>0,'No se añadieron los enunciados de cambio de número al glosario central');
    assert.equal(start.numberTitle,numberTitle);
    assert.equal(start.headingBeforeEntries,true);
    assert.equal(start.pdfNumberTitle,numberTitle);
    for(const entry of start.expectedNouns)assert(start.terms.includes(entry),'Falta enunciado nominal '+entry);
    for(const row of start.chosen){
     assert(!start.terms.includes(row.answer),'El glosario ofrece por error la respuesta '+row.answer);
    }
    assert.equal(start.pdf,true,'El PDF no incluye el glosario');
    assert.equal(start.contenteditable,'false','El glosario debe regenerarse desde las preguntas');
    if(unit===3)assert(start.chosen.every(x=>!x.adjective&&!x.pronoun),'UD3 incluye contenidos posteriores');
    await page.evaluate(()=>ExaminaGreekChoiceGroups.replaceGenerated('change-number',0));
    const regenerated=await audit(page,lang,unit);
    assert.equal(await page.locator('p[data-greek-number-glossary]').count(),1);
    assert(regenerated.terms.length>0,'Regenerar perdió los lemas');
    for(const entry of regenerated.expectedNouns)assert(regenerated.terms.includes(entry),'El glosario no actualiza '+entry);
    await page.evaluate(()=>{$('autoGloss').checked=false;$('autoGloss').dispatchEvent(new Event('change',{bubbles:true}))});
    assert.equal(await page.locator('[data-greek-number-glossary]').count(),0);
    assert.equal(await page.locator('[data-greek-number-entry]').count(),0,'Desmarcar glosario no oculta los enunciados');
    await page.evaluate(()=>{$('autoGloss').checked=true;$('autoGloss').dispatchEvent(new Event('change',{bubbles:true}))});
    assert(await page.locator('[data-greek-number-entry]').count(),'Reactivar glosario no restaura los lemas');
   }
   const bytes=Buffer.from(await page.evaluate(async()=>{
    const original=downloadBlob;let blob;
    try{downloadBlob=(_name,value)=>blob=value;exportWord(false)}finally{downloadBlob=original}
    if(!blob)throw Error('Word no generado');
    return [...new Uint8Array(await blob.arrayBuffer())];
   }));
   const xml=entry(bytes,'word/document.xml');
   assert(xml.includes(lang==='va'?'Vocabulari':'Vocabulario')&&xml.includes('ὁ, ἡ, τό'),
    'El Word omite los enunciados del glosario central');
   assert(xml.includes('<w:b/></w:rPr><w:t xml:space="preserve">'+numberTitle+'</w:t>'),
    'El Word omite el subtítulo en negrita');
   // El modelo de morfología no debe recibir la ampliación del examen completo.
   await configure(page,5,lang,'morphology');
   assert.equal(await page.locator('[data-greek-number-entry]').count(),0,
    'El glosario de cambio de número invade la morfología parcial');
   assert.deepEqual(errors,[],file+'/'+lang+': errores JS');
   console.log('NUMBER_GLOSSARY '+JSON.stringify({file,lang,word:true,pdf:true,units:[3,5]}));
   await page.close();
  }
  console.log('PASS: enunciados solo del cambio de número, sin soluciones, ESP/VAL, Word/PDF, web/offline, regeneración y control de glosario.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
