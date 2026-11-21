'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const indexFile=path.join(root,'data/lemmas/teacher-forms.json');
const sourceFile=path.join(root,'data/lemmas/verified-overrides.json');
const original=fs.readFileSync(indexFile,'utf8'),originalSource=fs.readFileSync(sourceFile,'utf8');
execFileSync(process.execPath,[path.join(root,'scripts/audit-all-morph-candidates.cjs')],{cwd:root,stdio:'pipe'});
const report=JSON.parse(fs.readFileSync(path.join(root,'test-artifacts/auditoria-integral-candidatos.json'),'utf8'));
const summary=JSON.parse(fs.readFileSync(path.join(root,'test-artifacts/auditoria-integral-resumen.json'),'utf8'));
assert.equal(report.schema,'examina-comprehensive-morph-audit/v1');
assert.equal(report.status,'REVIEW_ONLY_NOT_FOR_GRADING');
const persisted=JSON.parse(original);
assert.equal(report.totalCandidates,report.latin.entries.length+report.greek.entries.length,
 'La auditoría no puede perder candidaturas respecto de su propio desglose');
assert.equal(report.latin.entries.length,persisted.counts.lat.modelo,
 'La auditoría debe coincidir con las propuestas latinas reales del índice');
assert.equal(report.greek.entries.length,persisted.counts.grc.wikcionario,
 'La auditoría debe coincidir con las propuestas griegas reales del índice');
// Las tres correcciones anteriores y el enunciado completo de invenio recuperan
// 18 candidaturas por lema; son fuente 2, NO formas contrastadas ni evaluables.
for(const lemma of ['sepelio','solvo','vivo','invenio']){
 const added=report.latin.entries.filter(x=>x.lemma===lemma);
 assert.equal(added.length,18,'Propuestas regulares inesperadas para '+lemma);
 assert(added.every(x=>x.source==='MODELO_REGULAR'&&
  x.individualVerification===false&&x.eligibleForNewAutomaticGrading===false));
}
assert.equal(persisted.counts.lat.modelo,3244+4*18-18,
 'Cambio ajeno a cuatro lemas recuperados y a la fusión de 18 propuestas duplicadas');
assert.deepEqual(summary.latin,report.latin.summary);
assert.deepEqual(summary.greek,report.greek.summary);
assert.equal(summary.verifiedPromoted,0);
assert.equal(summary.automaticChanges,0);
for(const lang of ['latin','greek']){
 const d=report[lang];
 assert.equal(Object.values(d.summary.states).reduce((s,n)=>s+n,0),d.entries.length);
 assert.equal(new Set(d.entries.map(x=>x.id)).size,d.entries.length);
 assert(d.entries.every(x=>x.individualVerification===false&&x.eligibleForNewAutomaticGrading===false));
 assert(d.entries.every(x=>x.lemma&&x.form&&x.tags&&x.source));
}
// Los controles sobre la fuente sólo pueden añadirse explícitamente y no
// mediante el auditor de candidaturas.
assert.equal(fs.readFileSync(indexFile,'utf8'),original,'El auditor alteró el índice persistente');
assert.equal(fs.readFileSync(sourceFile,'utf8'),originalSource,'El auditor alteró las fuentes verificadas');
console.log('Auditoría integral: '+report.totalCandidates+' propuestas ('+report.greek.entries.length+' griegas, '+report.latin.entries.length+' latinas), cero promociones por el auditor.');
// Revisión histórica del griego: 559 identidades inmutables, 14 migradas y 545 candidatas vigentes.
require('./test-revision-559-griego.cjs');
