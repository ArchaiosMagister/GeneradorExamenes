'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');

const server=http.createServer((request,response)=>{
 const relative=decodeURIComponent((request.url||'/').split('?')[0]).replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(file,(error,bytes)=>{
  if(error){response.writeHead(404).end();return}
  response.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript');
  response.end(bytes);
 });
});

async function select(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=document.getElementById('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=document.getElementById('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(input=>{
   input.checked=units[Number(input.value)]===unit;
  });
  examSelectionCache.clear();
  if(course==='greek1')greekExamState=null;
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>!!document.querySelector('#paper .exam-sheet'));
}

async function checkSingle(page,course,model,kind,index=0){
 const result=await page.evaluate(({kind,index})=>{
  const paper=document.getElementById('paper'),root=paper.querySelector('.exam-sheet');
  const slot=examRegenerationSlot(root,kind,index);
  if(!slot)return {missing:true};
  const key=kind.startsWith('lex-')?kind:kind;
  const cacheKey=examCacheSignature(key),beforeRows=examSelectionCache.get(cacheKey);
  const greek=course=>course==='greek1';
  const greekWhole=greek(currentCourse())&&$('model').value!=='morphology';
  const kindG={decl:'declension',verb:'conjugation',forms:'forms'}[kind];
  const ids=greekWhole&&kindG&&greekExamState?.ids?.[kindG]?[...greekExamState.ids[kindG]]:null;
  const otherCaches=[...examSelectionCache].filter(([k])=>k!==cacheKey)
    .map(([k,v])=>[k,JSON.stringify(v)]);
  const before=JSON.stringify(beforeRows?.filter((_,i)=>i!==index)||[]);
  // Alteraciones humanas de una palabra distinta, del encabezado y de las
  // oraciones: deben sobrevivir a todas las sustituciones individuales.
  const head=root.querySelector('.exam-header span');
  if(head&&!head.textContent.includes('MARCA-DOCENTE'))head.textContent+=' MARCA-DOCENTE';
  const other=(kind==='forms'&&examRegenerationSlot(root,kind,1))?
   examRegenerationSlot(root,kind,1):examRegenerationSlot(root,'forms',0);
  if(other&&other!==slot){
   const inner=other.querySelector('i,span:last-child,th[colspan]')||other;
   if(!inner.textContent.includes('MARCA-FORMA')) {
    inner.textContent='MARCA-FORMA '+inner.textContent;
    inner.dispatchEvent(new InputEvent('input',{bubbles:true}));
   }
  }
  const untouched=()=>{
   const clone=paper.querySelector('.exam-sheet').cloneNode(true);
   clone.querySelector('#answerkey')?.remove();
   if(kind.startsWith('lex-'))clone.querySelector('.lex-subquestion[data-lex-kind="'+kind.slice(4)+'"]')
    ?.replaceWith(document.createComment('apartado-léxico-ordenado'));
   else examRegenerationSlot(clone,kind,index)?.replaceWith(document.createComment('solo-esta-palabra'));
   // Los identificadores de enlace de los editores se crean al redibujar.
   clone.querySelectorAll('[data-exam-editor-link]').forEach(el=>el.removeAttribute('data-exam-editor-link'));
   return clone.innerHTML;
  };
  const lexPart=kind.startsWith('lex-')?kind.slice(4):null;
  const lexSelector=lexPart?'.lex-subquestion[data-lex-kind="'+lexPart+'"] [data-lex-slot]':null;
  const lexOthers=lexSelector?[...root.querySelectorAll(lexSelector)].filter(node=>node.dataset.lexSlot!==lexPart+':'+index)
   .map(node=>[node.dataset.lexSlot,node.textContent]):null;
  const originalHTML=untouched(),originalNode=root;
  const former=slot.textContent,formerValue=ids?ids[index]:beforeRows?.[index];
  if(kind.startsWith('lex-'))regenerateLatinLexWord(kind.slice(4),index);
  else regenerateExamWord(kind,index);
  const afterRoot=paper.querySelector('.exam-sheet'),afterSlot=examRegenerationSlot(afterRoot,kind,index);
  const afterIds=ids?[...greekExamState.ids[kindG]]:null;
  const newRows=examSelectionCache.get(cacheKey);
  const afterOtherCaches=[...examSelectionCache].filter(([k])=>k!==cacheKey)
   .map(([k,v])=>[k,JSON.stringify(v)]);
  const lexSpans=lexSelector?[...afterRoot.querySelectorAll(lexSelector)]:null;
  const lexOthersStable=!lexOthers||lexOthers.every(([id,value])=>
   lexSpans.find(node=>node.dataset.lexSlot===id)?.textContent===value);
  const lexOrdered=!lexSpans||lexPart==='preverbs'||
   JSON.stringify(lexSpans.map(node=>node.textContent))===JSON.stringify(
    lexSpans.map(node=>node.textContent).sort((a,b)=>a.localeCompare(b,'es')));
  const modified=ids?JSON.stringify(afterIds[index])!==JSON.stringify(formerValue):
    JSON.stringify(newRows?.[index])!==JSON.stringify(formerValue);
  return {kind,model,missing:false,modified,former,newText:afterSlot?.textContent||'',
   preservedDOM:untouched()===originalHTML,sameRoot:afterRoot===originalNode,
   othersCacheUnchanged:JSON.stringify(otherCaches)===JSON.stringify(afterOtherCaches),
   sameRows:ids?ids.filter((_,i)=>i!==index).every((v,i)=>{
    const actualIndex=i>=index?i+1:i;return v===afterIds[actualIndex];
   }):before===JSON.stringify(newRows?.filter((_,i)=>i!==index)||[]),
   marker:afterRoot?.querySelector('.exam-header span')?.textContent.includes('MARCA-DOCENTE'),
   formsMarker:afterRoot?.textContent.includes('MARCA-FORMA'),
   lexOthersStable,lexOrdered,
   editorBroken:!!afterRoot?.querySelector('[data-exam-editor-link]')&&
    !document.querySelector('input[data-exam-editor-link]'),
   beforeCount:beforeRows?.length,afterCount:newRows?.length};
 },{kind,index});
 if(result.missing)return false;
 const label=course+'/'+model+'/'+kind+'/'+index;
 assert(result.modified,label+': no cambió el registro seleccionado: '+JSON.stringify(result));
 assert(result.preservedDOM,label+': la regeneración afectó al resto del examen: '+JSON.stringify(result));
 assert(result.sameRoot,label+': se perdió el documento editado');
 assert(result.sameRows,label+': se modificó otra fila de la misma pregunta');
 assert(result.othersCacheUnchanged,label+': se alteró la caché de otra pregunta');
 assert(result.lexOthersStable,label+': se modificó otra forma léxica');
 assert(result.lexOrdered,label+': se perdió el orden alfabético del léxico');
 assert(result.marker&&result.formsMarker,label+': se perdieron correcciones manuales');
 assert(!result.editorBroken,label+': se rompió la sincronización del editor');
 return true;
}

async function runPage(browser,filename){
 const context=await browser.newContext({viewport:{width:1400,height:920},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
 await page.waitForFunction(()=>!!document.getElementById('course')&&!!document.getElementById('examQuestionMenus'));
 await page.waitForFunction(()=>!!window.ExaminaTeacherLexBankReady,null,{timeout:15000}).catch(()=>{});
 const cases=[
  ['latin1','tablas','UD7',['decl','verb','forms']],
  ['latin1','morf','UD7',['decl','verb','forms']],
  ['latin1','mixto','UD7',['forms']],
  ['latin4','tablas','UD7',['decl','verb','forms']],
  ['greek1','complete','UD7',['decl','verb','forms']],
  ['greek1','morphology','UD7',['decl','verb','forms']],
  ['greek1','translation','UD7',['forms']]
 ];
 let count=0;
 for(const [course,model,unit,kinds] of cases){
  for(const kind of kinds){
   await select(page,course,model,unit);
   if(await checkSingle(page,course,model,kind))count++;
  }
 }
 assert(count>=13,filename+': no se cubrieron suficientes clases de regeneración ('+count+')');
 await select(page,'latin1','tablas','UD9–10');
 for(const kind of ['preverbs','phonetics','prefixes','latinisms']){
  if(await checkSingle(page,'latin1','tablas','lex-'+kind))count++;
 }
 assert(count>=17,filename+': faltan las cuatro clases de léxico ('+count+')');
 assert.deepEqual(errors,[],filename+': errores JavaScript');
 await context.close();
 return count;
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const online=await runPage(browser,'index.html');
  const offline=await runPage(browser,'offline.html');
  console.log('REGENERACIÓN INDIVIDUAL AISLADA OK: '+online+' + '+offline+
   ' casos, cachés y edición manual conservadas.');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
