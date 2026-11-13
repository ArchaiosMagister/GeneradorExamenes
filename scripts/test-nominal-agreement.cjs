// Regression of course/unit thresholds and genuine agreement in full exams.
// Uses the actual web application and its offline data, not a mocked paradigm.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:900}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'load'});
  async function choose(course,model,unit){
   // El selector del curso puede estar oculto por la pestaña de edición;
   // reproducimos los mismos eventos change que usa la aplicación.
   await page.evaluate(({course,model,unit})=>{
    const selector=document.getElementById('course');
    selector.value=course;selector.dispatchEvent(new Event('change',{bubbles:true}));
    const modelSelect=document.getElementById('model');
    modelSelect.value=model;modelSelect.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]===unit);
    generate();
   },{course,model,unit});
   return page.evaluate(()=>{
    const tables=[...document.querySelectorAll('#paper .exam-nouns')]
     .filter(x=>!x.closest('#answerkey'));
    const headings=tables.map(t=>t.querySelector('thead tr:first-child th[colspan]')?.textContent.trim()||'');
    const answerTables=[...document.querySelectorAll('#answerkey .exam-nouns')];
    return {headings,answers:answerTables.map(t=>[...t.querySelectorAll('tbody tr')].map(r=>
     [...r.querySelectorAll('td')].map(td=>td.textContent.trim()))),tableCount:tables.length};
   });
  }
  const lat1early=await choose('latin1','tablas','UD1');
  assert(lat1early.tableCount>0,'Faltan sustantivos de Latín I UD1');
  assert(lat1early.headings.every(x=>x.includes(',')),'Latín I UD1 debe mostrar sustantivo simple');

  // Fase II: antes de los adjetivos, la morfología propone sustantivos,
  // no construcciones con adjetivos ni formas de tercera declinación.
  await choose('latin1','morf','UD1');
  const latinEarlyMorph=await page.evaluate(()=>({
   heading:[...document.querySelectorAll('#paper .exam-question')][0]?.textContent.trim(),
   titles:[...document.querySelectorAll('#paper .morph-syntagm-item > i')].map(x=>x.textContent.trim()),
   requested:document.getElementById('morphWords')?.value,
   forms:[...document.querySelectorAll('#paper [data-analysis-slot]')].length,
   candidates:latinExamFormCandidates(['UD1'],true).flat().map(x=>({
    category:x.category,kind:x.category==='nouns'?mNoun(x.entry)?.kind:null
   }))
  }));
  assert.match(latinEarlyMorph.heading,/sustantivos propuestos/);
  assert(latinEarlyMorph.titles.length>0&&latinEarlyMorph.titles.every(x=>!x.includes('+')),
   'Latín I UD1: no exigir adjetivos aún no estudiados');
  assert.equal(latinEarlyMorph.requested,'4','Por defecto se solicitan cuatro formas');
  assert(latinEarlyMorph.forms<=4,'El análisis morfológico supera el cupo docente');
  assert(latinEarlyMorph.candidates.every(x=>x.category!=='adjectives'&&
   (x.category!=='nouns'||/^[12]/.test(x.kind))),
   'UD1: no deben sortearse adjetivos ni tercera declinación');

  await choose('latin1','morf','UD4');
  const latinCategoryFilter=await page.evaluate(()=>{
   const before=latinExamFormCandidates(selectedUnits(),true).flat();
   const check=document.getElementById('morphCategory-n');
   check.checked=false;
   check.dispatchEvent(new Event('change',{bubbles:true}));
   const after=latinExamFormCandidates(selectedUnits(),true).flat();
   const selected=examSelectionCache.get(examCacheSignature('forms'))||[];
   check.checked=true;
   check.dispatchEvent(new Event('change',{bubbles:true}));
   return {beforeNouns:before.filter(x=>x.category==='nouns').length,
    afterNouns:after.filter(x=>x.category==='nouns').length,
    selectedNouns:selected.filter(x=>x.category==='nouns').length};
  });
  assert(latinCategoryFilter.beforeNouns>0,'Faltan sustantivos en el banco de Latín I UD4');
  assert.equal(latinCategoryFilter.afterNouns,0,'Desactivar sustantivos debe filtrar el banco');
  assert.equal(latinCategoryFilter.selectedNouns,0,'La caché no debe recuperar sustantivos excluidos');

  const lat1=await choose('latin1','tablas','UD2');
  assert(lat1.tableCount>0,'Faltan sustantivos de Latín I UD2');
  assert(lat1.headings.every(x=>/\S+,\s*\S+.*\s\+\s\S+,\s*\S+/.test(x)),
   'Latín I UD2 debe presentar sustantivo y adjetivo: '+lat1.headings.join(' / '));
  assert(lat1.answers.every(rows=>rows.every(cols=>cols.every(x=>x.split(' ').length===2))),
   'Latín I: sustantivo y adjetivo deben declinarse juntos');

  const lat4early=await choose('latin4','tablas','UD2');
  assert(lat4early.headings.every(x=>x.includes(',')),'Latín 4.º UD2 debe conservar el enunciado simple');
  const lat4=await choose('latin4','tablas','UD3');
  assert(lat4.tableCount>0,'Faltan nominales verificados de Latín 4.º UD3');
  assert(lat4.headings.every(x=>/\S+,\s*\S+.*\s\+\s\S+,\s*\S+/.test(x)),
   'Latín 4.º UD3: debe haber sintagma nominal: '+lat4.headings.join(' / '));
  assert(lat4.answers.every(rows=>rows.every(cols=>cols.every(x=>x.split(' ').length===2))),
   'Latín 4.º: concordancia nominal incompleta');

  const greekBefore=await choose('greek1','complete','UD4');
  assert(greekBefore.tableCount>0,'Griego I UD4: faltan sustantivos');
  assert(greekBefore.headings.every(x=>!/(ἀγαθ|καλ|κακ)/u.test(x)),
   'Griego I UD4 no debe introducir todavía el adjetivo');
  await choose('greek1','morphology','UD4');
  const greekEarlyMorph=await page.evaluate(()=>({
   heading:[...document.querySelectorAll('#paper .exam-question')][0]?.textContent.trim(),
   titles:[...document.querySelectorAll('#paper .morph-syntagm-item > i')].map(x=>x.textContent.trim())
  }));
  assert.match(greekEarlyMorph.heading,/sustantivos propuestos/);
  assert(greekEarlyMorph.titles.length>0&&greekEarlyMorph.titles.every(x=>!x.includes('+')),
   'Griego I UD4: no generar sintagmas con adjetivos de UD5');
  const greek=await choose('greek1','complete','UD5');
  assert(greek.tableCount>0,'Griego I UD5: faltan tablas nominales');
  assert(greek.headings.every(x=>/^(ὁ|ἡ|τὸ)\s+\S+\s+\S+/u.test(x)),
   'Griego I UD5 debe mostrar artículo, adjetivo y sustantivo del banco: '+greek.headings.join(' / '));
  assert(greek.answers.every(rows=>rows.every((cols,k)=>
   cols.every(x=>k===1?x.split(' ').length===2:x.split(' ').length===3))),
   'En el vocativo no hay artículo; en los demás casos deben aparecer tres palabras');
  const agreement=await page.evaluate(()=>{
   const selected=['n-λογος','n-αγορα','n-δωρον'];
   return selected.map(id=>{
    const x=greekVerifiedCorpus.find(y=>y.id===id);
    if(!x)throw Error('Falta el sustantivo '+id);
    const c=greekCompleteNominalGroup(x);
    return {id,title:c.title,nom:c.rows[0][1][0],gen:c.rows[3][1][0],voc:c.rows[1][1][0]};
   });
  });
  assert(agreement[0].title.startsWith('ὁ '),'Masculino griego: artículo equivocado');
  assert(/^ἡ \S+ ἀγορά$/u.test(agreement[1].title),'Femenino griego: orden atributivo incorrecto');
  assert(agreement[2].title.startsWith('τὸ '),'Neutro griego: artículo equivocado');
  assert(agreement[0].gen.startsWith('τοῦ '),'Genitivo masculino: falta artículo');
  assert(agreement[1].gen.startsWith('τῆς '),'Genitivo femenino: falta artículo');
  assert(agreement[2].gen.startsWith('τοῦ '),'Genitivo neutro: falta artículo');
  assert(agreement.every(x=>!x.voc.startsWith('ὁ ')&&!x.voc.startsWith('ἡ ')&&!x.voc.startsWith('τὸ ')),
   'El artículo griego no tiene vocativo');
  assert(agreement[0].nom.split(' ')[1].normalize('NFD').replace(/\p{M}/gu,'').endsWith('ος')&&
   agreement[1].nom.split(' ')[1].normalize('NFD').replace(/\p{M}/gu,'').match(/(?:ος|η|α)$/u)&&
   agreement[2].nom.split(' ')[1].normalize('NFD').replace(/\p{M}/gu,'').endsWith('ον'),
   'Concordancia griega incorrecta en el nominativo');

  const morph=await choose('greek1','morphology','UD5');
  assert(morph.headings.every(x=>!/(ἀγαθ|καλ|κακ)/u.test(x)),
   'Los exámenes de morfología griega deben conservar tablas simples');
  const latinMorph=await choose('latin1','morf','UD2');
  assert(latinMorph.headings.every(x=>!/\s+(?:bonus|bona|bonum)\b/.test(x)),
   'Los exámenes de morfología latina no deben depender del nuevo formato');

  assert.deepEqual(errors,[],'Errores JavaScript en la webapp');
  console.log('Declinaciones completas: Latín I UD2, Latín 4.º UD3 y Griego I UD5; concordancia y excepciones verificadas en Chromium.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
