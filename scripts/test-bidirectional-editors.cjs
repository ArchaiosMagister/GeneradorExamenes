'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

function readZipEntry(bytes,name){
 let at=0;
 while(at+30<=bytes.length&&bytes.readUInt32LE(at)===0x04034b50){
  const size=bytes.readUInt32LE(at+18),namelen=bytes.readUInt16LE(at+26),extra=bytes.readUInt16LE(at+28);
  const key=bytes.toString('utf8',at+30,at+30+namelen),start=at+30+namelen+extra;
  if(key===name)return bytes.toString('utf8',start,start+size);
  at=start+size;
 }
 throw Error('No se encontró '+name+' en Word');
}
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,decodeURIComponent((req.url||'/').split('?')[0]).replace(/^\/+/, '')||'index.html');
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,bytes)=>{
   if(err){res.writeHead(404);res.end();return}
   res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':
    file.endsWith('.js')?'text/javascript; charset=utf-8':
    file.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');
   res.end(bytes);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const context=await browser.newContext({viewport:{width:1340,height:960},acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
   await page.waitForFunction(()=>!!latin1PreverbCurriculum&&!!latin1PhoneticCurriculum,null,{timeout:15000});
   async function configure(course,model,unit){
    await page.evaluate(({course,model,unit})=>{
     const c=document.getElementById('course');c.value=course;
     c.dispatchEvent(new Event('change',{bubbles:true}));
     const m=document.getElementById('model');m.value=model;
     m.dispatchEvent(new Event('change',{bubbles:true}));
     let selected;
     document.querySelectorAll('#unitChoices .unit-choice').forEach(input=>{
      input.checked=units[Number(input.value)]===unit;
      if(input.checked)selected=input;
     });
     if(!selected)throw Error('No existe '+unit+' de '+course+' ('+units.join(',')+')');
     selected.dispatchEvent(new Event('change',{bubbles:true}));
     examSelectionCache.clear();
     if(course==='greek1')greekExamState=null;
     generate();
     document.dispatchEvent(new Event('examina-lex-ready'));
    },{course,model,unit});
    await page.waitForFunction(()=>!!document.querySelector('#paper .exam-sheet'));
   }
   async function reveal(locator){
    await locator.evaluate(el=>{
     for(let node=el;node;node=node.parentElement)
      if(node.tagName==='DETAILS')node.open=true;
    });
   }
   const summary=[];
   let serial=0;
   async function pair(kind,editorSelector,attr){
    const editor=page.locator(editorSelector).first();
    assert(await editor.count()>0,filename+': no aparece el editor '+kind);
    await reveal(editor);
    const id=await editor.getAttribute('data-'+attr);
    assert(id,filename+': falta identidad en el editor '+kind);
    const locator=page.locator('#paper [data-'+attr+'="'+id+'"]').first();
    assert(await locator.count()>0,filename+': el editor '+kind+' no tiene destino en papel');
    const allInputs=page.locator('input[data-'+attr+']');
    const before=await allInputs.evaluateAll(els=>els.map(el=>({id:el.getAttributeNames()
     .filter(x=>x.startsWith('data-')).map(x=>[x,el.getAttribute(x)]),value:el.value})));
    const token='menu'+(++serial)+'forma';
    await editor.fill(token);
    const paperText=await locator.textContent();
    assert(paperText.includes(token),filename+': menú no actualiza papel en '+kind+' / '+id+': '+paperText);
    const afterMenu=await allInputs.evaluateAll(els=>els.map(el=>el.value));
    for(let i=0;i<before.length;i++)if(before[i].id.some(x=>x[1]===id))continue;
     else assert.equal(afterMenu[i],before[i].value,filename+': '+kind+' ha alterado otro campo de menú');
    const previewToken='papel'+(++serial)+'forma';
    await locator.fill(previewToken);
    assert.equal(await editor.inputValue(),previewToken,
     filename+': papel no actualiza menú en '+kind+' / '+id);
    summary.push(kind);
    return {editor,locator,previewToken};
   }

   // Un modelo de cada asignatura, incluidas las variantes de morfología y traducción.
   for(const [course,model,unit,kinds] of [
    ['latin1','tablas','UD4',['decl','verb','forms']],
    ['latin1','morf','UD7',['decl','verb','forms','pronouns']],
    ['latin4','tablas','UD3',['decl','verb','forms']],
    ['greek1','morphology','UD7',['decl','verb','forms','pronouns']],
    ['greek1','translation','UD7',['forms','etymology']]
   ]){
    await configure(course,model,unit);
    for(const kind of kinds){
     const selector='#examQuestionMenus [data-editor-for="'+kind+'"] input[data-exam-editor-id]';
     if(!await page.locator(selector).count()){
      // Algunos apartados dependen de que existan formas acreditadas en la unidad.
      if(['pronouns','etymology'].includes(kind))continue;
      throw Error(filename+': sin editor para '+course+'/'+model+'/'+kind);
     }
     await pair(course+'/'+model+'/'+kind,selector,'exam-editor-id');
    }
   }

   // Griego completo usa un editor por entrada del corpus, no el editor genérico.
   await configure('greek1','complete','UD7');
   let greekCount=0;
   for(const kind of ['decl','verb','forms','pronouns','etymology']){
    const selector='#examQuestionMenus [data-editor-for="'+kind+'"] input[data-greek-editor-id]';
    if(!await page.locator(selector).count()){
     if(['pronouns','etymology'].includes(kind))continue;
     throw Error(filename+': Griego completo sin editor de '+kind);
    }
    await pair('greek1/complete/'+kind,selector,'greek-editor-id');
    greekCount++;
   }
   assert(greekCount>=3,filename+': no se ha comprobado la edición de Griego completo');

   // El léxico latino presenta los cuatro apartados como campos editables.
   await configure('latin1','tablas','UD9–10');
   for(const [kind,inputId] of [
    ['preverbs','lex-verb-0'],
    ['phonetics','lex-edit-phonetics-0'],
    ['prefixes','lex-edit-prefixes-0'],
    ['latinisms','lex-edit-latinisms-0']
   ]){
    const input=page.locator('#'+inputId),slot=page.locator('#paper [data-lex-slot="'+kind+':0"] i');
    assert(await input.count()&&await slot.count(),filename+': falta editor o forma de '+kind);
    await reveal(input);
    const before=await page.evaluate(()=>Object.fromEntries(['preverbs','phonetics','prefixes','latinisms']
     .map(kind=>[kind,(examSelectionCache.get(examCacheSignature('lex-'+kind))||[])
      .map(x=>x.prompt)])));
    const value='lexmenutest'+(++serial);
    await input.fill(value);
    assert.equal(await slot.textContent(),value,filename+': menú de '+kind+' no actualiza papel');
    const after=await page.evaluate(()=>Object.fromEntries(['preverbs','phonetics','prefixes','latinisms']
     .map(kind=>[kind,(examSelectionCache.get(examCacheSignature('lex-'+kind))||[])
      .map(x=>x.prompt)])));
    for(const k of ['preverbs','phonetics','prefixes','latinisms']){
     assert.deepEqual(after[k].slice(k===kind?1:0),before[k].slice(k===kind?1:0),
      filename+': editar '+kind+' modificó otra forma o apartado ('+k+')');
    }
    const paperValue='lexpapeltest'+(++serial);
    // En un <i> editable dentro de un span no editable, Chromium puede anexar
    // el texto al hacer locator.fill. Simular el reemplazo real del nodo y su
    // evento input comprueba la sincronización sin ese efecto de Playwright.
    await slot.click();
    await slot.evaluate((node,text)=>{
     node.textContent=text;
     node.dispatchEvent(new InputEvent('input',{bubbles:true}));
    },paperValue);
    assert.equal(await slot.textContent(),paperValue,filename+': fallo al editar la vista de '+kind);
    assert.equal(await input.inputValue(),paperValue,filename+': papel de '+kind+' no actualiza menú');
    summary.push('lex/'+kind);
   }
   // Las oraciones mantienen su editor multilinea y el vocabulario automático.
   await configure('latin1','mixto','UD4');
   const sentences=page.locator('#newSentences'),first=page.locator('#paper [data-sentence-slot="0"]');
   await reveal(sentences);
   await sentences.fill('Puella ambulat.\nNauta laborat.');
   assert.equal(await first.textContent(),'Puella ambulat.');
   await first.fill('Poeta scribit.');
   assert((await sentences.inputValue()).startsWith('Poeta scribit.'),
    filename+': editar oración en papel no actualiza texto lateral');
   summary.push('oraciones');

   // El textarea de sintagmas y el editor individual trabajan sobre el mismo papel.
   await configure('latin1','morf','UD7');
   const syntagms=page.locator('#morphSyntagms');
   await reveal(syntagms);
   await syntagms.fill('magnus, –a, –um + puer, –i\nbonus, –a, –um + servus, –i');
   const syntagm=page.locator('#paper [data-syntagm-slot="0"] i');
   assert.equal(await syntagm.textContent(),'magnus, –a, –um + puer, –i');
   await syntagm.fill('clarus, –a, –um + agricola, –ae');
   const detail=await page.evaluate(()=>({
    textarea:document.getElementById('morphSyntagms').value,
    target:document.querySelector('#paper [data-syntagm-slot="0"] i')?.outerHTML,
    editor:document.querySelector('#examQuestionMenus input[data-exam-editor-id="0"]')?.value
   }));
   assert(detail.textarea.startsWith('clarus, –a, –um + agricola, –ae'),
    filename+': modificar sintagma en papel no actualiza textarea: '+JSON.stringify(detail));
   const syntagmId=await syntagm.getAttribute('data-exam-editor-id');
   const individual=page.locator('#examQuestionMenus input[data-exam-editor-id="'+syntagmId+'"]');
   assert.equal(await individual.inputValue(),'clarus, –a, –um + agricola, –ae');
   summary.push('sintagmas');

   // El Word debe incorporar exactamente la última modificación de la vista previa.
   const downloadPromise=page.waitForEvent('download');
   await page.evaluate(()=>exportWord(false));
   const download=await downloadPromise;
   const xml=readZipEntry(fs.readFileSync(await download.path()),'word/document.xml');
   assert(xml.includes('clarus,')&&xml.includes('agricola'),
    filename+': el Word no incorpora la edición del sintagma');
   assert.deepEqual(errors,[],filename+': errores JS en navegador');
   await context.close();
   console.log(filename+': '+summary.length+' verificaciones de edición menú ↔ papel; Word y oraciones OK.');
  }
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});