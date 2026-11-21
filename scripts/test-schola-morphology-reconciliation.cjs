'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {
 reconcile,keyForm,keyLemma,compare,getExamUnit,main
}=require('./reconcile-schola-morphology.cjs');
const generator=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/lemmas/teacher-forms.json'),'utf8'));
const schola={
 schema:'schola-morphology-source/v1',
 appendixSha:'a3d54209b3bb8a31efd3d57d62b09d6de8d85f5c',
 vocabulaSha:'0e16505b7631298a0448c4160a5d258f82732bfe',
 records:[
  {id:'greek-kephale',language:'griego',unit:7,kind:'sustantivo',
   paradigm:'κεφαλή, –ῆς · primera declinación',
   evidence:{status:'paradigma-documentado',source:'UniMorph',notes:'Pendiente de revisión individual'},
   forms:[{form:'κεφαλῇ',analysis:'dativo singular',case:'dativo',number:'singular'}]},
  {id:'latin-rosa',language:'latin',unit:1,kind:'sustantivo',
   paradigm:'rosa, rosæ · primera declinación',
   evidence:{status:'paradigma-documentado',source:'Appendix grammaticae'},
   forms:[{form:'rosæ',analysis:'genitivo singular',case:'genitivo',number:'singular'}]},
  {id:'latin4-amo',language:'latin4',unit:2,kind:'verbo',
   paradigm:'amo, amavi, amatum',
   evidence:{status:'paradigma-documentado',source:'Appendix grammaticae'},
   forms:[{form:'amat',analysis:'3.ª persona singular del presente de indicativo activo',
    person:'3.ª',number:'singular',tense:'presente de indicativo activo'}]},
  {id:'latin2-excluded',language:'latin2',unit:0,kind:'sustantivo',
   paradigm:'res, rei',forms:[{form:'res',analysis:'nominativo singular'}],
   evidence:{status:'paradigma-documentado'}}
 ]
};
assert.equal(keyLemma('κεφαλή, –ῆς','grc'),'κεφαλη');
assert.equal(keyForm('κεφᾰλῇ','grc'),keyForm('κεφαλῇ','grc'));
assert.notEqual(keyForm('τίς','grc'),keyForm('τις','grc'),'No borrar los acentos');
assert.notEqual(keyForm('ὅ','grc'),keyForm('ό','grc'),'No borrar los espíritus');
assert.notEqual(keyForm('τῷ','grc'),keyForm('τῶ','grc'),'No borrar la iota suscrita');
assert.equal(keyForm('rosæ','lat'),keyForm('rosae','lat'));
assert.equal(keyForm('amābam','lat'),keyForm('amabam','lat'));
assert.equal(getExamUnit(['UD 1–4']),4,'Grupo exigible, no unidad inicial');
assert.equal(getExamUnit(['UD 3','UD 5–6']),3);
assert.deepEqual(compare({kind:'N',case:'DAT',number:'SG'},
 {kind:'N',case:'GEN',number:'SG'}).conflicts,['case']);
assert.deepEqual(compare({kind:'V',voice:'DEP',person:'2'},
 {kind:'V',voice:'ACT',person:'2'}).unresolved,['voice']);
const base=JSON.stringify(generator);
const result=reconcile(schola,generator,{scholaCommit:'a'.repeat(40)});
assert.equal(JSON.stringify(generator),base,'El adaptador cambió el banco en memoria');
assert.equal(result.summary.scholaRecordsInScope,3);
assert.equal(result.summary.comparedCells,3);
assert.equal(result.summary.greekProvisionalCurricular,30);
assert.equal(generator.extensions.greek_nominal_candidates.quarantinedAccentForms,24);
assert.equal(result.summary.greekPriorityCategories.CUARENTENA_ACENTUACION||0,0);
assert(!result.greekCurricularCandidates.some(x=>x.lemma==='πρωτοσ'));
assert(!generator.rows.grc.some(x=>x[0]==='πρωτοσ'&&x[3]===4));
assert.equal(result.summary.greekPriorityCategories.EXCLUIDA_POR_DECISION_DOCENTE,11);
const κεφαλη=result.cells.find(x=>x.recordId==='greek-kephale');
assert.equal(κεφαλη.status,'ya_documentada_en_generador');
assert(κεφαλη.matches.some(x=>x.sourceCode===5&&x.compatible));
assert(!result.greekCurricularCandidates.some(x=>x.lemma==='κεφαλη'&&x.form==='κεφᾰλῇ'));
assert(result.cells.every(x=>x.automaticPromotion===false));
assert(result.greekCurricularCandidates.every(x=>x.automaticPromotion===false));
assert(!result.cells.some(x=>x.course==='latin2'));
assert(result.cells.find(x=>x.recordId==='latin-rosa').curricularWarning===undefined);
assert.throws(()=>reconcile({...schola,schema:'desconocido'},generator),/Schema ScholaClassica/);
assert.throws(()=>reconcile({...schola,records:[{
 ...schola.records[0],evidence:{status:'sin_documentar'}}]},generator),/Ficha Schola sin fuente/);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'examina-schola-audit-'));
try{
 const source=path.join(temp,'schola.json'),gen=path.join(temp,'generator.json'),out=path.join(temp,'report.json');
 fs.writeFileSync(source,JSON.stringify(schola));
 fs.writeFileSync(gen,JSON.stringify(generator));
 const origSource=fs.readFileSync(source),origGen=fs.readFileSync(gen);
 main(['--schola',source,'--generador',gen,'--report',out]);
 assert.deepEqual(fs.readFileSync(source),origSource);
 assert.deepEqual(fs.readFileSync(gen),origGen);
 const saved=JSON.parse(fs.readFileSync(out,'utf8'));
 assert.equal(saved.policy.automaticPromotions,0);
 assert.equal(saved.summary.greekProvisionalCurricular,30);
 assert.throws(()=>main(['--schola',source,'--generador',gen,'--report',gen]),/sobrescribir bancos/);
}finally{fs.rmSync(temp,{recursive:true,force:true})}
console.log('Conciliación ScholaClassica: 30 candidatas curriculares restantes, 24 de πρῶτος en cuarentena histórica, sin promoción automática.');
