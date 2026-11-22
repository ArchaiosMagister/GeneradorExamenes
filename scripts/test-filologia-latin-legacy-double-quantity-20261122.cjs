'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=load('data/lemmas/latin-legacy-double-quantity-collation-20261122.json');
const index=load('data/lemmas/teacher-forms.json');
const builder=fs.readFileSync('scripts/build-lemma-index.mjs','utf8');
assert.equal(audit.schema,1);
assert.equal(audit.expected.total,42);
assert.equal(audit.expected.corrected,12);
assert.equal(audit.expected.retainedVariant,30);
assert.equal(audit.automaticGradingEnabled,false);
assert.equal(audit.morphologyPromotion,false);
assert.equal(audit.items.length,42);
assert.equal(index.rows.lat.length,14507);
assert.equal(index.rows.grc.length,2817);
assert(builder.includes('latin-legacy-double-quantity-collation-20261122.json'),
 'Reconstrucción no vinculada a la colación individual');
const grouped={alter:0,custos:0,nullus:0,princeps:0};
const seen=new Set();
for(const a of audit.items){
 assert(Object.hasOwn(grouped,a.lemma),'Lema ajeno a la auditoría');
 assert.equal(a.source,0);
 assert(a.reference?.startsWith('https://'),'Sin fuente filológica: '+a.lemma);
 const id=a.lemma+'|'+a.form+'|'+a.features;
 assert(!seen.has(id),'Doble acreditación de un registro: '+id);
 seen.add(id);grouped[a.lemma]++;
 const current=index.rows.lat.filter(r=>r[0]===a.lemma&&r[1]===a.after&&
  r[2]===a.features&&r[3]===0);
 assert.equal(current.length,1,'Lectura de fuente 0 no conservada: '+id);
 if(a.lemma==='custos'){
  assert.equal(a.classification,'CORRECCION_CANTIDAD_ACREDITADA');
  assert(a.form.startsWith('cū̆st'));
  assert.equal(a.after,a.form.replace('ū̆','ū'));
  assert(!index.rows.lat.some(r=>r[0]===a.lemma&&r[1]===a.form&&r[2]===a.features&&r[3]===0),
   'La lectura contradictoria continúa activa: '+id);
 }else{
  assert(a.classification.endsWith('_RESERVADA'));
  assert.equal(a.after,a.form,'No normalizar variantes métricas/históricas: '+id);
 }
 assert(!index.rows.lat.some(r=>r[0]===a.lemma&&r[1]===a.after&&r[2]===a.features&&r[3]===5),
  'Promoción indebida a fuente 5: '+id);
}
assert.deepEqual(grouped,{alter:1,custos:12,nullus:1,princeps:28});
assert.equal(index.rows.lat.filter(r=>['alter','custos','nullus','princeps'].includes(r[0])&&
 /[īū]̆/u.test(r[1])&&r[3]===0).length,30);
assert.equal(index.rows.lat.filter(r=>r[0]==='custos'&&r[3]===0).length,12);
for(const lemma of Object.keys(grouped))
 assert(audit.bibliography[lemma]?.length>=2,'Sin dos referencias para '+lemma);
console.log('OK: 42 testimonios cotejados, 12 cantidades de custos corregidas, 30 variantes en reserva, sin promoción a fuente 5');
