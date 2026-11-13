'use strict';
// Fase III: una subpregunta léxica no puede borrar las ediciones del resto.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((request,response)=>{
 const relative=decodeURIComponent((request.url||'/').split('?')[0]).replace(/^\\/+/, '')||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(file,(error,bytes)=>{
  if(error){response.writeHead(404).end();return}
  response.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript');
  response.end(bytes);
 });
});
async function run(browser,filename){
 const context=await browser.newContext({viewport:{width:1450,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
 await page.waitForFunction(()=>window.ExaminaTeacherLexBankReady===true,null,{timeout:20000});
 await page.evaluate(()=>{
  const c=$('course');c.value='latin1';c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=$('model');m.value='tablas';m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(el=>{
   el.checked=units[Number(el.value)]==='UD9–10';
  });
  examSelectionCache.clear();
  generate();
 });
 const cases=['phonetics','prefixes','latinisms','preverbs'];
 for(const kind of cases){
  const result=await page.evaluate(kind=>{
   const paper=$('paper'),root=paper.querySelector('.exam-sheet');
   const selector='.lex-subquestion[data-lex-kind="'+kind+'"]';
   const oldPart=root?.querySelector(selector);
   if(!oldPart)return {missing:true,kind,parts:[...root.querySelectorAll('.lex-subquestion')].map(x=>x.dataset.lexKind)};
   const otherPart=root.querySelector('.lex-subquestion:not([data-lex-kind="'+kind+'"])');
   const header=root.querySelector('.exam-header');
   const sentence=root.querySelector('[data-sentence-slot="0"]');
   const key=root.querySelector('#answerkey');
   const cacheKey=examCacheSignature('lex-'+kind);
   const previous=examSelectionCache.get(cacheKey);
   const otherCaches=[...examSelectionCache].filter(([k])=>k!==cacheKey)
    .map(([k,v])=>[k,JSON.stringify(v)]);
   if(header&&!header.textContent.includes('MARCA-FASE-III'))header.append(' MARCA-FASE-III');
   if(sentence)sentence.textContent='Oratio magistri manet.';
   if(key&&!key.textContent.includes('SOLUCION-DOCENTE'))key.append(' SOLUCION-DOCENTE');
   const ok=regenerateLatinLexPart(kind);
   const after=paper.querySelector('.exam-sheet');
   const current=examSelectionCache.get(cacheKey);
   return {
    kind,ok,sameRoot:root===after,
    newPart:after?.querySelector(selector)!==oldPart,
    oldPartRemoved:!after?.contains(oldPart),
    sameOther:otherPart===after?.querySelector('.lex-subquestion:not([data-lex-kind="'+kind+'"])'),
    sameHeader:header===after?.querySelector('.exam-header'),
    sameSentence:sentence===after?.querySelector('[data-sentence-slot="0"]'),
    sameSolutions:key===after?.querySelector('#answerkey'),
    teacherHeading:after?.textContent.includes('MARCA-FASE-III'),
    teacherSentence:after?.textContent.includes('Oratio magistri manet.'),
    teacherAnswer:after?.textContent.includes('SOLUCION-DOCENTE'),
    sameOtherCaches:otherCaches.every(([k,v])=>JSON.stringify(examSelectionCache.get(k))===v),
    countBefore:previous?.length,countAfter:current?.length
   };
  },kind);
  assert(!result.missing,filename+': apartado no disponible: '+JSON.stringify(result));
  for(const k of ['ok','sameRoot','newPart','oldPartRemoved','sameOther','sameHeader',
   'sameSentence','sameSolutions','teacherHeading','teacherSentence','teacherAnswer','sameOtherCaches']){
   assert.equal(result[k],true,filename+'/'+kind+': '+k+' '+JSON.stringify(result));
  }
  assert.equal(result.countBefore,result.countAfter,filename+'/'+kind+': tamaño del apartado');
 }
 // La acción general de léxico debe seguir respetando el resto del examen.
 const all=await page.evaluate(()=>{
  const paper=$('paper'),root=paper.querySelector('.exam-sheet');
  const header=root.querySelector('.exam-header'),key=root.querySelector('#answerkey');
  const sentence=root.querySelector('[data-sentence-slot="0"]');
  regenerateExamQuestion('lex');
  const after=paper.querySelector('.exam-sheet');
  return {sameRoot:after===root,sameHeader:after.querySelector('.exam-header')===header,
   sameKey:after.querySelector('#answerkey')===key,
   sameSentence:after.querySelector('[data-sentence-slot="0"]')===sentence};
 });
 assert.deepEqual(all,{sameRoot:true,sameHeader:true,sameKey:true,sameSentence:true},
  filename+': regeneración de léxico completo altera otros bloques');
 // Un repertorio insuficiente debe dejar el borrador y la caché inalterados.
 const empty=await page.evaluate(()=>{
  const root=$('paper').querySelector('.exam-sheet');
  const snapshot=root.innerHTML,cacheKey=examCacheSignature('lex-latinisms');
  const original=latinLexBanks.latin1.latinisms;
  const before=JSON.stringify(examSelectionCache.get(cacheKey));
  latinLexBanks.latin1.latinisms=[];
  const ok=regenerateLatinLexPart('latinisms');
  latinLexBanks.latin1.latinisms=original;
  return {ok,sameRoot:root===$('paper').querySelector('.exam-sheet'),
   sameContent:snapshot===root.innerHTML,
   sameCache:before===JSON.stringify(examSelectionCache.get(cacheKey))};
 });
 assert.equal(empty.ok,false);
 assert(empty.sameRoot&&empty.sameContent&&empty.sameCache,filename+': el banco insuficiente destruyó el examen');
 assert.deepEqual(errors,[],filename+': errores JS inesperados');
 await context.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  await run(browser,'index.html');
  await run(browser,'offline.html');
  console.log('FASE III OK: regeneración léxica aislada, ediciones docentes, solucionario y banco insuficiente, web/offline.');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
