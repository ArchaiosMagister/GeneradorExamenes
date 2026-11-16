/* Una sola zona de entrega/respaldo y un área académica independiente.
 * Reubica los controles originales (con sus handlers y estados): no duplica
 * copias, exportadores, decisiones docentes ni bancos.
 */
(function(root){
 'use strict';
 const doc=root.document;
 const el=id=>doc.getElementById(id);
 const va=()=>el('lang')?.value==='va';
 const tr=(es,val)=>va()?val:es;
 const text=(node,value)=>{if(node)node.textContent=value};
 let installed=false;
 function style(){
  if(el('examinaWorkspaceStyles'))return;
  const css=doc.createElement('style');css.id='examinaWorkspaceStyles';
  css.textContent=[
   '#examPreviewActions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-width:0}',
   '#examPreviewActions button{min-height:44px;margin:0;padding:6px 10px}',
   '#paper #answerkey{display:none!important}',
   '#examLayout #docx{background:#19599e;color:#fff}',
   '#examLayout :is(#pdfDownload,#print){background:#a3222b;color:#fff}',
   '#examPreviewActions [role="status"]{width:100%;margin:0}',
   '#examPreviewActions [role="status"]:empty{position:absolute}',
   '#examinaPdfStatus[data-error="true"]{font-weight:650;color:var(--error-text,#ad342a)}',
   '@media screen and (min-width:901px){body.exam-redesign #examLayout{grid-template-rows:max-content minmax(0,1fr);row-gap:9px}body.exam-redesign #examLayout.layout>#examEditorPanel{grid-row:1 / span 2}body.exam-redesign #examLayout.layout>#paper{grid-row:2}#examPreviewActions{grid-column:2;grid-row:1}}',
   '@media screen and (min-width:1000px){#examPreviewActions{position:sticky;top:18px;z-index:2;background:var(--canvas)}body.exam-redesign #examLayout.layout>#paper{top:calc(27px + var(--preview-actions-height,44px));max-height:calc(100vh - 45px - var(--preview-actions-height,44px))}}',
   '@media screen and (max-width:900px), screen and (max-width:950px) and (max-height:500px) and (pointer:coarse){#examPreviewActions{order:0;width:100%;gap:6px}#examPreviewActions button{flex:1 1 auto}}',
   '@media print{#examPreviewActions{display:none!important}}',
   '#academicWorkspace{max-width:1080px;margin:18px auto;padding:20px;border:1px solid var(--line,#d4e0ed);border-radius:13px;background:var(--surface,#fff);color:var(--ink,#1c293a);min-height:260px}',
   '#academicWorkspace[hidden]{display:none!important}',
   '#academicWorkspace h2{margin:0 0 8px;font-size:20px}',
   '#academicWorkspace p{line-height:1.55}',
   '#academicWorkspace .academic-intro{font-size:14px;color:var(--secondary-ink,#40556c);margin:0 0 18px}',
   '#academicWorkspace>section,#academicWorkspace>.settings-group,#academicWorkspace>details{margin:13px 0;padding:12px;border:1px solid var(--line,#d4e0ed);border-radius:9px;background:var(--surface,#fff);max-width:100%;overflow-wrap:anywhere}',
   '#academicWorkspace :is(input,select,textarea){max-width:100%;min-height:40px}',
   '#academicWorkspace .field{margin:12px 0}',
   '#academicWorkspace #morphTeacherReview>details>summary{background:var(--soft,#eef3f8)!important;color:var(--soft-ink,#233e5e)!important;border-color:var(--line,#d6e0ea)!important}',
   '#academicWorkspace #morphTeacherReview .review-item{background:var(--surface,#fff)!important;color:var(--ink,#1c293a)!important;border-color:var(--line,#dce4ee)!important}',
   'body.academic-view #examLayout,body.academic-view .exam-coursebar,body.academic-view #vocabularyGenerator,body.academic-view #vocabManager{display:none!important}',
   'body.academic-view #academicWorkspace{display:block!important}',
   'body.academic-view #academicNav{background:var(--accent,#315889)!important;color:white!important;border-color:var(--accent,#315889)!important}',
   '#academicNav{min-height:43px}',
   '#examinaUnifiedBackup .buttons button{white-space:normal;min-height:42px}',
   '#academicWorkspace #group-import>summary{font-weight:700}',
   '@media(max-width:500px){#academicWorkspace{padding:13px;margin:10px}}',
  ].join('\n');
  doc.head.append(css);
 }
 function labelize(){
  el('examPreviewActions')?.setAttribute('aria-label',tr('Acciones de la vista previa','Accions de la vista prèvia'));
  text(el('academicNav'),tr('Herramientas académicas','Eines acadèmiques'));
  text(el('academicWorkspaceTitle'),tr('Herramientas académicas','Eines acadèmiques'));
  text(el('academicWorkspaceIntro'),tr('Consulta formas y paradigmas, revisa incidencias y gestiona autorizaciones docentes. No son pasos necesarios para crear un examen habitual.','Consulta formes i paradigmes, revisa incidències i gestiona autoritzacions docents. No són passos necessaris per a crear un examen habitual.'));
  text(el('docx'),'Exportar Word');
  text(el('pdfDownload'),'Exportar PDF');
  text(el('print'),'Imprimir');
  text(el('group-drafts')?.querySelector('summary'),tr('Intercambiar borradores (.json)','Intercanviar esborranys (.json)'));
  text(el('saveDraft'),tr('Guardar borrador','Guardar esborrany'));
  text(el('restoreDraft'),tr('Recuperar borrador','Recuperar esborrany'));
  text(el('downloadDraft'),tr('Descargar borrador editable (.json)','Descarregar esborrany editable (.json)'));
  text(el('loadDraft'),tr('Importar borrador (.json)','Importar esborrany (.json)'));
  text(el('examinaUnifiedBackup')?.querySelector('summary'),tr('Copia completa','Còpia completa'));
  text(el('examinaBackupExport'),tr('Descargar copia completa (.json)','Descarregar còpia completa (.json)'));
  text(el('examinaBackupChoose'),tr('Importar copia completa (.json)','Importar còpia completa (.json)'));
  text(el('academicCompatibilitySummary'),tr('Compatibilidad: importaciones y copias antiguas','Compatibilitat: importacions i còpies antigues'));
  text(el('academicCompatibilityHint'),tr('Estas herramientas se conservan para archivos anteriores y gestión avanzada de bancos. La copia completa habitual está en «Copia completa».','Estes eines es conserven per a arxius anteriors i gestió avançada dels bancs. La còpia completa habitual és a «Còpia completa».'));
 }
 function configureExport(){
  const exportGroup=el('group-export'),drafts=el('group-drafts');
  if(!exportGroup||!drafts)return;
  const toolbar=doc.createElement('div');toolbar.id='examPreviewActions';
  toolbar.className='no-print';toolbar.setAttribute('role','group');
  const pdf=doc.createElement('button');pdf.id='pdfDownload';pdf.type='button';pdf.className='secondary';
  const status=doc.createElement('p');status.id='examinaPdfStatus';status.setAttribute('role','status');
  const validation=doc.createElement('p');validation.id='exportValidationStatus';validation.setAttribute('role','status');
  const draftStatus=el('draftStatus');draftStatus.textContent='';
  toolbar.append(el('saveDraft'),el('restoreDraft'),el('docx'),pdf,el('print'),draftStatus,status,validation);
  el('paper').before(toolbar);
  new ResizeObserver(()=>{
   if(toolbar.offsetHeight>0)el('examLayout').style.setProperty('--preview-actions-height',toolbar.offsetHeight+'px');
  }).observe(toolbar);

  // Conservar las referencias internas usadas al regenerar y restaurar borradores.
  exportGroup.hidden=true;
  // El panel académico no está siempre visible: mostrar el motivo del bloqueo
  // junto a la acción solicitada, sin modificar la evidencia ni la puntuación.
  for(const id of ['docx','docxAnswers','print','pdfDownload']){
   el(id)?.addEventListener('click',event=>{
    const paper=el('paper'),course=el('course')?.value;
    let message='';
    if(!paper?.querySelector('.exam-sheet')){
     message=tr('Genera primero un examen.','Genera primer un examen.');
    }else if(root.ExaminaTeacherReview?.evidenceMayExport?.(paper,
     {latin1:'lat1',latin4:'lat4',greek1:'gr1'}[course])===false){
     message=tr('Exportación bloqueada por una forma pendiente. Revisa Herramientas académicas → Evidencia académica por forma.','Exportació bloquejada per una forma pendent. Revisa Eines acadèmiques → Evidència acadèmica per forma.');
    }else if(root.ExaminaScoring?.canExport?.()===false){
     message=tr('Exportación bloqueada por la puntuación. Revisa la distribución de puntos del examen.','Exportació bloquejada per la puntuació. Revisa la distribució de punts de l’examen.');
    }
    validation.textContent=message;
    if(message){event.preventDefault();event.stopImmediatePropagation()}
   },true);
  }
  const backup=el('examinaUnifiedBackup');
  if(backup){
   drafts.after(backup);
   const details=backup.querySelector('details');if(details)details.open=false;
  }
  root.ExaminaPdfExport?.init?.();
 }
 function configureAcademic(){
  const nav=doc.querySelector('.vocab-tabbar');
  if(!nav)return;
  const button=doc.createElement('button');button.type='button';button.id='academicNav';
  const appearance=nav.querySelector('.appearance-picker');
  nav.insertBefore(button,appearance);
  const section=doc.createElement('section');
  section.id='academicWorkspace';section.className='academic-workspace no-print';section.hidden=true;
  const h=doc.createElement('h2');h.id='academicWorkspaceTitle';section.append(h);
  const note=doc.createElement('p');note.id='academicWorkspaceIntro';note.className='academic-intro';section.append(note);
  const compatibility=doc.createElement('details');compatibility.id='academicCompatibility';
  const summary=doc.createElement('summary');summary.id='academicCompatibilitySummary';compatibility.append(summary);
  const help=doc.createElement('p');help.id='academicCompatibilityHint';help.className='hint';compatibility.append(help);
  const academicIds=['group-morph','unimorphPanel','offlineLemmaPanel','morphTeacherReview','academicEvidenceReview','greekDiscrepancyReview'];
  const legacy=el('group-import');if(legacy)compatibility.append(legacy);
  section.append(compatibility);
  function relocateAcademic(){
   // Los paneles de evidencias pueden inicializarse asíncronamente; al entrar
   // garantiza un único nodo real, fuera de desplegables ocultos del examen.
   for(const id of academicIds){
    const node=el(id);
    if(node&&node.parentElement!==section)section.insertBefore(node,compatibility);
   }
  }
  relocateAcademic();
  const footer=doc.querySelector('footer.footer');
  if(footer)footer.before(section);else doc.body.append(section);
  function enter(){
   relocateAcademic();
   doc.body.classList.add('academic-view');
   el('examLayout').hidden=true;
   el('examLayout').style.display='none';
   el('vocabManager')?.classList.remove('active');
   el('vocabularyGenerator')?.classList.remove('active');
   section.hidden=false;
   nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));
  }
  function leave(){
   doc.body.classList.remove('academic-view');
   section.hidden=true;button.classList.remove('active');
  }
  button.addEventListener('click',enter);
  nav.addEventListener('click',event=>{
   const target=event.target.closest('button');
   if(target?.id==='vmShowExam'&&doc.body.classList.contains('academic-view')){
    // El manejador histórico de esta pestaña fuerza course.change y sortea
    // un examen al volver. Navegar desde herramientas no debe regenerarlo.
    event.preventDefault();event.stopImmediatePropagation();
    leave();
    const layout=el('examLayout');layout.hidden=false;layout.style.display='';
    el('vocabManager')?.classList.remove('active');
    el('vocabularyGenerator')?.classList.remove('active');
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===target));
    return;
   }
   if(target&&target!==button)leave();
  },true);
 }
 function init(){
  if(installed||!el('exam-ui-shell')||!el('examinaUnifiedBackup'))return;
  installed=true;style();configureExport();configureAcademic();labelize();
  const pwa1=el('pwaDataBackup'),pwa2=el('pwaExamBackup');
  if(pwa1)pwa1.hidden=true;
  if(pwa2)pwa2.hidden=true;
  el('lang')?.addEventListener('change',()=>root.requestAnimationFrame(labelize));
 }
 function ready(){
  // El rediseño principal monta #exam-ui-shell al finalizar DOMContentLoaded.
  // Esperamos un frame para respetar el orden de las inicializaciones online/offline.
  root.requestAnimationFrame(init);
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
})(window);
