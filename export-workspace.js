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
   '/* iPad: cinco botones de entrega en una sola fila sin reducir su área táctil. */',
   '@media screen and (min-width:951px) and (max-width:1279px){#examLayout #examPreviewActions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}body.exam-redesign #examLayout #examPreviewActions>button{flex:none;inline-size:100%;max-inline-size:100%;min-inline-size:0;block-size:44px;min-block-size:44px;max-block-size:44px;padding:4px 5px;font-size:12px}#examLayout #examPreviewActions [role="status"]{grid-column:1/-1}}',
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
   "\n/* Pestañas del inspector: únicamente la sección activa, sin ocultar nada al imprimir. */\n@media screen and (min-width:951px){\n body.exam-redesign #examEditorPanel[data-editor-section] #exam-ui-shell > :not(:where(#exam-ui-shell-title,#examPanelShortcuts)){\n  display:none!important\n }\n body.exam-redesign #examEditorPanel[data-editor-section=\"exam-ui-core\"] #exam-ui-shell > :is(#exam-ui-core,#exam-ui-shell-note),\n body.exam-redesign #examEditorPanel[data-editor-section=\"examQuestionSettings\"] #exam-ui-shell > #examQuestionSettings,\n body.exam-redesign #examEditorPanel[data-editor-section=\"examVisualSettings\"] #exam-ui-shell > #examVisualSettings,\n body.exam-redesign #examEditorPanel[data-editor-section=\"examQuestionSettings\"] #exam-ui-shell > #group-culture:not([hidden]),\n body.exam-redesign #examEditorPanel[data-editor-section=\"group-drafts\"] #exam-ui-shell > :is(#group-drafts,#examinaUnifiedBackup){\n  display:block!important\n }\n body.exam-redesign #examEditorPanel[data-editor-section] > #examScoring{\n  display:none!important\n }\n body.exam-redesign #examEditorPanel[data-editor-section=\"examScoring\"] > #examScoring:not([hidden]){\n  display:block!important\n }\n}\n\n@media screen{\n /* Estado activo inequívoco: borde de alto contraste, marca y superficie propia. */\n body.exam-redesign #examEditorPanel #exam-ui-shell #examPanelShortcuts > button[aria-pressed=\"true\"],\n body.exam-redesign #examEditorPanel #exam-ui-shell #examPanelShortcuts > button[aria-pressed=\"true\"]:hover{\n  position:relative;\n  z-index:1;\n  background:#075b76;\n  border:2px solid #68e9bd;\n  color:#fff;\n  font-weight:850;\n  filter:none;\n  box-shadow:inset 0 -4px 0 #68e9bd,0 0 0 2px #2da88b45,0 4px 11px #0004;\n }\n body.exam-redesign #examEditorPanel #exam-ui-shell #examPanelShortcuts > button[aria-pressed=\"true\"]::before{\n  content:\"✓\";\n  display:inline-flex;\n  align-items:center;\n  justify-content:center;\n  vertical-align:middle;\n  width:16px;\n  height:16px;\n  margin-right:5px;\n  box-sizing:border-box;\n  border-radius:50%;\n  background:#fff;\n  color:#075b76;\n  font:900 11px/1 system-ui,sans-serif;\n  pointer-events:none;\n }\n}\n",
   "\n/* Inspector de examen: densidad equilibrada sin modificar controles originales. */\n@media screen {\n body.exam-redesign #examEditorPanel #exam-ui-shell{gap:9px}\n body.exam-redesign #examEditorPanel #exam-ui-shell-title{font-size:18px;line-height:1.2}\n body.exam-redesign #examEditorPanel #exam-ui-shell-note{margin:-3px 0 0;font-size:12px;line-height:1.32}\n body.exam-redesign #examEditorPanel #exam-ui-shell :is(#exam-ui-core,#examScoring,#examVisualSettings,#group-drafts){\n  padding:10px;border-radius:9px\n }\n body.exam-redesign #examEditorPanel #exam-ui-meta{gap:5px 8px;padding-bottom:6px}\n body.exam-redesign #examEditorPanel #exam-ui-meta .field>label{margin-bottom:2px;font-size:12px}\n body.exam-redesign #examEditorPanel #exam-ui-meta .field :is(input,select){min-height:36px;padding:5px 7px}\n body.exam-redesign #examEditorPanel #primaryExamSettings h3{\n  font-size:13.5px;margin-bottom:6px;line-height:1.3\n }\n body.exam-redesign #examEditorPanel #primaryExamHeading{\n  min-height:32px;padding:6px 9px;border-left:3px solid var(--accent);border-radius:5px\n }\n body.exam-redesign #examEditorPanel :is(#examVisualSettings,#group-drafts)>summary{\n  min-height:39px;padding:7px 9px;border-left:3px solid var(--accent);\n  background:var(--soft);color:var(--soft-ink);\n  font-size:13px;line-height:1.3;font-weight:700\n }\n body.exam-redesign #examEditorPanel #examVisualSettings .exam-ui-visual-body{\n  padding:9px;gap:8px\n }\n body.exam-redesign #examEditorPanel #examVisualSettings .exam-ui-question-rows{gap:7px}\n body.exam-redesign #examEditorPanel #examVisualSettings .exam-ui-question-row{\n  padding:8px;gap:7px\n }\n body.exam-redesign #examEditorPanel #group-drafts .buttons{gap:6px}\n body.exam-redesign #examEditorPanel #exam-ui-meta :is(#primaryCoursePicker,#primaryModelPicker){grid-column:span 3}\n /* Atajos de desplazamiento, sin reemplazar los desplegables reales. */\n body.exam-redesign #examEditorPanel #examPanelShortcuts{\n  display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:0;\n  padding:0 0 2px;scroll-margin-top:16px\n }\n body.exam-redesign #examEditorPanel #examPanelShortcuts>button{\n  flex:0 0 auto;min-height:32px;padding:5px 9px;\n  border:1px solid var(--soft-border);border-radius:7px;\n  background:var(--soft);color:var(--soft-ink);\n  font-size:11.5px;font-weight:700;line-height:1.2;white-space:nowrap;cursor:pointer\n }\n body.exam-redesign #examEditorPanel #examPanelShortcuts>button:hover{\n  background:var(--editor-hover)\n }\n body.exam-redesign #examEditorPanel #examPanelShortcuts>button:focus-visible{\n  outline:2px solid var(--focus-course);outline-offset:2px\n }\n body.exam-redesign #examEditorPanel #exam-ui-shell :is(#exam-ui-core,#examQuestionSettings,#examScoring,#examVisualSettings,#group-drafts){\n  scroll-margin-top:14px\n }\n @media (max-width:950px){\n  body.exam-redesign #examEditorPanel #examPanelShortcuts{display:none}\n }\n @media(max-width:760px), (pointer:coarse){\n  body.exam-redesign #examEditorPanel :is(#examVisualSettings,#group-drafts)>summary{min-height:44px}\n  body.exam-redesign #examEditorPanel #exam-ui-meta .field :is(input,select){min-height:44px}\n }\n}",
   "\n/* Refinamiento de presentación: sin alterar el contenido imprimible. */\n@media screen {\n body.exam-redesign #examEditorPanel #examQuestionMenus {gap:4px}\n body.exam-redesign #examEditorPanel #examQuestionMenus .exam-question-heading {\n  padding:5px 8px;min-height:35px;font-size:13px;font-weight:750;line-height:1.25\n }\n body.exam-redesign #examEditorPanel #examQuestionMenus .exam-question-config {\n  gap:5px;padding:6px 8px 7px\n }\n body.exam-redesign #examEditorPanel #examQuestionMenus :is(.question-editor,.greek-choice-editor-rows,.greek-question-options) {gap:4px}\n body.exam-redesign #examEditorPanel #examQuestionMenus :is(.exam-word-editor,.lex-word-control,.greek-question-actions) {\n  gap:4px 6px;padding:3px 0;align-items:end\n }\n body.exam-redesign #examEditorPanel #examQuestionMenus :is(.exam-regenerate-word,.lex-word-control>button,.greek-question-actions>button,[data-regenerate-question]) {\n  border-radius:7px;font-size:12px;line-height:1.3;min-height:34px;padding:5px 9px\n }\n body.exam-redesign #examEditorPanel #examQuestionMenus .exam-question-name {font-weight:750}\n body.exam-redesign #examEditorPanel #examQuestionMenus .exam-question-status {font-weight:550;letter-spacing:.01em}\n #examPreviewActions #draftStatus {margin:0;font-size:11px;line-height:1.35;min-height:15px}\n #examPreviewActions #saveDraft {box-sizing:border-box;position:relative}\n #examPreviewActions #saveDraft[data-save-state=\"dirty\"] {border:2px solid #b57b22}\n #examPreviewActions #saveDraft[data-save-state=\"saving\"] {border:2px solid #4474b0}\n #examPreviewActions #saveDraft[data-save-state=\"saved\"] {border:2px solid #25765b}\n #examPreviewActions #saveDraft[data-save-state=\"error\"] {border:2px solid #b33838}\n #examPreviewActions #examRefinementReview {flex:1 0 100%;min-width:0;margin:0;padding:0;grid-column:1/-1}\n #examPreviewActions #examRefinementReview[hidden] {display:none!important}\n #examPreviewActions #examRefinementReview>summary {\n  cursor:pointer;list-style:revert;padding:4px 8px;color:var(--soft-ink);\n  background:var(--soft);border:1px solid var(--soft-border);\n  border-radius:6px;font-size:12px;font-weight:650\n }\n #examPreviewActions #examRefinementReview[data-level=\"warning\"]>summary {border-inline-start:3px solid #b47b21}\n #examPreviewActions #examRefinementReview[data-level=\"error\"]>summary {border-inline-start:3px solid #ad3939}\n #examPreviewActions #examRefinementReview .hint {margin:4px 8px;font-size:12px}\n #paper[data-examina-gloss-visible=\"false\"] .exam-gloss-review-workspace {max-height:176px;overflow-y:auto;overscroll-behavior:contain}\n #paper[data-examina-focus=\"decl\"] :is(.exam-question[data-exam-kind=\"decl\"],.exam-question[data-morph-kind=\"decl\"],.exam-question[data-greek-kind=\"decl\"],.greek-choice-subquestion[data-greek-kind=\"decl\"]),\n#paper[data-examina-focus=\"verb\"] :is(.exam-question[data-exam-kind=\"verb\"],.exam-question[data-morph-kind=\"verb\"],.exam-question[data-greek-kind=\"verb\"],.greek-choice-subquestion[data-greek-kind=\"verb\"]),\n#paper[data-examina-focus=\"forms\"] :is(.exam-question[data-exam-kind=\"forms\"],.exam-question[data-morph-kind=\"forms\"],.exam-question[data-greek-kind=\"forms\"],.greek-choice-subquestion[data-greek-kind=\"forms\"]),\n#paper[data-examina-focus=\"pronouns\"] :is(.exam-question[data-exam-kind=\"pronouns\"],.exam-question[data-morph-kind=\"pronouns\"],.exam-question[data-greek-kind=\"pronouns\"],.greek-choice-subquestion[data-greek-kind=\"pronouns\"]),\n#paper[data-examina-focus=\"lex\"] :is(.exam-question[data-exam-kind=\"lex\"],.exam-question[data-morph-kind=\"lex\"],.exam-question[data-greek-kind=\"lex\"],.greek-choice-subquestion[data-greek-kind=\"lex\"]),\n#paper[data-examina-focus=\"culture\"] :is(.exam-question[data-exam-kind=\"culture\"],.exam-question[data-morph-kind=\"culture\"],.exam-question[data-greek-kind=\"culture\"],.greek-choice-subquestion[data-greek-kind=\"culture\"]),\n#paper[data-examina-focus=\"sent\"] :is(.exam-question[data-exam-kind=\"sent\"],.exam-question[data-morph-kind=\"sent\"],.exam-question[data-greek-kind=\"sent\"],.greek-choice-subquestion[data-greek-kind=\"sent\"],.exam-question[data-greek-kind=\"sentences\"]),\n#paper[data-examina-focus=\"etymology\"] :is(.exam-question[data-exam-kind=\"etymology\"],.exam-question[data-morph-kind=\"etymology\"],.exam-question[data-greek-kind=\"etymology\"],.greek-choice-subquestion[data-greek-kind=\"etymology\"],.exam-question[data-exam-kind=\"greek-plurilingual\"]),\n#paper[data-examina-focus-fallback=\"greek-competence\"] .exam-question[data-exam-kind=\"greek-competence\"] {\n  outline:2px solid var(--accent,#386ba2)!important;\n  outline-offset:2px;\n  background-color:var(--soft,#eef5fc)!important;\n  border-radius:3px\n }\n @media(min-width:951px) and (max-width:1279px) {\n  #examLayout #examPreviewActions {grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}\n  body.exam-redesign #examLayout #examPreviewActions>button {font-size:12px;padding:5px 7px;min-height:44px;block-size:44px}\n  #examLayout #examPreviewActions :is(#draftStatus,#examinaPdfStatus,#exportValidationStatus,#examRefinementReview) {grid-column:1/-1}\n }\n @media(max-width:760px), (pointer:coarse) {\n  body.exam-redesign #examEditorPanel #examQuestionMenus .exam-question-heading {min-height:44px}\n  body.exam-redesign #examEditorPanel #exam-ui-shell #examQuestionMenus :is(button:not(.exam-question-toggle),select,input:not([type=checkbox])) {min-height:44px}\n  #examLayout #examPreviewActions>button {min-height:44px}\n }\n}\n",
  ].join('\n');
  doc.head.append(css);
 }
 function labelize(){
  const shortcuts=el('examPanelShortcuts');
  if(shortcuts){
   shortcuts.setAttribute('aria-label',tr('Apartados del editor','Apartats de l’editor'));
   for(const button of shortcuts.querySelectorAll('button[data-target]'))
    button.textContent=tr(button.dataset.labelEs,button.dataset.labelVa);
   const active=shortcuts.querySelector('button[aria-pressed="true"]');
   const heading=el('exam-ui-shell-title');
   if(active&&heading)
    heading.textContent=active.dataset.target==='exam-ui-core'
     ?tr('Preparar el examen','Preparar l’examen')
     :tr(active.dataset.labelEs,active.dataset.labelVa);
  }
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
 function configurePanelShortcuts(){
  // Solo cambia qué panel se dibuja en escritorio. Conserva nodos, eventos,
  // valores, puntuaciones y el funcionamiento táctil original (<=950 px).
  const shell=el('exam-ui-shell'),panel=el('examEditorPanel');
  if(!shell||!panel||el('examPanelShortcuts'))return;
  const destinations=[
   ['exam-ui-core','Configuración','Configuració'],
   ['examQuestionSettings','Preguntas','Preguntes'],
   ['examScoring','Puntuación','Puntuació'],
   ['examVisualSettings','Formato','Format'],
   ['group-drafts','Borradores','Esborranys']
  ];
  const nav=doc.createElement('nav');
  nav.id='examPanelShortcuts';nav.className='no-print';
  nav.setAttribute('aria-label','Apartados del editor');
  function select(id){
   const target=el(id);
   if(!target)return;
   panel.dataset.editorSection=id;
   for(const button of nav.querySelectorAll('button[data-target]'))
    button.setAttribute('aria-pressed',String(button.dataset.target===id));
   if(target.tagName==='DETAILS')target.open=true;
   const heading=el('exam-ui-shell-title');
   const button=nav.querySelector('button[data-target="'+id+'"]');
   if(heading&&button){
    heading.textContent=id==='exam-ui-core'
     ?tr('Preparar el examen','Preparar l’examen')
     :tr(button.dataset.labelEs,button.dataset.labelVa);
   }
  }
  for(const [id,es,val] of destinations){
   const target=el(id);
   if(!target)continue;
   const button=doc.createElement('button');
   button.type='button';
   button.dataset.target=id;
   button.dataset.labelEs=es;button.dataset.labelVa=val;
   button.textContent=tr(es,val);
   button.setAttribute('aria-pressed','false');
   button.addEventListener('click',()=>select(id));
   nav.append(button);
  }
  if(nav.childElementCount){
   const note=el('exam-ui-shell-note');
   if(note?.parentElement===shell)note.after(nav);
   else shell.prepend(nav);
   select('exam-ui-core');
  }
 }

 /* Interacciones de presentación: no se reescribe el motor ni el HTML del examen. */
 function configureRefinement(){
  const paper=el('paper'),toolbar=el('examPreviewActions'),questions=el('examQuestionMenus');
  const save=el('saveDraft'),feedback=el('draftStatus');
  if(!paper||!toolbar||!questions||!save||!feedback)return;
  let activeKind=null;
  const selectors={
   decl:['.exam-question[data-exam-kind="decl"]','.exam-question[data-morph-kind="decl"]','.exam-question[data-greek-kind="decl"]','.greek-choice-subquestion[data-greek-kind="decl"]'],
   verb:['.exam-question[data-exam-kind="verb"]','.exam-question[data-morph-kind="verb"]','.exam-question[data-greek-kind="verb"]','.greek-choice-subquestion[data-greek-kind="verb"]'],
   forms:['.exam-question[data-exam-kind="forms"]','.exam-question[data-morph-kind="forms"]','.exam-question[data-greek-kind="forms"]','.greek-choice-subquestion[data-greek-kind="forms"]'],
   pronouns:['.exam-question[data-exam-kind="pronouns"]','.exam-question[data-morph-kind="pronouns"]','.exam-question[data-greek-kind="pronouns"]','.greek-choice-subquestion[data-greek-kind="pronouns"]'],
   lex:['.exam-question[data-exam-kind="lex"]','.exam-question[data-morph-kind="lex"]','.exam-question[data-greek-kind="lex"]'],
   culture:['.exam-question[data-exam-kind="culture"]','.exam-question[data-morph-kind="culture"]'],
   sent:['.exam-question[data-exam-kind="sent"]','.exam-question[data-morph-kind="sent"]','.exam-question[data-greek-kind="sent"]','.exam-question[data-greek-kind="sentences"]'],
   etymology:['.exam-question[data-exam-kind="etymology"]','.exam-question[data-greek-kind="etymology"]','.greek-choice-subquestion[data-greek-kind="etymology"]','.exam-question[data-exam-kind="greek-plurilingual"]']
  };
  function previewTarget(kind){
   let target=paper.querySelector((selectors[kind]||[]).join(','));
   paper.removeAttribute('data-examina-focus-fallback');
   if(!target&&['decl','verb','forms','pronouns'].includes(kind)){
    target=paper.querySelector('.exam-question[data-exam-kind="greek-competence"]');
    if(target)paper.dataset.examinaFocusFallback='greek-competence';
   }
   return target;
  }
  function focusQuestion(kind,move){
   if(!selectors[kind])return;
   activeKind=kind;
   paper.dataset.examinaFocus=kind;
   const heading=previewTarget(kind);
   if(!move||!heading||paper.scrollHeight<=paper.clientHeight+16)return;
   const pane=paper.getBoundingClientRect(),item=heading.getBoundingClientRect();
   if(item.top<pane.top+12||item.bottom>pane.bottom-12)
    paper.scrollTop+=item.top-pane.top-25;
  }
  questions.addEventListener('toggle',event=>{
   const panel=event.target;
   if(panel.matches?.('details.exam-question-panel[data-question]')&&panel.open)
    root.requestAnimationFrame(()=>focusQuestion(panel.dataset.question,true));
  },true);
  questions.addEventListener('click',event=>{
   const summary=event.target.closest?.('summary.exam-question-heading');
   const panel=summary?.closest('details[data-question]');
   if(panel)root.requestAnimationFrame(()=>{if(panel.open)focusQuestion(panel.dataset.question,true)});
  });
  el('examPreviewTab')?.addEventListener('click',()=>{
   root.requestAnimationFrame(()=>{
    const heading=activeKind&&previewTarget(activeKind);
    if(heading&&root.matchMedia('(max-width: 950px)').matches)
     heading.scrollIntoView({block:'nearest',behavior:'auto'});
   });
  });

  // El indicador solo confirma éxito si el guardado original concluyó bien.
  let state='dirty';
  const descriptions={
   dirty:['Cambios sin guardar','Canvis sense guardar'],
   saving:['Guardando…','Guardant…'],
   saved:['Guardado en este navegador','Guardat en este navegador'],
   error:['No se pudo guardar. Exporta el borrador JSON.','No s’ha pogut guardar. Exporta l’esborrany JSON.']
  };
  function setSaveState(next,keepMessage){
   state=next;save.dataset.saveState=next;
   save.setAttribute('aria-label',tr('Guardar borrador','Guardar esborrany')+' · '+tr(...descriptions[next]));
   if(!keepMessage)feedback.textContent=tr(...descriptions[next]);
   feedback.dataset.saveState=next;
  }
  setSaveState('dirty');
  save.addEventListener('click',()=>setSaveState('saving'),true);
  save.addEventListener('click',()=>{
   let exists=false;
   try{exists=!!root.localStorage.getItem('examina_draft_v14')}catch(_){}
   const success=exists&&/^Borrador guardado en este navegador/.test(feedback.textContent);
   setSaveState(success?'saved':'error');
  });
  const restore=el('restoreDraft');
  restore?.addEventListener('click',()=>{
   root.queueMicrotask(()=>{
    if(/^Borrador recuperado/.test(feedback.textContent))setSaveState('saved',true);
   });
  });
  const markDirty=()=>{
   if(state!=='dirty')setSaveState('dirty');
  };
  doc.addEventListener('input',event=>{
   if(event.target?.closest?.('#examLayout'))markDirty();
  },true);
  doc.addEventListener('change',event=>{
   if(event.target?.closest?.('#examLayout'))markDirty();
  },true);
  el('lang')?.addEventListener('change',()=>root.requestAnimationFrame(()=>setSaveState(state)));

  // Resumen desplegable fuera del documento: nunca entra en Word, PDF ni borradores.
  const review=doc.createElement('details');
  review.id='examRefinementReview';
  review.className='no-print';
  review.hidden=true;
  const summary=doc.createElement('summary');review.append(summary);
  const help=doc.createElement('p');help.className='hint';review.append(help);
  toolbar.append(review);
  function syncReview(){
   const workspace=paper.querySelector('#examSentenceGlossary .exam-gloss-review-workspace');
   review.hidden=!workspace;
   if(!workspace){
    paper.removeAttribute('data-examina-gloss-visible');
    return;
   }
   const pending=workspace.querySelectorAll('.exam-gloss-review-choice,.exam-passive-label,.exam-gloss-pending .exam-review-line').length;
   const unknown=workspace.querySelectorAll('.exam-gloss-unknown .exam-review-line').length;
   const count=pending+unknown;
   review.dataset.level=unknown?'error':pending?'warning':'info';
   const message=count?
    tr('Glosario: '+count+' elementos por revisar','Glossari: '+count+' elements per revisar'):
    tr('Glosario: consultar decisiones','Glossari: consultar decisions');
   if(summary.textContent!==message)summary.textContent=message;
   help.textContent=tr('Despliega este apartado para ver todos los avisos sin limitar su altura en la vista previa.','Desplega este apartat per a veure tots els avisos sense limitar-ne l’altura en la vista prèvia.');
   paper.dataset.examinaGlossVisible=String(review.open);
  }
  review.addEventListener('toggle',syncReview);
  new root.MutationObserver(records=>{
   const changesPreview=record=>{
    if(record.target?.closest?.('.exam-gloss-review-workspace,#answerkey'))return false;
    if(record.type!=='childList')return true;
    const nodes=[...record.addedNodes,...record.removedNodes];
    return !nodes.length||nodes.some(node=>node.nodeType!==1||
     (node.id!=='answerkey'&&!node.matches?.('[data-answer-anchor]')));
   };
   if(records.some(changesPreview))markDirty();
   syncReview();
  }).observe(paper,{subtree:true,childList:true,characterData:true});
  syncReview();
 }

 function init(){
  if(installed||!el('exam-ui-shell')||!el('examinaUnifiedBackup'))return;
  installed=true;style();configureExport();configureAcademic();configurePanelShortcuts();labelize();configureRefinement();
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
