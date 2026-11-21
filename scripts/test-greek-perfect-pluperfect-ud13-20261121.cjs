'use strict';
// Regresión filológica de la UD13 sin añadir análisis evaluables.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const doc=JSON.parse(fs.readFileSync('data/vocabulary/greek1-units-corrected.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('data/vocabulary/greek1-perfect-pluperfect-audit-20261121.json','utf8'));
const lex=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const engine=fs.readFileSync('vocabulary-generator.js','utf8');
const offline=fs.readFileSync('offline.html','utf8');
assert.equal(doc.count,14);
assert.equal(doc.units.length,14);
assert.equal(doc.units.reduce((n,u)=>n+u.text.split('\n').filter(Boolean).length,0),471);
assert.equal(evidence.course,'gr1');
assert.equal(evidence.unit,13);
assert.equal(evidence.automaticGradingEnabled,false);
assert.equal(evidence.morphologyPromotion,false);
assert.equal(evidence.corrections.length,3);
const u=doc.units.find(x=>x.title==='UD13');
assert(u,'UD13 ausente');
const lines=u.text.split('\n').filter(Boolean);
assert.equal(lines.length,30);
const tokens=[...u.text.matchAll(/[\p{L}\p{M}]+/gu)].map(x=>x[0].normalize('NFC'));
for(const info of evidence.corrections){
 assert.equal(info.individuallyAttestedInSource5,false);
 assert(/^https:\/\//.test(info.lexicalReference));
 assert(/^https:\/\//.test(info.paradigmReference));
 assert.equal(info.updated,info.updated.normalize('NFC'));
 assert(!u.text.normalize('NFC').includes(info.old.normalize('NFC')),
   'Permanece forma descartada en UD13: '+info.old);
 assert.equal(tokens.filter(x=>x===info.updated).length,info.totalFinalOccurrences,
   'Frecuencia inesperada en UD13: '+info.updated);
 for(const line of info.lines){
  assert(lines[line-1].normalize('NFC').includes(info.updated),
   'Línea incorrecta '+line+': '+info.updated);
 }
 assert(!lex.rows.grc.some(row=>row[1].normalize('NFC')===info.updated&&row[3]===5),
  'Se promocionó un paradigma por analogía: '+info.updated);
 assert(!engine.includes(info.old),'El glosario conserva una variante descartada: '+info.old);
 assert(engine.includes(info.updated),'El glosario no reconoce la forma clásica: '+info.updated);
 assert(offline.includes(info.updated),'El HTML autónomo contiene un motor antiguo: '+info.updated);
}
const explicit=lex.rows.grc.filter(row=>row[1].normalize('NFC')==='ἐλελύκεμεν');
assert(explicit.some(row=>row[0]==='λυω'&&row[3]===1),
 'Falta el paradigma docente fuente 1 de λύω; no promover a fuente 5');
for(const form of evidence.protectedForms)
 assert(tokens.includes(form.normalize('NFC')),
  'Se alteró una forma válida que debía conservarse: '+form);
assert(!engine.includes('ἐπεπυρεύκεισαν'),
 'Queda en el glosario la grafía descompuesta de una terminación posterior');
assert(!offline.includes("['πυρεύω','encender, incendiar',['ἐπεπυρεύκεισαν'"),
 'La versión offline conserva el paradigma anterior de πυρεύω');
console.log('UD13 FILOLOGÍA: cuatro apariciones normalizadas, 30 líneas, 14 UD, 471 registros, cero promociones morfológicas');
