'use strict';
// Alineación de pregunta/subpregunta por curso y modalidad, vista previa,
// PDF rasterizado y Word. Referencia: análisis morfológico.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
const PX=96/72;
const close=(actual,pt,label,tolerance=1.8)=>{
 const value=parseFloat(actual);
 assert(Number.isFinite(value)&&Math.abs(value-pt*PX)<=tolerance,
  label+': '+actual+' (esperado '+pt+' pt)');
};
const fixtures=[
 ['latin1','tablas','UD4'],['latin1','mixto','UD7'],
 ['latin1','morf','UD4'],['latin4','tablas','UD4'],
 ['latin4','morf','UD4'],['greek1','complete','UD8'],
 ['greek1','translation','UD8'],['greek1','morphology','UD8']
];
async function generate(page,course,model,unit,lang){
 return page.evaluate(({course,model,unit,lang})=>{
  const set=(id,value)=>{
   const el=document.getElementById(id);
   if(!el)throw Error('Falta '+id);
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  set('course',course);set('model',model);set('lang',lang);
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  const chosen=choices.find(el=>units[Number(el.value)]===unit);
  if(!chosen)throw Error('No se encuentra la unidad '+unit+' ('+course+')');
  choices.forEach(el=>el.checked=el===chosen);
  chosen.dispatchEvent(new Event('change',{bubbles:true}));
  if(course==='latin4'&&model==='tablas'){
   const culture=document.getElementById('culture');
   if(culture)culture.checked=true;
   examQuestionChoiceState['latin4/tablas/culture']=true;
  }
  examSelectionCache.clear();generate();window.ExaminaScoring?.sync?.();
  const sheet=document.querySelector('#paper .exam-sheet');
  if(!sheet)throw Error('No se generó el examen '+course+'/'+model);
  return {questions:sheet.querySelectorAll(':scope > p.exam-question').length,
   items:sheet.querySelectorAll(':scope > p.exam-item').length,
   lists:sheet.querySelectorAll(':scope > ol.task').length};
 },{course,model,unit,lang});
}
function isExpectedWordIndent(word,left,hanging){
 return word.includes('<w:ind w:left="'+left+'" w:hanging="'+hanging+'"/>');
}
async function audit(page,course,model,lang,file){
 const v=await page.evaluate(()=>{
  const sheet=document.querySelector('#paper .exam-sheet');
  const px=(el,property,pseudo)=>getComputedStyle(el,pseudo)[property];
  const questions=[...sheet.querySelectorAll(':scope > p.exam-question')];
  const paras=[...sheet.querySelectorAll(':scope > p.exam-item')];
  const lists=[...sheet.querySelectorAll(':scope > ol.task[type="a"],:scope > ol.task[type="A"]')];
  const etym=[...sheet.querySelectorAll(':scope > p.exam-etymology > span')];
  const paper=window.ExaminaPdfExport.prepareDocument();
  const cloned=paper.querySelector('.exam-sheet');
  const css=el=>el&&({margin:px(el,'marginLeft'),padding:px(el,'paddingLeft'),indent:px(el,'textIndent')});
  const out={
   questions:questions.map(el=>({
    css:css(el),number:css(el.querySelector(':scope .exam-q-number')),
    word:wordExamParagraph(el),
    text:el.textContent.trim().slice(0,100)
   })),
   paras:paras.map(el=>({
    css:css(el),letter:css(el.querySelector(':scope > .exam-letter')),
    word:wordExamParagraph(el)
   })),
   lists:lists.map(el=>({
    css:css(el),before:getComputedStyle(el.firstElementChild,'::before').width,
    firstPadding:el.firstElementChild?px(el.firstElementChild,'paddingLeft'):null,
    word:wordBlock(el),
    items:el.children.length,
    culture:el.classList.contains('exam-culture-items'),
    nested:[...el.querySelectorAll(':scope > li > ol[type="a"],:scope > li > ol[type="A"]')]
      .map(o=>({css:css(o),word:wordBlock(o)}))
   })),
   etym:etym.map(el=>({
    css:css(el),letter:css(el.querySelector(':scope > .exam-letter'))
   })),
   etymWord:sheet.querySelector(':scope > p.exam-etymology')
    ?wordExamParagraph(sheet.querySelector(':scope > p.exam-etymology')):'',
   cloned:{
    questions:cloned.querySelectorAll(':scope > p.exam-question').length,
    lists:cloned.querySelectorAll(':scope > ol.task').length,
    items:cloned.querySelectorAll(':scope > p.exam-item').length,
    etym:cloned.querySelectorAll(':scope > p.exam-etymology > span').length
   },
   unchanged:[...sheet.querySelectorAll(':scope > p.exam-question,:scope > p.exam-item')]
    .every((item,i)=>item.textContent===[...cloned.querySelectorAll(':scope > p.exam-question,:scope > p.exam-item')][i]?.textContent)
  };
  return out;
 });
 const context=file+' '+course+'/'+model+'/'+lang;
 assert(v.questions.length>0,context+': sin preguntas');
 for(const q of v.questions){
  close(q.css.margin,18,context+' pregunta margen');
  close(q.css.padding,18,context+' pregunta sangría francesa');
  close(q.css.indent,-18,context+' pregunta texto');
  assert(q.number,context+': falta número con ancho propio');
  close(q.number.css?.width||q.number.padding,0,context+' número padding');
  assert(isExpectedWordIndent(q.word,720,360),context+': Word pregunta no alineada');
  assert(q.word.includes('<w:tab/>'),context+': Word sin tabulación tras número');
 }
 for(const p of v.paras){
  close(p.css.margin,36,context+' subpregunta margen');
  close(p.css.padding,18,context+' subpregunta sangría');
  close(p.css.indent,-18,context+' subpregunta texto');
  assert(p.letter,context+': falta letra propia en análisis o léxico');
  assert(isExpectedWordIndent(p.word,1080,360),context+': Word análisis/léxico');
 }
 for(const list of v.lists){
  close(list.css.margin,36,context+' lista margen');
  close(list.css.padding,18,context+' lista sangría');
  close(list.before,18,context+' ancho de marcador a.');
  if(list.culture)close(list.firstPadding,0,context+' cultura sin sangría añadida');
  assert(list.items>0,context+': lista vacía');
  assert(isExpectedWordIndent(list.word,1080,360),context+': Word lista al margen incorrecto');
  for(const opt of list.nested){
   close(opt.css.margin,18,context+' opción de cultura');
   close(opt.css.padding,18,context+' sangría de opción');
   assert(isExpectedWordIndent(opt.word,1800,360),context+': Word opción anidada');
  }
 }
 for(const e of v.etym){
  close(e.css.padding,18,context+' etimología');
  close(e.css.indent,-18,context+' texto de etimología');
  assert(e.letter,context+': letra etimológica ausente');
 }
 if(v.etym.length){
  assert(v.etymWord.includes('<w:tab w:val="left" w:pos="1080"/>'),
   context+': primera columna Word de etimología sin sangría de texto');
  assert(v.etymWord.includes('<w:tab w:val="left" w:pos="4600"/>'),
   context+': segunda columna Word de etimología sin sangría');
 }
 assert(v.unchanged,context+': el clon PDF no conserva el contenido');
 assert.equal(v.cloned.questions,v.questions.length,context+': PDF sin preguntas');
 assert.equal(v.cloned.items,v.paras.length,context+': PDF sin subpreguntas');
 assert.equal(v.cloned.lists,v.lists.length,context+': PDF sin listas');
 assert.equal(v.cloned.etym,v.etym.length,context+': PDF sin etimologías');
 return {questions:v.questions.length,subparts:v.paras.length+v.lists.reduce((s,x)=>s+x.items,0)+v.etym.length};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  let total=0;
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1180,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(pathToFileURL(path.join(ROOT,file)).href,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ExaminaPdfExport&&!!window.ExaminaVisualFormat);
    for(const [course,model,unit] of fixtures){
     for(const lang of ['es','va']){
      const a=await generate(page,course,model,unit,lang);
      const result=await audit(page,course,model,lang,file);
      assert.equal(result.questions,a.questions);
      total++;
     }
    }
    assert.deepEqual(errors,[],file+': errores JS');
   }finally{await page.close()}
  }
  console.log('Sangrías unificadas: '+total+' exámenes, 3 cursos, todos los modelos ES/VA y PDF/Word de pantalla y autónomo.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
