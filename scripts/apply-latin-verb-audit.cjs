'use strict';
// Herramienta puntual y reproducible de la auditoría verbal de 21/11/2026.
// Solo cambia enunciados docentes contrastados. El índice se reconstruye aparte;
// nunca se promueven por esta vía formas individuales a "contrastadas".
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const save=(p,s)=>fs.writeFileSync(path.join(root,p),s);
const cases=[
 {course:'latin1',unit:'UD6',lemma:'fugio',
  from:'fugio, fugi – (4ª)',to:'fugio, fugi – (mx.)',
  ref:'https://www.usu.edu/markdamen/Latin1000/Presentation/transcriptions/10T.pdf'},
 {course:'latin1',unit:'UD9–10',lemma:'fugio',
  from:'fugio, fugi – (3ª)',to:'fugio, fugi – (mx.)',
  ref:'https://www.usu.edu/markdamen/Latin1000/Presentation/transcriptions/10T.pdf'},
 {course:'latin4',unit:'UD6',lemma:'retineo',
  from:'rĕtĭnĕō, retĭnŭī, retentum (3ª)',to:'rĕtĭnĕō, retĭnŭī, retentum (2ª)',
  ref:'https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n41493/'},
 {course:'latin1',unit:'UD11-12',lemma:'accedo',
  from:'accedo, accessi, acessum (3ª)',to:'accedo, accessi, accessum (3ª)',
  ref:'https://cld.bbaw.de/lemma/lat/accedo'},
 {course:'latin1',unit:'UD11-12',lemma:'accido',
  from:'accido, accidi, accesum (3ª)',to:'accido, accidi, – (3ª)',
  ref:'https://cld.bbaw.de/lemma/lat/accido'},
 {course:'latin1',unit:'UD11-12',lemma:'constituo',
  from:'constituo, constiti, constitutum (3ª)',to:'constituo, constitui, constitutum (3ª)',
  ref:'https://www.alatius.com/ls/index.php?met=up&ord=constitutam'},
 {course:'latin1',unit:'UD2',lemma:'invenio',
  from:'invenio, inveni, inventum',to:'invenio, inveni, inventum (4ª)',
  ref:'https://en.wiktionary.org/wiki/invenio#Latin'}
];
function once(source,oldText,newText,scope){
 const n=source.split(oldText).length-1;
 assert.equal(n,1,'Se esperaba una sola coincidencia ('+scope+'): '+oldText+'; hay '+n);
 return source.replace(oldText,newText);
}
let html=load('index.html'),required=load('required-latin-units.js');
for(const item of cases){
 html=once(html,'"entry": '+JSON.stringify(item.from),'"entry": '+JSON.stringify(item.to),'HTML '+item.course+' '+item.unit);
 required=once(required,JSON.stringify(item.from),JSON.stringify(item.to),'Exigible '+item.course+' '+item.unit);
}
const migration1="['adiuvo, adiuvavi, adiuvatum (1ª)','adiuvo, adiuvi, adiutum (1ª)']";
html=once(html,migration1,migration1+","+
 "\n   ['fugio, fugi – (4ª)','fugio, fugi – (mx.)'],"+
 "\n   ['fugio, fugi – (3ª)','fugio, fugi – (mx.)'],"+
 "\n   ['accedo, accessi, acessum (3ª)','accedo, accessi, accessum (3ª)'],"+
 "\n   ['accido, accidi, accesum (3ª)','accido, accidi, – (3ª)'],"+
 "\n   ['constituo, constiti, constitutum (3ª)','constituo, constitui, constitutum (3ª)'],"+
 "\n   ['invenio, inveni, inventum','invenio, inveni, inventum (4ª)']", 'Migración latin1');
const migration4="latin4:[['pollĭcĕor, pollĭcĭtus sum (3ª)','pollĭcĕor, pollĭcĭtus sum (2ª)']]";
html=once(html,migration4,
 "latin4:[['pollĭcĕor, pollĭcĭtus sum (3ª)','pollĭcĕor, pollĭcĭtus sum (2ª)'],"+
 "['rĕtĭnĕō, retĭnŭī, retentum (3ª)','rĕtĭnĕō, retĭnŭī, retentum (2ª)']]",
 'Migración latin4');
const pathOverrides='data/lemmas/verified-overrides.json';
const raw=load(pathOverrides);
const json=JSON.parse(raw);
assert(Array.isArray(json.entryCorrections));
const seen=new Set();
for(const item of cases){
 const key=item.course+':'+item.lemma;
 if(seen.has(key))continue;
 seen.add(key);
 assert(!json.entryCorrections.some(c=>c.lang==='lat'&&c.lemma===item.lemma&&
  c.course===(item.course==='latin1'?'lat1':'lat4')&&c.from===item.from),
  'La corrección ya consta en la fuente: '+key);
 json.entryCorrections.push({
  lang:'lat',lemma:item.lemma,course:item.course==='latin1'?'lat1':'lat4',
  from:item.from,to:item.to,reference:item.ref,
  note:'Auditoría verbal 21/11/2026: corrección editorial y curricular; no acredita ni incorpora paradigmas generados por analogía.'
 });
}
save('index.html',html);
save('required-latin-units.js',required);
save(pathOverrides,JSON.stringify(json,null,2)+'\n');
console.log('Corregidos 7 registros de unidad, seis lemas/curso, dos bancos y migración de fichas persistidas.');
console.log('Índice y PWA pendientes de reconstrucción por el workflow. Sin promoción de formas a fuente 5.');

// Activación puntual del workflow de reconstrucción en rama aislada.

// Reejecutar con normalización del marcador 'irr.'.
