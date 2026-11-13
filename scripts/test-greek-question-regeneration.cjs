'use strict';
// Fase III: regenerar un apartado griego sin perder correcciones ni respuestas ajenas.
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent((req.url||'/').split('?')[0]).replace(/^\/+/, '')||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,bytes)=>{
  if(err){res.writeHead(404).end();return}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript');
  res.end(bytes);
 });
});
async function select(page,model,unit){
 await page.evaluate(({model,unit})=>{
  const course=$('course');course.value='greek1';course.dispatchEvent(new Event('change',{bubbles:true}));
  const m=$('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=units[Number(x.value)]===unit);
  if(model==='complete')examQuestionChoiceState['greek1/complete/pronouns']=true;
  greekExamState=null;
  generate();
 },{model,unit});
}
async function testKind(page,kind){
 const r=await page.evaluate(kind=>{
  const root=$('paper').querySelector('.exam-sheet');
  const heading=root?.querySelector('.exam-question[data-greek-kind="'+kind+'"]');
  const key=root?.querySelector('#answerkey');
  const answer=key?.querySelector('h3[data-greek-kind="'+kind+'"]');
  const ids=greekExamState?.ids[kind]||[],pool=greekChoicePool(kind);
  if(!heading||!answer||!ids.length)return {skip:true,kind,ids:ids.length,headings:[...root.querySelectorAll('[data-greek-kind]')].map(x=>x.dataset.greekKind)};
  if(pool.filter(x=>!ids.includes(x.id)).length<ids.length)return {insufficient:true,kind};
  const other=root.querySelector('.exam-question[data-greek-kind]:not([data-greek-kind="'+kind+'"])');
  const otherAnswer=key.querySelector('h3[data-greek-kind]:not([data-greek-kind="'+kind+'"])');
  const header=root.querySelector('.exam-header');
  const sentence=root.querySelector('[data-sentence-slot="0"]');
  const glossary=root.querySelector('.exam-glossary,.sentence-glossary,.exam-vocabulary');
  header?.append(' MARCA-DOCENTE-CABECERA');
  other?.append(' MARCA-DOCENTE-PREGUNTA');
  otherAnswer?.append(' MARCA-DOCENTE-CLAVE');
  if(sentence)sentence.textContent='Oratio magistri in textu.';
  const untouchedIds=Object.fromEntries(Object.entries(greekExamState.ids).filter(([k])=>k!==kind).map(([k,v])=>[k,JSON.stringify(v)]));
  const result=greekRegenerate(kind);
  const after=$('paper').querySelector('.exam-sheet'),newIds=greekExamState.ids[kind];
  return {
   result,kind,sameRoot:after===root,
   newHeading:after.querySelector('.exam-question[data-greek-kind="'+kind+'"]')!==heading,
   newAnswer:after.querySelector('#answerkey h3[data-greek-kind="'+kind+'"]')!==answer,
   changedIds:JSON.stringify(ids)!==JSON.stringify(newIds),
   sameOther:!other||other===after.querySelector('.exam-question[data-greek-kind="'+other.dataset.greekKind+'"]'),
   sameOtherAnswer:!otherAnswer||after.querySelector('#answerkey').contains(otherAnswer),
   sameHeader:!header||header===after.querySelector('.exam-header'),
   sameKey:key===after.querySelector('#answerkey'),
   sameSentence:!sentence||sentence===after.querySelector('[data-sentence-slot="0"]'),
   sameGlossary:!glossary||after.contains(glossary),
   markerHeader:!header||after.textContent.includes('MARCA-DOCENTE-CABECERA'),
   markerOther:!other||after.textContent.includes('MARCA-DOCENTE-PREGUNTA'),
   markerAnswer:!otherAnswer||after.textContent.includes('MARCA-DOCENTE-CLAVE'),
   markerSentence:!sentence||after.textContent.includes('Oratio magistri in textu.'),
   sameIds:Object.entries(untouchedIds).every(([k,v])=>JSON.stringify(greekExamState.ids[k])===v),
   count:ids.length,nextCount:newIds.length
  };
 },kind);
 if(r.skip||r.insufficient)return false;
 for(const key of ['result','sameRoot','newHeading','newAnswer','changedIds','sameOther','sameOtherAnswer','sameHeader','sameKey','sameSentence','sameGlossary','markerHeader','markerOther','markerAnswer','markerSentence','sameIds']){
  assert.equal(r[key],true,kind+'/'+key+': '+JSON.stringify(r));
 }
 assert.equal(r.nextCount,r.count,kind+': cambió el número de fichas');
 return true;
}
async function run(browser,file){
 const context=await browser.newContext({viewport:{width:1450,height:920}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+file,{waitUntil:'load'});
 await page.waitForFunction(()=>!!document.querySelector('#course')&&!!document.querySelector('#paper'));
 let successes=0;const covered=[];
 for(const [model,kinds] of [['complete',['declension','conjugation','forms','pronouns','etymology']],['translation',['forms','etymology']]]){
  for(const kind of kinds){
   await select(page,model,'UD12');
   if(await testKind(page,kind)){successes++;covered.push(model+'/'+kind)}
  }
 }
 assert(successes>=3,file+': pocas preguntas griegas regeneradas: '+JSON.stringify(covered));
 assert(covered.some(x=>x.endsWith('/etymology')),file+': no se comprobó la etimología');
 const empty=await page.evaluate(()=>{
  const original=$('paper').innerHTML,before=[...(greekExamState.ids.forms||[])];
  const all=greekChoicePool('forms').map(x=>x.id);
  greekExamState.ids.forms=all;
  const result=greekRegenerate('forms');
  const same=original===$('paper').innerHTML&&JSON.stringify(greekExamState.ids.forms)===JSON.stringify(all);
  greekExamState.ids.forms=before;
  return {result,same};
 });
 assert.equal(empty.result,false,file+': se generó con banco agotado');
 assert(empty.same,file+': el banco agotado borró ediciones');
 assert.deepEqual(errors,[],file+': errores inesperados en el navegador');
 await context.close();
 return covered;
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const online=await run(browser,'index.html');
  const offline=await run(browser,'offline.html');
  console.log('FASE III GRIEGO: preguntas regeneradas sin pérdidas, web/offline:',online.join(', '),'/',offline.join(', '));
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
