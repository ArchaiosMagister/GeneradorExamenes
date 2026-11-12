#!/usr/bin/env node
'use strict';
/* Third batch of actual teacher-corpus Latin I forms.
 * Covers exactly 100 previously UNAUDITED spellings; there is no fabricated
 * corpus, no automatic morphological promotion and no cross-unit inference.
 * The earlier 50+100 editorial reviews remain immutable.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const corpus=JSON.parse(read('tests/latin1-revision-forms-20261111.json'));
const preceding=[
 ...JSON.parse(read('docs/lematizador-top-50-incidencias.json')).rows,
 ...JSON.parse(read('docs/lematizador-next-100-incidencias.json')).rows
];
const d=JSON.parse(read('data/lemmas/teacher-forms.json'));
const host={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const script of ['offline-lemmas.js','vocabulary-generator.js'])vm.runInNewContext(read(script),host,{filename:script,timeout:30000});
const normalize=host.window.ExaminaOfflineLemmatizer.normalize;
const key=form=>normalize(form).replace(/v/g,'u');
const api=host.window.ExaminaVocabulary;
const html=read('index.html'),start=html.indexOf('let vocab=');
assert(start>=0);
const bank=JSON.parse(html.slice(start+10,html.indexOf(';',start)));
for(const found of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(found[1]));
const teachers=bank.filter(row=>!row.course||row.course==='latin1');
const previous=new Set(preceding.map(x=>key(x.form)));
const forms=new Map();
for(const unit of corpus.units)for(const form of unit.forms){
 const id=key(form),row=forms.get(id)||{form,course:'lat1',unit:unit.unit,frequency:0,units:new Set()};
 row.frequency++;row.units.add(unit.unit);
 forms.set(id,row);
}
const sourceByForm=new Map(),coverageByLemma=new Map();
for(const [lemma,form,tags,source] of d.rows.lat){
 const k=key(form),bucket=sourceByForm.get(k)||[];
 bucket.push([lemma,form,tags,source]);sourceByForm.set(k,bucket);
 if([0,1,5,6,7].includes(source)){
  const x=coverageByLemma.get(lemma)||new Set();x.add(k);coverageByLemma.set(lemma,x);
 }
}
function analyze(form){
 const found=api.analyze(d,form,'lat1',teachers,{contextual:true})[0];
 assert(found&&key(found.form)===key(form),'La forma dejó de tokenizarse: '+form);
 return found;
}
const scored=[];
for(const row of forms.values()){
 if(previous.has(key(row.form)))continue;
 const found=analyze(row.form),sources=sourceByForm.get(key(row.form))||[];
 const options=found.candidates.map(x=>({
  lemma:x.lemma,entry:x.entry,meaning:x.meaning||'',
  attested:!!x.attested,
  rows:sources.filter(y=>y[0]===x.lemma).map(y=>({tags:y[2],source:y[3]})),
  lemmaAttestedForms:coverageByLemma.get(x.lemma)?.size||0
 }));
 const alreadyIndividuallyCertified=sources.some(x=>x[3]===5&&options.some(c=>c.lemma===x[0]));
 if(alreadyIndividuallyCertified)continue;
 const firstUnit=Math.min(...row.units);
 const best=Math.max(0,...options.map(x=>x.lemmaAttestedForms));
 const bestSource=sources.some(x=>x[3]===0||x[3]===1)?0.9:
  sources.some(x=>x[3]===6||x[3]===7)?0.8:
  sources.some(x=>x[3]===2||x[3]===4)?0.25:0;
 const score={
  frequency:+(30*Math.min(1,Math.log2(row.frequency+1)/Math.log2(6))).toFixed(2),
  curricular:+(25*(11-Math.min(10,firstUnit))/10).toFixed(2),
  morphology:+(20*Math.min(1,Math.log2(best+1)/Math.log2(45))).toFixed(2),
  evidence:+(15*bestSource).toFixed(2),
  incident:found.warning?9:found.status==='unknown'?10:
   found.status==='review'?(options.length>1?8:7):3
 };
 scored.push({
  course:'lat1',form:row.form,firstUnit,units:[...row.units].sort((a,b)=>a-b),
  frequency:row.frequency,previousStatus:found.status,warning:found.warning||'',
  options,sources:[...new Set(sources.map(x=>x[3]))].sort(),
  score,total:+Object.values(score).reduce((a,b)=>a+b,0).toFixed(2)
 });
}
const pending=scored.filter(x=>x.previousStatus!=='documented').sort((a,b)=>b.total-a.total||a.firstUnit-b.firstUnit||a.form.localeCompare(b.form,'es'));
const recognized=scored.filter(x=>x.previousStatus==='documented').sort((a,b)=>b.total-a.total||a.firstUnit-b.firstUnit||a.form.localeCompare(b.form,'es'));
const top=[...pending,...recognized].slice(0,100);
assert.equal(top.length,100,'No se han encontrado 100 formas NUEVAS en el corpus docente');
assert.equal(new Set(top.map(x=>key(x.form))).size,100);
const categories={};
const category=r=>r.warning?'spelling-or-context':
 r.previousStatus==='unknown'?'unknown':
 r.previousStatus==='review'?(r.options.length>1?'ambiguous':'unverified-proposal'):
 'recognized-awaits-individual-check';
const rows=top.map((x,i)=>({rank:i+1,course:'lat1',form:x.form,firstUnit:x.firstUnit,
 units:x.units,frequency:x.frequency,priorStatus:x.previousStatus,category:category(x),
 score:x.total,scoreParts:x.score,
 options:x.options.map(y=>({lemma:y.lemma,entry:y.entry,attested:y.attested,sources:y.rows.map(z=>z.source)})),
 warning:x.warning}));
for(const x of rows)categories[x.category]=(categories[x.category]||0)+1;
const summary={sourceTokens:corpus.units.reduce((n,x)=>n+x.forms.length,0),
 previouslyAudited:previous.size,newCandidates:scored.length,
 pendingNew:pending.length,recognizedNew:recognized.length,selected:100,categories};
if(process.argv.includes('--print')){
 console.log('THIRD100_SUMMARY '+JSON.stringify(summary));
 for(const item of rows)console.log('THIRD100_ITEM '+JSON.stringify({
  rank:item.rank,form:item.form,unit:item.firstUnit,frequency:item.frequency,
  priorStatus:item.priorStatus,category:item.category,score:item.score,
  candidates:item.options.map(x=>x.lemma),sources:item.options.map(x=>x.sources),
  warning:item.warning}));
}
if(process.argv.includes('--check')){
 const stored=JSON.parse(read('docs/lematizador-third-100-incidencias.json'));
 assert.equal(stored.schema,1);
 assert.equal(stored.summary.reviewed,100);
 assert.equal(stored.rows.length,100);
 const chosen=new Set();
 const tallies={};
 const singles=JSON.parse(read('data/lemmas/verified-overrides.json')).singleForms;
 for(const x of stored.rows){
  assert(!previous.has(key(x.form)),'Caso del lote anterior: '+x.form);
  assert(!chosen.has(key(x.form)),'Caso duplicado: '+x.form);
  chosen.add(key(x.form));
  const now=analyze(x.form),decision=x.decision;
  tallies[decision.status]=(tallies[decision.status]||0)+1;
  if(decision.status==='newly-verified'){
   assert(singles.some(s=>s.lemma===decision.lemma&&key(s.form)===key(x.form)&&
    s.tags===decision.tags&&s.reference===decision.reference),'Falta respaldo editorial de '+x.form);
   assert(d.rows.lat.some(s=>s[0]===decision.lemma&&key(s[1])===key(x.form)&&
    s[2]===decision.tags&&s[3]===5),'Falta índice contrastado de '+x.form);
   assert(now.candidates.some(c=>c.lemma===decision.lemma&&c.attested),'No se reconoce la lectura acreditada: '+x.form);
  }else if(decision.status==='already-recognized'){
   assert.equal(x.initialStatus,'documented');
   assert.equal(now.status,'documented','Retroceso en una forma documentada: '+x.form);
  }else if(decision.status==='needs-teacher-context'){
   assert.notEqual(now.status,'documented','Homógrafo resuelto globalmente sin contexto: '+x.form);
  }else if(decision.status==='needs-external-evidence'){
   assert.notEqual(now.status,'documented','Forma aprobada sin fuente individual: '+x.form);
  }else throw Error('Estado editorial desconocido: '+decision.status);
 }
 assert.equal(Object.entries(tallies).sort().map(x=>x.join(':')).join('|'),
  Object.entries(stored.summary.states).sort().map(x=>x.join(':')).join('|'),'El balance de 100 fichas no coincide');
 console.log('THIRD100_REVIEW_OK '+JSON.stringify({reviewed:100,tallies}));
}
module.exports={summary,rows};
