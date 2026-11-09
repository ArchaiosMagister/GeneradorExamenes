/* UniMorph: local-only morphology reference, not an exam vocabulary source.
   Original datasets: https://github.com/unimorph/lat and https://github.com/unimorph/grc
   Licensing/attribution: consult each upstream repository before redistribution.
   Import the upstream tab-separated files once; data stays in browser IndexedDB. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const norm=s=>String(s||'').normalize('NFC').trim().toLocaleLowerCase();
let dbPromise;
function db(){
 if(!('indexedDB' in window))return Promise.reject(new Error('IndexedDB no disponible'));
 return dbPromise||(dbPromise=new Promise((resolve,reject)=>{
  const r=indexedDB.open('examina-unimorph',1);
  r.onupgradeneeded=()=>{const d=r.result;const st=d.createObjectStore('forms',{keyPath:'id'});st.createIndex('byForm','form');st.createIndex('byLemma','lemma');d.createObjectStore('metadata',{keyPath:'language'})};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 }));
}
const req=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
function transaction(d,stores,mode){return d.transaction(stores,mode)}
async function clearLanguage(language){
 const d=await db(),t=transaction(d,['forms','metadata'],'readwrite'),store=t.objectStore('forms');
 const range=IDBKeyRange.bound(language+'|',language+'|\uffff');
 await new Promise((ok,no)=>{const c=store.openCursor(range);c.onsuccess=()=>{const cur=c.result;if(cur){cur.delete();cur.continue()}else ok()};c.onerror=()=>no(c.error)});
}
async function importText(language,text,onProgress){
 const d=await db();await clearLanguage(language);
 const lines=text.split(/\r?\n/),chunkSize=1500;let count=0,bad=0;
 for(let i=0;i<lines.length;i+=chunkSize){
  const t=transaction(d,['forms'],'readwrite'),store=t.objectStore('forms');
  for(const line of lines.slice(i,i+chunkSize)){
   if(!line.trim()||line.startsWith('#'))continue;
   const parts=line.split('\t');if(parts.length<3){bad++;continue}
   const lemma=parts[0].trim(),surface=parts[1].trim(),features=parts.slice(2).join('\t').trim();
   if(!lemma||!surface||!features){bad++;continue}
   const id=language+'|'+norm(surface)+'|'+norm(lemma)+'|'+features;
   store.put({id,language,form:language+'|'+norm(surface),lemma:language+'|'+norm(lemma),headword:lemma,surface,features});
   count++;
  }
  await new Promise((ok,no)=>{t.oncomplete=ok;t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)});
  onProgress?.(count,lines.length);
  await new Promise(ok=>setTimeout(ok,0));
 }
 const t=transaction(d,['metadata'],'readwrite');t.objectStore('metadata').put({language,count,bad,imported:new Date().toISOString(),source:'UniMorph '+language});
 return {count,bad};
}
async function lookup(language,word,mode='form'){
 const d=await db(),t=transaction(d,['forms'],'readonly');
 const index=t.objectStore('forms').index(mode==='lemma'?'byLemma':'byForm');
 return req(index.getAll(language+'|'+norm(word)));
}
async function stats(){const d=await db(),t=transaction(d,['metadata'],'readonly');return req(t.objectStore('metadata').getAll())}
function ui(){
 const parent=$('lexiconSettings')||$('lexOption')||document.querySelector('.panel');
 if(!parent)return;
 const div=document.createElement('div');div.className='field';div.id='unimorphPanel';
 div.innerHTML='<h2>Base morfológica UniMorph (sin conexión)</h2><p class="hint">Importa los archivos TSV originales de UniMorph para consultar formas y lemas. Es una base auxiliar: no amplía el vocabulario exigible ni genera ejercicios sin validación docente. Los datos se guardan localmente en este navegador. Las importaciones grandes pueden tardar en iPhone.</p><label for="umLanguage">Idioma</label><select id="umLanguage"><option value="lat">Latín</option><option value="grc">Griego antiguo</option></select><label for="umFile">Archivo UniMorph (.tsv, lat o grc)</label><input id="umFile" type="file" accept=".tsv,.txt,.lat,.grc,text/plain"><button type="button" id="umImport" class="secondary">Importar base morfológica</button><p id="umStatus" class="hint" role="status" aria-live="polite"></p><label for="umQuery">Consultar forma o lema</label><input id="umQuery" type="text" placeholder="puellarum / λύουσι"><select id="umMode"><option value="form">Buscar análisis de una forma</option><option value="lemma">Buscar flexiones de un lema</option></select><button type="button" id="umLookup" class="secondary">Consultar morfología</button><div id="umResults" class="hint" aria-live="polite"></div>';
 parent.after(div);
 const status=$('umStatus');const say=s=>status.textContent=s;
 const refresh=async()=>{try{const ss=await stats();say(ss.map(x=>x.language+': '+x.count.toLocaleString('es')+' registros').join(' · ')||'Todavía no hay bases importadas.')}catch(e){say('Almacenamiento local no disponible: '+e.message)}};
 $('umImport').addEventListener('click',async()=>{
  const file=$('umFile').files?.[0];if(!file){say('Selecciona primero el archivo TSV.');return}
  const lang=$('umLanguage').value;
  if(file.size>150*1024*1024&&!confirm('Archivo grande: puede consumir mucha memoria en Safari. ¿Continuar?'))return;
  $('umImport').disabled=true;say('Leyendo archivo…');
  try{const txt=await file.text();const result=await importText(lang,txt,n=>say('Importando '+n.toLocaleString('es')+' registros…'));say('Importados '+result.count.toLocaleString('es')+' registros; '+result.bad+' líneas omitidas.')}catch(e){say('No se pudo importar: '+e.message)}finally{$('umImport').disabled=false}
 });
 $('umLookup').addEventListener('click',async()=>{
  const out=$('umResults');out.replaceChildren();const word=$('umQuery').value.trim();if(!word)return;
  try{
   const results=await lookup($('umLanguage').value,word,$('umMode').value);
   const p=document.createElement('p');p.textContent=results.length+' análisis/entradas encontradas'+(results.length>100?' (mostrando 100)':'');out.append(p);
   for(const x of results.slice(0,100)){const line=document.createElement('div');line.textContent=x.headword+' → '+x.surface+' · '+x.features;out.append(line)}
  }catch(e){out.textContent='Consulta no disponible: '+e.message}
 });
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ui);else ui();
window.ExaminaMorphology={lookup,stats,importText};
})();
