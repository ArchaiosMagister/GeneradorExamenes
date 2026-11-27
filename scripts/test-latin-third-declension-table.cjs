'use strict';
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const engine=process.env.EXAM_TEST_BROWSER==='webkit'?webkit:chromium;
const files=['index.html','offline.html'];
const table='#paper [data-third-declension-table]';
const rows=table+' tbody tr';
const answers='#examinaInternalAnswers [data-third-declension-answer]';
const button='[data-regenerate-third-declension="0"]';

async function change(page,id,value){
 await page.locator('#'+id).evaluate((control,next)=>{
  control.value=next;
  control.dispatchEvent(new Event('change',{bubbles:true}));
 },value);
}
async function selectUnit(page,number){
 await page.evaluate(n=>{
  let marked;
  for(const input of document.querySelectorAll('.unit-choice')){
   input.checked=units[+input.value]==='UD'+n;
   if(input.checked)marked=input;
  }
  marked.dispatchEvent(new Event('change',{bubbles:true}));
 },number);
}
const taskRows=page=>page.locator(rows).evaluateAll(items=>items.map(tr=>({
 lemma:tr.dataset.lemma,request:[tr.dataset.case,tr.dataset.number,tr.dataset.gender],
 prompt:tr.cells[0].textContent,blank:!tr.cells[1].textContent
})));
const keyRows=page=>page.locator(answers).allTextContents();

async function check(browser,file){
 const page=await browser.newPage({viewport:{width:1100,height:950}});
 page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href);
  await change(page,'model','morf');
  await selectUnit(page,3);
  assert.equal(await page.locator('#latinThirdDeclensionEnabled').count(),0);
  await selectUnit(page,4);
  assert.equal(await page.locator(table).count(),0);
  await page.locator('#examPanelShortcuts > [data-target="examQuestionSettings"]').click();
  await page.locator('[data-question="decl"] summary').click();
  await page.evaluate(()=>{
   window.preservedNodes=[
    $('paper').querySelector('[data-syntagm-slot] > i'),
    $('paper').querySelector('.reference-verb-table tbody td:last-child'),
    document.querySelector('#examinaInternalAnswers #answerkey li[data-morph-kind="verb"] p')
   ];
   window.preservedNodes.forEach((node,i)=>node.textContent='Edición docente '+i);
  });
  await page.locator('#latinThirdDeclensionEnabled').check();
  assert.equal(await page.locator('#latinThirdDeclensionAdjectives').isVisible(),false);
  const before=await taskRows(page),beforeKey=await keyRows(page);
  assert.equal(before.length,10);
  assert.equal(beforeKey.length,10);
  assert.equal(new Set(before.map(row=>row.lemma)).size,10);
  assert(before.every(row=>row.blank&&!row.request[2]&&/\([mfn]\.(?: o f\.)?\)$/.test(row.prompt)));
  assert.deepEqual(new Set(before.map(row=>row.request[0])),new Set(['NOM','ACC','GEN','DAT','ABL']));
  await page.locator(button).click();
  const after=await taskRows(page),afterKey=await keyRows(page);
  assert.notEqual(after[0].lemma,before[0].lemma);
  assert.deepEqual(after[0].request,before[0].request);
  assert.deepEqual(after.slice(1),before.slice(1));
  assert(afterKey[0].startsWith(after[0].prompt+' — '));
  assert.deepEqual(afterKey.slice(1),beforeKey.slice(1));
  assert(await page.evaluate(()=>window.preservedNodes.every((node,i)=>node.isConnected&&node.textContent==='Edición docente '+i)));
  assert.equal(await page.locator('#paper .exam-question[data-morph-kind="decl"]').count(),1);
  await page.locator('#latinThirdDeclensionEnabled').uncheck();
  assert.equal(await page.locator(table).count(),0);
  assert(await page.evaluate(()=>window.preservedNodes.every(node=>node.isConnected)));
  await page.locator('#latinThirdDeclensionEnabled').check();
  assert.deepEqual(await taskRows(page),after);

  await selectUnit(page,5);
  assert((await taskRows(page)).every(row=>!row.request[2]));
  await page.locator('#latinThirdDeclensionAdjectives').check();
  await change(page,'latinThirdDeclensionCount','20');
  const mixed=await taskRows(page);
  assert.equal(mixed.length,20);
  assert.equal(mixed.filter(row=>row.request[2]).length,5);
  assert.equal(await page.locator('[data-regenerate-third-declension]:disabled').count(),0);
  const adjIndex=mixed.findIndex(row=>row.request[2]);
  await page.locator('[data-regenerate-third-declension="'+adjIndex+'"]').click();
  const replacement=(await taskRows(page))[adjIndex];
  assert.notEqual(replacement.lemma,mixed[adjIndex].lemma);
  assert.deepEqual(replacement.request,mixed[adjIndex].request);
  assert.equal(await page.locator('[data-regenerate-third-declension]:disabled').count(),0);
  await change(page,'lang','va');
  assert.match(await page.locator(table).innerText(),/Completa la taula.*Forma demanada\s+Resposta/s);
  const saved=await page.evaluate(()=>window.ExaminaUnifiedCurrentExam());
  const savedRows=await taskRows(page);
  await page.locator('#latinThirdDeclensionEnabled').uncheck();
  await page.evaluate(draft=>{examSelectionCache.clear();window.ExaminaUnifiedRestoreDraft(draft)},saved);
  assert(await page.locator('#latinThirdDeclensionEnabled').isChecked());
  assert(await page.locator('#latinThirdDeclensionAdjectives').isChecked());
  assert.equal(await page.locator('#latinThirdDeclensionCount').inputValue(),'20');
  assert.deepEqual(await taskRows(page),savedRows);
  await page.locator(button).click();
  assert.notEqual((await taskRows(page))[0].lemma,savedRows[0].lemma);
  assert.deepEqual((await taskRows(page)).slice(1),savedRows.slice(1));

  const exportResult=await page.evaluate(async()=>{
   const readWord=async id=>{
    const previous=downloadBlob;
    let blob;
    try{downloadBlob=(_name,file)=>{blob=file};$(id).click()}
    finally{downloadBlob=previous}
    return blob.text();
   };
   const student=await readWord('docx');
   const printed=window.ExaminaPdfExport.prepareDocument();
   return {
    student:/<w:tbl>.*Forma demanada.*Resposta.*<\/w:tbl>/s.test(student)&&!student.includes('Solucionari orientatiu'),
    wordNoControl:!student.includes('Regenera la fila'),
    pdf:printed.querySelectorAll('[data-third-declension-table] tbody tr').length===20&&
     !printed.querySelector('#answerkey,[data-regenerate-third-declension]')
   };
  });
  assert(Object.values(exportResult).every(Boolean),file+' '+JSON.stringify(exportResult));
  await selectUnit(page,4);
  assert((await taskRows(page)).every(row=>!row.request[2]));
  await change(page,'model','tablas');
  assert.equal(await page.locator(table).count(),0);
  assert.equal(await page.locator('#latinThirdDeclensionEnabled').count(),0);
  assert.deepEqual(errors,[]);
  console.log(file+': UD4, UD5, regen. por filas, borradores, valenciano, Word y PDF');
 }finally{await page.close()}
}

(async()=>{
 const browser=await engine.launch();
 try{for(const file of files)await check(browser,file)}
 finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
