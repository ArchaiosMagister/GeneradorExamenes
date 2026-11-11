'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const filename of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(filename),ctx,{filename});
const engine=ctx.window.ExaminaVocabulary;
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html'),first=html.indexOf('let vocab=');
assert(first>=0);
const start=first+'let vocab='.length,bank=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const found of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 bank.push(...JSON.parse(found[1]));
const latin=bank.filter(x=>(x.course||'latin1')==='latin1');
const latin4=bank.filter(x=>(x.course||'latin1')==='latin4');
const greek=bank.filter(x=>x.course==='greek1');
const cases=[
 ['lat1',latin,'Galli','gallus','galli'],
 ['lat1',latin,'bona','bonus','bona'],
 ['lat4',latin4,'bona','bonus','bona']
];
for(const [course,vocabulary,form,left,right] of cases){
 const row=engine.analyze(data,form,course,vocabulary,{contextual:true})[0];
 assert.equal(row.status,'review',form+': no elegir un homógrafo automáticamente');
 assert(row.candidates.some(c=>c.lemma===left));
 assert(row.candidates.some(c=>c.lemma===right));
 assert(row.candidates.some(c=>c.entry&&c.meaning),'Debe ofrecer la ficha docente con glosa');
}
for(const [entry,course,kind] of [
 ['bonus, –a, –um','lat1','adjectives'],
 ['Gallus, –a, –um','lat1','adjectives'],
 ['Galli, –orum','lat1','nouns'],
 ['hic, haec, hoc (pron.)','lat1','pronouns'],
 ['amo, amavi, amatum (1ª)','lat1','verbs'],
 ['bene (adv.)','lat1','other'],
 ['ὁ, ἡ, τό (art.)','gr1','articles'],
 ['μέν (part.)','gr1','particles'],
 ['ἐκεῖνος, –η, –ο (pron. dem.)','gr1','pronouns'],
 ['λόγος, –ου','gr1','nouns']
]){
 assert.equal(engine.classifyVocabularyEntry(entry,course),kind,'Tipo incorrecto: '+entry);
}
const groupedRows=[
 {form:'bonus',entry:'bonus, –a, –um',meaning:'bueno',status:'documented',lemma:'bonus',candidates:[]},
 {form:'amo',entry:'amo, amavi, amatum (1ª)',meaning:'amar',status:'documented',lemma:'amo',candidates:[]},
 {form:'hic',entry:'hic, haec, hoc (pron.)',meaning:'este',status:'documented',lemma:'hic',candidates:[]},
 {form:'bene',entry:'bene (adv.)',meaning:'bien',status:'documented',lemma:'bene',candidates:[]}
];
const project={course:'lat1',lang:'es',groupTypes:true,count:1,
 units:[{title:'UD1',mode:'complete',text:'Bonus amo hic bene.',analyzed:true,rows:groupedRows}]};
const xml=engine.documentXml(project);
for(const heading of ['Sustantivos y adjetivos','Verbos','Pronombres','Adverbios, conjunciones y otras palabras'])
 assert(xml.includes(heading),'Agrupación ausente: '+heading);
assert(xml.indexOf('Sustantivos y adjetivos')<xml.indexOf('Verbos'));
assert(xml.indexOf('Verbos')<xml.indexOf('Pronombres'));
assert(xml.includes('amo, amavi, amatum'));
const italic=xml.match(/<w:i\/>[^]*?amo, amavi, amatum/);
assert(italic,'El enunciado verbal debe ir en cursiva');
assert(!/<w:i\/>[^]*?\(1ª\)/.test(xml.slice(xml.indexOf('amo, amavi, amatum'),xml.indexOf('amo, amavi, amatum')+280)),
 'La indicación de conjugación no debe ir en cursiva');
assert(!engine.documentXml({...project,groupTypes:false}).includes('Sustantivos y adjetivos'));

(async()=>{
 const server=http.createServer((request,response)=>{
  response.setHeader('Content-Type','text/html; charset=utf-8');
  response.end(read('offline.html'));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/offline.html',{waitUntil:'load'});
  await page.locator('#vmShowExam').click();
  await page.locator('#group-course').evaluate(el=>el.open=true);
  await page.locator('#group-content').evaluate(el=>el.open=true);
  await page.locator('#group-sentences').evaluate(el=>el.open=true);
  await page.locator('#group-vocab').evaluate(el=>el.open=true);
  await page.locator('#group-export').evaluate(el=>el.open=true);
  await page.evaluate(()=>{
   for(const [id,value] of [['course','latin1'],['model','mixto']]){
    const el=document.getElementById(id);el.value=value;
    el.dispatchEvent(new Event('change',{bubbles:true}));
   }
   const lines=document.getElementById('newSentences');
   lines.value='Galli pugnant.\nBona sunt.';
   lines.dispatchEvent(new Event('input',{bubbles:true}));
   generate();
  });
  await page.waitForFunction(()=>document.querySelectorAll('#examSentenceGlossary select.exam-gloss-lemma').length>=2,
   {timeout:30000});
  const labels=await page.locator('#examSentenceGlossary .exam-gloss-review-choice').allTextContents();
  assert(labels.some(x=>x.includes('Galli')));
  assert(labels.some(x=>x.includes('Bona')||x.includes('bona')));
  const galli=page.locator('#examSentenceGlossary .exam-gloss-review-choice').filter({hasText:'Galli'}).first();
  assert((await galli.locator('option').allTextContents()).some(s=>s.includes('Gallus, –a, –um')));
  const gallusValue=await galli.locator('option').filter({hasText:'Gallus, –a, –um'}).first().getAttribute('value');
  await galli.locator('select').evaluate((el,value)=>{
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  },gallusValue);
  assert.match(await page.locator('#examSentenceGlossary').innerText(),/Lecturas elegidas/);
  assert.match(await page.locator('#examSentenceGlossary .final-gloss').innerText(),/Gallus/);
  const bona=page.locator('#examSentenceGlossary .exam-gloss-review-choice').filter({hasText:/\bBona\b|\bbona\b/}).first();
  const value=await bona.locator('option').filter({hasText:'bonus, –a, –um'}).first().getAttribute('value');
  await bona.locator('select').evaluate((el,value)=>{
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
  assert.match(await page.locator('#examSentenceGlossary .final-gloss').innerText(),/bonus/);
  assert(!await page.locator('#examSentenceGlossary').innerText().then(s=>s.includes('Revisión necesaria: bona, Galli')));
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_exam_gloss_choices_v1')));
  assert.equal(Object.keys(stored).length,2,'Las dos decisiones deben persistir');
  await page.reload();
  await page.locator('#vmShowExam').click();
  await page.locator('#group-course').evaluate(el=>el.open=true);
  await page.locator('#group-content').evaluate(el=>el.open=true);
  await page.locator('#group-sentences').evaluate(el=>el.open=true);
  await page.locator('#group-vocab').evaluate(el=>el.open=true);
  await page.locator('#group-export').evaluate(el=>el.open=true);
  await page.evaluate(()=>{
   const model=document.getElementById('model');
   model.value='mixto';model.dispatchEvent(new Event('change',{bubbles:true}));
   generate();
  });
  await page.waitForFunction(()=>document.querySelector('#examSentenceGlossary .exam-gloss-selected'));
  assert.equal(await page.locator('#examSentenceGlossary .exam-gloss-reset').count(),2);
  await page.locator('#examSentenceGlossary .exam-gloss-reset').first().evaluate(el=>el.click());
  assert.equal(await page.locator('#examSentenceGlossary .exam-gloss-lemma').count(),1);
  for(const id of ['glossNouns','glossAdjectives','glossPronouns','glossArticles','glossParticles','glossOther','glossHideRequired'])
   assert.equal(await page.locator('#'+id).count(),1,id);
  assert.deepEqual(errors,[],'No deben aparecer errores JavaScript en la interfaz');
  console.log('Glosario de oraciones: elecciones, persistencia, edición, tipos y agrupación: OK');
 }finally{
  await browser.close();await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
