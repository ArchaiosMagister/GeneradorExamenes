'use strict';
// Audita los cuatro selectores de análisis griego en todas las unidades.
// Compara las cuotas realmente visibles con las formas documentadas del corpus,
// y comprueba cambios sucesivos de valores (no solo la configuración inicial).
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const kinds=['nouns','adjectives','verbs','pronouns'];
const files=['index.html','offline.html'];
const languages=['es','va'];
const models=['morphology','complete'];
async function setConfig(page,lang,model){
 await page.evaluate(({lang,model})=>{
  function change(id,value){
   const e=document.getElementById(id);
   if(!e)throw Error('Falta campo '+id);
   e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));
  }
  change('course','greek1');
  change('model',model);
  change('lang',lang);
  generate();
 },{lang,model});
}
async function checkUnit(page,unit,model){
 return page.evaluate(({unit,model})=>{
  const unitInput=[...document.querySelectorAll('#unitChoices .unit-choice')].find(
   x=>units[Number(x.value)]==='UD'+unit);
  if(!unitInput)throw Error('Falta UD'+unit);
  for(const x of document.querySelectorAll('#unitChoices .unit-choice'))x.checked=x===unitInput;
  unitInput.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  const originals=greekVerifiedCorpus.filter(x=>x.verified&&greekMorphologyEligible(x,unit));
  const allowed=originals.filter(x=>x.kind==='forms'&&
   !x.prompt.includes(' ')&&!(x.lemmas||[]).some(lemma=>isExcludedExamMorphLemma(lemma)));
  const results=[];
  function setQuota(kind,value){
   const e=document.getElementById('quota-'+kind);
   if(!e)throw Error('Falta el contador '+kind);
   e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function visible(){
   const slots=[...document.querySelectorAll(model==='morphology'?
    '#paper [data-analysis-slot]':'#paper .exam-form[data-corpus-id]')];
   const idMap=new Map(greekVerifiedCorpus.map(x=>[x.id,x]));
   const approved=examAuthorizedProposals('greek1',unit);
   for(const x of approved)idMap.set(x.id,x);
   const names=slots.map(el=>{
    const id=el.dataset.corpusId;
    if(id.startsWith('gvf-'))return 'verbs';
    const entry=idMap.get(id);
    return entry?examGreekWordClass(entry):null;
   });
   return {count:slots.length,names,ids:slots.map(el=>el.dataset.corpusId)};
  }
  for(const kind of ['nouns','adjectives','verbs','pronouns']){
   for(const other of ['nouns','adjectives','verbs','pronouns'])setQuota(other,0);
   const seen=[];
   for(const requested of [1,3,10]){
    setQuota(kind,requested);
    const rendered=visible();
    const available=allowed.concat(examAuthorizedProposals('greek1',unit).filter(
     x=>x.kind==='forms'&&!x.prompt.includes(' ')))
     .concat(examGreekVerbFormCandidates(originals,unit))
     .filter(x=>examGreekWordClass(x)===kind);
    const distinct=new Set(available.map(x=>x.id));
    const expected=Math.min(requested,distinct.size);
    if(rendered.count!==expected||rendered.names.some(x=>x!==kind)){
     throw Error(JSON.stringify({unit,model,kind,requested,expected,available:distinct.size,rendered,actualQuotas:examMorphQuotaValues(),stateForms:greekExamState?.ids?.forms,signature:greekExamState?.signature,dom:document.querySelector("#paper [data-greek-kind=forms]")?.nextElementSibling?.outerHTML?.slice(0,350)}));
    }
    seen.push({requested,actual:rendered.count,available:distinct.size});
   }
   results.push({kind,seen});
  }
  // Cuotas simultáneas, sin que sustantivos consuman los huecos de verbos,
  // adjetivos o pronombres.
  for(const kind of ['nouns','adjectives','verbs','pronouns'])setQuota(kind,2);
  const mixed=visible();
  const summary=Object.fromEntries(['nouns','adjectives','verbs','pronouns'].map(kind=>[
   kind,mixed.names.filter(x=>x===kind).length]));
  const capacity=Object.fromEntries(results.map(x=>[x.kind,x.seen[0].available]));
  for(const kind of Object.keys(summary)){
   if(summary[kind]!==Math.min(2,capacity[kind]))
    throw Error('Mezcla incorrecta '+JSON.stringify({unit,model,summary,capacity,mixed}));
  }
  if(mixed.names.some(x=>!['nouns','adjectives','verbs','pronouns'].includes(x)))
   throw Error('Categoria no solicitada '+JSON.stringify({unit,mixed}));
  return {unit,capacity,mixed:summary};
 },{unit,model});
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of files)for(const lang of languages)for(const model of models){
   const context=await browser.newContext({viewport:{width:1380,height:900}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
   await setConfig(page,lang,model);
   const report=[];
   for(let unit=1;unit<=14;unit++)report.push(await checkUnit(page,unit,model));
   assert.deepEqual(errors,[],file+'/'+lang+'/'+model+': errores de JavaScript');
   console.log('GREEK_QUOTA_MATRIX '+JSON.stringify({file,lang,model,report}));
   await context.close();
  }
  console.log('PASS: 14 UDs x 4 categorías x 3 incrementos y mezcla; ES/VA, web/autónoma, morfología/completo.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
