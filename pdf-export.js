/* Exportación PDF local: documento del alumnado, sin solucionario.
 * HTML2PDF y sus dependencias se incluyen con licencias en vendor/.
 * No transforma el examen ni modifica los campos de preguntas.
 */
(function(root){
 'use strict';
 const byId=id=>root.document.getElementById(id);
 const PAGE_MARGINS_MM=[25,25,25,30]; // top, right, bottom, left
 const CONTENT_WIDTH_MM=210-PAGE_MARGINS_MM[1]-PAGE_MARGINS_MM[3]; // A4
 const status=()=>byId('examinaPdfStatus');
 const lang=()=>byId('lang')?.value==='va';
 let busy=false,engineRequest=null;
 // En la PWA el bundle sigue precacheado, pero no ocupa CPU ni memoria de
 // ejecución hasta pulsar PDF. En offline.html ya está integrado y listo.
 function ensurePdfEngine(){
  if(typeof root.html2pdf==='function')return Promise.resolve();
  if(engineRequest)return engineRequest;
  engineRequest=new Promise((resolve,reject)=>{
   const script=root.document.createElement('script');
   script.src='vendor/html2pdf.bundle.min.js';
   script.async=true;
   script.onload=()=>{
    if(typeof root.html2pdf==='function')resolve();
    else reject(Error('El motor PDF no se inicializó correctamente.'));
   };
   script.onerror=()=>{script.remove();reject(Error('No se pudo cargar el motor PDF local.'));};
   root.document.head.appendChild(script);
  }).catch(error=>{engineRequest=null;throw error});
  return engineRequest;
 }
 function announce(message,isError){
  const element=status();if(element){element.textContent=message;element.dataset.error=isError?'true':'false'}
 }
 function preflight(){
  const paper=byId('paper');
  if(!paper||!paper.querySelector('.exam-sheet')){
   announce(lang()?'Genera primer un examen.':'Genera primero un examen.',true);return false;
  }
  const course=byId('course')?.value;
  if(root.ExaminaTeacherReview?.evidenceMayExport?.(paper,{latin1:'lat1',latin4:'lat4',greek1:'gr1'}[course])===false){
   announce(lang()?'Exportació bloquejada: revisa les autoritzacions de formes indicades.':'Exportación bloqueada: revisa las autorizaciones de formas indicadas.',true);
   return false;
  }
  if(root.ExaminaScoring?.canExport?.()===false){
   announce(lang()?'Exportació bloquejada: revisa la puntuació indicada en la configuració.':'Exportación bloqueada: revisa la puntuación indicada en la configuración.',true);
   return false;
  }
  return true;
 }
 function prepareDocument(){
  const original=byId('paper');
  const paper=original.cloneNode(true);
  paper.removeAttribute('id');
  paper.removeAttribute('contenteditable');
  paper.removeAttribute('spellcheck');
  paper.style.cssText='width:100%;max-width:none;min-height:0;height:auto;overflow:visible;position:static;padding:0;margin:0;background:white;color:#000;border:0;box-shadow:none;';
  paper.querySelectorAll('#answerkey,.no-print,[data-exam-subscore],.exam-subscore-inline,.exam-subpoint-label,.exam-print-controls').forEach(el=>el.remove());
  paper.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
  const stage=root.document.createElement('div');
  stage.className='examina-pdf-stage';
  stage.style.cssText='width:'+CONTENT_WIDTH_MM+'mm;max-width:'+CONTENT_WIDTH_MM+'mm;padding:0;margin:0;background:white;color:#000;';
  stage.append(paper);
  return stage;
 }
 async function makePdf(){
  if(busy)return false;
  if(!preflight())return false;
  busy=true;
  const button=byId('pdfDownload');
  if(button)button.disabled=true;
  announce(lang()?'Generant el PDF sense connexió…':'Generando el PDF sin conexión…',false);
  try{
   await ensurePdfEngine();
   if(root.document.fonts?.ready)await root.document.fonts.ready;
   const stage=prepareDocument();
   const filename=root.ExaminaExportFilename('pdf');
   // html2canvas rasteriza las grafías que muestra el navegador (incluida la
   // politonía griega); jsPDF compone páginas A4 sin abrir window.print().
   await root.html2pdf().set({
    filename,
    margin:PAGE_MARGINS_MM,
    image:{type:'jpeg',quality:0.94},
    html2canvas:{scale:1.7,useCORS:false,allowTaint:false,backgroundColor:'#ffffff',scrollX:0,scrollY:0,logging:false},
    jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},
    pagebreak:{mode:['css','legacy'],before:'.exam-page-break',
     avoid:['.exam-paradigm','.exam-pronouns','.exam-question','.task>li']}
   }).from(stage).save();
   announce(lang()?'PDF preparat. Si iPad l’obri en una vista prèvia, guarda’l des de Compartir.':'PDF preparado. Si iPad lo abre en una vista previa, guárdalo desde Compartir.',false);
   return true;
  }catch(error){
   announce((lang()?'No s’ha pogut generar el PDF: ':'No se pudo generar el PDF: ')+(error?.message||String(error)),true);
   return false;
  }finally{
   busy=false;if(button)button.disabled=false;
  }
 }
 function init(){
  const button=byId('pdfDownload');
  if(!button||button.dataset.pdfBound)return;
  button.dataset.pdfBound='true';
  button.addEventListener('click',makePdf);
 }
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 root.ExaminaPdfExport={generate:makePdf,prepareDocument,preflight,init};
})(window);
