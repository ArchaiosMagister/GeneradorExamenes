'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');

async function select(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=document.getElementById('course');
  c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=document.getElementById('model');
  m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(input=>
   input.checked=units[Number(input.value)]===unit);
  generate();
 },{course,model,unit});
 await page.waitForTimeout(120);
}
const query=page=>page.evaluate(()=>({
  course:currentCourse(),model:document.getElementById('model').value,
  headings:[...document.querySelectorAll('#paper .exam-sheet > p.exam-question')].map(el=>el.textContent),
  options:[...document.querySelectorAll('#paper .greek-choice-option')].map(x=>x.dataset.greekOption),
  numbers:[...document.querySelectorAll('[data-greek-choice-slot^="change-number:"]')].map(x=>x.textContent),
  retro:[...document.querySelectorAll('[data-greek-choice-slot^="retroversion:"]')].map(x=>x.textContent),
  roots:document.querySelectorAll('.greek-choice-etym-sentence u').length,
  points:window.ExaminaScoring?.rows?.()?.map(x=>({base:x.base,score:x.cents||x.points||x.score})),
  total:window.ExaminaScoring?.total?.(),
  choose:document.querySelector('.exam-question[data-exam-kind="greek-competence"]')?.textContent
 }));
async function run(page,file){
 for(const model of ['complete','translation']){
  await select(page,'greek1',model,'UD2');
  let x=await query(page);
  assert(!x.options.includes('change-number'),file+'/'+model+': artículo antes de UD3');
  assert(!x.options.includes('retroversion'),file+'/'+model+': retroversión nominal antes de UD3');
  await select(page,'greek1',model,'UD3');
  x=await query(page);
  assert(x.options.includes('change-number'),file+'/'+model+': falta cambio de número UD3');
  assert(x.options.includes('retroversion'),file+'/'+model+': falta retroversión UD3');
  assert(x.options.includes('roots'),file+'/'+model+': falta etimología inversa UD3');
  assert.equal(x.numbers.length,4,file+'/'+model+': cuatro cambios por defecto');
  assert.equal(x.retro.length,4,file+'/'+model+': cuatro retroversiones por defecto');
  assert.equal(x.roots,2,file+'/'+model+': dos palabras subrayadas');
  assert(x.headings.length===3,file+'/'+model+': tres preguntas principales: '+JSON.stringify(x.headings));
  assert.match(x.choose,/Elige tres de estas cinco preguntas/);
  const word=await page.evaluate(()=>wordInline(document.querySelector('.greek-choice-etym-sentence')));
  assert.match(word,/<w:u w:val="single"\/>/,file+'/'+model+': subrayado faltante en Word');
  const st=await page.evaluate(()=>({rows:window.ExaminaScoring?.rows?.(),total:window.ExaminaScoring?.total?.()}));
  assert.equal(Number(st.total),1000,file+'/'+model+': la puntuación no suma diez puntos: '+JSON.stringify(st));
  await select(page,'greek1',model,'UD5');
  x=await query(page);
  assert.match(x.choose,/Elige tres de estas cinco preguntas/);
  const b=await page.evaluate(()=>({
   adjectives:ExaminaGreekNumber.candidates().filter(x=>x.id.includes(':adj:')).length,
   retros:ExaminaGreekRetroversion.candidates().filter(x=>x.type==='adjective').length,
   pronouns:ExaminaGreekNumber.candidates().filter(x=>x.id.includes(':autos:')).length
  }));
  assert(b.adjectives>0&&b.retros>0,file+'/'+model+': faltan adjetivos desde UD5: '+JSON.stringify(b));
  assert.equal(b.pronouns,0,file+'/'+model+': pronombres anticipados');
  await select(page,'greek1',model,'UD7');
  const pron=await page.evaluate(()=>ExaminaGreekNumber.candidates().filter(x=>x.id.includes(':autos:')).length);
  assert(pron>0,file+'/'+model+': no se usan pronombres de UD7');
  // El inspector abre Configuración por defecto: ir a Preguntas antes de editar.
  await page.locator('#examPanelShortcuts button').nth(1).click();
  await page.locator('[data-greek-custom="number"] > summary').click();
  const cnum=page.locator('[data-greek-custom-count="number"]');
  await cnum.fill('6');await cnum.dispatchEvent('change');
  assert.equal((await query(page)).numbers.length,6,file+'/'+model+': cantidad de cambio no configurable');
  const first=page.locator('[data-greek-choice-slot="change-number:0"]');
  const oldFirst=await first.textContent();
  await page.evaluate(()=>{
   document.querySelector('#paper .exam-header').append(' MARCA-DOCENTE');
   document.querySelector('[data-greek-choice-slot="retroversion:1"]').append(' GUARDA-RETRO');
  });
  await page.locator('[aria-label="Regenerar sintagma 1 de 1.c · Cambio de número"]').click();
  const newFirst=await first.textContent();
  assert.notEqual(oldFirst,newFirst,file+'/'+model+': regeneración individual no cambió el sintagma: '+JSON.stringify({oldFirst,newFirst}));
  assert((await page.locator('#paper').textContent()).includes('MARCA-DOCENTE'));
  assert((await page.locator('[data-greek-choice-slot="retroversion:1"]').textContent()).includes('GUARDA-RETRO'));
  await page.locator('[data-greek-custom="retro"] .exam-question-toggle').uncheck();
  x=await query(page);
  assert.match(x.choose,/Elige tres de estas cuatro preguntas/,file+'/'+model+': enunciado de cuatro alternativas');
  await page.locator('[data-greek-custom="retro"] .exam-question-toggle').check();
  x=await query(page);assert.match(x.choose,/Elige tres de estas cinco preguntas/);
  await page.locator('[data-greek-custom="roots"] .exam-question-toggle').uncheck();
  x=await query(page);
  assert(!x.options.includes('roots'),file+'/'+model+': plurilingüismo no respeta desmarcado');
  assert.match(x.headings[1],/Responde a la siguiente pregunta/);
  await page.locator('[data-greek-custom="roots"] .exam-question-toggle').check();
 }
 await select(page,'greek1','morphology','UD7');
 let x=await query(page);
 assert(!x.options.length,file+': el modelo de morfología cambió');
 assert(await page.locator('#paper .reference-morph-exam').count(),file+': morfología original ausente');
 assert.equal(await page.locator('[data-greek-custom]').count(),0,file+': controles nuevos en morfología');
 await select(page,'latin1','tablas','UD4');
 assert.equal(await page.locator('#paper .greek-choice-option').count(),0,file+': grupos invadieron Latín I');
 await select(page,'latin4','tablas','UD4');
 assert.equal(await page.locator('#paper .greek-choice-option').count(),0,file+': grupos invadieron Latín 4.º');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const ctx=await browser.newContext({viewport:{width:1440,height:970},acceptDownloads:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(pathToFileURL(path.resolve(root,file)).href,{waitUntil:'load'});
   try{await run(page,file)}
   catch(e){console.error('ESTADO DEL FALLO',file,JSON.stringify(await query(page)));throw e}
   assert.deepEqual(errors,[],file+': excepciones de navegador');
   await ctx.close();
  }
  console.log('GRIEGO I: competencia 1, plurilingüismo 2, variación, puntos, Word, curso y offline OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
