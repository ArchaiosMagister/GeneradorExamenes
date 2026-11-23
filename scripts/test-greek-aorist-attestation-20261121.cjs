'use strict';
// Tres aoristos del banco docente: acreditación individual, no promoción evaluable.
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const evidence=JSON.parse(fs.readFileSync('data/vocabulary/greek1-aorist-audit-evidence-20261121.json','utf8'));
const source=JSON.parse(fs.readFileSync('data/vocabulary/greek1-units-corrected.json','utf8'));
const teacher=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const overrides=JSON.parse(fs.readFileSync('data/lemmas/verified-overrides.json','utf8'));
assert.equal(evidence.schema,1);
assert.equal(evidence.purpose,'atestacion-filologica-solo-auditoria-de-oraciones');
assert.equal(evidence.course,'gr1');
assert.equal(evidence.automaticGradingEnabled,false);
assert.equal(evidence.morphologyPromotion,false);
assert.equal(evidence.items.length,3);
const unit12=source.units.find(x=>x.title==='UD12').text;
for(const item of evidence.items){
 assert(/^https:\/\//.test(item.reference));
 assert.deepEqual(item.units,[12]);
 assert(item.reading.includes('plural'));
 const words=[...unit12.matchAll(/[\p{L}\p{M}]+/gu)].map(x=>x[0].normalize('NFC'));
 assert.equal(words.filter(word=>word===item.form).length,item.occurrences,item.form);
 assert(!overrides.singleForms.some(x=>x.lang==='grc'&&x.form===item.form),
 'Una acreditación editorial no debe alterar las soluciones de fuente 5');
 assert(!teacher.rows.grc.some(x=>x[1]===item.form&&x[3]===5),
 'Forma docente promovida indebidamente al índice evaluable: '+item.form);
}
const output=cp.execFileSync(process.execPath,['scripts/audit-greek-all-units.cjs','--require-clean'],{encoding:'utf8'});
const match=output.match(/GREEK_FULL_AUDIT (\{[^\n]+\})/);
assert(match,'Falta resumen de auditoría completa');
const stats=JSON.parse(match[1]);
assert.equal(stats.units,14);
assert.equal(stats.pending,0);
assert.equal(stats.unknown,0);
assert.equal(stats.review,0);
assert.equal(stats.documented,stats.allDistinct);
console.log('GREEK_FULL_AUDIT '+JSON.stringify(stats));
console.log('TRES AORISTOS DOCUMENTADOS SOLO PARA AUDITORÍA; SIN NUEVAS RESPUESTAS EVALUABLES');
