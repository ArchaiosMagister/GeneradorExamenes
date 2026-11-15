/* Resumen visual del examen: comportamiento idéntico, aislado del motor académico. */
(function setupExamVisualSummary(){
 const panel=document.querySelector('#examLayout>aside.panel');
 const heading=panel?.querySelector(':scope>h2');
 if(!heading||document.getElementById('examSelectionSummary'))return;
 const host=document.createElement('div');
 host.id='examSelectionSummary';host.setAttribute('aria-live','polite');
 const caption=document.createElement('div'),title=document.createElement('div'),details=document.createElement('div');
 caption.className='exam-summary-caption';caption.textContent='Configuración actual';
 title.className='exam-summary-title';details.className='exam-summary-details';
 host.append(caption,title,details);heading.after(host);
 const courseNames={latin1:'Latín I',latin4:'Latín 4.º ESO',greek1:'Griego I'};
 function render(){
  const course=document.getElementById('course'),model=document.getElementById('model'),lang=document.getElementById('lang');
  if(!course||!model||!lang)return;
  const mode=model.selectedOptions[0]?.textContent?.replace(/^\s*[123]\s*[·.]\s*/,'').trim()||'Examen';
  title.textContent=(courseNames[course.value]||course.selectedOptions[0]?.textContent||'Curso')+' · '+mode;
  const selected=[...document.querySelectorAll('#unitChoices .unit-choice:checked')]
   .map(input=>typeof units!=='undefined'?units[Number(input.value)]:input.closest('label')?.textContent?.trim())
   .filter(Boolean);
  let description='Sin unidades seleccionadas';
  if(selected.length){
   const numbers=selected.map(x=>/^UD(\d+)$/i.exec(x)?.[1]).filter(Boolean).map(Number);
   if(numbers.length===selected.length){
    const consecutive=numbers.every((n,i)=>i===0||n===numbers[i-1]+1);
    description=selected.length===1?'UD '+numbers[0]:
     consecutive?'UDs '+numbers[0]+'–'+numbers[numbers.length-1]:
     selected.length<=6?'UDs '+numbers.join(', '):selected.length+' unidades seleccionadas';
   }else description=selected.length<=4?selected.join(', '):selected.length+' unidades seleccionadas';
  }
  const language=lang.value==='va'?'Valencià':'Castellano';
  const cumulative=document.getElementById('cumulative');
  const extra=cumulative?.checked&&!cumulative.closest('[hidden]')?' · Vocabulario acumulado':'';
  details.textContent=description+' · '+language+extra;
 }
 document.addEventListener('change',()=>queueMicrotask(render),true);
 for(const id of ['allUnits','clearUnits']){
  document.getElementById(id)?.addEventListener('click',()=>queueMicrotask(render));
 }
 render();
})();
