#!/usr/bin/env node
/* Generación OPTATIVA y local de un índice de consulta Eulexis para las tarjetas.
 * NO incorporar la salida al repositorio público sin verificar derechos sobre
 * data/f, data/l y los corpus Diogenes/Perseus de procedencia.
 * No copia glosas de diccionarios. Necesita conexión solo al construir el archivo.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const revision='e3ca505b0e028af68a800673f5dc4565b0b05104';
const source='https://github.com/genuensis/lector-griego.git';
const target=path.join(root,'private','eulexis-review.json');
const norm=s=>String(s||'').toLocaleLowerCase('el').normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ').replace(/\d+$/,'');
async function main(){
 const teacher=JSON.parse(await fs.readFile(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
 const covered=new Set(Object.entries(teacher.vocabulary.grc).filter(([,x])=>!!x.gr1).map(([k])=>norm(k)));
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'eulexis-review-'));
 try{
  execFileSync('git',['init','-q',temp],{timeout:20000});
  execFileSync('git',['-C',temp,'fetch','-q','--depth=1',source,revision],
   {timeout:240000});
  execFileSync('git',['-C',temp,'checkout','-q','--detach','FETCH_HEAD'],{timeout:30000});
  const original=await fs.readFile(path.join(temp,'greek.js'),'utf8');
  const sandbox={window:{},module:{exports:{}},console};
  vm.runInNewContext(original,sandbox,{filename:'upstream/greek.js',timeout:30000});
  const {betaToUni,esMorph}=sandbox.module.exports;
  if(typeof betaToUni!=='function'||typeof esMorph!=='function')throw Error('API upstream inesperada');
  const morphologies=JSON.parse(await fs.readFile(path.join(temp,'data/morph.json'),'utf8'));
  const lemmas=new Map();
  for(let i=0;i<32;i++){
   const lines=(await fs.readFile(path.join(temp,'data/l',i+'.txt'),'utf8')).split('\n');
   for(const line of lines){
    if(!line)continue;
    const [id,beta]=line.split('\t');
    const lemma=betaToUni(beta||'').replace(/\d+$/,'');
    if(covered.has(norm(lemma)))lemmas.set(parseInt(id,36),lemma);
   }
  }
  const out=[],seen=new Set();
  for(let i=0;i<128;i++){
   const lines=(await fs.readFile(path.join(temp,'data/f',i+'.txt'),'utf8')).split('\n');
   for(const line of lines){
    if(!line)continue;
    const tab=line.indexOf('\t');if(tab<1)continue;
    const form=betaToUni(line.slice(0,tab));
    if(!form||form.length>80)continue;
    for(const reading of line.slice(tab+1).split(';')){
     if(!reading||reading.includes('-'))continue; // prefijos compuestos no reconstruidos
     const [lid,mid]=reading.split('.');
     const lemma=lemmas.get(parseInt(lid,36)),raw=morphologies[parseInt(mid,36)];
     if(!lemma||typeof raw!=='string')continue;
     const display=esMorph(raw);
     const analysis=(display.morpho||raw)+(display.dial?' · '+display.dial:'');
     if(!analysis||analysis.length>250)continue;
     const key=[norm(form),norm(lemma),analysis].join('|');
     if(seen.has(key))continue;
     seen.add(key);out.push({form,lemma,analysis});
    }
   }
  }
  if(!out.length)throw Error('No se encontraron lemas griegos del temario');
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,JSON.stringify({schema:'examina-eulexis-review/v1',
   source:{repository:'genuensis/lector-griego',revision,engine:'Eulexis / Diogenes / Perseus',
    note:'Archivo local de consulta; no distribuir sin verificar licencia de los datos'},
   rows:out})+'\n','utf8');
  const stat=await fs.stat(target);
  console.log('Índice local de revisión creado:',target,'·',out.length,'análisis ·',stat.size,'bytes');
  if(stat.size>16000000)console.warn('Supera 16 MB: el navegador no admitirá esta importación completa.');
 }finally{await fs.rm(temp,{recursive:true,force:true})}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
