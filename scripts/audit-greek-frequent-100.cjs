#!/usr/bin/env node
/* Audit 100 recurrent Greek I forms from the teacher's 14-unit regression corpus.
 * This is a coverage measurement, NOT an attestation or a morphology verification.
 * It never modifies source vocabulary or marks candidate forms as verified.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(file),context,{filename:file});
const api=context.window.ExaminaVocabulary;
const index=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html');
const first=html.indexOf('let vocab=')+'let vocab='.length;
assert.ok(first>10,'Banco griego ausente');
const bank=JSON.parse(html.slice(first,html.indexOf(';',first)));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(m[1]));
const greek=bank.filter(x=>x.course==='greek1');
const fixture=JSON.parse(read('tests/greek-priority-forms.json'));
assert.equal(fixture.units.length,14);
const occurrences=new Map();
for(const unit of fixture.units)
 for(const form of unit.forms){
  const id=form.normalize('NFC');
  const record=occurrences.get(id)||{form:id,frequency:0,units:[]};
  record.frequency++;
  if(!record.units.includes(unit.unit))record.units.push(unit.unit);
  occurrences.set(id,record);
 }
const analyses=api.analyze(index,[...occurrences.keys()].join('\n'),'gr1',greek);
const byForm=new Map(analyses.map(x=>[x.form.normalize('NFC'),x]));
const cases=[...occurrences.values()].map(x=>{
 const result=byForm.get(x.form.normalize('NFC'));
 assert.ok(result,'Missing token '+x.form);
 return {...x,status:result.status,entry:result.entry,meaning:result.meaning,
  warning:result.warning||'',candidates:result.candidates.map(y=>({entry:y.entry,lemma:y.lemma,attested:y.attested}))};
});
cases.sort((a,b)=>b.frequency-a.frequency||a.form.localeCompare(b.form,'el'));
const selected=cases.slice(0,100);
const unresolved=cases.filter(x=>x.status!=='documented');
unresolved.sort((a,b)=>b.frequency-a.frequency||a.form.localeCompare(b.form,'el'));
const summary={totalDistinct:cases.length,top100:{
 documented:selected.filter(x=>x.status==='documented').length,
 review:selected.filter(x=>x.status==='review').length,
 unknown:selected.filter(x=>x.status==='unknown').length},
 all:{documented:cases.filter(x=>x.status==='documented').length,review:cases.filter(x=>x.status==='review').length,
 unknown:cases.filter(x=>x.status==='unknown').length},unresolvedDistinct:unresolved.length};
console.log('GREEK_FREQUENCY_AUDIT '+JSON.stringify(summary));
console.log('GREEK_TOP_100 '+JSON.stringify(selected.map(x=>({form:x.form,frequency:x.frequency,status:x.status,entry:x.entry,warning:x.warning}))));
console.log('GREEK_PENDING_100 '+JSON.stringify(unresolved.slice(0,100).map(x=>({form:x.form,frequency:x.frequency,status:x.status,units:x.units,options:x.candidates.map(c=>c.entry),warning:x.warning}))));
if(process.argv.includes('--require-clean')&&selected.some(x=>x.status!=='documented'))
 throw Error('Hay formas frecuentes pendientes; consulta GREEK_PENDING_100');
