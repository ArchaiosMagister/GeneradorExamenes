/* PWA de Exámenes Clásicos. VERSION se sustituye por SHA en GitHub Pages. */
'use strict';
const CACHE_PREFIX='examina-pwa-';
const CACHE_NAME=CACHE_PREFIX+'__PWA_BUILD_VERSION__';
const CORE_FILES=[
 // Una sola copia del documento principal: la navegación a ./ usa index.html.
 './index.html','./offline.html','./offline-lemmas.js','./verification-review.js','./greek-review.js','./eulexis-local.js',
 './culture-lat4.js','./lexicon-valenciano.js','./required-latin-units.js','./vocabulary-quality.js','./vocabulary-generator.js','./exam-scoring.js','./unified-backup.js','./exam-selection-summary.js','./pwa.js',
 './vendor/html2pdf.bundle.min.js','./pdf-export.js','./export-workspace.js','./manifest.webmanifest',
 './icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
 './icons/apple-touch-icon-180.png','./icons/favicon-48.png',
 './data/unimorph/lat-v.json','./data/lemmas/teacher-forms.json',
 './data/latinismos-docente.json','./data/prefijos-docente.json','./data/modificacion-preverbial-docente.json',
 './data/modificacion-preverbial-unidades-lat1.json','./data/lat4-progresion-lexico.json',
 './data/fonetica/banco_examenes.json','./data/fonetica/lat1-programacion.json'
];
const scopedUrl=path=>new URL(path,self.registration.scope).href;
const cacheable=new Set(CORE_FILES.map(scopedUrl));
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  try{
   // Validar cada recurso con el servidor: no-cache permite revalidación
   // HTTP condicional (ETag/Last-Modified), pero nunca acepta un archivo
   // desfasado sin comprobarlo. 'reload' forzaba transferir de nuevo incluso
   // los grandes bancos académicos que seguían idénticos.
   // Instalar en lotes pequeños reduce picos de peticiones y memoria
   // en Safari/iPad sin perder el precache íntegro ni la atomicidad.
   const batchSize=6;
   for(let i=0;i<CORE_FILES.length;i+=batchSize){
    await cache.addAll(CORE_FILES.slice(i,i+batchSize).map(path=>
     new Request(scopedUrl(path),{cache:'no-cache'})));
   }
  }catch(error){await caches.delete(CACHE_NAME);throw error}
  // No hacer skipWaiting: la actualización debe ser una decisión del docente.
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME)
   .map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 // Las vistas previas tienen su propio service worker y caché: nunca servirles index.html de main.
 const relativePath=url.pathname.slice(scope.pathname.length);
 if(/^pr-\d+(?:\/|$)/.test(relativePath))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   const page=url.pathname.endsWith('/offline.html')?'./offline.html':'./index.html';
   return (await cache.match(scopedUrl(page)))||fetch(request);
  })());
  return;
 }
 if(cacheable.has(url.href)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   return (await cache.match(url.href))||fetch(request);
  })());
 }
 // No se interceptan datos de usuario, URLs externas ni peticiones desconocidas.
});
