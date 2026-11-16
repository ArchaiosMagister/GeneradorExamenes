'use strict';
/* Rediseño visual únicamente: no cambia motores, bancos ni respuestas. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1350,height:880}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(pathToFileURL(path.join(ROOT,file)).href,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ExaminaDesktopShell&&!!window.ExaminaVisualFormat&&!!window.ExaminaScoring);
    const baseline=await page.evaluate(()=>({
     html:document.querySelector('#paper').innerHTML,
     course:document.getElementById('course').value,
     model:document.getElementById('model').value,
     input:document.getElementById('newSentences').value,
     bank:latinSharedBank.entries.size,
     total:document.querySelectorAll('#paper .exam-question').length
    }));
    for(const id of ['course','model','lang','paper','vocabManager','vocabularyGenerator','vgShow','vmShowList','vmShowExam','docx','docxAnswers','saveDraft','exportData']){
     assert.equal(await page.locator('#'+id).count(),1,file+': control duplicado '+id);
    }
    assert.equal(await page.locator('body').getAttribute('data-desktop-section'),'exam');
    assert.equal(await page.locator('#vmShowExam').isVisible(),true);
    assert.equal(await page.locator('#docxAnswers').isVisible(),false,
     file+': la interfaz nueva muestra un solucionario que no se ha solicitado');
    assert.equal(await page.locator('#docx').count(),1);
    await page.locator('#desktopProgramButton').click();
    assert.equal(await page.locator('body').getAttribute('data-desktop-section'),'program');
    assert.equal(await page.locator('#desktopProgram').isVisible(),true);
    assert.equal(await page.locator('#paper').isVisible(),false);
    assert.equal(await page.locator('#desktopProgramUnits details').count(),10);
    const noChange=await page.evaluate(()=>({
     html:document.getElementById('paper').innerHTML,
     course:document.getElementById('course').value,
     model:document.getElementById('model').value,
     input:document.getElementById('newSentences').value,
     bank:latinSharedBank.entries.size,
     total:document.querySelectorAll('#paper .exam-question').length
    }));
    assert.deepEqual(noChange,baseline,file+': mostrar programación cambió el examen o banco');
    await page.locator('button[data-program-course="greek1"]').click();
    assert.equal(await page.locator('#desktopProgramUnits details').count(),14);
    const greekUD8=await page.locator('#desktopProgramUnits details[data-program-unit="8"]').textContent();
    assert.match(greekUD8,/Tercera declinación/);
    assert.equal(await page.locator('#course').inputValue(),baseline.course,
     file+': consultar Griego I cambia el curso real');
    await page.locator('button[data-program-course="latin4"]').click();
    assert.equal(await page.locator('#desktopProgramUnits details').count(),0);
    assert.match(await page.locator('#desktopProgramStatus').textContent(),/programación vigente/);
    await page.locator('#desktopDataButton').click();
    assert.equal(await page.locator('#desktopData').isVisible(),true);
    assert.equal(await page.locator('#paper').isVisible(),false);
    assert.equal(await page.locator('#desktopData [data-desktop-action]').count(),6);
    await page.locator('#desktopDraftsOpen').click();
    assert.equal(await page.locator('body').getAttribute('data-desktop-section'),'exam');
    assert.equal(await page.locator('#group-drafts').evaluate(el=>el.open),true);
    assert.equal(await page.locator('#paper').evaluate(el=>el.innerHTML),baseline.html,
     file+': volver del centro de datos regeneró el examen');
    await page.locator('#desktopDataButton').click();
    await page.locator('#desktopCopiesOpen').click();
    assert.equal(await page.locator('#group-import').evaluate(el=>el.open),true);
    assert.equal(await page.locator('#exam-ui-advanced').evaluate(el=>el.open),true);
    await page.locator('#desktopDataButton').click();
    await page.locator('#desktopMorphOpen').click();
    assert.equal(await page.locator('#group-morph').evaluate(el=>el.open),true);
    await page.locator('#desktopProgramButton').click();
    await page.locator('button[data-program-course="greek1"]').click();
    await page.locator('#desktopProgramToExam').click();
    assert.equal(await page.locator('#course').inputValue(),'greek1');
    assert.equal(await page.locator('body').getAttribute('data-desktop-section'),'exam');
    assert(await page.locator('#paper .exam-sheet').count(),file+': no hay examen tras cambiar la asignatura');
    await page.locator('#vgShow').click();
    assert.equal(await page.locator('#vocabularyGenerator.active').isVisible(),true);
    assert.equal(await page.locator('#paper').isVisible(),false);
    await page.locator('#vmShowList').click();
    assert.equal(await page.locator('#vocabManager.active').isVisible(),true);
    assert.equal(await page.locator('#paper').isVisible(),false);
    await page.locator('#vmShowExam').click();
    assert.equal(await page.locator('#paper').isVisible(),true);
    await page.locator('#lang').selectOption('va');
    await page.locator('#desktopProgramButton').click();
    assert.equal(await page.locator('#desktopProgramTitle').textContent(),'Programació acadèmica');
    await page.locator('#desktopDataButton').click();
    assert.equal(await page.locator('#desktopDataTitle').textContent(),'Dades i configuració');
    await page.locator('#desktopThemeOpen').click();
    assert.equal(await page.locator('#appearanceMode').evaluate(el=>document.activeElement===el),true);
    await page.locator('#appearanceMode').selectOption('oled');
    assert.equal(await page.locator('html').getAttribute('data-appearance'),'oled');
    await page.setViewportSize({width:390,height:844});
    await page.locator('#desktopProgramButton').click();
    assert.equal(await page.locator('#desktopProgram').isVisible(),true);
    const navBox=await page.locator('.vocab-tabbar').boundingBox();
    assert(navBox&&navBox.width<=392,file+': desbordamiento horizontal del menú móvil');
    assert.deepEqual(errors,[],file+': errores de JavaScript');
   }finally{await page.close()}
  }
  console.log('OK interfaz de cuatro áreas: navegadores web/offline, ES/VA, datos, curso, Word, bancos, iPad/móvil sin mutaciones académicas.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
