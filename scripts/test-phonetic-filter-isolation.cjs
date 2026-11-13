'use strict';
// Fase III: modificar normas no puede reconstruir el examen ni admitir étimos fuera de currículo.
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
async function run(browser,filename){
 const context=await browser.newContext({viewport:{width:1450,height:920}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
 await page.waitForFunction(()=>window.ExaminaTeacherLexBankReady===true,null,{timeout:20000});
 await page.evaluate(()=>{
  const c=$('course');c.value='latin1';c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=$('model');m.value='tablas';m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=units[Number(x.value)]==='UD9–10');
  examSelectionCache.clear();generate();
 });
 const r=await page.evaluate(()=>{
  const paper=$('paper'),root=paper.querySelector('.exam-sheet');
  const part=root.querySelector('.lex-subquestion[data-lex-kind="phonetics"]');
  const other=root.querySelector('.lex-subquestion:not([data-lex-kind="phonetics"])');
  const header=root.querySelector('.exam-header');
  const sentence=root.querySelector('[data-sentence-slot="0"]');
  const key=root.querySelector('#answerkey');
  if(!part||!other||!header||!key)throw Error('No se encuentra el examen latino con apartado fonético');
  const controls=[...document.querySelectorAll('[data-lat1-phonetic-norms] input[data-phonetic-code]')]
   .filter(x=>!x.disabled&&x.checked);
  const eligible=controls.find(input=>{
   selectedPhoneticRules.delete(input.value);
   const count=new Set(latinLexPool('latin1','phonetics',selectedUnits()).map(latinLexTermKey)).size;
   selectedPhoneticRules.add(input.value);
   return count>=4;
  });
  if(!eligible)throw Error('No hay una norma que pueda desactivarse conservando cuatro fichas');
  const code=eligible.value,oldKey=examCacheSignature('lex-phonetics');
  const otherCaches=[...examSelectionCache].filter(([k])=>k!==oldKey)
   .map(([k,v])=>[k,JSON.stringify(v)]);
  header.append(' CAMBIO-DOCENTE-CABECERA');
  other.append(' CAMBIO-DOCENTE-LEXICO');
  key.append(' CAMBIO-DOCENTE-CLAVE');
  if(sentence)sentence.textContent='Sententia magistri.';
  eligible.checked=false;eligible.dispatchEvent(new Event('change',{bubbles:true}));
  const current=paper.querySelector('.exam-sheet');
  const now=current.querySelector('.lex-subquestion[data-lex-kind="phonetics"]');
  const newRows=examSelectionCache.get(examCacheSignature('lex-phonetics'));
  const stable={
   root:current===root,newPart:now!==part,other:other===current.querySelector('.lex-subquestion:not([data-lex-kind="phonetics"])'),
   header:header===current.querySelector('.exam-header'),key:key===current.querySelector('#answerkey'),
   sentence:!sentence||sentence===current.querySelector('[data-sentence-slot="0"]'),
   headerText:current.textContent.includes('CAMBIO-DOCENTE-CABECERA'),
   otherText:current.textContent.includes('CAMBIO-DOCENTE-LEXICO'),
   keyText:current.textContent.includes('CAMBIO-DOCENTE-CLAVE'),
   sentenceText:!sentence||current.textContent.includes('Sententia magistri.'),
   othersCache:otherCaches.every(([k,v])=>JSON.stringify(examSelectionCache.get(k))===v),
   count:newRows?.length,
   allowed:newRows?.every(x=>x.normas.every(n=>selectedPhoneticRules.has(n)&&latin1PhoneticAllowed(selectedUnits()).has(n))),
   persist:JSON.parse(localStorage.getItem(PHONETIC_RULES_STORAGE)||'[]').includes(code)===false
  };
  // Un banco insuficiente no debe anular la edición ni aceptar el nuevo filtro.
  const data=latinLexBanks.latin1.phonetics,snapshot=paper.innerHTML,oldCode=selectedPhoneticRules.has(code);
  latinLexBanks.latin1.phonetics=[];
  const currentCheckbox=document.querySelector('[data-lat1-phonetic-norms] input[data-phonetic-code="'+code+'"]');
  currentCheckbox.checked=true;currentCheckbox.dispatchEvent(new Event('change',{bubbles:true}));
  const shortfall={
   sameContent:paper.innerHTML===snapshot,
   restored:currentCheckbox.checked===oldCode,
   sameRules:selectedPhoneticRules.has(code)===oldCode,
   warning:($('lex-status-phonetics')?.textContent||'').includes('Filtro no aplicado')
  };
  latinLexBanks.latin1.phonetics=data;
  return {code,stable,shortfall};
 });
 for(const [k,v] of Object.entries(r.stable)){
  assert(k==='count'?v===4:v===true,filename+'/'+r.code+' '+k+': '+JSON.stringify(r));
 }
 for(const [k,v] of Object.entries(r.shortfall))assert.equal(v,true,filename+' filtro imposible '+k);
 await page.reload({waitUntil:'load'});
 const restored=await page.evaluate(code=>({
  selected:selectedPhoneticRules.has(code),
  storage:JSON.parse(localStorage.getItem(PHONETIC_RULES_STORAGE)||'[]').includes(code)
 }),r.code);
 assert.deepEqual(restored,{selected:false,storage:false},filename+': la norma elegida no persistió');
 assert.deepEqual(errors,[],filename+': error Javascript');
 await context.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  await run(browser,'index.html');
  await run(browser,'offline.html');
  console.log('FASE III FONÉTICA: filtro curricular aislado, persistente y reversible, sin destruir el examen (web/offline).');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
