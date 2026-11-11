// Prueba real en navegador: vista previa y edición de los siete modelos.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

// El exportador Word crea un ZIP válido sin compresión y sin librerías externas.
// Esta lectura verifica el documento realmente descargado, no solo el HTML.
function readStoredZipEntry(bytes,wanted){
 let pos=0;
 while(pos+30<=bytes.length&&bytes.readUInt32LE(pos)===0x04034b50){
  const method=bytes.readUInt16LE(pos+8),size=bytes.readUInt32LE(pos+18);
  const nameLength=bytes.readUInt16LE(pos+26),extraLength=bytes.readUInt16LE(pos+28);
  const name=bytes.toString('utf8',pos+30,pos+30+nameLength);
  const start=pos+30+nameLength+extraLength;
  assert(start+size<=bytes.length,'ZIP truncado: '+name);
  if(name===wanted){
   assert.equal(method,0,'ZIP con compresión inesperada: '+name);
   return bytes.toString('utf8',start,start+size);
  }
  pos=start+size;
 }
 throw new Error('Falta '+wanted+' en el documento Word');
}

async function checkFile(browser,filename){
 const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto(pathToFileURL(path.resolve(filename)).href);
 // El menú siempre muestra todas las preguntas del curso, incluso las que
 // están deshabilitadas para un modelo particular.
 const matrix=[
  ['latin1','morf','UD3',['decl','verb','pronouns','forms'],['lex','sent']],
  ['latin1','morf','UD1',['decl','verb','forms'],['pronouns','lex','sent']],
  ['latin1','mixto','UD3',['forms','lex','sent'],['decl','verb','pronouns']],
  ['latin1','tablas','UD3',['decl','verb','forms','lex','sent'],[]],
  ['latin4','tablas','UD3',['decl','verb','forms','lex','culture','sent'],[]],
  ['greek1','morphology','UD7',['decl','verb','pronouns','forms'],['etymology','sent']],
  ['greek1','translation','UD7',['forms','etymology','sent'],['decl','verb','pronouns']],
  ['greek1','complete','UD7',['decl','verb','forms','etymology','sent'],[]]
 ];
 for(const [course,model,unit,included,disabled] of matrix){
  const menu=await page.evaluate(({course,model,unit})=>{
   const c=document.getElementById('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
   const m=document.getElementById('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
   let checked;
   document.querySelectorAll('.unit-choice').forEach(el=>{el.checked=units[Number(el.value)]===unit;if(el.checked)checked=el});
   checked?.dispatchEvent(new Event('change',{bubbles:true}));
   return [...document.querySelectorAll('#examQuestionMenus [data-question]')].map(el=>({
    kind:el.dataset.question,checked:el.querySelector('.exam-question-toggle')?.checked,
    disabled:el.querySelector('.exam-question-toggle')?.disabled
   }));
  },{course,model,unit});
  assert.equal(menu.length,6,filename+' '+course+'/'+model+': deben verse seis preguntas posibles');
  for(const kind of included)assert(menu.some(x=>x.kind===kind&&x.checked&&!x.disabled),
   filename+' '+course+'/'+model+': pregunta predeterminada '+kind);
  for(const kind of disabled)assert(menu.some(x=>x.kind===kind&&!x.checked&&x.disabled),
   filename+' '+course+'/'+model+': pregunta incompatible '+kind);
 }
 // Las marcas de morfología deben actuar sobre el examen real.
 for(const [course,model] of [['latin1','morf'],['greek1','morphology']]){
  await page.evaluate(({course,model})=>{
   const c=document.getElementById('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
   const m=document.getElementById('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
   let unit;
   document.querySelectorAll('.unit-choice').forEach(el=>{el.checked=units[Number(el.value)]==='UD7';if(el.checked)unit=el});
   unit?.dispatchEvent(new Event('change',{bubbles:true}));
  },{course,model});
  const count=await page.locator('#paper .exam-question').count();
  const toggle=page.locator('#examQuestionMenus [data-question="verb"] .exam-question-toggle');
  await toggle.uncheck();
  assert.equal(await page.locator('#paper .exam-question').count(),count-1,
   filename+' '+course+': quitar tabla verbal debe quitar la pregunta');
  await toggle.check();
  assert.equal(await page.locator('#paper .exam-question').count(),count,
   filename+' '+course+': restaurar la tabla verbal debe restaurar la pregunta');
 }
 // Restablecer el curso para que las pruebas tipográficas latinas sean independientes.
 await page.evaluate(()=>{
  const course=document.getElementById('course');course.value='latin1';
  course.dispatchEvent(new Event('change',{bubbles:true}));
  const model=document.getElementById('model');model.value='tablas';
  model.dispatchEvent(new Event('change',{bubbles:true}));
 });
 // Tipografía filológica: solo el lexema va en cursiva; la información
 // de género (3.ª declinación) y conjugación permanece en redonda.
 const typographies=await page.evaluate(()=>[
  ['rex, regis (m.)','declension','rex, regis','(m.)'],
  ['amō, amāvī, amātum (1ª)','conjugation','amō, amāvī, amātum','(1ª)'],
  ['puella bona','declension','puella bona',''],
  ['ὁ λόγος','declension','ὁ λόγος','']
 ].map(([text,kind,expectedLexeme,expectedIndicator])=>{
  const cell=document.createElement('th');
  cell.innerHTML=examParadigmHeading(text,kind);
  const lexeme=cell.querySelector('i'),indicator=cell.querySelector('.exam-paradigm-indicator');
  const greek=/[\u0370-\u03ff\u1f00-\u1fff]/u.test(text),course=document.getElementById('course');
  const previous=course.value;
  if(greek)course.value='greek1';
  const lexemeItalic=wordInline(lexeme).includes('<w:i/>');
  course.value=previous;
  return {lexeme:lexeme?.textContent,indicator:indicator?.textContent||'',
   greek,lexemeItalic,
   indicatorItalic:indicator?wordInline(indicator).includes('<w:i/>'):false,
   fullText:cell.textContent,expectedLexeme,expectedIndicator,source:text};
 }));
 for(const sample of typographies){
  assert.equal(sample.lexeme,sample.expectedLexeme,filename+': lema mal identificado '+sample.source);
  assert.equal(sample.indicator,sample.expectedIndicator,filename+': indicación mal separada '+sample.source);
  assert.equal(sample.lexemeItalic,!sample.greek,filename+': cursiva incorrecta en Word '+sample.source);
  assert.equal(sample.indicatorItalic,false,filename+': metadato en cursiva '+sample.source);
  assert.equal(sample.fullText,sample.source,filename+': se ha perdido contenido '+sample.source);
 }
 // La exportación Word conserva cursiva solo en los vocablos y no en
 // las letras a./c./d. ni en las consignas.
 const lexWord=await page.evaluate(()=>{
  const markup=document.createElement('p');
  markup.className='exam-item';
  markup.innerHTML='<span class="exam-letter">c.</span> Señala el prefijo de <i>inmortal</i>.';
  return wordExamParagraph(markup);
 });
 assert(lexWord.includes('<w:i/>'),filename+': falta cursiva del estímulo léxico en Word');
 assert(lexWord.includes('inmortal'),filename+': término léxico omitido en Word');
 assert(lexWord.indexOf('c.')<lexWord.indexOf('<w:i/>'),filename+': letra de apartado en cursiva');
 const cases=[
  ['latin1','tablas','UD3'],['latin1','morf','UD3'],['latin1','mixto','UD3'],
  ['latin4','tablas','UD3'],
  ['greek1','complete','UD7'],['greek1','morphology','UD7'],['greek1','translation','UD7']
 ];
 for(const [course,model,unit] of cases){
  await page.evaluate(course=>{const select=document.getElementById('course');select.value=course;select.dispatchEvent(new Event('change',{bubbles:true}))},course);
  await page.evaluate(model=>{const select=document.getElementById('model');select.value=model;select.dispatchEvent(new Event('change',{bubbles:true}))},model);
  await page.evaluate(value=>{
   document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]===value);
   generate();
  },unit);
  const result=await page.evaluate(()=>{
   const paper=document.querySelector('#paper'),sheet=paper.querySelector('.exam-sheet');
   return {
    visible:getComputedStyle(paper).display!=='none',
    height:sheet?.getBoundingClientRect().height||0,
    text:paper.textContent.trim().length,
    questions:paper.querySelectorAll('.exam-question').length,
    controls:document.querySelectorAll('.question-editor input[type="text"]').length,
    greekAnalysisItems:document.querySelectorAll('#paper .exam-form').length,
    warning:document.querySelector('#manualMorphWords')?.textContent
   };
  });
  assert(result.visible&&result.height>80&&result.text>80,filename+' '+course+'/'+model+': vista previa ausente '+JSON.stringify(result));

  // Las puntuaciones son campos propios, se reflejan en el enunciado y en Word.
  await page.waitForFunction(()=>!!window.ExaminaScoring&&
   [...document.querySelectorAll('#paper .exam-question')].every(el=>!!el.querySelector('.exam-question-points')));
  const scoringRows=page.locator('#examScoring .exam-scoring-row input');
  const scoreCount=await page.locator('#paper .exam-question').count();
  assert.equal(await scoringRows.count(),scoreCount,filename+' '+course+'/'+model+': falta puntuación en una pregunta');
  const morphScore=['morf','morphology'].includes(model);
  const scoreValue=await scoringRows.first().inputValue();
  if(!morphScore){
   await scoringRows.first().fill('8,75');
   assert.match(await page.locator('#examScoringTotal').textContent(),/no 10|no 10/i,
    filename+' '+course+'/'+model+': no se avisa si el total es distinto de diez');
  }else{
   await scoringRows.first().fill('2');
   assert.doesNotMatch(await page.locator('#examScoringTotal').textContent(),/no 10|no 10/i,
    filename+' '+course+'/'+model+': morfología no debe exigir diez puntos');
  }
  const previewScore=page.locator('#paper .exam-question-points').first();
  await previewScore.click();
  const inlineScore=page.locator('#paper .exam-score-inline-editor').first();
  await inlineScore.fill('3,25');
  await inlineScore.press('Enter');
  await page.waitForFunction(()=>document.querySelector('#examScoring .exam-scoring-row input')?.value==='3,25');
  assert.equal((await scoringRows.first().inputValue()),'3,25',
   filename+' '+course+'/'+model+': la edición en la vista previa no actualiza el panel');
  assert.match(await page.locator('#paper .exam-question').first().textContent(),/\(3,25p\.\)\.$/,
   filename+' '+course+'/'+model+': puntos no terminan el enunciado');
  const wordScored=await page.evaluate(()=>wordExamParagraph(document.querySelector('#paper .exam-question')));
  assert(wordScored.includes('3,25p.).'),filename+' '+course+'/'+model+': puntuación editada ausente del XML Word');
  // El valor restaurado queda asociado a su pregunta aunque se regenere.
  await scoringRows.first().fill(scoreValue);
  await page.evaluate(()=>generate());
  await page.waitForFunction(expected=>document.querySelector('#examScoring .exam-scoring-row input')?.value===expected,scoreValue);

  if(course==='greek1'&&model==='translation'&&result.greekAnalysisItems>=2){
   // El contador del análisis griego es independiente del de conjugación.
   const numberOfForms=await page.evaluate(()=>{
    const counter=document.getElementById('count-greek-forms'),previous=counter.value;
    counter.value='2';counter.dispatchEvent(new Event('change',{bubbles:true}));
    const count=document.querySelectorAll('#paper .exam-form').length;
    counter.value=previous;counter.dispatchEvent(new Event('change',{bubbles:true}));
    return count;
   });
   assert.equal(numberOfForms,2,filename+': el número de formas griegas no respeta su contador');
  }
  assert(result.questions>=(course==='latin1'&&model==='mixto'?2:3),filename+' '+course+'/'+model+': preguntas no renderizadas');
  const headings=await page.locator('#paper .exam-nouns thead tr:first-child th[colspan], #paper .exam-verbs thead tr:first-child th[colspan]').evaluateAll(
   cells=>cells.map(cell=>({text:cell.textContent,lexeme:cell.querySelector('i')?.textContent,indicator:cell.querySelector('.exam-paradigm-indicator')?.textContent||''}))
  );
  assert(headings.every(h=>h.lexeme&&h.text===h.lexeme+(h.indicator?' '+h.indicator:'')),filename+' '+course+'/'+model+': formato de encabezado alterado '+JSON.stringify(headings));
  // Los sintagmas se activan solo en el examen completo y deben concordar.
  if(model==='tablas'&&(course==='latin1'||course==='latin4')){
   const titles=await page.locator('#paper .exam-nouns thead tr:first-child th[colspan]').allTextContents();
   assert(titles.length>0,filename+': no hay sustantivos declinables');
   assert(titles.every(text=>text.trim().split(/\s+/).length>=2),
    filename+': falta el adjetivo concordado desde el umbral de '+course+' · '+JSON.stringify(titles));
  }
  if(course==='greek1'&&model==='complete'){
   const groups=await page.evaluate(()=>greekVerifiedCorpus.filter(x=>x.kind==='declension')
    .map(x=>greekCompleteNominalGroup(x)).filter(Boolean));
   assert.equal(groups.length,10,filename+': faltan las diez bases griegas verificadas');
   assert(groups.every(g=>/^(?:ὁ|ἡ|τὸ)\s+\S+\s+\S+$/u.test(g.title)),
    filename+': se ha usado un orden predicativo en vez del atributivo');
   assert(groups.every(g=>g.rows.length===5&&g.rows.every(r=>r[1].length===2&&r[1].every(v=>v.trim().split(/\s+/).length>=2))),
    filename+': paradigma nominal griego incompleto');
   assert(groups.every(g=>g.rows[1][1].every(form=>!form.startsWith('ὁ ')&&!form.startsWith('ἡ ')&&!form.startsWith('τὸ '))),
    filename+': se ha inventado un artículo para el vocativo');
  }
  // El espaciado es configurable en puntos; solo se dejan huecos entre oraciones.
  const sentenceGap=await page.evaluate(()=>{
   const control=document.getElementById('sentence-gap-pt');
   if(!control)throw Error('No se encuentra el campo de separación entre oraciones');
   control.value='64';control.dispatchEvent(new Event('change',{bubbles:true}));
   return {
    value:getComputedStyle(document.getElementById('paper')).getPropertyValue('--exam-sentence-gap').trim(),
    latinLines:document.querySelectorAll('#paper .exam-sentences .answer').length,
    latinCount:document.querySelectorAll('#paper .exam-sentences>li').length,
    greekCount:document.querySelectorAll('#paper .exam-sentence').length
   };
  });
  assert.equal(sentenceGap.value,'64pt',filename+': el espaciado no llega a la vista previa');
  assert.equal(sentenceGap.latinLines,0,filename+': persisten líneas bajo las oraciones');
  // El estilo académico se conserva en pantalla y en el medio de impresión.
  const screenLayout=await page.locator('#paper .exam-sheet').evaluate(el=>({
   font:getComputedStyle(el).fontFamily,
   tableCount:el.querySelectorAll('.exam-paradigm').length
  }));
  assert(/Palatino/i.test(screenLayout.font),filename+' '+course+'/'+model+': tipografía académica cambiada');
  await page.emulateMedia({media:'print'});
  const printLayout=await page.locator('#paper .exam-sheet').evaluate(el=>{
   const glossary=el.querySelector('.final-gloss'),table=el.querySelector('.exam-paradigm');
   return {font:getComputedStyle(el).fontFamily,
    columns:glossary?getComputedStyle(glossary).columnCount:null,
    avoidBreak:table?getComputedStyle(table).breakInside:null};
  });
  assert(/Palatino/i.test(printLayout.font),filename+' '+course+'/'+model+': tipografía de impresión cambiada');
  if(printLayout.columns!==null)assert.equal(printLayout.columns,'2',filename+': vocabulario sin dos columnas en impresión');
  if(printLayout.avoidBreak!==null)assert.equal(printLayout.avoidBreak,'avoid',filename+': tablas divididas entre páginas');
  if((course==='latin1'&&model==='tablas')||(course==='greek1'&&model==='complete')){
   const pdf=await page.pdf({printBackground:true,preferCSSPageSize:true});
   assert(pdf.subarray(0,5).toString()==='%PDF-'&&pdf.length>5000,filename+': impresión PDF no generada');
  }
  await page.emulateMedia({media:'screen'});

  const primary=page.locator('#primaryExamSettings'),header=page.locator('#exam-header-controls');
  assert.equal(await primary.count(),1,filename+': faltan las unidades visibles');
  await page.waitForFunction(([c,m])=>{
   const toolbar=document.getElementById('exam-header-controls');
   return toolbar&&toolbar.querySelector('fieldset:nth-child(1) button[aria-pressed="true"]')?.dataset.value===c&&
    toolbar.querySelector('fieldset:nth-child(2) button[aria-pressed="true"]')?.dataset.value===m;
  },[course,model]);
  assert(await header.isVisible(),filename+': botones superiores ocultos');
  assert(await primary.locator('#unitChoices').isVisible(),filename+': unidades ocultas');
  assert(!(await primary.locator('#course').isVisible()),filename+': selector desplegable de asignatura visible');
  assert(!(await primary.locator('#model').isVisible()),filename+': selector desplegable de modelo visible');
  assert(!(await page.locator('#lang').isVisible()),filename+': selector desplegable de idioma visible');
  assert.equal(await header.locator('fieldset').count(),3,filename+': faltan los tres grupos de botones');
  assert.equal(await header.locator('fieldset:nth-child(2) button').count(),course==='latin4'?1:3,
   filename+': modelos incorrectos en la cabecera');
  const shouldHaveSent=!['morf','morphology'].includes(model);
  assert.equal(await page.locator('#group-sentences').isVisible(),shouldHaveSent,filename+': menú de oraciones fuera de contexto');
  assert.equal(await page.locator('#group-vocab').isVisible(),shouldHaveSent,filename+': vocabulario fuera de contexto');
  assert.equal(await page.locator('#group-culture').isVisible(),course==='latin4',filename+': cultura visible fuera de Latín 4.º');
  assert.equal(await page.locator('#examQuestionMenus [data-question="lex"]').count()>0,course!=='greek1',
   filename+': sección de léxico incoherente');
  assert.equal(await page.locator('#examQuestionMenus [data-question="culture"]').count()>0,course==='latin4',
   filename+': sección de cultura incoherente');
  assert((await page.locator('#paper .exam-header').textContent()).includes('trimestre'),filename+': encabezado sin trimestre');
  const listXml=await page.evaluate(()=>{const ol=document.createElement('ol');ol.type='a';ol.innerHTML='<li>Primera línea y continuación</li>';return wordBlock(ol)});
  assert(listXml.includes('w:left="1080" w:hanging="360"')&&listXml.includes('<w:tab/>'),filename+': lista Word sin sangría y tabulación');

  // Comprueba el Blob DOCX construido al pulsar los botones de exportación.
  // La captura evita el bloqueo de descargas en navegadores headless bajo file://
  // sin eludir el exportador real de la aplicación.
  for(const answers of [false,true]){
   const caseLabel=filename+' '+course+'/'+model+' '+(answers?'solucionario':'alumnado');
   console.log('Comprobando DOCX:',caseLabel);
   const exported=await page.evaluate(async answers=>{
    const previous=downloadBlob;
    let blob,name;
    try{
     downloadBlob=(filename,output)=>{name=filename;blob=output};
     document.getElementById(answers?'docxAnswers':'docx').click();
    }finally{downloadBlob=previous}
    if(!blob)throw new Error('El botón no generó ningún documento Word');
    return {filename:name,bytes:Array.from(new Uint8Array(await blob.arrayBuffer()))};
   },answers);
   assert(exported.filename.endsWith('.docx'),caseLabel+': nombre Word incorrecto');
   const bytes=Buffer.from(exported.bytes);
   if(filename==='index.html'&&course==='latin1'&&model==='tablas'&&!answers){
    fs.mkdirSync(path.resolve(__dirname,'../test-artifacts'),{recursive:true});
    fs.writeFileSync(path.resolve(__dirname,'../test-artifacts/examen-puntuaciones-latin1.docx'),bytes);
   }
   const documentXml=readStoredZipEntry(bytes,'word/document.xml');
   const styleXml=readStoredZipEntry(bytes,'word/styles.xml');
   assert(documentXml.includes('p.).'),caseLabel+': el enunciado Word no incluye puntuación al final');
   assert(documentXml.includes('<w:document ')&&documentXml.includes('<w:body>')&&documentXml.includes('</w:document>'),
    caseLabel+': XML Word incompleto');
   assert(/Palatino/.test(styleXml),caseLabel+': fuente Palatino ausente en Word');
   if(sentenceGap.latinCount>1||sentenceGap.greekCount>1)
    assert(documentXml.includes('<w:spacing w:before="1280"'),caseLabel+': Word no respeta el espaciado de 64 pt entre oraciones');
   if(course==='latin1'&&['tablas','mixto'].includes(model)&&!answers)
    assert(!documentXml.includes('________________________________________________'),caseLabel+': el Word mantiene líneas de respuesta en las oraciones');
   if(screenLayout.tableCount){
    assert(documentXml.includes('<w:tbl>'),caseLabel+': tablas ausentes en Word');
    if(course==='greek1')assert(!documentXml.includes('<w:i/>'),caseLabel+': hay griego en cursiva en Word');
    else assert(documentXml.includes('<w:i/>'),caseLabel+': cursiva latina ausente en Word');
   }
  }
  if(course==='greek1'&&model==='translation'){
   await page.locator('#group-sentences').evaluate(el=>el.open=true);
   await page.locator('#newSentences').fill('ὁ ἄνθρωπος ἐν τῇ οἰκίᾳ μένει.');
   const greekGloss=await page.evaluate(()=>({
    sentenceCount:document.querySelectorAll('#paper .exam-sentence').length,
    glossCount:document.querySelectorAll('#paper .final-gloss .gloss-item').length,
    placeholder:document.querySelector('#paper .final-gloss')?.textContent.includes('[Traducción pendiente de revisión]')||false
   }));
   if(greekGloss.sentenceCount>0){
    assert(greekGloss.glossCount>0,filename+': el examen de traducción griega carece de vocabulario');
    assert(!greekGloss.placeholder,filename+': traducción griega inventada o sin verificar en el vocabulario imprimible');
   }
  }
  // El panel de preguntas es un acordeón cerrado por defecto.
  await page.locator('#examQuestionSettings').evaluate(section=>section.open=true);
  await page.locator('#examQuestionMenus details').evaluateAll(sections=>sections.forEach(el=>el.open=true));
  if(course==='greek1'&&model==='complete'){
   // El examen completo griego edita la selección del corpus, conservando las soluciones.
   const available=await page.locator('.question-editor select').count();
   assert(available>0,filename+': faltan los selectores del corpus griego');
   const before=await page.evaluate(()=>window.greekLastExam.ids.length);
   await page.locator('.question-editor button').filter({hasText:'Añadir al apartado'}).first().click();
   const after=await page.evaluate(()=>window.greekLastExam.ids.length);
   assert(after>before,filename+': el selector de Griego completo no modifica el examen');
  }else if(course==='greek1'&&model==='translation'&&!result.controls&&!result.greekAnalysisItems){
   // Si el banco de UD elegida no tiene formas griegas verificadas,
   // no debe inventarse una entrada editable vacía.
   assert.equal(result.greekAnalysisItems,0,'No se deben editar formas inexistentes');
  }else{
   assert(result.controls>0,filename+' '+course+'/'+model+': no se pueden editar formas: '+JSON.stringify(result));
   const input=page.locator('.question-editor input[type="text"]').first();
   const tableEdit=await input.evaluate(el=>/^(Declinación|Conjugación)/.test(el.parentElement.textContent.trim()));
   if(!(await input.isVisible())){
    const trace=await input.evaluate(el=>{
     const chain=[];for(let p=el;p;p=p.parentElement){
      chain.push({tag:p.tagName,id:p.id,cls:p.className,hidden:p.hidden,open:p.open,
       computed:getComputedStyle(p).display,rect:p.getBoundingClientRect().toJSON()});
      if(p.id==='examLayout')break;
     }return chain;
    });
    throw Error(filename+' '+course+'/'+model+' editor oculto: '+JSON.stringify(trace));
   }
   await input.fill('FORMA_DE_PRUEBA');
   assert((await page.locator('#paper').textContent()).includes('FORMA_DE_PRUEBA'),filename+' '+course+'/'+model+': la edición no actualiza la vista previa');
   if(tableEdit)assert(await page.locator('#paper .exam-paradigm thead tr:first-child th[colspan] i, #paper .morph-syntagm-item i').filter({hasText:'FORMA_DE_PRUEBA'}).count()>0,filename+': editar título elimina cursiva');
   assert.equal(await page.locator('#paper #answerkey [data-manual-warning]').count(),1,filename+' '+course+'/'+model+': falta advertencia de solucionario');
  }
 }
 // Los pulsadores deben cambiar el estado real del examen sin duplicar controles.
 await page.locator('#exam-header-controls fieldset:nth-child(1) button[data-value="latin1"]').click();
 await page.locator('#exam-header-controls fieldset:nth-child(2) button[data-value="morf"]').click();
 assert.equal(await page.locator('#model').inputValue(),'morf',filename+': botones no cambian modelo');
 await page.locator('#exam-header-controls fieldset:nth-child(3) button[data-value="va"]').click();
 assert.equal(await page.locator('#lang').inputValue(),'va',filename+': botones no cambian idioma');
 await page.locator('#exam-header-controls fieldset:nth-child(3) button[data-value="es"]').click();
 assert.equal(await page.locator('#lang').inputValue(),'es',filename+': botones no restauran castellano');
 await page.evaluate(()=>{const course=document.getElementById('course');course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));const model=document.getElementById('model');model.value='mixto';model.dispatchEvent(new Event('change',{bubbles:true}))});
 await page.evaluate(()=>{
  document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]==='UD3');
  generate();
 });
 const formsCountInput=page.locator('#examQuestionMenus [data-question="forms"] label:has-text("Número de formas") input');
 await page.locator('#examQuestionMenus [data-question="forms"]').evaluate(section=>section.open=true);
 const visibility=await formsCountInput.evaluate(input=>{
  const ancestors=[];for(let el=input;el;el=el.parentElement){
   ancestors.push({tag:el.tagName,id:el.id,cls:el.className,hidden:el.hidden,open:el.open,display:getComputedStyle(el).display});
   if(el.id==='examLayout')break;
  }
  return ancestors;
 });
 assert(await formsCountInput.isVisible(),filename+': campo de formas sueltas oculto '+JSON.stringify(visibility));
 await formsCountInput.fill('1');
 await formsCountInput.dispatchEvent('change');
 const forms=await page.evaluate(()=>{
  const q=[...document.querySelectorAll('.latin-standard-exam .exam-question')].find(el=>el.textContent.toLowerCase().includes('morfol'));
  return q?.nextElementSibling?.querySelectorAll(':scope > li').length||0;
 });
 assert.equal(forms,1,filename+': el control de formas no actualiza la vista previa');
 // Casos tomados del formato docente: los vocablos exigibles se conservan
 // con enunciado solamente, y una enclítica se analiza sin inventar lemas.
 const glossaryRegression=await page.evaluate(()=>{
  const course=document.getElementById('course'),model=document.getElementById('model');
  const scope=document.getElementById('glossScope');
  const previous={course:course.value,model:model.value,scope:scope.value,required:examRequired.slice()};
  const parse=html=>{
   const el=document.createElement('div');el.innerHTML=html;
   return {
    rows:[...el.querySelectorAll('.gloss-item')].map(x=>x.textContent),
    warning:el.querySelector('.notice.no-print')?.textContent||'',
    printText:el.querySelector('.final-gloss')?.textContent||''
   };
  };
  try{
   course.value='latin1';model.value='tablas';scope.value='all';
   const base=parse(buildFinalLexicon(['UD1'],[{text:'Puellaque amat in villa. Quoque quisque uterque.'}]));
   examRequired.push({course:'latin1',unit:'UD1',key:examKey('puella'),entry:'puella, -ae'});
   const required=parse(buildFinalLexicon(['UD1'],[{text:'Puella amat.'}]));
   const unknown=parse(buildFinalLexicon(['UD1'],[{text:'FORMADESCONOCIDAXYZ'}]));
   return {base,required,unknown,defaultScope:previous.scope};
  }finally{
   course.value=previous.course;model.value=previous.model;scope.value=previous.scope;
   examRequired.length=0;examRequired.push(...previous.required);
  }
 });
 assert.equal(glossaryRegression.defaultScope,'all',filename+': se ocultan por defecto las palabras exigibles');
 assert(glossaryRegression.base.rows.some(x=>/puella/i.test(x)),filename+': no se reconoce la base de la enclítica -que');
 assert(glossaryRegression.base.rows.some(x=>/amo/i.test(x)),filename+': no se incorpora un verbo con enunciado');
 for(const lemma of [/^quoque/i,/^quisque/i,/^uterque/i,/^[–-]que/i]){
  assert(glossaryRegression.base.rows.some(x=>lemma.test(x)),filename+': falta '+lemma);
 }
 assert(!glossaryRegression.base.rows.some(x=>/^in\b/i.test(x)),filename+': el glosario incluye una preposición');
 assert(!/\bin\b/i.test(glossaryRegression.base.warning),filename+': «in» figura como forma sin resolver');
 const requiredWord=glossaryRegression.required.rows.find(x=>/puella/i.test(x));
 assert(requiredWord&&!requiredWord.includes(':'),filename+': el vocabulario exigible necesita enunciado pero no traducción');
 assert(!glossaryRegression.unknown.printText.includes('FORMADESCONOCIDAXYZ'),filename+': se ha inventado un lema');
 assert(glossaryRegression.unknown.warning.includes('FORMADESCONOCIDAXYZ'),filename+': falta advertencia para forma desconocida');

 const noSentences=await page.evaluate(()=>{
  const key='latin1/mixto/sent',had=Object.hasOwn(examQuestionChoiceState,key),previous=examQuestionChoiceState[key];
  try{
   examQuestionChoiceState[key]=false;generate();
   return {sentences:document.querySelectorAll('#paper .latin-translation-exam ol.task li').length,
    glossary:document.querySelectorAll('#paper .final-gloss .gloss-item').length};
  }finally{
   if(had)examQuestionChoiceState[key]=previous;else delete examQuestionChoiceState[key];
   generate();
  }
 });
 assert.equal(noSentences.glossary,0,filename+': se añade vocabulario de oraciones desactivadas');
 // Latín I, UD2 y UD3: edición bidireccional y filtros sin regenerar.
 await page.evaluate(()=>{
  const course=document.getElementById('course'),model=document.getElementById('model');
  course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
  model.value='mixto';model.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('.unit-choice').forEach(el=>el.checked=['UD2','UD3'].includes(units[Number(el.value)]));
  document.getElementById('group-sentences').open=true;
  document.getElementById('group-vocab').open=true;
  examRequired.push({course:'latin1',unit:'UD2',key:examKey('puella'),entry:'puella, –æ'});
  generate();
 });
 const slots=page.locator('#paper [data-sentence-slot]');
 const editor=page.locator('#newSentences');
 const gloss=page.locator('#examSentenceGlossary');
 assert.equal(await slots.count(),7);
 assert((await slots.allTextContents()).every(text=>!text),'Los huecos de traducción deben empezar vacíos');
 await editor.fill('Puella in villa laborat.\n\nNauta navigat.');
 assert.deepEqual((await slots.allTextContents()).slice(0,3),['Puella in villa laborat.','','Nauta navigat.']);
 const requiredRow=gloss.locator('.gloss-item').filter({hasText:/^puella/i});
 assert.equal(await requiredRow.count(),1);
 assert(!/[:‘“]/.test(await requiredRow.textContent()),'La entrada exigible debe ir sin significado');
 assert.equal(await gloss.locator('.gloss-item').filter({hasText:/^in\b/i}).count(),0);
 assert(await gloss.locator('.gloss-item').filter({hasText:/^villa.+:/i}).count());
 await slots.nth(1).fill('Puella amat.');
 assert.equal(await editor.inputValue(),'Puella in villa laborat.\nPuella amat.\nNauta navigat.');
 assert(await gloss.locator('.gloss-item').filter({hasText:/^amo[ ,]/i}).count());
 const previewIdentity=await slots.first().elementHandle();
 await page.selectOption('#glossScope','outside');
 assert.equal(await requiredRow.count(),0);
 assert(await previewIdentity.evaluate(el=>el.isConnected),'El filtro reconstruyó la vista previa');
 assert.equal(await editor.inputValue(),'Puella in villa laborat.\nPuella amat.\nNauta navigat.');
 await page.evaluate(()=>{
  const count=document.getElementById('count-sent');
  count.value=2;count.dispatchEvent(new Event('change',{bubbles:true}));
 });
 assert.equal(await slots.count(),2);
 assert.equal(await gloss.locator('.gloss-item').filter({hasText:/^nauta/i}).count(),0);
 await page.evaluate(()=>{
  const count=document.getElementById('count-sent');
  count.value=7;count.dispatchEvent(new Event('change',{bubbles:true}));
 });
 assert.equal(await slots.nth(2).textContent(),'Nauta navigat.');
 const doc=page.waitForEvent('download');
 await page.evaluate(()=>exportWord(false));
 const downloaded=await doc;
 const xml=readStoredZipEntry(fs.readFileSync(await downloaded.path()),'word/document.xml');
 assert(xml.includes('Puella amat.')&&xml.includes('Nauta navigat.')&&xml.includes('g.'));
 await page.setViewportSize({width:390,height:844});
 assert(await page.locator('#paper .exam-sheet').isVisible(),filename+': vista previa oculta en móvil');
 assert.deepEqual(errors,[],filename+': errores JavaScript');
 await context.close();
}

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try {
  for(const filename of ['index.html','offline.html'])await checkFile(browser,filename);
  console.log('OK: vistas previas y edición de los siete modelos en web y versión offline.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
