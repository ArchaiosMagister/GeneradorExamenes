'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'verification-review.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const sandbox=vm.createContext({window:{},document:{readyState:'loading',addEventListener:()=>{}},
 localStorage:{getItem:()=>null,setItem:()=>{}}});
new vm.Script(source,{filename:'verification-review.js'}).runInContext(sandbox);
const api=sandbox.window.ExaminaTeacherReview;
const all=['lat1','lat4','gr1'].flatMap(course=>api.buildCases(data,course));
const greek=all.filter(x=>x.course==='gr1'),priority=greek.filter(x=>/Registro grc-pending-\d+:/.test(x.detail));
assert.equal(priority.length,68,'Las 68 lecturas con unidad deben figurar individualmente');
assert.equal(new Set(priority.map(x=>x.id)).size,68,'Los sincretismos no pueden confundirse en una tarjeta');
assert(priority.every(x=>x.kind==='candidatas'&&x.units.length&&/sin verificar/.test(x.detail)));
assert(priority.some(x=>x.form.includes('παῖδι')&&/épica/.test(x.detail)));
assert(priority.some(x=>x.lemma==='πρωτοσ'&&x.detail.includes('ACENTO_INCORRECTO')));
const x=priority.find(x=>x.lemma==='πρωτοσ');
const sig=api.reviewSignature(x);
assert.equal(typeof sig,'string');
assert.equal(api.reviewDecisionApplies(x,{entry:x.entry,decision:'excluir'}),true,'Lectura de registros locales anteriores');
const old=api.reviewWriteDecision({},x,'excluir','Mantener en cuarentena','2026-11-13T16:00:00Z');
assert.equal(old[x.id].signature,sig);
assert.equal(old[x.id].decision,'excluir');
assert(!old[x.id].verified,'Nunca convertir notas en verificación académica');
const x2=priority.find(y=>y.id!==x.id);
const old2=api.reviewWriteDecision(old,x2,'corregir','Cotejar acento','2026-11-13T16:15:00Z');
assert.equal(old2[x.id].decision,'excluir','Guardar una tarjeta no debe regenerar otras decisiones');
const refreshed=api.reviewWriteDecision(old2,x,'aceptar','Variante documentada','2026-11-13T16:30:00Z');
assert.equal(refreshed[x.id].decision,'aceptar');
assert.equal(refreshed[x.id].alternatives.length,1,'Se debe conservar la decisión sustituida');
assert.equal(refreshed[x2.id].decision,'corregir');
const snapshot=api.reviewBundle(old2,'2026-11-13T17:00:00Z');
assert.equal(snapshot.schema,'examina-morph-teacher-review/v2');
assert.equal(Object.keys(snapshot.records).length,2);
assert.equal(snapshot.records[x.id].signature,sig);
const imported=api.reviewMergeBundle({},snapshot,all);
assert.equal(imported.total,2);assert.equal(imported.added,2);
assert.equal(imported.decisions[x.id].decision,'excluir');
const updatedLocal=api.reviewWriteDecision({},x,'corregir','No aceptar acento','2026-11-13T16:45:00Z');
const conflict=api.reviewMergeBundle(updatedLocal,snapshot,all);
assert.equal(conflict.added,1);assert.equal(conflict.conflicts,1);
assert.equal(conflict.decisions[x.id].decision,'corregir','La importación no debe pisar el estado local');
assert.equal(conflict.decisions[x.id].alternatives.length,1,'Conservar la versión entrante');
assert.equal(conflict.decisions[x.id].alternatives[0].decision,'excluir');
const repeated=api.reviewMergeBundle(conflict.decisions,snapshot,all);
assert.equal(repeated.conflicts,0);assert.equal(repeated.historyAdded,0,'Importación idempotente');
const chosen=api.reviewSelectAlternative(conflict.decisions,x,0);
assert.equal(chosen[x.id].decision,'excluir');
assert(chosen[x.id].alternatives.some(a=>a.decision==='corregir'),'La anterior decisión debe quedar en el historial');
assert.equal(chosen[x2.id].decision,'corregir');
const staleCase={...x,entry:'enunciado-filológicamente-modificado'};
assert.equal(api.reviewDecisionApplies(staleCase,chosen[x.id]),false);
assert.throws(()=>api.reviewSelectAlternative(chosen,staleCase,0),/versión anterior/);
const stale=api.reviewMergeBundle({},snapshot,all.filter(y=>y.id!==x.id));
assert.equal(stale.orphaned,1,'Las decisiones obsoletas deben retenerse sin aplicarse');
assert.equal(stale.decisions[x.id].decision,'excluir');
assert(!api.reviewDecisionApplies(staleCase,stale.decisions[x.id]));
const legacy={schema:1,decisions:{[x.id]:{decision:'excluir',note:'Registro exportado previamente',
 entry:x.entry,updated:'2026-11-13T13:00:00Z'}}};
const migrated=api.reviewMergeBundle({},legacy,all);
assert.equal(migrated.added,1);
assert(api.reviewDecisionApplies(x,migrated.decisions[x.id]),'Compatibilidad con las exportaciones anteriores');
assert.throws(()=>api.reviewMergeBundle({},{
 schema:'examina-morph-teacher-review/v2',
 records:{[x.id]:{decision:'certificar',note:'No válido',entry:x.entry,updated:'2026-11-13T16:00:00Z',signature:sig}}
},all),/incompleta|inválida/);
const polluted=JSON.parse('{"schema":"examina-morph-teacher-review/v2","records":{"__proto__":{"decision":"excluir","note":"t","entry":"p","updated":"2026-11-13T16:00:00Z"}}}');
assert.throws(()=>api.reviewMergeBundle({},polluted,all),/Identificador|identificador|inválido|desconocido|Archivo/);
assert.equal({}.polluted,undefined,'La importación no puede contaminar prototipos');
assert(!api.approvedExamForms(data,'gr1',14,{}).some(y=>y.evidenceKey===x.id),
 'Las decisiones sobre incidencias jamás deben convertirse en autorizaciones');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('verification-review.js'));
for(const id of ['reviewImport','reviewImportFile','reviewConflicts','reviewBackupStatus'])
 assert(source.includes(id),'Falta control de la cola '+id);
console.log('Fase IV: 68 fichas griegas visibles, conflictos e historial sin pérdida, importar v1/v2 y decisión ≠ autorización.');
