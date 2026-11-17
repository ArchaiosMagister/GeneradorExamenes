/* Griego I: competencias con alternativas. No modifica los motores de morfología
 * ni el generador de Latín. Las extensiones c, d y 2b se incorporan por etapas. */
(function(){
 'use strict';
 const onlyGreek=()=>currentCourse()==='greek1'&&['complete','translation'].includes($('model').value);
 const t=(es,va)=>$('lang').value==='va'?va:es;
 const words={es:['cero','una','dos','tres','cuatro','cinco'],
              va:['zero','una','dos','tres','quatre','cinc']};
 const word=n=>words[$('lang').value][n]||String(n);
 const previousAvailability=examQuestionAvailable;
 examQuestionAvailable=function(kind){
  if(currentCourse()==='greek1'&&['complete','translation'].includes($('model').value)){
   if(kind==='pronouns')return false;
   if(['decl','verb','forms','etymology','sent'].includes(kind))return true;
  }
  return previousAvailability(kind);
 };
 // Los dos modelos conservan sus propias preguntas y su selección de unidades.
 // El tipo traducción puede proponer también alternativas de morfología.
 greekModes.translation.points=[1,1,1,0,1,6];

 const variants={
  declension:[t('Tablas para declinar.','Taules per a declinar.'),'a'],
  forms:[t('Análisis morfológico.','Anàlisi morfològica.'),'b'],
  conjugation:[t('Conjugación de verbos.','Conjugació de verbs.'),'e'],
  etymology:[t('Escribe al menos dos derivados etimológicos a partir de los siguientes términos griegos.',
                'Escriu almenys dos derivats etimològics a partir dels termes grecs següents.'),'a']
 };
 function subtitle(kind,letter,raw){
  const node=document.createElement('p');
  node.className='exam-item greek-choice-subquestion';
  node.dataset.greekKind=kind;
  node.innerHTML='<span class="exam-letter">'+letter+'.</span> <strong>'+esc(raw)+'</strong>';
  return node;
 }
 function heading(kind,number,title){
  const p=document.createElement('p');
  p.className='exam-question';
  p.dataset.examKind=kind;
  p.innerHTML='<strong><span class="exam-q-number">'+number+'.</span> '+esc(title)+'</strong>';
  return p;
 }
 function choiceTitle(n,group){
  if(group===1){
   if(n>3)return t('Comprensión morfosintáctica. Elige tres de estas '+word(n)+' preguntas.',
     'Comprensió morfosintàctica. Tria tres d’estes '+word(n)+' preguntes.');
   if(n===3)return t('Comprensión morfosintáctica. Responde a las tres preguntas siguientes.',
     'Comprensió morfosintàctica. Respon a les tres preguntes següents.');
   if(n===2)return t('Comprensión morfosintáctica. Responde a las dos preguntas siguientes.',
     'Comprensió morfosintàctica. Respon a les dos preguntes següents.');
   return t('Comprensión morfosintáctica. Responde a la siguiente pregunta.',
     'Comprensió morfosintàctica. Respon a la pregunta següent.');
  }
  return n>=2?t('Plurilingüismo. Elige una de estas dos preguntas.',
    'Plurilingüisme. Tria una d’estes dos preguntes.'):
    t('Plurilingüismo. Responde a la siguiente pregunta.',
      'Plurilingüisme. Respon a la pregunta següent.');
 }
 function grab(sheet,kind){
  const h=[...sheet.children].find(n=>n.classList?.contains('exam-question')&&n.dataset.greekKind===kind);
  if(!h)return null;
  const nodes=[h];
  let next=h.nextElementSibling;
  while(next&&!next.classList.contains('exam-question')&&next.id!=='answerkey'&&
        next.id!=='examSentenceGlossary'&&!next.classList.contains('final-gloss')){
   nodes.push(next);next=next.nextElementSibling;
  }
  nodes.forEach(n=>n.remove());
  return nodes;
 }
 function option(kind,letter,nodes){
  if(!nodes)return null;
  const box=document.createElement('section');box.className='greek-choice-option';box.dataset.greekOption=kind;
  const title=t(
   ({declension:'Tablas para declinar.',forms:'Análisis morfológico.',conjugation:'Conjugación de verbos.',
     etymology:'Escribe al menos dos derivados etimológicos a partir de los siguientes términos griegos.'})[kind],
   ({declension:'Taules per a declinar.',forms:'Anàlisi morfològica.',conjugation:'Conjugació de verbs.',
     etymology:'Escriu almenys dos derivats etimològics a partir dels termes grecs següents.'})[kind]);
  box.append(subtitle(kind,letter,title),...nodes.slice(1));
  return box;
 }
 function regroup(){
  const sheet=$('paper').querySelector('.exam-sheet');if(!sheet)return;
  const parts={};
  for(const kind of ['declension','conjugation','forms','pronouns','etymology','sentences'])
   parts[kind]=grab(sheet,kind);
  if(!parts.sentences)return;
  const morph=[['declension','a'],['forms','b'],['conjugation','e']]
   .map(([kind,letter])=>option(kind,letter,parts[kind])).filter(Boolean);
  const numberApi=window.ExaminaGreekNumber;
  const numberItems=numberApi&&greekMarkedUnits().length?numberApi.current():[];
  if(numberItems.length){
   const box=document.createElement('section');box.className='greek-choice-option';box.dataset.greekOption='change-number';
   box.append(subtitle('change-number','c',t('Pasa a singular o a plural estos sintagmas.',
    'Passa a singular o a plural estos sintagmes.')));
   numberItems.forEach((item,i)=>{
    const row=document.createElement('p');row.className='exam-item greek-choice-number-item';
    row.dataset.greekChoiceSlot='change-number:'+i;
    row.innerHTML='<span class="exam-letter">'+(i+1)+'.</span> '+esc(
     (item.direction==='singular'?t('A singular: ','A singular: '):t('A plural: ','A plural: '))+item.prompt);
    box.append(row);
   });
   morph.splice(2,0,box);
  }
  const retroApi=window.ExaminaGreekRetroversion;
  const retroItems=retroApi&&greekMarkedUnits().length?retroApi.current():[];
  if(retroItems.length){
   const box=document.createElement('section');box.className='greek-choice-option';box.dataset.greekOption='retroversion';
   box.append(subtitle('retroversion','d',t('Traduce al griego los siguientes sintagmas.',
    'Traduïx al grec els sintagmes següents.')));
   retroItems.forEach((item,i)=>{
    const row=document.createElement('p');row.className='exam-item greek-choice-retroversion-item';
    row.dataset.greekChoiceSlot='retroversion:'+i;
    row.innerHTML='<span class="exam-letter">'+(i+1)+'.</span> '+esc(item.prompt);
    box.append(row);
   });
   morph.splice(morph.findIndex(x=>x.dataset.greekOption==='conjugation'),0,box);
  }
  const etym=[option('etymology','a',parts.etymology)].filter(Boolean);
  const frag=document.createDocumentFragment();
  if(morph.length){frag.append(heading('greek-competence',1,choiceTitle(morph.length,1)));morph.forEach(x=>frag.append(x))}
  if(etym.length){frag.append(heading('greek-plurilingual',2,choiceTitle(etym.length,2)));etym.forEach(x=>frag.append(x))}
  const sent=parts.sentences;
  if(sent&&sent.length){
   const h=sent.shift();h.querySelector('.exam-q-number').textContent='3.';
   h.dataset.examKind='sent';delete h.dataset.greekKind;
   frag.append(h,...sent);
  }
  const anchor=sheet.querySelector(':scope > #examSentenceGlossary')||sheet.querySelector(':scope > #answerkey');
  if(anchor)sheet.insertBefore(frag,anchor);else sheet.append(frag);
  window.greekLastPreview=$('paper').innerHTML;
  if(window.greekLastExam)window.greekLastExam.grouped=true;
 }
 const previousGenerate=generateGreekExam;
 generateGreekExam=function(){
  previousGenerate();
  if(onlyGreek()&&greekMarkedUnits().length)regroup();
 };
 // Regeneración de una alternativa existente sin reconstruir el resto del borrador.
 const previousRegenerate=greekRegenerate;
 greekRegenerate=function(kind){
  if(!onlyGreek())return previousRegenerate(kind);
  if(!['declension','forms','conjugation','etymology'].includes(kind))return false;
  const ids=greekExamState?.ids?.[kind],oldSheet=$('paper').querySelector('.exam-sheet');
  if(!ids?.length||!oldSheet)return false;
  const candidates=greekChoicePool(kind).filter(x=>!ids.includes(x.id));
  if(candidates.length<ids.length)return false;
  const before=ids.slice(),previousAdjectives=greekExamState.adjectiveChoices;
  greekExamState.ids[kind]=greekCurricularSample(candidates,ids.length).map(x=>x.id);
  if(kind==='declension')greekExamState.adjectiveChoices={};
  generateGreekExam();
  const fresh=$('paper').querySelector('.exam-sheet');
  const selector='.greek-choice-option[data-greek-option="'+kind+'"]';
  const oldPart=oldSheet.querySelector(selector),newPart=fresh?.querySelector(selector);
  if(!oldPart||!newPart){
   greekExamState.ids[kind]=before;greekExamState.adjectiveChoices=previousAdjectives;
   $('paper').replaceChildren(oldSheet);refreshManualMorphWords();return false;
  }
  oldPart.replaceWith(newPart);
  const oldAnswers=oldSheet.querySelector('#answerkey'),newAnswers=fresh.querySelector('#answerkey');
  const oldHeading=oldAnswers?.querySelector('h3[data-greek-kind="'+kind+'"]');
  const newHeading=newAnswers?.querySelector('h3[data-greek-kind="'+kind+'"]');
  if(oldHeading&&newHeading){
   const remove=[oldHeading];let node=oldHeading.nextElementSibling;
   while(node&&node.tagName!=='H3'){remove.push(node);node=node.nextElementSibling}
   oldHeading.before(newHeading,...(function(){
    const items=[];let n=newHeading.nextElementSibling;
    while(n&&n.tagName!=='H3'){items.push(n);n=n.nextElementSibling}
    return items;
   })());remove.forEach(n=>n.remove());
  }
  $('paper').replaceChildren(oldSheet);
  if($('model').value==='complete')greekExamControls();
  else refreshManualMorphWords();
  window.greekLastPreview=$('paper').innerHTML;
  return true;
 };
 const style=document.createElement('style');style.id='greek-choice-group-styles';
 style.textContent='.paper .greek-choice-option{margin:0 0 8pt 0;break-inside:auto}'+
  '.paper .greek-choice-subquestion{margin-top:8pt;font-weight:normal}'+
  '.paper .greek-choice-option .exam-paradigm{margin-bottom:7pt}'+
  '.paper .greek-choice-option > .exam-item + .exam-item{margin-top:4pt}';
 document.head.append(style);
 window.ExaminaGreekChoiceGroups={active:onlyGreek,regroup};
})();
