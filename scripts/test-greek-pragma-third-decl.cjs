'use strict';
// Auditoría independiente de enunciados de tercera declinación, UD8.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const htmls=[['web',fs.readFileSync('index.html','utf8')],
 ['offline',fs.readFileSync('offline.html','utf8')]];
const material=JSON.parse(fs.readFileSync('data/greek1-materials.json','utf8'));
const index=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const decisions=JSON.parse(fs.readFileSync('data/lemmas/verified-overrides.json','utf8'));
const actual='πρᾶγμα, πράγματος (τό)';
const prior='πράγμα, πραγμάτος (N)';
const ud8='πρᾶγμα, −ματος (τὸ)';
const oldud8='πράγμα, −ματος (τὸ)';
assert.equal(index.vocabulary.grc.πραγμα.gr1.entry,actual,
 'Índice académico: la entrada procedente de origen no se corrigió');
const correction=decisions.entryCorrections.filter(x=>x.lang==='grc'&&x.lemma==='πραγμα'&&x.course==='gr1');
assert.equal(correction.length,1,'Corrección editorial debe ser única');
assert.equal(correction[0].from,prior);
assert.equal(correction[0].to,actual);
assert.equal(index.vocabulary.grc.ηγεμων.gr1.entry,'ἡγεμών, –όνος (ὁ)',
 'El índice de ἡγεμών conserva la abreviatura latina M');
const hegemonCorrection=decisions.entryCorrections.filter(x=>x.lang==='grc'&&
 x.lemma==='ηγεμων'&&x.course==='gr1');
assert.equal(hegemonCorrection.length,1);
assert.equal(hegemonCorrection[0].from,'ἡγεμών, –ονος (M)');
assert.equal(hegemonCorrection[0].to,'ἡγεμών, –όνος (ὁ)');
const required=material.required.filter(x=>x.unit==='UD8'&&/πρ[άᾶ]γμα/u.test(x.entry));
assert.equal(required.length,1,'Material docente UD8: lema no único');
assert.equal(required[0].entry,ud8);
for(const [name,html] of htmls){
 const assignment=(marker)=>{
  const pos=html.indexOf(marker);
  assert(pos>=0,name+': falta '+marker);
  const begin=pos+marker.length,end=html.indexOf(';\n',begin);
  assert(end>begin,name+': asignación de datos incompleta '+marker);
  return JSON.parse(html.slice(begin,end));
 };
 // El banco general griego entra por vocab.push; let vocab contiene
 // únicamente la lista inicial latina. Comprobar la fuente efectiva.
 const vocab=[];
 let seek=0,pos;
 while((pos=html.indexOf('vocab.push(...[',seek))>=0){
  const from=pos+'vocab.push(...'.length,end=html.indexOf(']);',from);
  assert(end>from,name+': banco añadido incompleto');
  vocab.push(...JSON.parse(html.slice(from,end+1)));
  seek=end+3;
 }
 const bank=vocab.filter(x=>x.course==='greek1'&&x.unit==='Banco general'&&
  x.entry.includes('γμα')&&x.meaning==='asunto');
 assert.equal(bank.length,1,name+': entrada general duplicada');
 assert.equal(bank[0].entry,actual,name+': vocabulario general con acentuación moderna');
 const embedded=assignment('const greekMaterials=');
 assert.deepEqual(embedded.required.filter(x=>x.unit==='UD8'&&x.entry.includes('γμα')),
  required,name+': fuentes de vocabulario exigible diferentes');
 const rows=assignment('const greekExamReviewedNominalRows=');
 const pragma=rows.filter(x=>x[0]==='πραγμα'&&x[3]==='nouns');
 assert.equal(pragma.length,1,name+': ficha verificada πρᾶγμα ausente');
 assert.equal(pragma[0][1],actual,name+': enunciado de la forma verificada incorrecto');
 assert.deepEqual(pragma[0][7].map(x=>x[0]),['πράγματι'],
  name+': no alterar las formas concretas contrastadas');
 const hegemon=rows.filter(x=>x[0]==='ηγεμων');
 assert.equal(hegemon.length,1,name+': ficha verificada ἡγεμών ausente');
 assert.equal(hegemon[0][1],'ἡγεμών, –όνος (ὁ)',
  name+': género masculino de 3.ª debe presentarse con artículo griego');
 const marker='function migrateGreekPragmaAccent(';
 const start=html.indexOf(marker),end=html.indexOf('\n}\n',start);
 assert(start>=0&&end>start,name+': migración docente UD8 ausente');
 const migrate=vm.runInNewContext('('+html.slice(start,end+2)+')',{examKey:x=>'same-normalized-lemma'});
 const rowsToMigrate=[
  {course:'greek1',unit:'UD8',entry:oldud8,key:'same-normalized-lemma'},
  {course:'greek1',unit:'UD8',entry:oldud8+' edición personal'},
  {course:'greek1',unit:'UD9',entry:oldud8},
  {course:'latin1',unit:'UD8',entry:oldud8}
 ];
 assert.equal(migrate(rowsToMigrate),true,name+': migración inicial');
 assert.equal(rowsToMigrate[0].entry,ud8);
 assert.equal(rowsToMigrate[0].key,'same-normalized-lemma');
 assert.equal(rowsToMigrate[1].entry,oldud8+' edición personal');
 assert.equal(rowsToMigrate[2].entry,oldud8);
 assert.equal(rowsToMigrate[3].entry,oldud8);
 assert.equal(migrate(rowsToMigrate),false,name+': migración debe ser idempotente');
}
console.log('GRIEGO UD8 OK: πρᾶγμα / πράγματος / τό; ἡγεμών / ὁ, índice, web/PWA, forma fuente5 y migración no destructiva.');
