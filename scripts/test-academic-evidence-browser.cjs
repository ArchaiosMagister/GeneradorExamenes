'use strict';
// Flujo docente real en Chromium sobre el HTML autónomo: autorizar ≠ verificar.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.ExaminaTeacherReview?.evidenceApproved);
  // Debe ser una propuesta todavía pendiente, no una forma verificada del lote 200.
  const form='appropinquabas';
  await page.evaluate(()=>{
   const details=document.getElementById('academicEvidenceReview');
   details.open=true;
   for(let parent=details.parentElement;parent;parent=parent.parentElement){
    if(parent.tagName==='DETAILS')parent.open=true;
    if(parent.hidden)parent.hidden=false;
   }
   document.getElementById('academicEvidenceCourse').value='lat1';
   const unit=document.getElementById('academicEvidenceUnit');unit.value='10';
   unit.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('#academicEvidenceQuery').fill(form);
  await page.waitForFunction(form=>{
   const row=document.querySelector('#academicEvidenceRows .evidence-card strong');
   return row?.textContent.startsWith(form+' —');
  },form);
  const card=page.locator('#academicEvidenceRows .evidence-card').first();
  assert.match(await card.innerText(),/propuesta/i);
  const authorization=card.getByRole('button',{name:'Autorizar esta propuesta'});
  assert.equal(await authorization.isDisabled(),true,'Debe exigirse confirmación docente explícita');
  await card.locator('input[type=checkbox]').check();
  assert.equal(await authorization.isEnabled(),true);
  await authorization.click();
  await page.waitForFunction(()=>document.querySelector('#academicEvidenceRows .evidence-card button')?.textContent.includes('Revocar'));
  const status=await page.evaluate(form=>{
   const data=window.ExaminaOfflineLemmatizer.currentData(),
    row=data.rows.lat.find(x=>x[1]===form&&x[3]===2),
    review=window.ExaminaTeacherReview;
   return {approved:review.evidenceApproved('lat1',row),
    verified:review.evidenceState(row[3]),
    eligible:review.approvedExamForms(data,'lat1',10).some(x=>x.form===form),
    bankSource:row[3],
    key:review.evidenceKey('lat1',row)};
  },form);
  assert.equal(status.approved,true);
  assert.equal(status.verified,'propuesta','La aprobación no debe convertir el banco en verificado');
  assert.equal(status.bankSource,2);
  assert.equal(status.eligible,true);
  // Simular un ítem ya incluido en el borrador para comprobar revocación
  // y exportación, sin regenerar ni modificar otros ejercicios.
  await page.evaluate(({key,form})=>{
   const paper=document.getElementById('paper'),sheet=paper.querySelector('.exam-sheet');
   const element=document.createElement('i');
   element.textContent=form;
   element.dataset.academicKey=encodeURIComponent(key);
   element.dataset.academicForm=encodeURIComponent(form);
   const holder=document.createElement('p');holder.id='academicEvidenceFixture';
   holder.append(element);sheet.append(holder);
  },{key:status.key,form});
  assert.equal(await page.evaluate(()=>window.ExaminaTeacherReview.evidenceCheckExam(
   document.getElementById('paper'),'lat1').ok),true);
  const revoke=page.locator('#academicEvidenceRows .evidence-card').first()
   .getByRole('button',{name:'Revocar autorización'});
  await revoke.click();
  await page.waitForFunction(()=>document.querySelector('#academicEvidenceRows .evidence-card button')?.textContent.includes('Autorizar'));
  assert.equal(await page.evaluate(()=>window.ExaminaTeacherReview.evidenceCheckExam(
   document.getElementById('paper'),'lat1').ok),false,'La revocación debe invalidar un ítem existente');
  await page.locator('#docx').click();
  assert.match(await page.locator('#academicEvidenceSummary').innerText(),/Exportación bloqueada/);
  assert.deepEqual(errors,[],'Errores JavaScript en la interfaz de evidencias');
  console.log('Evidencia en Chromium: autorización explícita, persistencia local, no promoción, revocación y bloqueo DOCX.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
