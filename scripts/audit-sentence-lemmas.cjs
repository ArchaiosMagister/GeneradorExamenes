'use strict';
/*
 * Auditoría reproducible del lematizador que emplean los glosarios de examen.
 * Fuente: banco docente real + índice persistente publicado (no corpus inventado).
 * No acredita flexiones adicionales ni reescribe fichas filológicas.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const name of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(name),ctx,{filename:name});
const engine=ctx.window.ExaminaVocabulary;
const reference=ctx.window.ExaminaOfflineLemmatizer;
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html');
const start=html.indexOf('let vocab=');
assert(start>0,'No se encontró el banco incluido en los exámenes');
const bank=JSON.parse(html.slice(start+'let vocab='.length,html.indexOf(';',start)));
for(const found of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 bank.push(...JSON.parse(found[1]));
const banks={
 lat1:bank.filter(x=>(x.course||'latin1')==='latin1'),
 lat4:bank.filter(x=>x.course==='latin4'),
 gr1:bank.filter(x=>x.course==='greek1')
};
const analyze=(course,text)=>engine.analyze(data,text,course,banks[course],{contextual:true});
const get=(rows,form)=>rows.find(row=>row.form===form);
const expected=[
 ['lat1','puellam','puella'],
 ['lat1','amamus','amo'],
 ['lat1','vicerunt','vinco'],
 ['lat4','vicerunt','vinco'],
 ['gr1','ὁ','ο'],
 ['gr1','οἱ','ο']
];
for(const [course,form,lemma] of expected){
 const x=get(analyze(course,form),form);
 assert.equal(x?.status,'documented',course+'/'+form+': falta la identificación documentada');
 assert.equal(reference.normalize(x.lemma),reference.normalize(lemma),course+'/'+form+': lema incorrecto');
 assert(x.entry&&x.meaning,course+'/'+form+': falta enunciado o traducción');
}
for(const [course,form,lemmas] of [
 ['lat1','Galli',['gallus','galli']],
 ['lat1','bona',['bonus','bona']],
 ['lat4','bona',['bonus','bona']]
]){
 const x=get(analyze(course,form),form);
 assert.equal(x?.status,'review','Una homografía no debe resolverse automáticamente: '+course+'/'+form);
 assert(lemmas.every(lemma=>x.candidates.some(c=>reference.normalize(c.lemma)===lemma)),
  'Faltan alternativas con lema distinto: '+course+'/'+form);
}
for(const [course,form] of [['lat1','formainventada'],['gr1','ἀνεύρετον']]){
 const x=get(analyze(course,form),form);
 assert(x&&x.status!=='documented',course+'/'+form+': se inventó una identificación');
}
const repeated=analyze('lat1','Galli pugnant.\nGalli pugnant.');
const galli=repeated.filter(row=>row.form==='Galli');
assert.equal(galli.length,2,'La segunda oración repetida desapareció del análisis');
assert.notEqual(galli[0].identity,galli[1].identity,
 'Dos apariciones de idéntico contexto no deben compartir decisión');
assert.equal(galli[0].status,'review');
assert.equal(galli[1].status,'review');
const chosen=galli[0].candidates.find(c=>reference.normalize(c.lemma)==='gallus');
assert(chosen&&chosen.meaning,'No se ofrece el adjetivo correcto para revisión');
const project={course:'lat1',lang:'es',count:1,wordAlternatives:false,
 units:[{title:'UD6',mode:'complete',text:'Galli pugnant.\nGalli pugnant.',
 analyzed:true,rows:repeated.map(row=>row.identity===galli[0].identity?
  {...row,...chosen,status:'manual'}:row)}]};
const xml=engine.documentXml(project);
assert(xml.includes(chosen.entry),'La elección de la primera aparición no pasó a Word');
assert(xml.includes('Pendientes de revisión (*)'),
 'La segunda aparición debe seguir marcada como pendiente');
assert(xml.includes('Galli'),'La aparición pendiente no puede desaparecer del Word');
const unknown=analyze('lat1','PalabraSinBanco.');
const pendingXml=engine.documentXml({...project,units:[{title:'UD6',mode:'complete',rows:unknown}]});
assert(pendingXml.includes('Pendientes de revisión (*)'),'El Word ocultó una forma sin prueba');
assert(!pendingXml.includes('documentada automáticamente'),'No atribuir una verificación falsa');
const coverage={};
for(const [course,courseBank] of Object.entries(banks)){
 assert(courseBank.length>0,'Banco vacío: '+course);
 const rows=data.rows[course==='gr1'?'grc':'lat'];
 const cited=rows.filter(x=>x[3]===3).length;
 const attested=rows.filter(x=>[0,1,5,6,7].includes(x[3])).length;
 coverage[course]={fichasDocentes:courseBank.length,registrosDocumentadosEnIdioma:attested,
  citasEnIdioma:cited};
 assert(attested>0);
}
console.log('AUDITORÍA LEMATIZACIÓN OK:',JSON.stringify(coverage));
console.log('Flexiones, ambigüedades, oraciones repetidas, desconocidas, decisiones independientes y Word: OK');
