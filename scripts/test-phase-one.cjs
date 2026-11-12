// Regresiones de la fase I: puntuación y campos Word <-> menú.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1360,height:940}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.evaluate(()=>{
   const course=document.getElementById('course');
   course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
   const model=document.getElementById('model');
   model.value='tablas';model.dispatchEvent(new Event('change',{bubbles:true}));
   document.querySelectorAll('#unitChoices .unit-choice').forEach(el=>
    el.checked=units[Number(el.value)]==='UD4');
   generate();
  });
  await page.waitForFunction(()=>
   window.ExaminaScoring?.rows().length>2&&
   !!document.querySelector('#examQuestionMenus [data-question="forms"] .exam-question-score-row input'));
  const field=page.locator('#examQuestionMenus [data-question="forms"] .exam-question-score-row input');
  const rowKey=await field.getAttribute('data-scoring-key');
  const preview=page.locator('#paper .exam-question').filter({hasText:/Analiza morfol/i}).first();
  assert.equal(await field.count(),1,'Falta editor de puntuación en el menú de análisis');
  await field.fill('1,75');
  assert.match(await preview.locator('.exam-question-points').textContent(),/1,75p/);
  const global=page.locator('#examScoring input[data-scoring-key="'+rowKey+'"]');
  assert.equal(await global.inputValue(),'1,75','El resumen no refleja el menú');
  await preview.locator('.exam-question-points').click();
  const inline=preview.locator('.exam-score-inline-editor');
  await inline.fill('2,25');await inline.press('Enter');
  assert.equal(await field.inputValue(),'2,25','El menú no refleja el Word');
  assert.equal(await global.inputValue(),'2,25','El resumen no refleja el Word');
  const word=await preview.evaluate(el=>wordExamParagraph(el));
  assert.match(word,/2,25p\.\)\./,'El Word no usa los puntos editados');

  const before=await page.evaluate(()=>{
   const target=document.querySelector('#paper [data-analysis-slot] > i:first-child');
   if(!target)throw Error('No hay palabra de análisis para probar');
   const id=target.dataset.examEditorLink;
   const editor=[...document.querySelectorAll('input[data-exam-editor-link]')]
    .find(el=>el.dataset.examEditorLink===id);
   if(!editor)throw Error('Falta editor enlazado a la palabra');
   target.textContent='FORMA_PRUEBA_1';
   target.dispatchEvent(new Event('input',{bubbles:true}));
   if(editor.value!=='FORMA_PRUEBA_1')throw Error('Vista previa no sincroniza su campo de texto');
   document.getElementById('saveDraft').click();
   const snapshot=JSON.parse(localStorage.getItem('examina_draft_v14'));
   if(!snapshot?.scores||!snapshot?.units)throw Error('El borrador omite puntuaciones o unidades');
   return {rowKey,id};
  });
  await field.fill('3,5');
  await page.evaluate(()=>{
   const target=document.querySelector('#paper [data-analysis-slot] > i:first-child');
   target.textContent='FORMA_MODIFICADA';
   target.dispatchEvent(new Event('input',{bubbles:true}));
   document.getElementById('restoreDraft').click();
  });
  await page.waitForFunction(()=>document.querySelector('#paper [data-analysis-slot] > i:first-child')?.textContent==='FORMA_PRUEBA_1');
  assert.equal(await field.inputValue(),'2,25','La restauración no devuelve los puntos');
  assert.equal(await preview.locator('.exam-question-points').textContent().then(x=>x.includes('2,25p.')),true);
  const after=await page.evaluate(()=>{
   const target=document.querySelector('#paper [data-analysis-slot] > i:first-child');
   const id=target.dataset.examEditorLink;
   const editor=[...document.querySelectorAll('input[data-exam-editor-link]')]
    .find(el=>el.dataset.examEditorLink===id);
   if(!editor)throw Error('No se han reconstruido los editores después del borrador');
   target.textContent='FORMA_PRUEBA_2';target.dispatchEvent(new Event('input',{bubbles:true}));
   if(editor.value!=='FORMA_PRUEBA_2')throw Error('El vínculo restaurado no es bidireccional');
   const values=[...document.querySelectorAll('#paper [data-analysis-slot]')].map(el=>el.textContent);
   regenerateExamWord('verb',0);
   return values;
  });
  await page.waitForFunction(()=>document.querySelector('#paper [data-analysis-slot] > i:first-child')?.textContent==='FORMA_PRUEBA_2');
  assert.equal(await field.inputValue(),'2,25','La regeneración individual borra puntos editados');
  assert.equal(errors.length,0,'Errores de JavaScript: '+errors.join('; '));
  await page.close();
  console.log('Fase I: puntuación y edición bidireccional, borradores y regeneración individual correctos.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
