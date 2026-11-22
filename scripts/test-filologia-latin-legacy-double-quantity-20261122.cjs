'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=load('data/lemmas/latin-legacy-double-quantity-collation-20261122.json');
const index=load('data/lemmas/teacher-forms.json');
const builder=fs.readFileSync('scripts/build-lemma-index.mjs','utf8');
assert.equal(audit.schema,1);
assert.equal(audit.expected.total,42);
assert.equal(audit.notationPolicy?.label,'MARCA_DE_CANTIDAD_VARIABLE_CONVENCIONAL_EN_GRAMATICAS');
assert(audit.notationPolicy.reference?.startsWith('https://dcc.dickinson.edu/grammar/latin/quantity-syllables'));
assert(audit.notationPolicy.rule?.includes('reemplazo automático'));

assert.equal(audit.expected.corrected,0);
assert.equal(audit.expected.retainedVariant,42);
assert.equal(audit.automaticGradingEnabled,false);
assert.equal(audit.morphologyPromotion,false);
assert.equal(audit.items.length,42);
assert.equal(index.rows.lat.length,14531,'El índice añade exactamente las 24 casillas deponentes contrastadas');
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
 assert(a.classification.endsWith('_RESERVADA'),'Testimonio no reservado: '+id);
 assert.equal(a.after,a.form,'No normalizar cantidades discutidas: '+id);
 if(a.lemma==='custos')assert.equal(a.classification,'CANTIDAD_DISPUTADA_RESERVADA');
 
 assert(!index.rows.lat.some(r=>r[0]===a.lemma&&r[1]===a.after&&r[2]===a.features&&r[3]===5),
  'Promoción indebida a fuente 5: '+id);
}
assert.deepEqual(grouped,{alter:1,custos:12,nullus:1,princeps:28});
assert.equal(audit.philologicalEvidence?.schema,1);
assert.equal(audit.philologicalEvidence.entries?.length,4);
const documented=new Set();
for(const evidence of audit.philologicalEvidence.entries){
 assert(Object.hasOwn(grouped,evidence.lemma),'Lema de evidencia ajeno');
 assert(!documented.has(evidence.lemma),'Cotejo bibliográfico repetido');
 documented.add(evidence.lemma);
 assert.equal(evidence.rows,grouped[evidence.lemma]);
 assert.equal(evidence.allowedIndexNormalization,false);
 assert.equal(evidence.sourcePromotion,false);
 assert(evidence.evidenceLevel?.length>12);
 assert(evidence.inference?.length>40);
 assert(evidence.comparativeReferences?.length>=2);
 for(const uri of evidence.comparativeReferences)assert(uri.startsWith('https://'));
 for(const attestation of evidence.ancientWitnesses){
  assert(attestation.author&&attestation.locus&&attestation.claim&&attestation.uri?.startsWith('https://'));
 }
}
assert(audit.philologicalEvidence.entries.find(x=>x.lemma==='alter').ancientWitnesses.length===1);
assert(audit.philologicalEvidence.entries.find(x=>x.lemma==='princeps').ancientWitnesses.length===1);
assert(audit.philologicalEvidence.entries.find(x=>x.lemma==='custos').ancientWitnesses.length===0);
const nullusEvidence=audit.philologicalEvidence.entries.find(x=>x.lemma==='nullus');
assert.equal(nullusEvidence.evidenceLevel,'TESTIMONIO_METRICO_PRIMARIO_DE_BREVE');
assert.equal(nullusEvidence.ancientWitnesses.length,1);
assert.equal(nullusEvidence.ancientWitnesses[0].author,'T. Lucretius Carus');
assert.equal(nullusEvidence.ancientWitnesses[0].locus,'De rerum natura I 224');
assert.equal(nullusEvidence.ancientWitnesses[0].quote,'nullius exitium patitur natura videri');
assert(nullusEvidence.ancientWitnesses[0].quantity.includes('ĭ breve'));
assert(nullusEvidence.ancientWitnesses[0].meter.includes('— ◡ ◡'));
assert.equal(audit.items.find(x=>x.lemma==='nullus').after,'nūllī̆us');

assert.equal(index.rows.lat.filter(r=>['alter','custos','nullus','princeps'].includes(r[0])&&
 /[īū]̆/u.test(r[1])&&r[3]===0).length,42);
assert.equal(index.rows.lat.filter(r=>r[0]==='custos'&&r[3]===0).length,12);
for(const lemma of Object.keys(grouped))
 assert(audit.bibliography[lemma]?.length>=2,'Sin dos referencias para '+lemma);
console.log('OK: 42 testimonios cotejados y reservados, sin cambios especulativos ni promoción a fuente 5');
