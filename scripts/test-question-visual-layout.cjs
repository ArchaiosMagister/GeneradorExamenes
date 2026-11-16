'use strict';
/* Espaciado cultural, enunciados y Word: no tocar bancos ni re-sortear ejercicios. */
const assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
function zipEntry(bytes,wanted){
 let off=0;
 while(off+30<=bytes.length&&bytes.readUInt32LE(off)===0x04034b50){
  const len=bytes.readUInt32LE(off+18),nameLen=bytes.readUInt16LE(off+26);
  const extra=bytes.readUInt16LE(off+28),name=bytes.toString('utf8',off+30,off+30+nameLen);
  const start=off+30+nameLen+extra;
  if(name===wanted){assert.equal(bytes.readUInt16LE(off+8),0);return bytes.toString('utf8',start,start+len)}
  off=start+len;
 }
 throw Error('No se encontró el componente Word '+wanted);
}
async function wordXml(page){
 const raw=await page.evaluate(async()=>{
  const original=downloadBlob,review=window.ExaminaTeacherReview,old=review?.evidenceMayExport;
  let blob;
  try{
   if(review)review.evidenceMayExport=()=>true;
   downloadBlob=(_name,b)=>blob=b;
   exportWord(false);
  }finally{
   downloadBlob=original;
   if(review)review.evidenceMayExport=old;
  }
  if(!blob)throw Error('El exportador real no produjo documento Word');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
 });
 return zipEntry(Buffer.from(raw),'word/document.xml');
}
async function configure(page,lang){
 return page.evaluate(lang=>{
  const set=(id,value)=>{
   const control=document.getElementById(id);control.value=value;
   control.dispatchEvent(new Event('change',{bubbles:true}));
  };
  set('course','latin4');set('model','tablas');set('lang',lang);
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  const picked=choices.find(el=>units[Number(el.value)]==='UD4');
  if(!picked)throw Error('No se encontró UD4 de Latín 4.º');
  choices.forEach(el=>el.checked=el===picked);
  picked.dispatchEvent(new Event('change',{bubbles:true}));
  const culture=document.getElementById('culture');
  culture.checked=true;
  examQuestionChoiceState['latin4/tablas/culture']=true;
  examSelectionCache.clear();
  generate();
  window.ExaminaScoring?.sync?.(); // La prueba consulta el motor tras actualizar la vista previa.
  const sheet=document.querySelector('#paper .exam-sheet');
  const q=sheet?.querySelector('.exam-question[data-exam-kind="culture"]');
  const list=q?.nextElementSibling;
  if(!list||!list.classList.contains('exam-culture-items'))throw Error('Lista de cultura no generada');
  const questions=[...list.children].filter(el=>el.tagName==='LI');
  if(questions.length<2)throw Error('Se requieren al menos dos subpreguntas para comprobar espacio');
  const second=questions[1];
  return {
   qCount:sheet.querySelectorAll('.exam-question').length,
   scoreCount:window.ExaminaScoring.rows().length,
   texts:questions.map(el=>el.firstChild?.textContent?.trim()||''),
   hasAnswer:!!list.querySelector('.answer'),
   padding:getComputedStyle(second).paddingLeft,
   gap:getComputedStyle(second).marginTop,
   before:getComputedStyle(q).marginTop,
   formatShown:!!document.querySelector('#exam-ui-shell>#examVisualSettings')&&
    !document.querySelector('#examQuestionMenus #examVisualSettings'),
   culturaVisible:!document.getElementById('examCultureFormatRow').hidden,
   html:sheet.innerHTML
  };
 },lang);
}
function nearPt(value,pt){return Math.abs(parseFloat(value)-pt*96/72)<1.5}
function validateXml(xml,questions,before,gap){
 const paras=[...xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map(x=>x[0]);
 const culture=questions.map(q=>paras.find(p=>p.includes(q)));
 assert(culture.every(Boolean),'Una pregunta de cultura se ha perdido del DOCX');
 assert(culture.every(p=>p.includes('<w:ind w:left="1080" w:hanging="360"/>')),
  'La tabulación de a., b., c. sigue pegada al texto en Word');
 assert(culture.every(p=>p.includes('<w:tab/>')),
  'Falta el separador entre viñeta y texto cultural en Word');
 assert(!culture.some(p=>p.includes('____')),'Cultura conserva líneas de respuesta en Word');
 assert(culture[1].includes('<w:spacing w:before="'+Math.round(gap*20)+'" w:after="0"/>'),
  'No se exportan los puntos de separación entre preguntas de cultura');
 const conjuga=paras.find(p=>p.includes('Conjuga en'));
 assert(conjuga,'No se generó el enunciado de la segunda pregunta');
 assert(conjuga.includes('w:before="'+Math.round(before*20)+'"'),
  'El margen anterior al enunciado no está en puntos Word');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const context=await browser.newContext({viewport:{width:1180,height:860}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(pathToFileURL(path.resolve(__dirname,'..',file)).href,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ExaminaVisualFormat&&!!window.ExaminaScoring?.rows);
    const defaultView=await configure(page,'es');
    assert(defaultView.formatShown,file+': falta apartado de formato independiente');
    assert(defaultView.culturaVisible,file+': formato cultural inaccesible');
    assert(!defaultView.hasAnswer,file+': cultura sigue mostrando líneas de respuesta');
    assert.equal(await page.locator('#examCultureGapPt').inputValue(),'5',
     file+': valor inicial cultural distinto de 5 pt');
    assert.equal(await page.locator('#examQuestionBeforePt').inputValue(),'12',
     file+': valor inicial de enunciado distinto de 12 pt');
    assert(nearPt(defaultView.gap,5),file+': vista previa no respeta cinco puntos culturales');
    assert(nearPt(defaultView.before,12),file+': vista previa no respeta 12 puntos antes del enunciado');
    assert(Math.abs(parseFloat(defaultView.padding))<1,file+': cultura conserva una sangría adicional distinta de morfología');
    assert.equal(defaultView.qCount,defaultView.scoreCount,file+': controles de puntuación desincronizados');
    validateXml(await wordXml(page),defaultView.texts,12,5);
    // Exportar Word añade metadatos de puntuación al DOM sin cambiar ninguna pregunta;
    // capturarlos ahora evita confundir esa sincronización con una regeneración.
    const htmlAfterWord=await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML);

    const layout=page.locator('#examVisualSettings');
    await layout.evaluate(el=>el.open=true);
    const change=async(id,value)=>{
     const input=page.locator('#'+id);await input.fill(value);await input.press('Tab');
    };
    await change('examQuestionBeforePt','18');
    await change('examCultureGapPt','9.5');
    const custom=await page.evaluate(()=>{
     const paper=document.getElementById('paper');
     const questions=[...paper.querySelectorAll('.exam-question')];
     const culture=paper.querySelector('.exam-culture-items');
     return {
      html:paper.querySelector('.exam-sheet').innerHTML,
      questions:questions.length,
      scoreCount:window.ExaminaScoring.rows().length,
      before:getComputedStyle(questions[1]).marginTop,
      gap:getComputedStyle(culture.children[1]).marginTop,
      snapshot:window.ExaminaVisualFormat.snapshot()
     };
    });
    assert.equal(custom.html,htmlAfterWord,file+': cambiar formato volvió a sortear el examen');
    assert.equal(custom.questions,defaultView.qCount,file+': se perdieron preguntas');
    assert.equal(custom.questions,custom.scoreCount,file+': se alteraron puntuaciones');
    assert(nearPt(custom.before,18)&&nearPt(custom.gap,9.5),file+': la vista previa no se actualiza');
    assert.equal(custom.snapshot.questionBeforePt,18);
    assert.equal(custom.snapshot.cultureGapPt,9.5);
    validateXml(await wordXml(page),defaultView.texts,18,9.5);

    await page.locator('#group-drafts').evaluate(el=>el.open=true);
    await page.locator('#saveDraft').click();
    await change('examQuestionBeforePt','2');
    await change('examCultureGapPt','1');
    await page.locator('#restoreDraft').click();
    assert.equal(await page.locator('#examQuestionBeforePt').inputValue(),'18',
     file+': borrador no recupera espacio anterior del enunciado');
    assert.equal(await page.locator('#examCultureGapPt').inputValue(),'9.5',
     file+': borrador no recupera espacio entre preguntas');
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ExaminaVisualFormat);
    assert.equal(await page.locator('#examQuestionBeforePt').inputValue(),'18',
     file+': el espacio anterior no persiste entre recargas');
    assert.equal(await page.locator('#examCultureGapPt').inputValue(),'9.5',
     file+': el espaciado cultural no persiste');

    const va=await configure(page,'va');
    assert.equal(va.qCount,va.scoreCount,file+': Word valenciano pierde preguntas');
    assert(!va.hasAnswer,file+': cultura valenciana aún tiene líneas');
    assert.match(await page.locator('#examVisualTitle').textContent(),/Format i espaiat/);
    const vaXml=await wordXml(page);
    const vaParas=[...vaXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map(x=>x[0]);
    assert(vaParas.some(p=>p.includes('Cultura clàssica')),'Falta título valenciano de cultura en Word');
    assert(vaParas.some(p=>p.includes('Conjuga en present')&&p.includes('w:before="360"')),
     'La separación no llega al enunciado valenciano');
    assert.deepEqual(errors,[],file+': errores JS tras configuración de formato');
   }finally{await context.close()}
  }
  console.log('OK formato: 5 pt cultura, 12 pt enunciados; sin líneas; separación de letras; cambios 18/9,5 pt, Word ES/VA, borradores y PWA sin regeneración.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
