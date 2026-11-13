#!/usr/bin/env node
'use strict';
// Migración local de 100 lecturas documentadas, reproducible y sin conexión.
// Ejecutar solo en la rama de revisión antes de reconstruir offline.html.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=p=>JSON.parse(get(p));
const put=(p,s)=>fs.writeFileSync(path.join(root,p),s,'utf8');
const putJson=(p,o,pretty=false)=>put(p,JSON.stringify(o,null,pretty?2:0)+'\n');
const norm=s=>String(s).normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').toLowerCase().replace(/ς/g,'σ');
function replace1(s,a,b){assert(s.includes(a)&&s.split(a).length===2,'Marcador ausente o repetido: '+a.slice(0,70));return s.replace(a,b)}
const bankPath='data/lemmas/teacher-forms.json',overridePath='data/lemmas/verified-overrides.json';
const ledgerPath='data/lemmas/revision-candidaturas-lote100-20261113.json';
const data=load(bankPath),overrides=load(overridePath),ledger=load(ledgerPath);
assert.equal(ledger.rows.length,100);
if(ledger.summary.promoted===100){
 assert.equal(data.counts.lat.modelo,3344);assert.equal(data.counts.grc.wikcionario,959);
 console.log('Lote ya incorporado (idempotente)');process.exit(0);
}
assert.equal(ledger.summary.promoted,0);
assert.equal(data.counts.lat.modelo,3434);
assert.equal(data.counts.grc.wikcionario,969);
assert.equal(data.vocabulary.grc['βασιλειον'].gr1.units.length,0,'No asignar una UD no autorizada');
const refLat='https://www.azimonti.com/philology/latin/resources/paradigms-regular-verbs/';
const refGreek='https://greekdoc.github.io/lexicon/bas.html';
const greekForms={'N;ACC;PL':'βασίλεια','N;NOM;PL':'βασίλεια','N;VOC;PL':'βασίλεια','N;DAT;PL':'βασιλείοις',
 'N;ACC;SG':'βασίλειον','N;NOM;SG':'βασίλειον','N;VOC;SG':'βασίλειον',
 'N;GEN;SG':'βασιλείου','N;DAT;SG':'βασιλείῳ','N;GEN;PL':'βασιλείων'};
const tags=[['V;IND;ACT;PRS','presente'],['V;IND;ACT;PST;IPFV','imperfecto'],['V;IND;ACT;PRF','perfecto']];
const htmlOld=get('index.html');
const found=htmlOld.match(/const latinExplicitVerbEvidence=(\{[^\n]+\});\nfunction latinExplicitVerbRows/);
assert(found,'La evidencia verbal del generador está ausente');
const oldLiteral='const latinExplicitVerbEvidence='+found[1]+';';
const explicit=JSON.parse(found[1]);
for(const lemma of ['amo','moneo','rego','capio','audio']){
 const rows=ledger.rows.filter(x=>x.language==='lat'&&x.lemma===lemma);
 assert.equal(rows.length,18);
 assert(!overrides.paradigms.some(x=>x.lang==='lat'&&x.lemma===lemma));
 const blocks=tags.map(([tag])=>({tags:tag,forms:['SG','PL'].flatMap(number=>[1,2,3].map(person=>{
  const r=rows.find(x=>x.analysis===tag+';'+person+';'+number);
  assert(r,'Sin casilla '+lemma+' '+tag+';'+person+';'+number);
  return r.form;
 }))}));
 overrides.paradigms.push({lang:'lat',lemma,reference:refLat,
  secondaryReference:'https://lingualatina.github.io/textbook/reference/verbs-paradigms/',
  type:'Tres tiempos del indicativo activo contrastados por persona',blocks});
 explicit[lemma]=blocks.map((b,i)=>({tense:tags[i][1],voice:'activa',forms:b.forms,sourceCode:5}));
 data.source.externalVerification.push({lang:'lat',lemma,reference:refLat});
}
const greek=ledger.rows.filter(x=>x.language==='grc');
assert.equal(greek.length,10);
for(const x of greek){
 assert.equal(x.lemma,'βασιλειον');
 const form=greekForms[x.analysis];
 assert(form&&norm(form)===norm(x.form),'Flexión griega no equivalente '+x.form);
 overrides.singleForms.push({lang:'grc',lemma:x.lemma,form,tags:x.analysis,sourceForm:x.form,
  reference:refGreek,note:'Neutro de segunda declinación. Sin UD: consulta sí, sorteo no.'});
 data.source.externalVerification.push({lang:'grc',lemma:x.lemma,form,reference:refGreek});
}
const oldKeys=new Set(ledger.rows.map(x=>x.language+'|'+x.lemma+'|'+x.form+'|'+x.analysis+'|'+x.originalSourceCode));
for(const lang of ['lat','grc']){
 const before=data.rows[lang].length;
 data.rows[lang]=data.rows[lang].filter(row=>!oldKeys.has(lang+'|'+row.join('|')));
 assert.equal(before-data.rows[lang].length,lang==='lat'?90:10,'No se retiraron exactamente las candidaturas');
}
for(const item of ledger.rows){
 const surface=item.language==='lat'?item.form:greekForms[item.analysis];
 data.rows[item.language].push([item.lemma,surface,item.analysis,5]);
 item.verifiedForm=surface;item.promotedSourceCode=5;
 item.decision='VERIFICADA_INDIVIDUALMENTE_EN_FUENTE_PERSISTENTE';
 item.gradeEligible=item.language==='lat';
 item.reference=item.language==='lat'?refLat:refGreek;
 item.secondaryReference=item.language==='lat'?'https://lingualatina.github.io/textbook/reference/verbs-paradigms/':null;
 item.curricularNote=item.language==='grc'?'Sin unidad asignada: no sortear; respetar NOM/ACC/VOC simultáneos.':
  'Aplicar currículo real del lema; no forzar claves morfológicas ambiguas.';
}
for(const lang of ['lat','grc'])data.rows[lang].sort((a,b)=>a[0].localeCompare(b[0])||
 norm(a[1]).localeCompare(norm(b[1]))||a[2].localeCompare(b[2]));
data.counts.lat.modelo-=90;data.counts.lat.contrastado+=90;
data.counts.grc.wikcionario-=10;data.counts.grc.contrastado+=10;
data.extensions.candidate_lemmas-=5;data.extensions.candidate_rows-=90;
data.extensions.greek_nominal_candidates.rows-=10;data.extensions.verifiedIndividualForms+=10;
const sourceNames={lat:{0:'unimorph',1:'docente',2:'modelo',3:'lema',5:'contrastado'},
 grc:{0:'unimorph',1:'docente',3:'lema',4:'wikcionario',5:'contrastado'}};
for(const lang of ['lat','grc']){
 const counts={};
 for(const r of data.rows[lang]){const code=sourceNames[lang][r[3]];assert(code);counts[code]=(counts[code]||0)+1}
 for(const [key,n]of Object.entries(data.counts[lang]))assert.equal(counts[key]||0,n,lang+' '+key);
}
assert.equal(data.counts.lat.modelo,3344);
assert.equal(data.counts.grc.wikcionario,959);
assert.equal(data.source.externalVerification.length,overrides.paradigms.length+overrides.singleForms.length+
 overrides.paradigms.reduce((s,x)=>s+x.blocks.filter(b=>b.reference).length,0));
ledger.result='100_CANDIDATURAS_TRANSFERIDAS_CON_EVIDENCIA_INDIVIDUAL';
ledger.summary={...ledger.summary,promoted:100,latinVerified:90,greekVerified:10,
 latinStillPending:3344,greekStillPending:959,offlineSynchronized:true};
let html=replace1(htmlOld,oldLiteral,'const latinExplicitVerbEvidence='+JSON.stringify(explicit)+';');
html=replace1(html,"const explicitPresent=latinExplicitVerbEvidence[examKey(entry)]?.find(x=>\n   x.tense==='presente'&&x.voice===(p.evidenceVoice||'activa'));",
 "const explicitSeries=latinExplicitVerbEvidence[examKey(entry)]||[];");
html=replace1(html,"const documented=tense==='presente'&&voice===(p.evidenceVoice||'activa')&&explicitPresent?.forms[i]===form;",
 "const documented=explicitSeries.find(x=>x.tense===tense&&x.voice===voice&&x.forms[i]===form);");
html=replace1(html,"...(documented?{sourceCode:explicitPresent.sourceCode,evidence:'forma documentada individualmente'}:{})",
 "...(documented?{sourceCode:documented.sourceCode,evidence:'forma documentada individualmente'}:{})");
let builder=get('scripts/build-lemma-index.mjs');
builder=replace1(builder,"record.lang!=='lat'||","!['lat','grc'].includes(record.lang)||");
builder=replace1(builder,"const k=record.lemma+'|'+norm(record.form);",
 "const k=record.lang+'|'+record.lemma+'|'+norm(record.form)+'|'+record.tags;");
builder=replace1(builder,"if(![0,1].includes(source)||!/^N;|^ADJ;/.test(tags))continue;",
 "if(![0,1,5].includes(source)||!/^(?:N|ADJ);/.test(tags))continue;");
let audit=get('scripts/test-comprehensive-morph-audit.cjs');
audit=replace1(audit,'assert.equal(report.totalCandidates,4403,','assert.equal(report.totalCandidates,4303,');
audit=replace1(audit,'assert.equal(report.latin.entries.length,3434);','assert.equal(report.latin.entries.length,3344);');
audit=replace1(audit,'assert.equal(report.greek.entries.length,969);','assert.equal(report.greek.entries.length,959);');
let latinTest=get('scripts/test-latin-verb-evidence.cjs');
latinTest=replace1(latinTest,"['abeo','absum','audeo','confero','conor','eo','ineo','loquor','nolo','pereo','possum','praesum','proficiscor','redeo','sequor','sum','transeo']",
 "['abeo','absum','amo','audio','audeo','capio','confero','conor','eo','ineo','loquor','moneo','nolo','pereo','possum','praesum','proficiscor','redeo','rego','sequor','sum','transeo']");
latinTest=replace1(latinTest,'assert.equal(total,402,','assert.equal(total,492,');
let test=get('scripts/test-candidaturas-lote100.cjs');
test=replace1(test,'assert.equal(report.summary.promoted,0);','assert.equal(report.summary.promoted,100);');
test=replace1(test," assert.equal(r.gradeEligible,false,'Promoción no autorizada');",
 " assert.equal(r.gradeEligible,r.language==='lat','La ficha griega sin unidad no entra en el examen');");
test=replace1(test," assert(['CONTRASTADA_EN_PARADIGMA','CONTRASTADA_DECLINACION_NEUTRA'].includes(r.decision));",
 " assert.equal(r.decision,'VERIFICADA_INDIVIDUALMENTE_EN_FUENTE_PERSISTENTE');");
test=replace1(test," assert(bank.rows[r.language].some(x=>x[0]===r.lemma&&x[1]===r.form&&x[2]===r.analysis&&x[3]===source),\n  'La ficha dejó de coincidir exactamente con el banco: '+pair(r));",
 " assert(bank.rows[r.language].some(x=>x[0]===r.lemma&&x[1]===r.verifiedForm&&x[2]===r.analysis&&x[3]===5),\n  'Falta fuente 5: '+pair(r));\n assert(!bank.rows[r.language].some(x=>x[0]===r.lemma&&x[1]===r.form&&x[2]===r.analysis&&x[3]===source),\n  'La ficha sigue siendo una candidatura: '+pair(r));");
test=replace1(test,"console.log('LOTE100_VALIDADO: 90 latinas, 10 griegas; 0 duplicadas, 0 promociones, sincretismos preservados.');",
 "assert.equal(bank.vocabulary.grc['βασιλειον'].gr1.units.length,0,'No asignar unidad curricular sin aprobación');\nconsole.log('LOTE100_VALIDADO: 90 latinas y 10 griegas verificadas, sincretismos conservados.');");
const docsPath='docs/revision-filologica-integral-20261113.md';
let docs=get(docsPath);
docs+='\n## Incorporación persistente del lote de cien\n\n'+
 'Se han trasladado 90 análisis latinos y 10 griegos como fuente 5 al índice, modelos y archivo autónomo. Los cinco modelos verbales mantienen sus umbrales curriculares. El neutro βασίλειον no tiene UD y sigue excluido del sorteo; se conservan las lecturas NOM/ACC/VOC. Fuentes: https://www.azimonti.com/philology/latin/resources/paradigms-regular-verbs/ y https://greekdoc.github.io/lexicon/bas.html.\n\n'+
 'Restan 3344 candidaturas latinas y 959 griegas. Ni el auditor ni esta migración autorizan formas adicionales por analogía. No se fusiona ni se publica.\n';
putJson(overridePath,overrides,true);
putJson(bankPath,data);
putJson(ledgerPath,ledger,true);
put('index.html',html);
put('scripts/build-lemma-index.mjs',builder);
put('scripts/test-comprehensive-morph-audit.cjs',audit);
put('scripts/test-latin-verb-evidence.cjs',latinTest);
put('scripts/test-candidaturas-lote100.cjs',test);
put(docsPath,docs);
console.log('MIGRACION_CIEN_APLICADA '+JSON.stringify({verified:100,latinPending:3344,greekPending:959}));
