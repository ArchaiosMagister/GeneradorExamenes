'use strict';
// Fase III: regenerar preguntas completas de morfología, no el documento.
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent((req.url||'/').split('?')[0]).replace(/^\/+/, '')||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(error,bytes)=>{
  if(error){res.writeHead(404).end();return}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript');
  res.end(bytes);
 });
});
async function select(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=$('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=$('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=units[Number(x.value)]===unit);
  $('morphSyntagms').value='';
  examSelectionCache.clear();
  generate();
 },{course,model,unit});
}
async function check(page,kind){
 const r=await page.evaluate(kind=>{
  const paper=$('paper'),root=paper.querySelector('.exam-sheet.reference-morph-exam');
  const heading=root?.querySelector('.exam-question[data-morph-kind="'+kind+'"]');
  const key=root?.querySelector('#answerkey'),solution=key?.querySelector('ol>li[data-morph-kind="'+kind+'"]');
  if(!heading||!solution)return {skip:true,kind};
  const other=root.querySelector('.exam-question[data-morph-kind]:not([data-morph-kind="'+kind+'"])');
  const otherKey=key.querySelector('ol>li[data-morph-kind]:not([data-morph-kind="'+kind+'"])');
  const header=root.querySelector('.exam-header');
  const cacheKey=examCacheSignature(kind),before=examSelectionCache.get(cacheKey);
  const otherCaches=[...examSelectionCache].filter(([k])=>k!==cacheKey)
   .map(([k,v])=>[k,JSON.stringify(v)]);
  const beforeLabels=[...root.querySelectorAll('[data-syntagm-slot]>i')].map(x=>x.textContent.trim());
  header?.append(' DOCENTE-CABECERA-MORF');
  other?.append(' DOCENTE-OTRA-PREGUNTA-MORF');
  otherKey?.append(' DOCENTE-OTRA-CLAVE-MORF');
  regenerateExamQuestion(kind);
  const after=paper.querySelector('.exam-sheet');
  const newHeading=after.querySelector('.exam-question[data-morph-kind="'+kind+'"]');
  const newSolution=after.querySelector('#answerkey ol>li[data-morph-kind="'+kind+'"]');
  const afterLabels=[...after.querySelectorAll('[data-syntagm-slot]>i')].map(x=>x.textContent.trim());
  return {
   kind,root:root===after,
   newHeading:newHeading!==heading,newSolution:newSolution!==solution,
   other:!other||after.contains(other),otherKey:!otherKey||after.querySelector('#answerkey').contains(otherKey),
   header:!header||header===after.querySelector('.exam-header'),
   sameKey:key===after.querySelector('#answerkey'),
   marks:after.textContent.includes('DOCENTE-CABECERA-MORF')&&
    after.textContent.includes('DOCENTE-OTRA-PREGUNTA-MORF')&&
    after.textContent.includes('DOCENTE-OTRA-CLAVE-MORF'),
   otherCaches:otherCaches.every(([k,v])=>JSON.stringify(examSelectionCache.get(k))===v),
   unchangedOtherSyntagms:kind==='decl'||JSON.stringify(afterLabels)===JSON.stringify(beforeLabels),
   declEditor:kind!=='decl'||$('morphSyntagms').value===afterLabels.join('\n'),
   rowsBefore:before?.length,rowsAfter:examSelectionCache.get(cacheKey)?.length
  };
 },kind);
 if(r.skip)return false;
 for(const key of ['root','newHeading','newSolution','other','otherKey','header','sameKey',
  'marks','otherCaches','unchangedOtherSyntagms','declEditor']){
  assert.equal(r[key],true,kind+'/'+key+': '+JSON.stringify(r));
 }
 assert.equal(r.rowsAfter,r.rowsBefore,kind+': cambió la cantidad de formas');
 return true;
}
async function run(browser,file){
 const context=await browser.newContext({viewport:{width:1400,height:920}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+file,{waitUntil:'load'});
 await page.waitForFunction(()=>!!window.ExaminaScoring?.rows&&!!$('course'));
 let checked=0;const coverage=[];
 for(const [course,model,unit] of [['latin1','morf','UD7'],['greek1','morphology','UD7']]){
  for(const kind of ['decl','verb','pronouns','forms']){
   await select(page,course,model,unit);
   if(await check(page,kind)){checked++;coverage.push(course+'/'+kind)}
  }
 }
 assert(checked>=7,file+': faltan apartados morfológicos: '+coverage.join(', '));
 assert.deepEqual(errors,[],file+': errores de navegador');
 await context.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  await run(browser,'index.html');
  await run(browser,'offline.html');
  console.log('FASE III MORFOLOGÍA: tablas, sintagmas, respuestas y ediciones conservadas, latín/griego online/offline OK');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
