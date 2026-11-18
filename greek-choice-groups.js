/* Griego I: dos bloques de competencias y traducción. No interviene
 * en la generación de exámenes de morfología ni en los cursos de latín.
 * Los datos nuevos viven en los tres bancos greek-choice-*.js. */
(function(){
 'use strict';
 const onlyGreek=()=>currentCourse()==='greek1'&&$('model').value==='complete';
 // No propagar el paradigma oxítono heredado de ὀλιγός: el lema es
 // ὀλίγος. Acotar la exclusión a los modelos de esta integración para
 // conservar intacto el modelo de morfología solicitado por el docente.
 const previousAdjectives=greekAvailableSyntagmAdjectives;
 greekAvailableSyntagmAdjectives=function(limit){
  const pool=previousAdjectives(limit);
  return onlyGreek()?pool.filter(x=>greekBankKey(x.lemma)!=='ολιγοσ'):pool;
 };
 const t=(es,va)=>$('lang').value==='va'?va:es;
 const numerals={es:['cero','una','dos','tres','cuatro','cinco'],
  va:['zero','una','dos','tres','quatre','cinc']};
 const num=n=>numerals[$('lang').value][n]||String(n);
 const storeKey='examina_greek_choice_options_v1';
 let flags={complete:{number:true,retro:true,roots:true}};
 try{
  const old=JSON.parse(localStorage.getItem(storeKey)||'{}');
  for(const mode of ['complete'])
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
  declension:['Declina.','Declina.'],
  forms:['Análisis morfológico.','Anàlisi morfològica.'],
  conjugation:['Conjugación de verbos.','Conjugació de verbs.'],
  etymology:['Escribe al menos dos derivados etimológicos a partir de los siguientes términos griegos.',
    'Escriu almenys dos derivats etimològics a partir dels termes grecs següents.'],
  'change-number':['Pasa a singular o a plural estos sintagmas.','Passa a singular o a plural estos sintagmes.'],
  retroversion:['Traduce al griego los siguientes sintagmas; usa el nominativo salvo que haya preposición.','Traduïx al grec els sintagmes següents; usa el nominatiu llevat que hi haja preposició.'],
  roots:['Escribe los étimos griegos de los que derivan las palabras subrayadas en esta oración.',
    'Escriu els ètims grecs dels quals deriven les paraules subratllades en esta oració.']
 };
 const label=kind=>t(...labels[kind]);
 // Numeración real del tercer nivel: i., ii., iii.… (sin viñetas).
 // El marcador reside en el DOM y se exporta igual a Word y PDF.
 function roman(n){
  const symbols=[[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']];
  let out='';
  for(const [value,glyph] of symbols)while(n>=value){out+=glyph;n-=value}
  return out;
 }
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
   const text=item.prompt;
   row.innerHTML='<span class="exam-letter greek-choice-item-marker">'+roman(i+1)+'.</span> '+esc(edits.has(slot)?edits.get(slot):text);
   box.append(row);
  });
  return box;
 }
 function editedRoots(item,text){
  if(!item)return esc(text);
  const matches=item.sentence.filter((_,i)=>i%2).map(word=>({word,start:text.indexOf(word)}));
  if(matches.some(x=>x.start<0))return esc(text);
  matches.sort((a,b)=>a.start-b.start);
  let end=0,out='';
  for(const match of matches){
   if(match.start<end)return esc(text);
   out+=esc(text.slice(end,match.start))+'<u>'+esc(match.word)+'</u>';
   end=match.start+match.word.length;
  }
  return out+esc(text.slice(end));
 }
 function rootsOption(item){
  if(!item)return null;
  const box=document.createElement('section');box.className='greek-choice-option';box.dataset.greekOption='roots';
  box.append(subtitle('roots','a',label('roots')));
  const p=document.createElement('p');p.className='exam-item greek-choice-etym-sentence';
  p.dataset.greekChoiceSlot='roots:0';
  p.innerHTML=edits.has('roots:0')?editedRoots(item,edits.get('roots:0')):window.ExaminaGreekEtymSentence.render(item);
  box.append(p);return box;
 }
 // El cambio de número evalúa la flexión, no la memoria léxica.
 // Mostrar los enunciados de los paradigmas ya seleccionados, nunca la respuesta.
 function numberGlossaryLemmas(){
  const rows=APIs.number()?.current()||[];
  const nouns=new Map(greekVerifiedCorpus.filter(x=>x.kind==='declension').map(x=>[x.id,x]));
  const adjectives=greekAvailableSyntagmAdjectives(greekLimit());
  const result=new Set();
  if(rows.length)result.add('ὁ, ἡ, τό');
  for(const row of rows){
   const noun=nouns.get(row.source);
   if(noun){
    const entry=greekNominalEnunciation(noun);
    if(entry)result.add(entry);
   }
   if(row.adjective&&noun){
    const modifier=adjectives.find(x=>x.lemma===row.adjective);
    const parts=modifier?greekSyntagmEnunciation(noun,modifier).split(' + '):[];
    result.add(parts[1]||row.adjective);
   }
   if(row.pronoun==='αὐτός')result.add('αὐτός, αὐτή, αὐτό');
  }
  return [...result].filter(Boolean);
 }
 function refreshNumberGlossary(sheet){
  if(!sheet||!sheet.classList.contains('greek-choice-complete-exam'))return;
  // Migrar cualquier glosario heredado: el examen tiene ahora UN único bloque
  // de vocabulario (el de oraciones), también para el cambio de número.
  sheet.querySelector(':scope > #greekNumberGlossary')?.remove();
  let panel=sheet.querySelector(':scope > #examSentenceGlossary');
  panel?.querySelectorAll('[data-greek-number-entry]').forEach(item=>item.remove());
  const allowed=$('autoGloss')?.checked!==false&&included('number')&&
   !!sheet.querySelector(':scope > .greek-choice-option[data-greek-option="change-number"]');
  if(!allowed)return;
  if(!panel){
   panel=document.createElement('div');panel.id='examSentenceGlossary';
   panel.contentEditable='false';
   sheet.querySelector(':scope > #answerkey')?.before(panel);
  }
  let final=panel.querySelector(':scope > .final-gloss');
  const known=new Set([...panel.querySelectorAll('.gloss-item')].map(
   x=>normLex(headLex(x.textContent))));
  const terms=numberGlossaryLemmas().filter(entry=>!known.has(normLex(headLex(entry))));
  if(!terms.length)return;
  if(!final){
   if(!panel.querySelector(':scope > .exam-gloss-title')){
    const heading=document.createElement('p');heading.className='exam-gloss-title';
    const strong=document.createElement('strong');
    strong.textContent=t('Vocabulario','Vocabulari');heading.append(strong);
    panel.prepend(heading);
   }
   final=document.createElement('div');final.className='final-gloss';panel.append(final);
  }
  for(const entry of terms){
   const item=document.createElement('div');
   item.className='gloss-item';item.dataset.greekNumberEntry='1';
   item.textContent=entry;
   final.append(item);
  }
 }
 function itemText(node){
  const copy=node.cloneNode(true);copy.querySelector(':scope > .exam-letter')?.remove();
  return copy.textContent.replace(/^\s*\d+\.\s*/,'').trim();
 }
 function decorateItems(sheet){
  sheet.classList.add('greek-choice-complete-exam');
  for(const option of sheet.querySelectorAll('.greek-choice-option')){
   option.dataset.greekChoiceGroup=['etymology','roots'].includes(option.dataset.greekOption)
    ?'greek-plurilingual':'greek-competence';
   let index=0;
   for(const item of option.querySelectorAll('.exam-form,.exam-etymology [data-corpus-id],.greek-choice-generated-item')){
    let marker=item.querySelector(':scope > .exam-letter');
    if(!marker){
     const first=item.firstChild;
     if(first?.nodeType===3)first.textContent=first.textContent.replace(/^\s*(?:[a-z]\.|\d+\.|[ivxlcdm]+\.|◦)\s*/iu,'');
     marker=document.createElement('span');marker.className='exam-letter';item.prepend(marker,' ');
    }
    marker.textContent=roman(++index)+'.';
    marker.classList.add('greek-choice-item-marker','greek-choice-roman-marker');
    if(item.dataset.greekChoiceSlot?.startsWith('change-number:'))
     for(const node of item.childNodes)if(node.nodeType===3)
      node.textContent=node.textContent.replace(/^(\s*)A (?:singular|plural):\s*/iu,'$1');
   }
  }
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
   morph.forEach(x=>{x.dataset.greekChoiceGroup='greek-competence';frag.append(x)});
  }
  if(etym.length){
   renumber(etym);frag.append(heading('greek-plurilingual',++currentNumber,choiceTitle(etym.length,2)));
   etym.forEach(x=>{x.dataset.greekChoiceGroup='greek-plurilingual';frag.append(x)});
  }
  if(parts.sentences?.length){
   const sentences=parts.sentences.slice(),q=sentences[0];
   q.querySelector('.exam-q-number').textContent=(++currentNumber)+'.';
   delete q.dataset.examKind; // Conservar la identidad griega y sus ajustes de espaciado.
   frag.append(...sentences);
  }
  const anchor=sheet.querySelector(':scope > #examSentenceGlossary')||sheet.querySelector(':scope > #answerkey');
  if(anchor)sheet.insertBefore(frag,anchor);else sheet.append(frag);
  decorateItems(sheet);
  refreshNumberGlossary(sheet);
  syncExtraAnswers(sheet);
  // El motor aplica ajustes antes del reagrupamiento. Recalcular las reglas
  // sobre los títulos definitivos 1, 2 y 3 evita perder espaciados al cambiar
  // unidad, regenerar un apartado o recuperar un borrador.
  applyExamVisualFormat();
  window.greekLastPreview=$('paper').innerHTML;
  if(window.greekLastExam)window.greekLastExam.grouped=true;
 }
 // Las tres actividades nuevas se exportan también en la clave Word.
 function syncExtraAnswers(sheet,onlyKind=null,index=null){
  const key=sheet.querySelector('#answerkey');if(!key)return;
  const specs=[['change-number',APIs.number(),included('number')],
   ['retroversion',APIs.retro(),included('retro')],['roots',APIs.roots(),included('roots')]];
  for(const [kind,api,enabled] of specs){
   if(onlyKind&&kind!==onlyKind)continue;
   let section=key.querySelector('[data-greek-extra-answer="'+kind+'"]');
   if(!enabled||!sheet.querySelector('[data-greek-option="'+kind+'"]')){section?.remove();continue}
   if(!section){section=document.createElement('section');section.dataset.greekExtraAnswer=kind;key.append(section)}
   const items=kind==='roots'?[api.current()].filter(Boolean):api.current();
   const answerRow=(item,i)=>{
    const p=document.createElement('p');p.dataset.greekAnswerSlot=kind+':'+i;
    p.textContent=kind==='roots'?item.sentence.filter((_,i)=>i%2).map((word,i)=>word+' — '+APIs.roots().answerRoots(item)[i]).join('; '):
     (i+1)+'. '+item.prompt+' — '+item.answer;
    return p;
   };
   if(index!==null){
    const old=section.querySelector('[data-greek-answer-slot="'+kind+':'+index+'"]');
    if(old&&items[index])old.replaceWith(answerRow(items[index],index));
   }else{
    const h=document.createElement('h3');h.textContent=label(kind);
    section.replaceChildren(h,...items.map(answerRow));
   }
  }
 }
 // El glosario de oraciones se recalcula al editar; evitar duplicidades
 // con el bloque de enunciados del cambio de número en esa misma operación.
 const previousSentenceGlossaryRefresh=refreshSentenceGlossary;
 refreshSentenceGlossary=function(...args){
  if(onlyGreek()){
   // Evitar reconstruir el glosario ordinario solo porque contenga los lemas
   // adicionales de cambio de número: sus selectores docentes conservan foco.
   $('examSentenceGlossary')?.querySelectorAll('[data-greek-number-entry]')
    .forEach(el=>el.remove());
  }
  const result=previousSentenceGlossaryRefresh(...args);
  if(onlyGreek())refreshNumberGlossary($('paper').querySelector('.exam-sheet'));
  return result;
 };
 // Word y PDF llaman al cierre sincronizado registrado antes de instalar
 // esta extensión: apuntarlo al glosario unificado, no a la versión antigua.
 window.ExaminaFlushSentenceGlossary=refreshSentenceGlossary;
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
  const pool=greekChoicePool(kind),candidates=pool.filter(x=>!ids.includes(x.id));
  // Esta presentación por alternativas sustituye al regenerador principal:
  // debe mantener también las cuatro cuotas docentes de análisis morfológico.
  const quotaForms=kind==='forms'&&examMorphQuotasActive();
  if(!quotaForms&&candidates.length<ids.length)return false;
  const next=quotaForms?examQuotaGreek(pool,ids.length,ids):
   greekCurricularSample(candidates,ids.length);
  if(next.length!==ids.length)return false;
  const before=ids.slice(),previousAdjectives=greekExamState.adjectiveChoices?
   {...greekExamState.adjectiveChoices}:undefined;
  greekExamState.ids[kind]=next.map(x=>x.id);
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
   while(n&&n.tagName!=='H3'&&!n.matches('[data-greek-extra-answer]')){oldNodes.push(n);n=n.nextElementSibling}
   n=newH.nextElementSibling;
   while(n&&n.tagName!=='H3'&&!n.matches('[data-greek-extra-answer]')){newNodes.push(n);n=n.nextElementSibling}
   oldH.before(...newNodes);oldNodes.forEach(node=>node.remove());
  }
  $('paper').replaceChildren(oldSheet);
  if($('model').value==='complete')greekExamControls();else refreshManualMorphWords();
  window.greekLastPreview=$('paper').innerHTML;refreshCustomRows();
  return true;
 };
 function replaceGenerated(kind,index=null,regenerate=true){
  if(!onlyGreek())return false;
  const api=kind==='change-number'?APIs.number():kind==='retroversion'?APIs.retro():APIs.roots();
  const oldSheet=$('paper').querySelector('.exam-sheet');if(!api||!oldSheet)return false;
  const result=!regenerate?api.current():kind==='roots'?api.regenerate():index===null?api.regenerateAll():api.regenerateOne(index);
  if(!result)return false;
  if(index!==null)edits.delete(kind+':'+index);
  else for(const slot of [...edits.keys()])if(slot.startsWith(kind+':'))edits.delete(slot);
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
  syncExtraAnswers(oldSheet,kind,index);
  if(kind==='change-number')refreshNumberGlossary(oldSheet);
  $('paper').replaceChildren(oldSheet);
  if($('model').value==='complete')greekExamControls();else refreshManualMorphWords();
  window.greekLastPreview=$('paper').innerHTML;refreshCustomRows();
  return true;
 }
 const menuLabels={
  decl:'1.a · Declina',forms:'1.b · Análisis morfológico',
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
    replaceGenerated(config.kind,null,false);
   };
  }
  const regenerate=document.createElement('button');regenerate.type='button';
  regenerate.className='secondary exam-regenerate-question';regenerate.textContent='Regenerar esta alternativa';
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
    note.textContent=current?'Étimos: '+APIs.roots().answerRoots(current).join(' ; '):
     'No hay oraciones válidas con los étimos de las unidades seleccionadas.';
    editor.append(note);
   }
   for(const [i,node] of items.entries()){
    const slot=config.kind+':'+i;
    const row=document.createElement('div');row.className='exam-word-editor';
    const label=document.createElement('label');label.textContent='Elemento '+(i+1);
    const input=document.createElement('input');input.type='text';
    input.dataset.greekCustomEdit=slot;
    input.value=itemText(node);
    input.addEventListener('input',()=>{
     edits.set(slot,input.value);
     const target=$('paper').querySelector('[data-greek-choice-slot="'+slot+'"]');
     if(target){
      if(config.kind==='roots')target.innerHTML=editedRoots(APIs.roots().current(),input.value);
      else{const letter=target.querySelector('.exam-letter');target.replaceChildren(letter,' '+input.value)}
      window.greekLastPreview=$('paper').innerHTML;
      if(typeof warnExamManualSolution==='function')warnExamManualSolution();
     }
    });
    label.append(input);row.append(label);editor.append(row);
    if(config.kind!=='roots'){
     const single=document.createElement('button');single.type='button';
     single.className='secondary exam-regenerate-word';
     single.title='Cambiar solo este sintagma';
     single.textContent=$('lang').value==='va'?'Una altra':'Otra';
     single.setAttribute('aria-label','Regenerar sintagma '+(i+1)+' de '+config.title);
     // Delegación estable: el inspector puede reconstruir el menú durante
     // los cambios de puntuación sin invalidar el manejador del botón.
     single.dataset.greekChoiceSingle=config.kind+':'+i;
     row.append(single);
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
   for(const config of extras){
    const panel=host.querySelector('[data-greek-custom="'+config.key+'"]');
    const check=panel?.querySelector('.exam-question-toggle');
    if(check){check.checked=included(config.key);panel.dataset.included=String(check.checked);
     panel.querySelector('.exam-question-status').textContent=check.checked?'Incluida':'Omitida'}
    const count=panel?.querySelector('[data-greek-custom-count]');
    if(count)count.value=APIs[config.key]().state().quantity;
   }
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
  if(event.target?.matches?.('#autoGloss'))queueMicrotask(()=>
   refreshNumberGlossary($('paper').querySelector('.exam-sheet')));
 });
 $('paper')?.addEventListener('input',event=>{
  if(!onlyGreek())return;
  const row=event.target?.closest?.('[data-greek-choice-slot]');if(!row)return;
  const slot=row.dataset.greekChoiceSlot;
  edits.set(slot,itemText(row));
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
  '.paper .greek-choice-subquestion{margin-top:8pt;font-weight:normal;break-after:avoid}'+
  '.paper .greek-choice-option .exam-paradigm{margin-bottom:7pt}'+
  // Dos puntos entre el enunciado de declinación o conjugación y su primera tabla.
  '.paper .greek-choice-option[data-greek-option="declension"] > p.greek-choice-subquestion + table.exam-paradigm,'+
  '.paper .greek-choice-option[data-greek-option="conjugation"] > p.greek-choice-subquestion + table.exam-paradigm{margin-top:2pt!important}'+
  '.paper .greek-choice-option > .exam-item + .exam-item{margin-top:4pt}'+
  '.paper .greek-choice-option .exam-etymology{display:grid;grid-template-columns:1fr;row-gap:4pt}'+
  '.paper .greek-choice-option .exam-etymology>[data-corpus-id]{display:block;width:auto;margin:0}'+
  '.paper .greek-choice-etym-sentence u{text-decoration:underline;text-underline-offset:2px}'+
  '.paper .greek-number-glossary{margin:8pt 0 0;break-inside:auto}'+
  '.paper .greek-number-glossary .exam-gloss-title{margin-bottom:4pt}'+
  '.paper .greek-number-glossary .greek-number-lexicon{columns:2;column-gap:24pt}';
 document.head.append(style);
 function snapshotChoices(){
  return {flags:{...flags[$('model').value]},number:APIs.number().state(),
   retro:APIs.retro().state(),roots:APIs.roots().state()};
 }
 function restoreChoices(draft){
  if(!onlyGreek())return;
  const data=draft.greekChoices;
  if(data&&typeof data==='object'){
   for(const key of ['number','retro','roots']){
    if(typeof data.flags?.[key]==='boolean')flags[$('model').value][key]=data.flags[key];
    APIs[key]().restore(data[key]);
   }
   save();
  }
  lastScope=scopeKey();edits.clear();
  decorateItems($('paper'));
  refreshNumberGlossary($('paper').querySelector('.exam-sheet'));
  for(const row of $('paper').querySelectorAll('[data-greek-choice-slot]'))
   edits.set(row.dataset.greekChoiceSlot,itemText(row));
  ensureMenu();
 };
 window.ExaminaGreekChoiceGroups={active:onlyGreek,regroup,replaceGenerated,ensureMenu,flags,snapshot:snapshotChoices,restore:restoreChoices};
 document.addEventListener('DOMContentLoaded',()=>{
  ensureMenu();
  if(onlyGreek())generateGreekExam();
 },{once:true});
})();
