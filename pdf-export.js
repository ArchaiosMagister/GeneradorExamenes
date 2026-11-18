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
  // Los ajustes de sangría y separación viven en propiedades del papel.
  // No eliminarlos al convertir el clon en página de exportación PDF.
  const formatVars=['--exam-question-before','--exam-culture-gap',
   '--exam-indent-shift','--exam-sentence-gap']
   .map(name=>[name,original.style.getPropertyValue(name).trim()])
   .filter(([,value])=>value);
  paper.style.cssText='width:100%;max-width:none;min-height:0;height:auto;overflow:visible;position:static;padding:0;margin:0;background:white;color:#000;border:0;box-shadow:none;';
  for(const [name,value] of formatVars)paper.style.setProperty(name,value);
  paper.querySelectorAll('#answerkey,.no-print,[data-exam-subscore],.exam-subscore-inline,.exam-subpoint-label,.exam-print-controls').forEach(el=>el.remove());
  paper.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
  const stage=root.document.createElement('div');
  stage.className='examina-pdf-stage';
  stage.style.cssText='width:'+CONTENT_WIDTH_MM+'mm;max-width:'+CONTENT_WIDTH_MM+'mm;padding:0;margin:0;background:white;color:#000;';
  stage.append(paper);
  return stage;
 }

 // html2pdf.js crea por defecto UN lienzo de la altura total del examen.
 // Safari/iPad limita la superficie disponible y puede guardar solo el comienzo.
 // Medimos el documento sin tocar la vista editable y rasterizamos cada página
 // de forma independiente; así ningún lienzo supera una página A4.
 const PAGE_HEIGHT_MM=297-PAGE_MARGINS_MM[0]-PAGE_MARGINS_MM[2];
 const SLICE_HEIGHT_MM=PAGE_HEIGHT_MM-1; // Evitar páginas vacías por redondeo.
 function paginateDocument(stage){
  const doc=root.document;
  const host=doc.createElement('div');
  host.style.cssText='position:fixed;left:-100000px;top:0;width:'+CONTENT_WIDTH_MM+
   'mm;visibility:hidden;pointer-events:none;z-index:-1;';
  host.append(stage);
  doc.body.append(host);
  try{
   const mm=doc.createElement('div');
   mm.style.cssText='height:100mm;position:absolute;visibility:hidden;';
   host.append(mm);
   const pxPerMm=mm.getBoundingClientRect().height/100;
   mm.remove();
   const maxHeight=SLICE_HEIGHT_MM*pxPerMm;
   const top=stage.getBoundingClientRect().top;
   const total=Math.ceil(Math.max(stage.scrollHeight,stage.getBoundingClientRect().height));
   const blocks=[...stage.querySelectorAll(
    '.exam-header,.exam-question,.exam-paradigm,.exam-pronouns,.exam-gloss-title,'+
    '.gloss-item,.task>li,.exam-item,table tr'
   )].map(el=>{
    const rect=el.getBoundingClientRect();
    return {start:rect.top-top,end:rect.bottom-top,height:rect.height};
   }).filter(b=>b.height>0&&b.start>=0).sort((a,b)=>a.start-b.start);
   const forced=[...stage.querySelectorAll('.exam-page-break')]
    .map(el=>el.getBoundingClientRect().top-top)
    .filter(y=>y>0).sort((a,b)=>a-b);
   const cuts=[0];
   let start=0;
   while(total-start>maxHeight+1){
    let end=start+maxHeight;
    const nextForced=forced.find(y=>y>start+24&&y<end);
    if(nextForced!==undefined)end=nextForced;
    else{
     // No cortar una tabla, un enunciado o una línea cuando caben
     // íntegramente en la siguiente página.
     const crossing=blocks.filter(b=>b.start<end&&b.end>end&&
      b.start>start+maxHeight*0.38&&b.height<maxHeight*0.95);
     if(crossing.length)end=Math.min(...crossing.map(b=>b.start));
    }
    if(end<=start+24)end=start+maxHeight;
    cuts.push(end);
    start=end;
    if(cuts.length>200)throw Error('El documento excede el límite de páginas PDF.');
   }
   cuts.push(total);
   const pages=[];
   for(let i=0;i<cuts.length-1;i++){
    const start=cuts[i],height=cuts[i+1]-start;
    const viewport=doc.createElement('div');
    viewport.style.cssText='position:relative;overflow:hidden;box-sizing:border-box;'+
     'width:'+CONTENT_WIDTH_MM+'mm;height:'+height+'px;margin:0;padding:0;'+
     'background:#fff;color:#000;';
    const offset=stage.cloneNode(true);
    offset.style.cssText+='position:absolute;left:0;top:-'+start+'px;';
    viewport.append(offset);
    pages.push(viewport);
   }
   return pages;
  }finally{host.remove()}
 }
 async function saveMultiPagePdf(pages,filename,options){
  // El primer lienzo crea el objeto jsPDF del mismo motor que ya distribuimos
  // offline. Las páginas posteriores se añaden secuencialmente y se liberan
  // sus canvases, sin depender de librerías remotas ni cargar todo en memoria.
  const tileOptions={...options,pagebreak:{mode:[]}};
  const first=root.html2pdf().set(tileOptions).from(pages[0]).toPdf();
  const pdf=await first.get('pdf');
  if(pdf.getNumberOfPages()!==1)
   throw Error('La primera página PDF no tiene las dimensiones esperadas.');
  const firstCanvas=await first.get('canvas');
  if(firstCanvas){firstCanvas.width=0;firstCanvas.height=0}
  for(let i=1;i<pages.length;i++){
   const worker=root.html2pdf().set(tileOptions).from(pages[i]).toCanvas();
   const canvas=await worker.get('canvas');
   try{
    if(!canvas||!canvas.width||!canvas.height)
     throw Error('No se pudo representar la página '+(i+1)+'.');
    const image=canvas.toDataURL('image/jpeg',options.image.quality);
    const imageHeight=CONTENT_WIDTH_MM*canvas.height/canvas.width;
    if(imageHeight>PAGE_HEIGHT_MM+0.25)
     throw Error('La página '+(i+1)+' excede el área imprimible.');
    pdf.addPage('a4','portrait');
    pdf.addImage(image,'JPEG',PAGE_MARGINS_MM[3],PAGE_MARGINS_MM[0],
     CONTENT_WIDTH_MM,imageHeight);
   }finally{if(canvas){canvas.width=0;canvas.height=0}}
  }
  if(pdf.getNumberOfPages()!==pages.length)
   throw Error('Faltan páginas en el PDF generado.');
  pdf.save(filename);
 }

 async function makePdf(){
  if(busy)return false;
  // Una edición larga puede seguir pendiente de refresco del glosario:
  // imprimir siempre la última versión, también en Safari sin conexión.
  root.ExaminaFlushSentenceGlossary?.();
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
   const options={
    filename,
    margin:PAGE_MARGINS_MM,
    image:{type:'jpeg',quality:0.94},
    html2canvas:{scale:1.7,useCORS:false,allowTaint:false,backgroundColor:'#ffffff',scrollX:0,scrollY:0,logging:false},
    jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true},
    pagebreak:{mode:['css','legacy'],before:'.exam-page-break',
     avoid:['.exam-paradigm','.exam-pronouns','.exam-question','.task>li']}
   };
   const pages=paginateDocument(stage);
   if(pages.length===1)await root.html2pdf().set(options).from(stage).save();
   else await saveMultiPagePdf(pages,filename,options);
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
