'use strict';
/* Auditoría reproducible de rendimiento: vocabulario latino de los dos cursos.
 * Compara índices de paradigmas reconstruidos con una vista estable del mismo
 * contenido, sin establecer umbrales de tiempo dependientes del dispositivo.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const frame={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(file),frame,{filename:file});
const engine=frame.window.ExaminaVocabulary;
const index=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html');
const start=html.indexOf('let vocab=')+'let vocab='.length;
assert(start>='let vocab='.length);
const vocabulary=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const match of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 vocabulary.push(...JSON.parse(match[1]));
const bank=vocabulary.filter(row=>['latin1','latin4'].includes(row.course||'latin1'));
const paragraph=[
 'Pastor ab ovibus occisus est.','Latus adversus iuvenem stetit.',
 'Latus et lata est.','Pugnatum erat et transportatus est.',
 'Civitas bona erat.','Galli puellas laudant.',
 'Senatores in urbe habitabant.','In bello multi milites pugnaverunt.',
 'Arat et scribit.','Doctusque magister discipulos amat.',
 'Ad urbem ambulat et bene laborat.','Iuvenis adversus hostes pugnavit.'
].join(' ');
const fingerprint=rows=>JSON.stringify(rows.map(row=>[
 row.form,row.status,row.lemma,row.entry,row.meaning,
 (row.candidates||[]).map(c=>[c.lemma,c.entry,c.meaning,c.attested])
]));
const run=selected=>{
 const analyzed=engine.analyze(index,paragraph,'lat4',selected,{contextual:true});
 const phrases=engine.passivePhrases(index,analyzed,'lat4',selected);
 return {analyzed,phrases};
};
// La primera carga del índice documental no representa una edición sucesiva.
run(bank);
const base=run(bank);
assert.equal(fingerprint(run(bank.slice()).analyzed),fingerprint(base.analyzed),
 'La recreación del banco no debe cambiar ningún análisis contextual');
const times=callback=>{
 const values=[];
 for(let i=0;i<5;i++){
  const start=performance.now();
  callback();
  values.push(performance.now()-start);
 }
 return values.sort((a,b)=>a-b)[2];
};
const fresh=times(()=>run(bank.slice()));
const reused=times(()=>run(bank));
console.log(JSON.stringify({
 entries:bank.length,tokens:base.analyzed.length,passiveGroups:base.phrases.length,
 freshBankMedianMs:Number(fresh.toFixed(2)),
 stableBankMedianMs:Number(reused.toFixed(2)),
 speedupRatio:Number((fresh/Math.max(0.01,reused)).toFixed(2))
},null,2));
