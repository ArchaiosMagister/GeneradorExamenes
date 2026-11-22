'use strict';
// Filología: dos correcciones editoriales y 24 casillas del presente contrastadas.
// Fuente 0 = testimonio histórico, NO acreditación de otras formas evaluables.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const standalone=read('offline.html');
const corpus=JSON.parse(read('data/lemmas/teacher-forms.json'));
const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
const sandbox={window:{}};
vm.runInNewContext(read('required-latin-units.js'),sandbox);
const required=JSON.parse(JSON.stringify(sandbox.window.ExaminaRequiredLatinUnits.courses));
const a=html.indexOf('let vocab='),b=html.indexOf(';\n',a);
assert(a>0&&b>a,'Banco Latín I ausente de la web');
const vocab=JSON.parse(html.slice(a+'let vocab='.length,b));
const cases=[
 {lemma:'complector',unit:'UD7',before:'complector, complectus sum (3ª)',
  after:'complector, complexus sum (3ª)',
  source:'https://fr.wikisource.org/wiki/Page%3AGaffiot_-_Dictionnaire_illustr%C3%A9_Latin-Fran%C3%A7ais.djvu/370'},
 {lemma:'patior',unit:'UD9–10',before:'patior, passus sum (4ª)',
  after:'patior, passus sum (mx.)',
  source:'https://odysseum.eduscol.education.fr/les-modeles-de-conjugaison'}
];
const entry=(lemma)=>corpus.vocabulary.lat[lemma]?.lat1?.entry;
const vocabUnits=lemma=>corpus.vocabulary.lat[lemma]?.lat1?.units||[];
for(const x of cases){
 assert.equal(entry(x.lemma),x.after,x.lemma+' índice docente');
 assert(vocab.some(y=>y.unit===x.unit&&y.entry===x.after),x.lemma+' banco web');
 assert(!vocab.some(y=>y.entry===x.before),x.lemma+' queda enunciado anterior');
 assert(required.latin1[x.unit]?.includes(x.after),x.lemma+' lista exigible');
 assert(!Object.values(required.latin1).flat().includes(x.before),x.lemma+' lista antigua');
 assert(vocabUnits(x.lemma).includes('UD '+x.unit.replace('UD','').trim()),
  x.lemma+' unidad del índice');
 for(const source of [html,standalone]) {
  assert(source.includes(x.after),x.lemma+' no aparece corregido en un HTML');
  assert(!source.includes(x.before),x.lemma+' aparece obsoleto en un HTML');
 }
 const corr=overrides.entryCorrections.filter(y=>y.lang==='lat'&&y.lemma===x.lemma&&y.course==='lat1');
 assert.equal(corr.length,1,x.lemma+' corrección persistente única');
 assert.equal(corr[0].from,x.before);assert.equal(corr[0].to,x.after);
 assert.equal(corr[0].reference,x.source);
 const nVerified=['complector','patior'].includes(x.lemma)?6:0;
 assert.equal(overrides.paradigms.filter(y=>y.lang==='lat'&&y.lemma===x.lemma).length,nVerified?1:0,
  x.lemma+' solo bloques contrastados');
 assert.equal(corpus.rows.lat.filter(y=>y[0]===x.lemma&&y[3]===5).length,nVerified,
  x.lemma+' no promover formas no documentadas');
}
assert(corpus.rows.lat.some(x=>x[0]==='complector'&&x[1]==='complexus'&&x[3]===0),
 'Gaffiot complexus también aparece en registro histórico sin promoción');
for(const lemma of ['complector','conor','intueor','laetor','proficiscor','vereor']){
 assert(vocabUnits(lemma).includes('UD 7'),'Ausente del repertorio UD7: '+lemma);
}
const evidenceMatch=html.match(/const latinExplicitVerbEvidence=(\{[^\n]+\});\nfunction latinExplicitVerbRows/);
assert(evidenceMatch,'Tabla de evidencia verbal alterada');
const evidence=JSON.parse(evidenceMatch[1]);
assert.equal(evidence.conor?.length,1,'No ampliar conor sin contraste');
assert.equal(evidence.proficiscor?.length,3,'Conservar solo tres tiempos contrastados');
const attested={
  complector:['complector','complecteris','complectitur','complectimur','complectimini','complectuntur'],
  intueor:['intueor','intueris','intuetur','intuemur','intuemini','intuentur'],
  laetor:['laetor','laetaris','laetatur','laetamur','laetamini','laetantur'],
  vereor:['vereor','vereris','veretur','veremur','veremini','verentur']
};
for(const [lemma,forms] of Object.entries(attested)){
 const record=overrides.paradigms.find(x=>x.lang==='lat'&&x.lemma===lemma);
 assert(record&&/^https:\/\//.test(record.reference),lemma+' referencia externa');
 assert.equal(record.blocks.length,1,lemma+' solo presente');
 assert.equal(record.blocks[0].tags,'V;IND;DEP;PRS');
 assert.deepEqual(record.blocks[0].forms,forms,lemma+' casillas de las dos fuentes');
 assert.equal(evidence[lemma].length,1,lemma+' sin otros tiempos inventados');
 assert.equal(evidence[lemma][0].sourceCode,5);
 assert.equal(evidence[lemma][0].voice,'deponente');
 assert.deepEqual(evidence[lemma][0].forms,forms);
 for(const [i,form] of forms.entries()){
  const person=(i%3)+1,num=i<3?'SG':'PL';
  const tag='V;IND;DEP;PRS;'+person+';'+num;
  assert.equal(corpus.rows.lat.filter(x=>x[0]===lemma&&x[1]===form&&x[2]===tag&&x[3]===5).length,1,
   lemma+' fuente 5 '+form+' '+tag);
 }
 assert.equal(corpus.rows.lat.filter(x=>x[0]===lemma&&x[3]===5).length,6,
  lemma+' no autorizar más tiempos');
}
assert(evidence.patior?.length===1&&!evidence.orior,'Patior presente acreditado; orior no promovido');
assert.equal(corpus.vocabulary.lat.orior?.lat1?.entry,'orior, ortus sum (4ª)',
 'El lema orior conserva la clasificación escolar con variantes del presente');
for(const lemma of ['orior']){
 assert(!overrides.paradigms.some(x=>x.lang==='lat'&&x.lemma===lemma),
  'No acreditar por analogía un verbo con formas mixtas: '+lemma);
 assert(corpus.rows.lat.some(x=>x[0]===lemma),'Ausente del índice: '+lemma);
 assert(corpus.rows.lat.filter(x=>x[0]===lemma).every(x=>x[3]===0),
  'Orior solo tiene fuente histórica: '+lemma);
}
assert(html.includes("'complector|complecteris'"),
 'La segunda singular de complector también es futuro y debe bloquearse sin contexto');
assert.equal(corpus.counts.lat.contrastado,667,'Fuente 5 latina suma 24 formas UD7 y 24 formas UD9-10');
const iv=corpus.rows.lat.filter(x=>x[0]==='patior');
assert.equal(iv.filter(x=>x[3]===5).length,6,'Patior: exactamente seis presentes de fuente 5');
const m=html.slice(html.indexOf('function mVerb(raw){'),html.indexOf('// Corrections for conjugation:',html.indexOf('function mVerb(raw){')));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/[–−—]/g,'-').trim();
const conjugate=new Function('mNormalize',m+'return mVerb;')(norm);
assert.equal(conjugate(cases[0].after),null,'Complector no puede conjugarse como activo regular');
assert.equal(conjugate(cases[1].after),null,'Patior no puede conjugarse como activo mixto');
if(process.argv.includes('--source-only')){
 console.log('PASS: 2 enunciados, 24 casillas presentes contrastadas, 6 lemas UD7, sin otros tiempos');
 process.exit(0);
}
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1350,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
   for(const lang of ['es','va']){
    const result=await page.evaluate((lang)=>{
     const set=(id,v)=>{const el=document.getElementById(id);el.value=v;
      el.dispatchEvent(new Event('change',{bubbles:true}));};
     set('course','latin1');set('model','morf');set('lang',lang);
     const required=window.ExaminaRequiredLatinUnits.courses.latin1;
     return {
      texts:['complector, complexus sum (3ª)','patior, passus sum (mx.)']
       .map(t=>Object.values(required).some(v=>v.includes(t))),
      currentVocab:['complector, complexus sum (3ª)','patior, passus sum (mx.)']
       .map(t=>vocab.some(x=>x.entry===t)),
      noAnalogy:!mVerb('complector, complexus sum (3ª)')&&
       !mVerb('patior, passus sum (mx.)'),
      blocked:latinMorphologyVerbPool(['UD7']).every(x=>examKey(x.entry)!=='patior'),
      notPromoted:latinMorphologyVerbPool(['UD9–10']).every(x=>
       examKey(x.entry)!=='orior')&&
       latinExamFormCandidates(['UD9–10'],true)[2].every(x=>
        examKey(x.entry)!=='orior'),
      accredited:['complector','intueor','laetor','vereor'].every(lemma=>
       latinMorphologyVerbPool(['UD7']).some(x=>examKey(x.entry)===lemma&&x.sourceCode===5&&x.voice==='deponente')),
      tooEarly:latinMorphologyVerbPool(['UD6']).every(x=>
       !['complector','intueor','laetor','vereor'].includes(examKey(x.entry))),
      ambiguous:latinMorphologyVerbPool(['UD7']).every(x=>
       examKey(x.entry)!=='complector'||normLex(x.form)!=='complecteris')&&
       latinExamFormCandidates(['UD7'],true)[2].every(x=>
        examKey(x.entry)!=='complector'||normLex(x.form)!=='complecteris'),
      visible:!!document.getElementById('paper')
     };
    },lang);
    assert(result.texts.every(Boolean),file+'/'+lang+' exigibles');
    assert(result.currentVocab.every(Boolean),file+'/'+lang+' banco');
    assert(result.noAnalogy&&result.blocked&&result.notPromoted&&result.accredited&&result.tooEarly&&
     result.ambiguous&&result.visible,file+'/'+lang+' currículo, presencia y sincretismo');
   }
   assert.deepEqual(errors,[],file+' errores JS');
   await page.close();
  }
  console.log('PASS: 24 formas documentadas, currículo y sincretismo, web/autónoma ES/VA');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
