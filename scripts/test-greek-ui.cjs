// Offline browser regression suite. PLAYWRIGHT_PATH and BROWSER_PATH can point
// to existing installations; nothing installs packages or starts a Mac build.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try {
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.selectOption('#course','greek1');
  assert.equal(await page.inputValue('#model'),'complete');
  assert.equal(await page.locator('.unit-choice').count(),15);
  async function choose(us){await page.evaluate(us=>{document.querySelectorAll('.unit-choice').forEach(e=>e.checked=us.includes(units[+e.value]));generate()},us)}
  const out=process.env.TEST_OUTPUT_DIR||'/private/tmp/greek-v20-tests';fs.mkdirSync(out,{recursive:true});
  for(const mode of ['complete','analysis','morphology']){
   await page.selectOption('#model',mode);
   for(const us of [['UD3','UD4'],['UD6','UD7'],['UD1','UD3','UD4','UD6','UD7'],['UD14'],[]]){
    await choose(us);
    for(let n=0;n<20;n++){
     const r=await page.evaluate(()=>{generate();return {exam:greekLastExam,items:greekVerifiedCorpus,mode:greekModes[$('model').value],kinds:greekKinds}});
     assert.deepEqual(r.exam.chosen,us);assert.equal(r.exam.max,Math.max(-1,...us.map(x=>+x.slice(2))));
     const selected=r.items.filter(x=>r.exam.ids.includes(x.id));
     assert.equal(selected.length,r.exam.ids.length);
     assert(selected.every(x=>x.verified&&x.minUnit<=r.exam.max&&r.mode.points[r.kinds.indexOf(x.kind)]>0));
     const available=r.items.filter(x=>x.minUnit<=r.exam.max&&r.mode.points[r.kinds.indexOf(x.kind)]>0);
     for(const u of us.map(x=>+x.slice(2)))if(available.some(x=>x.contentUnits.includes(u)))assert(selected.some(x=>x.contentUnits.includes(u)),'coverage UD'+u);
     if(mode==='morphology')assert(!selected.some(x=>['sentences','etymology'].includes(x.kind)));
     if(mode==='analysis')assert(!selected.some(x=>['declension','conjugation','pronouns'].includes(x.kind)));
    }
   }
   await choose(['UD6','UD7']);
   const score=await page.evaluate(()=>greekLastExam.total);
   assert.equal(score,{complete:10,analysis:9,morphology:3.5}[mode]);
   for(const answers of [false,true]){
    const downloadPromise=page.waitForEvent('download');await page.click(answers?'#docxAnswers':'#docx');
    const download=await downloadPromise;await download.saveAs(path.join(out,mode+(answers?'-answers':'-student')+'.docx'));
   }
  }
  // The teacher header stays editable text; nouns and verbs are table headings.
  await page.selectOption('#model','complete');await choose(['UD3','UD4']);
  assert.equal(await page.locator('.exam-header table').count(),0);
  assert.equal(await page.locator('.exam-header > p').count(),2);
  assert.equal(await page.locator('.exam-nouns').count(),2);
  assert.equal(await page.locator('.exam-verbs').count(),1);
  assert.equal(await page.locator('.exam-verbs thead tr:first-child th[colspan="2"]').count(),2);
  assert.equal(await page.locator('.exam-page-break').count(),1);
  assert.equal(await page.locator('.exam-sheet .answer').count(),0);
  assert.match(await page.locator('.exam-header').textContent(),/UDs 3-4/);
  await page.emulateMedia({media:'print'});
  await page.pdf({path:path.join(out,'ud3-4-print.pdf'),preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'});
  const layoutDownload=page.waitForEvent('download');await page.click('#docx');await(await layoutDownload).saveAs(path.join(out,'ud3-4-layout.docx'));
  // Count below coverage requirement must expand rather than omit a unit.
  await page.selectOption('#model','complete');await page.fill('#count-verb','1');await page.fill('#count-sent','1');
  await choose(['UD3','UD4','UD5','UD6','UD7']);
  assert.deepEqual(await page.evaluate(()=>greekLastExam.missing),[]);
  await page.fill('#greek-points-sentences','4');await page.locator('#greek-points-sentences').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>greekLastExam.total),8);
  // Teacher vocabulary block availability, not arbitrary individual UD tags.
  const required=await page.evaluate(()=>({before:isRequired('δίκη',['UD3']),after:isRequired('δίκη',['UD4']),six:isRequired('βούλομαι',['UD6']),seven:isRequired('βούλομαι',['UD7'])}));
  assert.deepEqual(required,{before:false,after:true,six:false,seven:true});
  await page.locator('#group-drafts').evaluate(el=>el.open=true);
  page.on('dialog',dialog=>dialog.accept());
  await page.click('#saveDraft');const draft=await page.locator('#paper').innerHTML();await page.click('#generate');await page.click('#restoreDraft');assert.equal(await page.locator('#paper').innerHTML(),draft);
  await page.selectOption('#lang','va');assert.equal(await page.locator('#model option:checked').textContent(),'Examen complet');
  await page.selectOption('#lang','es');
  await page.screenshot({path:path.join(out,'greek-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,'greek-mobile.png'),fullPage:true});
  for(const course of ['latin1','latin4','greek1']){
   await page.selectOption('#course',course);assert.equal(await page.locator('html').getAttribute('data-course'),course);
   await page.click('#generate');
   const p=page.waitForEvent('download');await page.click('#docx');await(await p).saveAs(path.join(out,course+'.docx'));
  }
  assert.equal(await page.inputValue('#model'),'complete');
  await page.reload();await page.selectOption('#course','greek1');assert.equal(await page.inputValue('#model'),'complete');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('PASS: 300 randomized mode/unit runs, strict corpus/grammar, guaranteed available coverage, scores, drafts, languages, mobile, course colors, reference layout, print PDF and ten offline DOCX downloads.');
  console.log('Artifacts: '+out);
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
