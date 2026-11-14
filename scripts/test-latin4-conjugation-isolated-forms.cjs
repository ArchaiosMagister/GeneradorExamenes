'use strict';
// Respetar la progresión de Latín 4.º y evitar que cambiar el número de
// formas reconstruya otras preguntas o borre ediciones docentes.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

async function select(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=document.getElementById('course');
  c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=document.getElementById('model');
  m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  for(const input of document.querySelectorAll('#unitChoices .unit-choice'))
   input.checked=units[Number(input.value)]===unit;
  document.querySelector('#unitChoices .unit-choice:checked')?.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  if(course==='greek1')greekExamState=null;
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>document.querySelector('#paper .exam-sheet'));
}
async function checkLatin4(page,file){
 await select(page,'latin4','tablas','UD4');
 const audit=await page.evaluate(()=>{
  const fixtures=[
   ['sum',['sum','es','est','sumus','estis','sunt'],true],
   ['amo',['amo','amas','amat','amamus','amatis','amant'],true],
   ['moneo',['moneo','mones','monet','monemus','monetis','monent'],true],
   ['rego',['rego','regis','regit','regimus','regitis','regunt'],true],
   ['audio',['audio','audis','audit','audimus','auditis','audiunt'],true],
   ['capio',['capio','capis','capit','capimus','capitis','capiunt'],true],
   ['eo',['eo','is','it','imus','itis','eunt'],false],
   ['possum',['possum','potes','potest','possumus','potestis','possunt'],false],
   ['fero',['fero','fers','fert','ferimus','fertis','ferunt'],false],
   ['volo',['volo','vis','vult','volumus','vultis','volunt'],false],
   ['do',['do','das','dat','damus','datis','dant'],false],
   ['sto',['sto','stas','stat','stamus','statis','stant'],false]
  ];
  const tests=fixtures.map(([entry,forms,expected])=>({
   entry,expected,actual:latin4ConjugationAllowed({x:{entry},p:{forms}})
  }));
  const pool=latin4ConjugationPool(selectedUnits());
  const selected=examSelectionCache.get(examCacheSignature('verb'))||[];
  return {tests,pool:pool.map(x=>x.x.entry),selected:selected.map(x=>x.x.entry),
   rejected:pool.filter(x=>!latin4ConjugationAllowed(x)).map(x=>x.x.entry)};
 });
 assert(audit.tests.every(x=>x.expected===x.actual),file+': irregular admitido o regular omitido '+JSON.stringify(audit.tests));
 assert.equal(audit.rejected.length,0,file+': la lista incluye irregulares');
 assert(audit.selected.every(x=>!/(?:^|,) *(?:eo|fero|possum|volo|nolo|malo|fio)\b/i.test(x)),
  file+': se seleccionó irregular en 4.º: '+JSON.stringify(audit.selected));
 await page.evaluate(()=>{
  const key=examCacheSignature('verb'),old=examSelectionCache.get(key);
  if(!old?.length)return;
  regenerateExamWord('verb',0);
  const next=examSelectionCache.get(key)||[];
  if(next.some(x=>!latin4ConjugationAllowed(x)))throw Error('Regeneración individual incluyó irregular');
 });
}
async function snapshotOther(page){
 return page.evaluate(()=>{
  const sheet=document.querySelector('#paper .exam-sheet');
  const results=[];
  for(const heading of sheet.querySelectorAll('.exam-question')){
   if(heading.dataset.examKind==='forms'||heading.dataset.morphKind==='forms'||heading.dataset.greekKind==='forms')continue;
   const nodes=[heading];
   for(let node=heading.nextElementSibling;node&&!node.matches('.exam-question,#answerkey,.exam-glossary,.sentence-glossary,.exam-vocabulary');node=node.nextElementSibling)
    nodes.push(node);
   // Los identificadores de enlace pueden renovarse al rehidratar los editores;
   // no forman parte del contenido académico ni de las modificaciones del docente.
   results.push(nodes.map(n=>n.outerHTML).join('').replace(/data-exam-editor-link="[^"]*"/g,'data-exam-editor-link="linked"'));
  }
  return results;
 });
}
async function checkIsolatedResize(page,file,course,model,unit,id){
 await select(page,course,model,unit);
 const edit=await page.evaluate(()=>{
  const node=document.querySelector('#paper .exam-verbs thead tr:first-child th[colspan],#paper .reference-verb-table tbody tr:first-child td:first-child');
  if(node)node.setAttribute('data-keep-edit','redimensionar-no-borra');
  return !!node;
 });
 const previous=await snapshotOther(page);
 const before=await page.locator('#paper [data-analysis-slot],#paper .exam-form').count();
 await page.evaluate(id=>{
  const el=document.getElementById(id);
  el.value=String(Math.min(15,Number(el.value)+2));
  el.dispatchEvent(new Event('change',{bubbles:true}));
 },id);
 await page.waitForFunction(n=>
  document.querySelectorAll('#paper [data-analysis-slot],#paper .exam-form').length!==n,
  before,{timeout:10000});
 const after=await page.locator('#paper [data-analysis-slot],#paper .exam-form').count();
 assert(after>before,file+' '+course+'/'+model+': no aumentaron las formas');
 assert.deepEqual(await snapshotOther(page),previous,
  file+' '+course+'/'+model+': al cambiar las formas se reconstruyeron otras preguntas');
 if(edit)assert.equal(await page.locator('#paper [data-keep-edit]').count(),1,
  file+' '+course+'/'+model+': se perdió una edición previa de otra pregunta');
 if(course==='greek1'&&model==='complete'){
  const state=await page.evaluate(()=>greekExamState?.ids||{});
  assert(state.conjugation?.length>0,file+': estado de conjugación griega perdido');
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage();
   page.on('dialog',dialog=>dialog.accept());
   await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof latin4ConjugationAllowed==='function'&&typeof resizeOnlyExamAnalysis==='function',{timeout:25000});
   await checkLatin4(page,file);
   await checkIsolatedResize(page,file,'latin4','tablas','UD4','count-forms');
   await checkIsolatedResize(page,file,'latin1','tablas','UD4','count-forms');
   await checkIsolatedResize(page,file,'latin1','morf','UD4','morphWords');
   await checkIsolatedResize(page,file,'greek1','complete','UD7','count-greek-forms');
   await checkIsolatedResize(page,file,'greek1','morphology','UD7','morphWords');
   await page.close();
   console.log('Latín 4.º regulares y sum; recuento de formas aislado en '+file);
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
