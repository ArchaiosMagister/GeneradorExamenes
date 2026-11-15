'use strict';
// Control de cuatro cotejos INDIVIDUALES; no se aprueba el resto del paradigma.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const get=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const bank=get('data/lemmas/teacher-forms.json');
const overrides=get('data/lemmas/verified-overrides.json');
const source=get('data/lemmas/greek-nominal-candidates.json');
const history=get('data/lemmas/revision-559-griego-20261113.json');
const ledger=get('data/lemmas/cotejo-4-dativos-fuente5-20261115.json');
const decisions=get('data/lemmas/greek-adjective-decisions.json');
const norm=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const key=(lemma,surface,tags,code)=>JSON.stringify([lemma,surface,tags,code]);
const expected=[
 ['grc-pending-201','κεφαλη','κεφαλῇ','κεφᾰλῇ','UD 6–7'],
 ['grc-pending-450','ρητωρ','ῥήτορι','ῥήτορῐ','UD 8'],
 ['grc-pending-451','ρισ','ῥινί','ῥῑνῐ́','UD 8'],
 ['grc-pending-462','στρατηγοσ','στρατηγῷ','στρᾰτηγῷ','UD 5']
];
assert.equal(ledger.schema,'examina-greek-individual-morphology-collation/v1');
assert.equal(ledger.subject,'gr1');
assert.deepEqual(ledger.summary,{originalHistoricalEntries:559,priorPromotionsEchthros:10,
 reviewed:4,morphologyConfirmed:4,source5Promotions:4,
 newAutomaticExamForms:0,newAutomaticGradingPermissions:0,unresolvedTeacherDecisions:0});
assert.equal(ledger.items.length,4);
assert.equal(new Set(ledger.items.map(x=>x.id)).size,4);
assert.equal(history.items.length,559,'No se reescribe la auditoría histórica');
assert.equal(bank.counts.grc.wikcionario,545);
assert.equal(bank.counts.grc.contrastado,478);
assert.equal(bank.rows.grc.filter(x=>x[3]===4).length,545);
assert.equal(bank.rows.grc.filter(x=>x[3]===5).length,478);
assert.equal(bank.extensions.greek_nominal_candidates.historicalRows,559);
assert.equal(bank.extensions.greek_nominal_candidates.migratedIndividualSource5,14);
assert.equal(bank.extensions.greek_nominal_candidates.rows,545);
assert.equal(bank.extensions.verifiedIndividualForms,479);
assert.equal(overrides.singleForms.length,479);
assert.equal(decisions.decisions.length,3,'No modificar las decisiones docentes de adjetivos');
assert.equal(bank.rows.grc.filter(x=>x[0]==='εχθροσ'&&x[3]===5&&x[2].endsWith(';FEM')).length,10,
 'Las diez lecturas femeninas de ἐχθρός permanecen individualmente verificadas');
const reviewIndex=new Map(history.items.map(x=>[x.id,x]));
const extractIndex=new Map(source.entries.map(x=>[x.lemma,x]));
const seen=new Set();
const sandbox=vm.createContext({window:{},document:{readyState:'loading',addEventListener:()=>{}},
 localStorage:{getItem:()=>null,setItem:()=>{}}});
new vm.Script(fs.readFileSync(path.join(root,'verification-review.js'),'utf8')).runInContext(sandbox);
const api=sandbox.window.ExaminaTeacherReview;
const evidenceRows=api.evidenceRows(bank,'gr1',14);
for(const [id,lemma,form,sourceForm,unit] of expected){
 const item=ledger.items.find(x=>x.id===id);
 assert(item&& !seen.has(id),'Ficha duplicada o ausente '+id);
 seen.add(id);
 assert.equal(item.lemma,lemma);
 assert.equal(item.schoolForm,form);
 assert.equal(item.originalSourceForm,sourceForm);
 assert.equal(item.analysis,'N;DAT;SG');
 assert.equal(item.indexSourceCode,5);
 assert.equal(item.originalSourceCode,4);
 assert.equal(item.spellingVerified,true);
 assert.equal(item.analysisVerified,true);
 assert.equal(item.automaticGradingEnabled,false);
 assert.equal(item.individualAuthorizationAdded,false);
 assert.equal(norm(sourceForm),form,'Se perdió un acento, espíritu o iota suscrita');
 assert(item.reference.startsWith('https://')&&item.independentParadigmCrosscheck.startsWith('https://'));
 const previous=reviewIndex.get(id);
 assert(previous&&previous.originalSource===4&&previous.verifiedIndividual===false&&
  previous.gradeEligible===false&&previous.analysis===item.analysis);
 assert.equal(previous.sourceForm,sourceForm);
 assert.equal(previous.schoolForm,form);
 assert.deepEqual(previous.units,[unit]);
 assert.deepEqual(item.units,[unit]);
 assert.deepEqual(bank.vocabulary.grc[lemma].gr1.units,[unit],'Unidades exigibles alteradas');
 assert.equal(bank.vocabulary.grc[lemma].gr1.entry,item.teacherEntry,'Enunciado docente alterado');
 const raw=extractIndex.get(lemma);
 assert(raw&&raw.forms.some(r=>r[0]===sourceForm&&r[1]===item.analysis),
  'Se perdió el registro candidato original '+id);
 assert.equal(bank.rows.grc.filter(r=>key(...r)===key(lemma,form,item.analysis,5)).length,1,
  'Una única lectura contrastada debe permanecer en el índice');
 assert.equal(bank.rows.grc.filter(r=>key(...r)===key(lemma,sourceForm,item.analysis,4)).length,0,
  'Fuente 4 antigua aún activa en el índice '+id);
 const verified=overrides.singleForms.filter(r=>r.lang==='grc'&&r.historicalId===id);
 assert.equal(verified.length,1,'Duplicación en fuente persistente '+id);
 assert.equal(verified[0].lemma,lemma);
 assert.equal(verified[0].sourceForm,sourceForm);
 assert.equal(verified[0].form,form);
 assert.equal(verified[0].tags,item.analysis);
 assert.equal(verified[0].reference,item.reference);
 assert.equal(verified[0].collation,'data/lemmas/cotejo-4-dativos-fuente5-20261115.json');
 assert(bank.source.externalVerification.some(r=>r.lang==='grc'&&r.lemma===lemma&&
  r.form===form&&r.reference===item.reference),'Falta la procedencia en el índice');
 const promoted=[lemma,form,item.analysis,5];
 assert(!evidenceRows.some(row=>key(...row)===key(...promoted)),
  'Forma de fuente 5 indebidamente marcada como propuesta autorizable');
 assert.throws(()=>api.evidenceGrant('gr1',promoted,{}),/Solo pueden autorizarse propuestas individuales/,
  'No debe habilitarse un permiso de candidato de fuente 4 para la ficha contrastada');
}
assert.equal(seen.size,4);
assert(bank.rows.grc.some(x=>x[0]==='πρωτοσ'&&x[3]===4),
 'Se perdió la cuarentena de πρῶτος');
for(const lemma of ['αθανατοσ','αισχροσ'])
 assert(!bank.rows.grc.some(r=>r[0]===lemma&&r[3]===5&&r[2].endsWith(';FEM')),
  'Propuestas femeninas docentes excluidas indebidamente autorizadas');
assert(!api.approvedExamForms(bank,'gr1',14,{}).some(x=>
 expected.some(([,lemma,form])=>x.evidenceForm===form&&x.lemmas?.includes(lemma))),
 'La verificación no concede calificación automática');
const html=fs.readFileSync(path.join(root,'offline.html'),'utf8');
const marker='<script id="examina-offline-assets" type="application/json">';
const p=html.indexOf(marker),q=html.indexOf('</script>',p+marker.length);
assert(p>=0&&q>p,'Falta el banco de datos del archivo único');
const offlineIndex=JSON.parse(html.slice(p+marker.length,q))['data/lemmas/teacher-forms.json'];
assert.deepEqual(offlineIndex,bank,'PWA offline obsoleta o incongruente');
console.log('OK: cuatro dativos fuente 5; 559 IDs históricos, 10 fichas de ἐχθρός y 11 exclusiones intactos; PWA y banco sincronizados.');
