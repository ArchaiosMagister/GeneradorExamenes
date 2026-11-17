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
async function checkConjugationPresentation(page,file,course,model,unit){
 await select(page,course,model,unit);
 const report=await page.evaluate(()=>{
  const paper=document.querySelector('#paper .exam-sheet');
  const direct=['amo, 1ª','amo, amavi, amatum (1ª)','capio, cepi, captum (mx.)']
    .map(text=>{
     const host=document.createElement('div');
     host.innerHTML=examParadigmHeading(text,'conjugation');
     return {text,italic:host.querySelector('i')?.textContent,
      indicator:host.querySelector('.exam-paradigm-indicator')?.textContent,
      indicatorWord:host.querySelector('.exam-paradigm-indicator')
        ?wordInline(host.querySelector('.exam-paradigm-indicator')):''};
    });
  const tables=[...paper.querySelectorAll('table.exam-verbs')]
    .filter(table=>table.querySelector('tbody th'))
    .map(table=>{
     const widths=(table.dataset.colWidths||'').split(',').map(Number);
     const labels=[...table.querySelectorAll('tbody tr th')];
     const heads=[...table.querySelectorAll('thead tr:first-child th[colspan]')];
     const word=wordExamTable(table);
     // En el modo iPad la pestaña de vista previa puede estar oculta.
     // Medir una copia fuera de pantalla, pero con el mismo CSS de .paper.
     const probe=document.createElement('div');
     probe.className='paper';
     probe.style.cssText='position:absolute;left:-10000px;top:0;width:850px;display:block;visibility:hidden';
     probe.innerHTML='<div class="exam-sheet">'+table.outerHTML+'</div>';
     document.body.appendChild(probe);
     const visible=probe.querySelector('table.exam-verbs'),
      first=visible.querySelector('tbody th');
     const firstRatio=first.getBoundingClientRect().width/visible.getBoundingClientRect().width;
     probe.remove();
     return {widths,columns:table.querySelectorAll('colgroup col').length,
      firstRatio,
      alignments:labels.map(el=>getComputedStyle(el).textAlign),
      labels:labels.map(el=>el.textContent.trim()),
      wordRight:(word.match(/<w:jc w:val="right"\/>/g)||[]).length,
      wordColumns:(word.match(/<w:gridCol w:w="/g)||[]).length,
      indicators:heads.flatMap(el=>[...el.querySelectorAll('.exam-paradigm-indicator')]
       .map(span=>({text:span.textContent,style:getComputedStyle(span).fontStyle,
        word:wordInline(span)})))};
    });
  return {direct,tables};
 });
 assert(report.tables.length>0,file+' '+course+': no aparece tabla de conjugación');
 for(const sample of report.direct){
  assert(sample.italic&&sample.indicator,file+' '+course+': no se separó '+sample.text);
  assert(!/<w:i\/>/.test(sample.indicatorWord),
   file+' '+course+': indicador de conjugación en cursiva en Word: '+sample.text);
 }
 for(const table of report.tables){
  assert.equal(table.labels.length,3,file+' '+course+': faltan 1.ª/2.ª/3.ª');
  assert.deepEqual(table.labels,['1ª','2ª','3ª'],file+' '+course+': nombres inesperados de persona');
  assert(table.firstRatio>0&&table.firstRatio<0.13,
   file+' '+course+': columna de persona demasiado ancha: '+table.firstRatio);
  assert(table.alignments.every(x=>x==='right'),
   file+' '+course+': las personas no están alineadas a la derecha');
  assert(table.columns===table.widths.length&&table.columns>=3,
   file+' '+course+': el ancho de las columnas no está fijado');
  assert(table.widths[0]/table.widths.reduce((a,b)=>a+b,0)<0.13,
   file+' '+course+': Word reserva demasiado ancho a la persona');
  assert.equal(table.wordRight,3,file+' '+course+': la alineación de Word no es derecha');
  assert.equal(table.wordColumns,table.widths.length,
   file+' '+course+': desajuste de tabla entre vista previa y Word');
  assert(table.indicators.every(x=>x.style==='normal'&&!x.word.includes('<w:i/>')),
   file+' '+course+': marca gramatical cursiva en HTML o Word');
 }
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
   const stable=nodes.filter(n=>!n.matches('[data-greek-option="forms"]')).map(n=>n.cloneNode(true));
   // El análisis ahora es una alternativa dentro de la competencia 1.
   // Excluir solo esa alternativa, conservando la comparación de las demás.
   stable.forEach(n=>n.querySelectorAll('[data-greek-option="forms"]').forEach(x=>x.remove()));
   results.push(stable.map(n=>n.outerHTML).join('').replace(/data-exam-editor-link="[^"]*"/g,'data-exam-editor-link="linked"').replace(/ data-scoring-original="[^"]*"/g,''));
  }
  return results;
 });
}
async function checkIsolatedResize(page,file,course,model,unit,id){
 await select(page,course,model,unit);
 // Dos formas/enunciados ajenos al análisis se editan de verdad, como en clase.
 // Después se comprueba tanto el redimensionamiento como una restauración real.
 const edits=await page.evaluate(()=>{
  const candidates=[
   '#paper .exam-nouns thead tr:first-child th[colspan] i',
   '#paper .exam-verbs thead tr:first-child th[colspan] i',
   '#paper .reference-verb-table tbody tr:first-child td:first-child i',
   '#paper [data-syntagm-slot] > i',
   '#paper .exam-pronouns tbody tr:first-child td:first-child i',
   '#paper .exam-sentences [data-sentence-slot]'
  ].map(css=>document.querySelector(css)).filter(Boolean);
  const picked=[...new Set(candidates)].slice(0,2);
  // Las preguntas siguen siendo editables aun si el banco no ofrece dos tablas.
  for(const heading of document.querySelectorAll('#paper .exam-question')){
   if(picked.length>=2)break;
   if(heading.dataset.examKind==='forms'||heading.dataset.morphKind==='forms'||heading.dataset.greekKind==='forms')continue;
   if(!picked.includes(heading))picked.push(heading);
  }
  if(picked.length!==2)throw Error('No se localizaron dos campos de otras preguntas');
  const markers=picked.map((node,i)=>{
   const marker='MARCA_DOCENTE_'+i;
   node.setAttribute('data-audit-manual-edit',String(i));
   node.textContent+=' '+marker;
   node.dispatchEvent(new InputEvent('input',{bubbles:true}));
   return marker;
  });
  const name=document.getElementById('name');
  const title='TITULO_DOCENTE_'+currentCourse()+'_'+document.getElementById('model').value;
  name.value=title;name.dispatchEvent(new Event('input',{bubbles:true}));
  document.getElementById('saveDraft').click();
  const draft=JSON.parse(localStorage.getItem('examina_draft_v14')||'null');
  if(!draft||!markers.every(m=>draft.html.includes(m))||draft.title!==title)
   throw Error('El borrador no guardó las dos ediciones y el título');
  return {markers,title};
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
 const kept=await page.evaluate(({markers,title})=>({
  markers:markers.every(m=>document.getElementById('paper').textContent.includes(m)),
  title:document.getElementById('paper').textContent.includes(title)
 }),edits);
 assert(kept.markers&&kept.title,file+' '+course+'/'+model+': se perdió una edición o el título al redimensionar');
 // Simular alteraciones posteriores y recuperar el borrador mediante su botón.
 await page.evaluate(()=>{
  document.querySelectorAll('#paper [data-audit-manual-edit]').forEach(el=>el.textContent='CAMBIO_NO_GUARDADO');
  const name=document.getElementById('name');name.value='CAMBIO_NO_GUARDADO';
  name.dispatchEvent(new Event('input',{bubbles:true}));
  document.getElementById('restoreDraft').click();
 });
 const restored=await page.evaluate(({markers,title})=>({
  markers:markers.every(m=>document.getElementById('paper').textContent.includes(m)),
  title:document.getElementById('name').value===title&&document.getElementById('paper').textContent.includes(title),
  count:document.querySelectorAll('#paper [data-analysis-slot],#paper .exam-form').length,
  errors:window.ExaminaScoring?.detailErrors?.()||[],
  draftStatus:document.getElementById('draftStatus').textContent
 }),edits);
 assert(restored.markers&&restored.title,file+' '+course+'/'+model+': el borrador perdió ediciones manuales');
 assert.equal(restored.count,before,file+' '+course+'/'+model+': el borrador no restauró las formas anteriores');
 assert(!/No se pudo|incorrecto|Error/i.test(restored.draftStatus),
  file+' '+course+'/'+model+': error al recuperar el borrador '+restored.draftStatus);
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
   await checkConjugationPresentation(page,file,'latin4','tablas','UD4');
   await checkConjugationPresentation(page,file,'latin1','tablas','UD4');
   await checkConjugationPresentation(page,file,'greek1','complete','UD7');
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
