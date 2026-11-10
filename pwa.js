/* Gestión PWA no intrusiva: sin recargas automáticas ni cambios en los exámenes. */
(function(){
 'use strict';
 const panel=document.getElementById('pwaPanel');
 if(!panel||!('serviceWorker' in navigator)||
    !/^https?:$/.test(location.protocol)||location.pathname.endsWith('/offline.html'))return;
 const byId=id=>document.getElementById(id);
 const status=byId('pwaStatus'),note=byId('pwaNote');
 const install=byId('pwaInstall'),persist=byId('pwaPersist');
 const update=byId('pwaUpdate'),reload=byId('pwaReload');
 let registration=null,installPrompt=null,applyingUpdate=false;
 let hadController=!!navigator.serviceWorker.controller,ready=false;
 panel.hidden=false;
 function paint(){
  status.textContent=!navigator.onLine
   ?(ready?'Sin conexión · aplicación disponible':'Sin conexión · caché no preparada')
   :(ready?'Preparada para funcionar sin conexión':'Preparando uso sin conexión…');
 }
 function guidance(message){note.textContent=message}
 function showWaiting(){
  if(!registration?.waiting||applyingUpdate)return;
  update.hidden=false;
  guidance('Nueva versión preparada. Guarda el borrador antes de actualizar: la página no se recargará sola.');
 }
 function readyToReload(){
  update.hidden=true;reload.hidden=false;
  guidance('Versión nueva activada. Guarda o exporta el borrador antes de recargar.');
 }
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  const wasControlled=hadController;hadController=true;ready=true;paint();
  if(wasControlled||applyingUpdate)readyToReload();
 });
 install.addEventListener('click',async()=>{
  if(!installPrompt)return;
  const prompt=installPrompt;installPrompt=null;install.hidden=true;
  try{await prompt.prompt();await prompt.userChoice}
  catch{guidance('Puedes instalarla desde el menú del navegador cuando esté disponible.')}
 });
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event;install.hidden=false;
 });
 window.addEventListener('appinstalled',()=>{install.hidden=true;installPrompt=null});
 byId('pwaDataBackup').addEventListener('click',()=>{
  byId('exportData')?.click();
  guidance('Exporta también el borrador del examen. El navegador puede eliminar sus datos si limpias el sitio.');
 });
 byId('pwaExamBackup').addEventListener('click',()=>{
  byId('downloadDraft')?.click();
  guidance('Se ha solicitado la descarga del borrador. Conserva también una copia de tus datos.');
 });
 if(navigator.storage?.persist&&navigator.storage?.persisted){
  navigator.storage.persisted().then(granted=>{
   if(!granted)persist.hidden=false;
  }).catch(()=>{});
  persist.addEventListener('click',async()=>{
   try{
    const granted=await navigator.storage.persist();
    if(granted){
     persist.hidden=true;
     guidance('Almacenamiento persistente concedido. Sigue conservando copias de seguridad.');
    }else guidance('El navegador no concedió persistencia. Exporta regularmente tus datos.');
   }catch{guidance('No se pudo solicitar persistencia. Exporta copias de seguridad.')}
  });
 }
 update.addEventListener('click',()=>{
  if(!registration?.waiting)return;
  applyingUpdate=true;update.hidden=true;
  guidance('Activando versión nueva; no se recargará el examen hasta que lo autorices.');
  registration.waiting.postMessage({type:'SKIP_WAITING'});
 });
 reload.addEventListener('click',()=>{
  if(!window.confirm('¿Has guardado o exportado el examen? Los cambios sin guardar se perderán al recargar.'))return;
  location.reload();
 });
 window.addEventListener('online',()=>{paint();registration?.update().catch(()=>{})});
 window.addEventListener('offline',paint);
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&navigator.onLine)registration?.update().catch(()=>{});
 });
 paint();
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(async reg=>{
  registration=reg;
  const watch=worker=>{
   if(!worker)return;
   worker.addEventListener('statechange',()=>{
    if(worker.state==='installed'&&navigator.serviceWorker.controller)showWaiting();
   });
  };
  watch(reg.installing);
  reg.addEventListener('updatefound',()=>watch(reg.installing));
  if(reg.waiting)showWaiting();
  try{
   await navigator.serviceWorker.ready;
   ready=true;paint();
   if(!('onbeforeinstallprompt' in window))
    guidance('Puedes añadirla a la pantalla de inicio desde el navegador. Exporta tus copias periódicamente.');
  }catch(error){guidance('No se pudo preparar la caché: '+error.message)}
  reg.update().catch(()=>{});
 }).catch(error=>{
  ready=false;paint();guidance('No se pudo activar el modo sin conexión: '+error.message);
 });
})();
