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
   '#exportWorkspace{margin-top:16px;display:grid;gap:12px}',
   '#exportWorkspace h3{margin:0 0 4px;font-size:17px}',
   '#exportWorkspace .export-intro{margin:0;font-size:13px;color:var(--secondary-ink,var(--ink,#324962));line-height:1.5}',
   '#exportWorkspace .settings-group{margin:0!important}',
   '#exportWorkspace .export-main-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:8px 0 10px}',
   '#exportWorkspace .export-main-buttons button{width:100%;min-height:48px;white-space:normal;margin:0}',
   '#exportWorkspace .export-utilities{display:flex;gap:9px;align-items:center;flex-wrap:wrap}',
   '#exportWorkspace .export-utilities>button{min-height:42px}',
   '#exportWorkspace .export-teacher{margin-top:12px;border-top:1px solid var(--line,#d8e0eb);padding-top:10px}',
   '#exportWorkspace .export-teacher>summary{font-weight:650;cursor:pointer;line-height:1.7}',
   '#exportWorkspace .export-teacher .buttons{margin-top:10px}',
   '#exportWorkspace #examinaUnifiedBackup{margin:0!important}',
   '#exportWorkspace #examinaUnifiedBackup>details>summary{font-size:14px;font-weight:750}',
   '#exportWorkspace #examinaPdfStatus{font-size:13px;line-height:1.5;min-height:1.4em}',
   '#exportWorkspace #examinaPdfStatus[data-error="true"]{font-weight:650;color:var(--error-text,#ad342a)}',
   '#exportWorkspace .export-hint{margin:5px 0 10px;font-size:12px;line-height:1.5;color:var(--secondary-ink,var(--ink,#324962))}',
   '#exportWorkspace #group-drafts .settings-group-body .buttons{display:flex;flex-wrap:wrap;gap:7px}',
   '#exportWorkspace #group-drafts button{white-space:normal;min-height:42px}',
   '#exportShortcut{margin:10px max(14px,calc((100vw - 1150px)/2)) 0 auto;display:block;min-height:43px;background:var(--secondary-bg,#edf3fb);color:var(--secondary-ink,#21476e);border:1px solid var(--secondary-border,#a8bacd);border-radius:9px;padding:8px 14px;font-weight:750;cursor:pointer}',
   'body:has(.vocab-manager.active) #exportShortcut,body.academic-view #exportShortcut{display:none!important}',
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
   '@media(max-width:500px){#exportWorkspace .export-main-buttons{grid-template-columns:1fr}#academicWorkspace{padding:13px;margin:10px}#exportShortcut{margin:9px 14px 0 auto}}'
  ].join('\n');
  doc.head.append(css);
 }
 function labelize(){
  text(el('exportWorkspaceTitle'),tr('Guardar y exportar','Guardar i exportar'));
  text(el('exportWorkspaceIntro'),tr('Elige un documento final, continúa un borrador o protege los datos de este dispositivo.','Tria un document final, continua un esborrany o protegeix les dades d’aquest dispositiu.'));
  text(el('exportShortcut'),tr('Guardar y exportar','Guardar i exportar'));
  text(el('academicNav'),tr('Herramientas académicas','Eines acadèmiques'));
  text(el('academicWorkspaceTitle'),tr('Herramientas académicas','Eines acadèmiques'));
  text(el('academicWorkspaceIntro'),tr('Consulta formas y paradigmas, revisa incidencias y gestiona autorizaciones docentes. No son pasos necesarios para crear un examen habitual.','Consulta formes i paradigmes, revisa incidències i gestiona autoritzacions docents. No són passos necessaris per a crear un examen habitual.'));
  text(el('group-export')?.querySelector('summary'),tr('Documento terminado','Document acabat'));
  text(el('examinaExportHint'),tr('Word es editable. El PDF se genera en este dispositivo para entregar al alumnado y no incluye soluciones.','Word és editable. El PDF es genera en aquest dispositiu per a l’alumnat i no inclou solucions.'));
  text(el('docx'),tr('Descargar Word (.docx)','Descarregar Word (.docx)'));
  text(el('pdfDownload'),tr('Descargar PDF (.pdf)','Descarregar PDF (.pdf)'));
  text(el('print'),tr('Imprimir (navegador)','Imprimir (navegador)'));
  text(el('printHint'),tr('En una PWA de iPad, si no se abre la impresión, descarga el PDF y utiliza Compartir → Imprimir.','En una PWA d’iPad, si no s’obri la impressió, descarrega el PDF i utilitza Compartir → Imprimir.'));
  text(el('teacherSolutionsSummary'),tr('Opciones del profesor: soluciones','Opcions del professor: solucions'));
  text(el('docxAnswers'),tr('Word con soluciones','Word amb solucions'));
  text(el('solutions'),tr('Mostrar soluciones','Mostrar solucions'));
  text(el('group-drafts')?.querySelector('summary'),tr('Continuar trabajando · Borradores','Continuar treballant · Esborranys'));
  text(el('draftHubHint'),tr('Guardar aquí conserva las ediciones en este dispositivo; descargar JSON permite trasladar el borrador a otro. Ninguna opción crea un documento para el alumnado.','Guardar ací conserva les edicions en aquest dispositiu; descarregar JSON permet traslladar l’esborrany a un altre. Cap opció crea un document per a l’alumnat.'));
  text(el('saveDraft'),tr('Guardar borrador en este dispositivo','Guardar esborrany en aquest dispositiu'));
  text(el('restoreDraft'),tr('Recuperar borrador guardado','Recuperar esborrany guardat'));
  text(el('downloadDraft'),tr('Descargar borrador editable (.json)','Descarregar esborrany editable (.json)'));
  text(el('loadDraft'),tr('Importar borrador (.json)','Importar esborrany (.json)'));
  text(el('examinaUnifiedBackup')?.querySelector('summary'),tr('Proteger mis datos · Copia completa','Protegir les meues dades · Còpia completa'));
  text(el('examinaBackupExport'),tr('Descargar copia completa (.json)','Descarregar còpia completa (.json)'));
  text(el('examinaBackupChoose'),tr('Importar copia completa (.json)','Importar còpia completa (.json)'));
  text(el('academicCompatibilitySummary'),tr('Compatibilidad: importaciones y copias antiguas','Compatibilitat: importacions i còpies antigues'));
  text(el('academicCompatibilityHint'),tr('Estas herramientas se conservan para archivos anteriores y gestión avanzada de bancos. La copia completa habitual está en «Guardar y exportar».','Estes eines es conserven per a arxius anteriors i gestió avançada dels bancs. La còpia completa habitual és a «Guardar i exportar».'));
 }
 function configureExport(){
  const actions=el('exam-ui-actions'),exportGroup=el('group-export'),drafts=el('group-drafts');
  if(!actions||!exportGroup||!drafts)return;
  text(actions.querySelector('h3'),tr('Regenerar preguntas','Regenerar preguntes'));
  const section=doc.createElement('section');section.id='exportWorkspace';
  const title=doc.createElement('h3');title.id='exportWorkspaceTitle';section.append(title);
  const intro=doc.createElement('p');intro.id='exportWorkspaceIntro';intro.className='export-intro';section.append(intro);
  actions.append(section);
  const body=exportGroup.querySelector('.settings-group-body');
  const primary=doc.createElement('div');primary.className='export-main-buttons';
  const pdf=doc.createElement('button');pdf.id='pdfDownload';pdf.type='button';
  pdf.className='secondary';pdf.textContent='Descargar PDF (.pdf)';
  primary.append(el('docx'),pdf);body.prepend(primary);
  const hint=doc.createElement('p');hint.id='examinaExportHint';hint.className='export-hint';primary.after(hint);
  const utilities=doc.createElement('div');utilities.className='export-utilities';
  utilities.append(el('print'));hint.after(utilities);
  const printHint=doc.createElement('p');printHint.id='printHint';printHint.className='export-hint';utilities.after(printHint);
  const teacher=doc.createElement('details');teacher.className='export-teacher';
  const teacherTitle=doc.createElement('summary');teacherTitle.id='teacherSolutionsSummary';teacher.append(teacherTitle);
  const buttons=doc.createElement('div');buttons.className='buttons';
  buttons.append(el('docxAnswers'),el('solutions'));teacher.append(buttons);
  printHint.after(teacher);
  const status=doc.createElement('p');status.id='examinaPdfStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');teacher.after(status);
  section.append(exportGroup);
  exportGroup.open=true;
  const draftHint=doc.createElement('p');draftHint.id='draftHubHint';draftHint.className='export-hint';
  drafts.querySelector('.settings-group-body')?.prepend(draftHint);
  section.append(drafts);drafts.open=false;
  const backup=el('examinaUnifiedBackup');
  if(backup){
   section.append(backup);
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
  for(const id of ['group-morph','unimorphPanel','offlineLemmaPanel','morphTeacherReview','academicEvidenceReview','greekDiscrepancyReview']){
   const node=el(id);if(node)section.append(node);
  }
  const legacy=el('group-import');if(legacy)compatibility.append(legacy);
  section.append(compatibility);
  const footer=doc.querySelector('footer.footer');
  if(footer)footer.before(section);else doc.body.append(section);
  function enter(){
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
 function shortcut(){
  const coursebar=doc.querySelector('.exam-coursebar');if(!coursebar)return;
  const button=doc.createElement('button');
  button.type='button';button.id='exportShortcut';button.className='secondary';
  coursebar.append(button);
  button.addEventListener('click',()=>{
   if(doc.body.classList.contains('academic-view'))el('vmShowExam')?.click();
   el('examSettingsTab')?.click();
   const group=el('group-export');if(group)group.open=true;
   root.requestAnimationFrame(()=>el('exportWorkspace')?.scrollIntoView({block:'start',behavior:'smooth'}));
  });
 }
 function init(){
  if(installed||!el('exam-ui-actions')||!el('examinaUnifiedBackup'))return;
  installed=true;style();configureExport();configureAcademic();shortcut();labelize();
  const pwa1=el('pwaDataBackup'),pwa2=el('pwaExamBackup');
  if(pwa1)pwa1.hidden=true;
  if(pwa2)pwa2.hidden=true;
  el('lang')?.addEventListener('change',()=>root.requestAnimationFrame(labelize));
  root.ExaminaExportWorkspace={open:()=>el('exportShortcut')?.click()};
 }
 function ready(){
  // El rediseño principal monta #exam-ui-actions al finalizar DOMContentLoaded.
  // Esperamos un frame para respetar el orden de las inicializaciones online/offline.
  root.requestAnimationFrame(init);
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
})(window);
