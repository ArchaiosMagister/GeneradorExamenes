// Prueba real en navegador: vista previa y edición de los siete modelos.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');
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
  return {lexeme:lexeme?.textContent,indicator:indicator?.textContent||'',
   lexemeItalic:wordInline(lexeme).includes('<w:i/>'),
   indicatorItalic:indicator?wordInline(indicator).includes('<w:i/>'):false,
   fullText:cell.textContent,expectedLexeme,expectedIndicator,source:text};
 }));
 for(const sample of typographies){
  assert.equal(sample.lexeme,sample.expectedLexeme,filename+': lema mal identificado '+sample.source);
  assert.equal(sample.indicator,sample.expectedIndicator,filename+': indicación mal separada '+sample.source);
  assert.equal(sample.lexemeItalic,true,filename+': lema no cursivo en Word '+sample.source);
  assert.equal(sample.indicatorItalic,false,filename+': metadato en cursiva '+sample.source);
  assert.equal(sample.fullText,sample.source,filename+': se ha perdido contenido '+sample.source);
 }
 const cases=[
  ['latin1','tablas','UD3'],['latin1','morf','UD3'],['latin1','mixto','UD3'],
  ['latin4','tablas','UD3'],
  ['greek1','complete','UD7'],['greek1','morphology','UD7'],['greek1','translation','UD7']
 ];
 for(const [course,model,unit] of cases){
  await page.selectOption('#course',course);
  await page.selectOption('#model',model);
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
    controls:document.querySelectorAll('#manualMorphWords input[type="text"]').length,
    warning:document.querySelector('#manualMorphWords')?.textContent
   };
  });
  assert(result.visible&&result.height>80&&result.text>80,filename+' '+course+'/'+model+': vista previa ausente '+JSON.stringify(result));
  assert(result.questions>=3,filename+' '+course+'/'+model+': preguntas no renderizadas');
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

  // DOCX reales: se verifican el XML de Word, las tablas y el estilo Palatino.
  for(const answers of [false,true]){
   const downloadPromise=page.waitForEvent('download');
   await page.locator(answers?'#docxAnswers':'#docx').click();
   const download=await downloadPromise;
   assert(download.suggestedFilename().endsWith('.docx'),filename+': descarga Word sin extensión .docx');
   const bytes=await fs.readFile(await download.path());
   const documentXml=readStoredZipEntry(bytes,'word/document.xml');
   const styleXml=readStoredZipEntry(bytes,'word/styles.xml');
   assert(documentXml.includes('<w:document ')&&documentXml.includes('<w:body>')&&documentXml.includes('</w:document>'),
    filename+' '+course+'/'+model+': XML Word incompleto');
   assert(/Palatino/.test(styleXml),filename+' '+course+'/'+model+': fuente Palatino ausente en Word');
   if(screenLayout.tableCount){
    assert(documentXml.includes('<w:tbl>'),filename+' '+course+'/'+model+': tablas ausentes en Word');
    assert(documentXml.includes('<w:i/>'),filename+' '+course+'/'+model+': cursiva ausente en Word');
   }
  }
  // El panel de preguntas es un acordeón cerrado por defecto.
  await page.locator('.menu-section').filter({has:page.locator('#manualMorphWords')}).evaluate(section=>section.open=true);
  if(course==='greek1'&&model==='complete'){
   // El examen completo griego edita la selección del corpus, conservando las soluciones.
   const available=await page.locator('#manualMorphWords select').count();
   assert(available>0,filename+': faltan los selectores del corpus griego');
   const before=await page.evaluate(()=>window.greekLastExam.ids.length);
   await page.locator('#manualMorphWords button').filter({hasText:'Añadir al apartado'}).first().click();
   const after=await page.evaluate(()=>window.greekLastExam.ids.length);
   assert(after>before,filename+': el selector de Griego completo no modifica el examen');
  }else{
   assert(result.controls>0,filename+' '+course+'/'+model+': no se pueden editar formas: '+result.warning);
   const input=page.locator('#manualMorphWords input[type="text"]').first();
   const tableEdit=await input.evaluate(el=>/^(Declinación|Conjugación)/.test(el.parentElement.textContent.trim()));
   await input.fill('FORMA_DE_PRUEBA');
   assert((await page.locator('#paper').textContent()).includes('FORMA_DE_PRUEBA'),filename+' '+course+'/'+model+': la edición no actualiza la vista previa');
   if(tableEdit)assert(await page.locator('#paper .exam-paradigm thead tr:first-child th[colspan] i').filter({hasText:'FORMA_DE_PRUEBA'}).count()>0,filename+': editar título elimina cursiva');
   assert.equal(await page.locator('#paper #answerkey [data-manual-warning]').count(),1,filename+' '+course+'/'+model+': falta advertencia de solucionario');
  }
 }
 await page.selectOption('#course','latin1');
 await page.selectOption('#model','mixto');
 await page.evaluate(()=>{
  document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]==='UD3');
  generate();
 });
 const visibility=await page.locator('#count-forms').evaluate(input=>{
  const ancestors=[];for(let el=input;el;el=el.parentElement){
   ancestors.push({tag:el.tagName,id:el.id,cls:el.className,hidden:el.hidden,open:el.open,display:getComputedStyle(el).display});
   if(el.id==='examLayout')break;
  }
  return ancestors;
 });
 assert(await page.locator('#count-forms').isVisible(),filename+': campo de formas sueltas oculto '+JSON.stringify(visibility));
 await page.fill('#count-forms','1');
 await page.locator('#count-forms').dispatchEvent('change');
 const forms=await page.evaluate(()=>{
  const q=[...document.querySelectorAll('.latin-standard-exam .exam-question')].find(el=>el.textContent.toLowerCase().includes('morfol'));
  return q?.nextElementSibling?.querySelectorAll(':scope > li').length||0;
 });
 assert.equal(forms,1,filename+': el control de formas no actualiza la vista previa');
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
