'use strict';
// Cotejo global de TODAS las tablas latinas y selección sin pérdida de lemas.
// Índice con 12 casillas contrastables (fuente 0), pruebas independientes
// para las dos entradas sin cobertura y progresión curricular LAT1/LAT4.
// Ejecutar: node scripts/test-latin-nominal-integrity.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=JSON.parse(read('data/lemmas/teacher-forms.json'));
const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
const required=read('required-latin-units.js');
const source=read('index.html'),offline=read('offline.html');
assert.equal(index.vocabulary.lat.ver.lat1.entry,'ver, veris (n.)');
assert(!required.includes('ver, veris (f.)'),'Vocabulario exigible conserva ver femenino');
assert(required.includes('ver, veris (n.)'),'No figura el neutro en el vocabulario exigible');
assert(overrides.entryCorrections.some(x=>x.lang==='lat'&&x.lemma==='ver'&&
 x.course==='lat1'&&x.to==='ver, veris (n.)'),'Falta la corrección reproducible de ver');
for(const [name,text] of [['web',source],['autónoma',offline]]){
 assert(text.includes('ver, veris (n.)'),name+' no contiene ver neutro');
 assert(!text.includes('"entry": "ver, veris (f.)"'),name+' aún contiene la ficha errónea');
}
const normalize=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/æ/gi,'ae').replace(/œ/gi,'oe').toLowerCase();
const rowsByLemma=new Map();
for(const row of index.rows.lat){
 const [lemma,form,tags,sourceCode]=row;
 if(sourceCode!==0||!tags.startsWith('N;'))continue;
 if(!rowsByLemma.has(lemma))rowsByLemma.set(lemma,[]);
 rowsByLemma.get(lemma).push({form,tags:tags.split(';')});
}
const cases=['NOM','VOC','ACC','GEN','DAT','ABL'];
const unknownReferences=new Set(['pugna','postulatum']);
const independentlyVerified={
 pugna:[
  ['pugna','pugna','pugnam','pugnae','pugnae','pugna'],
  ['pugnae','pugnae','pugnas','pugnarum','pugnis','pugnis']
 ],
 postulatum:[
  ['postulatum','postulatum','postulatum','postulati','postulato','postulato'],
  ['postulata','postulata','postulata','postulatorum','postulatis','postulatis']
 ]
};
const removed=[
 ['ferrum','durus'],['ferrum','clarus'],['littera','parvus'],
 ['littera','clarus'],['cognomen','verus'],['signum','clarus'],
 ['oraculum','occultus']
];
const checks=[];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1320,height:920}});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
   for(const course of ['latin1','latin4'])for(const lang of ['es','va']){
    const result=await page.evaluate(({course,lang,removed})=>{
     const set=(id,value)=>{
      const el=document.getElementById(id);
      el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
     };
     const nounKey=x=>mNormalize(x).toLowerCase();
     set('course',course);set('model','tablas');set('lang',lang);
     document.querySelectorAll('.unit-choice').forEach(x=>x.checked=true);
     const chosen=selectedUnits();
     const nouns=latinSyntagmNouns(chosen);
     const tables=latinCompleteDeclensionItems(chosen);
     const semantic=latinSyntagmSemanticPairs;
     const all=Object.entries(semantic);
     const allowed=all.reduce((sum,[,a])=>sum+a.split(' ').length,0);
     const byKey=new Map(tables.map(item=>[nounKey(item.p.lemma),item]));
     const data=tables.map(({p,compound})=>({
      lemma:nounKey(p.lemma),gender:p.gender,kind:p.kind,nounForms:p.forms,
      adjective:compound&&nounKey(headLex(compound.adjective.entry)),
      compoundForms:compound?.forms||null
     }));
     const grammaticalUnits={};
     for(let unit=1;unit<=(course==='latin1'?12:10);unit++){
      const target=[...document.querySelectorAll('.unit-choice')]
       .find(x=>{const label=units[Number(x.value)];
        return /^UD/.test(label||'')&&Number((label.match(/\d+/)||[])[0])===unit;
       });
      // Algunas unidades aparecen agrupadas. Utilizar la misma selección del
      // generador en lugar de inferir el currículo a partir del vocabulario.
      if(!target)continue;
      document.querySelectorAll('.unit-choice').forEach(x=>x.checked=x===target);
      const selected=selectedUnits();
      grammaticalUnits[unit]=latinSyntagmNouns(selected).map(x=>({
       lemma:nounKey(x.p.lemma),kind:x.p.kind
      }));
     }
     set('model',course==='latin1'?'morf':'tablas');
     document.querySelectorAll('.unit-choice').forEach(x=>x.checked=true);
     const sourceEntries=[...latinSharedBank.vocabulary(course),
      ...latinSharedBank.vocabulary(course==='latin1'?'latin4':'latin1')];
     const selected=latinExamMorphologyEntries(sourceEntries);
     const byCategory=new Set(selected.map(x=>x.latinMorphCategory+'|'+examKey(x.entry)));
     const selectedCourseHeads=new Set(latinSharedBank.vocabulary(course,selectedUnits())
      .map(x=>examKey(x.entry)));
     const expectedNounHeads=[...new Set(selected.filter(x=>
      x.latinMorphCategory==='nouns'&&
      (course==='latin1'||selectedCourseHeads.has(examKey(x.entry))))
      .map(x=>examKey(x.entry)))];
     const groups=latinExamFormCandidates(selectedUnits(),true);
     const nounForms=groups[0].map(x=>({
      lemma:examKey(x.entry),form:mNormalize(x.form),declension:x.declension
     }));
     const ver=mNoun('ver, veris (n.)');
     const legacyVer=mNoun('ver, veris (f.)');
     return {
      semanticNouns:all.length,semanticCombinations:allowed,
      semantic,tableCount:tables.length,poolCount:nouns.length,
      tables:data,grammaticalUnits,byCategory:[...byCategory],
      nounForms,expectedNounHeads,ver,legacyVer,
      selectedCount:selected.length,
      diagnostics:{model:document.getElementById('model')?.value,
       course:currentCourse(),units:selectedUnits(),
       nChecked:document.getElementById('morphCategory-n')?.checked,
       fraterSources:sourceEntries.filter(x=>examKey(x.entry)==='frater').map(x=>x.entry),
       fraterSelected:selected.filter(x=>examKey(x.entry)==='frater')
        .map(x=>({entry:x.entry,category:x.latinMorphCategory})),
       fraterReturned:groups[0].filter(x=>examKey(x.entry)==='frater').length},
      missingPairs:removed.filter(([noun,adj])=>
       (semantic[noun]||'').split(' ').includes(adj))
     };
    },{course,lang,removed});
    const context=file+'/'+course+'/'+lang;
    assert.equal(result.semanticNouns,193,context+' cantidad de lemas semánticos');
    assert.equal(result.semanticCombinations,552,context+' combinaciones no previstas');
    assert.deepEqual(result.missingPairs,[],context+' siete pares excluidos reaparecen');
    assert(result.semantic.pecunia.split(' ').includes('magnus'),context+' pecunia magna');
    assert(result.semantic.ludus.split(' ').includes('publicus'),context+' ludi publici');
    assert(result.tableCount>=(course==='latin1'?190:189),context+' pérdida del repertorio');
    assert.equal(result.tables.length,result.tableCount,context+' tabla perdida');
    assert.equal(new Set(result.tables.map(x=>x.lemma)).size,result.tableCount,context+' doble tabla');
    assert(!result.tables.some(x=>['unus','nullus'].includes(x.adjective)),
      context+' irregular inadmisible');
    let independentlyChecked=0,sourceChecked=0,wordCells=0;
    for(const item of result.tables){
     const reference=rowsByLemma.get(item.lemma)||[];
     assert.equal(item.nounForms.length,2,context+' '+item.lemma+' dos números');
     assert.equal(item.compoundForms.length,2,context+' '+item.lemma+' sin adjetivo');
     assert(item.nounForms.every(n=>n.length===6),context+' '+item.lemma+' seis casos');
     for(let n=0;n<2;n++)for(let k=0;k<6;k++){
      const actual=normalize(item.nounForms[n][k]);
      const possible=reference.filter(r=>r.tags.includes(cases[k])&&
       r.tags.includes(n?'PL':'SG'));
      if(possible.length){
       assert(possible.some(r=>normalize(r.form)===actual),
        context+' '+item.lemma+' '+cases[k]+' '+(n?'PL':'SG')+
        ' = '+actual+', índice: '+possible.map(r=>r.form).join('/'));
       sourceChecked++;
      }else{
       assert(unknownReferences.has(item.lemma),context+' sin fuente: '+item.lemma);
       assert.equal(actual,independentlyVerified[item.lemma][n][k],
        context+' '+item.lemma+' paradigma independiente');
       independentlyChecked++;
      }
      const surface=normalize(item.compoundForms[n][k]);
      assert(surface.split(' ').includes(actual),
       context+' se ha truncado el sustantivo en '+item.lemma+' '+surface);
      wordCells++;
     }
    }
    assert(sourceChecked>2200,context+' faltan casillas documentadas');
    assert.equal(sourceChecked+independentlyChecked,result.tableCount*12,
     context+' total de formas verificadas');
    const thresholds={latin1:{'1':1,'2m':1,'2n':1,'2er':1,'3mf':4,'3n':4},
     latin4:{'1':1,'2m':2,'2n':2,'2er':2,'3mf':5,'3n':5}}[course];
    for(const [unit,rows] of Object.entries(result.grammaticalUnits)){
     for(const item of rows)assert(Number(unit)>=thresholds[item.kind],
      context+' se anticipó '+item.lemma+' en UD'+unit+' ('+item.kind+')');
    }
    const candidates=new Set(result.byCategory);
    const nounHeads=new Set(result.nounForms.map(x=>x.lemma));
    for(const lemma of ['consul','frater','homo','miles','tempus',
      'corpus','nomen','senator','ver'])
     assert(candidates.has('nouns|'+lemma),context+' ficha verificada perdida '+lemma);
    for(const lemma of result.expectedNounHeads)
     assert(nounHeads.has(lemma),context+' no se ofrecen las formas elegibles de '+
      lemma+' '+JSON.stringify(result.diagnostics));
    assert(result.expectedNounHeads.length>=(course==='latin1'?190:100),
     context+' cobertura nominal insuficiente');
    assert(candidates.has('nouns|latus'),context+' falta latus sustantivo');
    assert(candidates.has('adjectives|latus'),context+' falta latus adjetivo');
    const wantVer=[
     ['ver','ver','ver','veris','veri','vere'],
     ['vera','vera','vera','verum','veribus','veribus']
    ];
    assert.equal(result.ver?.gender,'n',context+' ver no es neutro');
    assert.equal(result.ver?.kind,'3n',context+' ver tipo flexivo');
    assert.deepEqual(result.ver.forms,wantVer,context+' ver 12 formas');
    assert.deepEqual(result.legacyVer?.forms,wantVer,
      context+' fichas locales antiguas aún originan formas falsas');
    if(course==='latin1')for(const form of wantVer.flat())
     assert(result.nounForms.some(x=>x.lemma==='ver'&&normalize(x.form)===form),
      context+' no aparece la forma de ver '+form);
    if(course==='latin4')assert(nounHeads.has('nomen'),
     context+' el enunciado abreviado de nomen no se ha recuperado');
    checks.push({file,course,lang,tables:result.tableCount,sourceChecked,
     independentlyChecked,wordCells,selected:result.selectedCount});
    console.log('LATIN_NOMINAL_AUDIT '+JSON.stringify(checks[checks.length-1]));
   }
   assert.deepEqual(errors,[],file+' excepciones JS');
   await page.close();
  }
  console.log('PASS: repertorio completo, formas contrastadas, 7 exclusiones, homógrafos y cursus LAT1/LAT4 (web/PWA ES/VA)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
