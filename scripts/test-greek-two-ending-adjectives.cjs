'use strict';
// Griego I UD5: cobertura de los adjetivos –ος, –ον sin perder las cuotas,
// el programa por unidades ni la regeneración de una forma concreta.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

async function configure(page,model,lang,unit,count){
 await page.evaluate(({model,lang,unit,count})=>{
  const change=(id,value)=>{
   const el=document.getElementById(id);
   if(!el)throw Error('Control ausente: '+id);
   el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  change('course','greek1');change('model',model);change('lang',lang);
  change('sheetType','review');
  const choices=[...document.querySelectorAll('.unit-choice')];
  const focus=choices.find(el=>units[Number(el.value)]==='UD'+unit);
  if(!focus)throw Error('Falta UD'+unit);
  choices.forEach(el=>el.checked=el===focus);
  focus.dispatchEvent(new Event('change',{bubbles:true}));
  for(const kind of ['nouns','adjectives','verbs','pronouns'])
   change('quota-'+kind,kind==='adjectives'?count:0);
  if(model==='morphology')document.getElementById('morphCategory-adj').checked=true;
  examSelectionCache.clear();greekExamState=null;generate();
 },{model,lang,unit,count});
}
async function snapshot(page,model){
 return page.evaluate(model=>{
  const pool=greekChoicePool('forms');
  const rows=model==='complete'
   ?(greekExamState?.ids?.forms||[]).map(id=>pool.find(x=>x.id===id))
   :(examSelectionCache.get(examCacheSignature('forms'))||[]);
  const visible=[...document.querySelectorAll(model==='complete'
   ?'#paper .exam-form[data-corpus-id]':'#paper [data-analysis-slot]')];
  return {rows:rows.map(x=>({id:x?.id,type:greekExamAdjectiveEndingType(x),
    category:examGreekWordClass(x),unit:x?.minUnit,form:x?.prompt})),
   visible:visible.map(x=>x.dataset.corpusId),
   quota:examMorphQuotaValues(),review:document.getElementById('sheetType').value};
 },model);
}
async function regenerate(page,model){
 return page.evaluate(model=>model==='complete'?
  greekRegenerate('forms'):regenerateExamQuestion('forms'),model);
}
async function verify(page,model,lang,unit){
 const mark=model+'/'+lang+'/UD'+unit;
 await configure(page,model,lang,unit,2);
 const check=(x,when)=>{
  const classes=x.rows.map(y=>y.type);
  assert.equal(x.review,'review',mark+': la ficha ha cambiado de modalidad');
  assert.equal(x.rows.length,unit<5?0:2,mark+'/'+when+': cuota de adjetivos');
  assert.equal(x.visible.length,x.rows.length,mark+'/'+when+': filas visibles');
  if(unit>=5){
   assert.deepEqual([...classes].sort(),['2-1-2','2-2'],mark+'/'+when+': faltan ambas clases '+JSON.stringify(x));
   assert(x.rows.every(y=>y.category==='adjectives'&&y.unit<=unit),
    mark+'/'+when+': categoría o programa incorrectos');
  }
 };
 check(await snapshot(page,model),'inicial');
 if(unit<5)return;
 for(let i=0;i<4;i++){
  await regenerate(page,model);
  check(await snapshot(page,model),'regeneración '+i);
 }
 // Una sola forma solicitada: alternar el modelo en cada regeneración.
 await configure(page,model,lang,unit,1);
 let prior=await snapshot(page,model);
 assert.equal(prior.rows.length,1,mark+': falta un adjetivo al solicitar uno');
 for(let i=0;i<4;i++){
  await regenerate(page,model);
  const next=await snapshot(page,model);
  assert.equal(next.rows.length,1,mark+': cuota individual perdida');
  assert.notEqual(next.rows[0].type,prior.rows[0].type,
   mark+': no alterna el modelo en regeneración '+i);
  assert.notEqual(next.rows[0].id,prior.rows[0].id,
   mark+': repite la misma ficha en regeneración '+i);
  prior=next;
 }
 // Botón individual: conservar la categoría y cambiar de subtipo cuando
 // no hay otro adjetivo en la pregunta.
 await page.evaluate(()=>regenerateExamWord('forms',0));
 const single=await snapshot(page,model);
 assert.equal(single.rows.length,1,mark+': regenerar una palabra alteró la cantidad');
 assert.notEqual(single.rows[0].type,prior.rows[0].type,
  mark+': el cambio individual no ofreció el otro tipo');
 assert.notEqual(single.rows[0].id,prior.rows[0].id,
  mark+': el cambio individual repitió la ficha');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   for(const lang of ['es','va'])for(const model of ['morphology','complete']){
    const page=await browser.newPage({viewport:{width:1380,height:920}});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href,{waitUntil:'load'});
    for(const unit of [4,5,8])await verify(page,model,lang,unit);
    assert.deepEqual(errors,[],file+'/'+model+'/'+lang+': error de JavaScript');
    await page.close();
   }
  }
  console.log('GRIEGO UD5 OK: adjetivos –ος, –ον y –ος, –η/α, –ον; cuotas, regeneraciones y UD4/5/8, ES/VA, web/offline.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
