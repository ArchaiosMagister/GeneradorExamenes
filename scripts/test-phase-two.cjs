'use strict';
// Fase II: controles curriculares y flexión de adjetivos de 3.ª declinación.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

async function inspect(page,filename){
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(path.resolve(filename)).href);
 const diagnostics=await page.evaluate(()=>{
  const c=document.getElementById('course'),m=document.getElementById('model'),cum=document.getElementById('cumulative');
  cum.checked=false;
  c.value='latin1';c.dispatchEvent(new Event('change',{bubbles:true}));
  m.value='tablas';m.dispatchEvent(new Event('change',{bubbles:true}));
  const unitsList=['UD1','UD3','UD4','UD5','UD7'];
  const curriculum=Object.fromEntries(unitsList.map(unit=>{
   const available={
    adjective:examGrammarAllows('adjective12',[unit]),
    adjective3:examGrammarAllows('adjective3',[unit]),
    nominal3:examGrammarAllows('nominal3',[unit]),
    future:examGrammarAllows('future',[unit])
   };
   return [unit,available];
  }));
  const third=latinThirdAdjective({entry:'brevis, –e'});
  const examples=['brevis','breve','brevem','brevi','breves','brevia','brevium','brevibus'];
  const output={curriculum,
   forms:third?.forms||[],labels:third?.labels||[],examples,
   byGender:third?.byGender,
   excluded3rd:!latinNounAllowedForExam({kind:'3mf'},['UD3']),
   included3rd:latinNounAllowedForExam({kind:'3mf'},['UD4']),
   noAdjectivesAt1:latinExamFormCandidates(['UD1'],true).flat().every(item=>item.category!=='adjectives'),
   noThirdAdjectivesAt4:latinExamFormCandidates(['UD4'],true).flat()
    .every(item=>item.category!=='adjectives'||!/^brevis,\s*[–−-]e/.test(item.entry)),
   thirdAdjectivesAt5:0,initialThirdAdjectivesAt5:0,approvedLocally:false,approvalNotVerification:false,
   greek:{}
  };
  const thirdForms=()=>latinExamFormCandidates(['UD5'],true).flat()
   .filter(item=>item.category==='adjectives'&&/^brevis,\s*[–−-]e/.test(item.entry)).length;
  window.ExaminaThirdReview.set('brevis, –e','pending');
  output.initialThirdAdjectivesAt5=thirdForms();
  window.ExaminaThirdReview.set('brevis, –e','approved');
  output.thirdAdjectivesAt5=thirdForms();
  const decision=window.ExaminaThirdReview.snapshot().brevis;
  output.approvedLocally=window.ExaminaThirdReview.get('brevis, –e')==='approved';
  output.approvalNotVerification=decision?.verified===false&&decision?.decision==='approved';
  // Comprobar la tabla completa: sustantivo neutro + adjetivo de 3.ª,
  // con concordancia en singular, plural y genitivo.
  const originalAdjectives=latinCompleteAdjectives;
  try{
   latinCompleteAdjectives=()=>[{x:{entry:'brevis, –e'},p:latinThirdAdjective({entry:'brevis, –e'})}];
   const pairs=latinCompleteDeclensionItems(['UD1','UD2','UD3','UD4','UD5']);
   const neutral=pairs.find(x=>x.p.kind==='2n'&&x.compound);
   output.agreement=neutral?{
    singularNominative:neutral.compound.forms[0][0],
    singularGenitive:neutral.compound.forms[0][3],
    pluralNominative:neutral.compound.forms[1][0],
    pluralGenitive:neutral.compound.forms[1][3]
   }:null;
  }finally{latinCompleteAdjectives=originalAdjectives}

  c.value='greek1';c.dispatchEvent(new Event('change',{bubbles:true}));
  m.value='morphology';m.dispatchEvent(new Event('change',{bubbles:true}));
  const make=(label)=>{
   const ix=greekFormRows.length;
   greekFormRows.push(['δοκιμή',1,[1],'λέγω',label]);
   const item={kind:'forms',id:'f-'+ix,minUnit:1};
   const result=[greekMorphologyEligible(item,1),greekMorphologyEligible(item,5),
    greekMorphologyEligible(item,9),greekMorphologyEligible(item,10),
    greekMorphologyEligible(item,11),greekMorphologyEligible(item,12),
    greekMorphologyEligible(item,13)];
   greekFormRows.pop();return result;
  };
  output.greek.participle=make('Participio de presente, masculino');
  output.greek.imperfect=make('Imperfecto de indicativo activo');
  output.greek.future=make('Futuro de indicativo activo');
  output.greek.aorist=make('Aoristo de indicativo activo');
  output.greek.perfect=make('Perfecto de indicativo activo');
  output.defaultCount={
   forms:Number(document.getElementById('count-forms')?.value),
   greekForms:Number(document.getElementById('count-greek-forms')?.value),
   morphology:Number(document.getElementById('morphWords')?.value)
  };
  return output;
 });
 assert.deepEqual(Object.keys(diagnostics.curriculum),['UD1','UD3','UD4','UD5','UD7']);
 assert.equal(diagnostics.curriculum.UD1.adjective,false,'Latín I: adjetivos antes de UD2');
 assert.equal(diagnostics.curriculum.UD3.adjective,true,'Latín I: adjetivos desde UD2');
 assert.equal(diagnostics.curriculum.UD3.nominal3,false,'Latín I: 3.ª declinación antes de UD4');
 assert.equal(diagnostics.curriculum.UD4.nominal3,true,'Latín I: 3.ª declinación desde UD4');
 assert.equal(diagnostics.curriculum.UD4.adjective3,false,'Latín I: adjetivos de 3.ª antes de UD5');
 assert.equal(diagnostics.curriculum.UD5.adjective3,true,'Latín I: adjetivos de 3.ª desde UD5');
 assert.equal(diagnostics.curriculum.UD5.future,false,'Latín I: futuro antes de UD7');
 assert.equal(diagnostics.curriculum.UD7.future,true,'Latín I: futuro desde UD7');
 assert(diagnostics.excluded3rd&&diagnostics.included3rd,'El filtro nominal ignora el nivel curricular');
 assert(diagnostics.noAdjectivesAt1,'Se sortearon adjetivos en UD1');
 assert(diagnostics.noThirdAdjectivesAt4,'Se sortearon adjetivos de 3.ª antes de UD5');
 assert.equal(diagnostics.initialThirdAdjectivesAt5,0,'No deben sortearse propuestas sin aceptar');
 assert(diagnostics.approvedLocally&&diagnostics.approvalNotVerification,'Aceptar no equivale a verificar');
 assert(diagnostics.thirdAdjectivesAt5>0,'No se ofrecen los adjetivos aprobados desde UD5');
 assert.equal(diagnostics.forms.length,24,'Brevis debe tener 4 series de 6 casos');
 assert(diagnostics.examples.every(x=>diagnostics.forms.includes(x)),
  'Falta una forma básica de brevis: '+JSON.stringify(diagnostics.forms));
 assert.equal(diagnostics.byGender.n[0][0],'breve');
 assert.equal(diagnostics.byGender.n[1][0],'brevia');
 assert.equal(diagnostics.byGender.f[1][3],'brevium');
 assert.equal(diagnostics.byGender.m[0][5],'brevi');
 assert(diagnostics.agreement,'Falta un sustantivo neutro para comprobar concordancia');
 assert(diagnostics.agreement.singularNominative.endsWith(' breve'),'Concordancia de neutro singular');
 assert(diagnostics.agreement.singularGenitive.endsWith(' brevis'),'Concordancia en genitivo singular');
 assert(diagnostics.agreement.pluralNominative.endsWith(' brevia'),'Concordancia de neutro plural en -ia');
 assert(diagnostics.agreement.pluralGenitive.endsWith(' brevium'),'Concordancia en genitivo plural -ium');
 const greek=diagnostics.greek;
 assert.equal(greek.participle[2],false,'Participio antes de UD10');
 assert.equal(greek.participle[3],true,'Participio desde UD10');
 assert.equal(greek.imperfect[3],false,'Imperfecto griego antes de UD11');
 assert.equal(greek.imperfect[4],true,'Imperfecto griego desde UD11');
 assert.equal(greek.future[3],false,'Futuro griego antes de UD11');
 assert.equal(greek.future[4],true,'Futuro griego desde UD11');
 assert.equal(greek.aorist[4],false,'Aoristo antes de UD12');
 assert.equal(greek.aorist[5],true,'Aoristo desde UD12');
 assert.equal(greek.perfect[5],false,'Perfecto antes de UD13');
 assert.equal(greek.perfect[6],true,'Perfecto desde UD13');
 assert.deepEqual(diagnostics.defaultCount,{forms:4,greekForms:4,morphology:4},
  'Los tres contadores de análisis deben proponer 4 formas');
 await page.evaluate(()=>{
  const c=document.getElementById('course');
  c.value='latin1';c.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('.unit-choice').forEach(el=>el.checked=units[Number(el.value)]==='UD5');
  document.querySelector('.unit-choice:checked')?.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForFunction(()=>!document.getElementById('examThirdAdjectiveReview')?.hidden&&
  document.querySelectorAll('#examThirdAdjectiveReview select[data-third-review-entry]').length>0);
 const review=page.locator('#examThirdAdjectiveReview');
 await review.evaluate(el=>el.open=true);
 const field=review.locator('select[data-third-review-entry^="brevis"]').first();
 assert.equal(await field.inputValue(),'approved','Se ha perdido la decisión del profesor');
 await field.selectOption('excluded');
 assert.equal(await page.evaluate(()=>window.ExaminaThirdReview.get('brevis, –e')),'excluded');
 await review.locator('select[data-third-review-entry^="brevis"]').first().selectOption('approved');
 assert.equal(await page.evaluate(()=>window.ExaminaThirdReview.snapshot().brevis.verified),false);
 await page.reload();
 assert.equal(await page.evaluate(()=>window.ExaminaThirdReview.get('brevis, –e')),'approved',
  'La aceptación no se recuerda al abrir otro examen');
 assert.deepEqual(errors,[],'Errores JavaScript: '+errors.join('; '));
 console.log('OK curricular morphology in '+filename+'; regular -is/-e adjectives and four-word defaults.');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1360,height:940}});
   await inspect(page,file);await page.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
