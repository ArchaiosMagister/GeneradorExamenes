'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ledger=load('data/lemmas/revision-candidaturas-lote200-20261113.json');
const bank=load('data/lemmas/teacher-forms.json');
const source=load('data/lemmas/verified-overrides.json');
const old=load('data/lemmas/revision-candidaturas-lote100-20261113.json');
assert.equal(ledger.schema,'examina-individual-candidate-resolution/v2');
assert.equal(ledger.rows.length,200);
assert.equal(ledger.summary.latin,100);
assert.equal(ledger.summary.greek,100);
assert.equal(ledger.summary.promoted,200);
assert.equal(bank.counts.lat.modelo,3244);
assert.equal(bank.counts.grc.wikcionario,859);
assert.equal(bank.counts.lat.contrastado,619);
assert.equal(bank.counts.grc.contrastado,164);
assert.equal(bank.extensions.candidate_rows,3244);
assert.equal(bank.extensions.greek_nominal_candidates.rows,859);
assert.equal(source.singleForms.length,165);
assert.equal(bank.extensions.verifiedIndividualForms,165);
const norm=s=>String(s).normalize('NFD').replace(/\u0345/g,'ι')
 .replace(/\p{M}/gu,'').toLowerCase().replace(/ς/g,'σ');
const sig=r=>[r.language,r.lemma,r.form,r.analysis].join('|');
const before=new Set(old.rows.map(sig)),seen=new Set();
const expected={lat:{accipio:18,facio:18,duco:18,careo:12,disco:12,dux:11,obses:11},
 grc:{'αγαθοσ':30,'δικαιοσ':30,'θαλαττα':10,'ξυλον':10,'πενια':10,'πολεμοσ':10}};
const count={lat:{},grc:{}}, surfaceReadings={lat:new Map(),grc:new Map()};
for(const row of ledger.rows){
 assert(!seen.has(sig(row)),'No admitir análisis duplicado: '+sig(row));seen.add(sig(row));
 assert(!before.has(sig(row)),'El nuevo lote se solapa con el anterior');
 assert.equal(norm(row.form),norm(row.expectedForm));
 assert.equal(row.decision,'INCORPORADA_FUENTE_5_TRAS_CONTRASTE_INDIVIDUAL');
 assert.equal(row.promotedSourceCode,5);
 assert.equal(row.verifiedForm,row.form);
 assert(/^https:\/\/en\.wiktionary\.org\/wiki\//.test(row.reference));
 assert.equal(row.gradeEligible,row.language==='lat'&&['accipio','facio','duco','careo','disco'].includes(row.lemma));
 const lang=row.language,candidate=row.originalSourceCode;
 assert.equal(candidate,lang==='lat'?2:4);
 assert(bank.vocabulary[lang]?.[row.lemma],'Lema no existente: '+row.lemma);
 const matches=bank.rows[lang].filter(x=>x[0]===row.lemma&&x[1]===row.form&&x[2]===row.analysis);
 assert.equal(matches.filter(x=>x[3]===5).length,1,
  'Falta o sobra una lectura fuente 5: '+sig(row));
 assert(!matches.some(x=>x[3]===candidate),'Quedó una propuesta vieja: '+sig(row));
 const sourceReference=bank.source.externalVerification.some(x=>
  x.lang===lang&&x.lemma===row.lemma&&x.reference===row.reference&&
  (['accipio','facio','duco','careo','disco'].includes(row.lemma)||x.form===row.form));
 assert(sourceReference,'La referencia filológica no está en el índice: '+sig(row));
 count[lang][row.lemma]=(count[lang][row.lemma]||0)+1;
 const key=row.lemma+'|'+norm(row.form);
 if(!surfaceReadings[lang].has(key))surfaceReadings[lang].set(key,new Set());
 surfaceReadings[lang].get(key).add(row.analysis);
}
assert.deepEqual(count,expected);
assert.equal(bank.source.externalVerification.length,source.paradigms.length+source.singleForms.length+
 source.paradigms.reduce((n,p)=>n+p.blocks.filter(b=>b.reference).length,0));
for(const lang of ['lat','grc'])for(const [lemma,n]of Object.entries(expected[lang])){
 const units=bank.vocabulary[lang][lemma][lang==='lat'?'lat1':'gr1'].units;
 assert(units.length>0,'Sin asignación curricular: '+lemma);
 const registered=source.paradigms.some(p=>p.lang===lang&&p.lemma===lemma) ||
  source.singleForms.some(p=>p.lang===lang&&p.lemma===lemma);
 assert(registered,'La fuente persistente carece del lema: '+lemma);
}
for(const lemma of ['accipio','facio','duco','careo','disco']){
 const series=source.paradigms.find(p=>p.lang==='lat'&&p.lemma===lemma);
 assert(series);
 assert.equal(series.blocks.length,['careo','disco'].includes(lemma)?2:3);
 for(const block of series.blocks)assert.equal(block.forms.length,6);
}
for(const lemma of ['dux','obses']){
 const records=source.singleForms.filter(r=>r.lang==='lat'&&r.lemma===lemma);
 assert.equal(records.length,11);
 assert(records.some(r=>r.tags==='N;NOM;SG'));
 assert(records.some(r=>r.tags==='N;VOC;SG'));
 assert(!records.some(r=>r.tags==='N;GEN;PL'),
  'No inventar un genitivo plural ausente del lote');
}
for(const lemma of ['αγαθοσ','δικαιοσ']){
 const records=source.singleForms.filter(r=>r.lang==='grc'&&r.lemma===lemma);
 assert.equal(records.length,30);
 for(const num of ['SG','PL'])for(const gender of ['MASC','FEM','NEUT'])
  for(const c of ['NOM','GEN','DAT','ACC','VOC'])
   assert(records.some(r=>r.tags==='ADJ;'+c+';'+num+';'+gender),
    'Falta una de las 30 casillas adjetivales '+lemma+' '+c+' '+num+' '+gender);
}
for(const lemma of ['ξυλον','θαλαττα','πενια','πολεμοσ']){
 const records=source.singleForms.filter(r=>r.lang==='grc'&&r.lemma===lemma);
 assert.equal(records.length,10);
 for(const num of ['SG','PL'])for(const c of ['NOM','GEN','DAT','ACC','VOC'])
  assert(records.some(r=>r.tags==='N;'+c+';'+num));
}
for(const [key,readings]of surfaceReadings.grc){
 // Una forma de adjetivo neutro nom./ac./voc. debe mantener sus 3 etiquetas.
 if(/\|(?:αγαθ|δικαι)/.test(key))continue;
 const row=ledger.rows.find(x=>x.language==='grc'&&key===x.lemma+'|'+norm(x.form));
 if(row&&['ξυλον'].includes(row.lemma)&&row.analysis.endsWith('SG')){
  if(['N;NOM;SG','N;ACC;SG','N;VOC;SG'].some(x=>readings.has(x)))
   assert.equal(['N;NOM;SG','N;ACC;SG','N;VOC;SG'].filter(x=>readings.has(x)).length,3);
 }
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const found=html.match(/const latinExplicitVerbEvidence=(\{[^\n]+\});\nfunction latinExplicitVerbRows/);
assert(found);
const explicit=JSON.parse(found[1]);
for(const lemma of ['accipio','facio','duco','careo','disco']){
 const blocks=source.paradigms.find(p=>p.lang==='lat'&&p.lemma===lemma).blocks;
 assert.equal(explicit[lemma].length,blocks.length);
 blocks.forEach((b,i)=>{
  assert.deepEqual(explicit[lemma][i].forms,b.forms);
  assert.equal(explicit[lemma][i].sourceCode,5);
 });
}
assert(html.includes("latinPersonalPresentPassiveLemmas=new Set([...latinPersonalPerfectPassiveLemmas].filter(x=>x!=='facio'))"),
 'No generar el infectum pasivo de facio como *facior');
console.log('LOTE200: 100 latinas y 100 griegas en fuente 5, evidencia por casilla, no duplicados, currículo y sincretismos conservados');
