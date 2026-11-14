'use strict';
// Política docente: completos 10 p.; morfología como prueba parcial de 1 p. por pregunta.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1450,height:900},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.ExaminaScoring?.preflight&&!!document.getElementById('examFinalMode'));
  await page.evaluate(()=>{
   document.getElementById('course').value='latin1';
   const m=document.getElementById('model');m.value='tablas';m.dispatchEvent(new Event('change',{bubbles:true}));
   document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]==='UD4');
   generate();
  });
  await page.waitForFunction(()=>!!document.querySelector('#paper .exam-sheet')&&window.ExaminaScoring.rows().length>0);
  const initial=await page.evaluate(()=>({
   total:window.ExaminaScoring.total(),mode:window.ExaminaScoring.finalMode(),
   preflight:window.ExaminaScoring.preflight(),questions:window.ExaminaScoring.rows().length
  }));
  assert.equal(initial.mode,false,'Un borrador no debe activar validación final sin permiso');
  assert.equal(initial.preflight.ok,true,'Los borradores siguen exportables');
  await page.evaluate(()=>{
   window.__exportCalls=0;
   window.downloadBlob=()=>{window.__exportCalls++};
   window.__printCalls=0;
   window.print=()=>{window.__printCalls++};
   const checkbox=document.getElementById('examFinalMode');
   checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const scored=await page.evaluate(()=>window.ExaminaScoring.preflight());
  assert.equal(scored.ok,initial.total===1000);
  assert.equal(scored.mode,'definitivo');
  await page.evaluate(()=>{
   const row=[...document.querySelectorAll('#examScoring .exam-scoring-rows input[data-scoring-key]')]
    .find(el=>!el.disabled);
   if(!row)throw Error('No hay pregunta con puntuación editable');
   row.dataset.testPrior=row.value;
   row.value=String(Number(row.value.replace(',','.'))+0.5).replace('.',',');
   row.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.preflight().ok),false,
   'Un total diferente de 10 debe bloquear los documentos definitivos');
  await page.locator('#docx').click();
  assert.equal(await page.evaluate(()=>window.__exportCalls),0,'Se descargó un definitivo con puntuación incorrecta');
  await page.locator('#print').click();
  assert.equal(await page.evaluate(()=>window.__printCalls),0,'Se imprimió un definitivo con puntuación incorrecta');
  assert.match(await page.locator('#examScoringTotal').innerText(),/bloqueada/i);
  await page.evaluate(()=>{
   const checkbox=document.getElementById('examFinalMode');
   checkbox.checked=false;checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.canExport()),true,
   'La revisión opcional nunca bloquea los borradores');
  await page.locator('#docx').click();
  assert.equal(await page.evaluate(()=>window.__exportCalls),1,'El borrador debe seguir descargándose');
  await page.evaluate(()=>{
   const row=[...document.querySelectorAll('#examScoring .exam-scoring-rows input[data-scoring-key]')]
    .find(el=>el.dataset.testPrior);
   row.value=row.dataset.testPrior;row.dispatchEvent(new Event('input',{bubbles:true}));
   const checkbox=document.getElementById('examFinalMode');
   checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  });
  if(initial.total===1000){
   assert.equal(await page.evaluate(()=>window.ExaminaScoring.preflight().ok),true);
   await page.locator('#docx').click();
   assert.equal(await page.evaluate(()=>window.__exportCalls),2);
  }
  await page.evaluate(()=>{
   const m=document.getElementById('model');m.value='morf';m.dispatchEvent(new Event('change',{bubbles:true}));
   generate();
  });
  await page.waitForFunction(()=>window.ExaminaScoring.isMorph()&&window.ExaminaScoring.rows().length>0);
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.finalMode()),false,
   'Cambiar de modelo debe evitar validaciones definitivas heredadas');
  await page.evaluate(()=>{
   const checkbox=document.getElementById('examFinalMode');
   checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const morphology=await page.evaluate(()=>({
   result:window.ExaminaScoring.preflight(),
   rows:window.ExaminaScoring.rows()
  }));
  assert.equal(morphology.result.normalized,false,'No normalizar prueba parcial');
  assert.equal(morphology.result.mode,'parcial','La morfología debe declararse prueba parcial');
  assert.equal(morphology.result.total,morphology.rows.length*100,'Morfología: 1 p. por pregunta');
  assert(morphology.rows.every(r=>r.points===100),'No se conserva la puntuación unitaria');
  assert.equal(morphology.result.ok,true,'La prueba parcial debe poder cerrarse con su puntuación real');
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.canExport()),true);
  await page.evaluate(()=>{
   const row=[...document.querySelectorAll('#examScoring input[data-scoring-key]')].find(x=>!x.disabled);
   if(!row)throw Error('Morfología sin puntuaciones editables');
   row.value='1,5';row.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.preflight().ok),false,
   'La prueba parcial debe bloquear puntuaciones de pregunta distintas de 1 p.');
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.canExport()),false);
  await page.evaluate(()=>{
   const row=[...document.querySelectorAll('#examScoring input[data-scoring-key]')].find(x=>!x.disabled);
   row.value='1';row.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.preflight().ok),true,
   'La prueba parcial debe recuperarse tras restaurar 1 p. por pregunta');
  await page.evaluate(()=>{
   const l=document.getElementById('lang');l.value='va';l.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.getElementById('examFinalHelp').textContent.includes('Prova parcial'));
  // La aprobación del modo definitivo nunca se hereda tras recargar.
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!!window.ExaminaScoring?.preflight&&!!document.getElementById('examFinalMode'));
  assert.equal(await page.evaluate(()=>window.ExaminaScoring.finalMode()),false,
   'Al reabrir el generador el modo definitivo debe permanecer desactivado');
  assert.deepEqual(errors,[],'Errores JavaScript del panel definitivo');
  console.log('Validación final: completos a 10 p., pruebas morfológicas parciales a 1 p. por pregunta, Word e impresión controlados, ES/VA.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
