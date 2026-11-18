'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');

async function configure(page,course,model,text){
 await page.evaluate(({course,model,text})=>{
  for(const [id,value] of [['course',course],['model',model],['lang','es']]){
   const control=document.getElementById(id);
   control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const unit=course==='greek1'?'UD8':'UD3';
  const unitsControls=[...document.querySelectorAll('#unitChoices .unit-choice')];
  for(const checkbox of unitsControls)checkbox.checked=units[Number(checkbox.value)]===unit;
  unitsControls.find(checkbox=>checkbox.checked)?.dispatchEvent(new Event('change',{bubbles:true}));
  examQuestionChoiceState[course+'/'+model+'/sent']=true;
  const editor=document.getElementById('newSentences');
  editor.value=text;
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  generate();
 },{course,model,text});
}

(async()=>{
 const engine=process.env.EXAM_TEST_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true});
 const live=process.env.EXAM_LIVE_READERS==='1';
 try{
  const page=await browser.newPage({viewport:{width:1180,height:880}});
  const seen=[],failures=[];
  page.on('request',request=>{if(/^https?:/.test(request.url()))seen.push(request.url())});
  page.on('requestfailed',request=>{if(/^https?:/.test(request.url()))failures.push(request.failure()?.errorText)});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href);
  await page.waitForFunction(()=>!!document.getElementById('examPreviewActions')&&!!window.ExaminaOfflineLemmatizer.currentData());
  const initialNetwork=seen.length;
  if(!live)await page.evaluate(()=>{
   window.queryExamReader=async reader=>reader==='Collatinus'?
    [{lemme:'lupus',school:{entry:'lupus, –i',category:'noun',complete:true},trad:'lobo',lang:'es'}]:
    [{lemme:'κροκόδειλος, -ου (ὁ)',trad:'cocodrilo',lang:'es'}];
  });

  for(const [course,model,text,word,reader,choice,translation] of [
   ['latin1','mixto','Puella lupum videt.','lupum','Collatinus',/l[uŭū]pus/i,'lobo'],
   ['greek1','complete','κροκόδειλον βλέπει.','κροκόδειλον','Eulexis',/κροκ[όο]δειλος/i,'cocodrilo']
  ]){
   await configure(page,course,model,text);
   const glossary=page.locator('#examSentenceGlossary');
   const lookup=glossary.getByRole('button',{name:`Consultar ${word} en ${reader}`,exact:true});
   assert.equal(await glossary.getByRole('button',{name:/Consultar Puella/}).count(),0);
   const before=await glossary.locator('.gloss-item').filter({hasText:translation}).count();
   assert.equal(before,0);
   if(course==='latin1')assert.equal(seen.length,initialNetwork,'El arranque y el análisis local no consultan en línea');
   assert.equal(await lookup.count(),1,`${reader}: falta consulta para ${word} ·
    ${await glossary.count()?await glossary.textContent():'No se generó glosario'}`);
   await lookup.click();
   const dialog=page.getByRole('dialog');
   await dialog.getByRole('status').filter({hasText:'Cargando el léxico'}).waitFor({state:'hidden',timeout:30000});
   const options=await dialog.locator('option').allTextContents();
   const index=options.findIndex(text=>choice.test(text));
   assert(index>=0,`${reader}: ${await dialog.getByRole('status').textContent()} · ${options.join(' / ')} · ${failures.join(', ')}`);
   await dialog.locator('select').selectOption({index});
   if(reader==='Collatinus'){
    assert.equal(await dialog.locator('#externalGlossEntry').inputValue(),'lupus, –i');
    await dialog.locator('#externalGlossEntry').fill('lupus');
    assert(await dialog.getByRole('button',{name:'Añadir al glosario'}).isDisabled());
    await dialog.locator('#externalGlossEntry').fill('lupus, –i');
   }
   if(reader==='Eulexis')assert(await dialog.locator('#externalGlossMeaning').inputValue());
   await dialog.locator('#externalGlossMeaning').fill(translation);
   assert.equal(await glossary.locator('.gloss-item').filter({hasText:translation}).count(),0,
    'Propuesta externa aplicada antes de confirmarla');
   await dialog.getByRole('button',{name:'Añadir al glosario'}).click();
   assert.equal(await glossary.locator('.gloss-item').filter({hasText:translation}).count(),1);
   const saved=await page.evaluate(()=>window.ExaminaUnifiedCurrentExam());
   assert.equal(Object.values(saved.externalGloss)[0].source,reader.toLowerCase());
   await glossary.getByRole('button',{name:'Cambiar',exact:true}).click();
   assert.equal(await glossary.locator('.gloss-item').filter({hasText:translation}).count(),0);
   await page.evaluate(data=>{
    window.ExaminaUnifiedRestoreDraft(data);refreshSentenceGlossary();
   },saved);
   assert.equal(await glossary.locator('.gloss-item').filter({hasText:translation}).count(),1,
    'El borrador transporta la elección sin consultar otra vez');
   const exportCheck=await page.evaluate(()=>{
    const gloss=document.querySelector('#examSentenceGlossary');
    const pdf=window.ExaminaPdfExport.prepareDocument();
    document.body.append(pdf);
    try{
     const clone=pdf.querySelector('#examSentenceGlossary'),before=parseFloat(getComputedStyle(gloss).marginTop);
     return {word:wordBlock(gloss),before,pdfBefore:parseFloat(getComputedStyle(clone).marginTop),pdf:clone.textContent};
    }finally{pdf.remove()}
   });
   assert(exportCheck.word.includes(translation)&&exportCheck.pdf.includes(translation));
   assert(!/Consultar|Cambiar/.test(exportCheck.word+exportCheck.pdf));
   assert(exportCheck.before>20,'Falta el margen entre la última oración y el vocabulario');
   assert.equal(exportCheck.pdfBefore,exportCheck.before,'El PDF debe conservar la separación del glosario');
   assert(exportCheck.word.includes('w:before="'+Math.round(exportCheck.before*15)+'"'),
    'Word debe conservar la separación en unidades equivalentes');
  }
  await page.evaluate(()=>{
   $('lang').value='va';$('lang').dispatchEvent(new Event('change',{bubbles:true}));
   $('newSentences').value='κροκόδειλον βλέπει καί.';
   $('newSentences').dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.getByRole('button',{name:'Consulta κροκόδειλον en Eulexis',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Traducció (valencià)',{exact:true}).waitFor();
  assert(await dialog.locator('#externalGlossMeaning').inputValue(),
   'La glosa de Eulexis debe aparecer en el campo editable');
  await dialog.getByRole('button',{name:'Tancar',exact:true}).click();
  const short=await page.evaluate(()=>[
   externalCitationForExam('duco, duxi, ductum (3ª)','latin4',['UD5']),
   externalCitationForExam('duco, duxi, ductum (3ª)','latin4',['UD6']),
   externalCitationForExam('duco, duxi, ductum (3ª)','latin1',['UD3']),
   externalCitationForExam('duco, duxi, ductum (3ª)','latin1',['UD4'])
  ]);
  assert.deepEqual(short,['duco (3ª)','duco, duxi, ductum (3ª)','duco (3ª)','duco, duxi, ductum (3ª)']);
  if(live){
   const sample=await page.evaluate(async()=>{
    const cases=['duco','civitas','bonus','ille','felix','fortis'];
    return Object.fromEntries(await Promise.all(cases.map(async word=>
     [word,(await queryExamReader('Collatinus',word)).map(result=>result.school?.entry)])));
   });
   for(const [word,citation] of Object.entries({
    duco:'duco, duxi, ductum (3ª)',civitas:'civitas, civitatis (f.)',
    bonus:'bonus, bona, bonum',ille:'ille, illa, illud (pron.)',
    felix:'felix, felix, felix',fortis:'fortis, fortis, forte'
   }))assert(sample[word].includes(citation),word+': '+sample[word].join(' | '));
   const downloads=seen.slice(initialNetwork).map(value=>new URL(value));
   assert(downloads.some(url=>url.pathname.endsWith('/latin.js')));
   assert(downloads.some(url=>url.pathname.endsWith('/greek.js')));
   assert(downloads.every(url=>url.hostname==='raw.githubusercontent.com'&&!url.search&&
    /\/(?:latin\.js|greek\.js|modeles\.txt|lexique\.txt|extra\.json|regimen\.txt|morph\.json|[fl]\/\d+\.txt)$/.test(url.pathname)));
  }else assert.equal(seen.length,initialNetwork);
  console.log('Consultas externas: propuesta explícita, borradores y exportación sin perder separación.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
