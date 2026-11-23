'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');

async function configure(page,course,model,text,count){
 await page.evaluate(({course,model,text,count})=>{
  for(const [id,value] of [['course',course],['model',model],['lang','es']]){
   const control=document.getElementById(id);
   control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const unit=course==='greek1'?'UD8':'UD3';
  const unitsControls=[...document.querySelectorAll('#unitChoices .unit-choice')];
  for(const checkbox of unitsControls)checkbox.checked=units[Number(checkbox.value)]===unit;
  unitsControls.find(checkbox=>checkbox.checked)?.dispatchEvent(new Event('change',{bubbles:true}));
  examQuestionChoiceState[course+'/'+model+'/sent']=true;
  if(count)document.getElementById('count-sent').value=String(count);
  const editor=document.getElementById('newSentences');
  editor.value=text;
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  generate();
 },{course,model,text,count});
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

  if(live){
   const results=await page.evaluate(async()=>{
    const phrases=[['Puella','laeta','est'],['Panem','est'],['Est']];
    const answers=await queryExamReader('Collatinus',phrases.map(words=>({
     words,index:words.length-1,plainClause:true
    })));
    const greek=await queryExamReader('Eulexis',[{words:['τίς'],index:0}]);
    return {latin:answers.map(answer=>answer.readings.find(row=>row.lid===answer.preferred)?.lemme||null),
     greek:greek[0].readings.some(row=>row.exact&&row.lemme.startsWith('τίς'))};
   });
   assert.deepEqual(results.latin.map(word=>word?.normalize('NFD').replace(/\p{M}/gu,'').split(',')[0]||null),
    ['sum','edo',null]);
   assert(results.greek,'Eulexis debe devolver la lectura literal del interrogativo');
  }else{
   await configure(page,'latin1','mixto','Puella laeta est.\nPanem est.\nEst.');
   await page.evaluate(()=>{
    window.contextQueries=0;
    window.queryExamReader=async (reader,jobs)=>{
     window.contextQueries++;
     return jobs.map(({words})=>({preferred:words.includes('laeta')?1:words.includes('Panem')?2:null,
      readings:[{lid:1,lemme:'sum'},{lid:2,lemme:'edō'}]}));
    };
   });
   const glossary=page.locator('#examSentenceGlossary');
   const trigger=glossary.getByRole('button',{name:'Proponer lecturas con Collatinus'});
   const dialog=page.locator('#examContextGlossDialog');
   await trigger.click();
   await dialog.getByRole('status').filter({hasText:'2 propuestas'}).waitFor();
   assert.equal(await glossary.locator('.exam-gloss-selected').count(),0);
   for(const [context,prefix] of [['Puella laeta est','sum'],['Panem est','edō']]){
    const selected=dialog.locator('label').filter({hasText:context}).locator(':checked');
    assert.match(await selected.textContent(),new RegExp('^'+prefix,'iu'));
   }
   await dialog.getByRole('button',{name:'Cerrar'}).click();
   await trigger.click();
   await dialog.getByRole('status').filter({hasText:'2 propuestas'}).waitFor();
   assert.equal(await page.evaluate(()=>window.contextQueries),1,'Reabrir debe reutilizar el análisis');
   await dialog.getByRole('button',{name:'Aplicar lecturas seleccionadas'}).click();
   assert.equal(await glossary.locator('.exam-gloss-selected .exam-review-line').count(),2);
   assert.equal(await glossary.locator('.exam-gloss-lemma').count(),1,'Est sin contexto debe quedar pendiente');
   await page.evaluate(()=>{
    const candidate={entry:'τίς, τί',lemma:'τίς'};
    const row={candidates:[candidate,{entry:'τις, τι',lemma:'τις'}]};
    const proposal=preferredExamReading(row,{readings:[{lemme:'τίς',exact:true},{lemme:'τις',exact:false}]},true);
    if(proposal!==candidate)throw Error('La consulta griega perdió los diacríticos');
    if(preferredExamReading(row,{readings:[{lemme:'τίς',exact:true},{lemme:'τις',exact:true}]},true))
     throw Error('Se ha ocultado una ambigüedad griega');
   });
  }
  if(!live){
   await configure(page,'greek1','complete','δια.');
   await page.evaluate(()=>{
    window.ExaminaEulexisLocal.load=async()=>({rows:[
     {form:'δια',lemma:'διά'},{form:'δια',lemma:'Ζεύς'}
    ]});
    window.queryExamReader=async()=>{throw Error('La copia instalada debe evitar la red')};
   });
   await page.getByRole('button',{name:'Proponer lecturas con Eulexis'}).click();
   const dialog=page.locator('#examContextGlossDialog');
   await dialog.getByRole('status').filter({hasText:'0 propuestas'}).waitFor();
   assert(await dialog.getByRole('button',{name:'Aplicar lecturas seleccionadas'}).isDisabled());
   await dialog.getByRole('button',{name:'Cerrar'}).click();
   await page.evaluate(()=>{
    window.queryExamReader=async reader=>reader==='Collatinus'?
     [{lemme:'lupus',school:{entry:'lupus, –i',category:'noun',complete:true},trad:'lobo',lang:'es'}]:
     [{lemme:'κροκόδειλος, -ου (ὁ)',trad:'cocodrilo',lang:'es'}];
   });
  }

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
   if(course==='latin1'&&!live)assert.equal(seen.length,initialNetwork,'El arranque y el análisis local no consultan en línea');
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
   for(const [course,model,text,reader,citation] of [
    ['latin1','mixto','Puella laeta est.\nPanem est.\nPuella lupum videt.','Collatinus',/l[uŭū]pus/i],
    ['greek1','complete','κροκόδειλον βλέπει.','Eulexis',/κροκ[όο]δειλος/i]
   ]){
    await configure(page,course,model,text,text.split('\n').length);
    const applied=await page.evaluate(()=>{examGlossDecisions={};refreshSentenceGlossary();
     return currentExamGlossTargets(true).size});
    assert(applied>0);
    await page.getByRole('button',{name:'Completar glosario con '+reader}).click();
    const dialog=page.locator('#examContextGlossDialog');
    const status=dialog.getByRole('status').filter({hasText:/lecturas aplicadas|No se pudo cargar/});
    await status.waitFor({timeout:35000});
    assert.match(await status.textContent(),new RegExp('^'+applied+' lecturas aplicadas'));
    await dialog.getByRole('button',{name:'Cerrar'}).click();
    const glossary=page.locator('#examSentenceGlossary');
    assert.match(await glossary.locator('.gloss-item').allTextContents().then(rows=>rows.join(' ')),citation);
    assert(await glossary.locator('.exam-gloss-selected .exam-review-line').filter({hasText:'(automático)'}).count()>0);
    if(course==='latin1'){
     const readings=await page.evaluate(()=>Object.entries(examGlossDecisions)
      .filter(([identity])=>identity.includes(',"est",'))
      .map(([identity,choice])=>[identity,examKey(choice.entry)]));
     assert(readings.some(([identity,lemma])=>identity.includes('Puella laeta est')&&lemma==='sum'));
     assert(readings.some(([identity,lemma])=>identity.includes('Panem est')&&lemma==='edo'));
    }
    assert.equal(await page.locator('#newSentences').inputValue(),text);
   }
   const downloads=seen.slice(initialNetwork).map(value=>new URL(value))
    .filter(url=>url.origin!==new URL(page.url()).origin);
   assert(downloads.some(url=>url.pathname.endsWith('/latin.js')));
   assert(downloads.some(url=>url.pathname.endsWith('/greek.js')));
   assert(downloads.every(url=>url.hostname==='raw.githubusercontent.com'&&!url.search&&
    /\/(?:latin\.js|greek\.js|modeles\.txt|lexique\.txt|extra\.json|regimen\.txt|tags\.txt|morph\.json|[fl]\/\d+\.txt)$/.test(url.pathname)));
  }else assert.equal(seen.length,initialNetwork);
  console.log('Consultas externas: propuesta explícita, borradores y exportación sin perder separación.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
