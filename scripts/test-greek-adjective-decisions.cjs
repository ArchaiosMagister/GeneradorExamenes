'use strict';
/* Decisión docente sobre 21 fichas, sin verificación por analogía. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),get=p=>JSON.parse(read(p));
const policy=get('data/lemmas/greek-adjective-decisions.json');
const bank=get('data/lemmas/teacher-forms.json');
const history=get('data/lemmas/revision-559-griego-20261113.json');
const overrides=get('data/lemmas/verified-overrides.json');
const index=read('index.html'),offline=read('offline.html');
assert.equal(policy.schema,'examina-greek-adjective-decisions/v1');
assert.equal(policy.course,'gr1');
assert.equal(policy.decisions.length,3);
assert.deepEqual(bank.extensions.greek_adjective_decisions,policy);
const expected=[
 ['αθανατοσ','DOS_TERMINACIONES','EXCLUIR',8,'ἀθάνατος, −ον'],
 ['εχθροσ','TRES_TERMINACIONES','VERIFICACION_INDIVIDUAL',10,'ἐχθρός, –ά, –όν'],
 ['αισχροσ','DOS_TERMINACIONES','EXCLUIR',3,'αἰσχρός, –ον']
];
const sandbox=vm.createContext({window:{},document:{readyState:'loading',addEventListener:()=>{}},
 localStorage:{getItem:()=>null,setItem:()=>{}}});
new vm.Script(read('verification-review.js')).runInContext(sandbox);
const api=sandbox.window.ExaminaTeacherReview;
const allCases=api.buildCases(bank,'gr1');
const records=new Set(),source5Before=bank.counts.grc.contrastado;
for(const [lemma,paradigm,handling,count,entry] of expected){
 const decision=policy.decisions.find(x=>x.lemma===lemma);
 assert(decision,'Decisión sin lema '+lemma);
 assert.equal(decision.paradigm,paradigm);
 assert.equal(decision.policy,handling);
 assert.equal(decision.verifiedFormsAdded,0);
 assert.equal(bank.vocabulary.grc[lemma].gr1.entry,entry);
 assert.equal(decision.entry,entry);
 assert.equal(decision.candidateIds.length,count);
 for(const id of decision.candidateIds){
  assert(!records.has(id),'Ficha duplicada: '+id);
  records.add(id);
  const old=history.items.find(x=>x.id===id);
  assert(old&&old.lemma===lemma&&old.originalSource===4&&old.analysis.endsWith(';FEM'));
  assert.equal(old.verifiedIndividual,false);
  assert.equal(old.gradeEligible,false);
  const row=bank.rows.grc.find(r=>r[0]===lemma&&r[1]===old.sourceForm&&r[2]===old.analysis&&r[3]===4);
  assert(row,'Falta el registro histórico: '+id);
  assert(api.evidenceProvisionalForbidden('gr1',row),'Antigua autorización aceptada: '+id);
  assert.throws(()=>api.evidenceGrant('gr1',row,{}),/excluida/);
  const key=api.evidenceKey('gr1',row);
  const forged={[key]:{schema:'examina-academic-evidence/v1',key,action:'autorizar_uso',
   verified:false,course:'gr1',lemma,form:row[1],tags:row[2],source:4,approvedAt:'2026-11-13T18:00:00Z'}};
  assert(!api.approvedExamForms(bank,'gr1',14,forged).some(x=>x.evidenceKey===key));
  assert.throws(()=>api.validateEvidenceImport(bank,{schema:'examina-academic-evidence/v1',
   decisions:forged},{}),/Forma bloqueada/);
  assert(!bank.rows.grc.some(r=>r[0]===lemma&&r[2]===old.analysis&&r[3]===5&&r[1]===old.schoolForm));
  const caseRow=allCases.find(x=>x.lemma===lemma&&x.detail.includes('Registro '+id+':'));
  assert(caseRow&&caseRow.detail.includes('sin verificar'),'La cola debe conservar '+id);
  if(handling==='EXCLUIR')assert(caseRow.detail.includes('excluida'),'Decisión no visible: '+id);
  else assert(caseRow.detail.includes('Paradigma de tres terminaciones aprobado'));
 }
}
assert.equal(records.size,21);
assert.equal(history.summary.requiresTeacherDecision,21,'Historial original intacto');
assert.equal(bank.counts.grc.contrastado,source5Before);
assert(overrides.entryCorrections.some(x=>x.lang==='grc'&&x.course==='gr1'&&x.lemma==='εχθροσ'&&
 x.from==='ἐχθρός, –ον'&&x.to==='ἐχθρός, –ά, –όν'));
assert(index.includes("{lemma:'ἐχθρός',stem:'ἐχθρ',feminine:'α'"));
assert(index.includes("if(item.lemma==='ἐχθρός')return false;"));
assert(index.includes("{lemma:'αἰσχρός',stem:'αἰσχρ',feminine:null"));
assert(index.includes("'ἐχθρός, –ά, –όν','Nominativo singular masculino;"));
assert(!index.includes('ἐχθρός, –ον'));
assert(offline.includes('ἐχθρός, –ά, –όν'));
assert(offline.includes('examina-greek-adjective-decisions/v1'));
const marker='<script id="examina-offline-assets" type="application/json">';
const start=offline.indexOf(marker),end=offline.indexOf('</script>',start+marker.length);
assert(start>=0&&end>start,'Banco offline ausente');
const assets=JSON.parse(offline.slice(start+marker.length,end));
assert.deepEqual(assets['data/lemmas/teacher-forms.json'],bank,'El offline conserva un índice antiguo');
console.log('OK: decisiones 8 + 10 + 3, enunciado persistente, 21 fichas bloqueadas, sin falsas verificaciones.');
