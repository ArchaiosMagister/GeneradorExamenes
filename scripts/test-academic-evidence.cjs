'use strict';
// Regresiones académicas de la fase II: una forma no equivale a un paradigma.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../verification-review.js'),'utf8');
const sandbox={
 window:{},document:{readyState:'loading',addEventListener(){}},
 localStorage:{getItem:()=>null,setItem:()=>{}}
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'verification-review.js'});
const api=sandbox.window.ExaminaTeacherReview;
const data={
 schema:1,
 vocabulary:{
  lat:{
   amo:{lat1:{entry:'amo, amavi, amatum (1ª)',units:['UD 1']}},
   puella:{lat1:{entry:'puella, –ae',units:['UD 1']}},
   avis:{lat1:{entry:'avis, avis (f.)',units:['UD 1']}}
  },
  grc:{
   agathos:{gr1:{entry:'ἀγαθός, –ή, –όν',units:['UD 5']}},
   logos:{gr1:{entry:'λόγος, –ου',units:['UD 1']}}
  }
 },
 rows:{
  lat:[
   ['amo','amo','DOCENTE;presente;1.sg',1],
   ['amo','amabam','V;IND;ACT;PST;IPFV;1;SG',2],
   ['amo','amabitur','V;IND;PASS;FUT;3;SG',2],
   ['amo','amavi','V;IND;ACT;PRF;1;SG',2],
   ['amo','amatus sum','V;PTCP;PASS;PRF',2],
   ['puella','puellae','N;GEN;SG',2],
   ['avis','aves','N;NOM;PL',2],
   ['amo','amabam','LEX;ENTRY',3]
  ],
  grc:[
   ['agathos','ἀγαθή','ADJ;NOM;SG;FEM',4],
   ['logos','λόγου','N;GEN;SG',4],
   ['logos','λόγος','N;NOM;SG',0]
  ]
 }
};
const [verified,imperfect,future,perfect,compound,puella,avis,lexical]=data.rows.lat;
const [adj,greekNoun,greekDocumented]=data.rows.grc;
assert.equal(api.evidenceState(1),'verificada');
assert.equal(api.evidenceState(5),'verificada');
assert.equal(api.evidenceState(0),'documentada');
assert.equal(api.evidenceState(2),'propuesta');
assert.equal(api.evidenceState(4),'propuesta');
for(const source of [3,6,7,9])assert.equal(api.evidenceState(source),'no_disponible');
assert.equal(api.evidenceApproved('lat1',imperfect,{}),false);
assert.throws(()=>api.evidenceGrant('lat1',verified,{}),/Solo pueden autorizarse/);
assert.equal(api.evidenceCurricular('lat1',imperfect[2],1),false);
assert.equal(api.evidenceCurricular('lat1',imperfect[2],2),true);
assert.equal(api.evidenceCurricular('lat1',future[2],6),false);
assert.equal(api.evidenceCurricular('lat1',future[2],7),true);
assert.equal(api.evidenceCurricular('lat1',perfect[2],3),false);
assert.equal(api.evidenceCurricular('lat1',perfect[2],4),true);
assert.equal(api.evidenceCurricular('lat1',compound[2],9),false,
 'Una forma del perfectum pasivo no se aprueba como simple presente');
assert.equal(api.evidenceCurricular('gr1',adj[2],4),false);
assert.equal(api.evidenceCurricular('gr1',adj[2],5),true);
assert.equal(api.evidenceCurricular('gr1',greekNoun[2],7),false);
assert.equal(api.evidenceCurricular('gr1',greekNoun[2],8),true);
let decisions=api.evidenceGrant('lat1',imperfect,{});
assert.equal(api.evidenceApproved('lat1',imperfect,decisions),true);
assert.equal(api.evidenceApproved('lat1',future,decisions),false,
 'No puede heredarse la autorización a otras formas del mismo verbo');
assert.equal(api.evidenceApproved('gr1',imperfect,decisions),false,
 'La aprobación no puede saltar de curso');
assert.equal(decisions[api.evidenceKey('lat1',imperfect)].verified,false);
assert.equal(api.approvedExamForms(data,'lat1',1,decisions).length,0);
let available=api.approvedExamForms(data,'lat1',2,decisions);
assert.equal(available.length,1);
assert.equal(available[0].form,'amabam');
assert.equal(available[0].evidenceSource,'Modelo regular · forma candidata');
assert(available[0].answer.includes('no verificada'));
assert.equal(api.approvedExamForms(data,'lat1',9,decisions).some(x=>x.form==='amatus sum'),false);
decisions=api.evidenceGrant('lat1',puella,decisions);
decisions=api.evidenceGrant('lat1',avis,decisions);
assert(api.approvedExamForms(data,'lat1',4,decisions).some(x=>x.form==='puellae'));
assert(!api.approvedExamForms(data,'lat1',4,decisions).some(x=>x.form==='aves'),
 'La tercera declinación no se infiere de un enunciado nominal no contrastado');
decisions=api.evidenceGrant('gr1',adj,decisions);
let greek=api.approvedExamForms(data,'gr1',5,decisions);
assert.equal(greek.length,1);assert.equal(greek[0].kind,'forms');
assert.equal(greek[0].verified,false);
assert.equal(greek[0].teacherAuthorized,true);
assert.equal(api.approvedExamForms(data,'gr1',4,decisions).length,0);
const marker=api.evidenceAttributes(available[0]);
assert(marker.includes('data-academic-key')&&marker.includes('data-academic-form'));
const node={dataset:{academicKey:encodeURIComponent(available[0].evidenceKey),
 academicForm:encodeURIComponent(available[0].evidenceForm)},
 textContent:'amabam',querySelector:()=>null};
const paper={querySelectorAll:()=>[node]};
assert.equal(api.evidenceCheckExam(paper,'lat1',decisions).ok,true);
node.textContent='amabas';
assert.equal(api.evidenceCheckExam(paper,'lat1',decisions).ok,false,
 'La edición de la forma no debe conservar la autorización anterior');
node.textContent='amabam';
decisions=api.evidenceRevoke('lat1',imperfect,decisions);
assert.equal(api.evidenceCheckExam(paper,'lat1',decisions).ok,false,
 'La revocación debe bloquear una forma ya seleccionada');
assert.equal(api.evidenceApproved('lat1',imperfect,decisions),false);
assert.deepEqual(api.evidenceRows(data,'lat1',1).map(x=>x[1]).sort(),
 ['amabam','amabitur','amatus sum','amavi','aves','puellae'].sort(),
 'Las propuestas conservan su trazabilidad aunque aún no sean curriculares');
assert.equal(api.evidenceState(lexical[3]),'no_disponible');
assert.equal(api.evidenceState(greekDocumented[3]),'documentada');
console.log('Control académico: fuentes, decisión exacta, currículo, revocación, edición y ausencia de promoción verificados.');
