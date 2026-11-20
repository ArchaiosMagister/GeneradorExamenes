/* Comprobación funcional y visual del refinamiento del editor.
 * No escribe datos de profesor ni modifica bancos: usa páginas aisladas.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const target=path.resolve(process.env.UI_TARGET||'index.html');
const baseline=process.env.UI_BASELINE_DIR?path.resolve(process.env.UI_BASELINE_DIR,'index.html'):null;
const output=path.resolve('test-results/ui-refinement');
fs.mkdirSync(output,{recursive:true});

async function inspect(browser,file,label){
 const context=await browser.newContext({viewport:{width:1194,height:900},acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(file).href);
 await page.waitForSelector('#examQuestionMenus details[data-question]',{timeout:30000});
 const metadata=await page.evaluate(()=>{
  const nav=document.getElementById('examPanelShortcuts');
  nav?.querySelector('[data-target="examQuestionSettings"]')?.click();
  const panel=document.getElementById('examEditorPanel');
  const menu=document.getElementById('examQuestionMenus');
  const toolbar=document.getElementById('examPreviewActions');
  const question=menu.querySelector('details[data-question]');
  const box=node=>{const r=node.getBoundingClientRect();return {height:r.height,width:r.width,x:r.x}};
  return {toolbar:box(toolbar),panel:box(panel),question:box(question),width:document.documentElement.scrollWidth,
   viewport:document.documentElement.clientWidth,
   available:[...menu.querySelectorAll('details[data-question]')].map(node=>node.dataset.question)};
 });
 assert(metadata.available.length>=3,label+': faltan tipos de pregunta');
 assert(metadata.width<=metadata.viewport+8,label+': desbordamiento horizontal de página en paisaje');
 await page.screenshot({path:path.join(output,label+'-landscape.png')});
 await page.setViewportSize({width:834,height:1194});
 const portrait=await page.evaluate(()=>{
  const toolbar=document.getElementById('examPreviewActions');
  return {scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
   buttons:[...toolbar.querySelectorAll(':scope>button')].map(button=>({
    label:button.textContent.trim(),height:button.getBoundingClientRect().height,
    width:button.getBoundingClientRect().width}))};
 });
 assert(portrait.scroll<=portrait.viewport+8,label+': desbordamiento horizontal en iPad vertical');
 assert(portrait.buttons.every(x=>x.height>=43&&x.width>50),label+': botones demasiado pequeños');
 await page.screenshot({path:path.join(output,label+'-portrait.png')});
 await context.close();
 return metadata;
}
async function verify(browser,file,label){
 const context=await browser.newContext({viewport:{width:1194,height:900},acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(pathToFileURL(file).href);
 await page.waitForSelector('#examRefinementReview',{state:'attached',timeout:30000});
 const nav=page.locator('#examPanelShortcuts [data-target="examQuestionSettings"]');
 if(await nav.count())await nav.click();
 const menu=page.locator('#examQuestionMenus details[data-question="decl"]');
 assert(await menu.count(),label+': falta declinación');
 await menu.evaluate(node=>{node.open=false;});
 await menu.locator('summary').click();
 await page.waitForFunction(()=>document.getElementById('paper').dataset.examinaFocus==='decl');
 assert(await page.evaluate(()=>document.querySelector('#examQuestionMenus details[data-question="decl"]').open),
  label+': no se conservó el desplegable');
 const draft=page.locator('#saveDraft');
 const before=await draft.boundingBox();
 await draft.click();
 await page.waitForFunction(()=>document.getElementById('saveDraft').dataset.saveState==='saved');
 const after=await draft.boundingBox();
 assert(Math.abs(after.width-before.width)<2&&Math.abs(after.height-before.height)<2,
  label+': el indicador cambia el tamaño del botón Guardar');
 await page.evaluate(()=>{
  const head=document.querySelector('#paper .exam-question');
  if(head)head.append(document.createTextNode(' '));
  else document.getElementById('name').dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.waitForFunction(()=>document.getElementById('saveDraft').dataset.saveState==='dirty');
 assert(await page.locator('#examRefinementReview').count(),label+': falta resumen de revisión del glosario');
 assert(!await page.evaluate(()=>document.getElementById('paper').contains(document.getElementById('examRefinementReview'))),
  label+': el resumen se incrustó indebidamente en el examen');
 for(const theme of ['light','dark','oled']){
  const colors=await page.evaluate(theme=>{
   document.documentElement.dataset.appearance=theme;
   const docx=getComputedStyle(document.getElementById('docx')).backgroundColor;
   const pdf=getComputedStyle(document.getElementById('pdfDownload')).backgroundColor;
   return {docx,pdf};
  },theme);
  assert.notEqual(colors.docx,colors.pdf,label+': Word/PDF indistinguibles en '+theme);
 }
 await page.setViewportSize({width:834,height:1194});
 const buttons=await page.locator('#examPreviewActions>button').evaluateAll(nodes=>
  nodes.map(node=>({height:node.getBoundingClientRect().height,width:node.getBoundingClientRect().width})));
 assert(buttons.every(x=>x.height>=43&&x.width>50),label+': botones inaccesibles en iPad');
 assert(errors.length===0,label+': errores JavaScript: '+errors.join('; '));
 await page.screenshot({path:path.join(output,label+'-verified.png')});
 await context.close();
}

(async()=>{
 const checks=[['chromium',chromium],['webkit',webkit]];
 for(const [name,engine] of checks){
  const browser=await engine.launch({headless:true});
  try{
   if(baseline)await inspect(browser,baseline,name+'-before');
   const after=await inspect(browser,target,name+'-after');
   await verify(browser,target,name+'-refined');
   if(baseline){
    const current=after;
    const previous=await (async()=>{
     // La comparación visible queda en las capturas; no exigir píxeles
     // idénticos entre motores, ni inferir que menos altura implique mayor calidad.
     return {file:baseline};
    })();
    assert(current.available.length>=3&&previous.file,'No se conservó el menú de preguntas');
   }
   console.log(name+': navegación, guardado, temas, escritorio e iPad correctos.');
  }finally{await browser.close();}
 }
 console.log('Comparación visual generada en '+output);
})().catch(error=>{console.error(error);process.exitCode=1});
