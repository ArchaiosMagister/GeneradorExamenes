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
assert.equal(report.totalCandidates,4103,'Cambio de fichas pendientes: examinar antes de variar el inventario');
assert.equal(report.latin.entries.length,3244);
assert.equal(report.greek.entries.length,859);
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
console.log('Auditoría integral: 4403 propuestas inventariadas y cero promociones automáticas.');
