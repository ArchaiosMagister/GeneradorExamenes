// Browser smoke test for the current Greek I syllabus and both visible models.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

async function check(browser,file){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(pathToFileURL(path.resolve(file)).href);
  await page.selectOption('#course','greek1');
  assert.equal(await page.inputValue('#model'),'complete');
  assert.deepEqual(await page.locator('#model option').evaluateAll(options=>options.map(option=>option.value)),
   ['complete','morphology']);
  const shownUnits=await page.locator('#unitChoices .unit-choice').evaluateAll(inputs=>
   inputs.map(input=>units[Number(input.value)]));
  assert.deepEqual(shownUnits,Array.from({length:14},(_,index)=>'UD'+(index+1)));

  for(const model of ['complete','morphology']){
   await page.selectOption('#model',model);
   for(const chosen of [['UD3','UD4'],['UD6','UD7'],['UD1','UD3','UD4','UD6','UD7'],['UD14']]){
    const state=await page.evaluate(chosen=>{
     const inputs=[...document.querySelectorAll('#unitChoices .unit-choice')];
     for(const input of inputs)input.checked=chosen.includes(units[Number(input.value)]);
     inputs.find(input=>input.checked).dispatchEvent(new Event('change',{bubbles:true}));
     return {
      selected:greekMarkedUnits(),
      max:greekLimit(),
      sheets:document.querySelectorAll('#paper .exam-sheet').length,
      morphology:document.querySelectorAll('#paper [data-analysis-slot]').length,
      sentences:document.querySelectorAll('#paper .exam-question[data-greek-kind="sentences"]').length
     };
    },chosen);
    assert.deepEqual(state.selected,chosen);
    assert.equal(state.max,Math.max(...chosen.map(unit=>Number(unit.slice(2)))));
    assert.equal(state.sheets,1);
    if(model==='morphology'){
     assert(state.morphology>0);
     assert.equal(state.sentences,0);
    }
   }
  }

  await page.selectOption('#model','complete');
  await page.selectOption('#lang','va');
  assert.match(await page.locator('#model option:checked').textContent(),/Examen complet$/);
  await page.selectOption('#lang','es');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#examQuestionsTab').click();
  assert(await page.locator('#examQuestionMenus').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#examSettingsTab').click();
  for(const course of ['latin1','latin4','greek1']){
   await page.selectOption('#course',course);
   assert.equal(await page.locator('html').getAttribute('data-course'),course);
  }
  await page.reload();
  await page.selectOption('#course','greek1');
  assert.equal(await page.inputValue('#model'),'complete');
  assert.deepEqual(errors,[],file);
 }finally{
  await context.close();
 }
}

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  for(const file of ['index.html','offline.html'])await check(browser,file);
  console.log('Griego I: 14 unidades, dos modelos, selección efectiva, idioma y menú móvil comprobados en web y offline.');
 }finally{
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
