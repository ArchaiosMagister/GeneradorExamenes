'use strict';
// Fase V: distribución accesible, estados de edición, OLED y documento independiente de la vista.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

function storedZipEntry(bytes,wanted){
 let p=0;
 while(p+30<=bytes.length&&bytes.readUInt32LE(p)===0x04034b50){
  const size=bytes.readUInt32LE(p+18),n=bytes.readUInt16LE(p+26),x=bytes.readUInt16LE(p+28);
  const name=bytes.toString('utf8',p+30,p+30+n),start=p+30+n+x;
  assert(start+size<=bytes.length,'ZIP incompleto: '+name);
  if(name===wanted){
   assert.equal(bytes.readUInt16LE(p+8),0,'Método ZIP inesperado');
   return bytes.toString('utf8',start,start+size);
  }
  p=start+size;
 }
 throw Error('No existe '+wanted);
}
async function exportXml(page){
 const data=await page.evaluate(async()=>{
  let blob;const original=downloadBlob;
  try{
   downloadBlob=(_name,output)=>{blob=output;};
   document.getElementById('quickWord').click();
  }finally{downloadBlob=original;}
  if(!blob)throw Error('No se generó Word');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
 });
 return storedZipEntry(Buffer.from(data),'word/document.xml');
}
async function assertVisibility(page,mobile){
 const state=await page.evaluate(()=>{
  const shown=id=>{const el=document.getElementById(id);if(!el)return false;
   const r=el.getBoundingClientRect(),s=getComputedStyle(el);
   return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const nav=document.getElementById('examMobileTabs');
  return {nav:shown('examMobileTabs'),panel:shown('examEditorPanel'),paper:shown('paper'),
   tab:document.getElementById('examLayout').dataset.examTab,
   width:document.getElementById('examLayout').getBoundingClientRect().width,
   vw:innerWidth,tabHeight:nav.querySelector('button').getBoundingClientRect().height};
 });
 assert.equal(state.nav,mobile,'Visibilidad incorrecta de pestañas: '+JSON.stringify(state));
 assert.equal(state.paper,!mobile||state.tab==='preview','Vista previa mal colocada: '+JSON.stringify(state));
 assert.equal(state.panel,!mobile||state.tab!=='preview','Panel mal colocado: '+JSON.stringify(state));
 assert(state.width<=state.vw+2,'Desbordamiento del área de trabajo: '+JSON.stringify(state));
 if(mobile)assert(state.tabHeight>=44,'Pestaña con objetivo táctil menor de 44 px');
 return state;
}
async function checkOne(browser,filename){
 const context=await browser.newContext({viewport:{width:1360,height:900},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(filename)).href);
 await page.evaluate(()=>{
  document.getElementById('course').value='latin1';
  document.getElementById('course').dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('model').value='tablas';
  document.getElementById('model').dispatchEvent(new Event('change',{bubbles:true}));
  const controls=[...document.querySelectorAll('#unitChoices .unit-choice')];
  for(const el of controls)el.checked=units[Number(el.value)]==='UD4';
  controls.find(x=>x.checked)?.dispatchEvent(new Event('change',{bubbles:true}));
  generate();
 });
 await page.waitForFunction(()=>document.querySelector('#paper .exam-sheet')&&window.ExaminaScoring?.rows().length>0);
 assert.equal((await assertVisibility(page,false)).tab,undefined);
 const original=await exportXml(page);
 for(const width of [1180,1024,901]){
  await page.setViewportSize({width,height:820});
  await assertVisibility(page,false);
 }
 for(const width of [900,820,768,390,360]){
  await page.setViewportSize({width,height:780});
  await assertVisibility(page,true);
  assert.equal(await page.locator('#examSettingsTab').getAttribute('aria-selected'),'true');
  await page.locator('#examQuestionsTab').click();
  const shown=await page.evaluate(()=>({
   tab:document.getElementById('examLayout').dataset.examTab,
   questions:document.getElementById('examQuestionSettings').open,
   scores:document.getElementById('examScoring')?.getBoundingClientRect().height||0
  }));
  assert.equal(shown.tab,'questions');
  assert.equal(shown.questions,true,'El acordeón de preguntas debe abrirse al cambiar a su pestaña');
  assert(shown.scores>0,'La puntuación no aparece en Preguntas');
  await page.locator('#examPreviewTab').click();
  await assertVisibility(page,true);
  assert.equal(await page.locator('#examPreviewTab').getAttribute('aria-selected'),'true');
  await page.locator('#examSettingsTab').click();
 }
 assert.equal(await exportXml(page),original,'Cambiar entre vistas alteró el DOCX sin editar nada');
 // Persistencia de las ediciones reales cuando ambas áreas no son visibles simultáneamente.
 await page.locator('#examQuestionsTab').click();
 const input=page.locator('#examQuestionMenus [data-question="forms"] input[data-exam-editor-link]').first();
 await page.locator('#examQuestionMenus [data-question="forms"]').evaluate(el=>el.open=true);
 assert(await input.count()>0,'Falta el campo de análisis enlazado');
 const linked=await input.getAttribute('data-exam-editor-link');
 await input.fill('FORMA_FASE_V');
 await page.locator('#examPreviewTab').click();
 const target=page.locator('#paper [data-exam-editor-link="'+linked+'"]');
 assert.equal(await target.count(),1);
 assert.match(await target.textContent(),/FORMA_FASE_V/,'No se refleja la edición del menú');
 await target.evaluate(el=>{
  el.textContent='CAMBIO_DESDE_VISTA';
  el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'CAMBIO_DESDE_VISTA'}));
 });
 await page.locator('#examQuestionsTab').click();
 assert.equal(await input.inputValue(),'CAMBIO_DESDE_VISTA','Se pierde la edición hecha en la vista previa');
 // Las puntuaciones deben conservarse durante cambios de vista y de tamaño.
 const score=page.locator('#examScoring input[data-scoring-key]').first();
 assert(await score.count()>0);
 await score.fill('1,75');await score.dispatchEvent('change');
 await page.locator('#examPreviewTab').click();
 await page.locator('#examQuestionsTab').click();
 assert.equal(await score.inputValue(),'1,75','La puntuación se perdió al navegar');
 // Navegación por teclado: selecciones, foco y retorno a la vista inicial.
 await page.locator('#examQuestionsTab').focus();
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#examPreviewTab').getAttribute('aria-selected'),'true');
 await page.keyboard.press('Home');
 assert.equal(await page.locator('#examSettingsTab').getAttribute('aria-selected'),'true');
 // Los tres temas conservan el papel blanco y OLED reutiliza los controles oscuros.
 await page.locator('#appearanceMode').selectOption('dark');
 const dark=await page.evaluate(()=>({
  button:getComputedStyle(document.querySelector('.vocab-tabbar button:not(.active)')).backgroundColor,
  paper:getComputedStyle(document.getElementById('paper')).backgroundColor
 }));
 await page.locator('#appearanceMode').selectOption('oled');
 const oled=await page.evaluate(()=>({
  button:getComputedStyle(document.querySelector('.vocab-tabbar button:not(.active)')).backgroundColor,
  paper:getComputedStyle(document.getElementById('paper')).backgroundColor,
  body:getComputedStyle(document.body).backgroundColor
 }));
 assert.equal(oled.button,dark.button,'OLED cambió los colores de los botones del oscuro');
 assert.equal(oled.paper,dark.paper,'El papel académico cambia según el tema');
 assert.equal(oled.body,'rgb(0, 0, 0)','El fondo OLED no es negro puro');
 await page.emulateMedia({media:'print'});
 const printable=await page.evaluate(()=>({
  paper:getComputedStyle(document.getElementById('paper')).display,
  tabs:getComputedStyle(document.getElementById('examMobileTabs')).display,
  panel:getComputedStyle(document.getElementById('examEditorPanel')).display
 }));
 assert.notEqual(printable.paper,'none','Imprimir desde Configuración oculta el examen');
 assert.equal(printable.tabs,'none');assert.equal(printable.panel,'none');
 await page.emulateMedia({media:'screen'});
 await page.setViewportSize({width:1360,height:900});
 await assertVisibility(page,false);
 assert.equal(await input.inputValue(),'CAMBIO_DESDE_VISTA');
 assert.equal(await score.inputValue(),'1,75');
 assert.deepEqual(errors,[],filename+': errores de JavaScript');
 await context.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,
  ...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{for(const file of ['index.html','offline.html'])await checkOne(browser,file);}
 finally{await browser.close();}
 console.log('Fase V: ordenador, iPad, móvil, temas, navegación, Word y edición bidireccional verificados.');
})().catch(e=>{console.error(e);process.exitCode=1});
