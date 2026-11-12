'use strict';
// Regresión transversal de la fase II: todos los cursos, modelos y unidades.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

async function audit(page,filename){
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 await page.goto(pathToFileURL(path.resolve(filename)).href,{waitUntil:'load'});
 const result=await page.evaluate(()=>{
  const report={latin:[],greek:[],matrix:[],nominal:[],models:[],problems:[]};
  const fail=(condition,message)=>{if(!condition)report.problems.push(message)};
  const forms=['1','2','3','4','5','6','7','8','9','10'].map(n=>'UD'+n);
  const latinCases=[
   {entry:'civis, –is (m. o f.)',gen:'civium',nominative:'cives'},
   {entry:'urbs, urbis (f.)',gen:'urbium',nominative:'urbes'},
   {entry:'pars, partis (f.)',gen:'partium',nominative:'partes'},
   {entry:'mare, maris (n.)',gen:'marium',nominative:'maria'},
   {entry:'animal, –alis (n.)',gen:'animalium',nominative:'animalia'},
   {entry:'manus, –us (f.)',gen:'manuum',nominative:'manus'},
   {entry:'cornu, –us (n.)',gen:'cornuum',nominative:'cornua'},
   {entry:'res, –ei (f.)',gen:'rerum',nominative:'res'}
  ];
  for(const row of latinCases){
   const p=mNoun(row.entry);
   fail(!!p,'Falta paradigma nominal de '+row.entry);
   if(p){
    fail(p.forms[1][3]===row.gen,'Genitivo plural incorrecto de '+row.entry+': '+p.forms[1][3]);
    fail(p.forms[1][0]===row.nominative,'Nominativo plural incorrecto de '+row.entry);
    fail(p.forms.every(list=>list.length===6),'Paradigma nominal incompleto: '+row.entry);
   }
   report.nominal.push({entry:row.entry,found:!!p});
  }
  const select=(course,model,unit)=>{
   if($('course').value!==course){
    $('course').value=course;$('course').dispatchEvent(new Event('change',{bubbles:true}));
   }
   if($('model').value!==model){
    $('model').value=model;$('model').dispatchEvent(new Event('change',{bubbles:true}));
   }
   $('cumulative').checked=false;
   for(const input of document.querySelectorAll('.unit-choice')){
    input.checked=units[Number(input.value)]===unit;
   }
   examSelectionCache.clear();
   if(course==='greek1')greekExamState=null;
   generate();
   const h=$('paper').querySelector('.exam-sheet');
   fail(!!h,course+'/'+model+'/'+unit+' sin examen');
   fail(!h?.querySelector('.exam-score-inline-editor'),course+'/'+model+'/'+unit+' editor de puntuación suelto');
   report.models.push({course,model,unit,questions:h?.querySelectorAll('.exam-question').length||0});
  };
  $('course').value='latin1';$('course').dispatchEvent(new Event('change',{bubbles:true}));
  $('model').value='tablas';$('model').dispatchEvent(new Event('change',{bubbles:true}));
  for(const unit of forms){
   const n=Number(unit.slice(2));
   const rows=latinSchoolVerbRows([unit]);
   fail(rows.every(x=>Array.isArray(x.forms)&&x.forms.length===6),
    'Formas verbales incompletas en '+unit);
   fail(rows.every(x=>{
    const threshold=LATIN_SCHOOL_SCHEDULE.find(v=>v[0]===x.id)?.[1]||1;
    return threshold<=n;
   }),'Se han anticipado tiempos en '+unit);
   const nrows=latinExamFormCandidates([unit],true);
   fail(nrows[0].every(x=>!!latinAttestedNoun(x.entry)||!latinNounAllowedForExam({kind:'3mf'},['UD3'])||n>=4),
    'Sustantivos de 3.ª prematuros en '+unit);
   fail(nrows[1].every(x=>!/^brevis,\s*[–−-]e/.test(x.entry)||n>=5),
    'Adjetivos de tercera anticipados en '+unit);
   if(n>=1)fail(rows.some(x=>/^sum, fui/.test(x.x.entry)&&x.id==='present-active'),
    'Falta sum en '+unit);
   report.latin.push({unit,verbRows:rows.length,wordPool:nrows.map(group=>group.length)});
   for(const model of ['tablas','morf','mixto'])select('latin1',model,unit);
  }
  const amo=latinSchoolVerbRows(['UD1','UD2','UD3','UD4','UD7','UD9'])
   .filter(x=>/^amo,/.test(x.x.entry));
  const check=(id,index,expected)=>{
   const item=amo.find(x=>x.id===id);
   fail(!!item, 'Falta '+id+' de amo');
   if(item)fail(item.forms[index]===expected,id+' '+index+': '+item.forms[index]+' != '+expected);
  };
  check('present-active',0,'amo');
  check('imperfect-active',0,'amabam');
  check('present-passive',0,'amor');
  check('imperfect-passive',5,'amabantur');
  check('perfect-active',0,'amavi');
  check('pluperfect-active',0,'amaveram');
  check('future-active',0,'amabo');
  check('future-passive',0,'amabor');
  check('perfect-passive',0,'amatus sum');
  check('perfect-passive',3,'amati sumus');
  const mixed=latinSchoolVerbRows(['UD1','UD2','UD3','UD4','UD7','UD9'])
   .filter(x=>/^capio,\s*cepi,\s*captum\s*\(mx\.\)/i.test(x.x.entry));
  for(const [id,index,expected] of [
   ['present-active',0,'capio'],['imperfect-active',0,'capiebam'],
   ['present-passive',0,'capior'],['perfect-active',0,'cepi'],
   ['future-active',0,'capiam'],['future-passive',0,'capiar'],
   ['perfect-passive',0,'captus sum']
  ]){
   const p=mixed.find(x=>x.id===id);
   fail(p?.forms[index]===expected,'Mixta capio: '+id+' != '+expected);
  }
  const pronouns=latinPronounRows;
  for(const [unit,word] of [[3,'mihi'],[5,'eius'],[6,'hanc'],[8,'ipse']]){
   fail(pronouns.some(x=>x.unit===unit&&x.form===word),
    'Falta pronombre '+word+' de UD'+unit);
   fail(!latinExamPronouns(['UD'+(unit-1)]).some(x=>x.form===word),
    'Pronombre '+word+' antes de su UD');
   fail(latinExamPronouns(['UD'+unit]).some(x=>x.form===word),
    'Pronombre '+word+' no disponible en UD'+unit);
  }
  const rego=latinSchoolVerbRows(['UD5','UD7']).find(x=>/^rego,/.test(x.x.entry)&&x.id==='future-active');
  fail(rego?.forms[0]==='regam','Futuro de rego incorrecto');
  const audio=latinSchoolVerbRows(['UD6','UD7']).find(x=>/^audio,/.test(x.x.entry)&&x.id==='future-active');
  fail(audio?.forms[0]==='audiam','Futuro de audio incorrecto');
  // Latín 4.º conserva su progresión sin inventar tiempos de otros cursos.
  $('course').value='latin4';$('course').dispatchEvent(new Event('change',{bubbles:true}));
  const latin4Units=[...units];
  for(const unit of latin4Units){
   const rows=latinSchoolVerbRows([unit]);
   fail(rows.every(x=>x.id==='present-active'), 'Tiempos de Latín I filtrados en 4.º '+unit);
   select('latin4','tablas',unit);
  }
  $('course').value='greek1';$('course').dispatchEvent(new Event('change',{bubbles:true}));
  const greekUnits=[...units];
  for(const unit of greekUnits){
   const n=examUnitNumber(unit);
   const available=greekVerifiedCorpus.filter(x=>x.kind!=='sentences'&&greekMorphologyEligible(x,n));
   fail(available.every(x=>x.minUnit<=n),'Forma griega prematura en '+unit);
   for(const [id,min] of [['v-school-λυω-imperfecto-activa',11],
     ['v-school-λυω-futuro-activa',11],
     ['v-school-λυω-aoristo-sigmático-activa',12],
     ['v-school-λυω-perfecto-activa',13]]){
    const found=greekVerifiedCorpus.find(x=>x.id===id);
    fail(!found||greekMorphologyEligible(found,n)===(n>=min),
      'Fallo de umbral en '+unit+': '+id);
   }
   report.greek.push({unit,available:available.length});
   for(const model of ['complete','morphology','translation'])select('greek1',model,unit);
  }
  const eimi=greekVerifiedCorpus.find(x=>x.id==='v-school-ειμι-presente-activa');
  fail(!!eimi,'Falta εἰμί en Griego I');
  const lyso=greekVerifiedCorpus.find(x=>x.id==='v-school-λυω-futuro-activa');
  fail(lyso?.table?.rows?.[0]?.[1]==='λύσω','Futuro explícito λύσω ausente');
  const elipon=greekVerifiedCorpus.find(x=>x.id==='v-school-λειπω-aoristo-temático-activa');
  fail(elipon?.table?.rows?.[0]?.[1]==='ἔλιπον','Aoristo temático explícito ἔλιπον ausente');
  const elysa=greekVerifiedCorpus.find(x=>x.id==='v-school-λυω-aoristo-sigmático-activa');
  fail(elysa?.table?.rows?.[0]?.[1]==='ἔλυσα','Aoristo explícito ἔλυσα ausente');
  const leluka=greekVerifiedCorpus.find(x=>x.id==='v-school-λυω-perfecto-activa');
  fail(leluka?.table?.rows?.[0]?.[1]==='λέλυκα','Perfecto explícito λέλυκα ausente');
  return report;
 });
 assert.deepEqual(result.problems,[],filename+' curriculum failures:\n'+result.problems.join('\n'));
 assert.equal(result.models.length,30+result.greek.length*3+result.models.filter(x=>x.course==='latin4').length,
  filename+' missing models');
 assert.equal(result.greek.length,15,filename+' expected 15 course units UD0-14');
 assert.deepEqual(pageErrors,[],filename+' JS pageerrors: '+pageErrors.join('; '));
 console.log(filename+': '+result.models.length+' combinations passed, '+result.nominal.length+' special paradigms; '+result.latin.length+' Latin I and '+result.greek.length+' Greek I units.');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{for(const f of ['index.html','offline.html']){
  const page=await browser.newPage({viewport:{width:1360,height:920}});
  await audit(page,f);await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
