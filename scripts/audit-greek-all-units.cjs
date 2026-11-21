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
// Colación independiente, restringida a textos docentes; nunca entra en el
// índice de lematización ni convierte estas formas en soluciones evaluables.
const editorial=JSON.parse(load('data/vocabulary/greek1-aorist-audit-evidence-20261121.json'));
assert.equal(editorial.schema,1);
assert.equal(editorial.course,'gr1');
assert.equal(editorial.automaticGradingEnabled,false);
assert.equal(editorial.morphologyPromotion,false);
assert.equal(editorial.items.length,3);
const editorialByForm=new Map();
for(const item of editorial.items){
 assert(typeof item.form==='string'&&item.form===item.form.normalize('NFC'));
 assert(typeof item.lemma==='string'&&item.lemma.trim());
 assert(typeof item.reading==='string'&&item.reading.includes('plural'));
 assert.deepEqual(item.units,[12]);
 assert(Number.isInteger(item.occurrences)&&item.occurrences>0);
 assert(/^https:\/\//.test(item.reference));
 assert(!editorialByForm.has(item.form),'Cotejo editorial duplicado: '+item.form);
 editorialByForm.set(item.form,item);
}
const nounCaseEvidence=JSON.parse(load('data/vocabulary/greek1-noun-case-attestation-20261121.json'));
assert.equal(nounCaseEvidence.schema,1);
assert.equal(nounCaseEvidence.course,'gr1');
assert.equal(nounCaseEvidence.automaticGradingEnabled,false);
assert.equal(nounCaseEvidence.morphologyPromotion,false);
assert.equal(nounCaseEvidence.items.length,2);
const expectedNounCases=new Map([
 ['ἀκροάματι',{indexLemma:'ακροαμα',entry:'ἀκρόαμα, –ματος (τό)',
  case:'NOUN;DAT;SG;NEUT',status:'review'}],
 ['ὀνόματα',{indexLemma:'ονομα',entry:'ὄνομα, –ματος (τό)',
  case:'NOUN;ACC;PL;NEUT',status:'unknown'}]
]);
for(const item of nounCaseEvidence.items){
 const expected=expectedNounCases.get(item.form);
 assert(expected,'No aceptar formas nominales ajenas a la colación individual: '+item.form);
 assert.equal(item.indexLemma,expected.indexLemma);
 assert.equal(item.entry,expected.entry);
 assert.equal(item.case,expected.case);
 assert.equal(item.expectedStatus,expected.status);
 assert.equal(item.expectedCandidateAttested,false);
 assert.deepEqual(item.units,[12]);
 assert.equal(item.occurrences,1);
 assert(/^https:\/\//.test(item.reference));
 assert(/^https:\/\//.test(item.secondaryReference));
 assert(!editorialByForm.has(item.form),'Una forma tiene cotejos incompatibles: '+item.form);
 editorialByForm.set(item.form,{...item,kind:'noun-case'});
}
assert.equal(new Set(nounCaseEvidence.items.map(x=>x.form)).size,2,'Colaciones nominales duplicadas');
const externalCounts=new Map();

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
 const byStatus=new Map();
 for(const [form,slot] of byForm){
  const found=byResult.get(form);
  assert.ok(found,'No analysis record for '+u.title+': '+form);
  const citation=editorialByForm.get(form);
  let status=found.status;
  if(citation){
   assert(citation.units.includes(unit),'Forma con colación fuera de UD autorizada: '+form);
   if(citation.kind==='noun-case'){
    assert.equal(found.status,citation.expectedStatus,
     'Ha cambiado el estado del lematizador: revisar de nuevo '+form);
    if(citation.expectedStatus==='review'){
     assert.equal(found.candidates.length,1,'Candidatos múltiples: '+form);
     assert.equal(found.candidates[0].lemma,citation.indexLemma,
      'Lema propuesto diferente: '+form);
     assert.equal(found.candidates[0].entry,citation.entry,
      'Enunciado propuesto diferente: '+form);
     assert.equal(found.candidates[0].attested,citation.expectedCandidateAttested,
      'Evidencia interna nueva: volver a cotejar '+form);
    }else{
     // La cuarentena de ὄνομα elimina todo análisis fuente 0: no
     // introducir candidatos ficticios en la lematización ni en exámenes.
     assert.equal(citation.form,'ὀνόματα');
     assert.equal(found.candidates.length,0,'La forma desconocida obtuvo lectura no acreditada');
     assert.equal(data.vocabulary.grc[citation.indexLemma]?.gr1?.entry,citation.entry,
      'El lema de la colación ha cambiado');
     assert(!data.rows.grc.some(r=>r[0]===citation.indexLemma&&r[3]===5),
      'Se ha promovido indebidamente un paradigma en cuarentena');
    }
   }else{
    assert(['unknown','documented'].includes(found.status),'Ambigüedad no resuelta: '+form);
   }
   externalCounts.set(form,(externalCounts.get(form)||0)+slot.count);
   // Reconocimiento de una forma concreta en el informe de auditoría;
   // no altera el analizador, el índice, la calificación ni los paradigmas.
   status='documented';
  }
  byStatus.set(form,status);
  const prior=all.get(form)||{form,count:0,units:[],contexts:[],status,
   entry:citation?.lemma||citation?.entry||found.entry,meaning:found.meaning,
   warning:citation?'Acreditado exclusivamente para el corpus docente, no evaluable':found.warning||'',
   candidates:found.candidates.map(c=>({lemma:c.lemma,entry:c.entry,attested:c.attested}))};
  prior.count+=slot.count;
  if(!prior.units.includes(unit))prior.units.push(unit);
  for(const line of slot.lines)if(prior.contexts.length<3)prior.contexts.push({unit,line});
  all.set(form,prior);
 }
 const rows=[...byForm].map(([form,slot])=>({form,frequency:slot.count,status:byStatus.get(form)}));
 unitReports.push({unit,tokens:[...byForm.values()].reduce((n,x)=>n+x.count,0),distinct:byForm.size,
  documented:rows.filter(x=>x.status==='documented').length,
  review:rows.filter(x=>x.status==='review').length,
  unknown:rows.filter(x=>x.status==='unknown').length});
}
for(const citation of [...editorial.items,...nounCaseEvidence.items])
 assert.equal(externalCounts.get(citation.form),citation.occurrences,
  'Superficie externa eliminada o modificada: '+citation.form);
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
