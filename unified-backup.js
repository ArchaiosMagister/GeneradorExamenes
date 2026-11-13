/* Fase IV: respaldo local, portable y conservador; nunca cambia la acreditación filológica. */
(function(root){
 'use strict';
 const SCHEMA='examina-unified-backup/v1', ARCHIVE='examina_unified_archive_v1';
 const GROUPS={
  'examina_draft_v14':'draft','examina_previous_v14':'draft',
  'examina_exam_sentences_v1':'map','examina_exam_gloss_choices_v1':'map',
  'examina-morph-review-v1':'map','examina-greek-discrepancy-v1':'map',
  'examina_teacher_authorizations_v1':'map',
  'examina_question_points_v1':'map',
  'examina_required_v9':'required','examina_extra':'data',
  'examina_lexical_banks_v1':'data','examina_vocabulary_project_v1':'data'
 };
 const MAX_FILE=16*1024*1024, MAX_ITEM=3*1024*1024, MAX_ARCHIVE=150;
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const json=v=>JSON.stringify(v);
 const copy=v=>JSON.parse(json(v));
 const storage=()=>root.localStorage;
 const unsafe=k=>['__proto__','prototype','constructor'].includes(k);
 function validateDraft(d){
  return record(d)&&d.schema==='examina-exam-draft'&&d.version===1&&
   ['latin1','latin4','greek1'].includes(d.course)&&
   typeof d.html==='string'&&d.html.length<2000000;
 }
 function validateItem(key,value){
  if(!own(GROUPS,key))throw Error('Clave no reconocida: '+key);
  if(json(value)===undefined||json(value).length>MAX_ITEM)throw Error('Registro excesivo: '+key);
  const kind=GROUPS[key];
  if(kind==='draft'&&!validateDraft(value))throw Error('Borrador no válido: '+key);
  if(kind==='required'&&(!Array.isArray(value)||value.length>50000||
    !value.every(x=>record(x)&&typeof x.course==='string'&&typeof x.unit==='string'&&typeof x.entry==='string')))
   throw Error('Vocabulario exigible no válido');
  if((kind==='map'||kind==='data')&&!record(value))throw Error('Datos no válidos: '+key);
  if(kind==='map'&&Object.keys(value).some(k=>unsafe(k)))throw Error('Identificador inseguro: '+key);
  if(key==='examina_vocabulary_project_v1'&&(!Array.isArray(value.units)||
    !Number.isInteger(value.count)||value.count<1||value.count>100))
   throw Error('Proyecto de vocabulario no válido');
 }
 function readArchive(){
  try{
   const data=JSON.parse(storage().getItem(ARCHIVE)||'[]');
   return Array.isArray(data)?data.filter(x=>record(x)&&
    (own(GROUPS,x.key)||x.key==='liveDraft')&&own(x,'value')).slice(0,MAX_ARCHIVE):[];
  }catch{return []}
 }
 function makeBackup(){
  const entries=Object.create(null);
  for(const key of Object.keys(GROUPS)){
   const raw=storage().getItem(key);
   if(raw===null)continue;
   let parsed;
   try{parsed=JSON.parse(raw)}catch{throw Error('No se pudo leer '+key+'; no se generó una copia incompleta')}
   validateItem(key,parsed);
   entries[key]=parsed;
  }
  const liveDraft=root.ExaminaUnifiedCurrentExam?.()||null;
  if(liveDraft&&!validateDraft(liveDraft))throw Error('La vista previa actual no es un borrador válido');
  return {schema:SCHEMA,version:1,created:new Date().toISOString(),
   entries,liveDraft,archive:readArchive()};
 }
 function validateBackup(data){
  if(!record(data)||data.schema!==SCHEMA||data.version!==1||
    !record(data.entries)||!Array.isArray(data.archive)||data.archive.length>MAX_ARCHIVE)
   throw Error('No es una copia unificada compatible');
  if(json(data).length>MAX_FILE)throw Error('La copia supera 16 MB');
  for(const [key,value] of Object.entries(data.entries))validateItem(key,value);
  if(data.liveDraft!==null&&data.liveDraft!==undefined&&!validateDraft(data.liveDraft))
   throw Error('Borrador de la vista previa incorrecto');
  for(const item of data.archive){
   if(!record(item)||!own(item,'value')||
      !(own(GROUPS,item.key)||item.key==='liveDraft'))
    throw Error('El historial de conflictos tiene entradas incorrectas');
   if(item.key==='liveDraft'){
    if(!validateDraft(item.value))throw Error('Borrador archivado incorrecto');
   }else validateItem(item.key,item.value);
  }
  return data;
 }
 function mergeArray(current,incoming){
  const out=current.slice(),known=new Map(current.map(x=>[x.course+'|'+x.unit+'|'+(x.key||x.entry),x]));
  const conflicts=[];let added=0,duplicate=0;
  for(const item of incoming){
   const id=item.course+'|'+item.unit+'|'+(item.key||item.entry);
   if(known.has(id)){
    if(json(known.get(id))===json(item))duplicate++;
    else conflicts.push(item);
    continue;
   }
   out.push(item);known.set(id,item);added++;
  }
  return {value:out,added,duplicate,conflict:conflicts.length?conflicts:null,conflicts:conflicts.length};
 }
 function mergeMap(current,incoming){
  const out=Object.assign(Object.create(null),current),conflict=Object.create(null);
  let added=0,duplicate=0,conflicts=0;
  for(const [id,value] of Object.entries(incoming)){
   if(unsafe(id))throw Error('Identificador inseguro');
   if(!own(out,id)){out[id]=value;added++}
   else if(json(out[id])===json(value))duplicate++;
   else{conflict[id]=value;conflicts++}
  }
  return {value:out,added,duplicate,conflict:conflicts?conflict:null,conflicts};
 }
 function prepareImport(raw){
  const data=validateBackup(raw);
  const changes=Object.create(null),addArchive=[];
  const stats={newKeys:0,newItems:0,identical:0,conflicts:0,archived:0};
  for(const [key,incoming] of Object.entries(data.entries)){
   const previous=storage().getItem(key);
   if(previous===null){changes[key]=incoming;stats.newKeys++;continue}
   let current;
   try{current=JSON.parse(previous);validateItem(key,current)}catch{
    addArchive.push({key,value:incoming});stats.conflicts++;continue;
   }
   if(json(current)===json(incoming)){stats.identical++;continue}
   let merged=null;
   if(GROUPS[key]==='map')merged=mergeMap(current,incoming);
   else if(GROUPS[key]==='required')merged=mergeArray(current,incoming);
   if(merged){
    stats.newItems+=merged.added;
    stats.identical+=merged.duplicate;
    if(merged.added)changes[key]=merged.value;
    if(merged.conflict){addArchive.push({key,value:merged.conflict});stats.conflicts+=merged.conflicts}
   }else{addArchive.push({key,value:incoming});stats.conflicts++}
  }
  if(data.liveDraft)addArchive.push({key:'liveDraft',value:data.liveDraft});
  for(const item of data.archive)addArchive.push({key:item.key,value:item.value});
  const existing=readArchive(),all=existing.slice();
  const seen=new Set(all.map(x=>x.key+'|'+json(x.value)));
  for(const item of addArchive){
   const fingerprint=item.key+'|'+json(item.value);
   if(seen.has(fingerprint)){stats.identical++;continue}
   if(all.length>=MAX_ARCHIVE)throw Error('El archivo de conflictos está lleno. Exporta y recupera en un navegador vacío.');
   all.push({key:item.key,value:copy(item.value),importedAt:new Date().toISOString()});
   seen.add(fingerprint);stats.archived++;
  }
  if(stats.archived)changes[ARCHIVE]=all;
  return {changes,stats,archive:all};
 }
 function applyImport(data){
  const plan=prepareImport(data),keys=Object.keys(plan.changes);
  const before=keys.map(key=>[key,storage().getItem(key)]);
  try{
   for(const key of keys)storage().setItem(key,json(plan.changes[key]));
  }catch(error){
   for(const [key,value] of before.reverse()){
    try{if(value===null)storage().removeItem(key);else storage().setItem(key,value)}catch{}
   }
   throw Error('Espacio insuficiente o escritura rechazada. Se ha intentado revertir la importación: '+error.message);
  }
  return plan.stats;
 }
 function restoreFromArchive(index){
  const item=readArchive()[index];
  if(!item||item.key==='liveDraft'||!own(GROUPS,item.key))throw Error('Elige una entrada recuperable');
  validateItem(item.key,item.value);
  const data={schema:SCHEMA,version:1,entries:{[item.key]:item.value},archive:[],liveDraft:null};
  return applyImport(data);
 }
 function download(filename,value){
  const blob=new Blob([json(value)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=root.document.createElement('a');
  a.href=url;a.download=filename;root.document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 function init(){
  const host=root.document.querySelector('.quick-actions');
  if(!host||root.document.getElementById('examinaUnifiedBackup'))return;
  const panel=root.document.createElement('section');
  panel.id='examinaUnifiedBackup';panel.className='no-print';
  panel.innerHTML='<details><summary><strong>Copia de seguridad unificada · Fase IV</strong></summary>'+
   '<p>Reúne borradores de examen, decisiones filológicas, autorizaciones individuales que estén guardadas y los datos docentes locales. La importación conserva lo existente y archiva los conflictos; nunca verifica formas automáticamente.</p>'+
   '<div class="buttons"><button type="button" id="examinaBackupExport">Exportar copia completa JSON</button>'+
   '<button type="button" id="examinaBackupChoose" class="secondary">Importar copia completa JSON</button>'+
   '<input id="examinaBackupFile" type="file" accept=".json,application/json" hidden></div>'+
   '<p id="examinaBackupStatus" role="status" aria-live="polite"></p>'+
   '<label for="examinaArchiveSelect">Registros importados conservados en el archivo de conflictos</label>'+
   '<select id="examinaArchiveSelect"></select>'+
   '<div class="buttons"><button type="button" id="examinaArchiveDownload" class="secondary">Descargar registro archivado</button>'+
   '<button type="button" id="examinaArchiveRecover" class="secondary">Recuperar sin sobrescribir</button></div>'+
   '<p class="hint">Los índices extensos de Eulexis y UniMorph se reinstalan por separado; no contienen decisiones personales. Conserva el JSON fuera del dispositivo.</p></details>';
  host.after(panel);
  const style=root.document.createElement('style');
  style.textContent='#examinaUnifiedBackup{margin:10px 18px 14px;padding:12px;border:1px solid var(--soft-border,#bac8d6);border-radius:10px;background:var(--secondary-bg,#f4f7fb);color:inherit}'+
   '#examinaUnifiedBackup summary{cursor:pointer}#examinaUnifiedBackup p{margin:10px 0}'+
   '#examinaUnifiedBackup .buttons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}'+
   '#examinaArchiveSelect{display:block;width:100%;max-width:660px;margin:6px 0 10px}';
  root.document.head.append(style);
  const el=id=>root.document.getElementById(id),status=el('examinaBackupStatus');
  const refresh=()=>{
   const select=el('examinaArchiveSelect'),items=readArchive();
   select.replaceChildren();
   if(!items.length){const o=root.document.createElement('option');o.textContent='No hay registros archivados';o.value='';select.append(o)}
   items.forEach((item,i)=>{const o=root.document.createElement('option');o.value=i;
    o.textContent=(i+1)+'. '+(item.key==='liveDraft'?'Borrador visible':item.key)+
     ' · '+(item.importedAt||'copia anterior');select.append(o)});
   el('examinaArchiveRecover').disabled=!items.length;
   el('examinaArchiveDownload').disabled=!items.length;
  };
  const selected=()=>readArchive()[Number(el('examinaArchiveSelect').value)];
  el('examinaBackupExport').addEventListener('click',()=>{
   try{
    const data=makeBackup();
    download('examina_copia_unificada_'+new Date().toISOString().slice(0,10)+'.json',data);
    status.textContent='Copia preparada: '+Object.keys(data.entries).length+
     ' registros locales y '+data.archive.length+' elementos archivados. Conserva el archivo descargado.';
   }catch(error){status.textContent='No se pudo exportar: '+error.message}
  });
  el('examinaBackupChoose').addEventListener('click',()=>el('examinaBackupFile').click());
  el('examinaBackupFile').addEventListener('change',async event=>{
   const file=event.target.files?.[0];event.target.value='';if(!file)return;
   try{
    if(file.size>MAX_FILE)throw Error('El archivo supera 16 MB');
    const data=validateBackup(JSON.parse(await file.text()));
    const plan=prepareImport(data),s=plan.stats;
    if(!root.confirm('Importar copia del '+(data.created||'archivo seleccionado')+'?\n'+
      s.newKeys+' claves nuevas, '+s.newItems+' decisiones o fichas nuevas, '+
      s.conflicts+' conflictos y '+s.archived+' registros archivados.\n'+
      'Las versiones locales existentes no se sustituirán.'))return;
    const result=applyImport(data);
    refresh();
    status.textContent='Importación completada: '+result.newKeys+' registros nuevos, '+
      result.newItems+' elementos añadidos y '+result.archived+
      ' archivados sin sobrescrituras. Recarga la aplicación tras guardar el examen actual para aplicar los cambios.';
   }catch(error){status.textContent='Importación cancelada o rechazada: '+error.message}
  });
  el('examinaArchiveDownload').addEventListener('click',()=>{
   const item=selected();if(!item)return;
   try{
    const data={schema:SCHEMA,version:1,created:new Date().toISOString(),
     entries:item.key==='liveDraft'?{}:{[item.key]:item.value},
     liveDraft:item.key==='liveDraft'?item.value:null,archive:[]};
    download('examina_registro_recuperado.json',data);
    status.textContent='Registro descargado. Puedes trasladarlo a otro dispositivo sin perder los actuales.';
   }catch(error){status.textContent=error.message}
  });
  el('examinaArchiveRecover').addEventListener('click',()=>{
   const index=Number(el('examinaArchiveSelect').value),item=selected();if(!item)return;
   try{
    if(item.key==='liveDraft'||GROUPS[item.key]==='draft'){
     const open=root.ExaminaUnifiedRestoreDraft;
     if(typeof open!=='function')throw Error('Abre el examen desde el cargador de borradores');
     if(!root.confirm('¿Abrir este borrador en la vista previa? Guarda antes los cambios actuales. El borrador local guardado no se sustituirá.'))return;
     open(item.value);status.textContent='Borrador abierto en la vista previa. Guárdalo manualmente si deseas conservarlo.';
    }else{
     const stats=restoreFromArchive(index);
     refresh();
     status.textContent='Se añadieron '+(stats.newKeys+stats.newItems)+
      ' elementos nuevos. Los conflictos siguen archivados. Recarga tras guardar el examen.';
    }
   }catch(error){status.textContent='No se pudo recuperar: '+error.message}
  });
  refresh();
 }
 root.ExaminaUnifiedBackup={makeBackup,validateBackup,prepareImport,applyImport,readArchive,restoreFromArchive};
 if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);
 else if(root.document)init();
})(window);
