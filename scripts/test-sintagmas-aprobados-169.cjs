'use strict';
// PR #169: aprobaciones docentes sin adelantar contenidos ni crear lemas.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const mNormalizeLatin=entry=>String(entry||'').split(',')[0]
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:850}});
  const exceptions=[];
  page.on('pageerror',error=>exceptions.push(String(error)));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  async function select(course,model,unit){
   await page.evaluate(({course,model,unit})=>{
    $('course').value=course;$('course').dispatchEvent(new Event('change',{bubbles:true}));
    $('model').value=model;$('model').dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('.unit-choice').forEach(x=>x.checked=units[+x.value]==='UD'+unit);
    generate();
   },{course,model,unit});
  }
  // La unidad del sintagma depende de la DECLINACIÓN y del adjetivo,
  // nunca de la presencia de los lemas en vocabulario exigible o general.
  const evidence=[];
  const pairs={
   latin1:[
    ['puella','bonus',2,'puella bona'],['servus','bonus',2,'servus bonus'],
    ['bellum','magnus',2,'bellum magnum'],['puer','Romanus',2,'puer Romanus'],
    ['rex','magnus',4,'rex magnus'],['hostis','Romanus',4,'hostis Romanus'],
    ['agricola','bonus',2,'bonus agricola'],['nauta','bonus',2,'bonus nauta'],
    ['poeta','bonus',3,'bonus poeta']
   ],
   latin4:[
    ['puella','Romanus',3,'puella Romana'],
    ['servus','bonus',3,'servus bonus'],
    ['templum','magnus',3,'templum magnum'],
    ['puer','bonus',3,'puer bonus'],
    ['rex','bonus',5,'rex bonus'],
    ['nomen','Romanus',5,'nomen Romanum'],
    ['agricola','bonus',3,'bonus agricola'],
    ['nauta','bonus',3,'bonus nauta'],
    ['poeta','bonus',3,'bonus poeta']
   ]
  };
  for(const [course,rules] of Object.entries(pairs)){
   for(const [noun,adj,minUnit,expected] of rules){
    await select(course,'tablas',minUnit);
    const r=await page.evaluate(noun=>{
     const item=latinCompleteDeclensionItems(selectedUnits()).find(x=>
      mNormalize(x.p.lemma).toLowerCase()===noun);
     return {unit:Math.max(0,...selectedUnits().map(examUnitNumber)),
      found:!!item,lemma:item?.p?.lemma,source:item?.x?.entry,
      kind:item?.p?.kind,grammarUnit:item?latinSyntagmNounUnit(item.p.kind):null,
      adjective:item?.compound?.adjective?.entry,
      nominative:item?.compound?.forms?.[0]?.[0],
      cells:item?.compound?.forms,gender:item?.compound?.gender};
    },noun);
    assert(r.found,course+': no aparece el lema '+noun+' en UD'+minUnit);
    assert.equal(r.nominative,expected,course+': forma aprobada '+noun);
    assert.equal(r.unit,minUnit);
    assert(r.grammarUnit<=minUnit,course+': no anticipar declinación '+noun);
    assert.equal(mNormalizeLatin(r.adjective),adj.toLowerCase(),
     course+': no se respetó el adjetivo autorizado para '+noun);
    assert.equal(r.cells.length,2);
    assert(r.cells.every(x=>x.length===6&&x.every(Boolean)),
     course+': doce casillas completas para '+noun);
    if(['agricola','nauta','poeta'].includes(noun))assert.equal(r.gender,'m');
    evidence.push({course,noun,ud:minUnit,form:r.nominative});
   }
  }
  // Demostración de que el criterio no consulta la pertenencia a la UD:
  // templum está en Latín I, pero NO en vocabulario de Latín 4.º.
  await select('latin4','tablas',3);
  assert(await page.evaluate(()=>
   !latinSharedBank.vocabulary('latin4').some(x=>
    mNormalize(headLex(x.entry)).toLowerCase()==='templum')&&
   latinCompleteDeclensionItems(['UD3']).some(x=>
    mNormalize(x.p.lemma).toLowerCase()==='templum'&&
    x.compound?.forms?.[0]?.[0]==='templum magnum')),
   'templum magnum desde UD3, aunque templum no figure en el léxico de 4.º');
  // Aún sin adjetivos, permitir declinar palabras de categorías ya estudiadas.
  await select('latin4','tablas',2);
  assert(await page.evaluate(()=>latinCompleteDeclensionItems(['UD2']).some(x=>
   mNormalize(x.p.lemma).toLowerCase()==='templum'&&x.p.kind==='2n')),
   'El neutro de 2.ª ya es elegible en UD2, independientemente del vocabulario');
  // El paradigma de 3.ª no puede anticiparse en UD2/3 de 4.º.
  await select('latin4','tablas',3);
  assert(await page.evaluate(()=>!latinCompleteDeclensionItems(['UD3']).some(x=>
   mNormalize(x.p.lemma).toLowerCase()==='rex')),
   'No anticipar 3.ª declinación latina antes de UD5');
  // Romanus es gentilicio: la excepción sólo es válida en pares docentes
  // y jamás autoriza su inclusión indiscriminada en el banco morfológico.
  for(const [course,unit,noun,expected] of [
   ['latin1',2,'puer','puer Romanus'],
   ['latin4',3,'puella','puella Romana']
  ]){
   await select(course,'tablas',unit);
   const check=await page.evaluate(noun=>{
    const pool=latinCompleteDeclensionItems(selectedUnits());
    const item=pool.find(x=>mNormalize(x.p.lemma).toLowerCase()===noun);
    return {found:!!item,adjective:item?.compound?.adjective?.entry,
     nominative:item?.compound?.forms?.[0]?.[0],
     general:latinCompleteAdjectives(selectedUnits()).some(x=>
      mNormalize(headLex(x.x.entry)).toLowerCase()==='romanus')};
   },noun);
   assert(check.found,course+': falta el lema aprobado '+noun);
   assert.equal(check.nominative,expected,course+': falta la concordancia del gentilicio');
   assert.equal(check.general,false,'Romanus no debe entrar en el sorteo general');
  }
  // Hostis es un tema en -i de tercera: el genitivo plural hostium
  // no puede obtenerse del generador consonántico regular.
  await select('latin1','tablas',4);
  const hostis=await page.evaluate(()=>{
   const item=latinCompleteDeclensionItems(['UD4'])
    .find(x=>mNormalize(x.p.lemma).toLowerCase()==='hostis');
   return {found:!!item,forms:item?.compound?.forms,
    inGeneral:!!mNoun('hostis, –is (m.)'),gender:item?.compound?.gender};
  });
  assert(hostis.found,'Latín I UD4: falta hostis Romanus aprobado');
  assert.equal(hostis.inGeneral,false,'La excepción no altera la regla general');
  assert.equal(hostis.gender,'m','Género de hostis');
  assert.deepEqual(hostis.forms,[
   ['hostis Romanus','hostis Romane','hostem Romanum','hostis Romani',
    'hosti Romano','hoste Romano'],
   ['hostes Romani','hostes Romani','hostes Romanos','hostium Romanorum',
    'hostibus Romanis','hostibus Romanis']
  ],'Paradigma hostis Romanus de 12 casillas');
  // Los paradigmas explicados antes pueden elegirse desde cualquier UD posterior.
  for(const [unit,noun,expected] of [[3,'servus','servus bonus'],
   [5,'rex','rex bonus'],[3,'poeta','bonus poeta'],[5,'nomen','nomen Romanum']]){
   await select('latin4','tablas',unit);
   assert.equal(await page.evaluate(noun=>
    latinCompleteDeclensionItems(selectedUnits()).find(x=>
     mNormalize(x.p.lemma).toLowerCase()===noun)?.compound?.forms?.[0]?.[0],noun),
    expected,'Latín 4.º UD'+unit+': debe salir '+expected);
  }
  await select('latin4','tablas',5);
  const nomen=await page.evaluate(()=>{
   const item=latinCompleteDeclensionItems(selectedUnits())
    .find(x=>mNormalize(x.p.lemma).toLowerCase()==='nomen');
   return item?.compound?.forms;
  });
  assert.deepEqual(nomen,[
   ['nomen Romanum','nomen Romanum','nomen Romanum','nominis Romani',
    'nomini Romano','nomine Romano'],
   ['nomina Romana','nomina Romana','nomina Romana','nominum Romanorum',
    'nominibus Romanis','nominibus Romanis']
  ],'Nomen de tercera neutra conserva nomin- en todas las casillas');
  await select('latin1','tablas',1);
  assert.equal(await page.evaluate(()=>latinCompleteCompoundActive(['UD1'])),false);
  await select('latin4','tablas',2);
  assert.equal(await page.evaluate(()=>latinCompleteCompoundActive(['UD2'])),false);
  async function greek(unit){await select('greek1','complete',unit)}
  await greek(1);
  const plain=await page.evaluate(()=>{
   const row=greekVerifiedCorpus.find(x=>x.id==='n-λογος'),html=greekTable(row,true);
   const div=document.createElement('div');div.innerHTML=html;
   return {heading:div.querySelector('thead th[colspan]')?.textContent.trim(),
    first:div.querySelector('tbody td')?.textContent.trim()};
  });
  assert(!/^(ὁ|ἡ|τὸ)\s/u.test(plain.heading),'UD1 no introduce artículos');
  assert(plain.heading.normalize('NFD').replace(/\p{M}/gu,'').startsWith('λογος'),
   'UD1 debe conservar el enunciado del sustantivo');
  assert.equal(plain.first,'λόγος');
  await greek(2);
  assert.equal(await page.evaluate(()=>greekTable(greekVerifiedCorpus.find(x=>x.id==='n-δωρον'),true)
   .includes('<i>τὸ δῶρον</i>')),false,'UD2 no introduce artículos');
  await greek(3);
  const article=await page.evaluate(()=>{
   const row=greekVerifiedCorpus.find(x=>x.id==='n-αγορα');
   const div=document.createElement('div');div.innerHTML=greekTable(row,true);
   return {title:div.querySelector('thead th[colspan]')?.textContent.trim(),
    cells:[...div.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()))};
  });
  assert(article.title.startsWith('ὁ, ἡ, τό + ')&&
   article.title.normalize('NFD').replace(/\p{M}/gu,'').includes('αγορα'),
   'UD3 debe presentar artículo y enunciado de sustantivo');
  assert.equal(article.cells[0][0],'ἡ ἀγορά');
  assert.equal(article.cells[1][0],'ἀγορά','Vocativo sin artículo');
  assert.equal(article.cells[3][0],'τῆς ἀγορᾶς');
  await greek(4);
  const retro=await page.evaluate(()=>ExaminaGreekRetroversion.candidates().map(x=>x.answer));
  for(const word of ['ἐν τῇ ἀγορᾷ','εἰς τὴν ἀγοράν','σὺν τῷ ἀνθρώπῳ'])
   assert(retro.includes(word),'Retroversión UD4 '+word);
  await greek(5);
  const forms=await page.evaluate(()=>[
   ['n-ανθρωπος','ἀγαθός'],['n-χωρα','καλός'],['n-δωρον','καλός']
  ].map(([id,adj])=>{
   const noun=greekVerifiedCorpus.find(x=>x.id===id),
    word=greekAvailableSyntagmAdjectives(greekLimit()).find(x=>x.lemma===adj);
   return {id,adj,entry:!!word,title:word?greekCompleteNominalGroup(noun,true,word)?.title:null};
  }));
  assert.deepEqual(forms.map(x=>x.title),[
   'ὁ ἀγαθὸς ἄνθρωπος','ἡ καλὴ χώρα','τὸ καλὸν δῶρον'
  ]);
  // Prueba de independencia léxica en griego: el adjetivo καλός es
  // admisible en UD5 aunque su ficha se etiquete temporalmente UD12.
  const greekGrammarOnly=await page.evaluate(()=>{
   const lex=greekSharedBank.lookup('καλός');
   if(!lex)return {hasLex:false,available:false};
   const before=new Set(lex.units);
   try{
    lex.units.clear();lex.units.add('UD12');
    return {hasLex:true,available:greekAvailableSyntagmAdjectives(5)
     .some(x=>x.lemma==='καλός'),
     noun:greekVerifiedCorpus.some(x=>x.id==='n-δωρον'&&
      greekMorphologyEligible(x,2))};
   }finally{lex.units.clear();for(const u of before)lex.units.add(u)}
  });
  assert(greekGrammarOnly.hasLex,'Lema griego contrastado καλός');
  assert(greekGrammarOnly.available,'Un adjetivo de primera clase vale desde UD5 aunque figure en UD12');
  assert(greekGrammarOnly.noun,'El neutro δῶρον está disponible desde la lección gramatical UD2');
  await greek(7);
  const number=await page.evaluate(()=>ExaminaGreekNumber.candidates());
  assert(number.some(x=>x.prompt==='ὁ αὐτὸς ἄνθρωπος'&&x.answer==='οἱ αὐτοὶ ἄνθρωποι'));
  assert(number.some(x=>x.prompt==='τὰ αὐτὰ δῶρα'&&x.answer==='τὸ αὐτὸ δῶρον'));
  await greek(8);
  assert(await page.evaluate(()=>!greekVerifiedCorpus.some(x=>x.id==='n-πολισ')),
   'UD8: πόλις no se promueve sin el paradigma completo');
  assert.deepEqual(exceptions,[],'Excepciones de navegador');
  console.log('PR169 SINTAGMAS OK:',JSON.stringify(evidence));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
