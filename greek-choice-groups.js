/* Griego I: dos bloques de competencias y traducción. No interviene
 * en la generación de exámenes de morfología ni en los cursos de latín.
 * Los datos nuevos viven en los tres bancos greek-choice-*.js. */
(function(){
 'use strict';
 const onlyGreek=()=>currentCourse()==='greek1'&&['complete','translation'].includes($('model').value);
 const t=(es,va)=>$('lang').value==='va'?va:es;
 const numerals={es:['cero','una','dos','tres','cuatro','cinco'],
  va:['zero','una','dos','tres','quatre','cinc']};
 const num=n=>numerals[$('lang').value][n]||String(n);
 const storeKey='examina_greek_choice_options_v1';
 let flags={complete:{number:true,retro:true,roots:true},translation:{number:true,retro:true,roots:true}};
 try{
  const old=JSON.parse(localStorage.getItem(storeKey)||'{}');
  for(const mode of ['complete','translation'])
   for(const key of ['number','retro','roots'])
    if(typeof old?.[mode]?.[key]==='boolean')flags[mode][key]=old[mode][key];
 }catch(_){}
 const included=key=>flags[$('model').value]?.[key]!==false;
 const save=()=>{try{localStorage.setItem(storeKey,JSON.stringify(flags))}catch(_){}};
 const edits=new Map();let lastScope='';
 const APIs={
  number:()=>window.ExaminaGreekNumber,
  retro:()=>window.ExaminaGreekRetroversion,
  roots:()=>window.ExaminaGreekEtymSentence
 };
 const previousAvailability=examQuestionAvailable;
 examQuestionAvailable=function(kind){
  if(onlyGreek()){
   if(kind==='pronouns')return false;
   if(['decl','verb','forms','etymology','sent'].includes(kind))return true;
  }
  return previousAvailability(kind);
 };
 // Traducción mantiene su número propio de oraciones, pero ahora también
 // puede ofrecer las cinco alternativas morfosintácticas.
 greekModes.translation.points=[1,1,1,0,1,6];
 function subtitle(kind,letter,title){
  const node=document.createElement('p');
  node.className='exam-item greek-choice-subquestion';
  node.dataset.greekKind=kind;
  node.innerHTML='<span class="exam-letter">'+letter+'.</span> <strong>'+esc(title)+'</strong>';
  return node;
 }
 function heading(kind,number,title){
  const p=document.createElement('p');p.className='exam-question';p.dataset.examKind=kind;
  p.innerHTML='<strong><span class="exam-q-number">'+number+'.</span> '+esc(title)+'</strong>';
  return p;
 }
 function choiceTitle(n,group){
  if(group===1){
   if(n>3)return t('Comprensión morfosintáctica. Elige tres de estas '+num(n)+' preguntas.',
     'Comprensió morfosintàctica. Tria tres d’estes '+num(n)+' preguntes.');
   if(n===3)return t('Comprensión morfosintáctica. Responde a las tres preguntas siguientes.',
     'Comprensió morfosintàctica. Respon a les tres preguntes següents.');
   if(n===2)return t('Comprensión morfosintáctica. Responde a las dos preguntas siguientes.',
     'Comprensió morfosintàctica. Respon a les dos preguntes següents.');
   return t('Comprensión morfosintáctica. Responde a la siguiente pregunta.',
     'Comprensió morfosintàctica. Respon a la pregunta següent.');
  }
  return n===2?t('Plurilingüismo. Elige una de estas dos preguntas.',
    'Plurilingüisme. Tria una d’estes dos preguntes.'):
    t('Plurilingüismo. Responde a la siguiente pregunta.',
      'Plurilingüisme. Respon a la pregunta següent.');
 }
 function grab(sheet,kind){
  const head=[...sheet.children].find(x=>x.classList?.contains('exam-question')&&x.dataset.greekKind===kind);
  if(!head)return null;
  const nodes=[head];let next=head.nextElementSibling;
  while(next&&!next.classList.contains('exam-question')&&next.id!=='answerkey'&&
        next.id!=='examSentenceGlossary'&&!next.classList.contains('final-gloss')){
   nodes.push(next);next=next.nextElementSibling;
  }
  nodes.forEach(n=>n.remove());return nodes;
 }
 const labels={
  declension:['Tablas para declinar.','Taules per a declinar.'],
  forms:['Análisis morfológico.','Anàlisi morfològica.'],
  conjugation:['Conjugación de verbos.','Conjugació de verbs.'],
  etymology:['Escribe al menos dos derivados etimológicos a partir de los siguientes términos griegos.',
    'Escriu almenys dos derivats etimològics a partir dels termes grecs següents.'],
  'change-number':['Pasa a singular o a plural estos sintagmas.','Passa a singular o a plural estos sintagmes.'],
  retroversion:['Traduce al griego los siguientes sintagmas.','Traduïx al grec els sintagmes següents.'],
  roots:['Escribe los étimos griegos de los que derivan las palabras subrayadas en esta oración.',
    'Escriu els ètims grecs dels quals deriven les paraules subratllades en esta oració.']
 };
 const label=kind=>t(...labels[kind]);
 function option(kind,nodes){
  if(!nodes||!nodes.slice(1).some(el=>el.matches('[data-corpus-id]')||!!el.querySelector('[data-corpus-id]')))return null;
  const box=document.createElement('section');box.className='greek-choice-option';box.dataset.greekOption=kind;
  box.append(subtitle(kind,'a',label(kind)),...nodes.slice(1));return box;
 }
 function generated(kind,rows){
  if(!rows?.length)return null;
  const key=kind==='change-number'?'number':'retro',box=document.createElement('section');
  box.className='greek-choice-option';box.dataset.greekOption=kind;
  box.append(subtitle(kind,'a',label(kind)));
  rows.forEach((item,i)=>{
   const row=document.createElement('p');row.className='exam-item greek-choice-generated-item';
   const slot=kind+':'+i;
   row.dataset.greekChoiceSlot=slot;
   const text=kind==='change-number'?
    t(item.direction==='singular'?'A singular: ':'A plural: ',item.direction==='singular'?'A singular: ':'A plural: ')+item.prompt:
    item.prompt;
   row.innerHTML='<span class="exam-letter">'+(i+1)+'.</span> '+esc(edits.has(slot)?edits.get(slot):text);
   box.append(row);
  });
  return box;
 }
 function rootsOption(item){
  if(!item)return null;
  const box=document.createElement('section');box.className='greek-choice-option';box.dataset.greekOption='roots';
  box.append(subtitle('roots','a',label('roots')));
  const p=document.createElement('p');p.className='exam-item greek-choice-etym-sentence';
  p.dataset.greekChoiceSlot='roots:0';
  p.innerHTML=edits.has('roots:0')?esc(edits.get('roots:0')):window.ExaminaGreekEtymSentence.render(item);
  box.append(p);return box;
 }
 function renumber(options){
  options.forEach((section,i)=>{
   const x=section.querySelector(':scope > .greek-choice-subquestion .exam-letter');
   if(x)x.textContent=String.fromCharCode(97+i)+'.';
  });
 }
 function scopeKey(){return JSON.stringify([$('model').value,greekMarkedUnits(),$('lang').value])}
 function regroup(){
  const sheet=$('paper').querySelector('.exam-sheet');
  if(!sheet||!greekMarkedUnits().length)return;
  const scope=scopeKey();
  if(scope!==lastScope){lastScope=scope;edits.clear()}
  const parts={};
  for(const kind of ['declension','conjugation','forms','pronouns','etymology','sentences'])
   parts[kind]=grab(sheet,kind);
  const morph=[];
  const decl=option('declension',parts.declension);if(decl)morph.push(decl);
  const forms=option('forms',parts.forms);if(forms)morph.push(forms);
  const numItems=included('number')?APIs.number()?.current():null;
  const number=generated('change-number',numItems);if(number)morph.push(number);
  const retroItems=included('retro')?APIs.retro()?.current():null;
  const retro=generated('retroversion',retroItems);if(retro)morph.push(retro);
  const verb=option('conjugation',parts.conjugation);if(verb)morph.push(verb);
  const etym=[];
  const derived=option('etymology',parts.etymology);if(derived)etym.push(derived);
  const etymItem=included('roots')?APIs.roots()?.current():null;
  const root=rootsOption(etymItem);if(root)etym.push(root);
  const frag=document.createDocumentFragment();let currentNumber=0;
  if(morph.length){
   renumber(morph);frag.append(heading('greek-competence',++currentNumber,choiceTitle(morph.length,1)));
   morph.forEach(x=>frag.append(x));
  }
  if(etym.length){
   renumber(etym);frag.append(heading('greek-plurilingual',++currentNumber,choiceTitle(etym.length,2)));
   etym.forEach(x=>frag.append(x));
  }
  if(parts.sentences?.length){
   const sentences=parts.sentences.slice(),q=sentences[0];
   q.querySelector('.exam-q-number').textContent=(++currentNumber)+'.';
   q.dataset.examKind='sent';delete q.dataset.greekKind;
   frag.append(...sentences);
  }
  const anchor=sheet.querySelector(':scope > #examSentenceGlossary')||sheet.querySelector(':scope > #answerkey');
  if(anchor)sheet.insertBefore(frag,anchor);else sheet.append(frag);
  window.greekLastPreview=$('paper').innerHTML;
  if(window.greekLastExam)window.greekLastExam.grouped=true;
 }
 const previousGenerate=generateGreekExam;
 generateGreekExam=function(){
  previousGenerate();
  if(onlyGreek())regroup();
 };
 // Regeneración completa de una alternativa antigua, preservando las
 // correcciones de todas las demás, la cabecera y las oraciones.
 const previousRegenerate=greekRegenerate;
 greekRegenerate=function(kind){
  if(!onlyGreek())return previousRegenerate(kind);
  if(!['declension','forms','conjugation','etymology'].includes(kind))return false;
  const ids=greekExamState?.ids?.[kind],oldSheet=$('paper').querySelector('.exam-sheet');
  if(!ids?.length||!oldSheet)return false;
  const candidates=greekChoicePool(kind).filter(x=>!ids.includes(x.id));
  if(candidates.length<ids.length)return false;
  const before=ids.slice(),previousAdjectives=greekExamState.adjectiveChoices?
   {...greekExamState.adjectiveChoices}:undefined;
  greekExamState.ids[kind]=greekCurricularSample(candidates,ids.length).map(x=>x.id);
  if(kind==='declension')greekExamState.adjectiveChoices={};
  generateGreekExam();
  const fresh=$('paper').querySelector('.exam-sheet');
  const selector='.greek-choice-option[data-greek-option="'+kind+'"]';
  const oldPart=oldSheet.querySelector(selector),newPart=fresh?.querySelector(selector);
  if(!oldPart||!newPart){
   greekExamState.ids[kind]=before;
   if(previousAdjectives)greekExamState.adjectiveChoices=previousAdjectives;
   else delete greekExamState.adjectiveChoices;
   $('paper').replaceChildren(oldSheet);refreshManualMorphWords();return false;
  }
  // Mantener la letra (que depende del conjunto de alternativas marcadas).
  const oldLetter=oldPart.querySelector(':scope > .greek-choice-subquestion .exam-letter');
  const newLetter=newPart.querySelector(':scope > .greek-choice-subquestion .exam-letter');
  if(oldLetter&&newLetter)newLetter.textContent=oldLetter.textContent;
  oldPart.replaceWith(newPart);
  const oldAnswers=oldSheet.querySelector('#answerkey'),newAnswers=fresh.querySelector('#answerkey');
  const oldH=oldAnswers?.querySelector('h3[data-greek-kind="'+kind+'"]');
  const newH=newAnswers?.querySelector('h3[data-greek-kind="'+kind+'"]');
  if(oldH&&newH){
   const oldNodes=[oldH],newNodes=[newH];
   let n=oldH.nextElementSibling;
   while(n&&n.tagName!=='H3'){oldNodes.push(n);n=n.nextElementSibling}
   n=newH.nextElementSibling;
   while(n&&n.tagName!=='H3'){newNodes.push(n);n=n.nextElementSibling}
   oldH.before(...newNodes);oldNodes.forEach(node=>node.remove());
  }
  $('paper').replaceChildren(oldSheet);
  if($('model').value==='complete')greekExamControls();else refreshManualMorphWords();
  window.greekLastPreview=$('paper').innerHTML;refreshCustomRows();
  return true;
 };
 function replaceGenerated(kind,index=null){
  if(!onlyGreek())return false;
  const api=kind==='change-number'?APIs.number():kind==='retroversion'?APIs.retro():APIs.roots();
  const oldSheet=$('paper').querySelector('.exam-sheet');if(!api||!oldSheet)return false;
  const result=kind==='roots'?api.regenerate():index===null?api.regenerateAll():api.regenerateOne(index);
  if(!result)return false;
  if(index!==null)edits.delete(kind+':'+index);
  if(kind==='roots')edits.delete('roots:0');
  generateGreekExam();
  const fresh=$('paper').querySelector('.exam-sheet');
  const selector='.greek-choice-option[data-greek-option="'+kind+'"]';
  const before=oldSheet.querySelector(selector),after=fresh?.querySelector(selector);
  if(!before||!after){$('paper').replaceChildren(oldSheet);return false}
  if(index!==null){
   const slot='[data-greek-choice-slot="'+kind+':'+index+'"]';
   const oldRow=before.querySelector(slot),newRow=after.querySelector(slot);
   if(!oldRow||!newRow){$('paper').replaceChildren(oldSheet);return false}
   oldRow.replaceWith(newRow);
  }else{
   const oldLetter=before.querySelector(':scope > .greek-choice-subquestion .exam-letter');
   const newLetter=after.querySelector(':scope > .greek-choice-subquestion .exam-letter');
   if(oldLetter&&newLetter)newLetter.textContent=oldLetter.textContent;
   before.replaceWith(after);
  }
  $('paper').replaceChildren(oldSheet);
  if($('model').value==='complete')greekExamControls();else refreshManualMorphWords();
  window.greekLastPreview=$('paper').innerHTML;refreshCustomRows();
  return true;
 }
 const menuLabels={
  decl:'1.a · Tablas para declinar',forms:'1.b · Análisis morfológico',
  verb:'1.e · Conjugación de verbos',etymology:'2.a · Derivación etimológica',
  sent:'3 · Análisis y traducción de oraciones'
 };
 const extras=[
  {key:'number',kind:'change-number',title:'1.c · Cambio de número'},
  {key:'retro',kind:'retroversion',title:'1.d · Retroversión'},
  {key:'roots',kind:'roots',title:'2.b · Étimos de palabras subrayadas'}
 ];
 function menuBox(config){
  const detail=document.createElement('details');detail.className='exam-question-panel';
  detail.dataset.greekCustom=config.key;detail.dataset.question=config.kind;
  const summary=document.createElement('summary');summary.className='exam-question-heading';
  const check=document.createElement('input');check.type='checkbox';check.className='exam-question-toggle';
  check.checked=included(config.key);check.setAttribute('aria-label','Incluir '+config.title);
  check.onclick=event=>event.stopPropagation();
  const name=document.createElement('span');name.className='exam-question-name';name.textContent=config.title;
  const status=document.createElement('span');status.className='exam-question-status';
  status.textContent=check.checked?'Incluida':'Omitida';
  summary.append(check,name,status);detail.append(summary);
  detail.dataset.included=String(check.checked);
  check.onchange=()=>{
   flags[$('model').value][config.key]=check.checked;save();
   detail.dataset.included=String(check.checked);
   status.textContent=check.checked?'Incluida':'Omitida';
   generateGreekExam();refreshCustomRows();
  };
  const body=document.createElement('div');body.className='exam-question-config';detail.append(body);
  if(config.key!=='roots'){
   const count=document.createElement('input');count.type='number';count.min='1';count.max='20';
   count.dataset.greekCustomCount=config.key;
   count.value=APIs[config.key]()?.state().quantity||4;
   const field=document.createElement('label');field.textContent='Número de sintagmas ';field.append(count);
   body.append(field);
   count.onchange=()=>{
    const api=APIs[config.key](),previous=api.state().quantity;
    api.setCount(count.value);
    // Evitar reconstrucción duplicada al perder el foco: un clic posterior
    // no puede cancelarse porque el botón se haya sustituido en pleno mousedown.
    if(api.state().quantity===previous)return;
    for(const key of [...edits.keys()])if(key.startsWith(config.kind+':'))edits.delete(key);
    generateGreekExam();refreshCustomRows();
   };
  }
  const regenerate=document.createElement('button');regenerate.type='button';
  regenerate.className='secondary';regenerate.textContent='Regenerar esta alternativa';
  regenerate.onclick=()=>{
   if(!replaceGenerated(config.kind))regenerate.title='No hay nuevos elementos disponibles para las unidades marcadas.';
  };
  body.append(regenerate);
  const rows=document.createElement('div');rows.className='greek-choice-editor-rows';rows.dataset.greekEditor=config.kind;
  body.append(rows);
  return detail;
 }
 function refreshCustomRows(){
  if(!onlyGreek())return;
  for(const config of extras){
   const editor=document.querySelector('[data-greek-editor="'+config.kind+'"]');
   if(!editor)continue;
   editor.replaceChildren();
   const items=[...$('paper').querySelectorAll('[data-greek-choice-slot^="'+config.kind+':"]')];
   if(config.kind==='roots'){
    const current=APIs.roots()?.current();
    const note=document.createElement('p');note.className='hint';
    note.textContent=current?'Étimos: '+current.roots.map(x=>x.join(' + ')).join(' / '):
     'No hay oraciones válidas con los étimos de las unidades seleccionadas.';
    editor.append(note);
   }
   for(const [i,node] of items.entries()){
    const slot=config.kind+':'+i;
    const label=document.createElement('label');label.className='exam-word-editor';
    label.textContent='Elemento '+(i+1)+' (editable) ';
    const input=document.createElement('input');input.type='text';
    input.dataset.greekCustomEdit=slot;
    input.value=node.textContent.replace(/^\s*\d+\.\s*/,'').trim();
    input.addEventListener('input',()=>{
     edits.set(slot,input.value);
     const target=$('paper').querySelector('[data-greek-choice-slot="'+slot+'"]');
     if(target){
      if(config.kind==='roots')target.textContent=input.value;
      else{const letter=target.querySelector('.exam-letter');target.replaceChildren(letter,' '+input.value)}
      window.greekLastPreview=$('paper').innerHTML;
      if(typeof warnExamManualSolution==='function')warnExamManualSolution();
     }
    });
    label.append(input);editor.append(label);
    if(config.kind!=='roots'){
     const single=document.createElement('button');single.type='button';
     single.className='secondary';single.textContent='Cambiar solo este sintagma';
     single.setAttribute('aria-label','Regenerar sintagma '+(i+1)+' de '+config.title);
     // Delegación estable: el inspector puede reconstruir el menú durante
     // los cambios de puntuación sin invalidar el manejador del botón.
     single.dataset.greekChoiceSingle=config.kind+':'+i;
     editor.append(single);
    }
   }
  }
 }
 let installing=false;
 function ensureMenu(){
  if(installing)return;installing=true;
  try{
   const host=$('examQuestionMenus');if(!host)return;
   if(!onlyGreek()){
    host.querySelectorAll('[data-greek-custom]').forEach(x=>x.remove());
    $('greekPointsGrid').hidden=false;$('greekPointsLabel').hidden=false;
    return;
   }
   $('greekPointsGrid').hidden=true;$('greekPointsLabel').hidden=true;
   for(const [kind,name] of Object.entries(menuLabels)){
    const x=host.querySelector('[data-question="'+kind+'"] .exam-question-name');
    if(x)x.textContent=name;
   }
   for(const config of extras)
    if(!host.querySelector('[data-greek-custom="'+config.key+'"]'))host.append(menuBox(config));
   const order=['decl','forms','change-number','retroversion','verb','etymology','roots','sent'];
   const panels=order.map(k=>host.querySelector(':scope > [data-question="'+k+'"]')).filter(Boolean);
   // Comparar solo paneles gestionados: los nodos auxiliares del menú
   // no cuentan como preguntas. Evitar un bucle de MutationObserver
   // que reconstruía controles antes de que el clic llegase al botón.
   const visibleOrder=[...host.children].filter(node=>panels.includes(node));
   if(panels.some((node,i)=>visibleOrder[i]!==node))
    panels.forEach(node=>host.append(node));
   refreshCustomRows();
  }finally{installing=false}
 }
 let menuQueued=false;
 const menuHost=$('examQuestionMenus');
 if(menuHost)new MutationObserver(()=>{
  if(menuQueued)return;menuQueued=true;
  queueMicrotask(()=>{menuQueued=false;ensureMenu()});
 }).observe(menuHost,{childList:true});
 for(const id of ['course','model','lang'])$(id)?.addEventListener('change',()=>queueMicrotask(ensureMenu));
 document.addEventListener('change',event=>{
  if(event.target?.matches?.('#unitChoices .unit-choice'))queueMicrotask(ensureMenu);
 });
 $('paper')?.addEventListener('input',event=>{
  if(!onlyGreek())return;
  const row=event.target?.closest?.('[data-greek-choice-slot]');if(!row)return;
  const slot=row.dataset.greekChoiceSlot;
  edits.set(slot,row.textContent.replace(/^\s*\d+\.\s*/,'').trim());
  const input=document.querySelector('[data-greek-custom-edit="'+slot+'"]');
  if(input)input.value=edits.get(slot);
 });
 // El inspector y el sistema de notas pueden rehacer filas del menú.
 // Resolver la acción desde un controlador permanente, no desde nodos efímeros.
 document.addEventListener('click',event=>{
  const button=event.target?.closest?.('[data-greek-choice-single]');
  if(!button||!onlyGreek())return;
  const match=/^([^:]+):(\d+)$/.exec(button.dataset.greekChoiceSingle||'');
  if(!match)return;
  event.preventDefault();
  if(!replaceGenerated(match[1],Number(match[2])))
   button.title='Banco agotado: no se ha modificado la pregunta.';
 },true);
 const style=document.createElement('style');style.id='greek-choice-group-styles';
 style.textContent='.paper .greek-choice-option{margin:0 0 8pt 0;break-inside:auto}'+
  '.paper .greek-choice-subquestion{margin-top:8pt;font-weight:normal}'+
  '.paper .greek-choice-option .exam-paradigm{margin-bottom:7pt}'+
  '.paper .greek-choice-option > .exam-item + .exam-item{margin-top:4pt}'+
  '.paper .greek-choice-etym-sentence u{text-decoration:underline;text-underline-offset:2px}';
 document.head.append(style);
 window.ExaminaGreekChoiceGroups={active:onlyGreek,regroup,replaceGenerated,ensureMenu,flags};
 document.addEventListener('DOMContentLoaded',()=>{
  ensureMenu();
  if(onlyGreek())generateGreekExam();
 },{once:true});
})();
