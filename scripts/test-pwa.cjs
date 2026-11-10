// Regression real en Chromium: instalación en subdirectorio de GitHub Pages,
// uso totalmente sin red, datos/lematizador, actualización voluntaria y borrador.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/GeneradorExamenes/';
let release='test-one';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8',
 '.png':'image/png'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith(PREFIX)){res.writeHead(404).end();return}
 const partial=url.pathname.slice(PREFIX.length)||'index.html';
 const filepath=path.resolve(ROOT,partial);
 if(!filepath.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
 try{
  let body=await fs.readFile(filepath);
  if(partial==='sw.js')body=Buffer.from(body.toString().replace('__PWA_BUILD_VERSION__',release));
  res.writeHead(200,{'content-type':types[path.extname(partial)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404).end()}
});
(async()=>{
 const pngs=await Promise.all([192,512].map(size=>fs.readFile(path.join(ROOT,'icons','icon-'+size+'.png'))));
 for(let i=0;i<pngs.length;i++){
  const png=pngs[i],size=i?512:192;
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Icono PNG inválido');
  assert.equal(png.readUInt32BE(16),size,'Dimensión incorrecta en icono PWA');
 }
 const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'manifest.webmanifest'),'utf8'));
 assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');
 assert.equal(manifest.icons.length,2);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,
  ...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',err=>errors.push(String(err)));
  page.on('request',req=>requests.push(req.url()));
  await page.goto(origin+PREFIX);
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#pwaStatus')?.textContent.includes('Preparada'),null,{timeout:30000});
  const cache=await page.evaluate(async()=>{
   const reg=await navigator.serviceWorker.ready;
   const keys=await caches.keys();
   const storage=await caches.open(keys.find(k=>k.startsWith('examina-pwa-')));
   const paths=['index.html','offline.html','pwa.js','offline-lemmas.js',
    'data/unimorph/lat-v.json','data/lemmas/teacher-forms.json',
    'manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
   return {scope:reg.scope,keys,entries:await Promise.all(paths.map(async p=>({
    path:p,stored:!!await storage.match(new URL(p,reg.scope).href)
   })))};
  });
  assert.equal(cache.scope,origin+PREFIX);
  assert(cache.entries.every(x=>x.stored),'Precache incompleta: '+JSON.stringify(cache.entries));
  const firstVersion=cache.keys.find(k=>k.startsWith('examina-pwa-'));
  assert(firstVersion?.includes('test-one'));
  // El documento es la misma aplicación en línea y sin conexión.
  await page.selectOption('#course','latin1');
  await page.selectOption('#model','tablas');
  await page.evaluate(()=>{generate();document.getElementById('saveDraft').click()});
  const storedDraft=await page.evaluate(()=>Object.keys(localStorage)
   .find(key=>key.toLowerCase().includes('draft')||key.toLowerCase().includes('borrador')));
  assert(storedDraft,'El borrador no se ha guardado en el navegador');
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  assert(await page.locator('#paper .exam-sheet').count()>0,'La vista previa no se carga sin red');
  await page.locator('#pwaStatus').waitFor({state:'visible'});
  assert.match(await page.locator('#pwaStatus').innerText(),/Sin conexión/);
  assert(await page.evaluate(key=>!!localStorage.getItem(key),storedDraft),
   'El borrador local se ha perdido tras recargar offline');
  await page.evaluate(()=>document.getElementById('restoreDraft').click());
  assert(await page.locator('#paper .exam-sheet').count()>0,
   'No se recupera el examen guardado sin red');
  const latin=await page.evaluate(async()=>{
   const response=await fetch('data/unimorph/lat-v.json');
   return {status:response.status,length:(await response.json()).rows.length};
  });
  assert(latin.status===200&&latin.length===16988,'No funciona el banco latino offline');
  await page.locator('#offlineLemmaPanel').waitFor({state:'attached'});
  await page.evaluate(()=>{const d=document.getElementById('offlineLemmaPanel').closest('details');if(d)d.open=true});
  await page.selectOption('#offlineLemmaCourse','gr1');
  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('λύω');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor({timeout:30000});
  assert(await page.locator('#offlineLemmaResults .lemma-entry').count()>=5,
   'Faltan las flexiones griegas offline');
  assert(requests.every(url=>url.startsWith(origin+PREFIX)),
   'La PWA contactó un servidor externo: '+JSON.stringify(requests));
  // Regresar online y simular publicación nueva: la app antigua no se recarga.
  await context.setOffline(false);
  release='test-two';
  await page.evaluate(()=>{window.__borradorSinGuardar=77});
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update()});
  await page.locator('#pwaUpdate').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.evaluate(()=>window.__borradorSinGuardar),77,
   'Se recargó la página sin autorización al detectar la actualización');
  await page.click('#pwaUpdate');
  await page.locator('#pwaReload').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.evaluate(()=>window.__borradorSinGuardar),77,
   'Se perdió una edición manual al activar el nuevo SW');
  // controllerchange puede notificarse antes de que activate termine su
  // limpieza asíncrona; esperar la eliminación efectiva de la caché antigua.
  let keys=[];
  for(let attempt=0;attempt<50;attempt++){
   keys=await page.evaluate(async()=>await caches.keys());
   if(keys.some(k=>k.includes('test-two'))&&!keys.some(k=>k.includes('test-one')))break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  const worker=await page.evaluate(async()=>{
   const reg=await navigator.serviceWorker.getRegistration();
   return {active:reg.active?.state,waiting:reg.waiting?.state,controller:navigator.serviceWorker.controller?.state};
  });
  assert(keys.length===1&&keys[0].includes('test-two'),
   'Las cachés no se actualizaron de forma atómica: '+JSON.stringify({keys,worker}));
  await context.setOffline(true);
  await page.reload();
  assert(await page.locator('#paper .exam-sheet').count()>0,'La nueva versión no funciona offline');
  assert.deepEqual(errors,[],'Errores JavaScript en la PWA');
  console.log('OK PWA: instalación, 9 recursos precargados, latín/griego sin Internet, borradores y actualización voluntaria.');
  await context.close();
 }finally{await browser.close()}
})().finally(()=>server.close()).catch(err=>{console.error(err);process.exitCode=1});
