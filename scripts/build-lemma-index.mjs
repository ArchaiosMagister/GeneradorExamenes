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
import {proposeRegularLatin} from './regular-latin.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const commit='8f1a7a3985e0bb60231d83daa85e422868c97683';
const base='https://raw.githubusercontent.com/ArchaiosMagister/VocabulaLatinaGraecaque/'+commit+'/';
const output=path.join(root,'data/lemmas/teacher-forms.json');
const greekCandidatePath=path.join(root,'data/lemmas/greek-nominal-candidates.json');
const verifiedOverridesPath=path.join(root,'data/lemmas/verified-overrides.json');
const greekEditorialPath=path.join(root,'data/lemmas/greek-editorial-decisions.json');
const latinEditorialPath=path.join(root,'data/lemmas/latin-editorial-decisions.json');
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
 const overrides=JSON.parse(await fs.readFile(verifiedOverridesPath,'utf8'));
 if(overrides.schema!==1||overrides.sourceCode!==5||!Array.isArray(overrides.entryCorrections)||!Array.isArray(overrides.paradigms)||
    !Array.isArray(overrides.singleForms))
  throw Error('Listado de formas contrastadas inválido');
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
 // Las correcciones aprobadas se mantienen separadas del repositorio fuente
 // para que reconstruir el índice no vuelva a introducir las erratas.
 for(const item of overrides.entryCorrections){
  const slot=catalog[item.lang]?.[item.lemma]?.[item.course];
  if(!slot||![item.from,item.to].includes(slot.entry))throw Error('Corrección sin entrada reconocible: '+item.lemma);
  slot.entry=item.to;
 }
 // Las decisiones docentes cambian el lema y el enunciado, nunca
 // autentican por sí solas las formas de un paradigma latino.
 const latinEditorial=JSON.parse(await fs.readFile(latinEditorialPath,'utf8'));
 if(latinEditorial.schema!==1||latinEditorial.course!=='lat1'||
    latinEditorial.verifiedMorphology!==false||
    !Array.isArray(latinEditorial.decisions)||!latinEditorial.decisions.length)
  throw Error('Decisiones editoriales latinas inválidas');
 const latinEditorialLemmaRekeys=new Map();
 for(const decision of latinEditorial.decisions){
  if(decision.type!=='entry'||decision.verifiedMorphology!==false||
     head(decision.fromEntry)!==decision.fromLemma||
     head(decision.toEntry)!==decision.toLemma||
     decision.fromLemma===decision.toLemma)
   throw Error('Decisión latina mal formada: '+decision.id);
  const original=catalog.lat[decision.fromLemma],revised=catalog.lat[decision.toLemma];
  if(original?.lat1){
   if(revised||original.lat1.entry!==decision.fromEntry||
      JSON.stringify([...original.lat1.units].sort())!==JSON.stringify([...decision.units].sort()))
    throw Error('La ficha latina cambió inesperadamente: '+decision.id);
   catalog.lat[decision.toLemma]={...original,lat1:{...original.lat1,entry:decision.toEntry}};
   delete catalog.lat[decision.fromLemma];
  }else if(!revised?.lat1||revised.lat1.entry!==decision.toEntry){
   throw Error('No se puede reproducir la decisión latina: '+decision.id);
  }
  latinEditorialLemmaRekeys.set(decision.fromLemma,decision.toLemma);
 }
 for(const lang of ['lat','grc'])if(Object.keys(catalog[lang]).length!==manifest.languages[lang].vocabulary_lemmas)
  throw Error('Inventario de lemas distinto del manifiesto: '+lang+' '+Object.keys(catalog[lang]).length);
 // Las correcciones filológicas aprobadas NO proceden del índice externo fijado.
 // Aplicarlas en cada compilación preserva las elecciones sin falsear UniMorph
 // ni declarar contrastadas las nuevas flexiones. Validar siempre la fuente.
 const greekEditorial=JSON.parse(await fs.readFile(greekEditorialPath,'utf8'));
 if(greekEditorial.schema!==1||greekEditorial.course!=='gr1'||
    greekEditorial.verifiedMorphology!==false||!Array.isArray(greekEditorial.decisions)||
    greekEditorial.decisions.length!==19)throw Error('Revisión editorial griega desconocida');
 const replacedGreekKeys=new Set(),suspendedGreekCandidates=new Set();
 let greekEditorialAdded=0,greekEditorialRekeyed=0;
 for(const item of greekEditorial.decisions){
  if(item.course!=='gr1'||typeof item.entry!=='string'||typeof item.original!=='string')
   throw Error('Decisión editorial sin curso o entrada: '+item.id);
  const previous=head(item.original),next=head(item.entry);
  if(!previous||!next)throw Error('Lema editorial inválido: '+item.id);
  const existing=catalog.grc[previous]?.gr1;
  if(item.sourceEntry===null){
   if(existing||catalog.grc[next])throw Error('Una entrada supuestamente ausente ya existe: '+item.id);
   catalog.grc[next]={gr1:{entry:item.entry,units:[]}};
   greekEditorialAdded++;
  }else{
   if(!existing||![item.sourceEntry,item.entry].includes(existing.entry))
    throw Error('Entrada fuente inesperada al regenerar: '+item.id+' ('+(existing?.entry||'ausente')+')');
   if(previous!==next){
    if(catalog.grc[next])throw Error('Colisión entre lemas editoriales: '+item.id);
    catalog.grc[next]=catalog.grc[previous];
    delete catalog.grc[previous];
    replacedGreekKeys.add(previous);
    greekEditorialRekeyed++;
   }
   catalog.grc[next].gr1.entry=item.entry;
  }
  if(item.candidatePolicy==='suppress-source-4')
   suspendedGreekCandidates.add(next);
  else if(item.candidatePolicy)throw Error('Política de candidatas no reconocida: '+item.id);
 }
 const rows={lat:[],grc:[]};
 const counts={lat:{unimorph:0,docente:0,modelo:0,lema:0,contrastado:0},grc:{unimorph:0,docente:0,modelo:0,lema:0,wikcionario:0,contrastado:0}};
 const seen={lat:new Set(),grc:new Set()};
 function add(lang,lemma,form,features,source){
  if(!['lat','grc'].includes(lang)||typeof form!=='string'||!form.trim()||typeof features!=='string')return;
  const original=head(lemma);
  const k=lang==='lat'?(latinEditorialLemmaRekeys.get(original)||original):original;
  if(!catalog[lang][k])return;
  const sig=k+'\u0001'+norm(form)+'\u0001'+features+'\u0001'+source;
  if(seen[lang].has(sig))return;
  seen[lang].add(sig);
  rows[lang].push([k,form,features,({unimorph:0,docente:1,modelo:2,lema:3,wikcionario:4,contrastado:5})[source]]);
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
 // Incorporar exclusivamente casillas publicadas con fuente y rasgos completos.
 // No extender por analogía a otras personas, tiempos ni verbos.
 const externalReferences=[];
 for(const record of overrides.paradigms){
  if(!['lat','grc'].includes(record.lang)||!catalog[record.lang]?.[record.lemma]||!/^https:\/\//.test(record.reference))
   throw Error('Referencia externa desconocida: '+record.lemma);
  externalReferences.push({lang:record.lang,lemma:record.lemma,reference:record.reference});
  for(const block of record.blocks){
   if(!/^V;IND;(?:ACT|MID);(?:PRS|PST;IPFV|FUT|PRF|PSTP)$/.test(block.tags)||block.forms.length!==6)
    throw Error('Paradigma contrastado sin seis casillas completas: '+record.lemma);
   for(let i=0;i<6;i++){
    const form=block.forms[i];
    if(typeof form!=='string'||!form.trim()||!/^\p{L}[\p{L}\p{M}]*$/u.test(form))
     throw Error('Forma contrastada inválida: '+record.lemma+' '+form);
    const features=block.tags+';'+String((i%3)+1)+';'+(i<3?'SG':'PL');
    add(record.lang,record.lemma,form,features,'contrastado');
   }
  }
 }
 // Revisiones individuales: una única superficie, un lema y una lectura
 // respaldada por una referencia explícita. No completar otras casillas del
 // paradigma por analogía ni modificar los enunciados del profesor.
 const verifiedSingleKeys=new Set();
 for(const record of overrides.singleForms){
  if(record.lang!=='lat'||!catalog[record.lang]?.[record.lemma]||
     typeof record.form!=='string'||!/^https:\/\//.test(record.reference)||
     !(/^(?:V;IMP;ACT;PRS;2;PL|V;PTCP;(?:ACT|PASS);PRF;(?:NOM|GEN|DAT|ACC|ABL|VOC);(?:SG|PL)(?:;(?:MASC|FEM|NEUT))?|N;(?:NOM|GEN|DAT|ACC|ABL|VOC);(?:SG|PL))$/.test(record.tags)))
   throw Error('Incidencia individual sin documentación o rasgos explícitos: '+record.lemma);
  const k=record.lemma+'|'+norm(record.form);
  if(verifiedSingleKeys.has(k))throw Error('Forma duplicada en la revisión individual: '+k);
  verifiedSingleKeys.add(k);
  externalReferences.push({lang:record.lang,lemma:record.lemma,form:record.form,
   reference:record.reference});
  add(record.lang,record.lemma,record.form,record.tags,'contrastado');
 }
 // Preserve lexicon citation forms even when a lemma has no attested
 // inflections. Citation is NOT a verified morphological analysis.
 const verifiedByLang={
  lat:new Set(rows.lat.map(row=>row[0])),
  grc:new Set(rows.grc.map(row=>row[0]))
 };
 const extensions={candidate_lemmas:0,candidate_rows:0,rejected_for_conflict:[],
  citation_only:{lat:0,grc:0},
  warning:'Generated forms are provisional lookup suggestions, NEVER exam solutions.'};
 extensions.verifiedIndividualForms=overrides.singleForms.length;
 const verifiedCells=new Map();
 for(const [lemma,surface,features]of rows.lat){
  const id=lemma+'|'+features;
  if(!verifiedCells.has(id))verifiedCells.set(id,new Set());
  verifiedCells.get(id).add(norm(surface));
 }
 for(const [lemma,v]of Object.entries(catalog.lat)){
  const entry=Object.values(v).sort((a,b)=>
   (b.entry.match(/,/g)||[]).length-(a.entry.match(/,/g)||[]).length)[0]?.entry;
  const proposals=proposeRegularLatin(lemma,entry);
  if(!proposals.length)continue;
  const contradictory=proposals.filter(([surface,feature])=>{
   const known=verifiedCells.get(lemma+'|'+feature);
   return known?.size&&!known.has(norm(surface));
  });
  if(contradictory.length){
   extensions.rejected_for_conflict.push({lemma,entry,features:contradictory.map(row=>row[1])});
   continue;
  }
  let accepted=0;
  for(const [surface,feature]of proposals){
   // Don't repeat a documented cell; the attested source takes priority.
   if(verifiedCells.has(lemma+'|'+feature))continue;
   add('lat',lemma,surface,feature,'modelo');
   accepted++;
  }
  if(accepted){extensions.candidate_lemmas++;extensions.candidate_rows+=accepted}
 }
 // The accented nominal forms have been extracted and screened separately:
 // they remain Wiktionary CANDIDATES (source 4), never exam solutions.
 let greekCandidateData;
 try{greekCandidateData=JSON.parse(await fs.readFile(greekCandidatePath,'utf8'))}
 catch(e){throw Error('Falta el extracto nominal griego (ejecuta build-greek-nominal-candidates.mjs): '+e.message)}
 if(greekCandidateData.schema!==1||
   greekCandidateData.status!=='WIKTIONARY_CANDIDATES_NOT_FOR_GRADING'||
   !Array.isArray(greekCandidateData.entries))
   throw Error('Las formas griegas no han superado la fase de preselección');
 const greekCountBefore=counts.grc.wikcionario;
 const documentedGreekSlots=new Map();
 for(const [lemma,form,tags,source] of rows.grc){
  if(![0,1].includes(source)||!/^N;|^ADJ;/.test(tags))continue;
  const k=lemma+'|'+tags;
  if(!documentedGreekSlots.has(k))documentedGreekSlots.set(k,new Set());
  documentedGreekSlots.get(k).add(norm(form));
 }
 for(const record of greekCandidateData.entries){
  // θέα ('vista') y θεά ('diosa') no comparten paradigma: no reciclar candidatas.
  if(suspendedGreekCandidates.has(record.lemma)||replacedGreekKeys.has(record.lemma))continue;
  if(!catalog.grc[record.lemma]||!['N','ADJ'].includes(record.kind)||!Array.isArray(record.forms))
   throw Error('Candidata griega ajena al inventario docente');
  for(const [surface,features] of record.forms){
   if(!new RegExp('^'+record.kind+';').test(features)||/;DU(?:;|$)/.test(features))continue;
   const prior=documentedGreekSlots.get(record.lemma+'|'+features);
   if(prior?.size)continue; // Never override a documented morphological slot.
   add('grc',record.lemma,surface,features,'wikcionario');
  }
 }
 extensions.greek_nominal_candidates={
  lemmas:greekCandidateData.entries.length,
  rows:counts.grc.wikcionario-greekCountBefore,
  license:greekCandidateData.license,
  attribution:greekCandidateData.attribution,
  status:greekCandidateData.status,
  source:greekCandidateData.source
 };
 extensions.latin_editorial_decisions={
  count:latinEditorial.decisions.length,
  rekeyedLemmas:latinEditorialLemmaRekeys.size,
  verifiedFormsAdded:0,
  note:'Decisiones editoriales del profesor sin certificación morfológica.'
 };
 extensions.greek_editorial_decisions={
  count:greekEditorial.decisions.length,
  addedCitationOnlyEntries:greekEditorialAdded,
  rekeyedLemmas:greekEditorialRekeyed,
  suspendedCandidateLemmas:[...suspendedGreekCandidates],
  verifiedFormsAdded:0,
  note:'Enunciados y significados aprobados por el docente; no verifican ninguna flexión.'
 };
 for(const lang of ['lat','grc']){
  for(const lemma of Object.keys(catalog[lang])){
   if(verifiedByLang[lang].has(lemma))continue;
   add(lang,lemma,lemma,'LEX;ENTRY','lema');
   extensions.citation_only[lang]++;
  }
 }
 for(const lang of ['lat','grc'])rows[lang].sort((a,b)=>
  a[0].localeCompare(b[0])||norm(a[1]).localeCompare(norm(b[1]))||a[2].localeCompare(b[2]));
 const data={
  schema:1,kind:'referencia-lematizacion-no-calificacion',
  source:{repository:'ArchaiosMagister/VocabulaLatinaGraecaque',revision:commit,
   externalVerification:externalReferences,
   unimorph:{
    lat:{revision:manifest.languages.lat.source_commit,license:'CC BY-SA 3.0'},
    grc:{revision:manifest.languages.grc.source_commit,license:'CC BY-SA 3.0'}
   }},
  scope:'UniMorph filtrado por lemas del vocabulario docente y paradigmas explícitos; no es un diccionario exhaustivo.',
  vocabulary:catalog,rows,counts,extensions
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
