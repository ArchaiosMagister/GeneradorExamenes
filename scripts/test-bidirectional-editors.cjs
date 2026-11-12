'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');

function zipEntry(buffer,wanted){
 let pos=0;
 while(pos+30<=buffer.length&&buffer.readUInt32LE(pos)===0x04034b50){
  const method=buffer.readUInt16LE(pos+8),size=buffer.readUInt32LE(pos+18);
  const nameLength=buffer.readUInt16LE(pos+26),extraLength=buffer.readUInt16LE(pos+28);
  const name=buffer.toString('utf8',pos+30,pos+30+nameLength);
  const begin=pos+30+nameLength+extraLength;
  if(name===wanted){assert.equal(method,0);return buffer.toString('utf8',begin,begin+size)}
  pos=begin+size;
 }
 throw new Error('Falta '+wanted);
}
const server=http.createServer((request,response)=>{
 const raw=decodeURIComponent((request.url||'/').split('?')[0]).replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,raw);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(file,(error,bytes)=>{
  if(error){response.writeHead(404).end();return}
  const type=file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':
   file.endsWith('.json')?'application/json':'application/octet-stream';
  response.setHeader('Content-Type',type+'; charset=utf-8');response.end(bytes);
 });
});
async function configure(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=document.getElementById('course');c.value=course;
  c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=document.getElementById('model');m.value=model;
  m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(el=>
   {el.checked=units[Number(el.value)]===unit});
  examSelectionCache.clear();
  if(course==='greek1')greekExamState=null;
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>!!document.querySelector('#paper .exam-sheet'));
}
async function bidirectionalGeneric(page,course,model,kind){
 const panel=page.locator('#examQuestionMenus [data-question="'+kind+'"]');
 await panel.evaluate(el=>el.open=true);
 const input=panel.locator('.question-editor input[data-exam-editor-link]').first();
 const count=await input.count();
 if(!count)return false;
 const id=await input.getAttribute('data-exam-editor-link');
 const target=page.locator('#paper [data-exam-editor-link="'+id+'"]');
 assert.equal(await target.count(),1,'Editor sin nodo vinculado: '+course+'/'+model+'/'+kind);
 const initial=await page.evaluate(()=>{
  const nodes=[...document.querySelectorAll('#paper [data-exam-editor-link]')];
  return {root:document.querySelector('#paper .exam-sheet'),
   other:nodes.map(node=>[node.dataset.examEditorLink,node.textContent]),
   cache:[...examSelectionCache].map(([key,value])=>[key,value])};
 });
 const value=(course==='greek1'?'δοκιμή':'probāre')+'_'+kind+'_'+model;
 await input.fill(value);
 assert((await target.textContent()).includes(value),
  course+'/'+model+'/'+kind+': menú no actualiza vista previa');
 const afterMenu=await page.evaluate(()=>{
  const nodes=[...document.querySelectorAll('#paper [data-exam-editor-link]')];
  return {other:nodes.map(node=>[node.dataset.examEditorLink,node.textContent]),
   cache:[...examSelectionCache].map(([key,value])=>[key,value]),
   root:document.querySelector('#paper .exam-sheet')};
 });
 const unchanged=initial.other.filter(([otherId])=>otherId!==id);
 assert.deepEqual(afterMenu.other.filter(([otherId])=>otherId!==id),unchanged,
  course+'/'+model+'/'+kind+': editar ha modificado otros campos');
 assert.deepEqual(afterMenu.cache,initial.cache,course+'/'+model+'/'+kind+': el editor ha regenerado la selección');
 assert.strictEqual(afterMenu.root,initial.root,course+'/'+model+'/'+kind+': se reconstruyó toda la vista previa');

 const otherValue=(course==='greek1'?'ἄλλος':'alter')+'_'+kind+'_'+model;
 const reverse=await page.evaluate(({id,kind,value})=>{
  const target=document.querySelector('#paper [data-exam-editor-link="'+id+'"]');
  let text=value;
  if(kind==='etymology')text='a. '+value+':';
  else if(target.textContent.trim().endsWith(':'))text=value+':';
  target.textContent=text;
  target.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));
  return {preview:target.textContent,linkedInput:document.querySelector('input[data-exam-editor-link="'+id+'"]')?.value};
 },{id,kind,value:otherValue});
 assert.equal(reverse.linkedInput,otherValue,
  course+'/'+model+'/'+kind+': la vista previa no actualiza el campo del menú');
 assert.equal(await input.inputValue(),otherValue);
 return {kind,menuValue:value,previewValue:otherValue,id};
}
async function checkLex(page,course='latin1'){
 const kinds=course==='latin1'?['preverbs','phonetics','prefixes','latinisms']:['phonetics','prefixes'];
 const panel=page.locator('#examQuestionMenus [data-question="lex"]');
 await panel.evaluate(el=>el.open=true);
 const checked=[];
 for(const kind of kinds){
  const input=page.locator('#'+(kind==='preverbs'?'lex-verb-0':'lex-edit-'+kind+'-0'));
  if(!(await input.count()))continue;
  const preview=page.locator('#paper [data-lex-slot="'+kind+':0"] i');
  if(!(await preview.count()))continue;
  const before=await page.evaluate(()=>Object.fromEntries([...examSelectionCache].filter(([key])=>key.includes('lex-'))));
  const manual='edicion_'+kind;
  await input.fill(manual);
  assert.equal(await preview.textContent(),manual,kind+': entrada de menú no cambia vista');
  const reverse='desde_vista_'+kind;
  await preview.fill(reverse);
  assert.equal(await input.inputValue(),reverse,kind+': vista no actualiza el campo');
  const after=await page.evaluate(()=>Object.fromEntries([...examSelectionCache].filter(([key])=>key.includes('lex-'))));
  assert.deepEqual(Object.keys(after).sort(),Object.keys(before).sort(),kind+': edición cambió firmas de filtros');
  for(const key of Object.keys(before)){
   const old=before[key],latest=after[key];
   assert(Array.isArray(latest));
   if(!key.includes('lex-'+kind))assert.deepEqual(latest,old,kind+': editó otra subpregunta');
  }
  checked.push(kind);
 }
 return checked;
}
async function checkFile(browser,filename){
 const context=await browser.newContext({viewport:{width:1400,height:960},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
 await page.waitForFunction(()=>document.getElementById('course')&&document.getElementById('examQuestionMenus'));
 const cases=[
  ['latin1','tablas','UD7',['decl','verb','forms','pronouns']],
  ['latin1','morf','UD7',['decl','verb','forms','pronouns']],
  ['latin1','mixto','UD7',['forms']],
  ['latin4','tablas','UD7',['decl','verb','forms']],
  ['greek1','complete','UD7',['decl','verb','forms','etymology']],
  ['greek1','morphology','UD7',['decl','verb','forms','pronouns']],
  ['greek1','translation','UD7',['forms','etymology']]
 ];
 let checked=0;
 for(const [course,model,unit,kinds] of cases){
  await configure(page,course,model,unit);
  for(const kind of kinds){
   const result=await bidirectionalGeneric(page,course,model,kind);
   if(result)checked++;
  }
 }
 assert(checked>=18,filename+': cobertura insuficiente de editores: '+checked);
 // Latín I: vocabulario léxico y sus cuatro campos bidireccionales.
 await configure(page,'latin1','tablas','UD9–10');
 const checkedLex=await checkLex(page);
 assert.deepEqual(checkedLex,['preverbs','phonetics','prefixes','latinisms'],
  filename+': faltan campos editables de léxico');
 // Recuperar un ejercicio para comprobar los sintagmas editables por líneas.
 await configure(page,'latin1','morf','UD7');
 const morph=await page.evaluate(()=>{
  const slots=[...document.querySelectorAll('#paper [data-syntagm-slot]>i')];
  return {count:slots.length,terms:slots.map(x=>x.textContent)};
 });
 assert(morph.count>=2,filename+': no hay sintagmas para sincronizar');
 const syllabi=['bonus, –a, –um + puer, –i','magnus, –a, –um + oppidum, –i'];
 const textarea=page.locator('#morphSyntagms');
 await textarea.fill(syllabi.join('\n'));
 const typed=await page.evaluate(()=>[...document.querySelectorAll('#paper [data-syntagm-slot]>i')].map(x=>x.textContent));
 assert.deepEqual(typed.slice(0,2),syllabi,filename+': textarea no actualiza sintagmas');
 assert.deepEqual(typed.slice(2),morph.terms.slice(2),filename+': textarea alteró otros sintagmas');
 const linked=page.locator('#paper [data-syntagm-slot="0"]>i');
 await linked.fill('pulcher, –chra, –chrum + puella, –æ');
 assert((await textarea.inputValue()).startsWith('pulcher, –chra, –chrum + puella, –æ'),
  filename+': editar sintagma en vista previa no actualiza el textarea');
 const linkedId=await linked.getAttribute('data-exam-editor-link');
 assert.equal(await page.locator('input[data-exam-editor-link="'+linkedId+'"]').inputValue(),
  'pulcher, –chra, –chrum + puella, –æ',filename+': editor individual de sintagma desincronizado');

 // Las oraciones deben conservar su sincronización previa en ambas direcciones.
 await configure(page,'latin1','mixto','UD6');
 await page.locator('#newSentences').fill('Puella in villa laborat.\nNauta navigat.');
 const sentence=page.locator('#paper [data-sentence-slot="0"]');
 assert.equal(await sentence.textContent(),'Puella in villa laborat.');
 await sentence.fill('Puer amat.');
 assert((await page.locator('#newSentences').inputValue()).startsWith('Puer amat.'),
  filename+': oraciones no sincronizadas');
 // Word debe reflejar lo que está en la vista después de la edición.
 const pending=page.waitForEvent('download');
 await page.evaluate(()=>exportWord(false));
 const downloaded=await pending;
 const xml=zipEntry(fs.readFileSync(await downloaded.path()),'word/document.xml');
 assert(xml.includes('Puer amat.'),filename+': Word no recoge la edición de vista previa');
 assert.deepEqual(errors,[],filename+': errores JavaScript de navegador');
 await context.close();
 return checked;
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const online=await checkFile(browser,'index.html');
  const offline=await checkFile(browser,'offline.html');
  console.log('SINCRONIZACIÓN BIDIRECCIONAL OK: '+online+' y '+offline+
   ' editores morfológicos, léxico, sintagmas, oraciones y Word.');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
