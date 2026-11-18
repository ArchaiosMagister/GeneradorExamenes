'use strict';
const assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
async function setup(page,lang,model,unit){
 await page.evaluate(({lang,model,unit})=>{
  const change=(id,value)=>{
   const el=document.getElementById(id);if(!el)throw Error('Control ausente '+id);
   el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  change('course','greek1');change('model',model);change('lang',lang);
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  const chosen=choices.find(x=>units[Number(x.value)]==='UD'+unit);
  if(!chosen)throw Error('No existe UD'+unit);
  choices.forEach(x=>x.checked=x===chosen);
  chosen.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();greekExamState=null;generate();
 },{lang,model,unit});
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])for(const lang of ['es','va']){
   const page=await browser.newPage({viewport:{width:1450,height:950}});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
   await setup(page,lang,'morphology',4);
   assert.equal(await page.evaluate(()=>greekVerifiedCorpus.filter(x=>x.greekIrregular&&greekMorphologyEligible(x,greekLimit())).length),0,
    'UD4 anticipa los adjetivos irregulares');
   await setup(page,lang,'morphology',5);
   const corpus=await page.evaluate(()=>{
    const forms=greekVerifiedCorpus.filter(x=>x.greekIrregular);
    const second=greekVerifiedCorpus.find(x=>x.category==='nouns'&&x.lemmas?.[0]?.startsWith('βασίλειον'));
    const third=greekVerifiedCorpus.find(x=>x.category==='nouns'&&
     /tercera declinación/i.test(x.answer)&&/\((?:ὁ|ἡ|τό|τὸ)\)/u.test(x.lemmas?.[0]||''));
    return {count:forms.length,lemmata:[...new Set(forms.map(x=>x.lemmas[0]))],
     eligible:forms.filter(x=>greekMorphologyEligible(x,5)).length,
     second:second?.lemmas?.[0],secondDisplay:second&&greekNominalEnunciation(second),
     third:third?.lemmas?.[0],thirdDisplay:third&&greekNominalEnunciation(third)};
   });
   assert(corpus.count>=30,'No hay suficientes formas irregulares contrastadas');
   assert.equal(corpus.eligible,corpus.count);
   assert(corpus.lemmata.some(x=>x.startsWith('μέγας'))&&corpus.lemmata.some(x=>x.startsWith('πολύς')));
   assert(corpus.second?.includes('(τό)')&&!corpus.secondDisplay?.includes('(τό)'));
   assert.equal(corpus.third,corpus.thirdDisplay,'El artículo de tercera declinación debe conservarse');
   const frequency=await page.evaluate(()=>{
    for(const kind of ['nouns','adjectives','verbs','pronouns']){
     const el=document.getElementById('quota-'+kind);
     el.value=kind==='adjectives'?'3':'0';el.dispatchEvent(new Event('change',{bubbles:true}));
    }
    let found=0;
    for(let i=0;i<15;i++){
     const rows=examSelectionCache.get(examCacheSignature('forms'))||[];
     if(rows.length!==3)throw Error('Cuota de adjetivos alterada: '+rows.length);
     if(rows.some(x=>x.greekIrregular))found++;
     regenerateExamQuestion('forms');
    }
    return found;
   });
   assert(frequency>=7,'No se seleccionan con frecuencia los irregulares: '+frequency+'/15');
   await setup(page,lang,'complete',5);
   const etym=await page.evaluate(()=>{
    const el=document.getElementById('count-lex');el.value='7';
    el.dispatchEvent(new Event('change',{bubbles:true}));generateGreekExam();
    const count=()=>({
     chosen:greekExamState?.ids?.etymology?.length||0,
     visible:document.querySelectorAll('.greek-choice-option[data-greek-option="etymology"] .exam-etymology [data-corpus-id]').length
    });
    const seven=count();
    const extra=greekChoicePool('etymology').find(x=>!greekExamState.ids.etymology.includes(x.id));
    if(!extra)throw Error('Falta material para añadir un octavo étimo');
    greekAddChoice('etymology',extra.id);
    const eight=count();
    const marks=[...document.querySelectorAll('.greek-choice-option[data-greek-option="etymology"] .exam-etymology .exam-letter')].map(x=>x.textContent);
    return {seven,eight,marks,total:ExaminaScoring.total()};
   });
   assert(etym.seven.visible>=7&&etym.seven.chosen>=7,'Persistencia del límite de dos étimos');
   assert(etym.eight.visible>=8&&etym.eight.chosen>=8,'El añadido no se muestra');
   assert.deepEqual(etym.marks.slice(0,8),['i.','ii.','iii.','iv.','v.','vi.','vii.','viii.']);
   assert.equal(etym.total,1000,'Se ha alterado el reparto de puntos');
   assert.deepEqual(errors,[],file+'/'+lang+' JS');
   console.log('GR1_UD5_EXTRA '+JSON.stringify({file,lang,corpus,frequency,etym}));
   await page.close();
  }
  console.log('PASS: doble tema UD5, etimología ampliable, género de 1./2./3.ª, ES/VA web/autónoma.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
