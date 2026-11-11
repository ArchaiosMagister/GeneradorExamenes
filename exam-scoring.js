/* Calificación editable por pregunta. Estado local, sin dependencias ni red.
 * Conserva el DOM de la vista previa: el exportador Word lee los mismos
 * enunciados y puntuaciones que aparecen en pantalla.
 */
(function(){
 'use strict';
 const paper=document.getElementById('paper'),panel=document.querySelector('#examLayout > aside.panel');
 if(!paper||!panel)return;
 const STORAGE='examina_question_points_v1',scores=Object.create(null);
 try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');
  for(const [key,value] of Object.entries(saved))if(Number.isInteger(value)&&value>=0&&value<=10000)
   scores[key]=value;
 }catch(_){}
 const persist=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(scores))}catch(_){}};
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
 header.append(title,help,rows,status);
 const questions=document.getElementById('examQuestionSettings');
 if(questions?.parentElement===panel)questions.after(header);
 else panel.insertBefore(header,document.getElementById('group-sentences')||panel.firstChild);
 let renderPending=false,observer=null,previousQuestions=[];
 const find=()=>[...paper.querySelectorAll('.exam-sheet .exam-question')].filter(el=>!el.closest('#answerkey'));
 const sum=()=>previousQuestions.reduce((total,item)=>total+(scores[item.key]||0),0);
 function showStatus(){
  const lang=state().language==='va',total=sum(),isMorph=morph();
  const totalString=value(total);
  if(!previousQuestions.length){
   status.className='exam-scoring-total';
   status.textContent=lang?'No hi ha preguntes per a puntuar.':'No hay preguntas que puntuar.';
  }else if(isMorph){
   status.className='exam-scoring-total';
   status.textContent=(lang?'Total: ':'Total: ')+totalString+' / '+(lang?'examen de morfologia (sense mínim de 10 punts)':'examen de morfología (sin exigencia de 10 puntos)');
  }else if(total!==1000){
   status.className='exam-scoring-total exam-scoring-warning';
   status.textContent=(lang?'Avís: la puntuació suma ':'Aviso: la puntuación suma ')+
    totalString+(lang?' punts, no 10. Revisa el repartiment.':' puntos, no 10. Revisa el reparto.');
  }else{
   status.className='exam-scoring-total exam-scoring-correct';
   status.textContent=lang?'Total: 10 punts.':'Total: 10 puntos.';
  }
 }
 function setScore(key,cents,{source='field'}={}){
  if(cents===null)return false;
  if(state().course!=='greek1'&&previousQuestions.some(item=>item.key===key&&kind(item.caption)==='lex'))cents=200;
  scores[key]=cents;persist();
  for(const item of previousQuestions.filter(item=>item.key===key)){
   if(source!=='preview'){
    const span=item.el.querySelector('.exam-question-points');
    if(span)span.textContent=label(cents);
   }
   const input=[...rows.querySelectorAll('input[data-scoring-key]')].find(el=>el.dataset.scoringKey===key);
   if(input&&source!=='field')input.value=value(cents);
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
   if(state().course!=='greek1'&&kind(item.caption)==='lex'){
    control.disabled=true;
    control.title='El léxico tiene puntuación fija de 2p.';
   }
   control.addEventListener('input',()=>{
    const n=number(control.value);
    control.setAttribute('aria-invalid',String(n===null));
    if(n!==null)setScore(item.key,n);
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
 function sync(){
  renderPending=false;
  if(!paper.querySelector('.exam-sheet')){previousQuestions=[];renderRows();return}
  if(observer)observer.disconnect();
  const elements=find(),raw=elements.map(el=>{
   const text=el.dataset.scoringCaption||clean(el.textContent);
   const match=/\(\s*(\d+(?:[,.]\d+)?)\s*p\.?\s*\)\s*[:.]?\s*$/i.exec(el.textContent);
   return {el,caption:text,original:match?number(match[1]):null};
  });
  const latinLex=state().course!=='greek1'&&raw.some(item=>kind(item.caption)==='lex');
  const otherCount=raw.filter(item=>!latinLex||kind(item.caption)!=='lex').length;
  const remainder=latinLex?800:1000;
  const defaults=raw.length?raw.map((item,i)=>{
   if(morph())return item.original??100;
   if(state().course==='greek1'&&item.original!==null)return item.original;
   if(latinLex&&kind(item.caption)==='lex')return 200;
   const ordinal=raw.slice(0,i).filter(x=>!latinLex||kind(x.caption)!=='lex').length;
   return otherCount?Math.floor(remainder/otherCount)+(ordinal<remainder%otherCount?1:0):0;
  }):[];
  const seen=new Map();
  previousQuestions=raw.map((item,i)=>{
   const base=kind(item.caption);
   const duplicate=seen.get(base)||0;seen.set(base,duplicate+1);
   const key=storageKey(base+(duplicate?'#'+duplicate:''));
   if(state().course!=='greek1'&&base==='lex')scores[key]=200;
   else if(!Object.prototype.hasOwnProperty.call(scores,key))scores[key]=defaults[i];
   const el=item.el;
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
    if(state().course!=='greek1'&&base==='lex'){
     pts.tabIndex=-1;pts.title='Léxico: 2p. fijos';
    }
    strong.append(count,caption,pts);el.replaceChildren(strong);
   }else{
    const span=el.querySelector('.exam-question-points');
    span.dataset.scoringKey=key;
   }
   return {el,key,caption:item.caption};
  });
  persist();renderRows();
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
  if(span&&!(state().course!=='greek1'&&kind(previousQuestions.find(q=>q.key===span.dataset.scoringKey)?.caption||'')==='lex'))editInPaper(span);
 });
 paper.addEventListener('keydown',event=>{
  const span=event.target?.closest?.('.exam-question-points');
  if(span&&(event.key==='Enter'||event.key===' ')){
   event.preventDefault();
   if(!(state().course!=='greek1'&&kind(previousQuestions.find(q=>q.key===span.dataset.scoringKey)?.caption||'')==='lex'))editInPaper(span);
  }
 });
 reset.addEventListener('click',()=>{
  const entries=previousQuestions;
  for(const [i,item] of entries.entries()){
   delete scores[item.key];
   const old=Number.parseFloat(item.el.dataset.scoringOriginal||'');
   const latinLex=state().course!=='greek1'&&entries.some(x=>kind(x.caption)==='lex');
   const otherCount=entries.filter(x=>!latinLex||kind(x.caption)!=='lex').length;
   const ordinal=entries.slice(0,i).filter(x=>!latinLex||kind(x.caption)!=='lex').length;
   const leftover=latinLex?800:1000;
   const cents=morph()?100:(state().course==='greek1'&&Number.isFinite(old))?Math.round(old*100):
    latinLex&&kind(item.caption)==='lex'?200:
    otherCount?Math.floor(leftover/otherCount)+(ordinal<leftover%otherCount?1:0):0;
   setScore(item.key,cents);
  }
  renderRows();
 });
 for(const id of ['course','model','lang']){
  document.getElementById(id)?.addEventListener('change',()=>{
   requestAnimationFrame(()=>schedule());
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
 else sync();
 window.ExaminaScoring={sync,parse:number,format:value,total:()=>sum(),
  rows:()=>previousQuestions.map(x=>({key:x.key,points:scores[x.key],caption:x.caption})),
  isMorph:morph};
})();
