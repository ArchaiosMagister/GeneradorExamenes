'use strict';
// Verificación real de importación, historial y tarjetas en Chromium offline.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
async function run(browser){
 const page=await browser.newPage({viewport:{width:1120,height:900},acceptDownloads:true});
 const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url())});
 page.on('dialog',d=>d.accept());
 try{
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.ExaminaTeacherReview?.reviewMergeBundle);
  await page.evaluate(()=>{
   const details=document.querySelector('#morphTeacherReview details');details.open=true;
   for(let el=details.parentElement;el;el=el.parentElement)
    if(el.tagName==='DETAILS')el.open=true;
  });
  await page.locator('#reviewSummary').filter({hasText:'incidencias detectadas'}).waitFor();
  await page.locator('#reviewCourse').selectOption('gr1');
  const target=await page.evaluate(async()=>{
   const data=await window.ExaminaOfflineLemmatizer.load();
   const cases=window.ExaminaTeacherReview.buildCases(data,'gr1');
   const items=cases.filter(x=>x.detail.includes('Registro grc-pending-'));
   if(items.length!==68)throw Error('Cola griega inconsistente: '+items.length);
   return items.find(x=>x.lemma==='πρωτοσ');
  });
  assert(target&&target.form);
  await page.locator('#reviewPending').uncheck();
  await page.locator('#reviewQuery').fill(target.form);
  const card=page.locator('#reviewItems .review-item').filter({hasText:target.form}).first();
  await card.waitFor();
  await card.locator('textarea').fill('Comparar el acento');
  await card.locator('textarea').press('Tab');
  await card.locator('select').selectOption('corregir');
  let item=await page.evaluate(id=>JSON.parse(localStorage.getItem('examina-morph-review-v1'))[id],target.id);
  assert.equal(item.decision,'corregir');
  assert.equal(item.note,'Comparar el acento');
  assert.equal(item.signature,await page.evaluate(x=>window.ExaminaTeacherReview.reviewSignature(x),target));
  const backup={schema:'examina-morph-teacher-review/v2',records:{
   [target.id]:{decision:'excluir',note:'Mantener fuera',entry:target.entry,
    updated:'2026-11-13T12:00:00Z',signature:item.signature}
  }};
  await page.locator('#reviewImportFile').setInputFiles({
   name:'revision-importacion.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(backup))
  });
  await page.locator('#reviewBackupStatus').filter({hasText:'Importación completada'}).waitFor();
  item=await page.evaluate(id=>JSON.parse(localStorage.getItem('examina-morph-review-v1'))[id],target.id);
  assert.equal(item.decision,'corregir','La importación sobrescribió un criterio local');
  assert.equal(item.alternatives.length,1);
  const history=card.locator('details');
  await history.locator('summary').click();
  await history.getByRole('button',{name:'Usar esta decisión'}).click();
  item=await page.evaluate(id=>JSON.parse(localStorage.getItem('examina-morph-review-v1'))[id],target.id);
  assert.equal(item.decision,'excluir');
  assert(item.alternatives.some(x=>x.decision==='corregir'));
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#reviewExport').click();
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'decisiones-revision-morfologica-v2.json');
  const before=JSON.stringify(item);
  await page.locator('#reviewImportFile').setInputFiles({
   name:'invalido.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({schema:'desconocido',records:{}}))
  });
  await page.locator('#reviewBackupStatus').filter({hasText:'Importación rechazada'}).waitFor();
  assert.equal(JSON.stringify(await page.evaluate(id=>
   JSON.parse(localStorage.getItem('examina-morph-review-v1'))[id],target.id)),before);
  await page.reload({waitUntil:'load'});
  const reloaded=await page.evaluate(id=>JSON.parse(localStorage.getItem('examina-morph-review-v1'))[id],target.id);
  assert.equal(reloaded.decision,'excluir','La revisión no se conservó entre sesiones');
  assert.equal(reloaded.alternatives.length,1);
  assert.deepEqual(errors,[],'Errores JavaScript durante conciliación');
  assert.deepEqual(requests,[],'La cola docente offline no debe usar la red');
  console.log('Cola docente Chromium: 68 tarjetas, importar, conservar conflictos, elegir alternativa, exportar y persistir offline.');
 }finally{await page.close()}
}
module.exports=run;
if(require.main===module){
 (async()=>{const b=await chromium.launch({headless:true});try{await run(b)}finally{await b.close()}})()
  .catch(e=>{console.error(e);process.exitCode=1});
}
