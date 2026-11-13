'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const bank=JSON.parse(fs.readFileSync(path.join(dir,'data/lemmas/teacher-forms.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(dir,'data/lemmas/revision-candidaturas-lote100-20261113.json'),'utf8'));
const prev=JSON.parse(fs.readFileSync(path.join(dir,'data/lemmas/revision-individual-lote-20261113.json'),'utf8'));
assert.equal(report.schema,'examina-individual-candidate-resolution/v1');
assert.equal(report.rows.length,100);
assert.equal(report.summary.latin,90);
assert.equal(report.summary.greek,10);
assert.equal(report.summary.promoted,0);
const normalize=v=>String(v).normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').toLowerCase().replace(/ς/g,'σ');
const pair=(r)=>r.language+'|'+r.lemma+'|'+normalize(r.form)+'|'+r.analysis;
const previous=new Set(prev.items.map(r=>r.lang+'|'+r.lemma+'|'+normalize(r.form)+'|'+r.analysis));
const seen=new Set();
const expected={amo:18,moneo:18,rego:18,capio:18,audio:18,'βασιλειον':10};
const byLemma={};
for(const r of report.rows){
 assert(!seen.has(pair(r)),'Duplicada: '+pair(r)); seen.add(pair(r));
 assert(!previous.has(pair(r)),'Solapamiento del lote previo');
 assert(/^https:\/\//.test(r.reference),'Falta fuente');
 assert.equal(r.gradeEligible,false,'Promoción no autorizada');
 assert(['CONTRASTADA_EN_PARADIGMA','CONTRASTADA_DECLINACION_NEUTRA'].includes(r.decision));
 const source=r.language==='lat'?2:4;
 assert.equal(r.originalSourceCode,source);
 assert(bank.rows[r.language].some(x=>x[0]===r.lemma&&x[1]===r.form&&x[2]===r.analysis&&x[3]===source),
  'La ficha dejó de coincidir exactamente con el banco: '+pair(r));
 byLemma[r.lemma]=(byLemma[r.lemma]||0)+1;
}
assert.deepEqual(byLemma,expected);
for(const lemma of ['amo','moneo','rego','capio','audio']){
 const rows=report.rows.filter(r=>r.lemma===lemma);
 for(const [tags,n] of [['V;IND;ACT;PRS',6],['V;IND;ACT;PST;IPFV',6],['V;IND;ACT;PRF',6]])
  assert.equal(rows.filter(r=>r.analysis.startsWith(tags+';')).length,n,lemma+' '+tags);
}
const greek=report.rows.filter(r=>r.language==='grc');
for(const number of ['SG','PL']){
 for(const tag of ['N;NOM;','N;ACC;','N;VOC;']){
  const r=greek.find(x=>x.analysis===tag+number);
  assert(r,'Falta lectura sincrética '+tag+number);
  const parallels=greek.filter(x=>x.analysis.endsWith(number)&&normalize(x.form)===normalize(r.form));
  assert.equal(parallels.filter(x=>/N;(NOM|ACC|VOC);/.test(x.analysis)).length,3,
   'No reducir nominativo/acusativo/vocativo del neutro');
 }
}
console.log('LOTE100_VALIDADO: 90 latinas, 10 griegas; 0 duplicadas, 0 promociones, sincretismos preservados.');
