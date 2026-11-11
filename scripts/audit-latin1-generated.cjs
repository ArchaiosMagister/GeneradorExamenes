#!/usr/bin/env node
/* Regression corpus extracted from the teacher's Latin I generated vocabulary.
 * Coverage measurements do not certify morphology or revise the source texts.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const corpus=JSON.parse(read('tests/latin1-revision-forms-20261111.json'));
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const env={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const script of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(script),env,{filename:script});
const api=env.window.ExaminaVocabulary;
const html=read('index.html'),start=html.indexOf('let vocab=')+'let vocab='.length;
assert.ok(start>10);
const vocab=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))vocab.push(...JSON.parse(m[1]));
const latinBank=vocab.filter(x=>!x.course||x.course==='latin1');
assert.ok(latinBank.length>900,'El banco latino del curso parece incompleto');
const normalize=env.window.ExaminaOfflineLemmatizer.normalize;
const results=[],byUnit=[];
for(const u of corpus.units){
 const rows=api.analyze(data,u.forms.join('\n'),'lat1',latinBank);
 const lookup=new Map(rows.map(r=>[normalize(r.form),r]));
 let pending=0,recognized=0,unknown=0,review=0;
 for(const form of u.forms){
  const item=lookup.get(normalize(form));
  assert.ok(item,'No se ha tokenizado '+u.unit+': '+form);
  const status=item.status;
  if(status==='documented')recognized++;
  else{pending++;if(status==='unknown')unknown++;else review++}
  results.push({unit:u.unit,form,status,entry:item.entry||'',lemma:item.lemma||'',
   candidates:item.candidates.length,warning:item.warning||''});
 }
 byUnit.push({unit:u.unit,total:u.forms.length,recognized,pending,unknown,review});
}
assert.equal(corpus.units.length,10);
assert.equal(results.length,612);
const summary={all:results.length,unique:new Set(results.map(r=>normalize(r.form))).size,
 recognized:results.filter(r=>r.status==='documented').length,
 unknown:results.filter(r=>r.status==='unknown').length,
 review:results.filter(r=>r.status==='review').length,
 byUnit};
console.log('LATIN1_PENDING_AUDIT '+JSON.stringify(summary));
console.log('LATIN1_PENDING_DETAIL '+JSON.stringify(results.filter(r=>r.status!=='documented')));
const gate=process.argv.find(a=>a.startsWith('--minimum='));
if(gate&&summary.recognized<Number(gate.split('=')[1]))throw Error('Retroceso en las formas reconocidas');
