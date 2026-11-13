'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const corpus=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/revision-individual-lote-20261113.json'),'utf8'));
assert.equal(ledger.schema,'examina-individual-evidence-review/v1');
assert.equal(ledger.items.length,31);
const canon=s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
let existing=0,missing=0;
for(const record of ledger.items){
 assert.equal(record.documentaryResult,'CORROBORADO_EXTERNAMENTE');
 assert.equal(record.eligibleForNewAutomaticGrading,false);
 assert(/^https:\/\//.test(record.reference));
 assert(corpus.vocabulary[record.lang][record.lemma], 'Lema inexistente: '+record.lemma);
 const matches=corpus.rows[record.lang].filter(r=>r[0]===record.lemma&&canon(r[1])===canon(record.form));
 if(matches.length)existing++;else missing++;
 if(record.lang==='lat'&&record.analysis.includes('DEP')){
  assert(record.reason.includes('semideponente')||record.reason.includes('géneros'));
 }
}
assert.equal(existing,19,'Las formas ya indexadas han cambiado; revisar manualmente');
assert.equal(missing,12,'No inferir ni insertar formas compuestas sin reconstrucción controlada');
assert.equal(corpus.rows.grc.filter(r=>r[0]==='λογοσ'&&r[1]==='λόγῳ'&&r[3]===4).length,1);
console.log('REVISIÓN INDIVIDUAL: 31 fichas cotejadas; 19 ya tienen superficie en índice; 12 compuestas documentadas fuera del índice; 0 promovidas.');
