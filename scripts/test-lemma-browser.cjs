// Test of the exact self-contained offline.html in Chromium WITHOUT network.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{
   if(/^https?:/i.test(request.url()))requests.push(request.url());
  });
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.locator('#offlineLemmaPanel').waitFor();
  await page.locator('#offlineLemmaPanel').evaluate(el=>{
   const details=el.closest('details');if(details)details.open=true;
  });
  await page.selectOption('#offlineLemmaCourse','lat1');
  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('amo');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor();
  assert.match(await page.locator('#offlineLemmaStatus').textContent(),/análisis registrados/);
  assert.ok(await page.locator('#offlineLemmaResults .lemma-entry').count()>=5,'No se muestran flexiones latinas');
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/amo/);

  await page.selectOption('#offlineLemmaCourse','gr1');
  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('λύω');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor();
  assert.ok(await page.locator('#offlineLemmaResults .lemma-entry').count()>=5,'No se muestran flexiones griegas');
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/λύ/);

  await page.selectOption('#offlineLemmaMode','form');
  await page.locator('#offlineLemmaInput').fill('palabra-inexistente');
  await page.locator('#offlineLemmaSearch').click();
  assert.match(await page.locator('#offlineLemmaStatus').textContent(),/No hay un análisis registrado/);
  assert.equal(await page.locator('#offlineLemmaResults .lemma-entry').count(),0);

  assert.deepEqual(errors,[],'Errores JavaScript en página autónoma');
  assert.deepEqual(requests,[],'Un documento offline no debe contactar servidores: '+requests.join(', '));
  console.log('Chromium offline: latín, griego, sin resultados y cero solicitudes de red.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
