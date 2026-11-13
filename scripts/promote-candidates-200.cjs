#!/usr/bin/env node
'use strict';
// Migration offline de 100 lecturas latinas + 100 griegas.
// No se ejecuta al abrir la app, no publica ni altera la rama principal.
// La CI guardará el conjunto solamente cuando hayan pasado todas las pruebas.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const write=(p,s)=>fs.writeFileSync(path.join(root,p),s,'utf8');
const writeJson=(p,obj,pretty=false)=>write(p,JSON.stringify(obj,null,pretty?2:0)+'\n');
const norm=s=>String(s).normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').toLowerCase().replace(/ς/g,'σ');
function once(text,oldValue,newValue,reason){
 assert(text.includes(oldValue),reason+': el marcador no existe');
 assert.equal(text.split(oldValue).length,2,reason+': marcador ambiguo');
 return text.replace(oldValue,newValue);
}
const bankPath='data/lemmas/teacher-forms.json';
const sourcePath='data/lemmas/verified-overrides.json';
const ledgerPath='data/lemmas/revision-candidaturas-lote200-20261113.json';
const bank=json(bankPath),source=json(sourcePath),ledger=json(ledgerPath);
assert.equal(ledger.schema,'examina-individual-candidate-resolution/v2');
assert.equal(ledger.rows.length,200);
assert.equal(ledger.summary.latin,100);assert.equal(ledger.summary.greek,100);
if(ledger.summary.promoted===200){
 assert.equal(bank.counts.lat.modelo,3244);
 assert.equal(bank.counts.grc.wikcionario,859);
 console.log('Lote200 ya incorporado; migración idempotente');
 process.exit(0);
}
assert.equal(ledger.summary.promoted,0);
assert.equal(bank.counts.lat.modelo,3344);
assert.equal(bank.counts.grc.wikcionario,959);
const refByLemma=new Map();
const active=new Set(['accipio','facio','duco','careo','disco']);
const nounsLat=new Set(['dux','obses']);
const selectionKeys=new Set(),caseGroups=new Map();
for(const row of ledger.rows){
 const src=row.language==='lat'?2:4;
 assert.equal(row.originalSourceCode,src,'Origen de candidatura inesperado');
 assert(/^https:\/\//.test(row.reference));
 assert.equal(norm(row.form),norm(row.expectedForm),'Forma diferente de referencia '+row.lemma+' '+row.analysis);
 assert(bank.vocabulary[row.language]?.[row.lemma], 'El lema no existe: '+row.lemma);
 const id=[row.language,row.lemma,row.form,row.analysis,src].join('|');
 assert(!selectionKeys.has(id),'Candidatura duplicada: '+id);
 selectionKeys.add(id);
 assert(bank.rows[row.language].some(r=>[row.lemma,row.form,row.analysis,src].every((x,i)=>x===r[i])),
  'La candidatura no coincide con el banco: '+id);
 const rid=row.language+'|'+row.lemma;
 if(!caseGroups.has(rid))caseGroups.set(rid,[]);
 caseGroups.get(rid).push(row);
 const existing=refByLemma.get(rid);
 if(existing)assert.equal(existing,row.reference,'Referencias diferentes para el mismo lema');
 refByLemma.set(rid,row.reference);
 if(row.language==='grc'){
  assert(bank.vocabulary.grc[row.lemma].gr1.units.length,
   'No asignar unidad a un lema sin programa docente: '+row.lemma);
 }
}
assert.equal(caseGroups.size,13);
const oldHtml=read('index.html');
const m=oldHtml.match(/const latinExplicitVerbEvidence=(\{[^\n]+\});\nfunction latinExplicitVerbRows/);
assert(m,'El generador debe contener la evidencia verbal explícita');
const origLiteral='const latinExplicitVerbEvidence='+m[1]+';';
const evidence=JSON.parse(m[1]);
const times=[['V;IND;ACT;PRS','presente'],['V;IND;ACT;PST;IPFV','imperfecto'],['V;IND;ACT;PRF','perfecto']];
for(const lemma of active){
 const records=caseGroups.get('lat|'+lemma);
 assert.equal(records.length,['careo','disco'].includes(lemma)?12:18);
 assert(!source.paradigms.some(p=>p.lang==='lat'&&p.lemma===lemma));
 const blocks=times.flatMap(([tags])=>{
  const matching=records.filter(r=>r.analysis.startsWith(tags+';'));
  if(!matching.length)return [];
  assert.equal(matching.length,6,'No hay seis personas '+lemma+' '+tags);
  const forms=['SG','PL'].flatMap(number=>[1,2,3].map(person=>{
   const candidate=matching.filter(r=>r.analysis===tags+';'+person+';'+number);
   assert.equal(candidate.length,1,'No hay una casilla '+lemma+' '+tags+' '+person+';'+number);
   return candidate[0].form;
  }));
  return [{tags,forms}];
 });
 assert.equal(blocks.length,['careo','disco'].includes(lemma)?2:3);
 source.paradigms.push({lang:'lat',lemma,reference:refByLemma.get('lat|'+lemma),
  type:'Indicativo activo: persona, número y tiempo contrastados en paradigma de lema',
  blocks});
 evidence[lemma]=blocks.map(block=>({tense:times.find(x=>x[0]===block.tags)[1],
  voice:'activa',forms:block.forms,sourceCode:5}));
 bank.source.externalVerification.push({lang:'lat',lemma,reference:refByLemma.get('lat|'+lemma)});
}
for(const row of ledger.rows){
 if(row.language==='lat'&&active.has(row.lemma))continue;
 assert(row.language==='grc'||nounsLat.has(row.lemma),'Lema fuera del lote nominal');
 assert(!source.singleForms.some(x=>x.lang===row.language&&x.lemma===row.lemma&&
  x.form===row.form&&x.tags===row.analysis),'Forma nominal duplicada');
 source.singleForms.push({lang:row.language,lemma:row.lemma,form:row.form,tags:row.analysis,
  reference:row.reference,note:row.language==='grc'?
   'Análisis ático individual; conservar todas las lecturas sincréticas de esta superficie':
   'Análisis de tercera declinación por caso y número, sin inferir casillas ausentes'});
 bank.source.externalVerification.push({lang:row.language,lemma:row.lemma,form:row.form,reference:row.reference});
}
for(const lang of ['lat','grc']){
 const before=bank.rows[lang].length;
 bank.rows[lang]=bank.rows[lang].filter(r=>!selectionKeys.has([lang,...r].join('|')));
 assert.equal(before-bank.rows[lang].length,100,'Se retiraron registros ajenos al lote en '+lang);
}
for(const row of ledger.rows){
 bank.rows[row.language].push([row.lemma,row.form,row.analysis,5]);
 row.promotedSourceCode=5;
 row.verifiedForm=row.form;
 row.decision='INCORPORADA_FUENTE_5_TRAS_CONTRASTE_INDIVIDUAL';
 row.gradeEligible=row.language==='lat'&&active.has(row.lemma);
 row.curricularNote=row.language==='grc'?
  'Lema con unidades docentes; conservar análisis alternativos y no forzar una lectura única de formas sincréticas':
  'Lema con unidades docentes; el análisis aislado debe ser unívoco o conservar las alternativas';
}
for(const lang of ['lat','grc'])bank.rows[lang].sort((a,b)=>a[0].localeCompare(b[0])||
 norm(a[1]).localeCompare(norm(b[1]))||a[2].localeCompare(b[2]));
bank.counts.lat.modelo-=100;bank.counts.lat.contrastado+=100;
bank.counts.grc.wikcionario-=100;bank.counts.grc.contrastado+=100;
bank.extensions.candidate_lemmas-=7;
bank.extensions.candidate_rows-=100;
bank.extensions.greek_nominal_candidates.rows-=100;
bank.extensions.verifiedIndividualForms=source.singleForms.length;
const keys={lat:{0:'unimorph',1:'docente',2:'modelo',3:'lema',5:'contrastado'},
 grc:{0:'unimorph',1:'docente',3:'lema',4:'wikcionario',5:'contrastado'}};
for(const lang of ['lat','grc']){
 const total={};
 for(const x of bank.rows[lang]){const kind=keys[lang][x[3]];assert(kind);
  total[kind]=(total[kind]||0)+1}
 for(const [kind,value]of Object.entries(bank.counts[lang]))assert.equal(total[kind]||0,value,kind+' '+lang);
}
assert.equal(bank.counts.lat.modelo,3244);assert.equal(bank.counts.grc.wikcionario,859);
assert.equal(bank.source.externalVerification.length,source.paradigms.length+source.singleForms.length+
 source.paradigms.reduce((n,p)=>n+p.blocks.filter(b=>b.reference).length,0));
ledger.status='TRANSFERIDO_FUENTE_5_EN_RAMA_DE_REVISION';
ledger.summary={...ledger.summary,promoted:200,latinVerified:100,greekVerified:100,
 latinStillPending:3244,greekStillPending:859,offlineSynchronized:true};
let html=once(oldHtml,origLiteral,'const latinExplicitVerbEvidence='+JSON.stringify(evidence)+';','Modelo verbal');
const verbBefore="const explicitSeries=latinExplicitVerbEvidence[examKey(entry)]||[];";
assert(html.includes(verbBefore),'El generador no coteja todos los tiempos individualmente');
const builderPath='scripts/build-lemma-index.mjs';
let builder=read(builderPath);
const oldRegex="!(/^(?:V;IMP;ACT;PRS;2;PL|V;PTCP;(?:ACT|PASS);PRF;(?:NOM|GEN|DAT|ACC|ABL|VOC);(?:SG|PL)(?:;(?:MASC|FEM|NEUT))?|N;(?:NOM|GEN|DAT|ACC|ABL|VOC);(?:SG|PL))$/.test(record.tags))";
const newRegex="!( /^(?:V;IMP;ACT;PRS;2;PL|V;PTCP;(?:ACT|PASS);PRF;(?:NOM|GEN|DAT|ACC|ABL|VOC);(?:SG|PL)(?:;(?:MASC|FEM|NEUT))?|N;(?:NOM|GEN|DAT|ACC|ABL|VOC);(?:SG|PL))$/.test(record.tags) || (record.lang==='grc' && /^ADJ;(?:NOM|GEN|DAT|ACC|VOC);(?:SG|PL);(?:MASC|FEM|NEUT)$/.test(record.tags)) )";
builder=once(builder,oldRegex,newRegex,'Reconstrucción con flexiones adjetivas griegas');
let audit=read('scripts/test-comprehensive-morph-audit.cjs');
audit=once(audit,'assert.equal(report.totalCandidates,4303,','assert.equal(report.totalCandidates,4103,','Inventario total');
audit=once(audit,'assert.equal(report.latin.entries.length,3344);','assert.equal(report.latin.entries.length,3244);','Inventario latino');
audit=once(audit,'assert.equal(report.greek.entries.length,959);','assert.equal(report.greek.entries.length,859);','Inventario griego');
let verbs=read('scripts/test-latin-verb-evidence.cjs');
const match=verbs.match(/assert\.deepEqual\(Object\.keys\(evidence\)\.sort\(\),\n (\[[^\n]+\])\);/);
assert(match,'El test verbal no tiene el inventario esperado');
const sorted=Object.keys(evidence).sort();
verbs=once(verbs,match[1],'['+sorted.map(x=>"'"+x+"'").join(',')+']','Inventario verbal');
verbs=once(verbs,'assert.equal(total,492,','assert.equal(total,570,','Número de formas verbales');
const testPath='scripts/test-candidaturas-lote200.cjs';
assert(fs.existsSync(path.join(root,testPath)),'Falta la prueba de este lote');
let docs=read('docs/revision-filologica-integral-20261113.md');
docs+='\n## Lote de 200 candidaturas latinas y griegas · 13/11/2026\n\n'+
 'Se incorporan 100 análisis latinos (accipio 18, facio 18, duco 18, careo 12, disco 12, dux 11 y obses 11) y 100 griegos (ἀγαθός 30, δίκαιος 30, θάλαττα 10, ξύλον 10, πενία 10 y πόλεμος 10). Todas sus unidades provienen de las entradas docentes existentes; no se inventan unidades ni se amplían paradigmas por analogía. Cada lectura posee su ficha individual en data/lemmas/revision-candidaturas-lote200-20261113.json, con enlace al paradigma de referencia.\n\n'+
 'Las coincidencias entre casos y géneros de sustantivos y adjetivos siguen registradas como análisis distintos. No constituyen respuestas unívocas de un ejercicio aislado sin contexto. El indicativo latino incorpora sólo los tiempos contrastados. El infectum pasivo de facio continúa excluido por corresponder a fio. Se mantienen el banco externo, el requisito de pruebas y la ausencia de despliegue.\n\n'+
 'El índice conserva ahora **3244 candidaturas latinas y 859 griegas** sin contraste individual. El total en fuente 5 aumenta en 200 análisis. La version offline debe actualizarse junto al índice y superar el control de igualdad antes de guardar el commit.\n';
const workflowPath='.github/workflows/offline-check.yml';
let workflow=read(workflowPath);
workflow=once(workflow,"      - name: Contrastar el nuevo lote de cien candidaturas sin promoción automática\n        run: node scripts/test-candidaturas-lote100.cjs",
 "      - name: Comprobar la transferencia del lote anterior de cien\n        run: node scripts/test-candidaturas-lote100.cjs\n      - name: Verificar el nuevo lote de cien latinas y cien griegas en fuente persistente\n        run: node scripts/test-candidaturas-lote200.cjs",
 'CI de análisis morfológico por lotes');
workflow=once(workflow,'Inventariar exhaustivamente las 4403 fichas candidatas sin promoverlas',
 'Auditar las 4103 candidaturas todavía pendientes sin promoverlas','Título del inventario');
audit=once(audit,'4403 propuestas inventariadas','4103 propuestas todavía pendientes','Texto del inventario');
writeJson(sourcePath,source,true);
writeJson(bankPath,bank);
writeJson(ledgerPath,ledger,true);
write('index.html',html);
write(builderPath,builder);
write('scripts/test-comprehensive-morph-audit.cjs',audit);
write('scripts/test-latin-verb-evidence.cjs',verbs);
write('docs/revision-filologica-integral-20261113.md',docs);
write(workflowPath,workflow);
console.log('LOTE200_MIGRADO_LOCALMENTE '+JSON.stringify({latin:100,greek:100,remaining:{latin:3244,greek:859}}));
