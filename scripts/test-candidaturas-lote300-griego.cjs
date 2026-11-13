'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const report=load('data/lemmas/revision-candidaturas-lote300-griego-20261113.json');
const bank=load('data/lemmas/teacher-forms.json');
const source=load('data/lemmas/verified-overrides.json');
assert.equal(report.schema,'examina-individual-candidate-resolution/v3');
assert.equal(report.rows.length,300);
assert.equal(report.summary.total,300);
assert.equal(report.summary.greek,300);
assert.equal(report.summary.latin,0);
assert.equal(report.summary.lemmas,42);
assert.equal(report.summary.promoted,300);
assert.equal(report.status,'TRASLADADO_FUENTE5_EN_RAMA_FILOLÓGICA');
assert.equal(bank.counts.grc.wikcionario,549);
assert.equal(bank.counts.grc.contrastado,474);
assert.equal(bank.counts.lat.modelo,3244);
assert.equal(bank.counts.lat.contrastado,619);
assert.equal(bank.extensions.greek_nominal_candidates.rows,549);
assert.equal(source.singleForms.length,475);
assert.equal(bank.extensions.verifiedIndividualForms,475);
const original=load('data/lemmas/revision-candidaturas-lote200-20261113.json');
const existing=new Set(original.rows.filter(x=>x.language==='grc').map(x=>[x.lemma,x.form,x.analysis].join('|')));
const normSchool=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/g,'').normalize('NFC');
const counts={};const seen=new Set();let accented=0,withIota=0;
for(const r of report.rows){
 assert.equal(r.language,'grc');
 assert.equal(r.originalSourceCode,4);
 assert.equal(r.promotedSourceCode,5);
 assert.equal(r.decision,'INCORPORADA_FUENTE_5_CON_CONTROL_POLITÓNICO');
 assert.equal(r.gradeEligible,false,'La evidencia no autoriza una respuesta única sin contexto');
 assert.equal(r.verifiedForm,normSchool(r.sourceForm),'No perder acentos o espíritus');
 assert.equal(r.verifiedForm,r.verifiedForm.normalize('NFC'));
 assert(!/[\u0304\u0306]/.test(r.verifiedForm.normalize('NFD')),'No debe persistir marca de cantidad en grafía escolar');
 if(/[\u0300-\u0345]/.test(r.verifiedForm.normalize('NFD')))accented++;
 if(r.sourceForm.normalize('NFD').includes('\u0345')){
  assert(r.verifiedForm.normalize('NFD').includes('\u0345'),'Se perdió la iota suscrita');
  withIota++;
 }
 assert(/^https:\/\/en\.wiktionary\.org\/wiki\//.test(r.reference));
 const k=[r.lemma,r.sourceForm,r.analysis].join('|');
 assert(!seen.has(k),'Duplicación de análisis: '+k);
 seen.add(k);
 assert(!existing.has(k),'Candidatura ya aprobada en el lote anterior');
 assert.deepEqual(bank.vocabulary.grc[r.lemma].gr1.units,r.units,'No asignar ni perder unidades');
 const certified=bank.rows.grc.filter(x=>x[0]===r.lemma&&x[1]===r.verifiedForm&&x[2]===r.analysis&&x[3]===5);
 assert.equal(certified.length,1,'No figura exactamente una ficha fuente 5: '+k);
 assert(!bank.rows.grc.some(x=>x[0]===r.lemma&&x[1]===r.sourceForm&&x[2]===r.analysis&&x[3]===4),
  'No se retiró la propuesta original: '+k);
 const approved=source.singleForms.filter(x=>x.lang==='grc'&&x.lemma===r.lemma&&x.form===r.verifiedForm&&x.tags===r.analysis&&x.reference===r.reference);
 assert.equal(approved.length,1,'Falta una decisión persistente: '+k);
 assert(bank.source.externalVerification.some(x=>x.lang==='grc'&&x.lemma===r.lemma&&x.form===r.verifiedForm&&x.reference===r.reference),
  'Procedencia ausente: '+k);
 counts[r.lemma]=(counts[r.lemma]||0)+1;
}
assert.deepEqual(counts,report.summary.byLemma,'El inventario de 42 lemas ha cambiado');
assert(accented>=290,'Debe preservarse la acentuación politónica');
assert(withIota>=10,'Deben conservarse dativos con iota suscrita');
const quarantined=report.quarantined.entries.map(x=>x.lemma);
assert(quarantined.includes('πρωτοσ'));
assert(quarantined.includes('αθανατοσ'));
assert(quarantined.includes('εχθροσ'));
assert(quarantined.includes('αισχροσ'));
assert(!bank.rows.grc.some(x=>x[0]==='πρωτοσ'&&x[3]===5),
 'No se debe certificar πρῶτος con los acentos inconsistentes de las candidatas');
for(const lemma of ['αθανατοσ'])
 assert(!bank.rows.grc.some(x=>x[0]===lemma&&x[3]===5&&x[2].endsWith('FEM')),
  'Una terminación femenina ajena al enunciado docente no puede promocionarse');
assert(bank.rows.grc.some(x=>x[0]==='πρωτοσ'&&x[3]===4),
 'Las propuestas dudosas deben permanecer visibles para revisión');
assert.equal(bank.source.externalVerification.length,source.paradigms.length+source.singleForms.length+
 source.paradigms.reduce((n,p)=>n+p.blocks.filter(b=>b.reference).length,0));
const countsRows={};
for(const row of bank.rows.grc)countsRows[row[3]]=(countsRows[row[3]]||0)+1;
assert.equal(countsRows[4],549);
assert.equal(countsRows[5],474);
assert.equal(bank.rows.grc.filter(x=>x[0]==='εχθροσ'&&x[3]===5&&x[2].endsWith(';FEM')).length,10);
console.log('LOTE300_GRIEGO_OK: 300 análisis únicos de 42 lemas; grafías, iota, fuente5, unidades y cuarentena conservadas');
