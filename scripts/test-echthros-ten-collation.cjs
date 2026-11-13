'use strict';
// Cotejo académico de 10 lecturas, sin cambiar fuentes ni habilitar preguntas automáticas.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const get=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const review=get('data/lemmas/cotejo-10-echthros-20261113.json');
const historical=get('data/lemmas/revision-559-griego-20261113.json');
const bank=get('data/lemmas/teacher-forms.json');
const policy=get('data/lemmas/greek-adjective-decisions.json');
const stripQuantity=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/g,'').normalize('NFC');
const expected=[
 ['159','ἐχθρά','ADJ;NOM;SG;FEM',true],
 ['160','ἐχθρά','ADJ;VOC;SG;FEM',true],
 ['161','ἐχθρᾷ','ADJ;DAT;SG;FEM',false],
 ['162','ἐχθραί','ADJ;NOM;PL;FEM',true],
 ['163','ἐχθραί','ADJ;VOC;PL;FEM',true],
 ['164','ἐχθραῖς','ADJ;DAT;PL;FEM',false],
 ['165','ἐχθράν','ADJ;ACC;SG;FEM',false],
 ['166','ἐχθράς','ADJ;ACC;PL;FEM',false],
 ['167','ἐχθρᾶς','ADJ;GEN;SG;FEM',false],
 ['168','ἐχθρῶν','ADJ;GEN;PL;FEM',true]
];
assert.equal(review.schema,'examina-greek-individual-morphology-collation/v1');
assert.equal(review.headword,'ἐχθρός, –ά, –όν');
assert.equal(review.items.length,10);
assert.deepEqual([...review.summary.reviewed,review.summary.morphologyConfirmed,
 review.summary.distinctSurfaceForms,review.summary.syncreticReadings,
 review.summary.otherReadings,review.summary.source5Promotions,
 review.summary.newAutomaticExamForms],[10,10,8,5,5,0,0]);
const decision=policy.decisions.find(x=>x.lemma==='εχθροσ');
assert(decision&&decision.policy==='VERIFICACION_INDIVIDUAL');
const saved=new Set(),surfaces=new Set();
for(const [i,form,tags,amb] of expected){
 const id='grc-pending-'+i;
 const r=review.items.find(x=>x.id===id);
 const h=historical.items.find(x=>x.id===id);
 assert(r&&h,'Falta la ficha '+id);
 assert(!saved.has(id)); saved.add(id);
 assert.equal(r.lemma,'εχθροσ');
 assert.equal(r.schoolForm,form);
 assert.equal(r.analysis,tags);
 assert.equal(r.ambiguityInParadigm,amb);
 assert.equal(h.sourceForm,r.originalSourceForm);
 assert.equal(stripQuantity(h.sourceForm),form);
 assert.equal(h.analysis,tags);
 assert.equal(h.originalSource,4);
 assert.equal(r.indexSourceCode,4);
 assert(r.spellingVerified&&r.analysisVerified);
 assert.equal(r.evidenceState,'CONCORDANCIA_EXPLICITA_EN_PARADIGMA_ATICO');
 assert(/^https:\/\//.test(r.reference)&&/^https:\/\//.test(r.independentParadigmCrosscheck));
 assert(!r.individualAuthorizationAdded&&!r.automaticGradingEnabled);
 assert(bank.rows.grc.some(x=>x[0]==='εχθροσ'&&x[1]===h.sourceForm&&x[2]===tags&&x[3]===4));
 assert(!bank.rows.grc.some(x=>x[0]==='εχθροσ'&&x[1]===form&&x[2]===tags&&x[3]===5));
 assert(decision.candidateIds.includes(id));
 surfaces.add(form);
 // La ambigüedad se calcula sobre todas las lecturas documentadas de ese lema,
 // incluyendo las del neutro plural y masculino/neutro del genitivo plural.
 const readings=new Set(bank.rows.grc.filter(x=>x[0]==='εχθροσ'&&stripQuantity(x[1])===form)
  .map(x=>x[2]));
 assert.equal(readings.size>1,amb,'Sincretismo mal etiquetado: '+id);
}
assert.equal(saved.size,10);
assert.equal(surfaces.size,8);
assert.equal(bank.vocabulary.grc.εχθροσ.gr1.entry,'ἐχθρός, –ά, –όν');
assert.equal(bank.counts.grc.wikcionario,559);
assert.equal(bank.counts.grc.contrastado,464);
console.log('ἐχθρός: 10/10 cotejos morfológicos, ocho grafías, cinco lecturas con sincretismo; sin promociones ni cambios en el sorteo.');
