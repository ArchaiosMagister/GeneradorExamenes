const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
 try{
 const page=await browser.newPage({acceptDownloads:true}); const errors=[],network=[];
 page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 await page.route(/^https?:/,r=>r.abort());page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(process.env.APP_FILE||'index.html')).href);
 assert.deepEqual(errors,[]);assert.equal(await page.locator('#morphOptions').count(),1);
 async function choose(unit){await page.evaluate(unit=>{document.querySelectorAll('.unit-choice').forEach(e=>e.checked=examUnitNumber(units[+e.value])===unit);document.querySelector('.unit-choice:checked')?.dispatchEvent(new Event('change',{bubbles:true}));generate()},unit)}
 for(const course of ['latin1','greek1']){
  await page.selectOption('#course',course);await page.selectOption('#model',course==='greek1'?'morphology':'morf');
  for(const unit of [1,4,7,8,10,14].filter(u=>course==='greek1'||u<=10)){
   await choose(unit);
   for(const [offer,answer,verbs,words] of [[3,2,7,8],[2,1,3,4],[1,9,2,2]]){
    await page.evaluate(({offer,answer,verbs,words})=>{ $('morphOffer').value=offer;$('morphDecline').value=answer;$('morphVerbs').value=verbs;$('morphWords').value=words;generate()}, {offer,answer,verbs,words});
    assert.equal(await page.locator('.exam-question').count(),3);
    const counts=await page.evaluate(()=>{const lang=currentCourse()==='greek1'?'grc':'lat',limit=lang==='grc'?greekLimit():Math.max(...selectedUnits().map(examUnitNumber));return {verbs:teacherItems(lang,limit,2,morphConfig().verbs).length,words:teacherItems(lang,limit,3,morphConfig().words).length}});
    assert.equal(await page.locator('.reference-morph-table:not(.exam-nouns) tbody tr').count(),counts.verbs);
    assert.equal(await page.locator('.reference-analysis-item').count(),counts.words);
    assert(await page.locator('#decl').isHidden());assert(await page.locator('#lexiconSettings').isHidden());
    assert.equal(await page.locator('#morphCategory-ptcp').isDisabled(),unit<10,course+' UD'+unit);
    assert.equal(await page.locator('#morphCategory-pro').isDisabled(),unit<(course==='greek1'?7:3));
    assert.equal(await page.locator('.exam-nouns').count(),Math.min(offer,answer));
    const result=await page.evaluate(()=>{const lang=currentCourse()==='greek1'?'grc':'lat',limit=currentCourse()==='greek1'?greekLimit():Math.max(...selectedUnits().map(examUnitNumber));return {cfg:morphConfig(), rows:teacherExamRows(lang,limit,3),limit,entries:teacherEntries(lang,limit)}});
    assert(result.cfg.decline<=result.cfg.offer);
    assert(result.rows.every(r=>r[3]<=unit));
    assert(result.rows.every(r=>!r[2].includes('PTCP')||unit>=10));
    assert(result.rows.every(r=>!r[2].includes('PRO')||unit>=(course==='greek1'?7:3)));
    assert(!await page.locator('#paper .final-gloss').count());
   }
  }
  await page.evaluate(()=>{document.querySelectorAll('[id^="morphCategory-"]').forEach(e=>e.checked=false);generate()});
  assert.equal(await page.locator('.reference-analysis-item').count(),0);
  await page.evaluate(()=>{document.querySelectorAll('[id^="morphCategory-"]').forEach(e=>e.checked=true);generate()});
  for(const id of ['docx','docxAnswers']){
   const pending=page.waitForEvent('download');await page.evaluate(id=>document.getElementById(id).click(),id);
   const download=await pending;await download.saveAs('/private/tmp/'+course+'-fixed-'+id+'.docx');
  }
 }
 assert.equal(await page.evaluate(()=>allowedProperNounForm('Ἀθηνᾶ','N;NOM;PL')),false);
 assert.equal(await page.evaluate(()=>allowedProperNounForm('Caesar','N;NOM;PL')),false);
 await page.screenshot({path:'/private/tmp/examina-morphology.png',fullPage:true});
 const lookup=await page.evaluate(()=>ExaminaMorphology.lookup('lat','puellae'));
 assert(lookup.length>=2,'ambiguous readings retained offline');
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 console.log('Morphology UI: Latin/Greek, UD gates, counts, proper nouns, empty categories, offline ambiguous lookup passed.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
