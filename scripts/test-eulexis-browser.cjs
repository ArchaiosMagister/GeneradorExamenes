const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','offline.html'),'utf8');
 const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  const errors=[];let downloads=0;
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://raw.githubusercontent.com/genuensis/lector-griego/**',async route=>{
   downloads++;
   const url=route.request().url();
   const data=url.endsWith('/data/morph.json')?'["nom sg masc","gen sg masc","voc sg masc"]':
    /\/data\/l\/\d+\.txt$/.test(url)?'a\tlo/gos\tia\n':
    /\/data\/f\/\d+\.txt$/.test(url)?'lo/gos\ta.0;a.2\nlo/gou\ta.1\n':'';
   await route.fulfill({status:200,contentType:'text/plain; charset=utf-8',
    headers:{'Access-Control-Allow-Origin':'*'},body:data});
  });
  const url='http://127.0.0.1:'+server.address().port+'/offline.html';
  await page.goto(url,{waitUntil:'load'});
  await page.locator('#offlineLemmaPanel').evaluate(el=>{const d=el.closest('details');if(d)d.open=true;});
  await page.locator('#greekDiscrepancyReview > details').evaluate(el=>el.open=true);
  await page.locator('#grReviewInstallEulexis').evaluate(el=>el.closest('details').open=true);
  await page.locator('#grReviewStatus').filter({hasText:'formas con discrepancias'}).waitFor();
  assert.equal(downloads,0,'No debe descargarse el corpus al abrir la PWA');
  await page.locator('#grReviewInstallEulexis').click();
  await page.locator('#grReviewInstallStatus').filter({hasText:/Eulexis instalado:/}).waitFor({timeout:60000});
  assert.equal(downloads,161,'Se consultan 32 fragmentos de lemas, 128 de formas y etiquetas');
  assert.match(await page.locator('#grReviewInstallStatus').textContent(),/análisis del vocabulario/);
  assert.ok(await page.locator('#grReviewCard .greek-review-option').count()>1,
   'La tarjeta debe mostrar las interpretaciones locales');
  const before=downloads;
  await page.reload({waitUntil:'load'});
  await page.locator('#offlineLemmaPanel').evaluate(el=>{const d=el.closest('details');if(d)d.open=true;});
  await page.locator('#greekDiscrepancyReview > details').evaluate(el=>el.open=true);
  await page.locator('#grReviewInstallEulexis').evaluate(el=>el.closest('details').open=true);
  await page.locator('#grReviewInstallStatus').filter({hasText:/Eulexis preparado:/}).waitFor();
  assert.equal(downloads,before,'La segunda visita debe cargar Eulexis sin red');
  assert.ok(await page.locator('#grReviewStatus').textContent().then(x=>/Eulexis importados/.test(x)));
  await page.locator('#grReviewRemoveEulexis').click();
  await page.locator('#grReviewInstallStatus').filter({hasText:/Datos personales de Eulexis borrados/}).waitFor();
  const cached=await page.evaluate(async()=>{
   const data=await window.ExaminaOfflineLemmatizer.load();
   return window.ExaminaEulexisLocal.load(data);
  });
  assert.equal(cached,null,'El usuario puede borrar el índice personal');
  assert.deepEqual(errors,[],'No debe haber errores JavaScript');
  console.log('Chromium: una activación, 161 fragmentos remotos, caché offline y eliminación funcionan.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
