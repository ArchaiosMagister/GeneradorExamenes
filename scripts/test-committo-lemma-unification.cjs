'use strict';
// Regresión filológica: una sola identidad canónica committo para dos cursos.
// La corrección de un lema NO certifica sus 18 formas regulares propuestas.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),offline=read('offline.html');
const corpus=JSON.parse(read('data/lemmas/teacher-forms.json'));
const policy=JSON.parse(read('data/lemmas/latin-editorial-decisions.json'));
const win={window:{}};
vm.runInNewContext(read('required-latin-units.js'),win);
const required=JSON.parse(JSON.stringify(win.window.ExaminaRequiredLatinUnits.courses));
function rows(start,end){
 const begin=html.indexOf(start);
 assert(begin>0,'Banco latino ausente: '+start);
 const a=begin+start.length,b=html.indexOf(end,a);
 assert(b>a,'Banco latino incompleto: '+start);
 return JSON.parse(html.slice(a,b));
}
const latin1=rows('let vocab=',';\n'),latin4=rows('vocab.push(...',');\n');
const previous='commito, commisi, commissum (3ª)';
const corrected='committo, commisi, commissum (3ª)';
const latin4Entry='committō, commīsī, commissum (3ª)';
assert.equal(latin1.filter(x=>x.unit==='UD4'&&x.entry===corrected&&x.meaning==='entablar').length,1);
assert(!latin1.some(x=>x.entry===previous),'Grafía errónea en vocabulario general');
assert.equal(latin4.filter(x=>x.unit==='UD7'&&x.entry===latin4Entry&&x.meaning==='emprender').length,1);
assert(required.latin1.UD4.includes(corrected),'Exigible sin corregir');
assert(!required.latin1.UD4.includes(previous),'Exigible conserva grafía antigua');
assert(required.latin4.UD7.includes(latin4Entry),'La lista exigible de 4.º ha cambiado');
assert.equal(corpus.vocabulary.lat.committo?.lat1?.entry,corrected);
assert.deepEqual(corpus.vocabulary.lat.committo?.lat1?.units,['UD 4']);
assert.equal(corpus.vocabulary.lat.committo?.lat4?.entry,latin4Entry);
assert.deepEqual(corpus.vocabulary.lat.committo?.lat4?.units,['UD 7']);
assert(!Object.hasOwn(corpus.vocabulary.lat,'commito'),'No debe sobrevivir la clave léxica incorrecta');
assert(!corpus.rows.lat.some(row=>row[0]==='commito'),'No deben quedar flexiones bajo el lema incorrecto');
const rowsCanonical=corpus.rows.lat.filter(row=>row[0]==='committo');
assert.equal(rowsCanonical.filter(row=>row[3]===2).length,18,
 'Solo dieciocho propuestas regulares bajo una clave; no duplicar ambos paradigmas');
assert(rowsCanonical.some(x=>x[1]==='committis'&&x[2]==='V;IND;ACT;PRS;2;SG'&&x[3]===2));
assert(rowsCanonical.some(x=>x[1]==='committunt'&&x[2]==='V;IND;ACT;PRS;3;PL'&&x[3]===2));
assert(rowsCanonical.some(x=>x[1]==='committebam'&&x[2]==='V;IND;ACT;PST;IPFV;1;SG'&&x[3]===2));
assert(!rowsCanonical.some(x=>/^commiteb|^commitis$|^commito$/.test(x[1])));
assert.equal(corpus.counts.lat.contrastado,619,'No acreditar formas derivadas automáticamente');
assert.equal(corpus.counts.lat.modelo,3298,
 'Unificar los dos registros debe retirar las dieciocho propuestas incorrectas');
const decision=policy.decisions.find(x=>x.id==='committo-lat1-unify');
assert(decision,'Falta la decisión persistente de unificación');
assert.equal(decision.fromLemma,'commito');
assert.equal(decision.toLemma,'committo');
assert.equal(decision.mergeExistingCourse,'lat4');
assert.equal(decision.verifiedMorphology,false);
assert.equal(decision.preserveMeaning,true);
assert(offline.includes(JSON.stringify(corrected)),'HTML autónomo sin ficha corregida');
assert(!offline.includes(JSON.stringify(previous)),'PWA conserva la ficha errónea');
// La migración afecta solo a las listas sembradas, nunca a las fichas manuales.
const first=html.indexOf('function migrateSeededLatinVerbEntries(items){');
const end=html.indexOf('if(migrateSeededLatinVerbEntries(examRequired))saveRequired();',first);
assert(first>0&&end>first,'Migración de listas no encontrada');
const migrate=new Function('examKey',html.slice(first,end)+'return migrateSeededLatinVerbEntries;')
  (entry=>entry.split(',')[0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim());
const oldSeed={origin:'listado docente exigible',course:'latin1',unit:'UD4',
 key:'commito',entry:previous,meaning:'glosa docente conservada'};
const manual={origin:'manual',course:'latin1',unit:'UD4',key:'commito',
 entry:previous,meaning:'mi modificación'};
const otherCourse={origin:'listado docente exigible',course:'latin4',unit:'UD7',
 key:'committo',entry:latin4Entry,meaning:'emprender'};
const list=[oldSeed,manual,otherCourse];
assert.equal(migrate(list),true);
assert.equal(oldSeed.entry,corrected);
assert.equal(oldSeed.key,'committo');
assert.equal(oldSeed.meaning,'glosa docente conservada');
assert.equal(manual.entry,previous,'No sobrescribir una ficha manual');
assert.equal(manual.key,'commito','No reasignar las claves del contenido manual');
assert.equal(otherCourse.entry,latin4Entry,'No modificar el otro curso');
assert.equal(migrate(list),false,'La migración debe ser idempotente');
// Comprobar el motor de flexión que alimenta las tablas evaluables.
const start=html.indexOf('function verb(x){');
const stop=html.indexOf('// Espaciados docentes de formato',start);
assert(start>=0&&stop>start,'Motor de conjugación no encontrado');
const verb=new Function(html.slice(start,stop)+'return verb;')();
assert.deepEqual(verb({entry:corrected}).forms,
 ['committo','committis','committit','committimus','committitis','committunt']);
const lex={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(file),lex,{filename:file});
const api=lex.window.ExaminaVocabulary;
for(const course of ['lat1','lat4']){
 const bank=course==='lat1'?latin1:latin4;
 const proposals=api.analyze(corpus,'committunt',course,bank,{contextual:true})[0];
 assert(proposals.candidates.some(c=>c.lemma==='committo'),
  course+': no se muestra el lema correcto al consultar committunt');
 assert(!proposals.candidates.some(c=>c.lemma==='commito'),
  course+': la lematización conserva una identidad duplicada');
}
console.log('Unificación committo: Latín I y Latín 4.º comparten un lema, 18 candidaturas no evaluables, migración estricta y PWA coherente.');

// CI final: ejecutar también esta regresión tras crear la PR de revisión.
