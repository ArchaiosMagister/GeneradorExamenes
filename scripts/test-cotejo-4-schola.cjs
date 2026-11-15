'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ledger=read('data/lemmas/cotejo-4-schola-20261115.json');
const review=read('data/lemmas/revision-559-griego-20261113.json');
const index=read('data/lemmas/teacher-forms.json');
const candidates=read('data/lemmas/greek-nominal-candidates.json');
assert.equal(ledger.schema,'examina-schola-individual-collation/v1');
assert.equal(ledger.policy.readOnly,true);
assert.equal(ledger.policy.modifyBank,false);
assert.equal(ledger.policy.changeSourceCode,false);
assert.equal(ledger.policy.automaticPromotions,0);
assert.equal(ledger.individualChecks.length,4);
const norm=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const ids=new Set(),forms=new Set();
for(const item of ledger.individualChecks){
 assert(!ids.has(item.id),'Id histórico duplicado');ids.add(item.id);
 assert(!forms.has(item.lemma+'|'+item.schoolForm),'Ficha duplicada');
 forms.add(item.lemma+'|'+item.schoolForm);
 assert.equal(item.analysis,'N;DAT;SG');
 assert.equal(item.status,'morfologia_individual_contrastada_no_autorizada');
 assert.equal(item.generatorSourceCode,4);
 assert.equal(item.automaticPromotion,false);
 assert.equal(item.examEligible,false);
 assert(item.evidence.length>=2&&item.evidence.every(e=>/^https:\/\//.test(e.url)));
 assert.equal(norm(item.sourceForm),item.schoolForm,'Se alteró la grafía escolar o los diacríticos obligatorios');
 const historical=review.items.find(x=>x.id===item.id);
 assert(historical,'Falta historia individual '+item.id);
 for(const key of ['lemma','sourceForm','schoolForm','analysis'])
  assert.equal(item[key],historical[key],key+' distinto en '+item.id);
 assert.deepEqual(item.units,historical.units,'No adelantar unidades de '+item.id);
 assert.equal(historical.verifiedIndividual,false,'Modificar el historial docente está prohibido');
 assert.equal(historical.gradeEligible,false);
 const row=index.rows.grc.filter(r=>r[0]===item.lemma&&r[1]===item.sourceForm&&r[2]===item.analysis);
 assert.equal(row.length,1,'Candidatura ausente o duplicada en índice '+item.id);
 assert.equal(row[0][3],4,'No alterar fuente del índice sin nueva PR de incorporación '+item.id);
 assert(!index.rows.grc.some(r=>r[0]===item.lemma&&r[1]===item.sourceForm&&r[2]===item.analysis&&r[3]===5),
  'Candidatura promocionada indebidamente '+item.id);
 const entry=candidates.entries.find(x=>x.lemma===item.lemma);
 assert(entry&&entry.forms.some(x=>x[0]===item.sourceForm&&x[1]===item.analysis),
  'Falta procedencia inicial '+item.id);
}
console.log('Cuatro fichas de dativo griego cotejadas: evidencia individual registrada, historial/fuente 4 y examen intactos.');
