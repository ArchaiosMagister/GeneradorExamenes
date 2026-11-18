'use strict';
// Regresiones docentes completas: regeneración aislada, verbos, semántica y
// retroversión léxica, glosario único, ES/VA, web/autónoma.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const pageUrl=name=>pathToFileURL(path.resolve(name)).href;
async function configure(page,unit,lang){
 await page.evaluate(({unit,lang})=>{
  const select=(id,value)=>{const el=$(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))};
  select('course','greek1');select('model','complete');select('lang',lang);
  const chosen=[...document.querySelectorAll('#unitChoices .unit-choice')].find(
   x=>units[Number(x.value)]==='UD'+unit);
  if(!chosen)throw Error('Unidad griega no disponible: '+unit);
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=x===chosen);
  chosen.dispatchEvent(new Event('change',{bubbles:true}));
  $('autoGloss').checked=true;
  generate();
 },{unit,lang});
}
const snapshot=page=>page.evaluate(()=>{
 const groups=Object.fromEntries([...document.querySelectorAll('.greek-choice-option')].map(x=>
  [x.dataset.greekOption,x.textContent]));
 const answers=Object.fromEntries([...document.querySelectorAll('#answerkey h3[data-greek-kind]')].map(h=>{
  const items=[];for(let n=h.nextElementSibling;n&&n.tagName!=='H3'&&!n.dataset.greekExtraAnswer;n=n.nextElementSibling)
   if(n.tagName==='P')items.push(n.textContent);
  return [h.dataset.greekKind,items];
 }));
 return {groups,answers,ids:JSON.parse(JSON.stringify(greekExamState.ids)),
  paragraphs:[...document.querySelectorAll('.greek-choice-option[data-greek-option="conjugation"] .exam-verbs th[data-corpus-id]')].map(x=>x.textContent),
  declTables:[...document.querySelectorAll('.greek-choice-option[data-greek-option="declension"] table.exam-nouns')].map(x=>x.textContent),
  forms:[...document.querySelectorAll('.greek-choice-option[data-greek-option="forms"] .exam-form')].map(x=>x.textContent),
  sentences:document.querySelector('.greek-choice-option[data-greek-option="sentences"]')?.textContent||'',
  glossary:document.querySelector('#examSentenceGlossary')?.textContent||'',
  header:document.querySelector('#paper .exam-header')?.textContent||''};
});
function unchangedExcept(before,after,kind){
 for(const [k,value] of Object.entries(before.groups))if(k!==kind)
  assert.equal(after.groups[k],value,'Regenerar '+kind+' modificó otra alternativa '+k);
 for(const [k,value] of Object.entries(before.answers))if(k!==kind)
  assert.deepEqual(after.answers[k],value,'Regenerar '+kind+' cambió respuestas de '+k);
 assert.equal(after.header,before.header,'Regenerar '+kind+' cambió la cabecera');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])for(const lang of ['es','va']){
   const page=await browser.newPage({viewport:{width:1450,height:950}});
   const errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.goto(pageUrl(file));
   await configure(page,1,lang);
   let check=await page.evaluate(()=>({
    eimi:greekChoicePool('conjugation').some(x=>x.id==='v-ειμι'),
    ids:greekExamState.ids.conjugation,
    verb:document.querySelector('.greek-choice-option[data-greek-option="conjugation"]')?.textContent
   }));
   assert(check.eimi,'εἰμί no está disponible en UD1');
   assert(check.ids.includes('v-ειμι'),'εἰμί no se genera en UD1');
   await configure(page,5,lang);
   const pools=await page.evaluate(()=>({
    verbs:greekChoicePool('conjugation').length,
    count:greekExamState.ids.conjugation.length,
    badSquare:greekSemanticallyValidSyntagm({lemmas:['ἀγορά, –ας']},{lemma:'θνητός'}),
    badMan:greekSemanticallyValidSyntagm({lemmas:['ἄνθρωπος, –ου']},{lemma:'πολύς'}),
    valid:greekSemanticallyValidSyntagm({lemmas:['ἀγορά, –ας']},{lemma:'καλός'}),
    justWord:greekSemanticallyValidSyntagm({lemmas:['λόγος, –ου']},{lemma:'δίκαιος'}),
    unjustEducation:greekSemanticallyValidSyntagm({lemmas:['παιδεία, –ας']},{lemma:'ἄδικος'}),
    numberBad:ExaminaGreekNumber.candidates().filter(row=>row.adjective&&
     !greekSemanticallyValidSyntagm(greekVerifiedCorpus.find(x=>x.id===row.source),
      {lemma:row.adjective})).length,
    retro:ExaminaGreekRetroversion.candidates(),
    lex:document.querySelector('#examSentenceGlossary')?.textContent||''
   }));
   assert(pools.verbs>=6,'Banco verbal de UD5 insuficiente');
   assert(pools.count>=3,'La conjugación continúa limitada a dos verbos');
   assert(!pools.badSquare&&!pools.badMan&&pools.valid&&pools.justWord&&pools.unjustEducation,
    'La auditoría semántica no reconoce combinaciones naturales tras normalizar el sigma');
   assert.equal(pools.numberBad,0,'Cambio de número combina nombres y adjetivos absurdos');
   assert(pools.retro.length>0,'Retroversión sin sintagmas disponibles');
   assert(pools.retro.every(row=>row.adjective&&row.prompt.trim().includes(' ')),
    'Retroversión de UD5 sin adjetivo obligatorio');
   const added=await page.evaluate(()=>{
    const selected=greekExamState.ids.conjugation;
    const next=greekChoicePool('conjugation').find(x=>!selected.includes(x.id));
    if(!next)throw Error('No hay más verbos');
    const before=selected.length;greekAddChoice('conjugation',next.id);
    return {before,after:greekExamState.ids.conjugation.length,
     rendered:document.querySelectorAll('.greek-choice-option[data-greek-option="conjugation"] .exam-verbs th[data-corpus-id]').length};
   });
   assert.equal(added.after,added.before+1,'No permite añadir el quinto verbo');
   assert.equal(added.rendered,added.after,'No se muestran todos los verbos añadidos');
   // El primer verbo no puede alternar únicamente entre los dos lemas de
   // la unidad foco: explorar varias regeneraciones de entre todos los elegibles.
   const varied=await page.evaluate(()=>{
    const seen=new Set([greekExamState.ids.conjugation[0]]);
    const other=greekExamState.ids.conjugation.slice(1);
    for(let i=0;i<15;i++){
     regenerateExamWord('verb',0);
     seen.add(greekExamState.ids.conjugation[0]);
     if(JSON.stringify(greekExamState.ids.conjugation.slice(1))!==JSON.stringify(other))
      throw Error('Regenerar primer verbo modificó otros lemas');
    }
    return [...seen];
   });
   assert(varied.length>=4,'El primer verbo no explora suficiente variedad curricular: '+varied);
   for(const [kind,index] of [['decl',0],['verb',0],['forms',0],['verb',1],['decl',1]]){
    const before=await snapshot(page);
    await page.evaluate(({kind,index})=>regenerateExamWord(kind,index),{kind,index});
    const after=await snapshot(page);
    unchangedExcept(before,after,({decl:'declension',verb:'conjugation',forms:'forms'})[kind]);
    const field={decl:'declTables',verb:'paragraphs',forms:'forms'}[kind];
    for(let i=0;i<Math.min(before[field].length,after[field].length);i++)if(i!==index)
     assert.equal(after[field][i],before[field][i],kind+' cambió forma ajena '+i);
   }
   for(const kind of ['change-number','retroversion']){
    const before=await snapshot(page);
    await page.evaluate(kind=>{
     if(!ExaminaGreekChoiceGroups.replaceGenerated(kind,0))throw Error('No se regeneró '+kind);
    },kind);
    const after=await snapshot(page);
    unchangedExcept(before,after,kind);
   }
   const glossary=await page.evaluate(()=>({
    separate:!!document.querySelector('#greekNumberGlossary'),
    host:!!document.querySelector('#examSentenceGlossary'),
    added:[...document.querySelectorAll('#examSentenceGlossary [data-greek-number-entry]')].map(x=>x.textContent),
    duplicated:[...document.querySelectorAll('#examSentenceGlossary .gloss-item')]
     .map(x=>normLex(headLex(x.textContent))).filter((x,i,all)=>all.indexOf(x)!==i)
   }));
   assert(!glossary.separate&&glossary.host,'El cambio de número no usa un glosario central');
   assert(glossary.added.length>0,'Faltan enunciados nominales en el glosario central');
   assert.deepEqual(glossary.duplicated,[],'Duplicación de enunciados en glosario común');
   assert.deepEqual(errors,[],file+'/'+lang+' errores de JavaScript');
   console.log('GREEK_SEMANTIC_ISOLATION '+JSON.stringify({file,lang,verbPool:pools.verbs,verbCount:added.after,
    retro:pools.retro.length,numberGloss:glossary.added.length}));
   await page.close();
  }
  console.log('PASS: regeneración individual de todas las clases, εἰμί, más de 2 verbos, colocaciones semánticas, retroversión conocida y glosario único.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
