'use strict';
// Regresiones del espacio docente: sin despliegue ni mutación del banco.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'test-artifacts','pdf');
const engineName=process.env.PDF_TEST_BROWSER==='webkit'?'webkit':'chromium';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(e,buffer)=>{
  if(e){res.writeHead(404).end();return}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  res.end(buffer);
 });
});
async function main(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 fs.mkdirSync(artifacts,{recursive:true});
 const engine=engineName==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:820,height:1180},acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
   await page.waitForFunction(()=>!!window.ExaminaPdfExport&&!!document.getElementById('academicNav'));
   const structure=await page.evaluate(isStandalone=>{
    const exam=document.getElementById('exam-ui-shell');
    const editor=document.getElementById('examEditorPanel');
    return {
     one:[...['docx','print','pdfDownload','saveDraft','downloadDraft','examinaBackupExport']].every(id=>document.querySelectorAll('#'+id).length===1)&&
      !document.querySelector('#docxAnswers,#quickWordAnswers,#solutions'),
     exportPlace:!!document.querySelector('#examPreviewActions #docx')&&!!document.querySelector('#examPreviewActions #saveDraft')&&!!exam.querySelector('#examinaBackupExport'),
     oldOut:!editor.contains(document.getElementById('group-morph'))&&!editor.contains(document.getElementById('offlineLemmaPanel')),
     academic:['group-morph','offlineLemmaPanel','morphTeacherReview','academicEvidenceReview','greekDiscrepancyReview','group-import'].every(id=>document.querySelector('#academicWorkspace #'+id)),
     pwaShortcutsHidden:['pwaDataBackup','pwaExamBackup'].every(id=>!document.getElementById(id)||document.getElementById(id).hidden),
     expectedEngineState:isStandalone?typeof window.html2pdf==='function':typeof window.html2pdf==='undefined',
     unchangedQuestions:!!document.getElementById('examQuestionMenus')
    };
   },filename==='offline.html');
   assert.equal(await page.locator('#exam-ui-shell > #group-drafts #downloadDraft').count(),1);
   assert.equal(await page.locator('#exam-ui-shell > #group-drafts #loadDraft').count(),1);
   assert.equal(await page.locator('#exam-ui-shell > #examinaUnifiedBackup #examinaBackupExport').count(),1);
   assert(Object.values(structure).every(Boolean),filename+': estructura: '+JSON.stringify(structure));
   await page.locator('#saveDraft').click();
   assert.equal(await page.locator('#saveDraft').getAttribute('data-save-state'),'saved',
    filename+': no se guardó el borrador de control');
   await page.evaluate(async()=>{
    withInternalAnswers(()=>{});
    await new Promise(resolve=>queueMicrotask(resolve));
   });
   assert.equal(await page.locator('#saveDraft').getAttribute('data-save-state'),'saved',
    filename+': consultar análisis internos ensució el borrador');
   if(filename==='index.html')assert.equal(await page.locator('script[src*="html2pdf.bundle.min.js"]').count(),0,
    'El motor PDF se descarga al abrir la webapp');
   // La consulta académica no ejecuta generación ni mueve las preguntas.
   const before=await page.locator('#paper').innerHTML();
   await page.locator('#academicNav').click();
   assert(await page.locator('#academicWorkspace').isVisible(),filename+': falta apartado independiente');
   assert(!(await page.locator('#examLayout').isVisible()),filename+': la configuración sigue visible en herramientas académicas');
   await page.locator('#vmShowExam').click();
   assert.equal(await page.locator('#paper').innerHTML(),before,filename+': volver de herramientas cambió el examen');
   assert(await page.locator('#docx').isVisible(),filename+': Word oculto en Configuración de iPad');
   assert(await page.locator('#pdfDownload').isVisible(),filename+': PDF oculto en Configuración de iPad');
   assert.equal(await page.locator('#docx').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(25, 89, 158)');
   assert.equal(await page.locator('#pdfDownload').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(163, 34, 43)');
   const print=page.locator('#print');
   assert(await print.isVisible(),filename+': acceso directo a imprimir oculto');
   assert.equal(await print.evaluate(el=>el.previousElementSibling.id),'pdfDownload');
   assert.equal(await print.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(163, 34, 43)');
   assert(!(await page.locator('#solutions').isVisible()));
   assert(!(await page.locator('#docxAnswers').isVisible()));
   assert(!(await page.locator('#generate').isVisible()));
   const restore=page.locator('#restoreDraft');
   assert(await restore.isVisible());
   assert.equal(await restore.evaluate(el=>el.previousElementSibling.id),'saveDraft');
   const compact=await page.evaluate(()=>{
    const first=['course','model'].map(id=>document.getElementById(id).getBoundingClientRect().top);
    const second=['term','lang','sheetType'].map(id=>document.getElementById(id).getBoundingClientRect().top);
    return [first,second];
   });
   assert(compact.every(row=>Math.max(...row)-Math.min(...row)<2),filename+': configuración con filas desaprovechadas');
   await page.locator('#examPreviewTab').click();
   assert.equal(await page.locator('#exportShortcut,#exportWorkspace,#exam-ui-actions,#exam-ui-advanced,#courseStatus').count(),0);
   const proof=await page.evaluate(()=>{
    const form=document.getElementById('paper');
    const key=window.ExaminaPdfExport.prepareDocument();
    return {
     same:form.outerHTML.includes('exam-sheet'),
     noSolutions:!key.querySelector('#answerkey'),
     noControl:!key.querySelector('.no-print'),
     keyIsolated:!!document.querySelector('#examinaInternalAnswers #answerkey')&&!form.querySelector('#answerkey'),
     status:!!document.getElementById('examinaPdfStatus')
    };
   });
   assert(Object.values(proof).every(Boolean),filename+': PDF expone controles o cambia el original: '+JSON.stringify(proof));
   // Contrato de nombres: selección explícita, sin expandir por "acumulativo".
   const cases=[
    {course:'latin1',type:'exam',lang:'es',units:['UD1'],word:'ex ud1 lat1.docx',pdf:'ex ud1 lat1.pdf'},
    {course:'latin4',type:'review',lang:'va',units:['UD2','UD4'],word:'ficha repaso ud2-ud4 lat4 val.docx',pdf:'ficha repaso ud2-ud4 lat4 val.pdf'},
    {course:'greek1',type:'exam',lang:'va',units:['UD3','UD10'],word:'ex ud3-ud10 gr1 val.docx',pdf:'ex ud3-ud10 gr1 val.pdf'},
    {course:'latin1',type:'review',lang:'es',units:['UD7'],word:'ficha repaso ud7 lat1.docx',pdf:'ficha repaso ud7 lat1.pdf'},
    {course:'latin4',type:'exam',lang:'es',units:[],word:'ex ud-sin-seleccionar lat4.docx',pdf:'ex ud-sin-seleccionar lat4.pdf'}
   ];
   for(const c of cases){
    const found=await page.evaluate(({course,type,lang,units:chosen})=>{
     const courseField=document.getElementById('course');
     courseField.value=course;courseField.dispatchEvent(new Event('change',{bubbles:true}));
     document.getElementById('lang').value=lang;
     document.getElementById('sheetType').value=type;
     document.getElementById('cumulative').checked=true;
     const expected=new Set(chosen),found=[];
     document.querySelectorAll('#unitChoices .unit-choice').forEach(box=>{
      const code=units[Number(box.value)];
      box.checked=expected.has(code);
      if(box.checked)found.push(code);
     });
     return {
      selected:found,word:window.ExaminaExportFilename('docx'),
      pdf:window.ExaminaExportFilename('pdf')
     };
    },c);
    assert.deepEqual(found.selected,c.units,filename+': unidades marcadas '+c.course);
    for(const field of ['word','pdf'])
     assert.equal(found[field],c[field],filename+': nombre '+field+' para '+c.course+' '+c.lang);
   }
   // Verificar que el Word real usa el mismo nombre y distingue soluciones.
   await page.evaluate(()=>{
    const course=document.getElementById('course');
    course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('lang').value='va';
    const type=document.getElementById('sheetType');
    type.value='review';type.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('#unitChoices .unit-choice').forEach(box=>{
     box.checked=units[Number(box.value)]==='UD1';
    });
    generate();
    window.ExaminaScoring?.sync?.();
   });
   const wordFiles=await page.evaluate(()=>{
    const records=[],original=downloadBlob;
    const review=window.ExaminaTeacherReview,oldReview=review?.evidenceMayExport;
    const scoring=window.ExaminaScoring,oldScore=scoring?.canExport;
    try{
     if(review)review.evidenceMayExport=()=>true;
     if(scoring)scoring.canExport=()=>true;
     downloadBlob=(name,blob)=>records.push({name,bytes:blob.size});
     document.getElementById('docx').click();
    }finally{
     downloadBlob=original;
     if(review)review.evidenceMayExport=oldReview;
     if(scoring)scoring.canExport=oldScore;
    }
    return records;
   });
   assert.deepEqual(wordFiles.map(x=>x.name),
    ['ficha repaso ud1 lat1 val.docx'],
    filename+': nombre real de Word del alumnado');
   assert(wordFiles.every(x=>x.bytes>3500),filename+': Word vacío');
   // El motor PDF recibe centímetros convertidos a mm: arriba/derecha/abajo
   // 25 mm, izquierda 30 mm. El contenido A4 se limita a 155 mm de ancho.
   const pdfOptions=await page.evaluate(async()=>{
    const old=window.html2pdf,details={};
    let pageCount=1;
    const pdf={
     getNumberOfPages(){return pageCount},
     addPage(){pageCount++},
     addImage(){},
     save(){}
    };
    window.html2pdf=()=>({
     set(options){details.margin=Array.from(options.margin);details.filename=options.filename;return this},
     from(stage){details.stageWidth=stage.style.width;return this},
     toPdf(){return this},
     toCanvas(){return this},
     get(key){return Promise.resolve(key==='pdf'?pdf:{
      width:100,height:100,toDataURL(){return 'data:image/jpeg;base64,/9j/2Q=='}
     })},
     save(){return Promise.resolve()}
    });
    try{details.success=await window.ExaminaPdfExport.generate()}
    finally{window.html2pdf=old}
    return details;
   });
   assert.equal(pdfOptions.success,true,filename+': fallo al preparar el PDF');
   assert.deepEqual(pdfOptions.margin,[25,25,25,30],filename+': márgenes PDF incorrectos');
   assert.equal(pdfOptions.stageWidth,'155mm',filename+': ancho A4 útil incorrecto');
   assert.equal(pdfOptions.filename,'ficha repaso ud1 lat1 val.pdf',
    filename+': el PDF no comparte el nombre con Word');
   assert.equal(await page.evaluate(()=>window.ExaminaScoring.canExport()),true,filename+': ficha de repaso bloqueada');
   await page.locator('#examPreviewTab').click();
   const actions=await page.locator('#examPreviewActions').boundingBox();
   const preview=await page.locator('#paper').boundingBox();
   assert(actions&&preview&&actions.y+actions.height<=preview.y,filename+': botones debajo de la vista previa');
   await page.evaluate(()=>{window.print=()=>{window.previewPrintInvoked=true}});
   await print.click();
   assert.equal(await page.evaluate(()=>window.previewPrintInvoked),true,
    filename+': el acceso directo no abre la impresión del navegador');
   const downloadWait=page.waitForEvent('download',{timeout:90000});
   await page.locator('#pdfDownload').click();
   const download=await downloadWait;
   assert.equal(await page.evaluate(()=>typeof window.html2pdf),'function',
    filename+': no se cargó el motor PDF al solicitar la exportación');
   assert.equal(download.suggestedFilename(),'ficha repaso ud1 lat1 val.pdf',
    filename+': el PDF descargado ignora el nombre seleccionado');
   const name=await download.path();
   const bytes=fs.readFileSync(name);
   assert.equal(bytes.subarray(0,5).toString('ascii'),'%PDF-',filename+': no es un PDF real');
   assert(bytes.length>10000,filename+': PDF vacío o truncado');
   const text=bytes.toString('latin1');
   const pages=(text.match(/\/Type\s*\/Page\b/g)||[]).length;
   assert(pages>=1,filename+': faltan páginas PDF');
   fs.writeFileSync(path.join(artifacts,engineName+'-'+filename+'-va.pdf'),bytes);

   await page.evaluate(()=>{
    $('lang').value='es';$('lang').dispatchEvent(new Event('change',{bubbles:true}));
   });
   // Regresión: un examen que ocupa varias hojas debe descargarse ENTERO.
   // El fallo histórico pasaba inadvertido porque sólo se comprobaba >=1 pág.
   // Se amplía la hoja únicamente en este navegador de pruebas, sin bancos.
   const fixture=await page.evaluate(()=>{
    const sheet=document.querySelector('#paper .exam-sheet');
    const wrapper=document.createElement('div');
    wrapper.id='pdfPaginationRegression';
    for(let i=0;i<125;i++){
     const paragraph=document.createElement('p');
     paragraph.textContent='Línea de comprobación PDF multipágina '+
      String(i+1).padStart(3,'0')+' — forma, análisis y traducción.';
     paragraph.style.cssText='font:14px/1.65 Georgia,serif;margin:0 0 7px;';
     if(i===35)paragraph.classList.add('exam-page-break');
     wrapper.append(paragraph);
    }
    sheet.append(wrapper);
    return {rows:wrapper.children.length};
   });
   assert.equal(fixture.rows,125);
   await page.locator('#examSettingsTab').click();
   const multiDownload=page.waitForEvent('download',{timeout:120000});
   await page.locator('#pdfDownload').click();
   const multi=await multiDownload;
   const multiBytes=fs.readFileSync(await multi.path());
   const multiText=multiBytes.toString('latin1');
   const multiPages=(multiText.match(/\/Type\s*\/Page\b/g)||[]).length;
   const multiImages=(multiText.match(/\/Subtype\s*\/Image\b/g)||[]).length;
   assert(multiPages>=3,filename+': PDF largo truncado: '+multiPages+' páginas');
   assert(multiImages>=multiPages,
    filename+': faltan imágenes de contenido de páginas posteriores ('+
    multiImages+'/'+multiPages+')');
   assert.equal(multi.suggestedFilename(),'ficha repaso ud1 lat1.pdf');
   fs.writeFileSync(path.join(artifacts,engineName+'-'+filename+'-es-multipagina.pdf'),multiBytes);
   // Un salto antes de la última línea debe mantenerse aunque ya quepa.
   await page.locator('#pdfPaginationRegression p').last().evaluate(el=>el.classList.add('exam-page-break'));
   const explicitDownload=page.waitForEvent('download',{timeout:120000});
   await page.locator('#pdfDownload').click();
   const explicit=await explicitDownload;
   const explicitBytes=fs.readFileSync(await explicit.path());
   const explicitPages=(explicitBytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
   assert.equal(explicitPages,multiPages+1,filename+': se perdió el salto de página final');
   fs.writeFileSync(path.join(artifacts,engineName+'-'+filename+'-es-salto-final.pdf'),explicitBytes);
   const multiStatus=await page.locator('#examinaPdfStatus').textContent();
   assert(!/no se pudo|no s’ha pogut|bloquead/i.test(multiStatus),
    filename+': exportación larga: '+multiStatus);
   await page.evaluate(()=>document.getElementById('pdfPaginationRegression')?.remove());

   const status=await page.locator('#examinaPdfStatus').textContent();
   assert(!/no se pudo|no s’ha pogut|bloquead/i.test(status),filename+': '+status);
   await page.locator('#saveDraft').click();
   await restore.click();
   assert.match(await page.locator('#draftStatus').textContent(),/Borrador recuperado/);
   await page.setViewportSize({width:1440,height:850});
   await page.evaluate(()=>window.scrollTo({top:280,behavior:'instant'}));
   const desktopActions=await page.locator('#examPreviewActions').boundingBox();
   const desktopPreview=await page.locator('#paper').boundingBox();
   assert(desktopActions&&desktopPreview&&desktopActions.y+desktopActions.height<=desktopPreview.y,
    filename+': la barra de escritorio se solapa con el papel al desplazar');
   for(const [course,model,lang,code] of [
    ['latin4','tablas','es','lat4'],
    ['greek1','complete','va','gr1']
   ]){
    const content=await page.evaluate(({course,model,lang})=>{
     for(const [id,value] of [['course',course],['model',model],['lang',lang],['sheetType','exam']]){
      const field=$(id);field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));
     }
     document.querySelectorAll('#unitChoices .unit-choice').forEach(box=>{
      box.checked=units[Number(box.value)]==='UD7';
     });
     if(course==='greek1'){
      $('newSentences').value='ὁ γέρων τὴν ἐπιστολὴν γράφει.';
      $('newSentences').dispatchEvent(new Event('input',{bubbles:true}));
     }
     generate();
     $('examFinalMode').checked=true;
     const copy=ExaminaPdfExport.prepareDocument();
     return {questions:copy.querySelectorAll('.exam-question').length,text:copy.textContent,
      control:!!copy.querySelector('#answerkey,.no-print,[data-exam-subscore]')};
    },{course,model,lang});
    assert(content.questions>0&&!content.control,filename+': contenido evaluable del PDF '+code);
    if(course==='greek1'){
     assert(content.text.includes('ὁ γέρων τὴν ἐπιστολὴν γράφει.'));
     assert(content.text.includes('Nominatiu')&&!content.text.includes('Nominativo'),
      filename+': los casos del PDF de Griego I deben estar en valenciano');
    }
    const pendingDownload=page.waitForEvent('download',{timeout:120000});
    await page.locator('#pdfDownload').click();
    const sample=await pendingDownload;
    assert.equal(sample.suggestedFilename(),'ex ud7 '+code+(lang==='va'?' val':'')+'.pdf');
    const sampleBytes=fs.readFileSync(await sample.path());
    assert.equal(sampleBytes.subarray(0,5).toString('ascii'),'%PDF-');
    assert(sampleBytes.length>10000,filename+': PDF incompleto '+code);
    fs.writeFileSync(path.join(artifacts,engineName+'-'+filename+'-'+code+'-'+lang+'.pdf'),sampleBytes);
   }
   assert.deepEqual(errors,[],filename+': errores JavaScript');
   await page.close();
  }
  console.log('Espacio docente y PDF: DOM único, decisiones intactas, navegación sin regeneración y archivos PDF válidos en web y offline.');
 }finally{
  await browser.close();
  await new Promise(ok=>server.close(ok));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1});
