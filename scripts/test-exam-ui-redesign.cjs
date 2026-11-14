'use strict';
// Prueba del rediseño aislado. No guarda datos docentes ni usa los bancos como fixtures.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((request,response)=>{
 const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname).replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,pathname);
 if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(file,(error,data)=>{
  if(error){response.writeHead(404).end();return}
  response.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':
   file.endsWith('.js')?'text/javascript; charset=utf-8':
   file.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');
  response.end(data);
 });
});
async function pick(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  function set(id,value){
   const el=document.getElementById(id);
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  set('course',course);set('model',model);
  let selected;
  document.querySelectorAll('#unitChoices input.unit-choice').forEach(el=>{
   el.checked=units[Number(el.value)]===unit;
   if(el.checked)selected=el;
  });
  if(!selected)throw Error('Unidad no disponible '+unit);
  selected.dispatchEvent(new Event('change',{bubbles:true}));
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>!!document.querySelector('#paper .exam-sheet'));
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 const port=server.address().port;
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1180,height:830}});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+port+'/'+file,{waitUntil:'load'});
   await page.waitForFunction(()=>document.body.classList.contains('exam-redesign'));
   const initial=await page.evaluate(()=>{
    const visible=el=>!!el&&getComputedStyle(el).display!=='none';
    const ids=['course','model','lang','term','sheetType','name','seed','unitChoices'];
    return {
     core:visible(document.getElementById('exam-ui-core')),
     hiddenTop:!visible(document.getElementById('exam-header-controls')),
     hiddenPills:[...document.querySelectorAll('#examEditorPanel .sidebar-choices')].every(el=>!visible(el)),
     oneField:ids.every(id=>document.querySelectorAll('#exam-ui-shell #'+id).length===1),
     vocabularyNodes:[document.querySelectorAll('#vocabularyGenerator').length,document.querySelectorAll('#vocabManager').length],
     export:!!document.querySelector('#exam-ui-actions #docx'),
     drafts:!!document.querySelector('#exam-ui-actions #saveDraft')
    };
   });
   assert(initial.core&&initial.hiddenTop&&initial.hiddenPills&&initial.oneField,file+': selector duplicado o ausente');
   assert.deepEqual(initial.vocabularyNodes,[1,1],file+': vocabularios modificados');
   assert(initial.export&&initial.drafts,file+': herramientas de examen ocultas');
   await pick(page,'greek1','translation','UD10');
   const greek=await page.evaluate(()=>{
    const words=[...document.querySelectorAll('#paper [data-greek-form-surface]')];
    const inputs=[...document.querySelectorAll('#examQuestionMenus [data-question="forms"] .question-editor input[type="text"]')];
    const enunciations=[...document.querySelectorAll('#paper .exam-form-enunciation')];
    return {wordCount:words.length,inputCount:inputs.length,
     sameWords:inputs.length>0&&inputs.length===words.length&&
      words.every((el,i)=>el.textContent.trim()===inputs[i].value.trim()),
     enunciations:enunciations.length,
     distinctEnunciations:enunciations.every(el=>!inputs.some(input=>input.value.trim()===el.textContent.trim()))};
   });
   assert(greek.wordCount>0&&greek.sameWords,file+': campos editoriales extra o ausentes en Griego');
   assert(greek.enunciations>0&&greek.distinctEnunciations,file+': enunciación convertida en campo editable');
   const before=await page.locator('#paper .exam-form-enunciation').first().textContent();
   await page.locator('#examQuestionMenus [data-question="forms"]').evaluate(el=>el.open=true);
   await page.locator('#examQuestionMenus [data-question="forms"] .question-editor input[type="text"]').first().fill('ἀγαθῶν');
   const after=await page.locator('#paper .exam-form-enunciation').first().textContent();
   assert.equal(before,after,file+': la enunciación de vista previa cambió por editar la forma');
   assert.equal(await page.locator('#paper [data-greek-form-surface]').first().textContent(),'ἀγαθῶν',
    file+': no se sincronizó edición con vista previa');
   await pick(page,'greek1','morphology','UD10');
   await page.locator('#examQuestionMenus [data-question="forms"]').evaluate(el=>el.open=true);
   assert.equal(await page.locator('#examQuestionMenus [data-question="decl"] .exam-ui-extra select').count(),1);
   assert.equal(await page.locator('#examQuestionMenus [data-question="forms"] .exam-ui-categories input').count(),3);
   assert.equal(await page.locator('#exam-ui-bulk').isVisible(),true);
   assert.equal(await page.locator('#morphOffer').isVisible(),false,'Control morfológico duplicado');
   const untouched=await page.locator('#paper .reference-verb-table').innerHTML();
   const button=page.locator('#examQuestionMenus [data-question="forms"] .exam-regenerate-word').first();
   assert(await button.count(),file+': faltan botones de regeneración individual');
   await button.click();
   assert.equal(await page.locator('#paper .reference-verb-table').innerHTML(),untouched,
    file+': regenerar análisis alteró otra pregunta');
   await page.locator('#examQuestionMenus [data-question="forms"] [data-regenerate-question="forms"]').click();
   assert.equal(await page.locator('#paper .reference-verb-table').innerHTML(),untouched,
    file+': regenerar pregunta completa alteró la verbal');
   await page.locator('#vgShow').click();
   assert(await page.locator('#vocabularyGenerator.active').count(),file+': cambió la navegación del vocabulario');
   await page.locator('#vmShowList').click();
   assert(await page.locator('#vocabManager.active').count(),file+': cambió el vocabulario exigible');
   await page.locator('#vmShowExam').click();
   assert(await page.locator('#exam-ui-core').isVisible(),file+': examen no recuperado tras módulos de vocabulario');
   await page.setViewportSize({width:820,height:1180});
   await page.locator('#examQuestionsTab').click();
   assert(await page.locator('#examQuestionMenus').isVisible(),file+': menú no visible en iPad');
   await page.locator('#examPreviewTab').click();
   assert(await page.locator('#paper .exam-sheet').isVisible(),file+': vista previa no visible en iPad');
   assert.deepEqual(errors,[],file+': errores de ejecución');
   await page.close();
  }
  console.log('Rediseño: configuración única, enunciados griegos sin editores extra, Word y regeneración aislada, iPad y vocabularios intactos.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
