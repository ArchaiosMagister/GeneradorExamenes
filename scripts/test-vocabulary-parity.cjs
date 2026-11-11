#!/usr/bin/env node
/* Regresión de paridad entre el glosario de oraciones de los exámenes
 * y el generador por unidades. Sin red, sin soluciones inventadas y
 * sin aprobar flexiones por el mero hecho de identificar un lema.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const name of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(name),ctx,{filename:name});
const engine=ctx.window.ExaminaVocabulary;
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html');
assert.match(html,/return engine\.entries\(engine\.analyze\(data,text,\(\{latin1:'lat1',latin4:'lat4',greek1:'gr1'\}\)\[course\],bank,\{contextual:true\}\)\)/,
 'El glosario de exámenes debe utilizar el análisis contextual del generador por unidades');
const first=html.indexOf('let vocab=');
assert(first>0,'No se encuentra el vocabulario docente');
const start=first+'let vocab='.length;
const vocab=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const match of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 vocab.push(...JSON.parse(match[1]));
const courseId={lat1:'latin1',lat4:'latin4',gr1:'greek1'};
const teacherBank=course=>vocab.filter(row=>(row.course||'latin1')===courseId[course]);
const cases=[
 {course:'lat1',label:'Latín I: diez oraciones',
  texts:JSON.parse(read('tests/latin-vocabulary-sentences.json')).sentences},
 {course:'lat4',label:'Latín 4.º: contexto, enclíticas y perfecto',
  texts:['Terra marique fortissime timebant fortitudinem.',
   'Puer puellam amat. Servus domino dat.']},
 {course:'gr1',label:'Griego I: catorce unidades',
  texts:JSON.parse(read('data/vocabulary/greek1-units-corrected.json')).units.map(u=>u.text).filter(Boolean)}
];
let total=0;
for(const example of cases){
 const bank=teacherBank(example.course);
 assert(bank.length,example.course+' sin banco docente');
 const summary={course:example.course,label:example.label,documents:example.texts.length,
  tokens:0,documented:0,review:0,unknown:0};
 for(const text of example.texts){
  const unitRows=engine.analyze(data,text,example.course,bank,{contextual:true});
  const examRows=engine.entries(engine.analyze(data,text,example.course,bank,{contextual:true}));
  const published=new Set(examRows.filter(r=>r.status==='documented').map(r=>r.lemma));
  for(const row of unitRows){
   summary.tokens++;
   summary[row.status]=(summary[row.status]||0)+1;
   // La agregación del examen puede eliminar repeticiones, nunca el lema
   // documentado que aparece en las unidades.
   if(row.status==='documented'&&row.lemma)
    assert(published.has(row.lemma),example.course+'/'+row.form+' falta en el glosario de examen');
   // Un candidato léxico no verificado no basta para certificar una flexión.
   assert(['documented','review','unknown'].includes(row.status),row.form);
  }
 }
 assert(summary.tokens>10,example.course+' corpus insuficiente');
 total+=summary.tokens;
 console.log('PARIDAD_LEMATIZACION '+JSON.stringify(summary));
}
// Los homógrafos de ambos idiomas deben conservar su contexto.
for(const [course,text,word,minChoices] of [
 ['lat1','Regina bona est.','bona',2],
 ['lat4','Est panem.','Est',2],
 ['gr1','τίς ἐστιν; τις λέγει.','τίς',1]
]){
 const rows=engine.analyze(data,text,course,teacherBank(course),{contextual:true});
 const candidate=rows.find(r=>r.form===word);
 assert(candidate&&candidate.candidates.length>=minChoices,course+' ambiguo: '+word);
}
for(const [form,entry,lemma] of [
 ['laudati','laudo, laudavi, laudatum (1ª)','laudo'],
 ['vulneratus','vulnero, vulneravi, vulneratum (1ª)','uulnero'],
 ['ædificata','ædifico, ædificavi, ædificatum (1ª)','aedifico']
]){
 const result=engine.analyze(data,form,'lat1',[{entry,meaning:'glosa del profesor'}],{contextual:true})[0];
 assert.equal(result.status,'documented',form+' se reconoce a partir del supino coherente');
 assert.equal(result.lemma,lemma);
 assert.equal(result.meaning,'glosa del profesor');
}
const fictitious=engine.analyze(data,'fantoma','lat1',[
 {entry:'amo, amavi, fantomum (1ª)',meaning:'amar'}],{contextual:true})[0];
assert.equal(fictitious.status,'review','No documentar forma deducida de un supino incoherente');
console.log('PARIDAD_TOTAL '+total+' apariciones, tres cursos y dos destinos');
