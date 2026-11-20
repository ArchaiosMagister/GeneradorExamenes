'use strict';
// Contrastar el enunciado docente, el listado exigible y el índice reproducible.
// Corregir un lema NO acredita automáticamente sus formas flexivas.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
const html=read('index.html');
const index=JSON.parse(read('data/lemmas/teacher-forms.json'));
const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
const ctx={window:{}};
vm.runInNewContext(read('required-latin-units.js'),ctx);
const required=JSON.parse(JSON.stringify(ctx.window.ExaminaRequiredLatinUnits.courses));
function extract(suffix,end){
 const start=html.indexOf(suffix);
 assert(start>=0,'Falta el banco '+suffix);
 const begin=start+suffix.length;
 const finish=html.indexOf(end,begin);
 assert(finish>begin,'Banco incompleto '+suffix);
 return JSON.parse(html.slice(begin,finish));
}
const banks={latin1:extract('let vocab=',';\n'),latin4:extract('vocab.push(...',');\n')};
const cases=[
 ['latin1','solvo','solvo, solvi, solutum (2ª)','solvo, solvi, solutum (3ª)'],
 ['latin1','vivo','vivo, vixi, vivitum (4ª)','vivo, vixi, victum (3ª)'],
 ['latin1','sepelio','sepelio, sepelii, sepultum (3ª)','sepelio, sepelii, sepultum (4ª)'],
 ['latin4','polliceor','pollĭcĕor, pollĭcĭtus sum (3ª)','pollĭcĕor, pollĭcĭtus sum (2ª)'],
 ['latin1','cognosco','cognosco, cognovit, cognotum (3ª)','cognosco, cognovi, cognitum (3ª)'],
 ['latin1','deligo','deligo, delegi, delictum (3ª)','deligo, delegi, delectum (3ª)'],
 ['latin1','maneo','maneo, manui, mansum (2ª)','maneo, mansi, mansum (2ª)'],
 ['latin1','appropinquo','appropinquo, appropinquavi, approprinquatum (1ª)','appropinquo, appropinquavi, appropinquatum (1ª)'],
 ['latin1','peto','peto, petivi, petitium (3ª)','peto, petii, petitum (3ª)'],
 ['latin1','occido','occido, occidi, occissum (3ª)','occido, occidi, occisum (3ª)'],
 ['latin1','adiuvo','adiuvo, adiuvavi, adiuvatum (1ª)','adiuvo, adiuvi, adiutum (1ª)']
];
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/[–−—]/g,'-').replace(/æ/gi,'ae').replace(/œ/gi,'oe').trim();
const begin=html.indexOf('function mVerb(raw){');
const end=html.indexOf('// Corrections for conjugation:',begin);
assert(begin>=0&&end>begin,'Motor regular no localizable');
const mVerb=new Function('mNormalize',html.slice(begin,end)+'return mVerb;')(norm);
for(const [course,lemma,before,after] of cases){
 const vocabulary=banks[course].filter(x=>x.entry===after);
 assert(vocabulary.length>=1,course+'/'+lemma+': falta la corrección en el banco general');
 assert(!banks[course].some(x=>x.entry===before),course+'/'+lemma+': enunciado antiguo en el banco');
 const requiredEntries=Object.values(required[course]).flat();
 assert(requiredEntries.includes(after),course+'/'+lemma+': falta en el listado exigible');
 assert(!requiredEntries.includes(before),course+'/'+lemma+': enunciado antiguo exigible');
 const indexed=index.vocabulary.lat[lemma]?.[course==='latin1'?'lat1':'lat4']?.entry;
 assert.equal(indexed,after,course+'/'+lemma+': índice persistentemente divergente');
 if(lemma!=='polliceor'){
  const conjugation=mVerb(after);
  assert(conjugation,course+'/'+lemma+': no se admite el nuevo enunciado completo');
 }else assert.equal(mVerb(after),null,'No construir un deponente por analogía activa');
 const editorial=overrides.entryCorrections.filter(x=>x.lang==='lat'&&x.lemma===lemma&&
  x.course===(course==='latin1'?'lat1':'lat4'));
 if(['solvo','vivo','sepelio','polliceor','deligo','maneo','appropinquo','peto'].includes(lemma)){
  assert.equal(editorial.length,1,'Corrección persistente ausente: '+lemma);
  assert.equal(editorial[0].from,before);
  assert.equal(editorial[0].to,after);
  assert(/^https:\/\//.test(editorial[0].reference));
 }
}
function generated(entry,tense,slot){const p=mVerb(entry);return p?.tenses[tense][1][slot]}
assert.equal(generated('solvo, solvi, solutum (3ª)',0,1),'solvis');
assert.equal(generated('vivo, vixi, victum (3ª)',0,1),'vivis');
assert.equal(generated('sepelio, sepelii, sepultum (4ª)',2,1),'sepelies');
assert.equal(generated('cognosco, cognovi, cognitum (3ª)',3,0),'cognovi');
assert.equal(generated('maneo, mansi, mansum (2ª)',3,0),'mansi');
assert.equal(generated('peto, petii, petitum (3ª)',3,0),'petii');
assert.equal(generated('adiuvo, adiuvi, adiutum (1ª)',3,0),'adiuvi');
assert.equal(mVerb('occido, occidi, occisum (3ª)').supine,'occisum');
assert.equal(mVerb('deligo, delegi, delectum (3ª)').supine,'delectum');
assert.equal(mVerb('appropinquo, appropinquavi, appropinquatum (1ª)').supine,'appropinquatum');
// Garantizar que no se etiqueta como contrastada una derivación regular.
assert.equal(index.counts.lat.contrastado,619,'No promover formas derivadas a fuente contrastada');
// La forma victi pertenece al paradigma documentado de vinco, NO a una
// pasiva personal inexistente de vivo, aunque vivo tenga el supino victum.
const lexCtx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(file),lexCtx,{filename:file});
const lexical=lexCtx.window.ExaminaVocabulary;
const victi=lexical.analyze(index,'victi','lat1',banks.latin1,{contextual:true})[0];
assert.equal(victi.status,'documented','victi debe conservar su acreditación tras corregir vivo');
assert.equal(victi.lemma,'vinco','victi es participio de vinco y no de vivo');
assert(!victi.candidates.some(x=>x.lemma==='vivo'),'No inventar participio personal de vivo');
const vixerunt=lexical.analyze(index,'vixerunt','lat1',banks.latin1,{contextual:true})[0];
assert(vixerunt.candidates.some(x=>x.lemma==='vivo'),'Mantener perfecto activo de vivo');
const vivid=lexical.analyze(index,'vivis','lat1',banks.latin1,{contextual:true})[0];
assert(vivid.candidates.some(x=>x.lemma==='vivo'),'Mantener presente activo de vivo');
const fictitious=lexical.analyze(index,'vivor','lat1',banks.latin1,{contextual:true})[0];
assert(!fictitious.candidates.some(x=>x.lemma==='vivo'),'No inventar voz pasiva personal de vivo');
// Persistencia de listas exigibles antiguas: migrar solo registros sembrados,
// preservar un registro modificado manualmente y no repetir la migración.
const migrationStart=html.indexOf('function migrateSeededLatinVerbEntries(items){');
const migrationEnd=html.indexOf('if(migrateSeededLatinVerbEntries(examRequired))saveRequired();',migrationStart);
assert(migrationStart>0&&migrationEnd>migrationStart,'Falta migración de listas ya guardadas');
const migrate=new Function('examKey',
 html.slice(migrationStart,migrationEnd)+'return migrateSeededLatinVerbEntries;')
 (x=>norm(x.split(',')[0]).toLowerCase().replace(/[^a-z]/g,''));
const casesOld=cases.map(([course,lemma,before])=>({
 course,unit:'UD9',origin:'listado docente exigible',entry:before,key:lemma
}));
const manuallyEdited={course:'latin1',unit:'UD9',origin:'manual',
 entry:'occido, occidi, occissum (3ª)',meaning:'mi edición'};
const teacherEdited={course:'latin1',unit:'UD9',origin:'listado docente exigible',
 entry:'occido, occidi, occisum (3ª)',meaning:'mi revisión docente'};
const rows=[...casesOld,manuallyEdited,teacherEdited];
assert.equal(migrate(rows),true,'No migra la importación histórica');
casesOld.forEach((x,i)=>assert.equal(rows[i].entry,cases[i][3]));
assert.equal(manuallyEdited.entry,'occido, occidi, occissum (3ª)',
 'No sobrescribir un registro de origen manual');
assert.equal(teacherEdited.meaning,'mi revisión docente','No sobrescribir significado editado');
assert.equal(migrate(rows),false,'Migración no idempotente');
assert.equal(banks.latin1.length,1106);
assert.equal(banks.latin4.length,541);
console.log('Auditoría de integridad verbal: 11 fichas, 3 capas académicas, 8 decisiones reproducibles y migración idempotente.');
