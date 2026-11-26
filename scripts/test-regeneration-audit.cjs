'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((request,response)=>{
 const file=path.resolve(root,new URL(request.url,'http://localhost').pathname.slice(1));
 if(!file.startsWith(root+path.sep)){response.writeHead(404).end();return}
 fs.readFile(file,(error,bytes)=>{
  if(error){response.writeHead(404).end();return}
  const type=file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/javascript';
  response.setHeader('Content-Type',type);
  response.end(bytes);
 });
});

async function run(page,filename){
 await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename);
 await page.waitForFunction(()=>window.ExaminaTeacherLexBankReady===true);
 return page.evaluate(()=>{
  const exercise=()=>document.querySelector('#paper .exam-sheet');
  const select=(course,model,unit)=>{
   for(const [id,value] of [['course',course],['model',model]]){
    $(id).value=value;$(id).dispatchEvent(new Event('change',{bubbles:true}));
   }
   document.querySelectorAll('#unitChoices .unit-choice').forEach(input=>{
    input.checked=units[Number(input.value)]===unit;
   });
   examSelectionCache.clear();
   greekExamState=null;
   generate();
  };
  const edit=(node,value)=>{
   node.textContent=value;
   node.dispatchEvent(new InputEvent('input',{bubbles:true}));
  };
  const results={};
  select('latin1','tablas','UD7');
  const sheet=exercise(),slot=index=>examRegenerationSlot(sheet,'forms',index);
  const old=slot(0),other=slot(1);
  const rows=examSelectionCache.get(examCacheSignature('forms'));
  const candidates=latinExamFormCandidates(selectedUnits(),true).flat();
  const priority=latinFormPriorities(selectedUnits()).concat(
   examUnitPriority(selectedUnits(),item=>item.units||[])).find(test=>test(rows[0]));
  const different=candidates.filter(item=>!rows.some(row=>normLex(row.form)===normLex(item.form)));
  const random=Math.random;
  let edited;
  try{
   Math.random=()=>0;
   edited=latinPrioritySample(different,1,priority?[priority]:[])[0]?.form;
  }finally{Math.random=random}
  if(!edited)throw Error('La prueba necesita una forma alternativa');
  edit(other.querySelector('i'),edited);
  const key=sheet.querySelector('#answerkey');
  const otherAnswer=key.querySelector('[data-exam-kind="forms"] ol > li:nth-child(2)');
  edit(otherAnswer,'Respuesta revisada de la segunda palabra');
  const foreignAnswer=key.querySelector('[data-exam-kind="decl"]');
  foreignAnswer.append(' Solución de declinación revisada');
  // Sin un filtro sobre la vista previa, un sorteo repetible acaba eligiendo
  // como sustituto el valor que el docente ha escrito en la otra casilla.
  try{
   Math.random=()=>0;
   regenerateExamWord('forms',0);
  }finally{Math.random=random}
  results.answer=sheet.querySelector('#answerkey')===key&&key.contains(otherAnswer)&&key.contains(foreignAnswer)&&
   key.textContent.includes('Respuesta revisada de la segunda palabra')&&
   key.textContent.includes('Solución de declinación revisada')&&
   key.querySelector('[data-exam-kind="forms"] ol > li:first-child').textContent.startsWith(slot(0).querySelector('i').textContent+' — ');
  results.edited=slot(0)!==old&&slot(1)===other&&other.querySelector('i').textContent===edited&&
   slot(0).querySelector('i').textContent!==edited;

  const latinDraft=JSON.parse(JSON.stringify(window.ExaminaUnifiedCurrentExam()));
  const savedForm=slot(0).querySelector('i').textContent;
  select('latin4','tablas','UD1');
  window.ExaminaUnifiedRestoreDraft(latinDraft);
  const restoredLatin=exercise(),oldLatin=examRegenerationSlot(restoredLatin,'forms',0);
  results.latinDraft=examSelectionCache.get(examCacheSignature('forms'))?.[0]?.form===savedForm;
  regenerateExamWord('forms',0);
  results.latinRegeneration=restoredLatin===exercise()&&examRegenerationSlot(restoredLatin,'forms',0)!==oldLatin&&
   examRegenerationSlot(restoredLatin,'forms',1).querySelector('i').textContent===edited&&
   restoredLatin.querySelector('#answerkey').textContent.includes('Respuesta revisada de la segunda palabra');

  select('latin1','tablas','UD9–10');
  const kind='prefixes';
  const selector='[data-lex-slot="'+kind+':0"] i';
  const lexicalKey=()=>examCacheSignature('lex-'+kind);
  const words=()=>[...exercise().querySelectorAll('[data-lex-slot^="'+kind+':"] i')]
   .map(word=>word.textContent).sort().join('/');
  try{
   Math.random=()=>0;
   regenerateExamQuestion('lex');
   const first=words();
   const rootBefore=exercise(),keyBefore=rootBefore.querySelector('#answerkey');
   regenerateExamQuestion('lex');
   results.whole=first!==words()&&exercise()===rootBefore&&keyBefore===rootBefore.querySelector('#answerkey');
  }finally{Math.random=random}
  const current=exercise().querySelector(selector);
  edit(current,'docente-personalizado');
  const saved=JSON.parse(JSON.stringify(window.ExaminaUnifiedCurrentExam()));
  examSelectionCache.clear();
  window.ExaminaUnifiedRestoreDraft(saved);
  const restored=exercise(),restoredWord=restored.querySelector(selector);
  results.draft=examSelectionCache.get(lexicalKey())?.[0]?.prompt==='docente-personalizado';
  regenerateLatinLexWord(kind,0);
  results.draftRegeneration=restored===exercise()&&restoredWord!==restored.querySelector(selector)&&
   restored.querySelector(selector).textContent!=='docente-personalizado';
  const before=examSelectionCache.get(lexicalKey());
  const paragraph=restored.querySelector('.lex-subquestion[data-lex-kind="'+kind+'"]');
  paragraph.remove();
  regenerateLatinLexWord(kind,1);
  results.missingSlot=restored===exercise()&&examSelectionCache.get(lexicalKey())===before;
  select('greek1','complete','UD7');
  const forms=()=>[...exercise().querySelectorAll('.exam-form[data-corpus-id]')];
  const ids=forms().map(node=>node.dataset.corpusId);
  edit(forms()[1].querySelector('[data-greek-form-surface]'),'λόγους');
  const greekDraft=JSON.parse(JSON.stringify(window.ExaminaUnifiedCurrentExam()));
  // Cambiar de curso descarta la selección en memoria antes de importar.
  select('latin4','tablas','UD1');
  window.ExaminaUnifiedRestoreDraft(greekDraft);
  results.greekDraft=JSON.stringify(greekExamState?.ids.forms)===JSON.stringify(ids);
  const oldGreek=forms()[0],otherGreek=forms()[1];
  regenerateExamWord('forms',0);
  results.greekRegeneration=forms()[0]!==oldGreek&&forms()[0].dataset.corpusId!==ids[0]&&
   forms()[1]===otherGreek&&otherGreek.querySelector('[data-greek-form-surface]').textContent==='λόγους';
  select('greek1','morphology','UD7');
  for(const category of ['n','adj','pro'])$('morphCategory-'+category).checked=false;
  results.greekCategories=greekMorphologyReplacementPool('forms')
   .filter(row=>examGreekWordClass(row)!=='verbs')
   .slice(0,4).map(row=>[row.prompt,row.category,row.answer]);
  return results;
 });
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   try{
    const results=await run(page,filename);
    assert.deepEqual(results,{answer:true,edited:true,draft:true,draftRegeneration:true,missingSlot:true,whole:true,greekDraft:true,greekRegeneration:true,latinDraft:true,latinRegeneration:true,greekCategories:[]},filename);
    assert.deepEqual(errors,[],filename);
   }finally{await page.close()}
  }
  console.log('Regeneración aislada, solucionario, ediciones y borradores comprobados en web y HTML autónomo.');
 }finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
