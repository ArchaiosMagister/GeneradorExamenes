'use strict';
// Griego I: artículos y acentos de cinco lemas nominales de 3.ª declinación.
// No cambia ni evalúa ninguna flexión externa no acreditada individualmente.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const materials=JSON.parse(fs.readFileSync('data/greek1-materials.json','utf8'));
const teacher=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const overrides=JSON.parse(fs.readFileSync('data/lemmas/verified-overrides.json','utf8'));
const expected=[
 ['στρατευμα','στράτευμα, –ατος','στράτευμα, –ατος (τό)','n',5],
 ['αιξ','αἰξ, αἰγός','αἴξ, αἰγός (ἡ)','f',1],
 ['δερμα','δέρμα, –ματος','δέρμα, –ματος (τό)','n',1],
 ['λεων','λέων, λεόντος','λέων, λέοντος (ὁ)','m',1],
 ['σωμα','σῶμα, –ματος','σῶμα, –ματος (τό)','n',1]
];
function assignment(html,marker){
 const p=html.indexOf(marker);
 assert(p>=0,'Falta banco '+marker);
 const start=p+marker.length,end=html.indexOf(';\n',start);
 assert(end>start,'Banco no cerrado '+marker);
 return JSON.parse(html.slice(start,end));
}
const canonicalHead=s=>String(s).split(',')[0].normalize('NFD')
 .replace(/\p{M}/gu,'').replace(/ς/gu,'σ');
for(const [lemma,oldEntry,newEntry,gender,count] of expected){
 const item=teacher.vocabulary.grc[lemma]?.gr1;
 assert(item,lemma+': se perdió el lema académico');
 assert.equal(item.entry,newEntry,lemma+': origen antiguo reapareció en el índice');
 const fixes=overrides.entryCorrections.filter(x=>x.lang==='grc'&&x.course==='gr1'&&x.lemma===lemma);
 assert.equal(fixes.length,1,lemma+': corrección editorial única');
 assert.equal(fixes[0].from,oldEntry,lemma+': no conservar fuente original');
 assert.equal(fixes[0].to,newEntry,lemma+': la corrección es distinta del índice');
 assert(/^https:\/\//.test(fixes[0].reference),lemma+': falta fuente editorial');
 for(const [name,html] of [['web',fs.readFileSync('index.html','utf8')],
                            ['offline',fs.readFileSync('offline.html','utf8')]]){
  const start=html.indexOf('const greekExamReviewedNominalRows=');
  assert(start>=0,name+': falta repertorio verificado');
  const rows=assignment(html,'const greekExamReviewedNominalRows=');
  const selected=rows.filter(x=>x[0]===lemma);
  assert.equal(selected.length,1,name+'/'+lemma+': ficha verificada duplicada');
  const row=selected[0];
  assert.equal(row[1],newEntry,name+'/'+lemma+': enunciado desactualizado');
  assert.equal(row[2],8,name+'/'+lemma+': debe exigir tercera declinación (UD8)');
  assert.equal(row[3],'nouns');
  assert.equal(row[4],gender,name+'/'+lemma+': ha cambiado género de forma no docente');
  assert.equal(row[5],'tercera');
  assert.equal(row[7].length,count,name+'/'+lemma+': cambios en cantidad de formas verificadas');
  assert(row[7].every(form=>/^(?:(?:NOM|VOC|ACC|GEN|DAT);(?:SG|PL))(?:\|(?:NOM|VOC|ACC|GEN|DAT);(?:SG|PL))*$/.test(form[1])),
   name+'/'+lemma+': etiquetas de formas inválidas');
  // El banco general griego se añade con vocab.push, no vive en let vocab inicial.
  const vocab=[];
  let search=0,pos;
  while((pos=html.indexOf('vocab.push(...[',search))>=0){
   const from=pos+'vocab.push(...'.length,end=html.indexOf(']);',from);
   assert(end>from,name+': material léxico no cerrado');
   vocab.push(...JSON.parse(html.slice(from,end+1)));
   search=end+3;
  }
  const general=vocab.filter(x=>x.course==='greek1'&&x.unit==='Banco general'&&
   canonicalHead(x.entry)===lemma);
  assert.equal(general.length,1,name+'/'+lemma+': entrada general ausente o duplicada');
  assert(general[0].entry.includes('(')&&general[0].entry.includes(')'),
   name+'/'+lemma+': el género debe figurar mediante artículo griego');
  const article={n:'(τὸ)',f:'(ἡ)',m:'(ὁ)'}[gender];
  const alsoNominal=gender==='n'&&general[0].entry.endsWith('(τό)');
  assert(general[0].entry.includes(article)||alsoNominal,
   name+'/'+lemma+': género incorrecto en el vocabulario general');
  if(lemma==='αιξ')assert(general[0].entry.startsWith('αἴξ'),
   name+': αἴξ ha perdido el acento agudo del nominativo');
  const needed=assignment(html,'const greekMaterials=');
  // El HTML conserva otras correcciones docentes previas respecto del JSON
  // de origen. Comparar solo las fichas revisadas, sin exigir identidad total.
  const actualUD9=needed.required.filter(x=>x.unit==='UD9'&&canonicalHead(x.entry)==='στρατευμα');
  const sourceUD9=materials.required.filter(x=>x.unit==='UD9'&&canonicalHead(x.entry)==='στρατευμα');
  assert.deepEqual(JSON.stringify(actualUD9),JSON.stringify(sourceUD9),
   name+': UD9, στράτευμα no coincide con su fuente persistente');
  assert(!html.includes('"entry":"αἰξ, αἰγός"'),
   name+': ha reaparecido el nominativo sin acento de αἴξ');
 }
}
// Invariante docente global: TODOS los sustantivos verificados de tercera
// declinación muestran artículo griego, no género latino ni inferencia.
for(const [name,html] of [['web',fs.readFileSync('index.html','utf8')],
                          ['offline',fs.readFileSync('offline.html','utf8')]]){
 const nouns=assignment(html,'const greekExamReviewedNominalRows=')
  .filter(row=>row[3]==='nouns'&&row[5]==='tercera');
 assert(nouns.length>=15,name+': desaparecieron los quince lemas cotejados de tercera');
 for(const row of nouns){
  const expectedArticle={m:['(ὁ)'],f:['(ἡ)'],n:['(τό)','(τὸ)']}[row[4]];
  assert(expectedArticle&&expectedArticle.some(ending=>row[1].endsWith(ending)),
   name+'/'+row[0]+': género de tercera declinación sin artículo griego: '+row[1]);
 }
}
const strateumaRequired=materials.required.filter(x=>x.unit==='UD9'&&canonicalHead(x.entry)==='στρατευμα');
assert.equal(strateumaRequired.length,1);
assert.equal(strateumaRequired[0].entry,'στράτευμα, –ατος (τό)');
for(const [name,source] of [['web',fs.readFileSync('index.html','utf8')],
                            ['offline',fs.readFileSync('offline.html','utf8')]]){
 const start=source.indexOf('function migrateGreekStrateumaGender('),end=source.indexOf('\n}\n',start);
 assert(start>=0&&end>start,name+': migración exacta ausente');
 const migrate=vm.runInNewContext('('+source.slice(start,end+2)+')',
  {examKey:()=> 'canonical-unchanged'});
 const list=[
  {course:'greek1',unit:'UD9',entry:'στράτευμα, –ατος',key:'canonical-unchanged'},
  {course:'greek1',unit:'UD9',entry:'στράτευμα, –ατος [edición propia]'},
  {course:'greek1',unit:'UD8',entry:'στράτευμα, –ατος'},
  {course:'latin1',unit:'UD9',entry:'στράτευμα, –ατος'}
 ];
 assert.equal(migrate(list),true,name+': migración inicial');
 assert.equal(list[0].entry,'στράτευμα, –ατος (τό)');
 assert.equal(list[0].key,'canonical-unchanged');
 assert.equal(list[1].entry,'στράτευμα, –ατος [edición propia]');
 assert.equal(list[2].entry,'στράτευμα, –ατος');
 assert.equal(list[3].entry,'στράτευμα, –ατος');
 assert.equal(migrate(list),false,name+': migración no idempotente');
}
console.log('GRIEGO III DECL. OK: cinco lemas corregidos, 9 superficies contrastadas conservadas, αἴξ con acento, web/PWA e importación local no destructiva.');
