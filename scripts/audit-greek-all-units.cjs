#!/usr/bin/env node
/* Read-only audit of every surface word in the 14 persistent Greek I source units.
 * The 100-form frequency fixture is only a subset. This script never
 * changes texts, guesses lemmas or promotes proposals to verified.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),load=p=>fs.readFileSync(path.join(root,p),'utf8');
const project=JSON.parse(load('data/vocabulary/greek1-units-corrected.json'));
assert.equal(project.course,'gr1');
assert.equal(project.units.length,14);
const context={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(load(file),context,{filename:file});
const api=context.window.ExaminaVocabulary;
const data=JSON.parse(load('data/lemmas/teacher-forms.json'));
const html=load('index.html');
const start=html.indexOf('let vocab=')+'let vocab='.length;
assert.ok(start>10);
const bank=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(m[1]));
const greekBank=bank.filter(x=>x.course==='greek1');
const all=new Map(),unitReports=[];
const clean=t=>t.replace(/([\p{L}\p{M}])[’'](?=[\p{L}\p{M}])/gu,'$1 ');
const tokens=t=>[...clean(t).matchAll(/[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*/gu)].map(x=>x[0].normalize('NFC'));
for(const u of project.units){
 const unit=Number(u.title.slice(2)),byForm=new Map();
 for(const line of u.text.split(/\r?\n/)){
  for(const form of tokens(line)){
   const slot=byForm.get(form)||{form,count:0,lines:[]};
   slot.count++;
   if(slot.lines.length<2&&!slot.lines.includes(line.trim()))slot.lines.push(line.trim());
   byForm.set(form,slot);
  }
 }
 const result=api.analyze(data,[...byForm.keys()].join('\n'),'gr1',greekBank);
 const byResult=new Map(result.map(x=>[x.form.normalize('NFC'),x]));
 for(const [form,slot] of byForm){
  const found=byResult.get(form);
  assert.ok(found,'No analysis record for '+u.title+': '+form);
  const prior=all.get(form)||{form,count:0,units:[],contexts:[],status:found.status,
   entry:found.entry,meaning:found.meaning,warning:found.warning||'',
   candidates:found.candidates.map(c=>({lemma:c.lemma,entry:c.entry,attested:c.attested}))};
  prior.count+=slot.count;
  if(!prior.units.includes(unit))prior.units.push(unit);
  for(const line of slot.lines)if(prior.contexts.length<3)prior.contexts.push({unit,line});
  all.set(form,prior);
 }
 const rows=[...byForm].map(([form,slot])=>({form,frequency:slot.count,status:byResult.get(form).status}));
 unitReports.push({unit,tokens:[...byForm.values()].reduce((n,x)=>n+x.count,0),distinct:byForm.size,
  documented:rows.filter(x=>x.status==='documented').length,
  review:rows.filter(x=>x.status==='review').length,
  unknown:rows.filter(x=>x.status==='unknown').length});
}
const rows=[...all.values()].sort((a,b)=>b.count-a.count||a.form.localeCompare(b.form,'el'));
const countStatus=kind=>rows.filter(r=>r.status===kind).length;
const pending=rows.filter(r=>r.status!=='documented');
const singleton=rows.filter(r=>r.count===1);
const summary={units:project.units.length,allDistinct:rows.length,totalTokens:rows.reduce((n,r)=>n+r.count,0),
 documented:countStatus('documented'),review:countStatus('review'),unknown:countStatus('unknown'),
 singletonDistinct:singleton.length,singletonPending:singleton.filter(r=>r.status!=='documented').length,
 pending:pending.length,unitReports};
console.log('GREEK_FULL_AUDIT '+JSON.stringify(summary));
console.log('GREEK_FULL_PENDING '+JSON.stringify(pending.map(r=>({
 form:r.form,count:r.count,units:r.units,status:r.status,entry:r.entry,
 options:r.candidates,warning:r.warning,contexts:r.contexts
}))));
console.log('GREEK_FULL_SINGLETON_PENDING '+JSON.stringify(pending.filter(r=>r.count===1)));
if(rows.length<777)throw Error('The full corpus should not be smaller than the priority subset');
if(process.argv.includes('--require-clean')&&pending.length)
 throw Error('Review cases remain; never auto-approve them');
