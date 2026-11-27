'use strict';
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const decl='latin4-nominal-decl',stem='latin4-nominal-stem',table='latin4-nominal-table';
const kinds=[decl,stem,table];
const body=kind=>'#paper [data-latin4-nominal-body="'+kind+'"]';
const key=kind=>'#answerkey > ol > li[data-exam-kind="'+kind+'"]';
const menu=kind=>'#examQuestionMenus [data-question="'+kind+'"]';

async function check(browser,file){
 const page=await browser.newPage({viewport:{width:1200,height:950}});
 page.setDefaultTimeout(10000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const change=(id,value)=>page.locator('#'+id).evaluate((el,next)=>{
  el.value=next;el.dispatchEvent(new Event('change',{bubbles:true}));
 },value);
 const unit=number=>page.evaluate(number=>{
  const boxes=[...document.querySelectorAll('#unitChoices .unit-choice')];
  for(const input of boxes)input.checked=units[+input.value]==='UD'+number;
  boxes.find(input=>input.checked).dispatchEvent(new Event('change',{bubbles:true}));
 },number);
 const toggle=(kind,checked)=>page.locator(menu(kind)+' .exam-question-toggle').evaluate((el,checked)=>{
  el.checked=checked;el.dispatchEvent(new Event('change',{bubbles:true}));
 },checked);
 const prompts=kind=>page.locator(body(kind)+' [data-latin4-noun] > i').allTextContents();
 const rows=()=>page.locator(body(table)+' tbody tr').evaluateAll(nodes=>nodes.map(tr=>({
  lemma:tr.dataset.lemma,case:tr.dataset.case,number:tr.dataset.number,gender:tr.dataset.gender,
  blank:tr.cells[1].textContent===''
 })));
 try{
  await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href);
  assert.equal(await page.locator('[data-question^="latin4-nominal-"]').count(),0,'Latín I');
  await change('course','latin4');
  await unit(1);
  assert.equal(await page.locator(menu(decl)).count(),1);
  for(const kind of [stem,table])assert.equal(await page.locator(menu(kind)).count(),0,'UD1');
  await toggle(decl,true);
  assert.equal((await prompts(decl)).length,6);
  assert((await page.locator(key(decl)+' ol li').allTextContents()).every(answer=>/1ª declinación/.test(answer)));
  await toggle(decl,false);
  await unit(5);
  for(const kind of kinds){
   assert.equal(await page.locator(menu(kind)).count(),1);
   assert.equal(await page.locator(body(kind)).count(),0);
   assert(!await page.locator(menu(kind)+' .exam-question-toggle').isChecked());
  }
  await page.evaluate(()=>{
   const paper=$('paper');
   const sentence=paper.querySelector('[data-sentence-slot]');
   sentence.textContent='Oratio magistri.';
   window.preservedLatin4=[
    sentence,paper.querySelector('[data-exam-kind="forms"].exam-question'),
    paper.querySelector('#answerkey > ol > li[data-exam-kind="forms"]')
   ];
   window.originalLatin4Scores=[...paper.querySelectorAll('.exam-question-points')].map(node=>node.textContent);
  });
  for(const kind of kinds)await toggle(kind,true);
  assert.deepEqual(await prompts(decl),['hostis, −is','tabula, −æ','oppidum, −i','puer, −i','flumen, fluminis','aula, −æ']);
  assert.deepEqual(await prompts(stem),['mare, −is','onus, oneris','plebs, plebis','mens, mentis','mulier, mulieris','civis, −is']);
  // Compare the same alphabetic list hierarchy in the preview, native print
  // and the detached PDF document (with the user-defined indentation shift).
  const checkIndent=async()=>page.evaluate(({stem,table})=>{
   const signature=(root,selector)=>{
    const list=root.querySelector(selector),li=list.querySelector('li'),word=li.querySelector('i');
    const ls=getComputedStyle(list),is=getComputedStyle(li);
    const sheet=list.closest('.exam-sheet');
    return [ls.marginLeft,ls.paddingLeft,is.marginLeft,is.paddingLeft,is.textIndent,
     Math.round(word.getBoundingClientRect().left-sheet.getBoundingClientRect().left)];
   };
   const forms='p.exam-question[data-exam-kind="forms"] + ol.task';
   const nominal='[data-latin4-nominal-body="'+stem+'"] > ol.task';
   const paper=$('paper'),previous=paper.style.getPropertyValue('--exam-indent-shift');
   try{
    paper.style.setProperty('--exam-indent-shift','9pt');
    const preview=[signature(paper,forms),signature(paper,nominal)];
    const stage=window.ExaminaPdfExport.prepareDocument();
    stage.style.position='absolute';stage.style.left='-10000px';
    document.body.append(stage);
    let pdf;
    try{pdf=[signature(stage,forms),signature(stage,nominal)]}finally{stage.remove()}
    const solutions=kind=>paper.querySelector('#answerkey > ol > li[data-exam-kind="'+kind+'"] > ol');
    const keyIndent=list=>[getComputedStyle(list).marginLeft,getComputedStyle(list).paddingLeft];
    const wordIndent=list=>wordBlock(list).match(/<w:(?:ind|numPr)(?:[ >])[\s\S]*?(?:\/>|<\/w:numPr>)/)?.[0];
    return {preview,pdf,keys:['forms',stem,table].map(kind=>keyIndent(solutions(kind))),
     word:[wordIndent(paper.querySelector(forms)),wordIndent(paper.querySelector(nominal))],
     wordKeys:['forms',stem,table].map(kind=>wordIndent(solutions(kind)))};
   }finally{paper.style.setProperty('--exam-indent-shift',previous)}
  },{stem,table});
  const assertIndent=async()=>{
   const result=await checkIndent();
   for(const [a,b] of [result.preview,result.pdf,result.word])assert.deepEqual(a,b);
   assert(result.word[0]?.includes('w:left="'));
   assert(result.wordKeys[0]?.includes('w:numPr'));
   for(const [a,b,c] of [result.keys,result.wordKeys]){
    assert.deepEqual(a,b);assert.deepEqual(a,c);
   }
  };
  await assertIndent();
  await page.setViewportSize({width:390,height:844});
  await assertIndent();
  await page.setViewportSize({width:1200,height:950});
  await page.emulateMedia({media:'print'});
  await assertIndent();
  await page.emulateMedia({media:'screen'});
  const stemKeys=await page.locator(key(stem)+' ol li').allTextContents();
  assert.deepEqual(stemKeys.map(answer=>answer.includes('tema en −i')),[true,false,false,true,false,true]);
  assert.match(stemKeys[2],/plēbēs de 5\.ª/);
  assert.equal(await page.locator('#latinThirdDeclensionAdjectives').isEnabled(),false);
  assert.equal((await rows()).length,6);
  assert((await rows()).every(row=>row.blank&&!row.gender));
  assert.equal(await page.evaluate(()=>{
   const word=latinThirdDeclensionPool(selectedUnits()).find(item=>item.lemma==='dux');
   return word.forms.find(form=>form.code==='ACC'&&form.number===0).answer.replace(/\p{M}/gu,'');
  }),'ducem');
  assert(await page.evaluate(()=>window.preservedLatin4.every(node=>node.isConnected)&&
   window.preservedLatin4[0].textContent==='Oratio magistri.'));
  const scores=await page.locator('#paper .exam-question:not([data-exam-kind^="latin4-nominal-"]) .exam-question-points').allTextContents();
  assert.deepEqual(scores,await page.evaluate(()=>window.originalLatin4Scores));
  const before=await prompts(stem);
  await page.locator(menu(stem)+' [data-regenerate-question]').evaluate(button=>button.click());
  const after=await prompts(stem);
  assert.equal(new Set(after).size,6);
  assert(after.some(prompt=>!before.includes(prompt)));
  await assertIndent();
  assert(await page.evaluate(()=>window.preservedLatin4.every(node=>node.isConnected)));
  const originalTable=await rows();
  await page.locator(menu(table)+' [data-regenerate-question]').evaluate(button=>button.click());
  assert((await rows()).every(row=>!originalTable.some(old=>old.lemma===row.lemma)));

  await unit(6);
  await page.locator('#latinThirdDeclensionAdjectives').evaluate(input=>{
   input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const withAdj=await rows();
  assert.deepEqual(withAdj.filter(row=>row.gender).map(row=>row.lemma),['fortis']);
  const nounIndex=withAdj.findIndex(row=>!row.gender);
  const replace=page.locator('[data-regenerate-third-declension="'+nounIndex+'"]');
  assert(await replace.isEnabled());
  await replace.evaluate(button=>button.click());
  const replaced=await rows();
  assert.notEqual(replaced[nounIndex].lemma,withAdj[nounIndex].lemma);
  assert.deepEqual(replaced.filter((_,i)=>i!==nounIndex),withAdj.filter((_,i)=>i!==nounIndex));

  await change('lang','va');
  assert.match(await page.locator(key(decl)).innerText(),/declinació.*(masculí|femení|neutre)/s);
  const savedRows=await rows();
  const draft=await page.evaluate(()=>window.ExaminaUnifiedCurrentExam());
  await toggle(table,false);
  await page.evaluate(draft=>{examSelectionCache.clear();window.ExaminaUnifiedRestoreDraft(draft)},draft);
  assert(await page.locator(menu(table)+' .exam-question-toggle').isChecked());
  assert.deepEqual(await rows(),savedRows);
  await assertIndent();
  const exported=await page.evaluate(async()=>{
   const read=async id=>{
    const previous=downloadBlob;
    let blob;
    try{downloadBlob=(_name,file)=>{blob=file};$(id).click()}
    finally{downloadBlob=previous}
    return blob.text();
   };
   const student=await read('docx'),teacher=await read('docxAnswers');
   const pdf=window.ExaminaPdfExport.prepareDocument();
   return {
    student:student.includes('declinació')&&student.includes('Forma demanada')&&!student.includes('Solucionari orientatiu'),
    teacher:teacher.includes('Solucionari orientatiu')&&teacher.includes('tema en consonant'),
    pdf:pdf.querySelectorAll('[data-latin4-nominal-body]').length===3&&!pdf.querySelector('#answerkey')
   };
  });
  assert(Object.values(exported).every(Boolean),JSON.stringify(exported));
  await unit(4);
  assert.equal(await page.locator(body(table)+','+body(stem)).count(),0);
  assert((await page.locator(key(decl)+' ol li').allTextContents()).every(answer=>!answer.includes('3a declinació')));
  await change('course','greek1');
  assert.equal(await page.locator('[data-question^="latin4-nominal-"],[data-latin4-nominal-body]').count(),0);
  assert.deepEqual(errors,[]);
  console.log(file+': tres preguntas opcionales, unidades, regeneración, borradores y exportaciones');
 }finally{await page.close()}
}

(async()=>{
 const engine=process.env.EXAM_TEST_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch();
 try{for(const file of ['index.html','offline.html'])await check(browser,file)}
 finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
