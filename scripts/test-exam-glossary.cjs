'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
function wordDocumentXml(bytes){
 let pos=0;
 while(pos+30<=bytes.length&&bytes.readUInt32LE(pos)===0x04034b50){
  const size=bytes.readUInt32LE(pos+18);
  const n=bytes.readUInt16LE(pos+26),extra=bytes.readUInt16LE(pos+28);
  const name=bytes.toString('utf8',pos+30,pos+30+n),begin=pos+30+n+extra;
  if(name==='word/document.xml')return bytes.toString('utf8',begin,begin+size);
  pos=begin+size;
 }
 throw Error('Word sin word/document.xml');
}
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const filename of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(filename),ctx,{filename});
const engine=ctx.window.ExaminaVocabulary;
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html'),first=html.indexOf('let vocab=');
assert(first>=0);
const start=first+'let vocab='.length,bank=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const found of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 bank.push(...JSON.parse(found[1]));
const latin=bank.filter(x=>(x.course||'latin1')==='latin1');
const latin4=bank.filter(x=>(x.course||'latin1')==='latin4');
const greek=bank.filter(x=>x.course==='greek1');
const cases=[
 ['lat1',latin,'Galli','gallus','galli'],
 ['lat1',latin,'bona','bonus','bona'],
 ['lat4',latin4,'bona','bonus','bona']
];
for(const [course,vocabulary,form,left,right] of cases){
 const row=engine.analyze(data,form,course,vocabulary,{contextual:true})[0];
 assert.equal(row.status,'review',form+': no elegir un homógrafo automáticamente');
 assert(row.candidates.some(c=>c.lemma===left));
 assert(row.candidates.some(c=>c.lemma===right));
 assert(row.candidates.some(c=>c.entry&&c.meaning),'Debe ofrecer la ficha docente con glosa');
}
for(const [entry,course,kind] of [
 ['bonus, –a, –um','lat1','adjectives'],
 ['Gallus, –a, –um','lat1','adjectives'],
 ['Galli, –orum','lat1','nouns'],
 ['hic, haec, hoc (pron.)','lat1','pronouns'],
 ['amo, amavi, amatum (1ª)','lat1','verbs'],
 ['bene (adv.)','lat1','other'],
 ['et (conj.)','lat1','other'],
 ['cum (conj.)','lat1','other'],
 ['cum (prep. + abl.)','lat1','prepositions'],
 ['ad (prep. + ac.)','lat1','prepositions'],
 ['ad','lat1','prepositions'],
 ['ἐν','gr1','prepositions'],
 ['ἐν (prep. + dat.)','gr1','prepositions'],
 ['καί (conj.)','gr1','other'],
 ['ὁ, ἡ, τό (art.)','gr1','articles'],
 ['μέν (part.)','gr1','particles'],
 ['ἐκεῖνος, –η, –ο (pron. dem.)','gr1','pronouns'],
 ['λόγος, –ου','gr1','nouns']
]){
 assert.equal(engine.classifyVocabularyEntry(entry,course),kind,'Tipo incorrecto: '+entry);
}
const groupedRows=[
 {form:'bonus',entry:'bonus, –a, –um',meaning:'bueno',status:'documented',lemma:'bonus',candidates:[]},
 {form:'amo',entry:'amo, amavi, amatum (1ª)',meaning:'amar',status:'documented',lemma:'amo',candidates:[]},
 {form:'hic',entry:'hic, haec, hoc (pron.)',meaning:'este',status:'documented',lemma:'hic',candidates:[]},
 {form:'bene',entry:'bene (adv.)',meaning:'bien',status:'documented',lemma:'bene',candidates:[]}
];
const project={course:'lat1',lang:'es',groupTypes:true,count:1,
 units:[{title:'UD1',mode:'complete',text:'Bonus amo hic bene.',analyzed:true,rows:groupedRows}]};
const xml=engine.documentXml(project);
for(const heading of ['Sustantivos y adjetivos','Verbos','Pronombres','Adverbios, conjunciones y otras palabras'])
 assert(xml.includes(heading),'Agrupación ausente: '+heading);
assert(xml.indexOf('Sustantivos y adjetivos')<xml.indexOf('Verbos'));
assert(xml.indexOf('Verbos')<xml.indexOf('Pronombres'));
assert(xml.includes('amo, amavi, amatum'));
const italic=xml.match(/<w:i\/>[^]*?amo, amavi, amatum/);
assert(italic,'El enunciado verbal debe ir en cursiva');
assert(!/<w:i\/>[^]*?\(1ª\)/.test(xml.slice(xml.indexOf('amo, amavi, amatum'),xml.indexOf('amo, amavi, amatum')+280)),
 'La indicación de conjugación no debe ir en cursiva');
assert(!engine.documentXml({...project,groupTypes:false}).includes('Sustantivos y adjetivos'));

(async()=>{
 const server=http.createServer((request,response)=>{
  response.setHeader('Content-Type','text/html; charset=utf-8');
  response.end(read('offline.html'));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/offline.html',{waitUntil:'load'});
  const requirements=await page.evaluate(()=>{
   const stored=JSON.parse(localStorage.getItem('examina_required_v9')||'[]');
   const course=document.getElementById('course');
   course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
   const lat1={
    early:isRequired('ambulo, ambulavi, ambulatum (1ª)',['UD1']),
    blockNotYet:isRequired('absum, abfui – (irr.)',['UD9']),
    blockReady:isRequired('absum, abfui – (irr.)',['UD10']),
    futureBlockNotYet:isRequired('abeo, abii, abitum (irr.)',['UD10']),
    futureBlockReady:isRequired('abeo, abii, abitum (irr.)',['UD12'])
   };
   course.value='latin4';course.dispatchEvent(new Event('change',{bubbles:true}));
   const lat4={
    early:isRequired('Æmĭlĭa, –æ',['UD1']),
    pending:isRequired('admīror, admīrātus sum (1ª)',['UD9']),
    ready:isRequired('admīror, admīrātus sum (1ª)',['UD10'])
   };
   return {count1:stored.filter(x=>x.course==='latin1').length,
    count4:stored.filter(x=>x.course==='latin4').length,
    seed:localStorage.getItem('examina_required_latin_docentes_v1'),
    lat1,lat4};
  });
  assert(requirements.count1>=1100&&requirements.count4===541, 'El exigible debe inicializarse');
  assert.equal(requirements.seed,'1');
  assert.deepEqual(requirements.lat1,{early:true,blockNotYet:false,blockReady:true,
   futureBlockNotYet:false,futureBlockReady:true});
  assert.deepEqual(requirements.lat4,{early:true,pending:false,ready:true});
  await page.evaluate(()=>{
   const rows=JSON.parse(localStorage.getItem('examina_required_v9'));
   const remaining=rows.filter(x=>!(x.course==='latin4'&&
    x.entry.startsWith('admīror')&&x.unit==='UD10'));
   localStorage.setItem('examina_required_v9',JSON.stringify(remaining));
  });
  await page.reload();
  const stillRemoved=await page.evaluate(()=>JSON.parse(
   localStorage.getItem('examina_required_v9')).some(x=>
   x.course==='latin4'&&x.entry.startsWith('admīror')&&x.unit==='UD10'));
  assert.equal(stillRemoved,false,
   'Una corrección docente no puede revertirse al recargar la lista exigible');
  await page.locator('#vmShowExam').click();
  await page.locator('#group-course').evaluate(el=>el.open=true);
  await page.locator('#group-content').evaluate(el=>el.open=true);
  await page.locator('#group-sentences').evaluate(el=>el.open=true);
  await page.locator('#group-vocab').evaluate(el=>el.open=true);
  await page.locator('#group-export').evaluate(el=>el.open=true);
  await page.evaluate(()=>{
   for(const [id,value] of [['course','latin1'],['model','mixto']]){
    const el=document.getElementById(id);el.value=value;
    el.dispatchEvent(new Event('change',{bubbles:true}));
   }
   const lines=document.getElementById('newSentences');
   lines.value='Galli pugnant.\nBona sunt.';
   lines.dispatchEvent(new Event('input',{bubbles:true}));
   generate();
  });
  await page.waitForFunction(()=>document.querySelectorAll('#examSentenceGlossary select.exam-gloss-lemma').length>=2,
   {timeout:30000});
  const labels=await page.locator('#examSentenceGlossary .exam-gloss-review-choice').allTextContents();
  assert(labels.some(x=>x.includes('Galli')));
  assert(labels.some(x=>x.includes('Bona')||x.includes('bona')));
  const galli=page.locator('#examSentenceGlossary .exam-gloss-review-choice').filter({hasText:'Galli'}).first();
  assert((await galli.locator('option').allTextContents()).some(s=>s.includes('Gallus, –a, –um')));
  const gallusValue=await galli.locator('option').filter({hasText:'Gallus, –a, –um'}).first().getAttribute('value');
  await galli.locator('select').evaluate((el,value)=>{
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  },gallusValue);
  assert.match(await page.locator('#examSentenceGlossary').innerText(),/Lecturas elegidas/);
  assert.match(await page.locator('#examSentenceGlossary .final-gloss').innerText(),/Gallus/);
  const bona=page.locator('#examSentenceGlossary .exam-gloss-review-choice').filter({hasText:/\bBona\b|\bbona\b/}).first();
  const value=await bona.locator('option').filter({hasText:'bonus, –a, –um'}).first().getAttribute('value');
  await bona.locator('select').evaluate((el,value)=>{
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
  assert.match(await page.locator('#examSentenceGlossary .final-gloss').innerText(),/bonus/);
  assert(!await page.locator('#examSentenceGlossary').innerText().then(s=>s.includes('Revisión necesaria: bona, Galli')));
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_exam_gloss_choices_v1')));
  assert.equal(Object.keys(stored).length,2,'Las dos decisiones deben persistir');
  // Una traducción guardada antiguamente no puede sobrescribir una glosa
  // corregida en el banco docente: la decisión conserva el LEMA elegido.
  const revalidated=await page.evaluate(()=>{
   const ids=Object.keys(examGlossDecisions),id=ids.find(k=>examGlossDecisions[k].entry.includes('Gallus'));
   if(!id)throw Error('Falta la decisión del adjetivo Gallus');
   const previous={...examGlossDecisions[id]};
   examGlossDecisions[id]={...previous,entry:'Enunciado obsoleto',
    meaning:'GLOSA_OBSOLETA',meaning_va:'GLOSA_OBSOLETA'};
   refreshSentenceGlossary();
   const output=document.getElementById('examSentenceGlossary').textContent;
   examGlossDecisions[id]=previous;
   refreshSentenceGlossary();
   return {output,stillSelected:output.includes('Gallus')};
  });
  assert(revalidated.stillSelected,'Una corrección de enunciado hizo perder la decisión del lema');
  assert(!revalidated.output.includes('GLOSA_OBSOLETA')&&!revalidated.output.includes('Enunciado obsoleto'),
   'La ficha guardada ha reemplazado indebidamente los datos actuales del banco');
  // La versión para el alumnado debe contener los enunciados elegidos.
  const waiting=page.waitForEvent('download');
  await page.evaluate(()=>exportWord(false));
  const docx=await waiting,xml=wordDocumentXml(fs.readFileSync(await docx.path()));
  assert(xml.includes('Gallus')&&xml.includes('bonus'),
   'Word: faltan los dos lemas resueltos desde el menú del glosario');
  assert(!xml.includes('GLOSA_OBSOLETA'),'Word contiene una glosa caducada');
  await page.reload();
  await page.locator('#vmShowExam').click();
  await page.locator('#group-course').evaluate(el=>el.open=true);
  await page.locator('#group-content').evaluate(el=>el.open=true);
  await page.locator('#group-sentences').evaluate(el=>el.open=true);
  await page.locator('#group-vocab').evaluate(el=>el.open=true);
  await page.locator('#group-export').evaluate(el=>el.open=true);
  await page.evaluate(()=>{
   const course=document.getElementById('course');
   course.value='latin1';course.dispatchEvent(new Event('change',{bubbles:true}));
   const model=document.getElementById('model');
   model.value='mixto';model.dispatchEvent(new Event('change',{bubbles:true}));
   const editor=document.getElementById('newSentences');
   editor.value='Galli pugnant.\nBona sunt.';
   editor.dispatchEvent(new Event('input',{bubbles:true}));
   generate();
  });
  await page.waitForFunction(()=>document.querySelector('#examSentenceGlossary .exam-gloss-selected'));
  assert.equal(await page.locator('#examSentenceGlossary .exam-gloss-reset').count(),2);
  await page.locator('#examSentenceGlossary .exam-gloss-reset').first().evaluate(el=>el.click());
  assert.equal(await page.locator('#examSentenceGlossary .exam-gloss-lemma').count(),1);
  for(const id of ['glossNouns','glossAdjectives','glossPronouns','glossArticles','glossParticles','glossOther','glossPrepositions','glossHideRequired'])
   assert.equal(await page.locator('#'+id).count(),1,id);
  const independent=await page.evaluate(()=>{
   const preps=document.getElementById('glossPrepositions');
   const other=document.getElementById('glossOther');
   const scope=document.getElementById('glossScope');
   scope.value='all';
   const run=()=>({prep:glossAccept('ad (prep. + ac.)',['UD7']),
    barePrep:glossAccept('ad',['UD7']),
    conj:glossAccept('cum (conj.)',['UD7']),
    adv:glossAccept('bene (adv.)',['UD7'])});
   const initial=run();
   other.checked=false;other.dispatchEvent(new Event('change',{bubbles:true}));
   const onlyPrepositions=run();
   other.checked=true;other.dispatchEvent(new Event('change',{bubbles:true}));
   preps.checked=false;preps.dispatchEvent(new Event('change',{bubbles:true}));
   const onlyOther=run();
   preps.checked=true;preps.dispatchEvent(new Event('change',{bubbles:true}));
   return {initial,onlyPrepositions,onlyOther};
  });
  assert.deepEqual(independent.initial,{prep:true,barePrep:true,conj:true,adv:true});
  assert.deepEqual(independent.onlyPrepositions,{prep:true,barePrep:true,conj:false,adv:false});
  assert.deepEqual(independent.onlyOther,{prep:false,barePrep:false,conj:true,adv:true});
  // Tres palabras de oraciones de Latín de 4.º: no figuran en su
  // programación curricular, pero sí tienen análisis escolares verificables.
  // El banco complementario SOLO actúa en el glosario y respeta glosas propias.
  const newGloss=await page.evaluate(()=>{
   const course=document.getElementById('course');
   course.value='latin4';course.dispatchEvent(new Event('change',{bubbles:true}));
   const model=document.getElementById('model');
   model.value='tablas';model.dispatchEvent(new Event('change',{bubbles:true}));
   const scope=document.getElementById('glossScope');scope.value='all';
   scope.dispatchEvent(new Event('change',{bubbles:true}));
   for(const id of ['glossVerbs','glossAdjectives','glossOther'])
    document.getElementById(id).checked=true;
   const main=latinSharedBank.vocabulary('latin4'),supp=latinSentenceGlossaryBank('latin4');
   const identified=window.ExaminaVocabulary.analyze(
    window.ExaminaOfflineLemmatizer.currentData(),
    'Arat. Doctusque scribit.','lat4',supp,{contextual:true});
   const result={
    before:main.length,after:supp.length,
    units:latinSharedBank.units('latin4'),
    baselineExtra:main.filter(x=>/^(aro|scribo|doctus),/i.test(x.entry)).length,
    forms:identified.map(row=>({form:row.form,lemma:row.lemma,status:row.status,
      encliticQue:row.encliticQue,candidates:row.candidates.map(c=>c.lemma)}))
   };
   const sentences=document.getElementById('newSentences');
   sentences.value='Arat. Doctusque scribit.';
   sentences.dispatchEvent(new Event('input',{bubbles:true}));
   generate();
   result.examination=document.getElementById('examSentenceGlossary')?.innerText||'';
   return result;
  });
  assert(newGloss.after>newGloss.before+100,'El glosario latino no reúne ambos cursos');
  assert.equal(newGloss.baselineExtra,0,'Se alteró el banco curricular original de 4.º');
  const shared=await page.evaluate(()=>{
   const data=window.ExaminaOfflineLemmatizer.currentData();
   const engine=window.ExaminaVocabulary;
   const get=(course,word)=>engine.analyze(data,word,course==='latin1'?'lat1':'lat4',
    latinSentenceGlossaryBank(course),{contextual:true})[0];
   const caelo=get('latin4','caelum'),gema=get('latin1','gemma');
   const activeAmo=get('latin4','amat'),activeIter=get('latin1','iter');
   const courseNode=document.getElementById('course'),old=courseNode.value;
   courseNode.value='latin4';
   const caeloExigible4=isRequired('cælum, –i',['UD1']);
   courseNode.value='latin1';
   const caeloExigible1=isRequired('cælum, –i',['UD1']);
   courseNode.value=old;
   return {caelo:{status:caelo.status,lemma:caelo.lemma},
    gema:{status:gema.status,lemma:gema.lemma},
    activeAmo:{entry:activeAmo.entry,meaning:activeAmo.meaning},
    activeIter:{entry:activeIter.entry,meaning:activeIter.meaning},
    caeloExigible4,caeloExigible1,initial:vocab.length};
  });
  assert.equal(shared.caelo.status,'documented','Latín de 4.º no reconoce el banco de Latín I');
  assert.equal(shared.caelo.lemma,'caelum');
  assert.equal(shared.gema.status,'documented','Latín I no reconoce el banco de 4.º');
  assert.equal(shared.gema.lemma,'gemma');
  assert.equal(shared.activeAmo.entry,'ămō, ămāvī, ămātum (1ª)',
   'El banco compartido ha sustituido el enunciado propio de 4.º');
  assert.equal(shared.activeAmo.meaning,'amar');
  assert.equal(shared.activeIter.meaning,'camino',
   'No prevalece la última glosa docente original de Latín I');
  assert.equal(shared.caeloExigible4,false,'Una ficha ajena se ha hecho exigible en 4.º');
  assert.equal(shared.caeloExigible1,true,'Se ha perdido la exigibilidad original de Latín I');
  assert.equal(shared.initial,2046,'No se debe modificar el banco docente original');
  assert.deepEqual([...new Set(newGloss.units)].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})),
   ['UD1','UD2','UD3','UD4','UD5','UD6','UD7','UD8','UD9','UD10'],
   'La incorporación no debe crear unidades artificiales');
  for(const [surface,lemma] of [['Arat','aro'],['Doctusque','doctus'],['scribit','scribo']]){
   const hit=newGloss.forms.find(row=>row.form===surface);
   assert(hit,'Sin análisis del token '+surface);
   if(surface==='Doctusque'){
    assert.equal(hit.status,'review','La unión debe conservar la alternativa participial');
    assert(hit.candidates.includes('doceo')&&hit.candidates.includes('doctus'),
     'Se han ocultado lecturas morfológicas de doctusque');
   }else{
    assert.equal(hit.status,'documented',surface+' aún no se identifica');
    assert.equal(hit.lemma,lemma,'Lema equivocado para '+surface);
   }
  }
  assert.equal(newGloss.forms.find(x=>x.form==='Doctusque').encliticQue,true,
   'No se separa el nexo copulativo -que');
  // No se elige automáticamente entre el adjetivo y el posible participio.
  const doctusChoice=page.locator('#examSentenceGlossary .exam-gloss-review-choice')
   .filter({hasText:'Doctusque'}).first();
  const doctusOption=doctusChoice.locator('option').filter({hasText:'doctus, –a, –um'}).first();
  const doctusValue=await doctusOption.getAttribute('value');
  assert(doctusValue!==null,'No está disponible el adjetivo documentado');
  await doctusChoice.locator('select').selectOption(doctusValue);
  const selectedGloss=await page.locator('#examSentenceGlossary').innerText();
  for(const term of ['aro','doctus','scribo','–que'])
   assert(selectedGloss.includes(term),'No aparece '+term+' en la vista previa');
  assert(!newGloss.examination.includes('sin candidatos'),'Siguen apareciendo formas desconocidas');
  // No se crea un lema sintético doctusque ni se promociona nada a morfología.
  assert.equal(await page.evaluate(()=>latinSharedBank.vocabulary('latin4').some(x=>
   /^doctusque\b/i.test(x.entry))),false);
  const customOverride=await page.evaluate(()=>{
   const len=vocab.length;
   vocab.push({course:'latin4',unit:'UD3',entry:'aro, aravi, aratum (1ª)',
    meaning:'arar (acepción docente)',meaning_va:'llaurar (accepció docent)'});
   const rows=latinSentenceGlossaryBank('latin4').filter(x=>/^aro,/i.test(x.entry));
   vocab.length=len;
   return rows.map(row=>row.meaning);
  });
  assert.equal(customOverride[0],'arar (acepción docente)',
   'La glosa del curso actual debe tener prioridad sobre la del otro curso');
  // La UD6 de Latín 4.º cambia la presentación, NO la lematización.
  // Incluso los verbos procedentes solo de Latín I se citan por el presente
  // hasta UD5. Tras la UD6 aparecen perfecto y supino disponibles.
  const schoolCitations=await page.evaluate(()=>{
   const entry=latinExamGlossEntry;
   const early=['UD3'],late=['UD6'];
   const sourceAro='aro, aravi, aratum (1ª)';
   const sourceSum='sum, fŭī – (irr.)';
   const sourceAmo='ămō, ămāvī, ămātum (1ª)';
   const renderedEarly=buildFinalLexicon(early,[{text:'Arat et sum.'}]);
   const renderedLate=buildFinalLexicon(late,[{text:'Arat et sum.'}]);
   return {
    earlyAro:entry(sourceAro,'latin4',early),
    earlySum:entry(sourceSum,'latin4',early),
    earlyAmo:entry(sourceAmo,'latin4',early),
    earlyUd1Sum:entry(sourceSum,'latin4',['UD1']),
    lateAro:entry(sourceAro,'latin4',late),
    lateSum:entry(sourceSum,'latin4',late),
    latin1:entry(sourceAro,'latin1',early),
    adjective:entry('bonus, –a, –um','latin4',early),
    early:renderedEarly,late:renderedLate
   };
  });
  assert.equal(schoolCitations.earlyAro,'aro (1ª)');
  assert.equal(schoolCitations.earlySum,'sŭm (irr.)');
  assert.equal(schoolCitations.earlyAmo,'ămo (1ª)');
  assert.equal(schoolCitations.earlyUd1Sum,'sŭm');
  assert.equal(schoolCitations.lateAro,'aro, aravi, aratum (1ª)');
  assert.equal(schoolCitations.lateSum,'sum, fŭī – (irr.)');
  assert.equal(schoolCitations.latin1,'aro, aravi, aratum (1ª)',
   'No modificar la secuenciación de Latín I');
  assert.equal(schoolCitations.adjective,'bonus, –a, –um',
   'La abreviación no afecta a adjetivos');
  assert(schoolCitations.early.includes('aro (1ª)')&&
   schoolCitations.early.includes('sŭm (irr.)'),
   'La presentación de UD3 no usa enunciados progresivos');
  assert(!schoolCitations.early.includes('aravi')&&
   !schoolCitations.early.includes('fŭī'),
   'No anticipar los temas del perfecto/supino antes de UD6');
  assert(schoolCitations.late.includes('aravi')&&
   schoolCitations.late.includes('fŭī'),
   'UD6 debe recuperar los temas verbales documentados');

  for(const [language,expected] of [['es',['arar','escribir','sabio']],['va',['llaurar','escriure','savi']]]){
   await page.evaluate(lang=>{
    const control=document.getElementById('lang');control.value=lang;
    control.dispatchEvent(new Event('change',{bubbles:true}));
    generate();
   },language);
   const shown=await page.locator('#examSentenceGlossary').innerText();
   for(const term of expected)assert(shown.includes(term),
    'Falta traducción '+language+': '+term);
   const downloadPromise=page.waitForEvent('download');
   await page.evaluate(()=>exportWord(false));
   const download=await downloadPromise,xml=wordDocumentXml(fs.readFileSync(await download.path()));
   for(const term of ['aro','doctus','scribo',...expected])
    assert(xml.includes(term),'Falta '+term+' en Word '+language);
   assert(!xml.includes('Revisión necesaria (sin candidatos)'),
    'Word no puede llevar un aviso de revisión pendiente');
  }
  assert.deepEqual(errors,[],'No deben aparecer errores JavaScript en la interfaz');
  console.log('Glosario de oraciones: elecciones, persistencia, edición, tipos y agrupación: OK');
 }finally{
  await browser.close();await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
