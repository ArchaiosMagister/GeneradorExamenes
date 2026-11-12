'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

function readStoredZipEntry(bytes,wanted){
 let pos=0;
 while(pos+30<=bytes.length&&bytes.readUInt32LE(pos)===0x04034b50){
  const method=bytes.readUInt16LE(pos+8),size=bytes.readUInt32LE(pos+18);
  const nameLength=bytes.readUInt16LE(pos+26),extraLength=bytes.readUInt16LE(pos+28);
  const name=bytes.toString('utf8',pos+30,pos+30+nameLength);
  const start=pos+30+nameLength+extraLength;
  if(name===wanted){
   assert.equal(method,0,'Word sin compresión inesperada');
   return bytes.toString('utf8',start,start+size);
  }
  pos=start+size;
 }
 throw new Error('Falta '+wanted+' en Word');
}

(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((request,response)=>{
  const route=decodeURIComponent((request.url||'/').split('?')[0]).replace(/^\/+/, '')||'index.html';
  const filename=path.resolve(root,route);
  if(filename!==root&&!filename.startsWith(root+path.sep)){
   response.writeHead(403);response.end('Forbidden');return;
  }
  fs.readFile(filename,(error,bytes)=>{
   if(error){response.writeHead(404);response.end('Not found');return}
   const type=filename.endsWith('.html')?'text/html':filename.endsWith('.json')?'application/json':
    filename.endsWith('.js')||filename.endsWith('.mjs')?'text/javascript':'application/octet-stream';
   response.setHeader('Content-Type',type+'; charset=utf-8');
   response.end(bytes);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const context=await browser.newContext({viewport:{width:1300,height:940},acceptDownloads:true});
   await context.addInitScript(()=>{
    localStorage.setItem('examina_lexical_banks_v1',JSON.stringify({
     latin1:{phonetics:[{id:'LAT1-FON-001',prompt:'terram',answer:''}]},
     latin4:{phonetics:[{id:'EVF-0001',prompt:'terram',answer:''}]}
    }));
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
   await page.waitForFunction(()=>!!latin1PreverbCurriculum&&!!latin1PhoneticCurriculum&&
    latinLexBanks.latin1.preverbs.length>0&&latinLexBanks.latin1.phonetics.length>0,null,{timeout:15000});
   // La carga real, online y offline, debe conservar el banco global tras leer el programa de UD.
   const bankLoaded=await page.evaluate(()=>({
    latin1:latinLexBanks.latin1.phonetics.length,
    latin4:latinLexBanks.latin4.phonetics.length,
    pelliculam:latinLexBanks.latin1.phonetics.some(x=>x.latin==='pelliculam'),
    inde:latinLexBanks.latin1.phonetics.some(x=>x.latin==='inde'),
    pirum:latinLexBanks.latin1.phonetics.some(x=>x.latin==='pirum'),
    newGreek:latinLexBanks.latin1.phonetics.filter(x=>x.id?.startsWith('EVF-')&&
     Number(x.id.slice(4))>=1081&&Number(x.id.slice(4))<=1180&&
     x.tipoTransmision==='ADAPTACION_CULTA').length,
    recoveredGreek:latinLexBanks.latin1.phonetics.filter(x=>x.id?.startsWith('EVF-')&&
     Number(x.id.slice(4))>=1181&&Number(x.id.slice(4))<=1197&&
     x.tipoTransmision==='ADAPTACION_CULTA').length,
    greekPotentiallyDubious:['Scytiam','pyram','œagrum','œnomaum','œtam','chœrilum','Chlœm',
     'circum','gulam','sculptorem'].some(s=>latinLexBanks.latin1.phonetics
      .some(x=>normLex(x.latin||x.prompt)===normLex(s))),
    distinct:new Set(latinLexBanks.latin1.phonetics.map(x=>normLex(x.latin||x.prompt))).size
   }));
   assert.equal(bankLoaded.latin1,663,filename+': el programa ha sustituido las fichas generales o la caché antigua sigue activa');
   assert.equal(bankLoaded.latin4,650,filename+': falta el banco general de Latín 4.º');
   assert(bankLoaded.pelliculam&&!bankLoaded.inde&&!bankLoaded.pirum,
    filename+': decisiones editoriales de fonética no respetadas');
   assert.equal(bankLoaded.distinct,bankLoaded.latin1,filename+': étimos duplicados en el sorteo');
   assert.equal(bankLoaded.newGreek,100,filename+': faltan adaptaciones gráficas de la siguiente tanda');
   assert.equal(bankLoaded.recoveredGreek,17,filename+': falta recuperar grafías griegas anteriormente pendientes');
   assert(!bankLoaded.greekPotentiallyDubious,filename+': las diez candidatas con dudas deben esperar la elección docente');

   // Las adaptaciones cultas aprobadas deben distinguirse de las evoluciones
   // patrimoniales también en el Word. Su etiqueta no es parte del campo editable.
   const cultured=await page.evaluate(()=>{
    const course=$('course');course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
    const model=$('model');model.value='tablas';model.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('.unit-choice').forEach(input=>{
     input.checked=units[Number(input.value)]==='UD3';
    });
    examSelectionCache.clear();generate();
    const key=examCacheSignature('lex-phonetics');
    const before=examSelectionCache.get(key);
    if(!Array.isArray(before)||before.length!==4)return {missing:true};
    const originalOther=before.slice(1).map(latinLexTermKey);
    setLatinPhoneticWord(0,'athletam');
    const after=examSelectionCache.get(key);
    const slot=$('paper').querySelector('[data-lex-slot="phonetics:0"]');
    return {missing:false,word:after[0]?.latin,
     classified:after[0]?.tipoTransmision,otherStable:JSON.stringify(after.slice(1).map(latinLexTermKey))===JSON.stringify(originalOther),
     label:slot?.querySelector('.phonetic-origin-label')?.textContent,
     editable:slot?.querySelector('i')?.textContent,
     editor:$('lex-edit-phonetics-0')?.value};
   });
   assert(!cultured.missing&&cultured.word==='athletam',filename+': no se cargó el cultismo verificado');
   assert.equal(cultured.classified,'ADAPTACION_CULTA');
   assert(cultured.label?.includes('adaptación culta'),filename+': cultismo sin etiqueta en vista previa');
   assert.equal(cultured.editable,'athletam',filename+': la etiqueta contaminó el étimo');
   assert.equal(cultured.editor,'athletam',filename+': la etiqueta contaminó el editor');
   assert(cultured.otherStable,filename+': cambiar a cultismo modificó las demás formas');
   const culturedDownload=page.waitForEvent('download');
   await page.evaluate(()=>exportWord(false));
   const culturedFile=await culturedDownload;
   const culturedXml=readStoredZipEntry(fs.readFileSync(await culturedFile.path()),'word/document.xml');
   assert(culturedXml.includes('adaptación culta'),filename+': el Word no identifica la adaptación culta');
   const editedCultism=await page.evaluate(()=>{
    const node=$('paper').querySelector('[data-lex-slot="phonetics:0"] i');
    node.textContent='contum';
    node.dispatchEvent(new InputEvent('input',{bubbles:true}));
    const slot=$('paper').querySelector('[data-lex-slot="phonetics:0"]');
    const key=examCacheSignature('lex-phonetics');
    const after=examSelectionCache.get(key);
    return {latin:after[0]?.latin,spanish:after[0]?.castellano,
     label:!!slot?.querySelector('.phonetic-origin-label'),
     editor:$('lex-edit-phonetics-0')?.value,
     otherRows:after.slice(1).map(latinLexTermKey)};
   });
   assert.equal(editedCultism.latin,'contum',filename+': no se puede editar desde Word/HTML a un étimo patrimonial');
   assert.equal(editedCultism.spanish,'cuento');
   assert.equal(editedCultism.label,false,filename+': la etiqueta culta persistió tras cambiar la palabra');
   assert.equal(editedCultism.editor,'contum',filename+': editor lateral desincronizado tras retirar cultismo');
   const restoreCultism=await page.evaluate(()=>{
    setLatinPhoneticWord(0,'blasphemiam');
    const slot=$('paper').querySelector('[data-lex-slot="phonetics:0"]');
    return {label:slot?.querySelector('.phonetic-origin-label')?.textContent,
     editor:$('lex-edit-phonetics-0')?.value};
   });
   assert(restoreCultism.label?.includes('adaptación culta'),
    filename+': editar desde el menú no recupera la etiqueta culta');
   assert.equal(restoreCultism.editor,'blasphemiam');

   // Regresión real: UD3 debe sortear centenares de palabras, no reservar las
   // cuatro plazas a aféresis/epéntesis y otros fenómenos con pocos ejemplos.
   const variety=await page.evaluate(()=>{
    const course=$('course');course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
    const model=$('model');model.value='tablas';model.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('.unit-choice').forEach(input=>{
     input.checked=units[Number(input.value)]==='UD3';
    });
    examSelectionCache.clear();
    const chosen=selectedUnits(),pool=latinLexPool('latin1','phonetics',chosen);
    const key=examCacheSignature('lex-phonetics');
    phoneticRecentSelections.delete(key);
    const seen=new Set(),recent=[];
    let repeated=0,duplicated=0,invalid=0;
    for(let round=0;round<80;round++){
     const rows=latinLexChosenRows('latin1','phonetics',chosen);
     const words=rows.map(latinLexTermKey);
     if(rows.length!==4||new Set(words).size!==4)duplicated++;
     if(words.some(word=>recent.flat().includes(word)))repeated++;
     if(rows.some(row=>!pool.includes(row)))invalid++;
     words.forEach(word=>seen.add(word));
     recent.push(words);
     if(recent.length>4)recent.shift();
     examSelectionCache.delete(key);
    }
    return {pool:pool.length,distinct:seen.size,repeated,duplicated,invalid};
   });
   assert(variety.pool>=500,filename+': UD3 no utiliza el banco fonético general');
   assert(variety.distinct>=125,filename+': se repiten las normas minoritarias en vez de sortear todo el banco: '+JSON.stringify(variety));
   assert.equal(variety.repeated,0,filename+': se reciclan formas de las cuatro tandas anteriores');
   assert.equal(variety.duplicated,0,filename+': hay formas repetidas en un mismo ejercicio');
   assert.equal(variety.invalid,0,filename+': se ha sorteado una forma no compatible con UD3');

   await page.evaluate(()=>{
    const course=document.getElementById('course');
    course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
    const model=document.getElementById('model');
    model.value='tablas';model.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('.unit-choice').forEach(input=>{
     input.checked=units[Number(input.value)]==='UD9–10';
    });
    examSelectionCache.clear();generate();
    document.querySelector('#examQuestionMenus [data-question="lex"]').open=true;
   });
   await page.waitForFunction(()=>document.querySelectorAll('#paper [data-lex-slot^="preverbs:"]').length===2);
   const initial=await page.evaluate(()=>{
    const box=document.querySelector('#examQuestionMenus [data-question="lex"]');
    const norms=box.querySelector('.lex-norms-accordion'),controls=[...norms.querySelectorAll('input[data-phonetic-code]')];
    const words=[...document.querySelectorAll('#paper [data-lex-slot^="preverbs:"] i')].map(x=>x.textContent);
    const inputs=[document.getElementById('lex-verb-0').value,document.getElementById('lex-verb-1').value];
    return {normsCollapsed:!norms.open,normCount:controls.length,
     words,inputs,sidebar:box.textContent,
     next:latinLexPool('latin1','preverbs',selectedUnits()).find(x=>!words.includes(latinLexDisplayPrompt('preverbs',x)))?.prompt};
   });
   assert(initial.normsCollapsed,filename+': normas fonéticas deben empezar plegadas');
   assert.equal(initial.normCount,20,filename+': deben conservarse las veinte casillas');
   assert(initial.words.every(Boolean)&&initial.words.every((x,i)=>x===initial.inputs[i]),
    filename+': verbos aleatorios deben constar por escrito en menú y vista previa');
   assert(initial.next,'No hay verbo alternativo en UD9–10');
   // La reconstrucción de los paneles no puede dejar los inputs en blanco.
   const rebuilt=await page.evaluate(()=>{
    document.dispatchEvent(new Event('examina-lex-ready'));
    document.querySelector('#examQuestionMenus [data-question="lex"]').open=true;
    return [document.getElementById('lex-verb-0')?.value,
     document.getElementById('lex-verb-1')?.value];
   });
   assert.deepEqual(rebuilt,initial.words,filename+': reconstrucción de menús vacía los verbos');
   for(const phrase of ['73 étimos','fichas disponibles','Las correspondencias pendientes',
    'Solo se sortean verbos ya explicados','La opción UD9–10 abarca']){
    assert(!initial.sidebar.includes(phrase),filename+': permanece explicación '+phrase);
   }
   const before=await page.evaluate(()=>{
    const kinds=['preverbs','phonetics','prefixes','latinisms'];
    window.__lexBeforeRefs=Object.fromEntries(kinds.map(kind=>
     [kind,examSelectionCache.get(examCacheSignature('lex-'+kind))]));
    return kinds.map(kind=>({kind,
     words:(examSelectionCache.get(examCacheSignature('lex-'+kind))||[]).map(x=>x.prompt)}));
   });
   const first=page.locator('#lex-verb-0');
   await first.fill(initial.next);
   const typed=await page.evaluate(()=>{
    const state=examSelectionCache.get(examCacheSignature('lex-preverbs'));
    return {words:state.map(x=>x.prompt),
     editor:[document.getElementById('lex-verb-0').value,document.getElementById('lex-verb-1').value],
     preview:[...document.querySelectorAll('#paper [data-lex-slot^="preverbs:"] i')].map(x=>x.textContent),
     noOtherChanges:['phonetics','prefixes','latinisms'].every(kind=>
      examSelectionCache.get(examCacheSignature('lex-'+kind))===window.__lexBeforeRefs[kind])};
   });
   assert.equal(typed.words[0],initial.next.toLowerCase(),filename+': editar debe reemplazar el primer verbo');
   assert.equal(typed.words[1],initial.words[1],filename+': editar no debe tocar el segundo verbo');
   assert.deepEqual(typed.preview,typed.words,filename+': vista previa no refleja entrada del menú');
   assert.deepEqual(typed.editor,typed.words,filename+': menú y estado no coinciden');
   assert(typed.noOtherChanges,filename+': editar verbo regeneró otro apartado');

   // Edición inversa: modificar directamente la previsualización debe sincronizar el campo lateral.
   const second=await page.evaluate(()=>{
    const current=examSelectionCache.get(examCacheSignature('lex-preverbs'));
    const chosen=latinLexPool('latin1','preverbs',selectedUnits())
     .find(x=>!current.some(row=>normLex(row.prompt)===normLex(x.prompt)));
    if(!chosen)throw Error('No hay tercer verbo para probar la vista previa');
    const node=document.querySelector('#paper [data-lex-slot="preverbs:1"] i');
    node.textContent=chosen.prompt;
    node.dispatchEvent(new InputEvent('input',{bubbles:true}));
    return {chosen:chosen.prompt,editor:document.getElementById('lex-verb-1').value,
     words:examSelectionCache.get(examCacheSignature('lex-preverbs')).map(x=>x.prompt)};
   });
   assert.equal(second.editor,second.chosen.toLowerCase(),filename+': vista previa no sincroniza el campo lateral');
   assert.equal(second.words[0],typed.words[0],filename+': edición de segundo verbo afectó al primero');
   assert.equal(second.words[1],second.chosen.toLowerCase());
   // El Word debe exportar el texto final del ejercicio, no una selección antigua.
   const downloadPromise=page.waitForEvent('download');
   await page.evaluate(()=>exportWord(false));
   const download=await downloadPromise;
   const xml=readStoredZipEntry(fs.readFileSync(await download.path()),'word/document.xml');
   assert(xml.includes(typed.words[0])&&xml.includes(second.words[1]),
    filename+': el Word no refleja los verbos editados');

   // Regenerar una sola forma respeta las demás, incluso en apartados distintos.
   const regeneration=await page.evaluate(()=>{
    const old=examSelectionCache.get(examCacheSignature('lex-preverbs')).map(x=>x.prompt);
    regenerateLatinLexWord('preverbs',0);
    const next=examSelectionCache.get(examCacheSignature('lex-preverbs')).map(x=>x.prompt);
    return {old,next,shown:[...document.querySelectorAll('#paper [data-lex-slot^="preverbs:"] i')].map(x=>x.textContent),
     editor:[document.getElementById('lex-verb-0').value,document.getElementById('lex-verb-1').value],
     othersUnchanged:['phonetics','prefixes','latinisms'].every(kind=>
      examSelectionCache.get(examCacheSignature('lex-'+kind))===window.__lexBeforeRefs[kind])};
   });
   assert.notEqual(regeneration.next[0],regeneration.old[0],filename+': el botón individual no regeneró el verbo');
   assert.equal(regeneration.next[1],regeneration.old[1],filename+': el botón individual modificó el otro verbo');
   assert.deepEqual(regeneration.shown,regeneration.next);
   assert.deepEqual(regeneration.editor,regeneration.next);
   assert(regeneration.othersUnchanged,filename+': regenerar un verbo tocó otra pregunta');

   // Los filtros de fonética siguen activos, pero ya no invalidan los verbos.
   const rules=await page.evaluate(()=>{
    const norms=document.querySelector('.lex-norms-accordion');
    norms.open=true;
    const inputs=[...norms.querySelectorAll('input[data-phonetic-code]')];
    const editable=inputs.find(input=>!input.disabled);
    const old=examSelectionCache.get(examCacheSignature('lex-preverbs'));
    const state=editable.checked;
    editable.checked=!state;editable.dispatchEvent(new Event('change',{bubbles:true}));
    return {open:norms.open,n:inputs.length,changed:editable.checked!==state,
     preverbStable:examSelectionCache.get(examCacheSignature('lex-preverbs'))===old,
     preverbText:[...document.querySelectorAll('#paper [data-lex-slot^="preverbs:"] i')].map(x=>x.textContent)};
   });
   assert(rules.open&&rules.changed&&rules.n===20);
   assert(rules.preverbStable,filename+': seleccionar una norma no debe regenerar verbos');
   assert.deepEqual(rules.preverbText,regeneration.next);

   await page.evaluate(()=>{
    const course=document.getElementById('course');
    course.value='latin4';course.dispatchEvent(new Event('change',{bubbles:true}));
    const model=document.getElementById('model');
    model.value='tablas';model.dispatchEvent(new Event('change',{bubbles:true}));
   });
   const lat4=await page.evaluate(()=>({
    text:document.querySelector('#examQuestionMenus [data-question="lex"]')?.textContent||'',
    norms:document.querySelector('#examQuestionMenus .lex-norms-accordion')
   }));
   assert(!lat4.text.includes('fichas disponibles')&&!lat4.text.includes('Latín 4.º: los ejercicios'),
    filename+': subtítulos descriptivos en Latín 4.º');
   assert(!lat4.norms,filename+': normas de Latín I en menú de Latín 4.º');

   await page.setViewportSize({width:390,height:844});
   assert(await page.locator('#paper').isVisible(),filename+': vista previa móvil oculta');
   assert.deepEqual(errors,[],filename+': errores JS en navegador');
   await context.close();
  }
  console.log('OK: menús léxicos, normas desplegables, edición bidireccional, Word y regeneración individual (online y offline).');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
