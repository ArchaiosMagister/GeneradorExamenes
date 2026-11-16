'use strict';
// Regresiones del espacio docente: sin despliegue ni mutación del banco.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
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
 const engine=process.env.PDF_TEST_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:820,height:1180},acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
   await page.waitForFunction(()=>!!window.ExaminaPdfExport&&!!document.getElementById('academicNav'));
   const structure=await page.evaluate(isStandalone=>{
    const exam=document.getElementById('exam-ui-actions');
    const editor=document.getElementById('examEditorPanel');
    return {
     one:[...['docx','docxAnswers','print','pdfDownload','saveDraft','downloadDraft','examinaBackupExport']].every(id=>document.querySelectorAll('#'+id).length===1),
     exportPlace:!!exam.querySelector('#exportWorkspace #docx')&&!!exam.querySelector('#exportWorkspace #saveDraft')&&!!exam.querySelector('#exportWorkspace #examinaBackupExport'),
     oldOut:!editor.contains(document.getElementById('group-morph'))&&!editor.contains(document.getElementById('offlineLemmaPanel')),
     academic:['group-morph','offlineLemmaPanel','morphTeacherReview','academicEvidenceReview','greekDiscrepancyReview','group-import'].every(id=>document.querySelector('#academicWorkspace #'+id)),
     pwaShortcutsHidden:['pwaDataBackup','pwaExamBackup'].every(id=>!document.getElementById(id)||document.getElementById(id).hidden),
     expectedEngineState:isStandalone?typeof window.html2pdf==='function':typeof window.html2pdf==='undefined',
     unchangedQuestions:!!document.getElementById('examQuestionMenus')
    };
   },filename==='offline.html');
   assert(Object.values(structure).every(Boolean),filename+': estructura: '+JSON.stringify(structure));
   if(filename==='index.html')assert.equal(await page.locator('script[src*="html2pdf.bundle.min.js"]').count(),0,
    'El motor PDF se descarga al abrir la webapp');
   // La consulta académica no ejecuta generación ni mueve las preguntas.
   const before=await page.locator('#paper').innerHTML();
   await page.locator('#academicNav').click();
   assert(await page.locator('#academicWorkspace').isVisible(),filename+': falta apartado independiente');
   assert(!(await page.locator('#examLayout').isVisible()),filename+': la configuración sigue visible en herramientas académicas');
   await page.locator('#vmShowExam').click();
   assert.equal(await page.locator('#paper').innerHTML(),before,filename+': volver de herramientas cambió el examen');
   await page.locator('#examPreviewTab').click();
   await page.locator('#exportShortcut').click();
   assert(await page.locator('#exportWorkspace').isVisible(),filename+': acceso desde vista previa roto');
   const proof=await page.evaluate(()=>{
    const form=document.getElementById('paper');
    const key=window.ExaminaPdfExport.prepareDocument();
    return {
     same:form.outerHTML.includes('exam-sheet'),
     noSolutions:!key.querySelector('#answerkey'),
     noControl:!key.querySelector('.no-print'),
     originalIntact:!!form.querySelector('#answerkey'),
     status:!!document.getElementById('examinaPdfStatus')
    };
   });
   assert(Object.values(proof).every(Boolean),filename+': PDF expone controles o cambia el original: '+JSON.stringify(proof));
   // Contrato de nombres: selección explícita, sin expandir por "acumulativo".
   const cases=[
    {course:'latin1',type:'exam',lang:'es',units:['UD1'],word:'ex ud1 lat1.docx',pdf:'ex ud1 lat1.pdf',solutions:'ex ud1 lat1 sol.docx'},
    {course:'latin4',type:'review',lang:'va',units:['UD2','UD4'],word:'ficha repaso ud2-ud4 lat4 val.docx',pdf:'ficha repaso ud2-ud4 lat4 val.pdf',solutions:'ficha repaso ud2-ud4 lat4 sol val.docx'},
    {course:'greek1',type:'exam',lang:'va',units:['UD3','UD10'],word:'ex ud3-ud10 gr1 val.docx',pdf:'ex ud3-ud10 gr1 val.pdf',solutions:'ex ud3-ud10 gr1 sol val.docx'},
    {course:'latin1',type:'review',lang:'es',units:['UD7'],word:'ficha repaso ud7 lat1.docx',pdf:'ficha repaso ud7 lat1.pdf',solutions:'ficha repaso ud7 lat1 sol.docx'},
    {course:'latin4',type:'exam',lang:'es',units:[],word:'ex ud-sin-seleccionar lat4.docx',pdf:'ex ud-sin-seleccionar lat4.pdf',solutions:'ex ud-sin-seleccionar lat4 sol.docx'}
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
      pdf:window.ExaminaExportFilename('pdf'),
      solutions:window.ExaminaExportFilename('docx',true)
     };
    },c);
    assert.deepEqual(found.selected,c.units,filename+': unidades marcadas '+c.course);
    for(const field of ['word','pdf','solutions'])
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
     exportWord(false);exportWord(true);
    }finally{
     downloadBlob=original;
     if(review)review.evidenceMayExport=oldReview;
     if(scoring)scoring.canExport=oldScore;
    }
    return records;
   });
   assert.deepEqual(wordFiles.map(x=>x.name),
    ['ficha repaso ud1 lat1 val.docx','ficha repaso ud1 lat1 sol val.docx'],
    filename+': nombres reales de Word y solucionario');
   assert(wordFiles.every(x=>x.bytes>3500),filename+': Word vacío');
   // El motor PDF recibe centímetros convertidos a mm: arriba/derecha/abajo
   // 25 mm, izquierda 30 mm. El contenido A4 se limita a 155 mm de ancho.
   const pdfOptions=await page.evaluate(async()=>{
    const old=window.html2pdf,details={};
    window.html2pdf=()=>({
     set(options){details.margin=Array.from(options.margin);details.filename=options.filename;return this},
     from(stage){details.stageWidth=stage.style.width;return this},
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
   const multiDownload=page.waitForEvent('download',{timeout:120000});
   await page.locator('#pdfDownload').click();
   const multi=await multiDownload;
   const multiBytes=fs.readFileSync(await multi.path());
   const multiText=multiBytes.toString('latin1');
   const multiPages=(multiText.match(/\\/Type\\s*\\/Page\\b/g)||[]).length;
   const multiImages=(multiText.match(/\\/Subtype\\s*\\/Image\\b/g)||[]).length;
   assert(multiPages>=3,filename+': PDF largo truncado: '+multiPages+' páginas');
   assert(multiImages>=multiPages,
    filename+': faltan imágenes de contenido de páginas posteriores ('+
    multiImages+'/'+multiPages+')');
   assert.equal(multi.suggestedFilename(),'ficha repaso ud1 lat1 val.pdf');
   const multiStatus=await page.locator('#examinaPdfStatus').textContent();
   assert(!/no se pudo|no s’ha pogut|bloquead/i.test(multiStatus),
    filename+': exportación larga: '+multiStatus);
   await page.evaluate(()=>document.getElementById('pdfPaginationRegression')?.remove());

   const status=await page.locator('#examinaPdfStatus').textContent();
   assert(!/no se pudo|no s’ha pogut|bloquead/i.test(status),filename+': '+status);
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
