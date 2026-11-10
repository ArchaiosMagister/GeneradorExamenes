#!/usr/bin/env node
/**
 * Builds an OFFLINE, reference-only lemmatization index for both classical
 * languages using the teacher-vocabulary-sharded UniMorph source.
 * Source is pinned to an immutable repository commit for reproducibility.
 * No internet access is required after data/lemmas/teacher-forms.json is built.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const commit='8f1a7a3985e0bb60231d83daa85e422868c97683';
const base='https://raw.githubusercontent.com/ArchaiosMagister/VocabulaLatinaGraecaque/'+commit+'/';
const output=path.join(root,'data/lemmas/teacher-forms.json');
const norm=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
 .replace(/ς/g,'σ').trim();
const head=s=>{const first=String(s||'').split(/[,+(]/)[0].trim().split('/')[0];return first&&!/\s/u.test(first)?norm(first):null};
async function fetchText(name){
 const url=base+name;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),45000);
   try{
    const res=await fetch(url,{signal:controller.signal});
    if(!res.ok)throw Error(name+': HTTP '+res.status);
    return await res.text();
   }finally{clearTimeout(timeout)}
  }catch(e){
   if(attempt===2)throw Error('No se pudo descargar '+name+': '+e.message);
   await new Promise(resolve=>setTimeout(resolve,350*(attempt+1)));
  }
 }
}
function arrayLiteral(source,marker){
 const start=source.indexOf(marker);
 if(start===-1)throw Error('Formato inesperado de '+marker);
 const left=source.indexOf('[',start),right=source.lastIndexOf(']');
 if(left<0||right<=left)throw Error('No se encontró el JSON de '+marker);
 return JSON.parse(source.slice(left,right+1));
}
async function main(){
 const [vocabSource,manifestSource,paradigmSource,latinSource,greekSource]=await Promise.all([
  fetchText('data.js'),
  fetchText('data/unimorph-syllabus/manifest.json'),
  fetchText('gramatica-paradigmas.js'),
  fetchText('gramatica-latin-imperfectos.js'),
  fetchText('gramatica-griego-ampliacion.js')
 ]);
 const manifest=JSON.parse(manifestSource);
 const vocabulary=arrayLiteral(vocabSource,'window.VOCAB=');
 const paradigms=[
  ...arrayLiteral(paradigmSource,'window.GRAMMAR_PARADIGMS='),
  ...arrayLiteral(latinSource,'window.GRAMMAR_PARADIGMS.push(...'),
  ...arrayLiteral(greekSource,'window.GRAMMAR_PARADIGMS.push(...')
 ];
 const catalog={lat:{},grc:{}};
 for(const entry of vocabulary){
  const lang=entry.subject==='gr1'?'grc':['lat1','lat4'].includes(entry.subject)?'lat':null;
  if(!lang)continue;
  const lemma=head(entry.form);
  if(!lemma)continue;
  const record=catalog[lang][lemma]||(catalog[lang][lemma]={});
  if(!record[entry.subject])record[entry.subject]={entry:entry.form,units:[]};
  const dst=record[entry.subject].units;
  for(const unit of entry.units||[]){
   if(!/^UD\s*[1-9]/.test(String(unit)))continue;
   if(!dst.includes(unit))dst.push(unit);
  }
 }
 for(const lang of ['lat','grc'])if(Object.keys(catalog[lang]).length!==manifest.languages[lang].vocabulary_lemmas)
  throw Error('Inventario de lemas distinto del manifiesto: '+lang+' '+Object.keys(catalog[lang]).length);
 const rows={lat:[],grc:[]};
 const counts={lat:{unimorph:0,docente:0},grc:{unimorph:0,docente:0}};
 const seen={lat:new Set(),grc:new Set()};
 function add(lang,lemma,form,features,source){
  if(!['lat','grc'].includes(lang)||typeof form!=='string'||!form.trim()||typeof features!=='string')return;
  const k=head(lemma);
  if(!catalog[lang][k])return;
  const sig=k+'\u0001'+norm(form)+'\u0001'+features+'\u0001'+source;
  if(seen[lang].has(sig))return;
  seen[lang].add(sig);
  rows[lang].push([k,form,features,source==='unimorph'?0:1]);
  counts[lang][source]++;
 }
 // Download all prefiltered teacher-vocabulary shards, keeping every attested
 // feature interpretation (including ambiguous ones) without guessing a lemma.
 for(const lang of ['lat','grc']){
  const n=manifest.languages[lang].part_count;
  const expected=manifest.languages[lang].retained_rows;
  let total=0;
  for(let first=0;first<n;first+=6){
   const batch=Array.from({length:Math.min(6,n-first)},(_,i)=>first+i);
   const parts=await Promise.all(batch.map(i=>fetchText(
    'data/unimorph-syllabus/'+lang+'/part-'+String(i).padStart(2,'0')+'.json'
   )));
   for(const raw of parts){
    const shard=JSON.parse(raw);
    for(const row of shard){
     total++;
     if(!Array.isArray(row)||row.length<3)throw Error('Fila UniMorph incorrecta');
     add(lang,row[0],row[1],row[2],'unimorph');
    }
   }
  }
  if(total!==expected||counts[lang].unimorph<expected*0.99)
   throw Error(lang+': filas inesperadas '+total+' de '+expected);
 }
 // Explicit teacher models also contribute forms when their lemma belongs to
 // the course vocabulary. Descriptions remain separate from UniMorph tags.
 for(const p of paradigms){
  const lang=p.lang==='lat'?'lat':p.lang==='grc'?'grc':null;
  if(!lang||!p.forms||!p.lemma)continue;
  for(const [feature,forms]of Object.entries(p.forms)){
   const interpretations=String(forms).split(/\s+\/\s+/);
   for(const x of interpretations){
    const alternatives=x.includes('(ν)')?[x.replaceAll('(ν)',''),x.replaceAll('(ν)','ν')]:[x];
    for(const surface of alternatives)add(lang,p.lemma,surface,
     'DOCENTE;'+String(p.desc||p.kind||'paradigma')+';'+feature,'docente');
   }
  }
 }
 for(const lang of ['lat','grc'])rows[lang].sort((a,b)=>
  a[0].localeCompare(b[0])||norm(a[1]).localeCompare(norm(b[1]))||a[2].localeCompare(b[2]));
 const data={
  schema:1,kind:'referencia-lematizacion-no-calificacion',
  source:{repository:'ArchaiosMagister/VocabulaLatinaGraecaque',revision:commit,
   unimorph:{
    lat:{revision:manifest.languages.lat.source_commit,license:'CC BY-SA 3.0'},
    grc:{revision:manifest.languages.grc.source_commit,license:'CC BY-SA 3.0'}
   }},
  scope:'UniMorph filtrado por lemas del vocabulario docente y paradigmas explícitos; no es un diccionario exhaustivo.',
  vocabulary:catalog,rows,counts
 };
 if(rows.lat.length<10000||rows.grc.length<1400)throw Error('Índice anormalmente pequeño');
 await fs.mkdir(path.dirname(output),{recursive:true});
 await fs.writeFile(output,JSON.stringify(data)+'\n','utf8');
 console.log('Lematización de referencia generada:',JSON.stringify({
  lemmas:{lat:Object.keys(catalog.lat).length,grc:Object.keys(catalog.grc).length},
  rows:{lat:rows.lat.length,grc:rows.grc.length},counts
 }));
}
main().catch(e=>{console.error(e);process.exitCode=1});
