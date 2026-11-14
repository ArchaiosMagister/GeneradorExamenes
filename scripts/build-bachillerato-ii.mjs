import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFile(path.join(root,p),'utf8');
const greekRows=(await read('data/bachillerato-ii/greek-corpus.tsv')).split(/\r?\n/)
 .filter(l=>l&&!l.startsWith('#')).map((l,i)=>{
  const [entry,meaning,forms,...rest]=l.split('|');
  if(!entry||!meaning||!forms||rest.length)throw Error('Fila griega inválida: '+(i+1));
  return {entry,meaning,forms:forms.split(/\s+/u)};
 });
const grouped=new Map();
for(const row of greekRows){
 const prior=grouped.get(row.entry);
 if(prior){if(prior.meaning!==row.meaning)throw Error('Glosas incompatibles: '+row.entry);prior.forms=[...new Set([...prior.forms,...row.forms])]}
 else grouped.set(row.entry,row);
}
const greek=[...grouped.values()];
const latin=JSON.parse(await read('data/bachillerato-ii/latin-paradigms.json'));
const latinGlosses=Object.fromEntries((await read('data/bachillerato-ii/latin-glosses.tsv'))
 .split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>l.split('|')));
const common=(await read('data/bachillerato-ii/common-invariables.tsv')).split(/\r?\n/)
 .filter(l=>l&&!l.startsWith('#')).map(line=>{
  const [lang,lemma,category,meaning,meaning_va,variants,...rest]=line.split('|');
  if(!['lat','grc'].includes(lang)||!lemma||!category||!meaning||!meaning_va||!variants||rest.length)
   throw Error('Invariable común inválida: '+line);
  return {lang,lemma,entry:lemma+' ('+category+')',meaning,meaning_va,forms:variants.split(/\s+/u)};
 });
for(const lang of ['lat','grc']){
 const items=common.filter(x=>x.lang===lang);
 if(items.length!==20||new Set(items.map(x=>x.lemma)).size!==20)throw Error('Se requieren 20 lemas nuevos distintos: '+lang);
}
const metadata={commonLatin:20,commonGreek:20,greekEntries:greek.length,greekForms:new Set(greek.flatMap(x=>x.forms)).size,
 greekStatus:'Propuestas léxicas de los repasos Lisias, Platón y Apolodoro; sin acreditación morfológica automática',
 latinParadigms:latin.records,latinEntries:latin.items.length,latinSource:latin.source,
 latinScope:'Inventarios morfológicos PAU y cuaderno; no contiene sus textos completos'};
const runtime=await read('scripts/bachillerato-ii-runtime.js');
await fs.writeFile(path.join(root,'bachillerato-ii.js'),runtime.replace('__BACHILLERATO_II_DATA__',
 JSON.stringify({greek,latin,latinGlosses,common,metadata}).replace(/</g,'\\u003c')));
console.log(metadata);
