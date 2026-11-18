'use strict';
// Contraste en navegador real: no se usan las candidatas Wiktextract/Eulexis.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'load'});
  async function configure(course,model,unit){
   await page.evaluate(({course,model,unit})=>{
    const subject=document.getElementById('course');
    subject.value=course;subject.dispatchEvent(new Event('change',{bubbles:true}));
    const select=document.getElementById('model');
    select.value=model;select.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('.unit-choice').forEach(input=>{
     input.checked=units[Number(input.value)]===unit;
    });
    generate();
   },{course,model,unit});
  }
  await configure('greek1','complete','UD4');
  let result=await page.evaluate(()=>({
   available:greekAvailableSyntagmAdjectives(greekLimit()).length,
   headings:[...document.querySelectorAll('#paper .exam-nouns:not(#answerkey .exam-nouns) thead th[colspan]')]
    .map(x=>x.textContent.trim())
  }));
  assert.equal(result.available,0,'UD4 todavía no contiene adjetivos de las clases estudiadas');
  assert(result.headings.every(text=>!text.includes('ἀγαθ')&&!text.includes('κακ')),
   'No introducir adjetivos antes de UD5');
  await configure('greek1','complete','UD5');
  result=await page.evaluate(()=>{
   const adjs=greekAvailableSyntagmAdjectives(greekLimit());
   const nouns=greekVerifiedCorpus.filter(x=>x.kind==='declension'&&x.minUnit<=greekLimit());
   const find=id=>nouns.find(x=>x.id===id);
   const pair=(id,lemma)=>greekCompleteNominalGroup(find(id),true,adjs.find(x=>x.lemma===lemma));
   const feminine22=pair('n-αγορα','αἰσχρός');
   const feminine212=pair('n-αγορα','πονηρός');
   const echthros=pair('n-αγορα','ἐχθρός');
   const neuter22=pair('n-δωρον','αἰσχρός');
   const nominative=pair('n-λογος','δίκαιος');
   const check=pair('n-αγορα','δίκαιος');
   const megasM=pair('n-λογος','μέγας'),megasF=pair('n-αγορα','μέγας');
   const polysN=pair('n-δωρον','πολύς'),polysF=pair('n-αγορα','πολύς');
   const draws=2400,firstMixed=Array.from({length:draws},()=>
    ['μέγας','πολύς'].includes(greekWeightedSyntagmAdjectives(adjs)[0]?.lemma))
    .filter(Boolean).length;
   const weightedRatio=firstMixed/draws,unweightedRatio=2/adjs.length;
   return {
    adjectives:adjs.map(x=>x.lemma),classes:adjs.map(x=>x.feminine===null?'2-2':'2-1-2'),
    feminine22,feminine212,echthros,neuter22,nominative,check,
    megasM,megasF,polysN,polysF,weightedRatio,unweightedRatio,
    selected:greekExamState.ids.declension,
    chosen:greekExamState.adjectiveChoices||{}
   };
  });
  assert(result.adjectives.length>=7,
   'En UD5 deben estar disponibles varios adjetivos 2-1-2 y 2-2 del banco: '+result.adjectives.join(', '));
  assert(result.classes.includes('2-2')&&result.classes.includes('2-1-2'),'Falta una clase de adjetivo');
  assert(result.adjectives.includes('ἐχθρός'),'ἐχθρός debe poder sortearse desde UD5 tras los diez cotejos individuales');
  for(const lemma of ['μέγας','πολύς'])
   assert(result.adjectives.includes(lemma),'Falta un adjetivo de doble tema de UD5: '+lemma);
  assert(result.weightedRatio>result.unweightedRatio*1.45,
   'Los adjetivos de doble tema deben aparecer con una ponderación aproximadamente triple');
  assert.match(result.megasM.title,/^ὁ μέγας λόγος$/u);
  assert.match(result.megasM.rows[2][1][0],/^τὸν μέγαν /u);
  assert.match(result.megasM.rows[3][1][0],/^τοῦ μεγάλου /u);
  assert.match(result.megasF.title,/^ἡ μεγάλη ἀγορά$/u);
  assert.match(result.megasF.rows[4][1][0],/^τῇ μεγάλῃ /u);
  assert.match(result.polysN.title,/^τὸ πολὺ δῶρον$/u);
  assert.match(result.polysN.rows[3][1][0],/^τοῦ πολλοῦ /u);
  assert.match(result.polysF.title,/^ἡ πολλὴ ἀγορά$/u);
  assert.match(result.polysF.rows[4][1][0],/^τῇ πολλῇ /u);
  assert.match(result.megasM.enunciation,/μέγας, μεγάλη, μέγα/u);
  assert.match(result.polysN.enunciation,/πολύς, πολλή, πολύ/u);
  for(const lemma of ['ἀθάνατος','αὐτόνομος','φρόνιμος','θνητός'])
   assert(result.adjectives.includes(lemma),'Falta adjetivo 2-2 '+lemma);
  assert.match(result.feminine22.title,/^ἡ αἰσχρὸς ἀγορά$/u,'El adjetivo 2-2 conserva flexión masculina con artículo femenino');
  assert.match(result.feminine22.rows[3][1][0],/^τῆς αἰσχροῦ /u);
  assert.match(result.feminine212.title,/^ἡ πονηρὰ ἀγορά$/u);
  assert.match(result.echthros.title,/^ἡ ἐχθρὰ ἀγορά$/u);
  assert.match(result.echthros.rows[3][1][0],/^τῆς ἐχθρᾶς /u,'Genitivo singular femenino circunflejo');
  assert.match(result.echthros.rows[2][1][0],/^τὴν ἐχθρὰν /u,'Acusativo singular con artículo y acento grave');
  assert.match(result.echthros.rows[4][1][0],/^τῇ ἐχθρᾷ /u,'Dativo femenino conserva iota suscrita');
  assert.match(result.feminine212.rows[3][1][0],/^τῆς πονηρᾶς /u);
  assert.match(result.neuter22.title,/^τὸ αἰσχρὸν δῶρον$/u);
  assert.match(result.nominative.title,/^ὁ δίκαιος λόγος$/u);
  assert.match(result.check.rows[3][1][0],/^τῆς δικαίας /u);
  for(const noun of [result.feminine22,result.feminine212,result.echthros,result.neuter22,result.nominative]){
   assert.equal(noun.rows.length,5);
   assert(noun.rows.every(row=>row[1].length===2));
   assert(noun.rows[1][1].every(cell=>!(/^(ὁ|ἡ|τὸ|οἱ|αἱ|τὰ) /u).test(cell)),
    'El vocativo no admite artículo');
  }
  // Las opciones del mismo examen usan distintos adjetivos cuando el banco basta.
  const allocated=Object.values(result.chosen);
  assert.equal(allocated.length,new Set(allocated).size,'El mismo examen repite innecesariamente un adjetivo');
  await configure('greek1','morphology','UD5');
  const morphological=await page.evaluate(()=>{
   document.getElementById('morphSyntagms').value='';
   document.getElementById('morphOffer').value='3';
   examSelectionCache.clear();generate();
   const html=document.getElementById('paper');
   const items=[...html.querySelectorAll('.reference-analysis-item')].slice(0,3).map(x=>x.textContent.trim());
   return items;
  });
  assert.equal(morphological.length,3);
  assert(morphological.every(x=>/^[abc]\. ὁ, ἡ, τό \+ \S+, .+ \+ \S+, /u.test(x)),
   'La pregunta de morfología debe dar enunciados completos: '+morphological.join(' | '));
  const stems=morphological.map(x=>x.split(' + ')[1].split(',')[0]);
  assert.equal(new Set(stems).size,stems.length,'La morfología debe diversificar los adjetivos dentro de la pregunta');
  // La edición docente tiene prioridad sobre la propuesta automática.
  const manual=await page.evaluate(()=>{
   document.getElementById('morphSyntagms').value='ὁ σοφὸς ἄνθρωπος';
   generate();
   return document.querySelector('.reference-analysis-item')?.textContent.trim();
  });
  assert.equal(manual,'a. ὁ σοφὸς ἄνθρωπος');
  // UD7: pronominal de identidad, pero nunca demostrativo tras artículo.
  await configure('greek1','complete','UD7');
  const pronoun=await page.evaluate(()=>{
   const available=greekAvailableSyntagmModifiers(greekLimit());
   const item=greekVerifiedCorpus.find(x=>x.id==='n-ανθρωπος');
   const autos=available.find(x=>x.lemma==='αὐτός');
   const group=greekCompleteNominalGroup(item,true,autos);
   const original=greekExamState;
   let heading='';
   try{
    greekExamState={ids:{declension:[item.id]},adjectiveChoices:{[item.id]:'αὐτός'}};
    const node=document.createElement('div');node.innerHTML=greekTable(item);
    heading=node.querySelector('.exam-nouns thead th[colspan]')?.textContent.trim()||'';
   }finally{greekExamState=original}
   return {available:available.map(x=>x.lemma),group,heading};
  });
  assert(pronoun.available.includes('αὐτός'),'El pronominal debe estar disponible desde UD7');
  assert.equal(pronoun.group.title,'ὁ αὐτὸς ἄνθρωπος');
  assert.match(pronoun.group.enunciation,/^ὁ, ἡ, τό \+ αὐτός, αὐτή, αὐτό \+ ἄνθρωπος,/u);
  assert.equal(pronoun.heading,pronoun.group.enunciation);
  assert.deepEqual(pronoun.group.rows[1][1],['—','—'],'αὐτός carece de vocativo');
  assert.equal(pronoun.group.rows[3][1][0],'τοῦ αὐτοῦ ἀνθρώπου');
  await configure('latin1','tablas','UD2');
  const latin=await page.evaluate(()=>{
   const nouns=latinCompleteDeclensionItems(selectedUnits()).filter(x=>x.compound);
   return {nounCount:nouns.length,adjectiveCount:latinCompleteAdjectives(selectedUnits()).length,
    examples:nouns.slice(0,5).map(item=>({title:item.compound.title,
     singular:item.compound.forms[0],plural:item.compound.forms[1]}))};
  });
  assert(latin.nounCount>0,'El banco latino debe generar sintagmas nominales');
  assert(latin.examples.every(x=>x.singular.every(form=>form.split(' ').length===2)));
  assert(latin.examples.every(x=>x.plural.every(form=>form.split(' ').length===2)));
  if(latin.nounCount>=2&&latin.adjectiveCount>=2)
   assert(new Set(latin.examples.map(x=>x.title.split(' + ')[0])).size>=2,
    'Los adjetivos latinos no deben repetirse cuando hay alternativas');
  await configure('latin1','morf','UD2');
  const latinMorph=await page.evaluate(()=>{
   document.getElementById('morphSyntagms').value='';
   examSelectionCache.clear();generate();
   return [...document.querySelectorAll('#paper .reference-analysis-item')].slice(0,3).map(x=>x.textContent.trim());
  });
  assert(latinMorph.some(x=>/^[a-c]\. \S+ \S+/.test(x)),'La morfología latina debe reutilizar los sintagmas del banco');
  assert.deepEqual(errors,[],'No puede haber excepciones JavaScript');
  console.log('SINTAGMAS OK: variedad, unidades, 2-1-2, 2-2, acentuación, concordancia y edición manual.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
