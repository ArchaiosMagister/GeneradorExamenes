// Importación explícita del artefacto de buildMorphology de ScholaClassica.
// No descarga fuentes ni genera paradigmas. Ejecutar con la ruta a paradigmas.json.
import fs from 'node:fs/promises';
const file=process.argv[2];
if(!file)throw Error('Uso: node scripts/import-latin-ii.mjs /ruta/ScholaClassica/dist/apps/morfologia/data/paradigmas.json');
const bank=JSON.parse(await fs.readFile(file,'utf8'));
const records=bank.records.filter(r=>r.language==='latin2');
if(!records.length||records.some(r=>r.evidence?.status!=='paradigma-documentado'))throw Error('Banco de origen no acreditado');
const groups=new Map();
for(const r of records){
 const entry=r.headword||r.paradigm;
 const item=groups.get(entry)||{entry,kind:r.kind,forms:[],sources:[]};
 const seen=new Set(item.forms.map(f=>f.join('|')));
 for(const f of r.forms){
  const tags=[r.kind,f.case,f.number,f.gender].filter(Boolean).join(';');
  // Los tiempos verbales se conservan en el origen; este índice es léxico.
  const tuple=[f.form,tags];if(!seen.has(tuple.join('|'))){item.forms.push(tuple);seen.add(tuple.join('|'))}
 }
 if(!item.sources.includes(r.evidence.source))item.sources.push(r.evidence.source);
 groups.set(entry,item);
}
await fs.writeFile('data/bachillerato-ii/latin-paradigms.json',JSON.stringify({schema:1,
 source:{repository:'ArchaiosMagister/ScholaClassica',revision:process.env.SCHOLA_REVISION||'unknown',
  file:'dist/apps/morfologia/data/paradigmas.json',appendixSha:bank.appendixSha,vocabulaSha:bank.vocabulaSha,
  note:'Índice léxico de paradigmas documentados; no sustituye la evaluación morfológica. UniMorph: CC BY-SA 3.0; conservar atribución.'},
 records:records.length,items:[...groups.values()]})+'\n');
console.log(records.length+' paradigmas; '+groups.size+' enunciados.');
