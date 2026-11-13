#!/usr/bin/env node
'use strict';
/*
 * Second editorial batch: 100 NEW real Latin I items, excluding the previous
 * 50 reviewed forms. First take all remaining unresolved cases, then the
 * highest-impact forms functionally recognized but not individually verified.
 * Scores are prioritization, not morphological certification.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const corpus=JSON.parse(read('tests/latin1-revision-forms-20261111.json'));
const baseline=JSON.parse(read('tests/latin1-pending-183-baseline.json'));
const earlier=JSON.parse(read('docs/lematizador-top-50-incidencias.json'));
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const host={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const p of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(p),host,{filename:p,timeout:30000});
const normalize=host.window.ExaminaOfflineLemmatizer.normalize;
const key=s=>normalize(s).replace(/v/g,'u');
const engine=host.window.ExaminaVocabulary;
const html=read('index.html'),start=html.indexOf('let vocab=');
assert(start>=0);
const bank=JSON.parse(html.slice(start+10,html.indexOf(';',start)));
for(const match of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 bank.push(...JSON.parse(match[1]));
const teacher=bank.filter(row=>!row.course||row.course==='latin1');
const prior=new Set(earlier.rows.map(r=>key(r.form)));
const byKey=new Map();
for(const unit of corpus.units)for(const form of unit.forms){
 const k=key(form),item=byKey.get(k)||{forms:new Set(),frequency:0,units:new Set()};
 item.forms.add(form);item.frequency++;item.units.add(unit.unit);
 byKey.set(k,item);
}
const records=[];
for(const candidate of baseline.rows){
 const k=key(candidate.form);
 if(prior.has(k)||records.some(r=>key(r.form)===k))continue;
 const item=byKey.get(k);
 assert(item,'A baseline item is absent from teacher corpus: '+candidate.form);
 records.push({form:candidate.form,unit:Math.min(...item.units),units:[...item.units].sort((a,b)=>a-b),
  frequency:item.frequency,priorStatus:candidate.priorStatus,priorCandidates:candidate.priorCandidates});
}
const indexByForm=new Map(),attestedByLemma=new Map();
for(const [lemma,form,tags,source] of data.rows.lat){
 const k=key(form),item=indexByForm.get(k)||[];
 item.push({lemma,tags,source});indexByForm.set(k,item);
 if([0,1,5,6,7].includes(source)){
  const f=attestedByLemma.get(lemma)||new Set();f.add(k);attestedByLemma.set(lemma,f);
 }
}
function analyze(form){const row=engine.analyze(data,form,'lat1',teacher,{contextual:true})[0];
 assert(row&&key(row.form)===key(form),'Missing result for '+form);
 return row;
}
function scored(r){
 const row=analyze(r.form),currentRows=indexByForm.get(key(r.form))||[];
 const sources=[...new Set(currentRows.map(x=>x.source))].sort();
 const proofs=currentRows.filter(x=>x.source===5);
 const options=row.candidates.map(x=>({lemma:x.lemma,entry:x.entry,meaning:x.meaning||'',
  attested:!!x.attested,sources:[...new Set(currentRows.filter(y=>y.lemma===x.lemma).map(y=>y.source))],
  documentedForms:attestedByLemma.get(x.lemma)?.size||0}));
 const best=Math.max(0,...options.map(x=>x.documentedForms));
 const evidence=sources.includes(5)?1:sources.some(s=>s===0||s===1)?0.85:
  sources.some(s=>s===6||s===7)?0.8:sources.some(s=>s===2||s===4)?0.25:0;
 const score={frequency:+(30*Math.min(1,Math.log2(r.frequency+1)/Math.log2(6))).toFixed(2),
  curricular:+(25*(11-Math.min(10,r.unit))/10).toFixed(2),
  morphological:+(20*Math.min(1,Math.log2(best+1)/Math.log2(45))).toFixed(2),
  evidence:+(15*evidence).toFixed(2),
  incident:row.warning?9:row.status==='unknown'?10:row.status==='review'?(options.length>1?8:7):3};
 return {...r,status:row.status,warning:row.warning||'',options,sources,
  individuallyVerified:proofs.length>0,
  score,total:+Object.values(score).reduce((a,b)=>a+b,0).toFixed(2)};
}
const classified=records.map(scored);
const pending=classified.filter(r=>r.status!=='documented').sort((a,b)=>b.total-a.total||a.unit-b.unit||a.form.localeCompare(b.form,'es'));
const recognized=classified.filter(r=>r.status==='documented'&&!r.individuallyVerified)
 .sort((a,b)=>b.total-a.total||a.unit-b.unit||a.form.localeCompare(b.form,'es'));
const select=[...pending,...recognized].slice(0,100);
assert.equal(select.length,Math.min(100,pending.length+recognized.length),
 'La selección de pendientes debe contraerse conforme se documentan formas nuevas');
assert(select.every((x,i)=>select.findIndex(y=>key(y.form)===key(x.form))===i),'Fichas repetidas');
function issue(r){
 if(r.warning)return 'spelling-or-context';
 if(r.status==='unknown')return 'unknown';
 if(r.status==='review')return r.options.length>1?'ambiguous':'unverified-proposal';
 return 'recognized-awaits-independent-check';
}
const summary={previousBatch:earlier.rows.length,
 remainingSourceForms:records.length,pendingNotInEarlierBatch:pending.length,
 recognizedNotIndividuallyVerified:recognized.length,selected:select.length,
 selectedByCategory:Object.fromEntries(['ambiguous','spelling-or-context','unverified-proposal',
  'unknown','recognized-awaits-independent-check'].map(t=>[t,select.filter(x=>issue(x)===t).length]))};
const rows=select.map((x,i)=>({rank:i+1,course:'lat1',form:x.form,firstUnit:x.unit,
 units:x.units,frequency:x.frequency,score:x.total,breakdown:x.score,
 status:x.status,category:issue(x),priorStatus:x.priorStatus,
 options:x.options.map(({lemma,entry,sources,documentedForms})=>({lemma,entry,sources,documentedForms})),
 sources:x.sources,warning:x.warning}));
const report={schema:1,date:'2026-11-12',selection:'Unresolved first, then already recognized forms pending independent verification',
 source:{baseline:'tests/latin1-pending-183-baseline.json',
  originalCorpus:'tests/latin1-revision-forms-20261111.json',
  previousBatch:'docs/lematizador-top-50-incidencias.json'},
 weights:{frequency:30,curricular:25,morphological:20,evidence:15,incident:10},summary,rows};
if(process.argv.includes('--print')){
 console.log('TOP100_SUMMARY '+JSON.stringify(summary));
 for(const row of rows)console.log('TOP100_ITEM '+JSON.stringify({
  rank:row.rank,form:row.form,ud:row.firstUnit,freq:row.frequency,status:row.status,
  category:row.category,score:row.score,source:row.sources,
  options:row.options.map(x=>x.lemma),warning:row.warning}));
}
if(process.argv.includes('--check')){
 const saved=JSON.parse(read('docs/lematizador-next-100-incidencias.json'));
 assert.equal(saved.rows.length,100);
 assert.equal(saved.summary.reviewed,100);
 assert.equal(new Set(saved.rows.map(x=>key(x.form))).size,100);
 assert(saved.rows.every(x=>!prior.has(key(x.form))),'El segundo lote repite un elemento ya revisado');
 const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
 const singles=overrides.singleForms||[];
 const states={};
 for(const row of saved.rows){
  const now=analyze(row.form),d=row.decision;
  states[d.status]=(states[d.status]||0)+1;
  if(d.status==='verified-individual-form'){
   assert.equal(now.status,'documented','La acreditación dejó de reconocerse: '+row.form);
   assert.equal(now.lemma,d.lemma,'Lema contradictorio: '+row.form);
   assert(singles.some(x=>x.lemma===d.lemma&&key(x.form)===key(row.form)&&
    x.reference===d.reference&&x.tags===d.tags),
    'Falta ficha en la fuente persistente: '+row.form);
   assert(data.rows.lat.some(x=>x[0]===d.lemma&&key(x[1])===key(row.form)&&
    x[2]===d.tags&&x[3]===5),'Falta acreditación en el índice: '+row.form);
   assert(data.source.externalVerification.some(x=>x.lemma===d.lemma&&
    key(x.form)===key(row.form)&&x.reference===d.reference),
    'Falta la referencia en el índice: '+row.form);
  }else if(d.status==='already-recognized'){
   assert.equal(row.previousStatus,'documented');
   assert.equal(now.status,'documented','Regresión de reconocimiento: '+row.form);
  }else{
   assert.notEqual(now.status,'documented','Pendiente resuelta sin documentación: '+row.form);
   if(d.status==='teacher-context-needed')
    assert(now.candidates.length>1,'La homografía perdió alternativas: '+row.form);
   if(d.status==='teacher-orthography-needed')
    assert(now.warning,'La advertencia gráfica desapareció: '+row.form);
  }
 }
 assert.deepEqual(states,saved.summary.states,'Descuadre en la clasificación editorial del lote');
 console.log('TOP100_REVIEW_OK '+JSON.stringify({reviewed:100,states}));
}
module.exports={report,rows};
