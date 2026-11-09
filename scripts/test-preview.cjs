// Prueba real en navegador: vista previa y edición de los siete modelos.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

async function checkFile(browser,filename){
 const context=await browser.newContext({viewport:{width:1440,height:960}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto(pathToFileURL(path.resolve(filename)).href);
 const cases=[
  ['latin1','tablas','UD3'],['latin1','morf','UD3'],['latin1','mixto','UD3'],
  ['latin4','tablas','UD3'],
  ['greek1','complete','UD7'],['greek1','morphology','UD7'],['greek1','translation','UD7']
 ];
 for(const [course,model,unit] of cases){
  await page.selectOption('#course',course);
  await page.selectOption('#model',model);
  await page.evaluate(value=>{
   document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]===value);
   generate();
  },unit);
  const result=await page.evaluate(()=>{
   const paper=document.querySelector('#paper'),sheet=paper.querySelector('.exam-sheet');
   return {
    visible:getComputedStyle(paper).display!=='none',
    height:sheet?.getBoundingClientRect().height||0,
    text:paper.textContent.trim().length,
    questions:paper.querySelectorAll('.exam-question').length,
    controls:document.querySelectorAll('#manualMorphWords input[type="text"]').length,
    warning:document.querySelector('#manualMorphWords')?.textContent
   };
  });
  assert(result.visible&&result.height>80&&result.text>80,filename+' '+course+'/'+model+': vista previa ausente '+JSON.stringify(result));
  assert(result.questions>=3,filename+' '+course+'/'+model+': preguntas no renderizadas');
  // El panel de preguntas es un acordeón cerrado por defecto.
  await page.locator('.menu-section').filter({has:page.locator('#manualMorphWords')}).evaluate(section=>section.open=true);
  if(course==='greek1'&&model==='complete'){
   // El examen completo griego edita la selección del corpus, conservando las soluciones.
   const available=await page.locator('#manualMorphWords select').count();
   assert(available>0,filename+': faltan los selectores del corpus griego');
   const before=await page.evaluate(()=>window.greekLastExam.ids.length);
   await page.locator('#manualMorphWords button').filter({hasText:'Añadir al apartado'}).first().click();
   const after=await page.evaluate(()=>window.greekLastExam.ids.length);
   assert(after>before,filename+': el selector de Griego completo no modifica el examen');
  }else{
   assert(result.controls>0,filename+' '+course+'/'+model+': no se pueden editar formas: '+result.warning);
   const input=page.locator('#manualMorphWords input[type="text"]').first();
   await input.fill('FORMA_DE_PRUEBA');
   assert((await page.locator('#paper').textContent()).includes('FORMA_DE_PRUEBA'),filename+' '+course+'/'+model+': la edición no actualiza la vista previa');
   assert.equal(await page.locator('#paper #answerkey [data-manual-warning]').count(),1,filename+' '+course+'/'+model+': falta advertencia de solucionario');
  }
 }
 await page.selectOption('#course','latin1');
 await page.selectOption('#model','mixto');
 await page.evaluate(()=>{
  document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]==='UD3');
  generate();
 });
 await page.fill('#count-forms','1');
 await page.locator('#count-forms').dispatchEvent('change');
 const forms=await page.evaluate(()=>{
  const q=[...document.querySelectorAll('.latin-standard-exam .exam-question')].find(el=>el.textContent.toLowerCase().includes('morfol'));
  return q?.nextElementSibling?.querySelectorAll(':scope > li').length||0;
 });
 assert.equal(forms,1,filename+': el control de formas no actualiza la vista previa');
 await page.setViewportSize({width:390,height:844});
 assert(await page.locator('#paper .exam-sheet').isVisible(),filename+': vista previa oculta en móvil');
 assert.deepEqual(errors,[],filename+': errores JavaScript');
 await context.close();
}

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try {
  for(const filename of ['index.html','offline.html'])await checkFile(browser,filename);
  console.log('OK: vistas previas y edición de los siete modelos en web y versión offline.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
