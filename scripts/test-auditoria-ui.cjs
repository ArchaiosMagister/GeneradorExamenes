'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const vocab=fs.readFileSync(path.join(root,'vocabulary-generator.js'),'utf8');
const before=(a,b)=>index.indexOf(a)>=0&&index.indexOf(a)<index.indexOf(b);
assert(before('<header class="top">','<nav class="vocab-tabbar'), 'Primero el título');
assert(before('<nav class="vocab-tabbar','<div class="exam-coursebar'), 'Después los tres apartados');
assert.match(index,/id="vgUnitButtons"/,'No desaparecerán los botones por unidad');
assert.match(vocab,/function renderUnitButtons\(\)/,'Los botones deben conservar su renderizado');
assert.match(vocab,/showEulexisCard\(box,r,unit\(\)\)/,'Las propuestas deben aparecer junto a cada forma');
assert.match(index,/for\(const id of \['glossScope','glossNouns','glossVerbs','glossAdjectives','glossOther'\]\)/,
 'Los filtros deben actualizar el glosario');
assert.match(index,/if\(\/artículo\|articulo\/\.test\(a\)\)return null/,
 'El artículo no debe identificarse como sustantivo');

(async()=>{
 const html=fs.readFileSync(path.join(root,'offline.html'),'utf8');
 const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(html);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1150,height:850}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/offline.html',{waitUntil:'load'});
  await page.locator('#examQuestionMenus .exam-question-panel').first().waitFor();
  assert.equal(await page.locator('.vocab-tabbar>button').count(),3);
  assert.equal(await page.locator('#examQuestionMenus details[data-question]').count(),6,
   'Cada pregunta debe tener su propio desplegable numerado');
  assert.equal(await page.locator('#examQuestionSettings').evaluate(el=>el.tagName),'SECTION',
   'No se debe anidar un gran desplegable que contenga todas las preguntas');
  assert.equal(await page.locator('#regenerateAllQuestions').count(),1);
  await page.evaluate(()=>{
   const paper=document.getElementById('paper');
   window.__glossUpdates=0;
   new MutationObserver(()=>window.__glossUpdates++).observe(paper,{childList:true,subtree:true});
  });
  await page.locator('#group-vocab').evaluate(el=>el.open=true);
  await page.evaluate(()=>{
   const editor=document.getElementById('newSentences');
   editor.value='Puella amat.';
   editor.dispatchEvent(new Event('input',{bubbles:true}));
   window.__glossUpdates=0;
  });
  await page.selectOption('#glossScope','required');
  await page.waitForFunction(()=>window.__glossUpdates>0);
  await page.evaluate(()=>{
   const model=document.getElementById('model');model.value='morf';
   model.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector('#examQuestionMenus [data-question="lex"] input')?.disabled);
  const morphology=await page.locator('#examQuestionMenus .exam-question-panel').evaluateAll(nodes=>
   Object.fromEntries(nodes.map(node=>[node.dataset.question,{
    checked:node.querySelector('input[type="checkbox"]').checked,
    disabled:node.querySelector('input[type="checkbox"]').disabled
   }])));
  assert.equal(morphology.decl.checked,true);
  assert.equal(morphology.verb.checked,true);
  assert.equal(morphology.forms.checked,true);
  assert.equal(morphology.lex.disabled,true);
  assert.equal(morphology.sent.disabled,true);
  await page.locator('#vgShow').click();
  await page.locator('#vocabularyGenerator.active').waitFor();
  assert.equal(await page.locator('#vgUnitButtons button').count(),Number(await page.locator('#vgCount').inputValue()));
  await page.locator('#vgText').fill('λόγου καὶ λόγου.');
  assert.equal(await page.locator('#vgUnitButtons button[data-filled="true"]').count(),1,
   'La unidad con texto conserva el punto verde');
  await page.evaluate(()=>{
   window.ExaminaEulexisLocal.load=async()=>({rows:[
    {form:'λόγου',lemma:'θεός',analysis:'genitivo singular masculino'}]});
  });
  await page.selectOption('#vgCourse','gr1');
  await page.waitForFunction(()=>document.getElementById('vgEulexisStatus')?.textContent?.includes('Eulexis disponible'));
  await page.locator('#vgAnalyze').click();
  await page.locator('#vgResults .vg-eulexis-card').first().waitFor();
  assert.match(await page.locator('#vgResults .vg-eulexis-context').first().textContent(),/λόγου/);
  assert.ok(await page.locator('#vgResults .vg-eulexis-choice').count()>=1);
  await page.locator('#vgResults .vg-eulexis-choice').first().click();
  assert.match(await page.locator('#vgResults').textContent(),/flexión no certificada/);
  await page.locator('#vmShowExam').click();
  await page.locator('#examQuestionMenus .exam-question-panel').first().waitFor();
  assert.deepEqual(errors,[],'No debe haber excepciones JavaScript en la interfaz');
  console.log('Navegación, jerarquía, filtros, preguntas, botones UD y Eulexis contextual: OK.');
 }finally{
  await browser.close();await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});