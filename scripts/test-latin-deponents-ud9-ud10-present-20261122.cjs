'use strict';
// Fuente 5: únicamente 24 presentes deponentes de UD9-10, sin analogías ni sincretismos -re.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const corpus=JSON.parse(read('data/lemmas/teacher-forms.json'));
const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
const html=read('index.html');
const expected={
 gratulor:['gratulor','gratularis','gratulatur','gratulamur','gratulamini','gratulantur'],
 miror:['miror','miraris','miratur','miramur','miramini','mirantur'],
 polliceor:['polliceor','polliceris','pollicetur','pollicemur','pollicemini','pollicentur'],
 patior:['patior','pateris','patitur','patimur','patimini','patiuntur']
};
const ambiguity={
 gratulor:'gratulare',miror:'mirare',polliceor:'pollicere',patior:'patere'
};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const m=html.match(/const latinExplicitVerbEvidence=(\{[^\n]+\});\nfunction latinExplicitVerbRows/);
assert(m,'Falta la tabla explícita de evidencia verbal');
const evidence=JSON.parse(m[1]);
for(const [lemma,forms] of Object.entries(expected)){
 const source=overrides.paradigms.filter(x=>x.lang==='lat'&&x.lemma===lemma);
 assert.equal(source.length,1,'Referencia única de '+lemma);
 assert(/^https:\/\//.test(source[0].reference)&&/^https:\/\//.test(source[0].secondaryReference));
 assert.equal(source[0].blocks.length,1,'No ampliar a otros tiempos: '+lemma);
 assert.equal(source[0].blocks[0].tags,'V;IND;DEP;PRS');
 assert.deepEqual(source[0].blocks[0].forms,forms,'Seis formas documentadas: '+lemma);
 assert.deepEqual(evidence[lemma],[{tense:'presente',voice:'deponente',forms,sourceCode:5}],'Evidencia visible: '+lemma);
 assert(corpus.vocabulary.lat[lemma].lat1.units.includes('UD 9–10'),'No adelantar en el índice curricular: '+lemma);
 const five=corpus.rows.lat.filter(x=>x[0]===lemma&&x[3]===5);
 assert.equal(five.length,6+(lemma==='miror'?1:0),'Conservar participio de miror además de seis presentes: '+lemma);
 const present=five.filter(x=>x[2].startsWith('V;IND;DEP;PRS;'));
 assert.equal(present.length,6,'Fuente 5: seis presentes exactamente: '+lemma);
 if(lemma==='miror')assert.deepEqual(five.filter(x=>!x[2].startsWith('V;IND;DEP;PRS;')),
  [['miror','mirati','V;PTCP;ACT;PRF;NOM;PL;MASC',5]],'Preservar fuente participial previa');
 for(let i=0;i<6;i++){
  const tag='V;IND;DEP;PRS;'+(i%3+1)+';'+(i<3?'SG':'PL');
  assert.equal(present.filter(x=>x[1]===forms[i]&&x[2]===tag).length,1,lemma+' '+tag);
 }
 assert(!five.some(x=>norm(x[1])===ambiguity[lemma]),'Excluida variante sincrética: '+lemma);
 const historical=corpus.rows.lat.filter(x=>x[0]===lemma&&x[3]===0);
 for(const tag of ['V;IND;ACT;PRS;2;SG','V;IMP;ACT;PRS;2;SG'])
  assert(historical.some(x=>norm(x[1])===ambiguity[lemma]&&x[2]===tag),
   'Proteger presente/imperativo en -re: '+lemma);
}
for(const lemma of ['orior','revertor','obliviscor','nascor','utor']){
 assert(!evidence[lemma],'No certificar tiempo ni voz por analogía: '+lemma);
 assert.equal(corpus.rows.lat.filter(x=>x[0]===lemma&&x[3]===5).length,0,
  'Sin promociones históricas: '+lemma);
}
assert.equal(corpus.counts.lat.contrastado,667,'643+24 fuentes 5 latinas');
assert.equal(corpus.rows.lat.length,14555,'14531+24 filas latinas');
assert.equal(Object.values(expected).flat().length,24);
if(process.argv.includes('--source-only')){
 console.log('PASS: 24 presentes UD9-10, 4 variantes -re excluidas y 5 lemas protegidos.');
 process.exit(0);
}
(async()=>{
 const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1240,height:900}});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
   for(const lang of ['es','va']){
    const result=await page.evaluate(({lang,lemmas})=>{
     const set=(id,val)=>{const el=document.getElementById(id);el.value=val;el.dispatchEvent(new Event('change',{bubbles:true}));};
     set('course','latin1');set('model','morf');set('lang',lang);
     const key=x=>examKey(x.entry);
     const before=latinMorphologyVerbPool(['UD6']);
     const beforeForms=latinExamFormCandidates(['UD6'],true)[2];
     const fromSeven=latinMorphologyVerbPool(['UD7']);
     const sevenForms=latinExamFormCandidates(['UD7'],true)[2];
     const later=[...lemmas,'loquor','sequor'];
     const current=latinMorphologyVerbPool(['UD9–10']);
     const forms=latinExamFormCandidates(['UD9–10'],true)[2];
     const variants={gratulor:'gratulare',miror:'mirare',polliceor:'pollicere',patior:'patere'};
     return {
      oldUnits:before.every(x=>!later.includes(key(x)))&&beforeForms.every(x=>!later.includes(key(x))),
      grammarAtSeven:later.every(lemma=>fromSeven.some(x=>key(x)===lemma&&x.voice==='deponente')&&
       sevenForms.some(x=>key(x)===lemma&&/deponente/.test(String(x.answer||'')))),
      present:lemmas.every(lemma=>current.some(x=>key(x)===lemma&&x.sourceCode===5&&x.voice==='deponente')),
      forms:lemmas.every(lemma=>forms.some(x=>key(x)===lemma&&/deponente/.test(String(x.answer||'')))),
      variants:current.every(x=>!(variants[key(x)]&&normLex(x.form)===variants[key(x)]))&&
       forms.every(x=>!(variants[key(x)]&&normLex(x.form)===variants[key(x)])),
      withheld:current.every(x=>!['revertor','orior','obliviscor'].includes(key(x)))&&
       forms.every(x=>!['revertor','orior','obliviscor'].includes(key(x))),
      noAnalogy:lemmas.every(lemma=>!mVerb(vocab.find(x=>examKey(x.entry)===lemma)?.entry)),
      visible:!!document.getElementById('paper')
     };
    },{lang,lemmas:Object.keys(expected)});
    assert(Object.values(result).every(Boolean),file+'/'+lang+' '+JSON.stringify(result));
   }
   assert.deepEqual(errors,[],file+' errores JS');
   await page.close();
  }
  console.log('PASS: web/offline ES/VA, cuatro presentes desde UD9-10, sin anticipos ni ambigüedad.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
