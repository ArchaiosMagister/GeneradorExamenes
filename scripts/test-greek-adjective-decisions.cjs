'use strict';
/* Tres decisiones docentes: 11 candidaturas bloqueadas, 10 verificadas por forma. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),get=p=>JSON.parse(read(p));
const policy=get('data/lemmas/greek-adjective-decisions.json');
const bank=get('data/lemmas/teacher-forms.json');
const history=get('data/lemmas/revision-559-griego-20261113.json');
const ledger=get('data/lemmas/cotejo-10-echthros-20261113.json');
const overrides=get('data/lemmas/verified-overrides.json');
const index=read('index.html'),offline=read('offline.html');
assert.equal(policy.schema,'examina-greek-adjective-decisions/v1');
assert.equal(policy.course,'gr1');
assert.equal(policy.decisions.length,3);
assert.deepEqual(bank.extensions.greek_adjective_decisions,policy);
const expected=[
 ['αθανατοσ','DOS_TERMINACIONES','EXCLUIR',8,'ἀθάνατος, −ον',0],
 ['εχθροσ','TRES_TERMINACIONES','VERIFICADAS_INDIVIDUALMENTE',10,'ἐχθρός, –ά, –όν',10],
 ['αισχροσ','DOS_TERMINACIONES','EXCLUIR',3,'αἰσχρός, –ον',0]
];
const sandbox=vm.createContext({window:{},document:{readyState:'loading',addEventListener:()=>{}},
 localStorage:{getItem:()=>null,setItem:()=>{}}});
new vm.Script(read('verification-review.js')).runInContext(sandbox);
const api=sandbox.window.ExaminaTeacherReview;
const allCases=api.buildCases(bank,'gr1');
const records=new Set();let promoted=0,blocked=0;
for(const [lemma,paradigm,handling,count,entry,verified] of expected){
 const decision=policy.decisions.find(x=>x.lemma===lemma);
 assert(decision,'Decisión sin lema '+lemma);
 assert.equal(decision.paradigm,paradigm);
 assert.equal(decision.policy,handling);
 assert.equal(decision.verifiedFormsAdded,verified);
 assert.equal(bank.vocabulary.grc[lemma].gr1.entry,entry);
 assert.equal(decision.entry,entry);
 assert.equal(decision.candidateIds.length,count);
 for(const id of decision.candidateIds){
  assert(!records.has(id),'Ficha duplicada: '+id);
  records.add(id);
  const old=history.items.find(x=>x.id===id);
  assert(old&&old.lemma===lemma&&old.originalSource===4&&old.analysis.endsWith(';FEM'));
  assert.equal(old.verifiedIndividual,false,'La auditoría histórica debe ser inmutable');
  assert.equal(old.gradeEligible,false);
  const candidate=[lemma,old.sourceForm,old.analysis,4];
  const pending=bank.rows.grc.find(r=>JSON.stringify(r)===JSON.stringify(candidate));
  const documented=bank.rows.grc.find(r=>r[0]===lemma&&r[1]===old.schoolForm&&r[2]===old.analysis&&r[3]===5);
  assert(api.evidenceProvisionalForbidden('gr1',candidate),
   'Los permisos antiguos no deben revivir cuando la ficha cambie de fuente');
  assert.throws(()=>api.evidenceGrant('gr1',candidate,{}),/excluida/);
  const key=api.evidenceKey('gr1',candidate);
  const forged={[key]:{schema:'examina-academic-evidence/v1',key,action:'autorizar_uso',
   verified:false,course:'gr1',lemma,form:old.sourceForm,tags:old.analysis,
   source:4,approvedAt:'2026-11-13T18:00:00Z'}};
  assert(!api.approvedExamForms(bank,'gr1',14,forged).some(y=>y.evidenceKey===key));
  assert.throws(()=>api.validateEvidenceImport(bank,{
   schema:'examina-academic-evidence/v1',decisions:forged},{}),
   /Forma inexistente|Forma bloqueada/);
  const caseRow=allCases.find(x=>x.lemma===lemma&&x.detail.includes('Registro '+id+':'));
  if(lemma==='εχθροσ'){
   assert(!pending,'Una forma verificada no puede permanecer como candidata de fuente 4: '+id);
   assert(documented,'Cotejo no incorporado: '+id);
   assert(!caseRow,'Una forma ya certificada no debe permanecer como incidencia pendiente: '+id);
   assert(ledger.items.some(x=>x.id===id&&x.indexSourceCode===5&&x.analysis===old.analysis));
   promoted++;
  }else{
   assert(pending&& !documented,'La decisión de exclusión no puede verificar flexiones: '+id);
   assert(caseRow&&caseRow.detail.includes('excluida')&&caseRow.detail.includes('sin verificar'));
   blocked++;
  }
 }
}
assert.equal(records.size,21);
assert.equal(promoted,10);assert.equal(blocked,11);
assert.equal(history.summary.requiresTeacherDecision,21,'Historial original intacto');
assert.equal(bank.counts.grc.wikcionario,549);
assert.equal(bank.counts.grc.contrastado,474);
assert.equal(bank.extensions.verifiedIndividualForms,475);
assert.equal(bank.extensions.greek_nominal_candidates.historicalRows,559);
assert(overrides.entryCorrections.some(x=>x.lang==='grc'&&x.course==='gr1'&&x.lemma==='εχθροσ'&&
 x.from==='ἐχθρός, –ον'&&x.to==='ἐχθρός, –ά, –όν'));
assert(index.includes("{lemma:'ἐχθρός',stem:'ἐχθρ',feminine:'α'"));
assert(!index.includes("if(item.lemma==='ἐχθρός')return false;"));
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
console.log('OK: 8 + 3 exclusiones conservadas, diez promociones individuales de ἐχθρός, permisos antiguos bloqueados y offline sincronizado.');
