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
 else panel.insertBefore(header,document.getElementById('group-sentences')||panel.firstChild);
 let renderPending=false,observer=null,previousQuestions=[];
 const find=()=>[...paper.querySelectorAll('.exam-sheet .exam-question')].filter(el=>!el.closest('#answerkey'));
 const sum=()=>previousQuestions.reduce((total,item)=>total+(scores[item.key]||0),0);
 function finalPreflight(){
  if(!finalCheckbox.checked)return {ok:true,mode:'borrador',normalized:false};
  const total=sum();
  if(!previousQuestions.length)return {ok:false,mode:'definitivo',reason:'sin_preguntas',total};
  if(morph()){
   // Una pregunta de morfología vale 1 p.; la nota se normaliza sobre diez.
   return {ok:total>0&&previousQuestions.every(item=>(scores[item.key]||0)>0),
    mode:'definitivo',normalized:true,total,reason:'puntuacion_morfologica'};
  }
  return {ok:total===1000,mode:'definitivo',normalized:false,total,reason:'total_no_es_diez'};
 }
 function canExport(){
  const result=finalPreflight();
  if(result.ok)return true;
  showStatus();
  status.classList.add('exam-scoring-warning');
  status.textContent=state().language==='va'?
   'Exportació definitiva bloquejada: revisa que hi haja preguntes i que la puntuació siga exactament 10 punts (morfologia: 1 punt per pregunta).':
   'Exportación definitiva bloqueada: revisa que haya preguntas y que la puntuación sume exactamente 10 puntos (morfología: 1 punto por pregunta).';
  header.scrollIntoView?.({block:'nearest'});
  return false;
 }
 finalCheckbox.addEventListener('change',showStatus);
 function showStatus(){
  const lang=state().language==='va',total=sum(),isMorph=morph();
  const totalString=value(total);
  finalText.textContent=lang?'Examen definitiu: comprovar la puntuació abans d’exportar':
   'Examen definitivo: comprobar la puntuación antes de exportar';
  if(!previousQuestions.length){
   status.className='exam-scoring-total';
   status.textContent=lang?'No hi ha preguntes per a puntuar.':'No hay preguntas que puntuar.';
  }else if(isMorph){
   status.className='exam-scoring-total';
   status.textContent=(lang?'Puntuació bruta: ':'Puntuación bruta: ')+totalString+(lang?' punts. La nota sobre 10 es calcula sobre aquest màxim.':' puntos. La nota sobre 10 se calcula sobre este máximo.');
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
   else if(!Object.prototype.hasOwnProperty.call(scores,key)||autoManaged.has(key)){
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
  persist();renderRows();renderQuestionScores();
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
  renderRows();
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
  snapshot:()=>Object.fromEntries(previousQuestions.map(x=>[x.key,scores[x.key]])),
  restore:restoreScores,isMorph:morph};
})();
