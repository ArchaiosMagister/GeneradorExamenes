'use strict';
// Regresión: regeneración de las cuatro cuotas y admisión por gramática,
// independiente de la procedencia del vocabulario, en griego y latín.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const kinds=['nouns','adjectives','verbs','pronouns'];
async function configure(page,course,model,unit,lang){
 await page.evaluate(({course,model,unit,lang})=>{
  function change(id,value){
   const element=document.getElementById(id);
   if(!element)throw Error('Falta selector '+id);
   element.value=value;
   element.dispatchEvent(new Event('change',{bubbles:true}));
  }
  change('course',course);change('model',model);change('lang',lang);
  const focus=[...document.querySelectorAll('#unitChoices .unit-choice')]
   .find(x=>units[Number(x.value)]==='UD'+unit);
  if(!focus)throw Error('Unidad no encontrada '+course+' UD'+unit);
  for(const input of document.querySelectorAll('#unitChoices .unit-choice'))
   input.checked=input===focus;
  focus.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  if(course==='greek1')greekExamState=null;
  generate();
 },{course,model,unit,lang});
}
async function audit(page,course,model,quotas){
 return page.evaluate(({course,model,quotas})=>{
  function categories(){
   if(course==='greek1'&&model==='complete'){
    const lookup=new Map(greekChoicePool('forms').map(x=>[x.id,x]));
    return (greekExamState?.ids?.forms||[]).map(id=>examGreekWordClass(lookup.get(id)));
   }
   const cache=examSelectionCache.get(examCacheSignature('forms'))||[];
   return cache.map(x=>course==='greek1'?examGreekWordClass(x):x.category);
  }
  const ids=course==='greek1'&&model==='complete'?[...(greekExamState?.ids?.forms||[])]:null;
  const liveQuotas=examMorphQuotaValues();
  const pool=course==='greek1'&&model==='complete'?greekChoicePool('forms'):null;
  const poolCounts=pool?['nouns','adjectives','verbs','pronouns'].map(kind=>
   pool.filter(x=>examGreekWordClass(x)===kind).length):null;
  const selectionCounts=pool?['nouns','adjectives','verbs','pronouns'].map(kind=>
   examQuotaGreek(pool,liveQuotas.reduce((a,b)=>a+b,0),ids||[])
    .filter(x=>examGreekWordClass(x)===kind).length):null;
  const actual=categories();
  const counts=['nouns','adjectives','verbs','pronouns'].map(kind=>actual.filter(x=>x===kind).length);
  const display=[...document.querySelectorAll(course==='greek1'&&model==='complete'?
   '#paper .exam-form[data-corpus-id]':'#paper [data-analysis-slot]')].length;
  return {actual,counts,display,ids,quotas,liveQuotas,poolCounts,selectionCounts,signature:greekExamState?.signature,
   regenerationDebug:window.ExaminaGreekRegenerationDebug};
 },{course,model,quotas});
}
async function selectQuotas(page,quotas){
 await page.evaluate(quotas=>{
  for(const [i,kind] of ['nouns','adjectives','verbs','pronouns'].entries()){
   const e=document.getElementById('quota-'+kind);
   if(!e)throw Error('Falta cuota '+kind);
   e.value=String(quotas[i]);
   e.dispatchEvent(new Event('change',{bubbles:true}));
  }
 },quotas);
}
async function testGreek(page,model,unit,lang,quotas){
 await configure(page,'greek1',model,unit,lang);
 await selectQuotas(page,quotas);
 const label='greek1/'+model+'/UD'+unit+'/'+lang;
 let before=await audit(page,'greek1',model,quotas);
 assert.deepEqual(before.counts,quotas,label+' cuotas iniciales '+JSON.stringify(before));
 assert.equal(before.display,quotas.reduce((a,b)=>a+b,0),label+' filas visibles');
 let distinct=[];
 for(let iteration=0;iteration<5;iteration++){
  const attempt=await page.evaluate(model=>{
   const liveQuotas=examMorphQuotaValues();
   const choices=greekChoicePool('forms');
   const planned=model==='complete'?examQuotaGreek(choices,greekExamState.ids.forms.length,greekExamState.ids.forms)
    .map(x=>({id:x.id,kind:examGreekWordClass(x)})):[];
   const operation=model==='complete'?greekRegenerate('forms'):(regenerateExamQuestion('forms'),true);
   return {operation,liveQuotas,planned,
    resultingIds:model==='complete'?[...greekExamState.ids.forms]:[]};
  },model);
  assert.equal(attempt.operation,true,label+' no se pudo regenerar');
  const after=await audit(page,'greek1',model,quotas);
  assert.deepEqual(after.counts,quotas,label+' cuotas al regenerar '+iteration+': '+
   JSON.stringify({after,attempt}));
  assert.equal(after.display,quotas.reduce((a,b)=>a+b,0),label+' número de filas '+iteration);
  distinct.push(after.ids?after.ids.join('|'):after.actual.join('|'));
  before=after;
 }
 // Al menos en la UD avanzada la regeneración debe variar realmente la muestra.
 if(unit>=7&&model==='complete')
  assert(new Set(distinct).size>1,label+' ninguna variación tras cinco regeneraciones');
}
async function testLatin(page,course,unit,lang,quotas){
 await configure(page,course,'morf',unit,lang);
 await selectQuotas(page,quotas);
 const label=course+'/UD'+unit+'/'+lang;
 const check=async when=>{
  const result=await audit(page,course,'morf',quotas);
  assert.deepEqual(result.counts,quotas,label+'/'+when+': cuotas '+JSON.stringify(result));
  assert.equal(result.display,quotas.reduce((a,b)=>a+b,0),label+'/'+when+': número de formas');
 };
 await check('inicial');
 await page.evaluate(()=>regenerateExamQuestion('forms'));
 await check('regeneración completa');
 await page.evaluate(()=>{
  const first=document.querySelector('[data-question="forms"] button[data-regenerate-kind="forms"][data-regenerate-index="0"]');
  if(!first)throw Error('Falta regeneración individual');
  first.click();
 });
 await check('regeneración individual');
 const curricular=await page.evaluate(unit=>{
  const chosen=selectedUnits(),all=latinExamFormCandidates(chosen,true);
  const nouns=all[0],adjectives=all[1];
  const invalidNouns=nouns.filter(x=>latinSyntagmNounUnit(x.declension)>unit);
  const invalidAdj=unit<(currentCourse()==='latin4'?3:2)?adjectives.length:0;
  const later=nouns.concat(adjectives).filter(x=>(x.units||[])
   .some(label=>examUnitNumber(label)>unit));
  return {invalidNouns:invalidNouns.length,invalidAdj,later:later.length,
   nouns:nouns.length,adjectives:adjectives.length};
 },unit);
 assert.equal(curricular.invalidNouns,0,label+': declinación aún no explicada');
 assert.equal(curricular.invalidAdj,0,label+': adjetivo aún no explicado');
 if(unit>=2)assert(curricular.later>0,label+': todavía restringido al vocabulario de la unidad '+JSON.stringify(curricular));
 return curricular;
}

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   for(const lang of ['es','va']){
    const page=await browser.newPage({viewport:{width:1366,height:920}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
    for(const model of ['morphology','complete']){
     await testGreek(page,model,5,lang,[2,2,3,0]);
     await testGreek(page,model,8,lang,[3,3,3,2]);
    }
    await testLatin(page,'latin1',1,lang,[2,0,2,0]);
    await testLatin(page,'latin1',7,lang,[2,2,3,2]);
    await testLatin(page,'latin4',2,lang,[2,0,2,0]);
    await testLatin(page,'latin4',7,lang,[2,2,3,0]);
    assert.deepEqual(errors,[],file+'/'+lang+': errores JavaScript');
    await page.close();
   }
  }
  console.log('PASS: regeneración de las cuatro cuotas griegas y latinas, variedad, ES/VA y versión offline; paradigma explicado sin exigir vocabulario de UD.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
