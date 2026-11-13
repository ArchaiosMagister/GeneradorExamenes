#!/usr/bin/env node
'use strict';
// Migración griega reproducible; ejecución sólo en rama de revisión, commit tras CI.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=p=>JSON.parse(read(p));
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s,'utf8');
const writeJSON=(p,obj,pretty=false)=>write(p,JSON.stringify(obj,null,pretty?2:0)+'\n');
const normSchool=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/g,'').normalize('NFC');
const normIndex=s=>String(s).toLowerCase().normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
const once=(s,a,b)=>{assert(s.includes(a)&&s.split(a).length===2,'Marcador obsoleto: '+a);return s.replace(a,b);};
const bankPath='data/lemmas/teacher-forms.json';
const sourcePath='data/lemmas/verified-overrides.json';
const ledgerPath='data/lemmas/revision-candidaturas-lote300-griego-20261113.json';
const bank=load(bankPath),source=load(sourcePath),ledger=load(ledgerPath);
assert.equal(ledger.schema,'examina-individual-candidate-resolution/v3');
assert.equal(ledger.rows.length,300);
assert.equal(ledger.summary.greek,300);
if(ledger.summary.promoted===300){
 assert.equal(bank.counts.grc.wikcionario,559);
 assert.equal(bank.counts.grc.contrastado,464);
 assert.equal(source.singleForms.length,465);
 console.log('Migración idempotente: lote 300 ya registrado');
 process.exit(0);
}
assert.equal(ledger.summary.promoted,0);
assert.equal(bank.counts.grc.wikcionario,859);
assert.equal(bank.counts.grc.contrastado,164);
assert.equal(bank.counts.lat.modelo,3244);
assert.equal(bank.counts.lat.contrastado,619);
assert.equal(source.singleForms.length,165);
const sourceKeys=new Set(),approvedKeys=new Set(),byLemma={};
for(const r of ledger.rows){
 assert.equal(r.language,'grc');
 assert.equal(r.originalSourceCode,4);
 assert.equal(r.gradeEligible,false);
 assert(r.units.length);
 assert.deepEqual(bank.vocabulary.grc[r.lemma].gr1.units,r.units,'Unidades cambiadas '+r.lemma);
 assert(/^https:\/\/en\.wiktionary\.org\/wiki\//.test(r.reference));
 assert.equal(normSchool(r.sourceForm),r.verifiedForm,'Acento cambiado '+r.lemma);
 const k=[r.lemma,r.sourceForm,r.analysis,4].join('|');
 assert(!sourceKeys.has(k),'Duplicado '+k);
 sourceKeys.add(k);
 assert(bank.rows.grc.some(x=>[r.lemma,r.sourceForm,r.analysis,4].every((v,i)=>v===x[i])),
  'Candidatura original no encontrada '+k);
 const s=[r.lemma,normIndex(r.verifiedForm),r.analysis].join('|');
 assert(!approvedKeys.has(s),'Dos lecturas equivalentes en este lote '+s);
 approvedKeys.add(s);
 assert(!source.singleForms.some(x=>x.lang==='grc'&&x.lemma===r.lemma&&x.tags===r.analysis&&
  normIndex(x.form)===normIndex(r.verifiedForm)),'Ya verificada '+s);
 byLemma[r.lemma]=(byLemma[r.lemma]||0)+1;
}
assert.deepEqual(byLemma,ledger.summary.byLemma);
assert.equal(Object.keys(byLemma).length,42);
const before=bank.rows.grc.length;
bank.rows.grc=bank.rows.grc.filter(x=>!sourceKeys.has(x.join('|')));
assert.equal(before-bank.rows.grc.length,300);
for(const r of ledger.rows){
 source.singleForms.push({lang:'grc',lemma:r.lemma,form:r.verifiedForm,tags:r.analysis,
  sourceForm:r.sourceForm,reference:r.reference,
  note:'Caso/número/género contrastados por ficha Wiktextract; conservar sincretismos, politonía e iota suscrita'});
 bank.rows.grc.push([r.lemma,r.verifiedForm,r.analysis,5]);
 bank.source.externalVerification.push({lang:'grc',lemma:r.lemma,form:r.verifiedForm,reference:r.reference});
 r.promotedSourceCode=5;
 r.decision='INCORPORADA_FUENTE_5_CON_CONTROL_POLITÓNICO';
}
bank.rows.grc.sort((a,b)=>a[0].localeCompare(b[0])||normIndex(a[1]).localeCompare(normIndex(b[1]))||a[2].localeCompare(b[2]));
bank.counts.grc.wikcionario-=300;
bank.counts.grc.contrastado+=300;
bank.extensions.greek_nominal_candidates.rows-=300;
bank.extensions.verifiedIndividualForms=source.singleForms.length;
ledger.status='TRASLADADO_FUENTE5_EN_RAMA_FILOLÓGICA';
ledger.summary={...ledger.summary,promoted:300,proposedAfter:559,verifiedAfter:464,
 source5RowsAdded:300,offlineSynchronized:true};
assert.equal(bank.source.externalVerification.length,
 source.paradigms.length+source.singleForms.length+source.paradigms.reduce((n,p)=>n+p.blocks.filter(b=>b.reference).length,0));
assert.equal(bank.rows.grc.filter(x=>x[3]===4).length,559);
assert.equal(bank.rows.grc.filter(x=>x[3]===5).length,464);
assert.equal(bank.extensions.verifiedIndividualForms,465);
assert(!bank.rows.grc.some(x=>x[0]==='πρωτοσ'&&x[3]===5),'No promocionar πρῶτος');
for(const lemma of ['αθανατοσ','εχθροσ'])
 assert(!bank.rows.grc.some(x=>x[0]===lemma&&x[3]===5&&x[2].endsWith(';FEM')),
  'No certificar variante femenina sin decisión docente');
let prior=read('scripts/test-candidaturas-lote200.cjs');
prior=once(prior,'assert.equal(bank.counts.grc.wikcionario,859);','assert.equal(bank.counts.grc.wikcionario,559);');
prior=once(prior,'assert.equal(bank.counts.grc.contrastado,164);','assert.equal(bank.counts.grc.contrastado,464);');
prior=once(prior,'assert.equal(bank.extensions.greek_nominal_candidates.rows,859);','assert.equal(bank.extensions.greek_nominal_candidates.rows,559);');
prior=once(prior,'assert.equal(source.singleForms.length,165);','assert.equal(source.singleForms.length,465);');
prior=once(prior,'assert.equal(bank.extensions.verifiedIndividualForms,165);','assert.equal(bank.extensions.verifiedIndividualForms,465);');
let audit=read('scripts/test-comprehensive-morph-audit.cjs');
audit=once(audit,'assert.equal(report.totalCandidates,4103,','assert.equal(report.totalCandidates,3803,');
audit=once(audit,'assert.equal(report.greek.entries.length,859);','assert.equal(report.greek.entries.length,559);');
audit=once(audit,"console.log('Auditoría integral: 4403 propuestas inventariadas y cero promociones automáticas.');",
 "console.log('Auditoría integral: 3803 propuestas restantes, cero promociones por el auditor.');");
const docPath='docs/revision-filologica-integral-20261113.md';
let docs=read(docPath);
docs+='\n## Lote griego de 300 lecturas en 42 lemas (13/11/2026)\n\n';
docs+='Se trasladan 300 casillas de fuente 4 (candidata) a fuente 5 (contrastada). Cada casilla conserva lema, caso, número, género, fuente y unidades del programa docente. Las grafías escolares eliminan solamente las marcas editorialmente añadidas de cantidad vocálica (macron y breve); acentos, espíritus e iota suscrita se mantienen. En los ejercicios de análisis aislado no se fuerza ninguna lectura unívoca sin contexto. Se sincronizan fuente persistente, índice y versión autónoma. El banco externo no cambia.\n\n';
docs+='Cuarentena filológica: no se promueven las candidaturas de πρῶτος por discrepancias acentuales (πρωτά frente a πρῶτα); se excluyen las formas femeninas del extracto de ἀθάνατος y ἐχθρός cuando el enunciado docente es de dos terminaciones; αἰσχρός conserva pendiente la política de variantes y κεφαλῆ requiere corregir el lema. Las incidencias se documentan en el registro del lote, sin incorporarlas como soluciones.\n\n';
docs+='Balance: Latín 619 verificadas / 3244 candidaturas; Griego 464 verificadas / 559 candidaturas. Rama de revisión únicamente; no publicar ni modificar main.\n';
writeJSON(sourcePath,source,true);
writeJSON(bankPath,bank);
writeJSON(ledgerPath,ledger,true);
write('scripts/test-candidaturas-lote200.cjs',prior);
write('scripts/test-comprehensive-morph-audit.cjs',audit);
write(docPath,docs);
console.log('LOTE300_GRIEGO_MIGRADO '+JSON.stringify({forms:300,lemmas:42,pending:559,verified:464}));
