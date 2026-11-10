const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  for(const file of ['index.html','offline.html']){
   const context=await browser.newContext({viewport:{width:1080,height:780}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href);
   await page.waitForFunction(()=>!!window.ExaminaValencianGloss&&!!window.ExaminaVocabulary);
   const report=await page.evaluate(()=>{
    const dict=window.ExaminaValencianGloss,words=window.ExaminaVocabulary;
    const course=document.getElementById('course'),language=document.getElementById('lang');
    const results={};
    for(const code of ['latin1','latin4','greek1']){
     course.value=code;course.dispatchEvent(new Event('change',{bubbles:true}));
     const unit=document.querySelector('.unit-choice');
     if(unit){unit.checked=true;unit.dispatchEvent(new Event('change',{bubbles:true}))}
     language.value='va';language.dispatchEvent(new Event('change',{bubbles:true}));
     document.getElementById('generate').click();
     const paper=document.getElementById('paper');
     results[code]={header:paper.textContent.includes('1r trimestre'),language:document.documentElement.lang,
      noGrade:!/(?:Nota sobre|Nota:)/.test(paper.textContent)};
    }
    const independent=words.formatVocabularyEntry({entry:'πόλις, –εως',meaning:'ciudad'},
      'complete','gr1','va');
    const project={count:1,course:'lat1',lang:'va',units:[{
      title:'UD1',mode:'complete',text:'Puella.',analyzed:true,
      rows:[{form:'puella',entry:'puella, –ae',meaning:'niña',status:'documented',candidates:[]}]
    }]};
    const valencianWord=words.documentXml(project);
    const spanishWord=words.documentXml({...project,lang:'es'});
    const verifyTeacher=dict.forEntry({meaning:'ciudad',meaning_va:'traducció pròpia'},'va').value;
    return {results,independent,wordVa:valencianWord.includes('xiqueta'),
     wordEs:spanishWord.includes('niña'),teacher:verifyTeacher,
     ui:document.querySelector('#examLayout aside.panel')?.textContent||''};
   });
   for(const [course,record] of Object.entries(report.results)){
    assert(record.header,file+': ordinal de trimestre incorrecto en '+course);
    assert.equal(record.language,'ca-valencia',file+': idioma HTML incorrecto en '+course);
    assert(record.noGrade,file+': se imprime una Nota en '+course);
   }
   assert.match(report.independent,/ciutat/,file+': exportación de vocabulario griego sin valenciano');
   assert(report.wordVa&&report.wordEs,file+': la exportación Word no respeta el idioma');
   assert.equal(report.teacher,'traducció pròpia',file+': prioridad de corrección docente');
   assert(report.ui.includes('Contingut')||report.ui.includes('Unitats'),file+': el menú no se ha localizado');
   assert.deepEqual(errors,[],file+': errores de JavaScript al cambiar idioma');
   await context.close();
  }
  console.log('OK ES/VA en Latín I, Latín 4.º, Griego I, Word y PWA autónoma.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
