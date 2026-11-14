/* Calificación editable por pregunta. Estado local, sin dependencias ni red.
 * Conserva el DOM de la vista previa: el exportador Word lee los mismos
 * enunciados y puntuaciones que aparecen en pantalla.
 */
(function(){
 'use strict';
 const paper=document.getElementById('paper'),panel=document.querySelector('#examLayout > aside.panel');
 if(!paper||!panel)return;
 const STORAGE='examina_question_points_v1',scores=Object.create(null);
 const AUTO_STORAGE='examina_question_points_auto_v1',autoManaged=new Set();
 try{const restored=JSON.parse(localStorage.getItem(AUTO_STORAGE)||'[]');
  if(Array.isArray(restored))for(const key of restored)if(typeof key==='string')autoManaged.add(key);
 }catch(_){};
 try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');
  for(const [key,value] of Object.entries(saved))if(Number.isInteger(value)&&value>=0&&value<=10000)
   scores[key]=value;
 }catch(_){}
 const persist=()=>{try{
  localStorage.setItem(STORAGE,JSON.stringify(scores));
  localStorage.setItem(AUTO_STORAGE,JSON.stringify([...autoManaged]));
 }catch(_){}};
 const number=s=>{const m=/^\s*(?:\(\s*)?(\d+(?:[,.]\d{1,2})?)\s*(?:p(?:\.|untos?)?)?\s*\)?\.?\s*$/i.exec(String(s||''));
  if(!m)return null;
  const cents=Math.round(Number(m[1].replace(',','.'))*100);
  return Number.isSafeInteger(cents)&&cents>=0&&cents<=10000?cents:null;
 };
 const value=cents=>(cents/100).toFixed(2).replace(/0+$/,'').replace(/[,.]$/,'').replace('.',',');
 const label=cents=>'('+value(cents)+'p.).';
 const clean=raw=>{
  let s=String(raw||'').replace(/^\s*\d+\.\s*/,'').trim();
  s=s.replace(/\s*\(\s*\d+(?:[,.]\d+)?\s*p\.?\s*\)\s*[:.]?\s*$/i,'').trim();
  if(!/[.!?]$/.test(s))s=s.replace(/:$/,'').trim()+'.';
  return s;
 };
 const kind=text=>{
  const s=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(/^(declina|declina els)/.test(s))return 'decl';
  if(/^(conjuga)/.test(s))return 'verb';
  if(/pronom/.test(s))return 'pronouns';
  if(/cultura/.test(s))return 'culture';
  if(/lexic|etimol|derivad/.test(s))return /lexic/.test(s)?'lex':'etymology';
  if(/oracion|oracio|tradueix les/.test(s))return 'sent';
  if(/verbal/.test(s))return 'verbforms';
  if(/morfolog|paraules variables|palabras variables/.test(s))return 'forms';
  return 'q:'+s.replace(/[^a-z0-9]+/g,'-').slice(0,72);
 };
 const state=()=>({
  course:document.getElementById('course')?.value||'latin1',
  model:document.getElementById('model')?.value||'tablas',
  language:document.getElementById('lang')?.value||'es'
 });
 const morph=()=>['morf','morphology'].includes(state().model);
 const storageKey=(k)=>{const v=state();return v.course+'/'+v.model+'/'+k};
 // Los tipos explícitos del generador prevalecen sobre las etiquetas traducidas.
 const baseKind=item=>{
  const greek=item.el?.dataset?.greekKind;
  const aliases={declension:'decl',conjugation:'verb',sentences:'sent'};
  return item.el?.dataset?.examKind||(aliases[greek]||greek)||kind(item.caption);
 };
 const sentenceCents=()=>paper.querySelectorAll('.exam-sheet .exam-sentences [data-sentence-slot]').length*100;
 const pointDefaults=raw=>{
  const hasSentence=raw.some(x=>x.base==='sent'),sentence=hasSentence?sentenceCents():0;
  const latinLex=state().course!=='greek1'&&raw.some(x=>x.base==='lex');
  const available=Math.max(0,1000-sentence-(latinLex?200:0));
  const other=raw.filter(x=>x.base!=='sent'&&!(latinLex&&x.base==='lex'));
  let ordinal=0;
  return raw.map(x=>{
   if(morph())return x.original??100;
   if(x.base==='sent')return sentence;
   if(latinLex&&x.base==='lex')return 200;
   const n=ordinal++,quantity=other.length;
   return quantity?Math.floor(available/quantity)+(n<available%quantity?1:0):0;
  });
 };
 const header=document.createElement('section');
 header.id='examScoring';header.className='exam-scoring no-print';
 header.setAttribute('aria-label','Puntuación de las preguntas');
 const title=document.createElement('div');title.className='exam-scoring-heading';
 const heading=document.createElement('h3');heading.textContent='Puntuación por pregunta';
 const reset=document.createElement('button');reset.type='button';reset.className='secondary';
 reset.textContent='Repartir puntos';reset.title='Restablecer la puntuación inicial de este modelo';
 title.append(heading,reset);
 const help=document.createElement('p');help.className='hint';
 help.textContent='Modifica cada valor aquí o directamente sobre la puntuación del enunciado en la vista previa. El Word conserva los valores visibles.';
 const rows=document.createElement('div');rows.className='exam-scoring-rows';
 const status=document.createElement('p');status.id='examScoringTotal';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const finalLabel=document.createElement('label');
 finalLabel.className='exam-final-validation';
 finalLabel.style.display='flex';finalLabel.style.alignItems='center';finalLabel.style.gap='10px';
 finalLabel.style.marginTop='12px';
 const finalCheckbox=document.createElement('input');
 finalCheckbox.type='checkbox';finalCheckbox.id='examFinalMode';
 finalCheckbox.setAttribute('aria-describedby','examFinalHelp');
 const finalText=document.createElement('span');finalText.id='examFinalHelp';
 finalLabel.append(finalCheckbox,finalText);
 // La validación definitiva es opcional y se desactiva al cambiar de modelo.
 // Los borradores existentes se exportan como antes, incluso si aún no suman 10.
 header.append(title,help,rows,status,finalLabel);
 const questions=document.getElementById('examQuestionSettings');
 if(questions?.parentElement===panel)questions.after(header);
 else panel.insertBefore(header,panel.firstChild);
 let renderPending=false,observer=null,previousQuestions=[];
 const find=()=>[...paper.querySelectorAll('.exam-sheet .exam-question')].filter(el=>!el.closest('#answerkey'));
 const sum=()=>previousQuestions.reduce((total,item)=>total+(scores[item.key]||0),0);
 // Desglose docente: las puntuaciones internas son datos persistentes separados
 // de la presentación Word. Una cifra de la pregunta nunca reparte sus puntos
 // entre los elementos sin una decisión explícita del profesor.
 let detailGroups=[];
 const has=key=>Object.prototype.hasOwnProperty.call(scores,key);
 const itemKey=(question,part,word=null)=>question.key+'|sub:'+part+(word===null?'':':'+word);
 const initKey=q=>q.key+'|desglose-inicializado';
 const split=(cents,n)=>Array.from({length:n},(_,i)=>n?Math.floor(cents/n)+(i<cents%n?1:0):0);
 function collectDetailNodes(question){
  const block=[];
  for(let node=question.el.nextElementSibling;node;node=node.nextElementSibling){
   if(node.matches('.exam-question,#answerkey,.exam-glossary,.sentence-glossary,.exam-vocabulary,.final-gloss'))break;
   block.push(node);
  }
  const findIn=selector=>block.flatMap(node=>[
   ...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)
  ]);
  const base=question.base;
  if(base==='lex'){
   const parts=findIn('.lex-subquestion[data-lex-kind]');
   const optional=state().course==='latin1'&&parts.length>2;
   return {optional,groups:parts.map((node,i)=>({
    node,part:'lex-'+node.dataset.lexKind,wordNodes:[...node.querySelectorAll('[data-lex-slot]')],
    fixed:false
   }))};
  }
  const selectors={
   decl:'[data-syntagm-slot],table.exam-nouns',
   verb:'table.reference-verb-table tbody tr,.exam-verbs thead tr:first-child th[colspan]',
   verbforms:'table.reference-verb-table tbody tr',
   pronouns:'table.exam-pronouns tbody tr',
   forms:'[data-analysis-slot],.exam-form',
   culture:'ol.task>li',
   etymology:'.exam-etymology>span',
   sent:'.exam-sentences [data-sentence-slot]'
  };
  const nodes=findIn(selectors[base]||'.exam-item');
  return {optional:false,groups:nodes.map((node,i)=>({
   node:base==='sent'?(node.closest('li')||node):node,
   part:String(i),wordNodes:[],fixed:base==='sent'
  }))};
 }
 const detailLabel=node=>{
  const content=(node.dataset.subscoreCaption||node.textContent||'')
   .replace(/\s*\(\d+(?:[,.]\d+)?\s*p\.\)\s*$/,'').trim();
  const plain=content.replace(/\s+/g,' ');
  return plain.length>90?plain.slice(0,87)+'…':plain||'Elemento';
 };
 function initializeDetails(q){
  if(has(initKey(q)))return;
  const chosen=q.groups;
  const parent=scores[q.key]||0;
  const amounts=q.base==='sent'?chosen.map(()=>100):
   split(q.optional?Math.floor(parent/2):parent,chosen.length);
  chosen.forEach((group,i)=>{
   // Las alternativas de léxico valen cada una la mitad de los dos puntos
   // elegibles (no se suman las tres o más alternativas).
   const cents=q.optional?Math.floor(parent/2):amounts[i];
   scores[group.key]=cents;
   const terms=split(cents,group.children.length);
   group.children.forEach((child,j)=>{scores[child.key]=terms[j]});
  });
  scores[initKey(q)]=1;
 }
 function buildDetails(){
  detailGroups=previousQuestions.map(question=>{
   const {optional,groups}=collectDetailNodes(question);
   const q={...question,optional,groups:[]};
   groups.forEach((entry,i)=>{
    const group={...entry,key:itemKey(question,entry.part),index:i,
     label:detailLabel(entry.node),children:[]};
    entry.wordNodes.forEach((node,j)=>group.children.push({
     node,key:itemKey(question,entry.part,j),index:j,label:detailLabel(node)
    }));
    q.groups.push(group);
   });
   if(!q.groups.length)return q;
   initializeDetails(q);
   q.groups.forEach(group=>{
    if(group.fixed)scores[group.key]=100;
    else if(!has(group.key))scores[group.key]=0;
    group.children.forEach(child=>{if(!has(child.key))scores[child.key]=0});
   });
   return q;
  });
 }
 function detailDiscrepancies(){
  const errors=[];
  for(const q of detailGroups){
   if(!q.groups.length)continue;
   const parent=scores[q.key]||0;
   if(q.optional){
    if(parent%2!==0||q.groups.some(g=>(scores[g.key]||0)*2!==parent))
     errors.push(q.key+':alternativas');
   }else if(q.groups.reduce((n,g)=>n+(scores[g.key]||0),0)!==parent)
    errors.push(q.key+':total');
   for(const g of q.groups){
    if(g.children.length&&g.children.reduce((n,child)=>n+(scores[child.key]||0),0)!==(scores[g.key]||0))
     errors.push(g.key+':términos');
   }
  }
  return errors;
 }
 function updateDetail(key,cents,{activeInput=null}={}){
  if(cents===null)return false;
  const item=detailGroups.flatMap(q=>q.groups).find(g=>g.key===key);
  const child=detailGroups.flatMap(q=>q.groups.flatMap(g=>g.children)).find(c=>c.key===key);
  if(item?.fixed)return false;
  if(!item&&!child)return false;
  scores[key]=cents;
  persist();
  for(const input of panel.querySelectorAll('input[data-subscore-key]')){
   if(input.dataset.subscoreKey===key&&input!==activeInput)input.value=value(cents);
  }
  for(const labelNode of paper.querySelectorAll('[data-exam-subscore]')){
   if(labelNode.dataset.examSubscore===key)labelNode.textContent=' ('+value(cents)+' p.)';
  }
  refreshDetailSummaries();
  showStatus();
  return true;
 }
 function attachPreviewDetail(node,key,fixed){
  if(!node?.isConnected)return;
  const host=node.tagName==='TR'?(node.cells?.[0]||node):node;
  if(!host||host.dataset?.examSubscore===key)return;
  const labelNode=document.createElement('span');
  labelNode.className='exam-subpoint-label no-print';
  labelNode.dataset.examSubscore=key;
  labelNode.contentEditable='false';
  labelNode.textContent=' ('+value(scores[key]||0)+' p.)';
  labelNode.title='Puntuación de este elemento (solo para edición docente)';
  if(!fixed){
   labelNode.tabIndex=0;labelNode.setAttribute('role','button');
   labelNode.setAttribute('aria-label','Editar puntuación del elemento: '+value(scores[key]||0)+' puntos');
  }
  host.append(labelNode);
 }
 function redistributeDetails(q){
  if(!q.groups.length)return;
  delete scores[initKey(q)];
  q.groups.forEach(g=>{
   delete scores[g.key];
   for(const child of g.children)delete scores[child.key];
  });
  initializeDetails(q);
  persist();renderDetails();showStatus();
 }
 function refreshDetailSummaries(){
  for(const q of detailGroups){
   const target=panel.querySelector('[data-detail-status="'+CSS.escape(q.key)+'"]');
   if(!target)continue;
   const errors=detailDiscrepancies().filter(x=>x.startsWith(q.key+':')||x.startsWith(q.key+'|'));
   target.textContent=errors.length?(state().language==='va'?'Desglossament pendent de quadrar':'Desglose sin cuadrar'):
    (q.optional?(state().language==='va'?'Tria dues alternatives':'Elige dos alternativas'):
      (state().language==='va'?'Desglossament quadrat':'Desglose cuadrado'));
   target.className=errors.length?'exam-scoring-warning':'exam-scoring-correct';
  }
 }
 function detailInput(owner,description,fixed){
  const row=document.createElement('label');row.className='exam-subscore-row';
  const title=document.createElement('span');title.textContent=description;
  const input=document.createElement('input');input.type='text';input.inputMode='decimal';
  input.dataset.subscoreKey=owner.key;input.value=value(scores[owner.key]||0);
  input.setAttribute('aria-label','Puntos: '+description);
  input.disabled=Boolean(fixed);
  input.addEventListener('input',()=>{
   const n=number(input.value);input.setAttribute('aria-invalid',String(n===null));
   if(n!==null)updateDetail(owner.key,n,{activeInput:input});
  });
  input.addEventListener('blur',()=>{
   input.value=value(scores[owner.key]||0);input.removeAttribute('aria-invalid');
  });
  const unit=document.createElement('span');unit.textContent='p.';
  row.append(title,input,unit);
  return row;
 }
 function renderDetails(){
  rows.querySelectorAll('.exam-subscore-details').forEach(node=>node.remove());
  // Los distintivos de pantalla son controles docentes, nunca parte del Word.
  paper.querySelectorAll('[data-exam-subscore]').forEach(node=>node.remove());
  for(const q of detailGroups){
   if(!q.groups.length)continue;
   const detail=document.createElement('details');detail.className='exam-subscore-details';
   const head=document.createElement('summary');
   head.textContent='Desglose · '+q.caption;
   const status=document.createElement('span');status.dataset.detailStatus=q.key;
   status.className='exam-subscore-status';
   const resetButton=document.createElement('button');resetButton.type='button';
   resetButton.className='secondary';resetButton.textContent='Repartir desglose';
   resetButton.title='Acción docente explícita: sustituye los puntos de los elementos de esta pregunta';
   resetButton.addEventListener('click',()=>redistributeDetails(q));
   detail.append(head,status,resetButton);
   if(q.optional){
    const hint=document.createElement('p');hint.className='hint';
    hint.textContent='Se eligen dos apartados: las alternativas no se suman todas. Cada apartado alternativo debe valer la mitad de los puntos de la pregunta.';
    detail.append(hint);
   }
   for(const [i,g] of q.groups.entries()){
    detail.append(detailInput(g,(i+1)+'. '+g.label,g.fixed));
    attachPreviewDetail(g.node,g.key,g.fixed);
    for(const [j,child] of g.children.entries()){
     detail.append(detailInput(child,'   '+(j+1)+'. '+child.label,false));
     attachPreviewDetail(child.node,child.key,false);
    }
   }
   rows.append(detail);
  }
  refreshDetailSummaries();
 }
 function editPreviewSubscore(node){
  const key=node?.dataset?.examSubscore;
  if(!key||node.nextElementSibling?.classList.contains('exam-subscore-inline'))return;
  const input=document.createElement('input');
  input.className='exam-subscore-inline';input.type='text';input.inputMode='decimal';
  input.value=value(scores[key]||0);input.setAttribute('aria-label','Editar puntos del elemento');
  node.hidden=true;node.after(input);
  let cancelled=false;
  input.addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();input.blur()}
   else if(e.key==='Escape'){e.preventDefault();cancelled=true;input.blur()}
  });
  input.addEventListener('blur',()=>{
   const result=cancelled?null:number(input.value);
   input.remove();node.hidden=false;
   if(result!==null)updateDetail(key,result);
   node.focus({preventScroll:true});
  },{once:true});
  input.focus();input.select();
 }
 paper.addEventListener('click',e=>{
  const target=e.target?.closest?.('.exam-subpoint-label[role="button"]');
  if(target){e.stopPropagation();editPreviewSubscore(target)}
 });
 paper.addEventListener('keydown',e=>{
  const target=e.target?.closest?.('.exam-subpoint-label[role="button"]');
  if(target&&(e.key==='Enter'||e.key===' ')){
   e.preventDefault();e.stopPropagation();editPreviewSubscore(target);
  }
 });

 function finalPreflight(){
  if(!finalCheckbox.checked)return {ok:true,mode:'borrador',normalized:false};
  const total=sum();
  if(!previousQuestions.length)return {ok:false,mode:'definitivo',reason:'sin_preguntas',total};
  const mismatches=detailDiscrepancies();
  if(mismatches.length)return {ok:false,mode:'definitivo',normalized:false,
   total,reason:'desglose_no_cuadra',mismatches};
  // Los 10 puntos exactos rigen para todos los modelos. Las preguntas de
  // morfología empiezan con 1 p. pero nunca se normalizan sin conocimiento docente.
  return {ok:total===1000,mode:'definitivo',normalized:false,total,reason:'total_no_es_diez'};
 }
 function canExport(){
  const result=finalPreflight();
  if(result.ok)return true;
  showStatus();
  status.classList.add('exam-scoring-warning');
  status.textContent=result.reason==='desglose_no_cuadra'?
   (state().language==='va'?'Exportació bloquejada: el desglossament de les subpreguntes no quadra amb la seua pregunta.':
    'Exportación bloqueada: el desglose de las subpreguntas no coincide con su pregunta.'):
   (state().language==='va'?'Exportació definitiva bloquejada: la puntuació ha de sumar exactament 10 punts, també en morfologia.':
    'Exportación definitiva bloqueada: la puntuación debe sumar exactamente 10 puntos, también en morfología.');
  header.scrollIntoView?.({block:'nearest'});
  return false;
 }
 finalCheckbox.addEventListener('change',showStatus);
 function showStatus(){
  const lang=state().language==='va',total=sum(),isMorph=morph();
  const totalString=value(total);
  finalText.textContent=lang?'Examen definitiu: exactament 10 punts per a exportar':
   'Examen definitivo: exactamente 10 puntos para exportar';
  if(!previousQuestions.length){
   status.className='exam-scoring-total';
   status.textContent=lang?'No hi ha preguntes per a puntuar.':'No hay preguntas que puntuar.';
  }else if(detailDiscrepancies().length){
   status.className='exam-scoring-total exam-scoring-warning';
   status.textContent=lang?'Desglossament de les subpreguntes pendent de quadrar amb els punts de cada pregunta.':
    'El desglose de las subpreguntas no coincide con los puntos de cada pregunta.';
  }else if(isMorph&&total!==1000){
   status.className='exam-scoring-total exam-scoring-warning';
   status.textContent=(lang?'Morfologia: ':'Morfología: ')+totalString+
    (lang?' punts. Cada pregunta comença amb 1 p.; per al definitiu, ajusta expressament el total a 10.':
     ' puntos. Cada pregunta comienza con 1 p.; para el definitivo, ajusta expresamente el total a 10.');
  }else if(total!==1000){
   status.className='exam-scoring-total exam-scoring-warning';
   status.textContent=(lang?'Avís: la puntuació suma ':'Aviso: la puntuación suma ')+
    totalString+(lang?' punts, no 10. Revisa el repartiment.':' puntos, no 10. Revisa el reparto.');
  }else{
   status.className='exam-scoring-total exam-scoring-correct';
   status.textContent=lang?'Total: 10 punts.':'Total: 10 puntos.';
  }
 }
 function setScore(key,cents,{source='field',activeInput=null}={}){
  if(cents===null)return false;
  const item=previousQuestions.find(item=>item.key===key);
  if(item?.base==='sent')cents=sentenceCents();
  if(state().course!=='greek1'&&item?.base==='lex')cents=200;
  if(source==='auto')autoManaged.add(key);else autoManaged.delete(key);
  scores[key]=cents;persist();
  for(const item of previousQuestions.filter(item=>item.key===key)){
   if(source!=='preview'){
    const span=item.el.querySelector('.exam-question-points');
    if(span)span.textContent=label(cents);
   }
   for(const input of panel.querySelectorAll('input[data-scoring-key]')){
    if(input.dataset.scoringKey===key&&input!==activeInput)input.value=value(cents);
   }
   if(state().course==='greek1'){
    const scoreKind=key.split('/').pop().replace(/#\d+$/,'');
    const aliases={decl:'declension',verb:'conjugation',verbforms:'conjugation',sent:'sentences'};
    const legacy=document.getElementById('greek-points-'+(aliases[scoreKind]||scoreKind));
    if(legacy)legacy.value=value(cents).replace(',','.');
   }
  }
  showStatus();return true;
 }
 function renderRows(){
  rows.replaceChildren();
  for(const [i,item] of previousQuestions.entries()){
   const row=document.createElement('label');row.className='exam-scoring-row';
   const name=document.createElement('span');
   name.textContent=(i+1)+'. '+item.caption;
   name.title=item.caption;
   const control=document.createElement('input');
   control.type='text';control.inputMode='decimal';control.autocomplete='off';
   control.dataset.scoringKey=item.key;
   control.setAttribute('aria-label','Puntos de la pregunta '+(i+1)+': '+item.caption);
   control.value=value(scores[item.key]||0);
   if(item.base==='sent'||(state().course!=='greek1'&&item.base==='lex')){
    control.disabled=true;
    control.title=item.base==='sent'?'Un punto por oración. Cambia el número de oraciones para variar el total.':'El léxico tiene puntuación fija de 2p.';
   }
   control.addEventListener('input',()=>{
    const n=number(control.value);
    control.setAttribute('aria-invalid',String(n===null));
    if(n!==null)setScore(item.key,n,{activeInput:control});
   });
   control.addEventListener('blur',()=>{
    const n=number(control.value);
    control.value=value(scores[item.key]||0);
    control.removeAttribute('aria-invalid');
    if(n!==null)setScore(item.key,n);
   });
   const unit=document.createElement('span');unit.textContent='p.';unit.className='exam-scoring-unit';
   row.append(name,control,unit);rows.append(row);
  }
  reset.textContent=state().language==='va'?'Repartir punts':'Repartir puntos';
  reset.title=morph()?
   (state().language==='va'?'Restableix 1 punt inicial per pregunta. El total pot no ser 10.':
    'Restablece 1 punto inicial por pregunta. El total puede no ser 10.'):
   (state().language==='va'?'Reparteix expressament els punts; substitueix els valors actuals.':
    'Reparte explícitamente los puntos y sustituye los valores actuales.');
  help.textContent=state().language==='va'?
   'Edita cada valor ací o la xifra del mateix enunciat en la vista prèvia. El Word conserva la puntuació.':
   'Edita cada valor aquí o la cifra del propio enunciado en la vista previa. El Word conserva la puntuación.';
  heading.textContent=state().language==='va'?'Puntuació per pregunta':'Puntuación por pregunta';
  showStatus();
 }

 // Cada pregunta muestra su propia puntuación, además del resumen general.
 // Se enlaza a la misma clave que el Word, sin reconstruir el examen.
 function renderQuestionScores(){
  const host=document.getElementById('examQuestionMenus');if(!host)return;
  host.querySelectorAll('.exam-question-score-row').forEach(row=>row.remove());
  for(const item of previousQuestions){
   const base=item.key.split('/').pop().replace(/#\d+$/,'');
   const target=base==='verbforms'?'verb':base;
   const detail=[...host.querySelectorAll('[data-question]')].find(el=>el.dataset.question===target);
   if(!detail||detail.dataset.available==='false'||detail.dataset.included==='false')continue;
   const body=detail.querySelector('.exam-question-config');if(!body)continue;
   const label=document.createElement('label');label.className='exam-question-score-row';
   label.style.display='flex';label.style.alignItems='center';label.style.gap='10px';
   label.textContent=state().language==='va'?'Puntuació (p.)':'Puntuación (p.)';
   const input=document.createElement('input');input.type='text';input.inputMode='decimal';
   input.autocomplete='off';input.dataset.scoringKey=item.key;
   input.setAttribute('aria-label','Puntuación de '+item.caption);
   input.style.width='90px';input.style.maxWidth='90px';
   input.value=value(scores[item.key]||0);
   if(target==='sent'||(state().course!=='greek1'&&target==='lex')){
    input.disabled=true;input.title=target==='sent'?'1 p. por oración':'Léxico: 2p. fijos';
   }
   input.addEventListener('input',()=>{
    const parsed=number(input.value);
    input.setAttribute('aria-invalid',String(parsed===null));
    if(parsed!==null)setScore(item.key,parsed,{source:'question',activeInput:input});
   });
   input.addEventListener('blur',()=>{
    input.value=value(scores[item.key]||0);input.removeAttribute('aria-invalid');
   });
   label.append(input);body.prepend(label);
  }
 }
 const menuHost=document.getElementById('examQuestionMenus');
 if(menuHost)new MutationObserver(()=>renderQuestionScores()).observe(menuHost,{childList:true});

 function sync(){
  renderPending=false;
  if(!paper.querySelector('.exam-sheet')){previousQuestions=[];renderRows();renderQuestionScores();return}
  if(observer)observer.disconnect();
  const elements=find(),raw=elements.map(el=>{
   const text=el.dataset.scoringCaption||clean(el.textContent);
   const match=/\(\s*(\d+(?:[,.]\d+)?)\s*p\.?\s*\)\s*[:.]?\s*$/i.exec(el.textContent);
   return {el,caption:text,original:match?number(match[1]):null,
    base:baseKind({el,caption:text})};
  });
  const defaults=pointDefaults(raw);
  const seen=new Map();
  previousQuestions=raw.map((item,i)=>{
   const base=item.base;
   const duplicate=seen.get(base)||0;seen.set(base,duplicate+1);
   const key=storageKey(base+(duplicate?'#'+duplicate:''));
   if(base==='sent')scores[key]=sentenceCents();
   else if(state().course!=='greek1'&&base==='lex')scores[key]=200;
   else if(!Object.prototype.hasOwnProperty.call(scores,key)){
    // Solo se asigna la puntuación inicial una vez por clave; un cambio de
    // unidades, número de oraciones o selección no redistribuye valores previos.
    scores[key]=defaults[i];autoManaged.add(key);
   }
   if(state().course==='greek1'){
    const aliases={decl:'declension',verb:'conjugation',sent:'sentences'};
    const legacy=document.getElementById('greek-points-'+(aliases[base]||base));
    if(legacy)legacy.value=value(scores[key]).replace(',','.');
   }
   const el=item.el;
   if(item.original!==null&&!el.dataset.scoringOriginal)el.dataset.scoringOriginal=String(item.original/100);
   el.dataset.scoringCaption=item.caption;
   el.dataset.scoringKey=key;
   if(!el.querySelector('.exam-question-points')){
    const strong=document.createElement('strong');
    const num=el.textContent.match(/^\s*(\d+)\.\s*/);
    const count=document.createElement('span');count.className='exam-q-number';
    count.textContent=(num?num[1]:String(i+1))+'.';
    const caption=document.createElement('span');caption.className='exam-question-caption';
    caption.textContent=' '+item.caption+' ';
    const pts=document.createElement('span');pts.className='exam-question-points';
    pts.contentEditable='false';pts.tabIndex=0;pts.dataset.scoringKey=key;
    pts.setAttribute('role','button');
    pts.setAttribute('title','Modificar puntuación');
    pts.setAttribute('aria-label','Modificar puntuación de la pregunta '+(i+1));
    pts.textContent=label(scores[key]);
    if(base==='sent'||(state().course!=='greek1'&&base==='lex')){
     pts.tabIndex=-1;
     pts.title=base==='sent'?'1 p. por oración':'Léxico: 2p. fijos';
    }
    strong.append(count,caption,pts);el.replaceChildren(strong);
   }else{
    const span=el.querySelector('.exam-question-points');
    span.dataset.scoringKey=key;
    // Al recuperar un borrador, el texto del Word y el estado numérico
    // deben proceder del mismo valor restaurado.
    span.textContent=label(scores[key]);
   }
   return {el,key,caption:item.caption,base};
  });
  buildDetails();persist();renderRows();renderQuestionScores();renderDetails();
  if(observer)observer.observe(paper,{subtree:true,childList:true,characterData:true});
 }
 function schedule(){
  if(renderPending)return;renderPending=true;
  Promise.resolve().then(sync);
 }
 observer=new MutationObserver(records=>{
  if(records.some(record=>record.type==='childList'&&(
   [...record.addedNodes].some(node=>node.nodeType===1&&(
    node.classList?.contains('exam-sheet')||node.classList?.contains('exam-question')||node.querySelector?.('.exam-question')
   ))||
   record.target===paper
  )))schedule();
 });
 observer.observe(paper,{subtree:true,childList:true,characterData:true});
 rows.addEventListener('change',showStatus);
 // La vista previa completa es contenteditable, por lo que editar un span
 // anidado directamente puede insertar texto en el ENUNCIADO equivocado
 // (constatado en Chromium). Un campo temporal al pulsar el sufijo evita eso.
 function editInPaper(span){
  if(!span||span.nextElementSibling?.classList.contains('exam-score-inline-editor'))return;
  const key=span.dataset.scoringKey,editor=document.createElement('input');
  editor.type='text';editor.inputMode='decimal';editor.autocomplete='off';
  editor.className='exam-score-inline-editor';editor.value=value(scores[key]||0);
  editor.setAttribute('aria-label','Puntos de esta pregunta');
  span.hidden=true;span.after(editor);
  let cancelled=false;
  editor.addEventListener('keydown',event=>{
   if(event.key==='Enter'){event.preventDefault();editor.blur()}
   else if(event.key==='Escape'){event.preventDefault();cancelled=true;editor.blur()}
  });
  editor.addEventListener('blur',()=>{
   const parsed=cancelled?null:number(editor.value);
   editor.remove();span.hidden=false;
   if(parsed!==null)setScore(key,parsed,{source:'inline'});
   span.focus({preventScroll:true});
  },{once:true});
  editor.focus();editor.select();
 }
 paper.addEventListener('click',event=>{
  const span=event.target?.closest?.('.exam-question-points');
  if(span){const base=previousQuestions.find(q=>q.key===span.dataset.scoringKey)?.base;
   if(base!=='sent'&&!(state().course!=='greek1'&&base==='lex'))editInPaper(span);
  }
 });
 paper.addEventListener('keydown',event=>{
  const span=event.target?.closest?.('.exam-question-points');
  if(span&&(event.key==='Enter'||event.key===' ')){
   event.preventDefault();
   const base=previousQuestions.find(q=>q.key===span.dataset.scoringKey)?.base;
   if(base!=='sent'&&!(state().course!=='greek1'&&base==='lex'))editInPaper(span);
  }
 });
 reset.addEventListener('click',()=>{
  const items=previousQuestions;
  const raw=items.map(item=>{
   const old=Number.parseFloat(item.el.dataset.scoringOriginal||'');
   return {el:item.el,caption:item.caption,base:item.base,
    original:Number.isFinite(old)?Math.round(old*100):null};
  });
  const defaults=pointDefaults(raw);
  items.forEach((item,i)=>{
   delete scores[item.key];
   setScore(item.key,defaults[i],{source:'auto'});
  });
  for(const q of detailGroups){
   delete scores[initKey(q)];
   q.groups.forEach(g=>{delete scores[g.key];g.children.forEach(c=>delete scores[c.key])});
  }
  sync();
 });
 for(const id of ['course','model','lang']){
  document.getElementById(id)?.addEventListener('change',()=>{
   if(id!=='lang')finalCheckbox.checked=false;
   requestAnimationFrame(()=>schedule());
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
 else sync();
 function restoreScores(saved){
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return;
  const current=state(),prefix=current.course+'/'+current.model+'/';
  for(const [key,cents] of Object.entries(saved)){
   if(key.startsWith(prefix)&&Number.isInteger(cents)&&cents>=0&&cents<=10000){
    scores[key]=cents;autoManaged.delete(key);
   }
  }
  persist();sync();
 }
 document.addEventListener('change',event=>{
  const match=/^greek-points-(declension|conjugation|forms|pronouns|etymology|sentences)$/.exec(event.target?.id||'');
  if(!match)return;
  const aliases={declension:'decl',conjugation:'verb',sentences:'sent'};
  const base=aliases[match[1]]||match[1],item=previousQuestions.find(x=>
   x.key.split('/').pop().replace(/#\d+$/,'')===base);
  if(item)setScore(item.key,number(event.target.value));
 },true);
 window.ExaminaScoring={sync,parse:number,format:value,total:()=>sum(),
  preflight:finalPreflight,canExport,finalMode:()=>finalCheckbox.checked,
  rows:()=>previousQuestions.map(x=>({key:x.key,points:scores[x.key],caption:x.caption})),
  snapshot:()=>{
    const all=previousQuestions.map(x=>[x.key,scores[x.key]]);
    for(const q of detailGroups){
     if(!q.groups.length)continue;
     all.push([initKey(q),scores[initKey(q)]||1]);
     for(const g of q.groups){
      all.push([g.key,scores[g.key]||0]);
      for(const c of g.children)all.push([c.key,scores[c.key]||0]);
     }
    }
    return Object.fromEntries(all);
   },
   details:()=>detailGroups.map(q=>({key:q.key,base:q.base,optional:q.optional,
    parent:scores[q.key]||0,groups:q.groups.map(g=>({
     key:g.key,points:scores[g.key]||0,fixed:g.fixed,
     children:g.children.map(c=>({key:c.key,points:scores[c.key]||0}))
    }))})),
   detailErrors:detailDiscrepancies,
  restore:restoreScores,isMorph:morph};
})();
