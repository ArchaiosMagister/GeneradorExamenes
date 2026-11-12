'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:950}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>!!latin1PreverbCurriculum&&!!latin1PhoneticCurriculum&&
   latinLexBanks.latin1.preverbs.length>0&&latinLexBanks.latin1.phonetics.length>0,null,{timeout:15000});
  async function configure(course,model,unit){
   await page.evaluate(({course,model,unit})=>{
    const c=document.getElementById('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
    const m=document.getElementById('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('.unit-choice').forEach(x=>x.checked=units[Number(x.value)]===unit);
    examSelectionCache.clear();generate();
   },{course,model,unit});
   await page.waitForFunction(()=>!!document.querySelector('#paper .exam-sheet'));
   await page.waitForFunction(()=>[...document.querySelectorAll('#paper .exam-question')].every(q=>q.querySelector('.exam-question-points')));
  }
  await configure('latin1','tablas','UD1');
  let latin=await page.evaluate(()=>({
   compound:latinCompleteCompoundActive(selectedUnits()),
   words:[...document.querySelectorAll('#paper .exam-nouns thead th[colspan]')].filter(el=>!el.closest('#answerkey')).map(x=>x.textContent),
   earlyVerb:latinVerbExamEnunciation('duco, duxi, ductum (3ª)',selectedUnits()),
   cases:latinMorphologyEnunciation({category:'nouns',entry:'oppidum, -i'},selectedUnits())
  }));
  assert.equal(latin.compound,false);
  assert(latin.words.every(s=>s.includes(',')&&!s.includes(' + ')),'UD1: sustantivos con enunciado');
  assert.equal(latin.earlyVerb,'duco, 3ª');
  assert.equal(latin.cases,'oppidum, –i');
  await configure('latin1','tablas','UD2');
  latin=await page.evaluate(()=>({
   nouns:[...document.querySelectorAll('#paper .exam-nouns thead th[colspan]')].filter(el=>!el.closest('#answerkey')).map(x=>x.textContent),
   verbs:[...document.querySelectorAll('#paper .exam-verbs thead th[colspan]')].filter(el=>!el.closest('#answerkey')).map(x=>x.textContent),
   hasWordRegens:[...document.querySelectorAll('#examQuestionMenus [data-editor-for="decl"] .exam-regenerate-word')].length
  }));
  const beforeThird=await page.evaluate(()=>latinExamNominals(['UD2']).map(row=>row.p.kind));
  assert(beforeThird.length>0&&beforeThird.every(kind=>/^[12]/.test(kind)),
   'UD2: se han sorteado temas de tercera declinación antes de la unidad de introducción');
  assert(latin.nouns.length>0);
  assert(latin.nouns.every(s=>/^[^+]+,\s*–\S+.*\s\+\s[^+]+,\s*–\S+/u.test(s)),
   'UD2: enunciados completos de adjetivo + sustantivo: '+latin.nouns.join(' | '));
  assert(latin.verbs.every(s=>!/,.*,.*/.test(s)&&/, (?:[1-4]ª|mx\.|irr\.)$/.test(s)),'UD2: solo presente y tipo verbal (regulares, mixtos o irregulares): '+latin.verbs);
  assert(latin.hasWordRegens>0,'Falta regeneración individual de sustantivos');
  await configure('latin1','tablas','UD4');
  latin=await page.evaluate(()=>({
   full:latinVerbExamEnunciation('duco, duxi, ductum (3ª)',selectedUnits()),
   partial:latinVerbExamEnunciation('duco, duxi, ductum (3ª)',['UD3']),
   forms:[...document.querySelectorAll('#paper .latin-standard-exam .exam-question')].find(x=>x.textContent.includes('Analiza morfológicamente'))?.nextElementSibling?.outerHTML
  }));
  assert.equal(latin.full,'duco, duxi, ductum (3ª)');
  assert.equal(latin.partial,'duco, 3ª');
  assert(latin.forms?.includes('<i>')&&/\(<i>[^<]+<\/i>\)/u.test(latin.forms),
   'Cada palabra variable analizada debe llevar el enunciado entre paréntesis');
  // Los pronombres se exceptúan del paréntesis.
  assert.equal(await page.evaluate(()=>latinMorphologyEnunciation({category:'pronouns',entry:'hic'},selectedUnits())),'');

  // La numeración es local a cada apartado; no cuenta las tablas del solucionario.
  const editorState=await page.evaluate(()=>({
   decl:[...document.querySelectorAll('[data-editor-for="decl"] .exam-word-editor label')].map(x=>x.textContent),
   verbs:[...document.querySelectorAll('[data-editor-for="verb"] .exam-word-editor label')].map(x=>x.textContent),
   forms:[...document.querySelectorAll('[data-editor-for="forms"] .exam-word-editor label')].map(x=>x.textContent),
   panels:[...document.querySelectorAll('#examQuestionMenus>details.exam-question-panel')].map(x=>({
    title:x.querySelector('summary .exam-question-name').textContent,
    hasCheck:!!x.querySelector('summary input[type=checkbox]'),
    initiallyOpen:x.open
   })),
   outer:document.querySelector('#examQuestionSettings')?.tagName
  }));
  assert(editorState.decl[0]?.startsWith('Declinación 1'),'Declinaciones deben iniciar en 1');
  assert(editorState.verbs[0]?.startsWith('Conjugación 1'),'Conjugaciones deben iniciar en 1');
  assert(editorState.forms[0]?.includes('1'),'Análisis debe iniciar en 1');
  assert.equal(editorState.panels.length,6);
  assert.equal(editorState.outer,'SECTION');
  assert(editorState.panels.every((x,i)=>x.title.startsWith((i+1)+'. ')&&x.hasCheck),
   'Cada pregunta tiene desplegable numerado y casilla');
  assert(editorState.panels.every(x=>!x.initiallyOpen),'Los desplegables comienzan cerrados');

  // Regenerar un solo sustantivo, verbo y palabra: no cambia el resto del grupo.
  const regeneration=await page.evaluate(()=>{
   const output={};
   for(const kind of ['decl','verb','forms']){
    const key=examCacheSignature(kind),before=examSelectionCache.get(key);
    const signature=x=>JSON.stringify({entry:x?.x?.entry||x?.entry||'',form:x?.form||'',title:x?.compound?.title||x?.title||''});
    if(!Array.isArray(before)||before.length<2){output[kind]={missing:true};continue}
    const prior=before.map(signature);
    regenerateExamWord(kind,0);
    const current=examSelectionCache.get(key)||[];
    output[kind]={before:prior,after:current.map(signature),
      button:!!document.querySelector('[data-editor-for="'+kind+'"] .exam-regenerate-word')};
   }
   return output;
  });
  for(const [kind,item] of Object.entries(regeneration)){
   assert(!item.missing,'Insuficiente banco para ' +kind);
   assert(item.button,'Falta botón individual de '+kind);
   assert.deepEqual(item.before.slice(1),item.after.slice(1),
    'Regenerar '+kind+' ha alterado otras palabras');
  }

  const forms=await page.evaluate(()=>{
   const inExam=()=>[...document.querySelectorAll('#paper [data-analysis-slot] > i:first-child')].map(x=>x.textContent);
   const inEditor=()=>[...document.querySelectorAll('[data-editor-for="forms"] .exam-word-editor input')].map(x=>x.value);
   const before=inExam(),editorBefore=inEditor(),index=2;
   document.querySelectorAll('[data-editor-for="forms"] .exam-regenerate-word')[index].click();
   return {before,editorBefore,index,after:inExam(),editorAfter:inEditor()};
  });
  assert.deepEqual(forms.editorBefore,forms.before,'El editor incluye solo la forma, sin enunciados');
  assert.deepEqual(forms.editorAfter,forms.after);
  assert.deepEqual(forms.after.map((form,i)=>form!==forms.before[i]),forms.before.map((_,i)=>i===forms.index));

  // 2 puntos fijos para el léxico, con el banco completo ya disponible.
  await configure('latin1','tablas','UD9–10');
  const lexicon=await page.evaluate(()=>{
   const kinds=['phonetics','prefixes','latinisms','preverbs'];
   return Object.fromEntries(kinds.map(kind=>[kind,{
    exam:[...document.querySelectorAll('[data-lex-kind="'+kind+'"] i')].map(x=>x.textContent),
    editor:[...document.querySelectorAll('[id^="lex-slot-'+kind+'-"]')].map(x=>x.textContent),
    canonical:latinLexBanks.latin1.latinisms.find(x=>x.number===30).prompt
   }]));
  });
  for(const kind of ['phonetics','prefixes','latinisms']){
   const {exam,editor}=lexicon[kind];
   assert.equal(exam.length,4);
   assert.deepEqual(exam,editor.slice().sort((a,b)=>a.localeCompare(b,'es')));
  }
  assert.deepEqual(lexicon.preverbs.exam,lexicon.preverbs.editor);
  assert.equal(lexicon.latinisms.canonical,'ex libris');
  await page.waitForFunction(()=>!!window.ExaminaScoring);
  await page.locator('#examScoring .exam-scoring-heading button').click();
  const score=await page.evaluate(()=>{
   window.ExaminaScoring.sync();
   const all=window.ExaminaScoring.rows(),lex=all.find(x=>/léxico|lexic/i.test(x.caption));
   const input=[...document.querySelectorAll('#examScoring input[data-scoring-key]')].find(x=>x.dataset.scoringKey===lex?.key);
   const points=[...document.querySelectorAll('#paper .exam-question-points')].map(x=>x.textContent);
   const enunciado=[...document.querySelectorAll('#paper .exam-question')].find(x=>/léxico/i.test(x.textContent))?.textContent||'';
   return {points,lex,disabled:input?.disabled,total:window.ExaminaScoring.total(),enunciado};
  });
  assert(score.lex&&score.lex.points===200&&score.disabled,'El léxico debe valer siempre 2p.: '+JSON.stringify(score));
  assert.equal(score.total,1000,'Los demás puntos deben repartirse hasta 10');
  assert(score.points.every(x=>/^\(\d+(?:,\d+)?p\.\)\.$/.test(x)),
   'Sin espacios entre número y p.: '+score.points);
  assert(/elige dos de las [34] cuestiones siguientes/i.test(score.enunciado),
   'Latín I: elegir dos entre 3 o 4 cuestiones: '+score.enunciado);

  // Si el docente desactiva un apartado, el enunciado debe decir tres,
  // y nunca anunciar cuatro cuando solo se han generado tres ejercicios.
  const threePartCaption=await page.evaluate(()=>{
   const key='latin1/latinisms';
   const prior=latinLexPartEnabled[key];
   try{
    latinLexPartEnabled[key]=false;
    generate();
    return [...document.querySelectorAll('#paper .exam-question')].find(x=>/léxico/i.test(x.textContent))?.textContent||'';
   }finally{
    latinLexPartEnabled[key]=prior;
    generate();
   }
  });
  assert(/elige dos de las 3 cuestiones siguientes/i.test(threePartCaption),
   'Al desmarcar un apartado deben ofrecerse exactamente tres: '+threePartCaption);

  // La exigencia acumulativa oculta SOLO el significado en el glosario del examen.
  const glossary=await page.evaluate(()=>{
   const words=latinSharedBank.vocabulary('latin1');
   const row=words.find(x=>examKey(x.entry)==='oppidum');
   if(!row)throw Error('Falta oppidum en vocabulario de Latín I');
   const backup=examRequired;
   const course='latin1',key=examKey(row.entry),chosen=['UD4'];
   try{
    examRequired=backup.filter(x=>!(x.course===course&&(x.key||examKey(x.entry))===key));
    const before=buildFinalLexicon(chosen,[{text:'oppidum'}]);
    examRequired.push({course,unit:'UD1',entry:row.entry,key,meaning:row.meaning});
    const after=buildFinalLexicon(chosen,[{text:'oppidum'}]);
    return {entry:row.entry,meaning:row.meaning,before,after,
     isRequired:isRequired(row.entry,chosen)};
   }finally{examRequired=backup}
  });
  assert(glossary.isRequired);
  assert(glossary.before.includes('gloss-item')&&glossary.after.includes('gloss-item'));
  assert(glossary.after.includes(glossary.entry.replace(/\s*\((?:adv\.?|conj\.?)\)\s*/gi,' ').trim()));
  assert(!glossary.after.includes(''+glossary.meaning),'La palabra exigible no debe llevar traducción');
  assert(glossary.before.includes(''+glossary.meaning),'Las palabras no exigibles sí deben traducirse');

  await configure('latin4','tablas','UD2');
  const early4=await page.evaluate(()=>({
   entries:[...document.querySelectorAll('#paper .exam-nouns thead th[colspan]')].filter(x=>!x.closest('#answerkey')).map(x=>x.textContent),
   verb:latinVerbExamEnunciation('duco, duxi, ductum (3ª)',selectedUnits())
  }));
  assert(early4.entries.every(x=>x.includes(',')&&!x.includes(' + ')),'Latín 4º UD2: sustantivo enunciado');
  assert.equal(early4.verb,'duco, 3ª');
  await configure('latin4','tablas','UD3');
  const later4=await page.evaluate(()=>[...document.querySelectorAll('#paper .exam-nouns thead th[colspan]')]
   .filter(x=>!x.closest('#answerkey')).map(x=>x.textContent));
  assert(later4.every(x=>x.includes(' + ')),'Latín 4º UD3: sintagma con dos enunciados');
  assert.deepEqual(errors,[],'Errores JS de navegador');
  console.log('CORRECCIONES LATINAS OK: enunciados, progresión, palabras, controles, 2p., léxico y glosario acumulativo.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
