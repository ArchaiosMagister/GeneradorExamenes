'use strict';
/* Auditoría académica de los paradigmas nuevos (sin writes a datos docentes).
 * Navegadores: Chromium; web/autónoma; ambos idiomas y modelos; UD1-UD14.
 */
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const expectedBlocks={
 'ev-λυω-imperfect':11,'ev-λυω-future':11,
 'ev-λυω-aorist':12,'ev-λυω-perfect':13,
 'ev-λυω-pluperfect':13,'ev-ηγεομαι':14,
 'ev-ηγεομαι-future':14
};
const test=async(page,lang,model,unit)=>{
 return page.evaluate(({lang,model,unit})=>{
  const change=(id,value)=>{
   const x=document.getElementById(id);x.value=value;
   x.dispatchEvent(new Event('change',{bubbles:true}));
  };
  change('course','greek1');
  change('model',model);
  change('lang',lang);
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  const target=choices.find(x=>units[Number(x.value)]==='UD'+unit);
  if(!target)throw Error('Falta UD'+unit);
  choices.forEach(x=>x.checked=x===target);
  target.dispatchEvent(new Event('change',{bubbles:true}));
  generate();
  const corpus=new Map(greekVerifiedCorpus.map(x=>[x.id,x]));
  const eligible=id=>corpus.has(id)&&greekMorphologyEligible(corpus.get(id),unit);
  const nouns=['αρχων','γυνη'].map(key=>({
   key,unit:greekNounUnits[key],
   verified:eligible('n-'+key),
   forms:greekNounData[key]?.length,
   table:corpus.get('n-'+key)?.table?.rows?.length
  }));
  const verbs=Object.fromEntries(
   Object.keys(greekExplicitVerbEvidence).map(key=>['ev-'+key,eligible('ev-'+key)]));
  const advancedPronouns=greekVerifiedCorpus.filter(x=>x.kind==='pronouns'&&
    x.id.startsWith('ap-')&&greekMorphologyEligible(x,unit));
  const participles=greekVerifiedCorpus.filter(x=>x.id.startsWith('part-')&&greekMorphologyEligible(x,unit));
  const nounSyntagms=unit>=5?greekMorphSyntagmPool().map(x=>greekBankKey(x.noun)):[];
  const changed=ExaminaGreekNumber.candidates();
  const numberUnique=changed.length===new Set(changed.map(x=>x.prompt.normalize('NFC')+'|'+x.answer.normalize('NFC'))).size;
  const numberSources=[...new Set(changed.map(x=>x.source))];
  let retro={count:0,sources:[],unique:true,adjectives:true,selectedUnique:true};
  let numSelected={count:0,unique:true};
  if(model==='complete'&&unit>=8){
   const retros=ExaminaGreekRetroversion.candidates();
   const retroSelected=ExaminaGreekRetroversion.current().items;
   const numberSelected=ExaminaGreekNumber.current().items;
   retro={
    count:retros.length,
    sources:[...new Set(retros.map(x=>x.source))],
    unique:retros.length===new Set(retros.map(x=>x.id)).size,
    adjectives:retros.every(x=>x.adjective),
    selectedUnique:retroSelected.length===new Set(retroSelected.map(x=>x.prompt.normalize('NFC'))).size
   };
   numSelected={count:numberSelected.length,
    unique:numberSelected.length===new Set(numberSelected.map(x=>x.prompt.normalize('NFC'))).size};
  }
  return {unit,model,lang,nouns,verbs,advancedPronouns:advancedPronouns.length,
   participles:participles.length,nounSyntagms,numberUnique,numberSources,retro,numSelected,
   pageErrors:[...document.querySelectorAll('#paper .error')].length};
 },{lang,model,unit});
};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])for(const lang of ['es','va']){
   const ctx=await browser.newContext({viewport:{width:1440,height:980}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve(file)).href);
   for(const model of ['morphology','complete']){
    for(let unit=1;unit<=14;unit++){
     const report=await test(page,lang,model,unit);
     const label=file+'/'+lang+'/'+model+'/UD'+unit;
     for(const x of report.nouns){
      assert.equal(x.unit,8,label+': unidad nominal '+x.key);
      assert.equal(x.verified,unit>=8,label+': tercera declinación '+x.key);
      assert.equal(x.forms,10,label+': paradigma nominal incompleto '+x.key);
      assert.equal(x.table,5,label+': tabla nominal incompleta '+x.key);
     }
     for(const [id,introduction] of Object.entries(expectedBlocks))
      assert.equal(report.verbs[id],unit>=introduction,label+': tiempo adelantado/ausente '+id);
     assert.equal(report.advancedPronouns,unit<8?0:unit===8?9:26,
      label+': interrogativos/relativos fuera de su unidad');
     assert.equal(report.participles,unit>=10?12:0,label+': participios fuera de unidad');
     assert(report.numberUnique,label+': cambio de número con filas duplicadas');
     if(unit>=8){
      assert(report.nounSyntagms.includes('αρχων'),
       label+': faltan sintagmas de tercera declinación de ἄρχων');
      assert(report.nounSyntagms.includes('γυνη'),
       label+': faltan sintagmas de tercera declinación de γυνή');
      assert(report.numberSources.includes('n-αρχων')&&report.numberSources.includes('n-γυνη'),
       label+': el cambio de número excluye sustantivos de tercera declinación');
     }
     if(model==='complete'&&unit>=8){
      assert(report.retro.count>0&&report.retro.unique&&report.retro.adjectives,
       label+': retroversiones sin concordancia o repetidas');
      assert(report.retro.sources.includes('n-αρχων'),
       label+': retroversiones sin ἄρχων del vocabulario UD8');
      assert(report.retro.selectedUnique&&report.numSelected.unique,
       label+': formas visualmente repetidas en selección inicial');
     }
    }
    console.log('GR1_EVIDENCE '+file+'/'+lang+'/'+model+
      ': 14 UD; 3ª, relativos, interrogativos, participios y tiempos contrastados.');
   }
   assert.deepEqual(errors,[],file+'/'+lang+': JS errors');
   await ctx.close();
  }
  console.log('PASS: progresión UD1–14, fuentes nominales/verbales, número y retroversión, 112 contextos.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
