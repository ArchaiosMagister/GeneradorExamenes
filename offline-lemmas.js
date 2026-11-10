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
 if(tags==='LEX;ENTRY')return 'Forma citada en el vocabulario; sin análisis flexivo documentado';
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
   const sourceNames={0:'UniMorph',1:'Paradigma docente',2:'Modelo regular · propuesta sin verificar',3:'Vocabulario docente',4:'Wikcionario · forma griega candidata sin verificar'};
   const item={lemma,surface,tags,source:sourceNames[source]||'Fuente desconocida',provisional:source===2||source===4,citation:source===3,
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
function coverage(data,course){
 if(!names[course])throw Error('Curso desconocido');
 const lang=langOf(course);
 const all=new Set(Object.keys(data.vocabulary[lang]||{}).filter(lemma=>data.vocabulary[lang][lemma][course]));
 const attested=new Set(),proposed=new Set();
 for(const [lemma,, ,source]of data.rows[lang]){
  if(!all.has(lemma))continue;
  if(source===0||source===1)attested.add(lemma);
  if(source===2||source===4)proposed.add(lemma);
 }
 return {lemmas:all.size,documented:attested.size,
  proposed:proposed.size,onlyCitation:[...all].filter(k=>!attested.has(k)&&!proposed.has(k)).length};
}
function uniqueLemmaFromData(data,course,form){
 const found=query(data,{course,mode:'form',text:form,max:Number.MAX_SAFE_INTEGER});
 if(found.invalid||!found.items.length)return null;
 // Only actual morphological evidence (UniMorph or explicit teacher paradigm)
 // can authorize automatic entry recovery; a citation form is NOT an analysis.
 const reliable=found.items.filter(item=>!item.provisional&&!item.citation);
 if(!reliable.length)return null;
 // A competing provisional form or a citation lemma still makes the written
 // form ambiguous. Never silently prefer the seemingly stronger analysis.
 const possible=new Set(found.items.map(item=>item.lemma));
 if(possible.size!==1)return null;
 return [...possible][0];
}
let loadedData=null;
function uniqueEntry(form,course){
 try{
  const data=loadedData||(typeof examinaEmbeddedAsset==='function'?examinaEmbeddedAsset(ASSET):null);
  if(!data)return null;
  const lemma=uniqueLemmaFromData(data,course,form);
  return lemma?data.vocabulary[langOf(course)]?.[lemma]?.[course]?.entry||null:null;
 }catch{return null}
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
 })().then(data=>{loadedData=data;return data}).catch(error=>{loading=null;throw error});
 return loading;
}
function itemElement(item){
 const article=document.createElement('article');
 article.className='lemma-entry'+(item.provisional?' lemma-provisional':'');
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
  const proposals=found.items.filter(item=>item.provisional).length;
  const lexical=found.items.filter(item=>item.citation).length;
  status.textContent=found.total+' registros · '+unique.size+' lema(s) · '+
   (proposals?proposals+' propuestas de modelo sin verificar · ':'')+
   (lexical?lexical+' formas de cita del vocabulario · ':'')+
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
  '<p class="hint">Consulta formas del latín y del griego antiguo del vocabulario docente. Distingue formas documentadas, propuestas de modelos regulares y entradas del vocabulario sin flexión; no modifica las soluciones de los exámenes ni adivina lemas.</p>'+
  '<label for="offlineLemmaCourse">Asignatura</label>'+
  '<select id="offlineLemmaCourse"><option value="lat1">Latín I</option><option value="lat4">Latín 4.º ESO</option><option value="gr1">Griego I</option></select>'+
  '<label for="offlineLemmaMode">Tipo de consulta</label>'+
  '<select id="offlineLemmaMode"><option value="form">Analizar una forma</option><option value="lemma">Ver flexiones de un lema</option></select>'+
  '<label for="offlineLemmaInput">Forma o lema</label>'+
  '<input id="offlineLemmaInput" type="text" maxlength="90" autocomplete="off" spellcheck="false" placeholder="amābam / λόγου">'+
  '<button id="offlineLemmaSearch" type="button" class="secondary">Consultar sin conexión</button>'+
  '<p id="offlineLemmaCoverage" class="hint" aria-live="polite">Preparando resumen de cobertura…</p>'+
  '<p id="offlineLemmaStatus" class="hint" role="status" aria-live="polite">Disponible desde los datos incluidos en la versión autónoma.</p>'+
  '<div id="offlineLemmaResults" class="lemma-results"></div>'+
  '<p class="hint">Fuentes: UniMorph (CC BY-SA 3.0), paradigmas docentes y Wikcionario/Wiktextract (CC BY-SA 4.0). Las propuestas de formas regulares y las candidatas de Wikcionario se marcan y no se usan para corregir exámenes.</p>';
 parent.after(section);
 const style=document.createElement('style');
 style.textContent='#offlineLemmaPanel{margin-top:12px}#offlineLemmaPanel .lemma-results{max-height:360px;overflow:auto}'+
  '#offlineLemmaPanel .lemma-entry{border:1px solid var(--line,#dce4ee);border-radius:7px;padding:9px 11px;margin:8px 0;background:var(--surface,#fff)}'+
  '#offlineLemmaPanel .lemma-entry p{margin:5px 0;font-family:Georgia,serif}'+
  '#offlineLemmaPanel .lemma-provisional{border-style:dashed;border-left:4px solid #a46b24}'+
  '#offlineLemmaPanel .lemma-meta{font-size:12px;opacity:.8}'+
  '@media print{#offlineLemmaPanel{display:none!important}}';
 document.head.append(style);
 async function showCoverage(){
  const target=document.getElementById('offlineLemmaCoverage');
  try{
   const x=coverage(await load(),document.getElementById('offlineLemmaCourse').value);
   target.textContent=x.lemmas+' lemas · '+x.documented+' con formas documentadas · '+
    x.proposed+' con formas candidatas no verificadas · '+x.onlyCitation+' solo con entrada de vocabulario.';
  }catch(error){target.textContent='El resumen de cobertura no está disponible: '+error.message}
 }
 document.getElementById('offlineLemmaCourse').addEventListener('change',showCoverage);
 showCoverage();
 document.getElementById('offlineLemmaSearch').addEventListener('click',submit);
 document.getElementById('offlineLemmaInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}});
}
window.ExaminaOfflineLemmatizer={normalize,describe,query,coverage,uniqueLemmaFromData,uniqueEntry,load,init};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
