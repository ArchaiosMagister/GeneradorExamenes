'use strict';
// Correcciones editoriales UD8: no se crean ni promueven análisis morfológicos.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const mats=JSON.parse(fs.readFileSync('data/greek1-materials.json','utf8'));
const teacher=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const overrides=JSON.parse(fs.readFileSync('data/lemmas/verified-overrides.json','utf8'));
const norm=s=>String(s).normalize('NFC');
const cases=[
 ['ελλασ','Ἑλλάς, Ἑλλάδος (ἡ)','Ἕλλας, Ἑλλάδος (ἡ)'],
 ['πατηρ','πατήρ, −τρός (ὁ)','πάτηρ, −τρός (ὁ)']
];
function parsedAssignment(html,marker){
 const start=html.indexOf(marker);
 assert(start>=0,'Falta '+marker);
 const begin=start+marker.length,end=html.indexOf(';\n',begin);
 assert(end>begin,'Datos incompletos: '+marker);
 return JSON.parse(html.slice(begin,end));
}
function generalBank(html){
 const entries=[];
 let at=0,pos;
 while((pos=html.indexOf('vocab.push(...[',at))>=0){
  const start=pos+'vocab.push(...'.length,end=html.indexOf(']);',start);
  assert(end>start,'Banco general incompleto');
  entries.push(...JSON.parse(html.slice(start,end+1)));
  at=end+3;
 }
 return entries.filter(x=>x.course==='greek1'&&x.unit==='Banco general');
}
function normHead(entry){
 return entry.split(',')[0].normalize('NFD').replace(/\p{M}/gu,'')
  .toLowerCase().replace(/ς/g,'σ');
}
const requiredUD8=mats.required.filter(x=>x.unit==='UD8');
assert.equal(requiredUD8.length,30,'No alterar la cantidad de vocabulario UD8');
for(const [lemma,want,old] of cases){
 const rows=requiredUD8.filter(x=>normHead(x.entry)===lemma);
 assert.equal(rows.length,1,'UD8, lema duplicado: '+lemma);
 assert.equal(rows[0].entry,want,'Acentuación incorrecta en UD8: '+lemma);
 assert.notEqual(rows[0].entry,old);
 const alreadyTeacher=teacher.vocabulary.grc[lemma]?.gr1?.entry;
 assert(alreadyTeacher,'Falta la entrada docente original: '+lemma);
 assert.equal(normHead(alreadyTeacher),lemma);
}
// Entradas generales discrepantes que tenían que corregirse en índice y PWA.
const academic=[
 ['υδωρ','ὕδωρ, ὑδάτος (τό)','ὕδωρ, ὕδατος (τό)'],
 ['ονομα','ὄνομα, –ματος','ὄνομα, –ματος (τό)'],
 ['ηγεμων','ἡγεμών, –ονος (M)','ἡγεμών, –όνος (ὁ)']
];
for(const [lemma,from,to] of academic){
 assert.equal(teacher.vocabulary.grc[lemma]?.gr1?.entry,to,
  lemma+': el índice ha reproducido la errata antigua');
 const corr=overrides.entryCorrections.filter(x=>x.lang==='grc'&&x.lemma===lemma&&x.course==='gr1');
 assert.equal(corr.length,1,lemma+': debe existir una sola decisión editorial');
 assert.equal(corr[0].from,from);
 assert.equal(corr[0].to,to);
 assert(/^https:\/\//.test(corr[0].reference));
}
for(const [name,html] of [['web',fs.readFileSync('index.html','utf8')],
                          ['offline',fs.readFileSync('offline.html','utf8')]]){
 const general=generalBank(html);
 const req=parsedAssignment(html,'const greekMaterials=').required.filter(x=>x.unit==='UD8');
 for(const [lemma,want] of cases){
  const item=req.filter(x=>normHead(x.entry)===lemma);
  assert.equal(item.length,1,name+': no aparece el lema exigible '+lemma);
  assert.equal(item[0].entry,want,name+': no coincide con la fuente de UD8');
  const originalGeneral=general.filter(x=>normHead(x.entry)===lemma);
  assert.equal(originalGeneral.length,1);
  assert.equal(normHead(originalGeneral[0].entry),lemma,
   name+'/'+lemma+': vocabulario general desincronizado');
 }
 for(const [lemma,old,to] of academic){
  const entries=general.filter(x=>normHead(x.entry)===lemma);
  assert.equal(entries.length,1,name+': entrada general ausente/duplicada '+lemma);
  assert.equal(entries[0].entry,to,name+': persiste la errata general de '+lemma);
 }
 const reviewed=parsedAssignment(html,'const greekExamReviewedNominalRows=');
 const hegemon=reviewed.filter(x=>x[0]==='ηγεμων');
 assert.equal(hegemon.length,1,name+': falta ficha fuente 5 de ἡγεμών');
 assert.equal(hegemon[0][1],'ἡγεμών, –όνος (ὁ)');
 assert.deepEqual(JSON.stringify(hegemon[0][7]),JSON.stringify([['ἡγεμόνι','DAT;SG']]),
  name+': se alteró la forma cotejada de ἡγεμών');
 const marker='function migrateGreekUd8NominativeAccents(';
 const start=html.indexOf(marker),end=html.indexOf('\n}\n',start);
 assert(start>=0&&end>start,name+': falta migración de fichas locales');
 const migration=vm.runInNewContext('('+html.slice(start,end+2)+')',
  {examKey:()=> 'same-accentless-key'});
 const list=[
  {course:'greek1',unit:'UD8',entry:'Ἕλλας, Ἑλλάδος (ἡ)',key:'same-accentless-key'},
  {course:'greek1',unit:'UD8',entry:'πάτηρ, −τρός (ὁ)',key:'same-accentless-key'},
  {course:'greek1',unit:'UD8',entry:'Ἕλλας, Ἑλλάδος (ἡ) (edición personal)'},
  {course:'greek1',unit:'UD9',entry:'πάτηρ, −τρός (ὁ)'},
  {course:'latin1',unit:'UD8',entry:'πάτηρ, −τρός (ὁ)'}
 ];
 assert.equal(migration(list),true,name+': la migración inicial no ha actuado');
 assert.equal(list[0].entry,'Ἑλλάς, Ἑλλάδος (ἡ)');
 assert.equal(list[1].entry,'πατήρ, −τρός (ὁ)');
 assert.equal(list[0].key,'same-accentless-key');
 assert.equal(list[1].key,'same-accentless-key');
 assert.equal(list[2].entry,'Ἕλλας, Ἑλλάδος (ἡ) (edición personal)');
 assert.equal(list[3].entry,'πάτηρ, −τρός (ὁ)');
 assert.equal(list[4].entry,'πάτηρ, −τρός (ὁ)');
 assert.equal(migration(list),false,name+': la migración no es idempotente');
}
console.log('GRIEGO UD8 OK: Ἑλλάς, πατήρ, ὕδωρ/ὕδατος, ὄνομα (τό), ἡγεμών/–όνος; fuentes, PWA y migración seguras.');
