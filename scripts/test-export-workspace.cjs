'use strict';
// Regresiones del espacio docente: sin despliegue ni mutación del banco.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
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
 const browser=await chromium.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:820,height:1180},acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
   await page.waitForFunction(()=>!!window.ExaminaPdfExport&&!!document.getElementById('academicNav'));
   const structure=await page.evaluate(()=>{
    const exam=document.getElementById('exam-ui-actions');
    const editor=document.getElementById('examEditorPanel');
    return {
     one:[...['docx','docxAnswers','print','pdfDownload','saveDraft','downloadDraft','examinaBackupExport']].every(id=>document.querySelectorAll('#'+id).length===1),
     exportPlace:!!exam.querySelector('#exportWorkspace #docx')&&!!exam.querySelector('#exportWorkspace #saveDraft')&&!!exam.querySelector('#exportWorkspace #examinaBackupExport'),
     oldOut:!editor.contains(document.getElementById('group-morph'))&&!editor.contains(document.getElementById('offlineLemmaPanel')),
     academic:['group-morph','offlineLemmaPanel','morphTeacherReview','academicEvidenceReview','greekDiscrepancyReview','group-import'].every(id=>document.querySelector('#academicWorkspace #'+id)),
     pwaShortcutsHidden:['pwaDataBackup','pwaExamBackup'].every(id=>!document.getElementById(id)||document.getElementById(id).hidden),
     localEngine:typeof window.html2pdf==='function',
     unchangedQuestions:!!document.getElementById('examQuestionMenus')
    };
   });
   assert(Object.values(structure).every(Boolean),filename+': estructura: '+JSON.stringify(structure));
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
   await page.evaluate(()=>{
    const control=document.getElementById('sheetType');
    control.value='review';control.dispatchEvent(new Event('change',{bubbles:true}));
   });
   assert.equal(await page.evaluate(()=>window.ExaminaScoring.canExport()),true,filename+': ficha de repaso bloqueada');
   const downloadWait=page.waitForEvent('download',{timeout:90000});
   await page.locator('#pdfDownload').click();
   const download=await downloadWait;
   assert(/\.pdf$/i.test(download.suggestedFilename()),filename+': tipo de archivo incorrecto');
   const name=await download.path();
   const bytes=fs.readFileSync(name);
   assert.equal(bytes.subarray(0,5).toString('ascii'),'%PDF-',filename+': no es un PDF real');
   assert(bytes.length>10000,filename+': PDF vacío o truncado');
   const text=bytes.toString('latin1');
   const pages=(text.match(/\/Type\s*\/Page\b/g)||[]).length;
   assert(pages>=1,filename+': faltan páginas PDF');
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
