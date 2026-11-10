/* Lematizador de referencia sin conexión: latín y griego antiguo.
 * Fuentes: UniMorph CC BY-SA 3.0 y modelos docentes en índice separado.
 * Las lecturas ambiguas se muestran todas. No se usan en claves de examen.
 */
(function(){
'use strict';
const ASSET='data/lemmas/teacher-forms.json';
const names={lat1:'Latín I',lat4:'Latín 4.º ESO',gr1:'Griego I'};
const langOf=course=>course==='gr1'?'grc':'lat';
function normalize(value){
 return String(value||'').trim().replace(/^[.,;:!?¿¡“”"'«»·()]+|[.,;:!?¿¡“”"'«»·()]+$/g,'')
  .toLowerCase().normalize('NFD').replace(/\u0345/g,'ι')
  .replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
  .replace(/ς/g,'σ').trim();
}
const translations={
 N:'sustantivo',ADJ:'adjetivo',V:'verbo',PRO:'pronombre',
 NOM:'nominativo',GEN:'genitivo',DAT:'dativo',ACC:'acusativo',ABL:'ablativo',VOC:'vocativo',
 SG:'singular',PL:'plural',DU:'dual',
 MASC:'masculino',FEM:'femenino',NEUT:'neutro',
 IND:'indicativo',SBJV:'subjuntivo',OPT:'optativo',IMP:'imperativo',INF:'infinitivo',
 ACT:'activo',PASS:'pasivo',MID:'medio',
 PRS:'presente',PST:'pasado',FUT:'futuro',PRF:'perfecto',IPFV:'imperfectivo',
 PFV:'perfectivo',PSTP:'pluscuamperfecto',PTCP:'participio',
 '1':'1.ª persona','2':'2.ª persona','3':'3.ª persona'
};
function describe(tags){
 if(tags.startsWith('DOCENTE;')){
  const xs=tags.split(';');
  return 'Paradigma docente · '+xs.slice(1).join(' · ');
 }
 return tags.split(';').map(t=>translations[t]||t).join(' · ');
}
const caches=new WeakMap();
function indexes(data){
 if(caches.has(data))return caches.get(data);
 if(data?.schema!==1||!data.rows||!data.vocabulary)throw Error('Formato de lematizador desconocido');
 const index={forms:{lat:new Map(),grc:new Map()},lemmas:{lat:new Map(),grc:new Map()}};
 for(const lang of ['lat','grc']){
  const entries=data.rows[lang];
  if(!Array.isArray(entries))throw Error('Faltan los registros del idioma '+lang);
  for(const row of entries){
   if(!Array.isArray(row)||row.length!==4)continue;
   const [lemma,surface,tags,source]=row;
   if(!data.vocabulary[lang]?.[lemma]||typeof surface!=='string'||typeof tags!=='string')continue;
   const item={lemma,surface,tags,source:source===0?'UniMorph':'Paradigma docente',
    info:data.vocabulary[lang][lemma]};
   for(const [map,key] of [[index.forms[lang],normalize(surface)],[index.lemmas[lang],normalize(lemma)]]){
    if(!map.has(key))map.set(key,[]);
    map.get(key).push(item);
   }
  }
 }
 caches.set(data,index);
 return index;
}
function query(data,{course='lat1',mode='form',text='',max=100}={}){
 if(!names[course])throw Error('Curso desconocido');
 const lang=langOf(course),key=normalize(text);
 if(!key||/\s/.test(key))return {total:0,items:[],invalid:!!key};
 const index=indexes(data);
 const candidates=(mode==='lemma'?index.lemmas[lang]:index.forms[lang]).get(key)||[];
 const matching=candidates.filter(item=>!!item.info[course]);
 // Retain every distinct attested analysis, including homographs.
 const seen=new Set(),items=[];
 for(const item of matching){
  const id=[item.lemma,normalize(item.surface),item.tags,item.source].join('|');
  if(seen.has(id))continue;
  seen.add(id);items.push(item);
 }
 items.sort((a,b)=>a.lemma.localeCompare(b.lemma,'es')||
  a.surface.localeCompare(b.surface,'es')||a.tags.localeCompare(b.tags));
 return {total:items.length,items:items.slice(0,max),invalid:false};
}
let loading;
function load(){
 if(loading)return loading;
 loading=(async()=>{
  const embedded=typeof examinaEmbeddedAsset==='function'?examinaEmbeddedAsset(ASSET):null;
  if(embedded)return embedded;
  if(location.protocol==='file:')throw Error('No hay índice lematizador incrustado en este archivo; descarga la última versión offline.html.');
  const response=await fetch(ASSET,{cache:'force-cache'});
  if(!response.ok)throw Error('No se ha publicado todavía el índice offline (HTTP '+response.status+').');
  return response.json();
 })().catch(error=>{loading=null;throw error});
 return loading;
}
function itemElement(item){
 const article=document.createElement('article');
 article.className='lemma-entry';
 const heading=document.createElement('div'),title=document.createElement('strong');
 const entry=item.info[document.getElementById('offlineLemmaCourse').value];
 title.textContent=entry?.entry||item.lemma;
 title.lang=langOf(document.getElementById('offlineLemmaCourse').value)==='grc'?'grc':'la';
 heading.append(title);
 const meta=document.createElement('span');
 meta.className='lemma-meta';
 meta.textContent=' · '+(entry?.units?.join(', ')||'sin unidad')+' · '+item.source;
 heading.append(meta);
 const detail=document.createElement('p');
 detail.textContent=item.surface+' — '+describe(item.tags);
 detail.lang=langOf(document.getElementById('offlineLemmaCourse').value)==='grc'?'grc':'la';
 const raw=document.createElement('small');
 raw.textContent='Análisis original: '+item.tags;
 raw.className='lemma-meta';
 article.append(heading,detail,raw);
 return article;
}
async function submit(){
 const text=document.getElementById('offlineLemmaInput').value.trim();
 const out=document.getElementById('offlineLemmaResults');
 const status=document.getElementById('offlineLemmaStatus');
 out.replaceChildren();
 if(!text){status.textContent='Escribe una forma o un lema.';return}
 status.textContent='Consultando el índice almacenado…';
 try{
  const data=await load();
  const options={
   course:document.getElementById('offlineLemmaCourse').value,
   mode:document.getElementById('offlineLemmaMode').value,
   text
  };
  const found=query(data,options);
  if(found.invalid){status.textContent='Consulta una sola palabra cada vez.';return}
  if(!found.total){status.textContent='No hay un análisis registrado para esa palabra en el vocabulario seleccionado. No se propone ningún lema por semejanza.';return}
  const unique=new Set(found.items.map(item=>item.lemma));
  status.textContent=found.total+' análisis registrados · '+unique.size+' lema(s) en el vocabulario · '+
   (found.total>found.items.length?'mostrando los primeros '+found.items.length+'.':'sin conexión externa.');
  for(const item of found.items)out.append(itemElement(item));
 }catch(error){
  status.textContent='No se ha podido consultar el índice: '+error.message;
 }
}
function init(){
 if(document.getElementById('offlineLemmaPanel'))return;
 const parent=document.getElementById('unimorphPanel')||
  document.getElementById('lexiconSettings')||document.querySelector('.panel');
 if(!parent)return;
 const section=document.createElement('section');
 section.id='offlineLemmaPanel';
 section.className='field';
 section.innerHTML='<h2>Lematizador del vocabulario · sin conexión</h2>'+
  '<p class="hint">Consulta formas del latín y del griego antiguo del vocabulario docente. Muestra todos los análisis documentados; no modifica las soluciones de los exámenes ni adivina lemas.</p>'+
  '<label for="offlineLemmaCourse">Asignatura</label>'+
  '<select id="offlineLemmaCourse"><option value="lat1">Latín I</option><option value="lat4">Latín 4.º ESO</option><option value="gr1">Griego I</option></select>'+
  '<label for="offlineLemmaMode">Tipo de consulta</label>'+
  '<select id="offlineLemmaMode"><option value="form">Analizar una forma</option><option value="lemma">Ver flexiones de un lema</option></select>'+
  '<label for="offlineLemmaInput">Forma o lema</label>'+
  '<input id="offlineLemmaInput" type="text" maxlength="90" autocomplete="off" spellcheck="false" placeholder="amābam / λόγου">'+
  '<button id="offlineLemmaSearch" type="button" class="secondary">Consultar sin conexión</button>'+
  '<p id="offlineLemmaStatus" class="hint" role="status" aria-live="polite">Disponible desde los datos incluidos en la versión autónoma.</p>'+
  '<div id="offlineLemmaResults" class="lemma-results"></div>'+
  '<p class="hint">Fuentes: UniMorph (CC BY-SA 3.0) y paradigmas docentes explícitos. Solo lemas del vocabulario preparado; no constituye un analizador de todo el latín o el griego.</p>';
 parent.after(section);
 const style=document.createElement('style');
 style.textContent='#offlineLemmaPanel{margin-top:12px}#offlineLemmaPanel .lemma-results{max-height:360px;overflow:auto}'+
  '#offlineLemmaPanel .lemma-entry{border:1px solid var(--line,#dce4ee);border-radius:7px;padding:9px 11px;margin:8px 0;background:var(--surface,#fff)}'+
  '#offlineLemmaPanel .lemma-entry p{margin:5px 0;font-family:Georgia,serif}'+
  '#offlineLemmaPanel .lemma-meta{font-size:12px;opacity:.8}'+
  '@media print{#offlineLemmaPanel{display:none!important}}';
 document.head.append(style);
 document.getElementById('offlineLemmaSearch').addEventListener('click',submit);
 document.getElementById('offlineLemmaInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}});
}
window.ExaminaOfflineLemmatizer={normalize,describe,query,load,init};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
