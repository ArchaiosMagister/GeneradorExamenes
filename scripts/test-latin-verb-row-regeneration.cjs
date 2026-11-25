'use strict';
const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const engine=process.env.EXAM_TEST_BROWSER==='webkit'?webkit:chromium;
const files=['index.html','offline.html'];

async function check(browser,file){
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(pathToFileURL(resolve(__dirname,'..',file)).href);
  const report=await page.evaluate(()=>{
   const change=(id,value)=>{
    $(id).value=value;$(id).dispatchEvent(new Event('change',{bubbles:true}));
   };
   change('model','morf');
   const checks=[...document.querySelectorAll('.unit-choice')];
   const select=unit=>{
    for(const input of checks)input.checked=units[+input.value]===unit;
    checks.find(input=>input.checked).dispatchEvent(new Event('change',{bubbles:true}));
   };
   const atButton=i=>document.querySelector('[data-regenerate-kind="verb"][data-regenerate-index="'+i+'"]');
   const tableRows=()=>[...$('paper').querySelectorAll('.reference-verb-table tbody tr')];
   const answers=()=>[...$('paper').querySelectorAll('#answerkey [data-morph-kind="verb"] > p')];
   const surface=row=>row.cells[0].querySelector('i').textContent;
   const key=()=>examCacheSignature('verb');
   const stages=['UD4',...checks.map(input=>units[+input.value]).filter(x=>x!=='UD4')];
   const failures=[];
   let clicks=0;
   for(const [position,unit] of stages.entries()){
    $('cumulative').checked=position%2===0;
    select(unit);
    const pool=latinMorphologyVerbPool(selectedUnits());
    const initial=examSelectionCache.get(key());
    const index=unit==='UD4'?initial.findIndex(item=>item.tense==='pluscuamperfecto de indicativo'):0;
    if(index<0||!atButton(index))return {failures:[unit+': falta fila inicial'],clicks,stages};
    for(let turn=0;turn<5;turn++){
     const before=examSelectionCache.get(key()),rows=tableRows(),solutions=answers();
     const previous=surface(rows[index]);
     const used=new Set(rows.map(row=>normLex(surface(row))));
     const alternatives=pool.filter(item=>!used.has(normLex(latinExamSurface(item.form,item.entry))));
     const freshTenses=alternatives.filter(item=>item.tense!==before[index].tense);
     atButton(index).click();
     clicks++;
     const after=examSelectionCache.get(key());
     const newRows=tableRows(),newAnswers=answers(),next=after[index];
     if(previous===surface(newRows[index])||!alternatives.includes(pool.find(item=>
      item.form===next.form&&item.entry===next.entry&&item.tense===next.tense&&item.voice===next.voice)))
      failures.push(unit+': no hubo una forma nueva del temario');
     if(freshTenses.length&&next.tense===before[index].tense)
      failures.push(unit+': '+next.tense+' se repitió habiendo otros tiempos');
     const frequency=label=>before.filter((item,i)=>i!==index&&item.tense===label).length;
     const possibleTenses=[...new Set((freshTenses.length?freshTenses:alternatives).map(item=>item.tense))];
     if(possibleTenses.some(label=>frequency(label)<frequency(next.tense)))
      failures.push(unit+': se prefirió un tiempo más repetido en la tabla');
     if(!newAnswers[index].textContent.startsWith(next.form+' — ')||!newAnswers[index].textContent.includes(next.tense))
      failures.push(unit+': solución desincronizada');
     if(rows.some((row,i)=>i!==index&&(newRows[i]!==row||newAnswers[i]!==solutions[i])))
      failures.push(unit+': se sustituyó otra fila o solución');
    }
   }
   // El formato de borrador anterior ya contenía estos HTML y soluciones.
   // Restaurarlo en otra selección no debe usar el análisis de una fila sorteada en segundo plano.
   change('lang','va');
   select('UD4');
   examSelectionCache.delete(key());
   generate();
   const index=examSelectionCache.get(key()).findIndex(item=>item.tense==='pluscuamperfecto de indicativo');
   const sibling=index===0?1:0;
   tableRows()[sibling].cells[1].textContent='Revisió docent';
   answers()[sibling].textContent='Solució revisada pel docent';
   const draft=window.ExaminaUnifiedCurrentExam();
   select('UD1');
   examSelectionCache.clear();
   window.ExaminaUnifiedRestoreDraft(draft);
   const before=tableRows().map(surface),beforeAnswers=answers().map(item=>item.textContent);
   atButton(index).click();
   clicks++;
   const after=tableRows().map(surface),afterAnswers=answers().map(item=>item.textContent);
   if(after[index]===before[index]||!afterAnswers[index].includes('d’indicatiu')||
      /plusquamperfet|pluscuamperfecto/.test(afterAnswers[index]))
    failures.push('Borrador UD4: se perdió la variedad al recuperar la tabla');
   if(before.some((form,i)=>i!==index&&(form!==after[i]||beforeAnswers[i]!==afterAnswers[i]))||
      tableRows()[sibling].cells[1].textContent!=='Revisió docent')
    failures.push('Borrador UD4: se perdió una edición de otra fila');
   $('undoGeneration').click();
   if(before.some((form,i)=>form!==surface(tableRows()[i])||beforeAnswers[i]!==answers()[i].textContent))
    failures.push('No se recuperó la tabla anterior al deshacer la sustitución');
   return {failures,clicks,stages};
  });
  assert(report.stages.length>=9,file+': falta parte del temario de Latín I');
  assert.deepEqual(report.failures,[],file+': '+[...new Set(report.failures)].join('; '));
  assert.deepEqual(errors,[],file+': errores de ejecución');
  console.log(file+': '+report.clicks+' sustituciones en '+report.stages.length+' etapas de Latín I');
 }finally{await page.close()}
}

(async()=>{
 const browser=await engine.launch();
 try{for(const file of files)await check(browser,file)}
 finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
