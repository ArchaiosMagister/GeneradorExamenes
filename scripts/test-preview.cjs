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
 // El enunciado latino conserva su cursiva en Word, pero la letra es
 // siempre redonda, tanto en párrafos de examen como en listas alfabéticas.
 const markerExample=await page.evaluate(()=>{
  const p=document.createElement('p');
  p.className='exam-item reference-analysis-item';
  p.innerHTML='a. <i>magna</i>:';
  const xml=wordExamParagraph(p);
  const ol=document.createElement('ol');ol.type='a';ol.innerHTML='<li><i>Aratrum agricolam iuvat.</i></li>';
  const list=wordBlock(ol);
  return {xml,list};
 });
 for(const [name,xml] of Object.entries(markerExample)){
  assert(/<w:i w:val="0"\/>/.test(xml),filename+': marcador de lista no explícitamente redondo ('+name+')');
  assert(/<w:i\/>/.test(xml),filename+': se perdió la cursiva del contenido ('+name+')');
  assert(/<w:t xml:space="preserve">a\./.test(xml),filename+': falta la letra a. ('+name+')');
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

  // Banco existente: solo fichas documentadas; las exigibles pierden
  // la traducción, no el enunciado. La comprobación no modifica el almacén.
  if(course==='latin1'&&model==='tablas'){
   const lexicon=await page.evaluate(()=>{
    const row=latinSharedBank.vocabulary('latin1').find(x=>x.meaning&&x.entry.includes(','));
    if(!row)return {error:'No hay un lema con enunciado y significado para la prueba'};
    const key=examKey(row.entry),sample={text:headLex(row.entry)};
    const before=buildFinalLexicon(['UD3'],[],[sample],[],[],{sentencesOnly:true});
    examRequired.push({course:'latin1',unit:'UD1',key,entry:row.entry});
    const after=buildFinalLexicon(['UD3'],[],[sample],[],[],{sentencesOnly:true});
    examRequired.pop();
    const parse=html=>{
     const el=document.createElement('div');el.innerHTML=html;
     return {item:el.querySelector('.gloss-item')?.textContent||'',
      lexical:el.querySelector('.gloss-item i')?.textContent||''};
    };
    return {row:row.entry,before:parse(before),after:parse(after)};
   });
   assert(!lexicon.error,filename+': '+lexicon.error);
   assert(lexicon.before.lexical&&lexicon.after.lexical,filename+': falta el enunciado automático');
   assert.equal(lexicon.before.lexical,lexicon.after.lexical,filename+': la ficha cambió al marcar vocabulario exigible');
   assert(lexicon.before.item.includes(':'),filename+': falta traducción fuera del vocabulario exigible');
   assert(!lexicon.after.item.includes(':'),filename+': aparece traducción en vocabulario exigible');
  }
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
   if((await page.locator('#paper ol[type="a"] li, #paper .exam-item').count())>0){
    assert(documentXml.includes('<w:i w:val="0"/>'),caseLabel+': el Word no distingue letras redondas del texto cursivo');
   }
   if(screenLayout.tableCount){
    assert(documentXml.includes('<w:tbl>'),caseLabel+': tablas ausentes en Word');
    assert(documentXml.includes('<w:i/>'),caseLabel+': cursiva ausente en Word');
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
 // Cuatro plantillas reales de Latín I: unidad, estructura y vocabulario.
 const teacherModels=[
  {model:'tablas',unit:'UD2',questions:4,nouns:2,verbs:1,sentences:6,gloss:true},
  {model:'morf',unit:'UD3',questions:3,nouns:2,verbRows:10,gloss:false},
  {model:'morf',unit:'UD6',questions:3,nouns:1,pronRows:15,gloss:false},
  {model:'mixto',unit:'UD6',questions:3,nouns:0,sentences:7,preverbial:true,gloss:true}
 ];
 for(const expected of teacherModels){
  await page.selectOption('#course','latin1');
  await page.selectOption('#model',expected.model);
  await page.evaluate(unit=>{
   document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]===unit);
   generate();
  },expected.unit);
  const shape=await page.locator('#paper .exam-sheet').evaluate(el=>{
   const questions=[...el.querySelectorAll('.exam-question')];
   const sentenceQuestion=questions.find(q=>/traduce|tradueix/i.test(q.textContent));
   return {
    questions:questions.length,
    texts:questions.map(q=>q.textContent),
    nouns:el.querySelectorAll('.exam-nouns').length,
    verbs:el.querySelectorAll('.exam-verbs').length,
    verbRows:el.querySelectorAll('.reference-verb-table tbody tr').length,
    pronRows:el.querySelectorAll('.exam-pronouns tbody tr').length,
    sentences:sentenceQuestion?.nextElementSibling?.querySelectorAll(':scope > li').length||0,
    preverbial:questions.some(q=>/preverbial|preverbal/i.test(q.textContent)),
    gloss:el.querySelectorAll('.final-gloss .gloss-item').length,
    visibleKey:!!el.querySelector('#answerkey')&&getComputedStyle(el.querySelector('#answerkey')).display!=='none'
   };
  });
  const id=filename+' Latín I '+expected.model+' '+expected.unit;
  assert.equal(shape.questions,expected.questions,id+' número de preguntas: '+JSON.stringify(shape.texts));
  assert.equal(shape.nouns,expected.nouns,id+' tablas de declinación');
  if(expected.verbs!==undefined)assert.equal(shape.verbs,expected.verbs,id+' tabla de conjugación');
  if(expected.verbRows!==undefined)assert.equal(shape.verbRows,expected.verbRows,id+' formas verbales');
  if(expected.pronRows!==undefined)assert.equal(shape.pronRows,expected.pronRows,id+' pronombres');
  if(expected.sentences!==undefined)assert(shape.sentences>0&&shape.sentences<=expected.sentences,
   id+' oraciones documentadas, límite '+expected.sentences+': '+shape.sentences);
  if(expected.preverbial)assert(shape.preverbial,id+' falta derivación preverbial');
  if(expected.gloss)assert(shape.gloss>0,id+' falta vocabulario automático de las oraciones');
  assert(!shape.visibleKey,id+' no deben mostrarse soluciones');
 }
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
