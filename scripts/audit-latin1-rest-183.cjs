#!/usr/bin/env node
/* Post-PR56 audit of precisely the 183 previously pending Latin I occurrences.
 * Unverified participles, genuine homographs, and spelling doubts must not
 * be counted as a validated analysis. Uses teacher bank; no source mutation.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const baseline=JSON.parse(read('tests/latin1-pending-183-baseline.json'));
assert.equal(baseline.rows.length,183);
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const host={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const script of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(script),host,{filename:script});
const api=host.window.ExaminaVocabulary,norm=host.window.ExaminaOfflineLemmatizer.normalize;
const html=read('index.html'),first=html.indexOf('let vocab=')+10;
const vocab=JSON.parse(html.slice(first,html.indexOf(';',first)));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))vocab.push(...JSON.parse(m[1]));
const bank=vocab.filter(r=>!r.course||r.course==='latin1');
const records=[];
for(const unit of [...new Set(baseline.rows.map(r=>r.unit))]){
 const forms=baseline.rows.filter(r=>r.unit===unit);
 const results=api.analyze(data,forms.map(r=>r.form).join('\n'),'lat1',bank);
 const indexed=new Map(results.map(r=>[norm(r.form).replace(/v/g,'u'),r]));
 for(const previous of forms){
  const found=indexed.get(norm(previous.form).replace(/v/g,'u'));
  assert.ok(found,'Form not tokenized: '+previous.unit+'/'+previous.form);
  const count=found.candidates.length,category=
   found.warning?'spelling-or-abbreviation':
   found.status==='documented'?'recognized':
   found.status==='review'?(count>1?'ambiguous':'candidate-needs-proof'):'unknown';
  records.push({unit,form:previous.form,priorStatus:previous.priorStatus,
   status:found.status,category,lemma:found.lemma||'',entry:found.entry||'',
   options:found.candidates.map(c=>({lemma:c.lemma,entry:c.entry,attested:c.attested})),
   warning:found.warning||''});
 }
}
const byCategory=Object.fromEntries(['recognized','ambiguous','candidate-needs-proof',
 'spelling-or-abbreviation','unknown'].map(kind=>[kind,records.filter(r=>r.category===kind).length]));
const byUnit=[...new Set(baseline.rows.map(r=>r.unit))].map(unit=>{
 const items=records.filter(r=>r.unit===unit);
 return {unit,total:items.length,recognized:items.filter(r=>r.status==='documented').length,
  review:items.filter(r=>r.status==='review').length,unknown:items.filter(r=>r.status==='unknown').length};
});
const summary={original:baseline.rows.length,...byCategory,
 recognizedTotal:records.filter(r=>r.status==='documented').length,
 pendingTotal:records.filter(r=>r.status!=='documented').length,byUnit};
console.log('LATIN1_REST_183 '+JSON.stringify(summary));
console.log('LATIN1_REST_DETAIL '+JSON.stringify(records.filter(x=>x.category!=='recognized')));
const gate=process.argv.find(a=>a.startsWith('--minimum='));
if(gate&&summary.recognizedTotal<Number(gate.slice(10)))
 throw Error('Regression: Latin I previously pending forms recovered below minimum');
