'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),get=p=>JSON.parse(read(p));
const sandbox=vm.createContext({window:{},document:{readyState:'loading',addEventListener:()=>{}},
 localStorage:{getItem:()=>null,setItem:()=>{}}});
new vm.Script(read('verification-review.js')).runInContext(sandbox);
const api=sandbox.window.ExaminaTeacherReview;
assert.equal(typeof api.validateEvidenceImport,'function');
assert.equal(typeof api.evidenceProvisionalForbidden,'function');
const bank=get('data/lemmas/teacher-forms.json');
const triage=get('data/lemmas/revision-559-griego-20261113.json');
const held=triage.items.filter(x=>['ACENTO_INCORRECTO_EN_FUENTE',
 'VARIANTE_DE_TERMINACIONES_PARA_DECISION_DOCENTE','VARIANTE_EPICA_FUERA_DE_CURRICULO'].includes(x.status)&&x.lemma!=='εχθροσ');
assert.equal(held.length,36); // 10 de 46 trasladadas a fuente 5.
const schema='examina-academic-evidence/v1';
for(const x of held){
 const row=bank.rows.grc.find(r=>r[0]===x.lemma&&r[1]===x.sourceForm&&r[2]===x.analysis&&r[3]===4);
 assert(row,'No existe la fila retenida: '+x.id);
 assert(api.evidenceProvisionalForbidden('gr1',row),'No bloqueada: '+x.id);
 assert.throws(()=>api.evidenceGrant('gr1',row,{}),/excluida/);
 const key=api.evidenceKey('gr1',row);
 const old={[key]:{schema,key,action:'autorizar_uso',verified:false,
  course:'gr1',lemma:row[0],form:row[1],tags:row[2],source:4,approvedAt:'2026-11-13T14:00:00Z'}};
 assert(!api.approvedExamForms(bank,'gr1',14,old).some(y=>y.evidenceKey===key));
 const paper={querySelectorAll:()=>[{dataset:{academicKey:encodeURIComponent(key),
  academicForm:encodeURIComponent(row[1])},querySelector:()=>null,textContent:row[1]}]};
 assert.equal(api.evidenceCheckExam(paper,'gr1',old).ok,false);
 assert.throws(()=>api.validateEvidenceImport(bank,{schema,decisions:old},{}),
  /Forma bloqueada|Forma inexistente/);
}
// Los permisos de fuente 4 anteriores a la migración de ἐχθρός
// nunca se reactivan cuando existe una lectura contrastada de fuente 5.
for(const historical of triage.items.filter(x=>x.lemma==='εχθροσ')){
 const obsolete=[historical.lemma,historical.sourceForm,historical.analysis,4];
 assert(!bank.rows.grc.some(r=>JSON.stringify(r)===JSON.stringify(obsolete)));
 assert(api.evidenceProvisionalForbidden('gr1',obsolete));
 const key=api.evidenceKey('gr1',obsolete);
 const old={[key]:{schema,key,action:'autorizar_uso',verified:false,course:'gr1',
  lemma:historical.lemma,form:historical.sourceForm,tags:historical.analysis,
  source:4,approvedAt:'2026-11-13T14:00:00Z'}};
 assert.throws(()=>api.validateEvidenceImport(bank,{schema,decisions:old},{}),/Forma inexistente/);
 assert(!api.approvedExamForms(bank,'gr1',14,old).some(x=>x.evidenceKey===key));
}
const eligible=api.evidenceRows(bank,'lat1',14).find(row=>
 api.evidenceCurricular('lat1',row[2],14)&&api.evidenceUniqueReading(bank,'lat1',row));
assert(eligible,'No existe ninguna candidata latina válida para la prueba');
const key=api.evidenceKey('lat1',eligible);
const approved=api.evidenceGrant('lat1',eligible,{},'2026-11-13T14:00:00Z');
const loaded=api.validateEvidenceImport(bank,{schema,decisions:approved},{});
assert.equal(loaded.added,1);assert.equal(loaded.total,1);
assert.equal(loaded.decisions[key].verified,false);
const current={[key]:{...approved[key],approvedAt:'2026-11-13T16:00:00Z'}};
const merged=api.validateEvidenceImport(bank,{schema,decisions:approved},current);
assert.equal(merged.added,0);
assert.equal(merged.preserved,1);
assert.equal(merged.decisions[key].approvedAt,'2026-11-13T16:00:00Z');
const forgedRow=[eligible[0],'formam_invéntam',eligible[2],eligible[3]];
const forged=api.evidenceGrant('lat1',forgedRow,{});
assert.throws(()=>api.validateEvidenceImport(bank,{schema,decisions:forged},{}),
 /Forma inexistente/);
const wrong=JSON.parse(JSON.stringify(approved));wrong[key].course='gr1';
assert.throws(()=>api.validateEvidenceImport(bank,{schema,decisions:wrong},{}),
 /ficha individual/);
assert.equal(bank.vocabulary.grc.κεφαλη.gr1.entry,'κεφαλή, –ῆς');
const corrections=get('data/lemmas/verified-overrides.json').entryCorrections;
assert(corrections.some(x=>x.lang==='grc'&&x.lemma==='κεφαλη'&&
 x.from==='κεφαλῆ, –ῆς'&&x.to==='κεφαλή, –ῆς'));
assert(read('index.html').includes('κεφαλή, –ῆς'));
assert(read('offline.html').includes('κεφαλή, –ῆς'));
assert.equal(bank.counts.grc.wikcionario,549);
assert.equal(bank.counts.grc.contrastado,474);
console.log('Fase IV: 36 lecturas todavía en cuarentena, diez transferidas sin permisos heredados, importación no destructiva y κεφαλή corregida.');
