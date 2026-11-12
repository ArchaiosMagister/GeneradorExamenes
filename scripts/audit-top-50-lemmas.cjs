#!/usr/bin/env node
'use strict';
/* Audit 50 real pending lemma incidences with stable and reproducible scoring.
 * Source: teacher's 612 Latin I tokens and the 14 preserved Greek I units.
 * "Candidate" never means "individually verified"; no source data are mutated.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const context={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const script of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(script),context,{filename:script,timeout:30000});
const normal=context.window.ExaminaOfflineLemmatizer.normalize;
const engine=context.window.ExaminaVocabulary;
const html=read('index.html'),start=html.indexOf('let vocab=');
assert(start>0);
const bank=JSON.parse(html.slice(start+'let vocab='.length,html.indexOf(';',start)));
for(const match of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 bank.push(...JSON.parse(match[1]));
const banks={
 lat1:bank.filter(x=>!x.course||x.course==='latin1'),
 gr1:bank.filter(x=>x.course==='greek1')
};
const latin=JSON.parse(read('tests/latin1-revision-forms-20261111.json'));
const greek=JSON.parse(read('data/vocabulary/greek1-units-corrected.json'));
const latinPendingBaseline=JSON.parse(read('tests/latin1-pending-183-baseline.json'));
assert(latin.units.length===10&&greek.units.length===14);
const id=(course,form)=>course+'|'+(course==='lat1'?normal(form).replace(/v/g,'u'):String(form).toLowerCase().normalize('NFC'));
const forms=new Map();
const insert=(course,unit,form,line='')=>{
 const key=id(course,form),old=forms.get(key);
 if(old){old.count++;old.units.add(unit);if(line&&!old.contexts.includes(line)&&old.contexts.length<2)old.contexts.push(line);return}
 forms.set(key,{course,unit,form,count:1,units:new Set([unit]),contexts:line?[line]:[]});
};
for(const unit of latin.units)for(const form of unit.forms)insert('lat1',unit.unit,form);
const greekTokenize=t=>[...t.replace(/([\p{L}\p{M}])[’'](?=[\p{L}\p{M}])/gu,'$1 ')
 .matchAll(/[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*/gu)].map(x=>x[0].normalize('NFC'));
for(const [index,unit] of greek.units.entries()){
 for(const line of unit.text.split(/\r?\n/)){
  for(const form of greekTokenize(line))insert('gr1',index+1,form,line.trim());
 }
}
const baselineLatin=new Set(latinPendingBaseline.rows.map(x=>id('lat1',x.form)));
const pending=[],allByCourse={lat1:{},gr1:{}};
for(const course of ['lat1','gr1']){
 const list=[...forms.values()].filter(x=>x.course===course);
 // The 612 Latin tokens came from originally pending forms; the baseline
 // preserves the teacher's 183 still interesting cases for this batch.
 const selected=course==='lat1'?list.filter(x=>baselineLatin.has(id('lat1',x.form))):list;
 const rows=engine.analyze(data,selected.map(x=>x.form).join('\n'),course,banks[course],{contextual:false});
 const analysis=new Map(rows.map(row=>[id(course,row.form),row]));
 for(const row of selected){
  const found=analysis.get(id(course,row.form));
  assert(found,'Missing lemmatizer result for '+course+': '+row.form);
  allByCourse[course][found.status]=(allByCourse[course][found.status]||0)+1;
  if(found.status==='documented')continue;
  const lang=course==='gr1'?'grc':'lat';
  const choices=found.candidates.map(c=>{
   const relevant=data.rows[lang].filter(([lemma,form,,source])=>
    lemma===c.lemma&&normal(form)===normal(row.form)&&source!==3);
   const sources=[...new Set(relevant.map(x=>x[3]))].sort();
   const documentedForms=new Set(data.rows[lang].filter(x=>x[0]===c.lemma&&[0,1,5,6,7].includes(x[3]))
    .map(x=>normal(x[1])));
   return {lemma:c.lemma,entry:c.entry,meaning:c.meaning||'',attestedByEngine:!!c.attested,
    sources,documentedForms:documentedForms.size};
  });
  const bestMorph=Math.max(0,...choices.map(x=>x.documentedForms));
  const bestSource=Math.max(0,...choices.flatMap(x=>x.sources.map(y=>y===5?1:y===0||y===1?0.9:y===6||y===7?0.8:y===2||y===4?0.25:0)));
  const firstUnit=Math.min(...row.units);
  const score={
   frequency:+(30*Math.min(1,Math.log2(row.count+1)/Math.log2(6))).toFixed(2),
   curricular:+(25*(11-Math.min(10,firstUnit))/10).toFixed(2),
   morphological:+(20*Math.min(1,Math.log2(bestMorph+1)/Math.log2(45))).toFixed(2),
   evidence:+(15*bestSource).toFixed(2),
   incident:found.status==='unknown'?10:found.warning?9:found.candidates.length>1?8:7
  };
  pending.push({...row,units:[...row.units].sort((a,b)=>a-b),status:found.status,
   warning:found.warning||'',choices,score,total:+Object.values(score).reduce((a,b)=>a+b,0).toFixed(2)});
 }
}
pending.sort((a,b)=>b.total-a.total||a.unit-b.unit||a.form.localeCompare(b.form,'es'));
const top=pending.slice(0,50);
assert.equal(top.length,50,'Need 50 actually pending incidences');
const category=x=>x.warning?'spelling-or-context':
 x.choices.length>1?'ambiguous-lemmata':
 x.choices.length===1?'only-candidate-needs-evidence':'no-candidate';
const summary={sourceLatinOriginal:latin.units.reduce((n,x)=>n+x.forms.length,0),
 sourceGreekUnits:greek.units.length,pendingByCourse:allByCourse,
 pendingCandidates:pending.length,selected:top.length,selectedByType:Object.fromEntries(
 ['spelling-or-context','ambiguous-lemmata','only-candidate-needs-evidence','no-candidate']
 .map(type=>[type,top.filter(x=>category(x)===type).length]))};
const exportRows=top.map((x,i)=>({rank:i+1,course:x.course,form:x.form,firstUnit:x.unit,
 units:x.units,frequency:x.count,score:x.total,breakdown:x.score,status:x.status,
 category:category(x),options:x.choices.map(({lemma,entry,sources,documentedForms})=>
  ({lemma,entry,sources,documentedForms})),warning:x.warning,contexts:x.contexts}));
const report={schema:1,date:'2026-11-12',source:{
 latin:'tests/latin1-revision-forms-20261111.json',
 pending:'tests/latin1-pending-183-baseline.json',
 greek:'data/vocabulary/greek1-units-corrected.json'},
 scoring:{frequency:30,curricular:25,morphological:20,evidence:15,incidence:10},
 summary,rows:exportRows};
if(process.argv.includes('--print')){
 console.log('TOP50_LEMMA_SUMMARY '+JSON.stringify(summary));
 for(const row of exportRows)console.log('TOP50_LEMMA_ITEM '+JSON.stringify({
  n:row.rank,form:row.form,ud:row.firstUnit,freq:row.frequency,course:row.course,
  category:row.category,score:row.score,options:row.options.map(x=>x.lemma),
  sources:row.options.map(x=>x.sources),warning:row.warning}));
}
if(process.argv.includes('--check')){
 const stored=JSON.parse(read('docs/lematizador-top-50-incidencias.json'));
 assert.equal(stored.schema,1);
 assert.equal(stored.rows.length,50,'El informe debe tener 50 registros');
 assert.equal(stored.summary.selected,50);
 for(const [i,row] of exportRows.entries()){
  const recorded=stored.rows[i];
  assert.equal(recorded.course,row.course,'El orden y los cursos de la cola han cambiado');
  assert.equal(recorded.form,row.form,'La forma de revisión ha cambiado');
  assert.equal(recorded.firstUnit,row.firstUnit,'La unidad de la incidencia ha cambiado');
  assert.equal(recorded.status,row.status,'La clasificación de incidencia ha cambiado');
 }
 console.log('TOP50_LEMMA_REVIEW_OK 50 incidencias reales, estados y unidades coherentes');
}
if(process.argv.includes('--export'))console.log('TOP50_LEMMA_JSON '+JSON.stringify(report));
module.exports={report,top,category};
