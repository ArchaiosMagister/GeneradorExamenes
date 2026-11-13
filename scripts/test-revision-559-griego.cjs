'use strict';
/* Auditoría de forma individual, sin cambiar las fuentes ni convertir propuestas en verificadas. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const get=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const bank=get('data/lemmas/teacher-forms.json');
const extract=get('data/lemmas/greek-nominal-candidates.json');
const review=get('data/lemmas/revision-559-griego-20261113.json');
const simplify=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/g,'').normalize('NFC');
const key=(lemma,form,tags)=>JSON.stringify([lemma,form,tags]);
assert.equal(review.schema,'examina-greek-morphology-triage/v1');
assert.equal(review.items.length,559);
assert.equal(review.summary.total,559);
const original=bank.rows.grc.filter(x=>x[3]===4);
assert.equal(original.length,559);
const originalKeys=new Set(original.map(x=>key(x[0],x[1],x[2])));
assert.equal(originalKeys.size,559);
const sourceByLemma=new Map(extract.entries.map(x=>[x.lemma,x]));
const ids=new Set(),seen=new Set(),byStatus={},byUnit={with:0,without:0};
let matches=0,missing=0,teacher=0,corrections=0;
for(const item of review.items){
 assert(item.id&& !ids.has(item.id),'ID ausente o duplicado');
 ids.add(item.id);
 assert.equal(item.language,'grc');
 assert.equal(item.originalSource,4);
 assert.equal(item.verifiedIndividual,false);
 assert.equal(item.gradeEligible,false);
 assert(Boolean(item.sourceForm&&item.schoolForm));
 assert.equal(item.analysis.includes(';'),true);
 const k=key(item.lemma,item.sourceForm,item.analysis);
 assert(originalKeys.has(k),'La forma fuente cambió: '+k);
 assert(!seen.has(k),'Forma duplicada');
 seen.add(k);
 assert.equal(item.schoolForm,simplify(item.sourceForm),'Ortografía escolar no reproducible');
 const vocab=bank.vocabulary.grc[item.lemma]?.gr1;
 assert(vocab,'Sin lema docente: '+item.lemma);
 // La auditoría es histórica y conserva el enunciado previo a la decisión.
 if(item.lemma==='εχθροσ'){
  assert.equal(item.teacherEntry,'ἐχθρός, –ον');
  assert.equal(vocab.entry,'ἐχθρός, –ά, –όν');
 }else assert.equal(item.teacherEntry,vocab.entry);
 assert.deepEqual(item.units,vocab.units);
 const entry=sourceByLemma.get(item.lemma);
 const has=Boolean(entry?.forms?.some(y=>y[0]===item.sourceForm&&y[1]===item.analysis));
 assert.equal(item.extractPresent,has,'Trazabilidad extracto: '+k);
 assert.equal(item.reference,entry?.source_page||null);
 if(has)matches++;else missing++;
 if(item.units.length)byUnit.with++;else byUnit.without++;
 byStatus[item.status]=(byStatus[item.status]||0)+1;
 const mustTeacher=['αθανατοσ','εχθροσ'].includes(item.lemma)||
  (item.lemma==='αισχροσ'&&item.analysis.endsWith(';FEM'));
 assert.equal(item.requiresTeacherDecision,mustTeacher);
 if(item.requiresTeacherDecision)teacher++;
 if(item.status==='ACENTO_INCORRECTO_EN_FUENTE'){
  assert.equal(item.lemma,'πρωτοσ');
  assert(item.proposedCorrection&&item.proposedCorrection!==item.schoolForm);
  corrections++;
 }
 if(item.status==='ERRATA_CORREGIDA_ENUNCIADO_DOCENTE'){
  assert.equal(item.originalTeacherEntry,'κεφαλῆ, –ῆς');
  assert.equal(item.teacherEntry,'κεφαλή, –ῆς');
  assert.equal(item.lemma,'κεφαλη');
  assert.equal(item.proposedCorrection,'κεφαλή, –ῆς');
 }
}
assert.equal(matches,510);
assert.equal(missing,49);
assert.equal(byUnit.with,68);
assert.equal(byUnit.without,491);
assert.equal(teacher,21);
assert.equal(corrections,24);
assert.equal(new Set(review.items.map(x=>x.lemma)).size,68);
const expected={
 SIN_UNIDAD_Y_ORIGEN_NO_REPRODUCIBLE:49,SIN_UNIDAD:442,
 ACENTO_INCORRECTO_EN_FUENTE:24,
 VARIANTE_DE_TERMINACIONES_PARA_DECISION_DOCENTE:21,
 ERRATA_CORREGIDA_ENUNCIADO_DOCENTE:1,LECTURA_CON_PARADIGMA_A_COTEJAR:21,VARIANTE_EPICA_FUERA_DE_CURRICULO:1
};
assert.deepEqual(byStatus,expected);
assert.deepEqual(review.summary.byStatus,expected);
assert.equal(review.summary.verifiedPromoted,0);
assert.equal(review.summary.gradeEligibleNew,0);
assert.equal(bank.counts.grc.wikcionario,559);
assert.equal(bank.counts.grc.contrastado,464);
assert.equal(bank.counts.lat.modelo,3244);
// Comprobar que la auditoría no ha convertido accidentalmente a fuente 5 ninguna propuesta.
const verifiedKeys=new Set(bank.rows.grc.filter(x=>x[3]===5).map(x=>key(x[0],x[1],x[2])));
assert(review.items.every(x=>!verifiedKeys.has(key(x.lemma,x.sourceForm,x.analysis))));
console.log('Revisión griega: 559/559 propuestas identificadas, 0 promociones, 21 lecturas sujetas a criterio docente.');
