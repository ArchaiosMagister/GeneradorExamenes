// Prueba real en navegador: vista previa y edición de los siete modelos.
const assert=require('node:assert/strict');
const path=require('node:path');
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
   const documentXml=readStoredZipEntry(bytes,'word/document.xml');
   const styleXml=readStoredZipEntry(bytes,'word/styles.xml');
   assert(documentXml.includes('<w:document ')&&documentXml.includes('<w:body>')&&documentXml.includes('</w:document>'),
    caseLabel+': XML Word incompleto');
   assert(/Palatino/.test(styleXml),caseLabel+': fuente Palatino ausente en Word');
   if(screenLayout.tableCount){
    assert(documentXml.includes('<w:tbl>'),caseLabel+': tablas ausentes en Word');
    if(course==='greek1')assert(!documentXml.includes('<w:i/>'),caseLabel+': hay griego en cursiva en Word');
    else assert(documentXml.includes('<w:i/>'),caseLabel+': cursiva latina ausente en Word');
   }
  }
  if(course==='greek1'&&model==='translation'){
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
   if(tableEdit)assert(await page.locator('#paper .exam-paradigm thead tr:first-child th[colspan] i').filter({hasText:'FORMA_DE_PRUEBA'}).count()>0,filename+': editar título elimina cursiva');
   assert.equal(await page.locator('#paper #answerkey [data-manual-warning]').count(),1,filename+' '+course+'/'+model+': falta advertencia de solucionario');
  }
 }
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
   const base=parse(buildFinalLexicon(['UD1'],[],[{text:'Puellaque amat.'}],[],[],{sentencesOnly:true}));
   examRequired.push({course:'latin1',unit:'UD1',key:examKey('puella'),entry:'puella, -ae'});
   const required=parse(buildFinalLexicon(['UD1'],[],[{text:'Puella amat.'}],[],[],{sentencesOnly:true}));
   const unknown=parse(buildFinalLexicon(['UD1'],[],[{text:'FORMADESCONOCIDAXYZ'}],[],[],{sentencesOnly:true}));
   return {base,required,unknown,defaultScope:previous.scope};
  }finally{
   course.value=previous.course;model.value=previous.model;scope.value=previous.scope;
   examRequired.length=0;examRequired.push(...previous.required);
  }
 });
 assert.equal(glossaryRegression.defaultScope,'all',filename+': se ocultan por defecto las palabras exigibles');
 assert(glossaryRegression.base.rows.some(x=>/puella/i.test(x)),filename+': no se reconoce la base de la enclítica -que');
 assert(glossaryRegression.base.rows.some(x=>/amo/i.test(x)),filename+': no se incorpora un verbo con enunciado');
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
