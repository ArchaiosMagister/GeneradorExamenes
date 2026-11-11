const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:800}});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',r=>{if(/^https?:/i.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.locator('#greekDiscrepancyReview').waitFor({state:'attached'});
  await page.locator('#offlineLemmaPanel').evaluate(el=>{const details=el.closest('details');if(details)details.open=true;});
  await page.locator('#greekDiscrepancyReview > details').evaluate(el=>el.open=true);
  await page.locator('#grReviewStatus').filter({hasText:'formas con discrepancias'}).waitFor();
  assert.ok(await page.locator('#grReviewCard .greek-review-option').count()>1,
   'Una tarjeta debe ofrecer análisis alternativos');
  const first=await page.locator('#grReviewCard h3').textContent();
  await page.locator('#grReviewCard .greek-review-option').first().click();
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina-greek-discrepancy-v1')));
  assert.ok(Object.values(persisted).some(x=>x.action==='choose'&&x.selected),'La elección debe persistir');
  assert.notEqual(await page.locator('#grReviewCard h3').textContent(),first,
   'Tras elegir una alternativa debe mostrarse la siguiente tarjeta');
  await page.locator('#grReviewUndo').click();
  assert.equal(await page.locator('#grReviewCard h3').textContent(),first,
   'Deshacer debe devolver la tarjeta original');
  assert.equal(Object.keys(await page.evaluate(()=>JSON.parse(localStorage.getItem('examina-greek-discrepancy-v1')))).length,0);
  await page.locator('#grReviewSkip').click();
  assert.notEqual(await page.locator('#grReviewCard h3').textContent(),first,
   'Omitir debe avanzar sin registrar una solución');
  // Importación desde archivo local; la cola debe reconocer Eulexis sin llamadas de red.
  await page.locator('#grReviewEulexisFile').evaluate(el=>{const details=el.closest('details');if(details)details.open=true;});
  await page.locator('#grReviewEulexisFile').setInputFiles({
   name:'eulexis-local.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({schema:'examina-eulexis-review/v1',rows:[
    {form:'λόγος',lemma:'λόγος',analysis:'masculino nominativo singular · Eulexis'}
   ]}))
  });
  await page.locator('#grReviewImportStatus').filter({hasText:'1 análisis'}).waitFor();
  assert.match(await page.locator('#grReviewStatus').textContent(),/Eulexis importados/);
  assert.equal(await page.evaluate(()=>typeof window.ExaminaGreekSentenceContexts),'function');
  const dataCount=await page.evaluate(async()=>{
   const d=await window.ExaminaOfflineLemmatizer.load();
   return d.rows.grc.filter(x=>x[3]===7).length;
  });
  assert.equal(dataCount,0,'La importación local no debe modificar automáticamente el banco de lemas');
  assert.deepEqual(errors,[],'Errores JavaScript');
  assert.deepEqual(requests,[],'La edición offline no puede solicitar servicios externos');
  console.log('Chromium: tarjetas griegas, avanzar, deshacer, importar Eulexis sin red.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
