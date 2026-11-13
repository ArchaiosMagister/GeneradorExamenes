'use strict';
// Fase III, segundo lote: reemplazar una pregunta latina sin destruir las demás.
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
async function select(page,course,unit){
 await page.evaluate(({course,unit})=>{
  const c=$('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=$('model');m.value='tablas';m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=units[Number(x.value)]===unit);
  examSelectionCache.clear();
  generate();
 },{course,unit});
}
async function verify(page,kind){
 const result=await page.evaluate(kind=>{
  const root=$('paper').querySelector('.exam-sheet');
  const heading=root.querySelector('.exam-question[data-exam-kind="'+kind+'"]');
  if(!heading)return {kind,missing:true,available:[...root.querySelectorAll('.exam-question[data-exam-kind]')].map(x=>x.dataset.examKind)};
  const other=root.querySelector('.exam-question[data-exam-kind]:not([data-exam-kind="'+kind+'"])');
  const header=root.querySelector('.exam-header');
  const key=root.querySelector('#answerkey');
  const previousKey=key?.querySelector('ol > li[data-exam-kind="'+kind+'"]');
  const otherKey=key?.querySelector('ol > li:not([data-exam-kind="'+kind+'"])');
  const sentence=root.querySelector('[data-sentence-slot="0"]');
  if(header)header.append(' DOCENTE-CABECERA');
  if(other)other.append(' DOCENTE-OTRA-PREGUNTA');
  if(otherKey)otherKey.append(' DOCENTE-OTRA-SOLUCION');
  if(sentence)sentence.textContent='Oratio magistri integra.';
  const cacheKey=examCacheSignature(kind),current=examSelectionCache.get(cacheKey);
  const otherCache=[...examSelectionCache].filter(([k])=>k!==cacheKey)
   .map(([k,v])=>[k,JSON.stringify(v)]);
  regenerateExamQuestion(kind);
  const after=$('paper').querySelector('.exam-sheet');
  return {
   kind,missing:false,original:after===root,
   replacedHeading:!!after.querySelector('.exam-question[data-exam-kind="'+kind+'"]')&&
    after.querySelector('.exam-question[data-exam-kind="'+kind+'"]')!==heading,
   sameOther:other===after.querySelector('.exam-question[data-exam-kind="'+other?.dataset.examKind+'"]'),
   sameHeader:header===after.querySelector('.exam-header'),
   sameKey:key===after.querySelector('#answerkey'),
   replacedKey:previousKey!==after.querySelector('#answerkey > ol > li[data-exam-kind="'+kind+'"]'),
   sameOtherKey:!otherKey||key.contains(otherKey),
   sameSentence:!sentence||sentence===after.querySelector('[data-sentence-slot="0"]'),
   headerMarker:!header||after.textContent.includes('DOCENTE-CABECERA'),
   otherMarker:!other||after.textContent.includes('DOCENTE-OTRA-PREGUNTA'),
   keyMarker:!otherKey||after.textContent.includes('DOCENTE-OTRA-SOLUCION'),
   sentenceMarker:!sentence||after.textContent.includes('Oratio magistri integra.'),
   otherCaches:otherCache.every(([k,v])=>JSON.stringify(examSelectionCache.get(k))===v),
   priorRows:current?.length,
   nextRows:examSelectionCache.get(cacheKey)?.length
  };
 },kind);
 assert(!result.missing,'Falta '+kind+': '+JSON.stringify(result));
 for(const key of ['original','replacedHeading','sameOther','sameHeader','sameKey','replacedKey',
  'sameOtherKey','sameSentence','headerMarker','otherMarker','keyMarker','sentenceMarker','otherCaches']){
  assert.equal(result[key],true,kind+'/'+key+': '+JSON.stringify(result));
 }
 assert.equal(result.nextRows,result.priorRows,kind+': cambió el número de formas elegidas');
}
async function run(browser,filename){
 const context=await browser.newContext({viewport:{width:1450,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
 await page.waitForFunction(()=>window.ExaminaTeacherLexBankReady===true,null,{timeout:20000});
 for(const kind of ['decl','verb','forms','pronouns']){
  await select(page,'latin1','UD9–10');
  await verify(page,kind);
 }
 await select(page,'latin4','UD7');
 await verify(page,'culture');
 assert.deepEqual(errors,[],filename+': errores Javascript');
 await context.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  await run(browser,'index.html');
  await run(browser,'offline.html');
  console.log('FASE III: preguntas latinas aisladas, claves y edición manual, web y offline: OK');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
