'use strict';
// Griego I: solo dos modelos visibles; la traducción es una opción del examen
// completo. Incluye compatibilidad con borradores del tercer modelo retirado.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
async function run(browser,file){
 const ctx=await browser.newContext({viewport:{width:1380,height:900}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
  const start=await page.evaluate(()=>{
   const change=(id,value)=>{const el=$(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))};
   change('course','greek1');
   const models=[...$('model').options].map(x=>x.value);
   const sidebar=[...document.querySelectorAll('#examEditorPanel .sidebar-choice')]
    .filter(x=>/Examen completo|Morfolog/.test(x.textContent)).map(x=>x.textContent);
   for(const el of document.querySelectorAll('#unitChoices .unit-choice'))
    el.checked=units[Number(el.value)]==='UD7';
   document.querySelector('#unitChoices .unit-choice:checked')?.dispatchEvent(new Event('change',{bubbles:true}));
   generate();
   return {models,sidebar,control:$('greekSentenceTaskControl').hidden,task:$('greekSentenceTask').value};
  });
  assert.deepEqual(start.models,['complete','morphology'],file+': se mantiene un tercer modelo');
  assert.equal(start.control,false,file+': falta selector de enunciado');
  assert.equal(start.task,'analyze',file+': selección inicial inesperada');
  await page.waitForFunction(()=>!!document.querySelector('.exam-question[data-greek-kind="sentences"] .exam-question-caption'));
  const edited=await page.evaluate(()=>{
   const sheet=$('paper').querySelector('.exam-sheet');
   const sent=$('paper').querySelector('.exam-question[data-greek-kind="sentences"]');
   const caption=sent.querySelector('.exam-question-caption');
   const pts=sent.querySelector('.exam-question-points');
   const text=$('paper').querySelector('[data-sentence-slot="0"]');
   const other=$('paper').querySelector('.greek-choice-option');
   text.textContent='ORACION_EDITADA_SIN_REGENERAR';
   other.append(' ALTERNATIVA_EDITADA_SIN_REGENERAR');
   const before=ExaminaScoring.total();
   $('greekSentenceTask').value='translate';
   $('greekSentenceTask').dispatchEvent(new Event('change',{bubbles:true}));
   return {sameSheet:sheet===$('paper').querySelector('.exam-sheet'),
    sameSentence:text===$('paper').querySelector('[data-sentence-slot="0"]'),
    sameOption:other===$('paper').querySelector('.greek-choice-option'),
    sameScore:pts===sent.querySelector('.exam-question-points'),
    caption:caption.textContent,task:$('greekSentenceTask').value,
    score:ExaminaScoring.total(),before,editedText:$('paper').textContent};
  });
  assert(edited.sameSheet&&edited.sameSentence&&edited.sameOption&&edited.sameScore,file+': el selector reconstruye o pierde datos');
  assert.match(edited.caption,/Traduce las siguientes oraciones/);
  assert(!edited.caption.includes('Analiza y traduce'));
  assert.equal(edited.score,edited.before,file+': se alteran los puntos al cambiar el enunciado');
  assert(edited.editedText.includes('ORACION_EDITADA_SIN_REGENERAR')&&
   edited.editedText.includes('ALTERNATIVA_EDITADA_SIN_REGENERAR'));
  const va=await page.evaluate(()=>{
   $('lang').value='va';$('lang').dispatchEvent(new Event('change',{bubbles:true}));
   return {value:$('greekSentenceTask').value,
    label:$('greekSentenceTask').options[1].textContent,
    header:$('paper').querySelector('.exam-question[data-greek-kind="sentences"]')?.textContent};
  });
  assert.equal(va.value,'translate');
  assert.equal(va.label,'Traduïx');
  assert.match(va.header,/Traduïx/);
  const morphology=await page.evaluate(()=>{
   $('model').value='morphology';$('model').dispatchEvent(new Event('change',{bubbles:true}));
   return {hidden:$('greekSentenceTaskControl').hidden,
    selected:$('model').value,parts:$('paper').querySelectorAll('[data-analysis-slot]').length};
  });
  assert(morphology.hidden&&morphology.selected==='morphology'&&morphology.parts>0,
   file+': se alteró el examen independiente de morfología');
  const result=await page.evaluate(()=>{
   $('lang').value='es';$('lang').dispatchEvent(new Event('change',{bubbles:true}));
   $('model').value='complete';$('model').dispatchEvent(new Event('change',{bubbles:true}));
   $('greekSentenceTask').value='translate';
   $('greekSentenceTask').dispatchEvent(new Event('change',{bubbles:true}));
   for(const input of document.querySelectorAll('#unitChoices .unit-choice'))
    input.checked=units[Number(input.value)]==='UD7';
   document.querySelector('#unitChoices .unit-choice:checked')?.dispatchEvent(new Event('change',{bubbles:true}));
   $('count-sent').value='7';$('count-sent').dispatchEvent(new Event('change',{bubbles:true}));
   $('paper').querySelector('[data-sentence-slot="0"]').textContent='ORACION_ANTIGUA_GUARDADA';
   $('paper').querySelector('.exam-header').append(' CABECERA_ANTIGUA');
   ExaminaScoring.sync();
   const score=$('examScoring').querySelector('input[data-scoring-key="greek1/complete/sent"]');
   if(!score)throw Error('No existe control de puntos para traducción');
   score.value='7';score.dispatchEvent(new Event('input',{bubbles:true}));
   const draft=ExaminaUnifiedCurrentExam();
   const sourceScore=draft.scores['greek1/complete/sent'];
   const oldScores=Object.fromEntries(Object.entries(draft.scores).map(([key,value])=>[
    key.startsWith('greek1/complete/')?'greek1/translation/'+key.slice('greek1/complete/'.length):key,
    value
   ]));
   // Formato histórico descargado antes de eliminar el modelo "translation".
   const legacy={...draft,model:'translation',scores:oldScores};
   delete legacy.greekSentenceTask;
   $('model').value='morphology';$('model').dispatchEvent(new Event('change',{bubbles:true}));
   ExaminaUnifiedRestoreDraft(legacy);
   const restored=ExaminaUnifiedCurrentExam();
   return {sourceScore,model:$('model').value,task:$('greekSentenceTask').value,
    count:$('count-sent').value,slots:$('paper').querySelectorAll('[data-sentence-slot]').length,
    text:$('paper').textContent,restoredScore:ExaminaScoring.snapshot()['greek1/complete/sent'],
    savedModel:restored.model,savedTask:restored.greekSentenceTask,
    total:ExaminaScoring.total(),
    flags:ExaminaGreekChoiceGroups.snapshot().flags};
  });
  assert.equal(result.sourceScore,700,file+': no se creó puntuación de control');
  assert.equal(result.model,'complete');
  assert.equal(result.task,'translate');
  assert.equal(result.savedModel,'complete');
  assert.equal(result.savedTask,'translate');
  assert.equal(result.count,'7');
  assert.equal(result.slots,7);
  assert.match(result.text,/ORACION_ANTIGUA_GUARDADA/);
  assert.match(result.text,/CABECERA_ANTIGUA/);
  assert.equal(result.restoredScore,700,file+': puntuación de antiguo modelo descartada');
  assert.equal(result.total,1100,file+': la puntuación histórica no se conserva');
  assert.equal(typeof result.flags.number,'boolean');
  // Los tres modelos de Latín I permanecen inalterados.
  const latin=await page.evaluate(()=>{
   $('course').value='latin1';$('course').dispatchEvent(new Event('change',{bubbles:true}));
   const first=[...$('model').options].map(x=>x.value);
   $('course').value='latin4';$('course').dispatchEvent(new Event('change',{bubbles:true}));
   return {first,second:[...$('model').options].map(x=>x.value)};
  });
  assert.deepEqual(latin.first,['tablas','morf','mixto']);
  assert.deepEqual(latin.second,['tablas']);
  assert.deepEqual(errors,[],file+': errores de JavaScript');
  return {file,models:start.models,legacyDraft:true,language:true,editing:true,score:true};
 }finally{await ctx.close()}
}
(async()=>{const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])
   console.log('GREEK_TWO_MODES '+JSON.stringify(await run(browser,file)));
  console.log('PASS: Griego I solo completo/morfología; enunciados ES/VA, borradores antiguos y puntuaciones conservadas, web/offline.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
