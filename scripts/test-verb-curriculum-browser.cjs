'use strict';
// Auditoría de la selección real, en Chromium sin conexión y por unidad.
// Produce un inventario de COBERTURA, no un sello de verificación individual.
const assert=require('node:assert/strict');
const {writeFileSync,mkdirSync}=require('node:fs');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(pathToFileURL(resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof latinMorphologyVerbPool==='function');
  const inspect=async(course,model)=>{
   await page.evaluate(({course,model})=>{
    const select=document.getElementById('course');
    select.value=course;select.dispatchEvent(new Event('change',{bubbles:true}));
    const mode=document.getElementById('model');
    mode.value=model;mode.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('cumulative').checked=true;
   },{course,model});
   return page.evaluate(course=>{
    const grid=[...document.querySelectorAll('.unit-choice')].map(input=>({
     input,unit:units[Number(input.value)]
    })).filter(x=>/^UD\d+/.test(x.unit));
    const items=[],violations=[];
    for(const selected of grid){
     grid.forEach(x=>x.input.checked=x.input===selected.input);
     const chosen=selectedUnits(),limit=Math.max(0,...chosen.map(examUnitNumber).filter(Number.isInteger));
     if(course==='latin1'){
      const verbs=latinMorphologyVerbPool(chosen);
      const morph=latinExamFormCandidates(chosen,true).flat();
      const selectedVerbs=latinMorphologyVerbSelection(verbs,10);
      if(limit>=3&&verbs.some(v=>v.voice==='pasiva')&&!selectedVerbs.some(v=>v.voice==='pasiva'))
       violations.push(selected.unit+': la tabla no reserva ninguna pasiva');
      if(limit>=3&&verbs.some(v=>v.voice==='activa')&&!selectedVerbs.some(v=>v.voice==='activa'))
       violations.push(selected.unit+': la tabla no contrasta formas activas');
      if(limit>=7&&verbs.some(v=>v.voice==='deponente')&&!selectedVerbs.some(v=>v.voice==='deponente'))
       violations.push(selected.unit+': la tabla no reserva ningún deponente documentado');
      if(limit>=9&&verbs.some(v=>v.voice==='pasiva'&&v.tense==='perfecto de indicativo')&&
       !selectedVerbs.some(v=>v.voice==='pasiva'&&v.tense==='perfecto de indicativo'))
       violations.push(selected.unit+': falta un perfecto pasivo en la tabla');
      if(limit>=9&&verbs.some(v=>v.voice==='pasiva'&&v.tense==='pluscuamperfecto de indicativo')&&
       !selectedVerbs.some(v=>v.voice==='pasiva'&&v.tense==='pluscuamperfecto de indicativo'))
       violations.push(selected.unit+': falta un pluscuamperfecto pasivo en la tabla');
      const kinds={};
      for(const v of verbs){
       const k=v.tense+' | '+v.voice;kinds[k]=(kinds[k]||0)+1;
       if(v.voice==='pasiva'){
        const phase=v.tense.startsWith('perfecto')||v.tense.startsWith('pluscuamperfecto');
        if(limit<(phase?9:3))violations.push(selected.unit+': pasiva anticipada '+v.form);
        if(!latinPersonalPerfectPassiveLemmas.has(examKey(v.entry)))
         violations.push(selected.unit+': pasiva personal no admitida '+v.entry+' '+v.form);
        if(!phase&&!latinPersonalPresentPassiveLemmas.has(examKey(v.entry)))
         violations.push(selected.unit+': infectum pasivo improcedente '+v.entry+' '+v.form);
       }
       if(v.voice==='deponente'&&limit<7)violations.push(selected.unit+': deponente anticipado '+v.form);
       if(v.tense.startsWith('futuro')&&limit<7)violations.push(selected.unit+': futuro anticipado '+v.form);
       if((v.tense.startsWith('perfecto')||v.tense.startsWith('pluscuamperfecto'))&&limit<4)
        violations.push(selected.unit+': perfecto activo anticipado '+v.form);
       if(/^(?:facior|facieris|venior|sumor|eor)$/.test(v.form))
        violations.push(selected.unit+': forma improcedente '+v.form);
      }
      items.push({unit:selected.unit,limit,lexical:latinSharedBank.vocabulary('latin1',chosen).length,
       verbForms:verbs.length,verbLemmas:new Set(verbs.map(x=>examKey(x.entry))).size,
       attestedForms:verbs.filter(x=>[1,5].includes(x.sourceCode)).length,
       regularDerivedForms:verbs.filter(x=>![1,5].includes(x.sourceCode)).length,
       analysisForms:morph.length,
       analysisByCategory:Object.fromEntries(['nouns','adjectives','verbs','pronouns'].map(k=>
        [k,morph.filter(x=>x.category===k).length])),
       types:kinds});
     }else if(course==='latin4'){
      const all=latinSharedBank.paradigms('latin4',chosen,'verb');
      items.push({unit:selected.unit,limit,lexical:latinSharedBank.vocabulary('latin4',chosen).length,
       regularOrExplicitVerbParadigms:all.length,
       verbPresentForms:all.reduce((n,x)=>n+x.p.forms.length,0)});
     }else{
      const available=greekVerifiedCorpus.filter(x=>x.verified&&greekMorphologyEligible(x,limit));
      items.push({unit:selected.unit,limit,
       reviewedCorpusItems:available.length,
       counts:Object.fromEntries(['declension','conjugation','forms','pronouns'].map(k=>
        [k,available.filter(x=>x.kind===k).length])),
       candidatesAwaitingTeacher:examAuthorizedProposals('greek1',limit).length});
      if(available.some(x=>x.minUnit>limit))violations.push(selected.unit+': corpus griego anticipado');
     }
    }
    return {items,violations};
   },course);
  };
  const latin=await inspect('latin1','morf');
  const latin4=await inspect('latin4','tablas');
  const greek=await inspect('greek1','morphology');
  assert.equal(latin.violations.length,0,latin.violations.slice(0,15).join('\n'));
  assert.equal(latin4.violations.length,0);
  assert.equal(greek.violations.length,0,greek.violations.slice(0,15).join('\n'));
  const greekDocumented=await page.evaluate(()=>{
   const boulomai=greekVerifiedCorpus.find(x=>x.id==='ev-βουλομαι'),
     erchomai=greekVerifiedCorpus.find(x=>x.id==='ev-ερχομαι'),
     aorist=greekVerifiedCorpus.find(x=>x.id==='ef-ερχομαι-0'),
     aoristConjugation=greekVerifiedCorpus.filter(x=>x.id.startsWith('ef-ερχομαι'));
   return {boulomai:boulomai&&{min:boulomai.minUnit,voice:boulomai.verbVoice,forms:boulomai.table.rows.length},
    erchomai:erchomai&&{min:erchomai.minUnit,tense:erchomai.verbTense,forms:erchomai.table.rows.length},
    aorist:aorist?.answer,uniqueAoristForms:aoristConjugation.length};
  });
  assert.deepEqual(greekDocumented.boulomai,{min:6,voice:'medio (deponente)',forms:3});
  assert.deepEqual(greekDocumented.erchomai,{min:12,tense:'aoristo segundo',forms:3});
  assert.match(greekDocumented.aorist,/primera persona del singular o tercera persona del plural/);
  assert.equal(greekDocumented.uniqueAoristForms,5,
   'El aoristo homógrafo ἦλθον debe conservar dos lecturas en una sola ficha');
  assert(latin.items.length>=9&&greek.items.length>=12,'Faltan unidades en la matriz curricular');
  const at=(prefix)=>latin.items.find(x=>x.unit.startsWith(prefix));
  assert(at('UD1')?.types['presente de indicativo | activa']>0,'UD1 sin presente activo');
  assert(!Object.keys(at('UD2')?.types||{}).some(x=>x.includes('pasiva')),'UD2 no debe adelantar la pasiva');
  assert(Object.keys(at('UD3')?.types||{}).some(x=>x.includes('pasiva')),'UD3: falta voz pasiva');
  assert(at('UD4')?.types['perfecto de indicativo | activa']>0,'UD4: falta perfecto');
  assert(at('UD7')?.types['presente de indicativo | deponente']>0,'UD7: falta presente deponente contrastado');
  const later=latin.items.find(x=>x.limit>=9);
  assert(later?.types['perfecto de indicativo | pasiva']>0,'UD9: falta perfectum pasivo');
  assert(later?.types['pluscuamperfecto de indicativo | pasiva']>0,'UD9: falta pluscuamperfecto pasivo');
  assert.deepEqual(errors,[],'Errores JavaScript detectados');
  // Conjugar con un tiempo explicitado permite presentar loqueris; un
  // ejercicio de análisis aislado no puede resolver sin contexto su doble tiempo.
  const syncretic=await page.evaluate(()=>{
   const chosen=latinSharedBank.vocabulary('latin1');
   return ['loquor','sequor'].map(lemma=>({
    lemma,source:latinExplicitVerbEvidence[lemma][0].forms[1]
   }));
  });
  assert(syncretic.every(x=>x.source.endsWith('eris')));
  const out=resolve(__dirname,'../test-artifacts/fase-ii-inventario-morfologico.json');
  mkdirSync(resolve(__dirname,'../test-artifacts'),{recursive:true});
  writeFileSync(out,JSON.stringify({
   schema:'examina-morph-curriculum-audit/v1',generated:new Date().toISOString(),
   evidencePolicy:'Formas derivadas por regla NO verificadas individualmente',
   latin1:latin.items,latin4:latin4.items,greek1:greek.items
  },null,2)+'\n');
  const last=latin.items[latin.items.length-1];
  assert.equal(last.attestedForms,112,'Las 114 formas latinas deben conservar su procedencia; 2 lecturas sincréticas se excluyen del análisis aislado');
  console.log('Auditoría curricular: Latín I '+latin.items.length+' etapas, Latín 4.º '+latin4.items.length+
   ', Griego I '+greek.items.length+' · máximo '+last.verbForms+' formas verbales posibles ('+
   last.attestedForms+' explícitas, '+last.regularDerivedForms+' derivadas por reglas).');
  console.log('Informe reproducible:',out);
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
