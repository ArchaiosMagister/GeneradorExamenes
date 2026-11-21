'use strict';
// Matriz real de navegación: ν móvil en 14 UD × web/PWA × castellano/valenciano.
// Las tablas conservan (ν); las preguntas individuales deben tener grafía real.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const files=['index.html','offline.html'],languages=['es','va'];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of files)for(const lang of languages){
   const ctx=await browser.newContext({viewport:{width:1300,height:850}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
   const report=await page.evaluate(lang=>{
    const set=(id,value)=>{
     const x=document.getElementById(id);
     if(!x)throw Error('Selector de examen ausente: '+id);
     x.value=value;x.dispatchEvent(new Event('change',{bubbles:true}));
    };
    set('course','greek1');set('model','morphology');set('lang',lang);
    const explicit=Object.entries(greekExplicitVerbEvidence)
     .flatMap(([key,r])=>r.forms.map((form,i)=>({key,r,form,i})))
     .filter(x=>x.form.endsWith('(ν)'));
    if(explicit.length!==6)throw Error('El número de formas explícitas de ν móvil cambió');
    if(greekVerifiedCorpus.some(x=>x.kind==='forms'&&x.prompt.includes('(ν)')))
     throw Error('La notación editorial está siendo tratada como forma para analizar');
    const nominal=[['αρχων','ἄρχουσι(ν)'],['γυνη','γυναιξί(ν)']];
    for(const [lemma,notation] of nominal){
     const expected=greekWrittenFormVariants(notation);
     const actual=greekVerifiedCorpus.filter(x=>x.kind==='forms'&&
      x.id.startsWith('gn-v19-'+lemma+'-')&&expected.includes(x.prompt));
     if(actual.length!==2||actual.some(x=>x.minUnit!==8||x.category!=='nouns'))
      throw Error('Dativo plural de tercera incompleto: '+lemma+' '+JSON.stringify(actual));
    }
    for(const {key,r,form,i} of explicit){
     const written=greekWrittenFormVariants(form);
     for(const [variant,surface] of written.entries()){
      const id='ef-'+key+'-'+i+(variant?'-nu':'');
      const row=greekVerifiedCorpus.find(x=>x.id===id);
      if(!row||row.prompt!==surface||row.minUnit!==r.unit||
        row.sourceCode!==r.sourceCode||!row.answer.includes(r.tense))
       throw Error('Forma fuente contrastada ausente o sin unidad: '+id+' '+surface);
     }
    }
    const unitsReport=[];
    for(let unit=1;unit<=14;unit++){
     const target=[...document.querySelectorAll('#unitChoices .unit-choice')]
      .find(x=>units[Number(x.value)]==='UD'+unit);
     if(!target)throw Error('Falta UD'+unit);
     document.querySelectorAll('#unitChoices .unit-choice').forEach(el=>el.checked=el===target);
     target.dispatchEvent(new Event('change',{bubbles:true}));
     const pool=greekVerifiedCorpus.filter(x=>x.verified&&greekMorphologyEligible(x,unit));
     const verbPool=greekVerbAnalysisCandidates(pool),formPool=pool
      .filter(x=>x.kind==='forms').concat(examGreekVerbFormCandidates(pool,unit));
     if(verbPool.some(x=>/[()]/.test(x.prompt))||
       formPool.some(x=>/[()]/.test(x.prompt)))
      throw Error('Grafía abreviada en UD'+unit);
     for(const {key,r,form} of explicit){
      for(const spelling of greekWrittenFormVariants(form)){
       const inVerb=verbPool.some(x=>x.prompt===spelling&&x.minUnit===r.unit);
       const inForm=formPool.some(x=>x.prompt===spelling&&x.minUnit===r.unit);
       if((unit>=r.unit)!==inVerb||(unit>=r.unit)!==inForm)
        throw Error('Progresión incorrecta de '+spelling+' UD'+unit+' (UD'+r.unit+')');
      }
     }
     for(const [lemma,notation] of nominal){
      const expected=greekWrittenFormVariants(notation);
      const available=pool.filter(x=>x.kind==='forms'&&
       x.id.startsWith('gn-v19-'+lemma+'-')&&expected.includes(x.prompt));
      if(available.length!==(unit>=8?2:0))
       throw Error('Dativo nominal adelantado u omitido en UD'+unit+': '+lemma);
     }
     const number=ExaminaGreekNumber.candidates();
     if(number.some(x=>x.prompt.includes('(ν)')||x.answer.includes('(ν)')))
      throw Error('Grafía de edición en cambio de número UD'+unit);
     const eimi=verbPool.some(x=>x.prompt==='ἐστίν');
     if(eimi!==true)throw Error('El presente de εἰμί no ofrece ἐστίν en UD'+unit);
     const eimiNoNu=verbPool.some(x=>x.prompt==='ἐστί');
     if(!eimiNoNu)throw Error('El presente de εἰμί no ofrece ἐστί');
     const all=verbPool.filter(x=>x.prompt==='ἔλυον'||x.prompt==='ἦλθον');
     if(all.some(x=>!x.answer.includes('primera persona singular o tercera persona plural')))
      throw Error('Regresión del sincretismo en UD'+unit);
     unitsReport.push({unit,verbs:verbPool.length,forms:formPool.length});
    }
    return {unitsReport,explicitOptional:explicit.length,nominalOptional:nominal.length};
   },lang);
   assert.equal(report.unitsReport.length,14,'No se revisaron las 14 unidades');
   assert.deepEqual(errors,[],file+'/'+lang+': error de JavaScript');
   console.log('GREEK_MOVABLE_NU '+file+'/'+lang+' '+JSON.stringify(report));
   await ctx.close();
  }
  console.log('OK: ν móvil verbal y nominal en 56 contextos, sin adelantar UD ni imprimir grafías editoriales.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

// Validación definitiva: corpus verbal y nominal, sin workflows temporales.
