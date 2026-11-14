'use strict';
// Regressions: Greek morphology per-form and whole-question regeneration.
// Exercise both the online document and the byte-for-byte offline distribution.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((request,response)=>{
 const pathname=decodeURIComponent(new URL(request.url||'/', 'http://127.0.0.1').pathname);
 const resolved=path.resolve(root,pathname.replace(/^\/+/, '')||'index.html');
 if(!resolved.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(resolved,(error,bytes)=>{
  if(error){response.writeHead(404).end();return}
  response.setHeader('Content-Type',resolved.endsWith('.html')?'text/html; charset=utf-8':
   resolved.endsWith('.js')?'text/javascript; charset=utf-8':
   resolved.endsWith('.json')?'application/json; charset=utf-8':'application/octet-stream');
  response.end(bytes);
 });
});
const selectors={
 decl:'#paper [data-syntagm-slot]',
 verb:'#paper .reference-verb-table tbody tr',
 forms:'#paper [data-analysis-slot]',
 pronouns:'#paper .exam-pronouns tbody tr'
};
async function configure(page,lang='es',unit='UD10'){
 await page.evaluate(({lang,unit})=>{
  function select(id,value){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}))}
  select('course','greek1');select('model','morphology');select('lang',lang);
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  choices.forEach(el=>{el.checked=units[Number(el.value)]===unit});
  if(!choices.some(el=>el.checked))throw Error('Unidad inexistente: '+unit);
  examSelectionCache.clear();
  generate();
 },{lang,unit});
 await page.waitForFunction(()=>!!document.querySelector('#paper .reference-morph-exam'));
}
async function panelState(page){
 return page.evaluate(()=>{
  const report={};
  for(const kind of ['decl','verb','forms','pronouns']){
   const panel=document.querySelector('#examQuestionMenus [data-question="'+kind+'"]');
   report[kind]={
    panel:!!panel,
    complete:panel?.querySelectorAll('button[data-regenerate-question="'+kind+'"]').length||0,
    individual:panel?.querySelectorAll('button.exam-regenerate-word[data-regenerate-kind="'+kind+'"]').length||0,
    oldName:panel?.querySelector('.exam-question-name')?.textContent||''
   };
  }
  return report;
 });
}
async function checkOne(page,name){
 const state=await panelState(page);
 for(const kind of Object.keys(selectors)){
  const rows=await page.locator(selectors[kind]).count();
  assert(state[kind].panel,name+': falta el menú '+kind);
  assert.equal(state[kind].complete,1,name+': falta regeneración completa '+kind);
  assert(rows>0,name+': no hay formas que comprobar en '+kind);
  assert.equal(state[kind].individual,rows,name+': faltan botones individuales '+kind);
 }
 const result=await page.evaluate(()=>{
  const paper=document.getElementById('paper');
  const other=paper.querySelector('[data-analysis-slot="1"] > i:first-child');
  const otherAnswer=paper.querySelector('#answerkey > ol > li[data-morph-kind="forms"] > p:nth-child(2)');
  other.textContent='ἀμετάβλητον';
  otherAnswer.textContent='Respuesta docente conservada';
  const original=paper.querySelector('[data-analysis-slot="0"]').dataset.corpusId;
  document.querySelector('[data-question="forms"] button[data-regenerate-kind="forms"][data-regenerate-index="0"]').click();
  const next=paper.querySelector('[data-analysis-slot="0"]').dataset.corpusId;
  const retained=paper.querySelector('[data-analysis-slot="1"] > i:first-child').textContent;
  const retainedAnswer=paper.querySelector('#answerkey > ol > li[data-morph-kind="forms"] > p:nth-child(2)').textContent;
  const pronounBefore=paper.querySelector('.exam-pronouns tbody tr').dataset.corpusId;
  document.querySelector('[data-question="pronouns"] button[data-regenerate-kind="pronouns"][data-regenerate-index="0"]').click();
  const pronounAfter=paper.querySelector('.exam-pronouns tbody tr').dataset.corpusId;
  const verbBefore=[...paper.querySelectorAll('.reference-verb-table tbody tr')].map(x=>x.textContent);
  document.querySelector('[data-question="verb"] button[data-regenerate-question="verb"]').click();
  const verbAfter=[...paper.querySelectorAll('.reference-verb-table tbody tr')].map(x=>x.textContent);
  return {
   original,next,retained,retainedAnswer,pronounBefore,pronounAfter,verbBefore,verbAfter,
   retainedAfterWhole:paper.querySelector('[data-analysis-slot="1"] > i:first-child').textContent,
   otherAnswerAfterWhole:paper.querySelector('#answerkey > ol > li[data-morph-kind="forms"] > p:nth-child(2)').textContent,
   separateEditorExists:!!document.querySelector('[data-question="forms"] [data-regenerate-kind="forms"]'),
   noPrintControls:paper.querySelectorAll('.exam-regenerate-word,[data-regenerate-question]').length===0
  };
 });
 assert.notEqual(result.original,result.next,name+': no se sustituyó la forma morfológica');
 assert.equal(result.retained,'ἀμετάβλητον',name+': se perdió otra forma editada');
 assert.equal(result.retainedAnswer,'Respuesta docente conservada',name+': se perdió una solución editada');
 assert.notEqual(result.pronounBefore,result.pronounAfter,name+': no cambió el pronombre');
 assert.notDeepEqual(result.verbBefore,result.verbAfter,name+': no se regeneró la tabla verbal');
 assert.equal(result.retainedAfterWhole,'ἀμετάβλητον',name+': la pregunta completa alteró otra pregunta');
 assert.equal(result.otherAnswerAfterWhole,'Respuesta docente conservada',name+': se sobrescribió otra respuesta');
 assert.equal(result.separateEditorExists,true,name+': se perdieron los controles tras regenerar');
 assert.equal(result.noPrintControls,true,name+': los botones se han colado en el documento');
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   for(const lang of ['es','va']){
    const page=await browser.newPage({viewport:{width:1380,height:950}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/'+file,{waitUntil:'load'});
    await configure(page,lang,'UD10');
    await checkOne(page,file+'/'+lang);
    assert.deepEqual(errors,[],file+'/'+lang+': error JavaScript');
    await page.close();
   }
  }
  // Desde las primeras unidades solo hay sustantivos: regenerarlos no requiere adjetivos.
  const page=await browser.newPage();
  await page.goto(base+'/offline.html',{waitUntil:'load'});
  await configure(page,'es','UD3');
  const before=await page.locator('#paper [data-syntagm-slot="0"] i').textContent();
  await page.locator('[data-question="decl"] button[data-regenerate-kind="decl"][data-regenerate-index="0"]').evaluate(el=>el.click());
  const after=await page.locator('#paper [data-syntagm-slot="0"] i').textContent();
  assert.notEqual(before,after,'No se regeneró el sustantivo antes de introducir adjetivos');
  await page.close();
  console.log('Griego I: 4 preguntas, regeneración individual y completa, ES/VA, web/autónoma, soluciones y ediciones conservadas.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
