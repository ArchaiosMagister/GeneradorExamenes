'use strict';
// Dos colaciones individuales de UD12: no acreditan paradigmas ni respuestas automáticas.
const assert=require('node:assert/strict'),fs=require('node:fs');
const evidence=JSON.parse(fs.readFileSync('data/vocabulary/greek1-noun-case-attestation-20261121.json','utf8'));
assert.equal(evidence.schema,1);
assert.equal(evidence.purpose,'atestacion-filologica-puntual-solo-auditoria');
assert.equal(evidence.course,'gr1');
assert.equal(evidence.automaticGradingEnabled,false);
assert.equal(evidence.morphologyPromotion,false);
assert.equal(evidence.items.length,2);
const expected=new Map([
 ['ἀκροάματι',{indexLemma:'ακροαμα',entry:'ἀκρόαμα, –ματος (τό)',
  case:'NOUN;DAT;SG;NEUT',status:'review'}],
 ['ὀνόματα',{indexLemma:'ονομα',entry:'ὄνομα, –ματος (τό)',
  case:'NOUN;ACC;PL;NEUT',status:'unknown'}]
]);
const source=JSON.parse(fs.readFileSync('data/vocabulary/greek1-units-corrected.json','utf8'));
const tokens=[...source.units.find(x=>x.title==='UD12').text.matchAll(/[\p{L}\p{M}]+/gu)]
 .map(x=>x[0].normalize('NFC'));
const teacher=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const overrides=JSON.parse(fs.readFileSync('data/lemmas/verified-overrides.json','utf8'));
for(const item of evidence.items){
 const want=expected.get(item.form);
 assert(want,'Forma no autorizada: '+item.form);
 assert.equal(item.indexLemma,want.indexLemma);
 assert.equal(item.entry,want.entry);
 assert.equal(item.case,want.case);
 assert.equal(item.expectedStatus,want.status);
 assert.equal(item.expectedCandidateAttested,false);
 assert.deepEqual(item.units,[12]);
 assert.equal(item.occurrences,1);
 assert(/^https:\/\//.test(item.reference));
 assert(/^https:\/\//.test(item.secondaryReference));
 assert.equal(tokens.filter(x=>x===item.form).length,1,
  'Se ha modificado el contexto textual del caso: '+item.form);
 assert(!teacher.rows.grc.some(x=>x[1]===item.form),
  'El cotejo contextual no debe añadir flexión al índice: '+item.form);
 assert(!overrides.singleForms.some(x=>x.lang==='grc'&&x.form===item.form),
  'El cotejo contextual no debe alterar claves de calificación: '+item.form);
}
assert.equal(new Set(evidence.items.map(x=>x.form)).size,2,'Cotejo duplicado');
assert.deepEqual(teacher.rows.grc.filter(x=>x[0]==='ονομα'),
 [['ονομα','ονομα','LEX;ENTRY',3]],
 'ὄνομα debe continuar como lema sin análisis de caso incorporados');
console.log('UD12: ἀκροάματι (dat. sg.) y ὀνόματα (ac. pl.) contrastados solo para auditoría; sin promociones evaluables.');
