'use strict';
// Regresión: UD5 griega, cuotas por clase e indentación docente en Word y vista previa.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

async function setup(page){
 await page.evaluate(()=>{
  const changed=id=>document.getElementById(id).dispatchEvent(new Event('change',{bubbles:true}));
  $('course').value='greek1';changed('course');
  $('model').value='morphology';changed('model');
  const unitsChoices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  unitsChoices.forEach(el=>el.checked=units[Number(el.value)]==='UD5');
  const focus=unitsChoices.find(el=>el.checked);
  assertUnit(focus);
  focus.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  generate();
  function assertUnit(input){if(!input)throw Error('Falta UD5 de Griego I')}
 });
 await page.waitForFunction(()=>!!document.querySelector('#paper .reference-morph-exam'));
}

async function testOne(browser,file,lang){
 const context=await browser.newContext({viewport:{width:1460,height:900},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(file)).href);
 await setup(page);
 if(lang==='va')await page.evaluate(()=>{$('lang').value='va';$('lang').dispatchEvent(new Event('change',{bubbles:true}));generate()});
 // Simular exactamente el selector del profesor: sustantivos, adjetivos, verbos.
 const result=await page.evaluate(()=>{
  for(const [kind,count] of [['nouns',2],['adjectives',1],['verbs',4],['pronouns',0]]){
   const input=$('quota-'+kind);
   if(!input)throw Error('No existe la cuota '+kind);
   input.value=String(count);input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  const slots=[...$('paper').querySelectorAll('[data-analysis-slot]')];
  const byId=id=>{
   if(/^gvf-/.test(id))return 'verbs';
   const original=greekVerifiedCorpus.find(x=>x.id===id);
   return original?examGreekWordClass(original):null;
  };
  const kinds=slots.map(x=>byId(x.dataset.corpusId));
  return {slots:slots.length,kinds,verbIds:slots.filter(x=>x.dataset.corpusId.startsWith('gvf-')).map(x=>x.dataset.corpusId),
   verbRows:slots.filter(x=>x.dataset.corpusId.startsWith('gvf-')).map(x=>x.querySelector('i')?.textContent),
   otherQuestion:!!$('paper').querySelector('.reference-verb-table'),
   warning:$('paper').querySelector('.exam-sheet>.hint')?.textContent||'',
   quotas:examMorphQuotaValues()};
 });
 assert.deepEqual(result.quotas,[2,1,4,0],file+'/'+lang+': cuotas alteradas');
 assert.equal(result.slots,7,file+'/'+lang+': el número de formas no coincide con las cuotas '+JSON.stringify(result));
 for(const [kind,count] of [['nouns',2],['adjectives',1],['verbs',4]])
  assert.equal(result.kinds.filter(x=>x===kind).length,count,file+'/'+lang+': faltan '+kind+': '+JSON.stringify(result));
 assert.equal(result.verbIds.length,4,'Las formas verbales no están contrastadas en el banco');
 assert(result.verbRows.every(Boolean),'Faltan formas verbales visibles');
 assert.equal(result.otherQuestion,true,'La modificación borró la pregunta de formas verbales');
 assert(!/Verbos: \d+ de 4/.test(result.warning),'Informa erróneamente de banco de verbos insuficiente');
 const visual=await page.evaluate(()=>{
  const heading=$('paper').querySelector('.exam-sheet > p.exam-question');
  const analysis=$('paper').querySelector('.reference-analysis-item');
  const before=parseFloat(getComputedStyle(heading).marginLeft);
  const originalSheet=$('paper').querySelector('.exam-sheet'),originalRow=analysis;
  $('examIndentPt').value='18';
  $('examIndentPt').dispatchEvent(new Event('change',{bubbles:true}));
  return {
   before,after:parseFloat(getComputedStyle(heading).marginLeft),
   same:originalSheet===$('paper').querySelector('.exam-sheet')&&originalRow===$('paper').querySelector('.reference-analysis-item'),
   current:ExaminaVisualFormat.snapshot().indentPt,
   headingWord:wordExamParagraph(heading),
   itemWord:wordExamParagraph(analysis),
   beforePt:ExaminaVisualFormat.snapshot().questionBeforePt,
   pdfIndent:ExaminaPdfExport.prepareDocument().querySelector('.paper')?.style.getPropertyValue('--exam-indent-shift').trim()
  };
 });
 assert.equal(visual.current,18,file+': no se guardó la sangría');
 assert.equal(visual.pdfIndent,'18pt',file+': el PDF pierde la sangría del profesor');
 assert(Math.abs((visual.after-visual.before)-24)<0.15,file+': sangría visual incorrecta '+JSON.stringify(visual));
 assert(visual.same,file+': cambiar sangría reconstruyó el examen');
 assert(visual.headingWord.includes('w:left="720"'),file+': sangría Word del número');
 assert(visual.itemWord.includes('w:left="1080"'),file+': sangría Word del elemento');
 await page.reload();
 const restored=await page.locator('#examIndentPt').inputValue();
 assert.equal(restored,'18',file+': se perdió la preferencia');
 assert.deepEqual(errors,[],file+'/'+lang+': fallos JS');
 await context.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])for(const lang of ['es','va'])
   await testOne(browser,file,lang);
  console.log('UD5 griega: sustantivos/adjetivos/verbos, sangría Word/vista previa, persistencia, ES/VA, online/offline.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
