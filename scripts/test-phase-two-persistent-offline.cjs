'use strict';
// Fase II: lo publicado sin conexión debe reproducir la misma evidencia
// individual que el banco persistente y el generador web.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');
const corpus=JSON.parse(read('data/lemmas/teacher-forms.json'));
const source=JSON.parse(read('data/lemmas/verified-overrides.json'));
const index=read('index.html');
const offline=read('offline.html');
const marker='<script id="examina-offline-assets" type="application/json">';
const a=offline.indexOf(marker),b=offline.indexOf('</script>',a+marker.length);
assert(a>=0&&b>a,'La PWA autónoma no incorpora los datos vigentes');
const bundled=JSON.parse(offline.slice(a+marker.length,b));
assert.deepEqual(bundled['data/lemmas/teacher-forms.json'],corpus,
 'El índice morfológico del HTML autónomo está obsoleto');
assert(corpus.source.externalVerification.length>=source.paradigms.length,
 'Faltan registros de procedencia de las fuentes verificadas');
for(const lang of ['lat','grc']){
 const total=Object.values(corpus.counts[lang]).reduce((sum,n)=>sum+n,0);
 assert.equal(total,corpus.rows[lang].length,'Recuento de datos incongruente: '+lang);
}
for(const record of source.paradigms){
 assert(corpus.source.externalVerification.some(ref=>ref.lang===record.lang&&
  ref.lemma===record.lemma&&ref.reference===record.reference),
  'Referencia ausente en el índice: '+record.lemma);
 for(const block of record.blocks){
  for(let i=0;i<6;i++){
   const expected=block.tags+';'+(i%3+1)+';'+(i<3?'SG':'PL');
   const occurrences=corpus.rows[record.lang].filter(row=>
    row[0]===record.lemma&&row[1]===block.forms[i]&&row[2]===expected&&row[3]===5);
   assert.equal(occurrences.length,1,
    'Casilla contrastada ausente/duplicada: '+record.lemma+' '+expected);
  }
 }
}
for(const [name,after] of [
 ['latinExplicitVerbEvidence','function latinExplicitVerbRows(chosen)'],
 ['greekExplicitVerbEvidence','function greekCorpus()']
]){
 const pattern=new RegExp('const '+name+'=(\\{[^\\n]+\\});\\n'+after.replace(/[.*+?^$|()[\\]{}]/g,'\\$&'));
 const online=index.match(pattern),local=offline.match(pattern);
 assert(online&&local,'No se encuentra el modelo explícito '+name);
 assert.deepEqual(JSON.parse(local[1]),JSON.parse(online[1]),
  'El paradigma embebido está obsoleto: '+name);
}
assert(offline.includes("const latinDeponentSyncretisms=new Set(['loquor|loqueris','sequor|sequeris','proficiscor|proficisceris']);"),
 'Las advertencias de sincretismo no llegaron a la PWA offline');
console.log('Fase II: fuentes, casillas individuales, contadores, modelos y versión offline coinciden.');
