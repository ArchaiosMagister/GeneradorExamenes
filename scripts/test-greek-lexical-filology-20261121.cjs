'use strict';
// Griego I: siete correcciones filológicas sin nuevos paradigmas ni sobreescritura docente.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const materials=JSON.parse(fs.readFileSync('data/greek1-materials.json','utf8'));
const teacher=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const overrides=JSON.parse(fs.readFileSync('data/lemmas/verified-overrides.json','utf8'));
const lexicon=fs.readFileSync('lexicon-valenciano.js','utf8');
const cases=[
 ['Preposiciones','ὐπό + genitivo','ὑπό + genitivo'],
 ['UDs 1–4','θέα, –ας','θεά, –ας'],
 ['UDs 1–4','θέος, –ου','θεός, –ου'],
 ['UDs 1–4','ἀληθεία, –ας','ἀλήθεια, –ας'],
 ['UDs 6–7','ἀδικός, –ον','ἄδικος, –ον'],
 ['UDs 6–7','κεφαλῆ, –ῆς','κεφαλή, –ῆς']
];
const generalExpected=[
 'θεά, –ᾶς (ἡ)','θεός, –οῦ (ὁ)','ἄδικος, –ον',
 'κεφαλή, –ῆς','ἀλήθεια, –ας'
];
function assignment(html,marker){
 const pos=html.indexOf(marker);
 assert(pos>=0,'No se encuentra '+marker);
 const start=pos+marker.length,end=html.indexOf(';\n',start);
 assert(end>start,'Marcador no cerrado '+marker);
 return JSON.parse(html.slice(start,end));
}
function generalBank(html){
 const vocab=[];
 let seek=0,p;
 while((p=html.indexOf('vocab.push(...[',seek))>=0){
  const start=p+'vocab.push(...'.length,end=html.indexOf(']);',start);
  assert(end>start,'Banco general incompleto');
  vocab.push(...JSON.parse(html.slice(start,end+1)));
  seek=end+3;
 }
 return vocab.filter(row=>row.course==='greek1'&&row.unit==='Banco general');
}
function migration(source){
 const name='function migrateGreekLexicalFilology20261121(';
 const start=source.indexOf(name),end=source.indexOf('\n}\n',start);
 assert(start>=0&&end>start,'Falta migración de léxico exigible');
 const sourceCode=source.slice(start,end+2);
 return vm.runInNewContext('('+sourceCode+')',{
  examKey:s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
 });
}
assert.equal(materials.required.length,172,'Cantidad de vocabulario exigible modificada');
for(const [unit,from,to] of cases){
 const rows=materials.required.filter(x=>x.unit===unit&&x.entry===to);
 assert.equal(rows.length,1,unit+': ficha incorrecta '+to);
 assert(!materials.required.some(x=>x.unit===unit&&x.entry===from),
  unit+': permanece la errata '+from);
}
const dia=materials.required.filter(x=>x.unit==='Preposiciones'&&x.entry==='διά + acusativo');
assert.equal(dia.length,1);
assert.equal(dia[0].meaning,'por, a causa de');
const generalDia='gen.: a través de, por medio de | ac.: por, a causa de';
assert(lexicon.includes('"por, a causa de": "per, a causa de"'));
assert(lexicon.includes('"'+generalDia+'": "gen.: a través de, per mitjà de | ac.: per, a causa de"'));
assert.equal(teacher.vocabulary.grc.αληθεια.gr1.entry,'ἀλήθεια, –ας');
const fixes=overrides.entryCorrections.filter(x=>x.lang==='grc'&&x.course==='gr1'&&x.lemma==='αληθεια');
assert.equal(fixes.length,1,'Sin decisión de origen para ἀλήθεια');
assert.equal(fixes[0].from,'ἀληθεία, –ας');
assert.equal(fixes[0].to,'ἀλήθεια, –ας');
assert(/^https:\/\//.test(fixes[0].reference));
assert.equal(teacher.rows.grc.filter(row=>row[0]==='αληθεια').length,15,
 'Se ha modificado el repertorio morfológico individual de ἀλήθεια');
for(const [name,html] of [
 ['web',fs.readFileSync('index.html','utf8')],
 ['autónoma',fs.readFileSync('offline.html','utf8')]
]){
 const embedded=assignment(html,'const greekMaterials=');
 assert.equal(embedded.required.length,materials.required.length,name+': cantidad exigible');
 for(const [unit,from,to] of cases){
  assert.equal(embedded.required.filter(x=>x.unit===unit&&x.entry===to).length,1,
   name+': no incorporó '+to);
  assert(!embedded.required.some(x=>x.unit===unit&&x.entry===from),
   name+': conserva '+from);
 }
 assert.equal(embedded.required.find(x=>x.unit==='Preposiciones'&&x.entry==='διά + acusativo')?.meaning,
  'por, a causa de',name+': διά + acusativo con significado equivocado');
 const vocab=generalBank(html);
 for(const entry of generalExpected){
  assert.equal(vocab.filter(x=>x.entry===entry).length,1,name+': banco general '+entry);
 }
 assert.equal(vocab.filter(x=>x.entry==='διά + genitivo | acusativo').length,1);
 assert.equal(vocab.find(x=>x.entry==='διά + genitivo | acusativo').meaning,generalDia,
  name+': no distingue genitivo de acusativo');
 const reviewed=assignment(html,'const greekExamReviewedNominalRows=').filter(x=>x[0]==='αληθεια');
 assert.equal(reviewed.length,1,name+': ficha nominal ἀλήθεια duplicada o ausente');
 assert.equal(reviewed[0][1],'ἀλήθεια, –ας',name+': enunciado nominal no corregido');
 assert.equal(JSON.stringify(reviewed[0][7]),JSON.stringify([['ἀληθείᾳ','DAT;SG']]),
  name+': no debe corregirse el dativo ya acreditado');
 const migrate=migration(html);
 const list=[
  ...cases.map(([unit,from])=>({course:'greek1',unit,entry:from,key:'anterior'})),
  {course:'greek1',unit:'Preposiciones',entry:'διά + acusativo',meaning:'a través de, por, a causa de'},
  {course:'greek1',unit:'Preposiciones',entry:'διά + acusativo',meaning:'traducción personal'},
  {course:'greek1',unit:'UDs 1–4',entry:'ἀληθεία, –ας [edición personal]'},
  {course:'latin1',unit:'UDs 1–4',entry:'θέα, –ας'},
  {course:'greek1',unit:'UD5',entry:'θέα, –ας'}
 ];
 assert.equal(migrate(list),true,name+': migración no actuó');
 for(let i=0;i<cases.length;i++){
  assert.equal(list[i].entry,cases[i][2],name+': entrada sin migrar');
  assert.equal(list[i].key,cases[i][2].normalize('NFD').replace(/\p{M}/gu,'').toLowerCase(),
   name+': clave sin actualizar');
 }
 assert.equal(list[6].meaning,'por, a causa de');
 assert.equal(list[7].meaning,'traducción personal');
 assert.equal(list[8].entry,'ἀληθεία, –ας [edición personal]');
 assert.equal(list[9].entry,'θέα, –ας');
 assert.equal(list[10].entry,'θέα, –ας');
 assert.equal(migrate(list),false,name+': migración no idempotente');
 if(name==='autónoma'){
  assert(html.includes('"αληθεια":{"gr1":{"entry":"ἀλήθεια, –ας"'),
   'Versión autónoma con índice de lemas desactualizado');
  assert(html.includes('"por, a causa de": "per, a causa de"'),
   'Versión autónoma sin traducción valenciana');
 }
}
console.log('GRIEGO LEX FILOLOGÍA OK: 6 grafías, διά con casos correctos, índice, web/autónoma, migración no destructiva y 15 lecturas históricas intactas.');
