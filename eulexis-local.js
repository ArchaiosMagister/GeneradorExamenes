/* Eulexis local opcional de Griego I: instalación personal desde el origen.
 * No se redistribuyen corpus ni glosas de Diogenes/Perseus en la webapp.
 * Los análisis son PROPUESTAS, nunca soluciones/verificaciones automáticas.
 */
(function(root){
'use strict';
const REVISION='e3ca505b0e028af68a800673f5dc4565b0b05104';
const BASE='https://raw.githubusercontent.com/genuensis/lector-griego/'+REVISION+'/';
const DB='examina-eulexis-personal-v1', TABLE='indexes', SLOT='gr1';
const NF=128,NL=32;
const latin='abgdezhqiklmncoprstufxywv',greek='αβγδεζηθικλμνξοπρστυφχψωϝ';
const letters=Object.fromEntries([...latin].map((c,i)=>[c,greek[i]]));
const accents={')':'\u0313','(':'\u0314','/':'\u0301','\\':'\u0300','=':'\u0342',
 '+':'\u0308','|':'\u0345','_':'\u0304','^':'\u0306'};
const priority=['_','^','+',')','(','/','\\','=','|'];
function betaToGreek(beta){
 const input=String(beta||'');let result='';
 for(let i=0;i<input.length;){
  let uppercase=false,marks=[];
  if(input[i]==='*'){uppercase=true;i++}
  while(i<input.length&&accents[input[i]])marks.push(input[i++]);
  const code=input[i]||'';
  if(letters[code]){
   i++;while(i<input.length&&accents[input[i]])marks.push(input[i++]);
   let base=uppercase?letters[code].toUpperCase():letters[code];
   if(code==='s'&&!uppercase){
    const next=input[i]||'';
    if(!next||(!letters[next]&&next!=='*'))base='ς';
   }
   result+=base+marks.sort((a,b)=>priority.indexOf(a)-priority.indexOf(b))
    .map(x=>accents[x]).join('');
  }else if(i<input.length){
   if(!/[0-9]/.test(input[i]))result+=input[i]==="'"?'’':input[i];
   i++;
  }
 }
 return result.normalize('NFC');
}
function norm(v){
 return String(v||'').toLocaleLowerCase('el').normalize('NFD')
  .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ')
  .replace(/[\d\s]+$/g,'').trim();
}
function title(v){return String(v||'').trim().replace(/\d+$/,'').normalize('NFC')}
const dictionary={
 fem:'femenino',masc:'masculino',neut:'neutro',
 nom:'nominativo',gen:'genitivo',dat:'dativo',acc:'acusativo',voc:'vocativo',
 sg:'singular',pl:'plural',dual:'dual',
 pres:'presente',imperf:'imperfecto',aor:'aoristo',fut:'futuro',perf:'perfecto',plup:'pluscuamperfecto',
 ind:'indicativo',subj:'subjuntivo',opt:'optativo',imperat:'imperativo',
 inf:'infinitivo',part:'participio',act:'activo',mid:'medio',pass:'pasivo',mp:'medio-pasivo',
 '1st':'1.ª persona','2nd':'2.ª persona','3rd':'3.ª persona',
 attic:'ático',epic:'épico',ionic:'jónico',doric:'dórico',aeolic:'eólico',
 homeric:'homérico',adverb:'adverbio',prep:'preposición',conj:'conjunción',
 indeclform:'indeclinable'
};
function describe(raw){
 return String(raw||'').replace(/[a-z]+(?:\/[a-z]+)*/gi,t=>
  t.split('/').map(w=>dictionary[w]||w).join('/')).trim().slice(0,240);
}
function fingerprint(data){
 if(data?.schema!==1||!data.vocabulary?.grc)throw Error('Falta el vocabulario de Griego I');
 const names=Object.entries(data.vocabulary.grc).filter(([,r])=>r.gr1)
  .map(([key,r])=>key+'='+r.gr1.entry).sort();
 // Hash estable; solo identifica cambios en el catálogo, no autentica los datos.
 let h=2166136261;
 for(const char of names.join('|'))h=Math.imul(h^char.charCodeAt(0),16777619)>>>0;
 return names.length+':'+h.toString(16);
}
function extractor(data,morphologies){
 const catalog=data.vocabulary.grc,ids=new Map(),rows=[],seen=new Set();
 let matched=0;
 function lemmas(text){
  for(const line of String(text||'').split('\n')){
   if(!line)continue;const [id,beta]=line.split('\t');
   if(!beta)continue;
   const g=title(betaToGreek(beta)),key=norm(g);
   if(!catalog[key]?.gr1)continue;
   // θέα 'vista' y θεά 'diosa' son lemas distintos pese a perder
   // ambos los acentos con la normalización de consulta.
   if(key==='θεα'&&g.toLocaleLowerCase('el')!=='θεά')continue;
   const n=parseInt(id,36);
   if(!Number.isSafeInteger(n))continue;
   ids.set(n,{lemma:g,key});matched++;
  }
 }
 function forms(text){
  for(const line of String(text||'').split('\n')){
   const i=line.indexOf('\t');if(i<1)continue;
   const form=betaToGreek(line.slice(0,i));
   if(!form||form.length>80||!/^\p{L}[\p{L}\p{M}]*$/u.test(form))continue;
   for(const reading of line.slice(i+1).split(';')){
    if(!reading||reading.includes('-'))continue; // Lemas compuestos no reconstruidos.
    const [a,b]=reading.split('.');
    if(!a||!b)continue;
    const lemma=ids.get(parseInt(a,36)),morph=morphologies[parseInt(b,36)];
    if(!lemma||typeof morph!=='string')continue;
    const analysis=describe(morph);
    if(!analysis)continue;
    const sig=norm(form)+'|'+lemma.key+'|'+analysis;
    if(seen.has(sig))continue;
    seen.add(sig);rows.push([form,lemma.lemma,analysis]);
    if(rows.length>250000)throw Error('Índice de Eulexis inesperadamente grande');
   }
  }
 }
 return {lemmas,forms,result:()=>({rows,matched,count:rows.length})};
}
function openDb(){
 return new Promise((resolve,reject)=>{
  if(!root.indexedDB)return reject(Error('Este navegador no permite guardar datos locales.'));
  const request=root.indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains(TABLE))request.result.createObjectStore(TABLE);
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('No se pudo abrir IndexedDB'));
 });
}
async function localGet(){
 const db=await openDb();
 try{return await new Promise((resolve,reject)=>{
  const r=db.transaction(TABLE,'readonly').objectStore(TABLE).get(SLOT);
  r.onsuccess=()=>resolve(r.result||null);
  r.onerror=()=>reject(r.error||Error('No se pudo recuperar Eulexis'));
 })}finally{db.close()}
}
async function localPut(record){
 const db=await openDb();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(TABLE,'readwrite');
  tx.objectStore(TABLE).put(record,SLOT);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('No se pudo conservar Eulexis'));
  tx.onabort=()=>reject(tx.error||Error('Se agotó el almacenamiento local'));
 })}finally{db.close()}
}
async function localClear(){
 const db=await openDb();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(TABLE,'readwrite');
  tx.objectStore(TABLE).delete(SLOT);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('No se pudo borrar el índice'));
 })}finally{db.close()}
}
function convert(record){
 return {revision:record.revision,rows:record.rows.map(([form,lemma,analysis])=>
  ({form,lemma,analysis,source:'Eulexis · instalado en este navegador'})),count:record.rows.length};
}
async function load(data){
 const cached=await localGet();
 if(!cached||cached.schema!==1||cached.revision!==REVISION||
  cached.fingerprint!==fingerprint(data)||!Array.isArray(cached.rows))return null;
 return convert(cached);
}
async function requestText(path){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),45000);
 try{
  const response=await fetch(BASE+path,{signal:controller.signal,cache:'force-cache'});
  if(!response.ok)throw Error('No se pudo leer '+path+' (HTTP '+response.status+')');
  return await response.text();
 }finally{clearTimeout(timeout)}
}
async function pool(n,path,consume,onProgress,phase,fetcher){
 let cursor=0,done=0;
 const work=async()=>{
  while(cursor<n){
   const i=cursor++,name=path+i+'.txt';
   let value;
   try{value=await fetcher(name)}
   catch(e){
    try{value=await fetcher(name)}
    catch(other){throw Error('Descarga interrumpida en '+name+': '+other.message)}
   }
   consume(value);done++;
   onProgress?.(phase+' '+done+'/'+n);
  }
 };
 await Promise.all(Array.from({length:Math.min(5,n)},()=>work()));
}
let installing=null;
async function install(data,onProgress,opts={}){
 if(installing)return installing;
 installing=(async()=>{
  const key=fingerprint(data);
  if(!opts.force){const prior=await load(data).catch(()=>null);if(prior)return prior}
  const get=opts.fetchText||requestText;
  onProgress?.('Leyendo las etiquetas morfológicas…');
  const morphologies=JSON.parse(await get('data/morph.json'));
  if(!Array.isArray(morphologies)||morphologies.length<1)
   throw Error('Las etiquetas originales de Eulexis no son válidas');
  const x=extractor(data,morphologies);
  await pool(NL,'data/l/',x.lemmas,onProgress,'Lemas',get);
  await pool(NF,'data/f/',x.forms,onProgress,'Formas',get);
  const result=x.result();
  if(result.count===0||result.matched===0)throw Error('Eulexis no aportó análisis del temario');
  onProgress?.('Guardando '+result.count+' análisis en este dispositivo…');
  await localPut({schema:1,revision:REVISION,fingerprint:key,rows:result.rows});
  return convert({revision:REVISION,rows:result.rows});
 })().finally(()=>{installing=null});
 return installing;
}
root.ExaminaEulexisLocal={install,load,clear:localClear,
 betaToGreek,norm,describe,extractor,fingerprint,revision:REVISION,
 repository:'https://github.com/genuensis/lector-griego'};
})(window);
