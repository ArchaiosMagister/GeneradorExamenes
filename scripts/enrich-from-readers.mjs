#!/usr/bin/env node
/* Amplía, durante la COMPILACIÓN, el índice morfológico docente.
 * Collatinus 11 y Eulexis se consultan como fuentes contrastables, sin copiar
 * ni cargar sus motores en la PWA. Los resultados son análisis de referencia,
 * nunca soluciones automáticas de examen.
 * Revisiones inmóviles: genuensis/lector-latino 6e3a05c55dfd0514d1bd507a246172f103b49e92
 *                    genuensis/lector-griego e3ca505b0e028af68a800673f5dc4565b0b05104
 * Origen/licencia indicada en docs/lematizacion-lectores.md.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'data/lemmas/teacher-forms.json');
const REVISIONS={
 latin:['genuensis/lector-latino','6e3a05c55dfd0514d1bd507a246172f103b49e92'],
 greek:['genuensis/lector-griego','e3ca505b0e028af68a800673f5dc4565b0b05104']
};
const normalize=s=>String(s||'').toLocaleLowerCase('el').normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe')
 .replace(/ς/g,'σ').replace(/[^\p{L}]/gu,'');
const keyLat=s=>normalize(s).replace(/v/g,'u').replace(/j/g,'i');
const latinSurface=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').replace(/[˘¯]/g,'').normalize('NFC');
const greekHead=s=>normalize(s.split(/[,+(]/)[0].trim().split('/')[0]);
const read=(dir,file)=>fs.readFile(path.join(dir,file),'utf8');
const warn=message=>process.stderr.write('[enriquecimiento] '+message+'\n');
function checkout(rootDir,label,[repository,revision]){
 const dest=path.join(rootDir,label);
 execFileSync('git',['init','-q',dest],{stdio:'pipe',timeout:20000});
 execFileSync('git',['-C',dest,'fetch','-q','--depth=1','https://github.com/'+repository+'.git',revision],
  {stdio:'pipe',timeout:240000});
 execFileSync('git',['-C',dest,'checkout','-q','--detach','FETCH_HEAD'],{stdio:'pipe',timeout:30000});
 return dest;
}
function add(rows,catalog,lang,lemma,surface,tags,source,seen,counts){
 if(!catalog[lang]?.[lemma]||typeof surface!=='string')return false;
 const form=surface.normalize('NFC').trim();
 if(!form||form.length>48||!/^\p{L}[\p{L}\p{M}]*$/u.test(form))return false;
 const signature=[lemma,normalize(form),tags,source].join('\u0001');
 if(seen.has(signature))return false;
 seen.add(signature);
 rows[lang].push([lemma,form,tags,source]);
 counts[lang]++;
 return true;
}
async function latinIndex(data,dir,seen,counts){
 const source=await read(dir,'latin.js');
 const sandbox={window:{},module:{exports:{}},console};
 vm.runInNewContext(source,sandbox,{filename:'latin.js',timeout:30000});
 const LatinCore=sandbox.window.LatinCore||sandbox.module.exports.LemCore;
 if(!LatinCore)throw Error('Collatinus no expone LatinCore');
 const [modeles,lexique,extra,regimen]=await Promise.all([
  read(dir,'data/modeles.txt'),read(dir,'data/lexique.txt'),read(dir,'data/extra.json'),read(dir,'data/regimen.txt')
 ]);
 const core=new LatinCore();
 core.load(modeles,lexique,JSON.parse(extra),regimen);
 const teacherKeys=new Map();
 for(const lemma of Object.keys(data.vocabulary.lat)){
  const k=keyLat(lemma);
  if(!teacherKeys.has(k))teacherKeys.set(k,[]);
  teacherKeys.get(k).push(lemma);
 }
 const matched=new Map();
 for(const item of core.lemmes.values()){
  const keys=[item.cle,item.grq,...String(item.grq||'').split(',')]
   .map(x=>keyLat(x.replace(/\d+$/,'')));
  const teachers=[...new Set(keys.flatMap(k=>teacherKeys.get(k)||[]))];
  if(teachers.length===0||!item.modele)continue;
  matched.set(item,teachers);
  let forms=0;
  for(const radicals of item.radicaux.values()){
   for(const radical of radicals){
    if(forms>4000)break;
    for(const ends of item.modele.des.values()){
     for(const ending of ends){
      if(radical.num!==ending.numRad||item.irrExcl.has(ending.morpho))continue;
      const raw=latinSurface(radical.grq+ending.grq);
      // Conservar el prefijo original: los temarios escriben a menudo
      // 'v' consonántica donde Collatinus admite 'u'.
      const variants=new Set([raw]);
      variants.add(raw.replace(/^u(?=[aeiou])/,'v').replace(/^U(?=[AEIOU])/,'V')
       .replace(/([aeiou])u(?=[aeiou])/g,'$1v'));
      for(const lemma of teachers)for(const form of variants){
       if(add(data.rows,data.vocabulary,'lat',lemma,form,
        'COLLATINUS;'+String(ending.morpho),6,seen.lat,counts))forms++;
      }
     }
    }
   }
  }
 }
 for(const matches of core.irregs.values())for(const irr of matches){
  const teachers=matched.get(irr.lemme)||[];
  for(const lemma of teachers)for(const morph of irr.morphos){
   add(data.rows,data.vocabulary,'lat',lemma,latinSurface(irr.grq),
    'COLLATINUS;'+String(morph),6,seen.lat,counts);
  }
 }
 return {lexiconLemmas:core.lemmes.size,matchedTeacherEntries:[...new Set([...matched.values()].flat())].length};
}
async function greekIndex(data,dir,seen,counts){
 const source=await read(dir,'greek.js');
 const sandbox={window:{},module:{exports:{}},console};
 vm.runInNewContext(source,sandbox,{filename:'greek.js',timeout:30000});
 const util=sandbox.window.GreekUtil||sandbox.module.exports;
 if(!util?.betaToUni)throw Error('No se encontró el conversor Betacode de Eulexis');
 const betaToUni=util.betaToUni;
 const idToLemma=new Map(),catalog=data.vocabulary.grc;
 for(let i=0;i<32;i++){
  const txt=await read(dir,'data/l/'+i+'.txt');
  for(const line of txt.split('\n')){
   if(!line)continue;
   const parts=line.split('\t');
   const lemma=greekHead(betaToUni(parts[1]||''));
   if(catalog[lemma])idToLemma.set(parseInt(parts[0],36),lemma);
  }
 }
 let usedFormShards=0;
 for(let i=0;i<128;i++){
  const txt=await read(dir,'data/f/'+i+'.txt');
  usedFormShards++;
  for(const line of txt.split('\n')){
   if(!line)continue;
   const split=line.indexOf('\t');
   if(split<1)continue;
   const surface=betaToUni(line.slice(0,split));
   const encoded=line.slice(split+1).split(';');
   for(const item of encoded){
    if(!item||item.includes('-'))continue; // Compuestos: no inventar el prefijo del lema.
    const [lid,mid]=item.split('.');
    const lemma=idToLemma.get(parseInt(lid,36));
    if(!lemma)continue;
    const morph=parseInt(mid,36);
    if(!Number.isInteger(morph))continue;
    add(data.rows,data.vocabulary,'grc',lemma,surface,'EULEXIS;'+morph,7,seen.grc,counts);
   }
  }
 }
 return {matchedTeacherEntries:new Set(idToLemma.values()).size,formShards:usedFormShards};
}
async function main(){
 const data=JSON.parse(await fs.readFile(target,'utf8'));
 if(data.schema!==1||!data.vocabulary?.lat||!data.vocabulary?.grc)throw Error('Índice base inválido');
 // El corpus compartido original no incluye algunos lemas que sí figuran
 // literalmente en el banco editable de la aplicación, sobre todo griegos.
 // Incorporar solo palabras individuales con grafía inequívoca: los nombres
 // compuestos, frases, alternativas con «o» y erratas permanecen aparte.
 const html=await fs.readFile(path.join(root,'index.html'),'utf8');
 const first=html.indexOf('let vocab=')+'let vocab='.length;
 if(first<10)throw Error('No se encuentra el banco docente de index.html');
 const bank=JSON.parse(html.slice(first,html.indexOf(';',first)));
 for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(m[1]));
 const additions={lat:0,grc:0};
 for(const record of bank){
  const course=record.course==='greek1'?'gr1':record.course==='latin4'?'lat4':'lat1';
  const lang=course==='gr1'?'grc':'lat';
  const cited=String(record.entry||'').split(',')[0].trim()
   .replace(/\s+[–−—-]\s*\([^)]*\)$/u,'').trim();
  if(!/^[\p{L}\p{M}]+$/u.test(cited))continue;
  const lemma=normalize(cited);
  if(!lemma)continue;
  if(!data.vocabulary[lang][lemma]){
   data.vocabulary[lang][lemma]={};
   additions[lang]++;
  }
  if(!data.vocabulary[lang][lemma][course])
   data.vocabulary[lang][lemma][course]={entry:record.entry,units:[]};
  const unit=String(record.unit||'');
  if(/^UD\s*\d+/i.test(unit)){
   const units=data.vocabulary[lang][lemma][course].units;
   if(!units.includes(unit))units.push(unit);
  }
 }
 const seen={lat:new Set(),grc:new Set()};
 for(const lang of ['lat','grc'])for(const [lemma,form,tags,source] of data.rows[lang])
  seen[lang].add([lemma,normalize(form),tags,source].join('\u0001'));
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'examina-lector-'));
 const counts={lat:0,grc:0};
 try{
  const latinDir=checkout(tmp,'latin',REVISIONS.latin);
  const greekDir=checkout(tmp,'greek',REVISIONS.greek);
  const latin=await latinIndex(data,latinDir,seen,counts);
  const greek=await greekIndex(data,greekDir,seen,counts);
  data.source.readers={
   latin:{repository:REVISIONS.latin[0],revision:REVISIONS.latin[1],
    engine:'Collatinus 11',license:'GNU GPL-3.0',sourceCode:6},
   grc:{repository:REVISIONS.greek[0],revision:REVISIONS.greek[1],
    engine:'Eulexis / Diogenes / Perseus',license:'GNU GPL-3.0 (ver documentación de procedencia)',sourceCode:7}
  };
  data.extensions.readerEnrichment={counts,latin,greek,additions,
   note:'Análisis de fuentes externas: no son decisiones docentes ni soluciones automáticas de exámenes.'};
  data.scope+=' Incluye formas de Collatinus y Eulexis filtradas por lemas de clase; no es un diccionario exhaustivo.';
  for(const lang of ['lat','grc'])data.rows[lang].sort((a,b)=>
   a[0].localeCompare(b[0])||normalize(a[1]).localeCompare(normalize(b[1]))||a[2].localeCompare(b[2]));
  await fs.writeFile(target,JSON.stringify(data)+'\n');
  console.log('Ampliación Collatinus/Eulexis:',JSON.stringify({counts,latin,greek,
   total:{lat:data.rows.lat.length,grc:data.rows.grc.length}}));
 }finally{await fs.rm(tmp,{recursive:true,force:true})}
}
main().catch(e=>{warn(e.stack||e.message);process.exitCode=1});