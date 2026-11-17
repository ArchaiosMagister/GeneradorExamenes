'use strict';
// PR #169: aprobaciones docentes sin adelantar contenidos ni crear lemas.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
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
  const evidence=[];
  for(const course of ['latin1','latin4']){
   for(const [noun,adjective,minUnit] of (course==='latin1'?[
    ['puella','bonus',2],['servus','bonus',2],['bellum','magnus',2],['puer','Romanus',2],
    ['rex','magnus',4],['hostis','Romanus',4],['agricola','bonus',2],
    ['nauta','bonus',2],['poeta','bonus',3]
   ]:[
    ['puella','Romanus',3],['servus','bonus',3],['templum','magnus',3],
    ['puer','bonus',3],['rex','bonus',5],['nomen','Romanus',5],
    ['agricola','bonus',3],['nauta','bonus',3],['poeta','bonus',3]
   ])){
    await select(course,'tablas',minUnit);
    const r=await page.evaluate(({noun,adjective,minUnit})=>{
     const available=latinExamNominals(['UD'+minUnit]);
     const adjectives=latinCompleteAdjectives(['UD'+minUnit]);
     const nounItem=available.find(x=>mNormalize(x.p.lemma).toLowerCase()===noun);
     const adjectiveItem=adjectives.find(x=>mNormalize(headLex(x.x.entry)).toLowerCase()===adjective.toLowerCase());
     const chosen=latinCompleteDeclensionItems(['UD'+minUnit]);
     const item=chosen.find(x=>mNormalize(x.p.lemma).toLowerCase()===noun);
     return {noun,adjective,minUnit,course:currentCourse(),
      nounAvailable:!!nounItem,adjectiveAvailable:!!adjectiveItem,
      selected:item?.compound?.adjective?.entry||null,
      nominative:item?.compound?.forms?.[0]?.[0]||null,
      gender:item?.compound?.gender||null};
    },{noun,adjective,minUnit});
    if(r.nounAvailable&&r.adjectiveAvailable){
     assert(r.nominative,'Falta el sintagma aprobado '+course+'/'+noun);
     assert.equal(r.nominative.split(' ').length,2,'Solo sustantivo + adjetivo');
     assert.equal(r.selected.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').split(',')[0],
      adjective.toLowerCase(),'Pareja docente no aplicada: '+course+'/'+noun);
     if(['agricola','nauta','poeta'].includes(noun)){
      assert.equal(r.gender,'m','Primera declinación masculina');
      assert(!r.nominative.endsWith('bona'),'El adjetivo ha concordado en femenino');
     }
    }
    evidence.push(r);
   }
  }
  // Las unidades son acumulativas en gramática: agricola figura en LAT4 UD1
  // y bonus se introduce en UD3. No exigir seleccionar también UD1.
  for(const [course,unit] of [['latin1',2],['latin4',3]]){
   await select(course,'tablas',unit);
   const diagnostic=await page.evaluate(()=>{
    const candidate=latinExamNominals(['UD'+(0||2)]); // diagnostic below uses actual current unit
    const adjectives=latinCompleteAdjectives(selectedUnits());
    const noun=latinCompleteDeclensionItems(selectedUnits()).find(x=>mNormalize(x.p.lemma).toLowerCase()==='agricola');
    return {course:currentCourse(),units:selectedUnits(),candidates:adjectives.filter(x=>/bonus|doctus|Romanus/i.test(x.x.entry)).map(x=>({entry:x.x.entry,unit:x.x.unit})), approved:latinApprovedSyntagmAdjective(noun,adjectives,Math.max(0,...selectedUnits().map(examUnitNumber).filter(Number.isInteger)))?.x?.entry, selected:noun?.compound?.adjective?.entry,nouns:latinExamNominals(selectedUnits()).map(x=>x.p.lemma).filter(x=>x==='agricola')};
   });
   console.log('DIAGNOSTIC PR169',JSON.stringify(diagnostic));
   await select(course,'tablas',unit);
   const r=await page.evaluate(unit=>{
    const group=latinCompleteDeclensionItems(['UD'+unit])
     .find(x=>mNormalize(x.p.lemma).toLowerCase()==='agricola');
    return {found:!!group,gender:group?.compound?.gender,
     nominative:group?.compound?.forms?.[0]?.[0],
     accusative:group?.compound?.forms?.[0]?.[2],
     plural:group?.compound?.forms?.[1]?.[0],
     sourceUnit:group?.x?.unit};
   },unit);
   assert(r.found,course+': agricola de UD previa debe poder salir en UD'+unit);
   assert.equal(r.gender,'m',course+': género masculino de agricola');
   assert.equal(r.nominative,'bonus agricola',course+': orden de sintagma docente');
   assert.equal(r.accusative,'bonum agricolam');
   assert.equal(r.plural,'boni agricolae');
   assert(Number(r.sourceUnit.replace('UD',''))<unit,
    course+': debe conservarse el lema de la UD de origen');
  }
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
  assert(article.title.startsWith('ἡ ')&&
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
  await greek(7);
  const number=await page.evaluate(()=>ExaminaGreekNumber.candidates());
  assert(number.some(x=>x.prompt==='ὁ αὐτὸς ἄνθρωπος'&&x.answer==='οἱ αὐτοὶ ἄνθρωποι'));
  assert(number.some(x=>x.prompt==='τὰ αὐτὰ δῶρα'&&x.answer==='τὸ αὐτὸ δῶρον'));
  await greek(8);
  assert(!greekVerifiedCorpus.some(x=>x.id==='n-πολισ'),
   'UD8: πόλις no se promueve sin el paradigma completo');
  assert.deepEqual(exceptions,[],'Excepciones de navegador');
  console.log('PR169 SINTAGMAS OK:',JSON.stringify(evidence));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
