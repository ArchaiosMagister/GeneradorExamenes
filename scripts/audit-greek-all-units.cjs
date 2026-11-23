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
// La colación de UD11 registra los candidatos históricos de la búsqueda sin
// diacríticos. El agudo de νέων y el circunflejo de νεῶν distinguen sus lecturas.
const systematic=JSON.parse(load('data/vocabulary/greek1-systematic-morph-syntax-audit-20261121.json'));
assert.equal(systematic.course,'gr1');
assert.equal(systematic.automaticGradingEnabled,false);
assert.equal(systematic.morphologyPromotion,false);
assert.equal(systematic.contextualHomographies.length,1);
for(const item of systematic.contextualHomographies){
 assert.equal(item.form,'νέων');
 assert.equal(item.indexLemma,'νεοσ');
 assert.equal(item.competingLemma,'ναυσ');
 assert.equal(item.expectedStatus,'review');
 assert.deepEqual(item.expectedCandidateLemmas,['νεοσ','ναυσ']);
 assert.deepEqual(item.units,[11]);
 assert.equal(item.occurrences,1);
 assert(/^https:\/\//.test(item.reference));
 assert(!editorialByForm.has(item.form),'Colación contextual duplicada: '+item.form);
 const origin=project.units.find(x=>x.title==='UD11').text;
 assert(origin.split(item.context).length===2,'Cambió el contexto único de νέων en UD11');
 editorialByForm.set(item.form,{...item,kind:'contextual-homography'});
}
// Tres relativos compartían clave con otros lemas al quitar los diacríticos.
// Cada ocurrencia se coteja por oración íntegra y por posición de UD.
// Solo el informe de auditoría las considera resueltas en este contexto.
const relativeContext=JSON.parse(load('data/vocabulary/greek1-relative-contextual-attestations-20261121.json'));
assert.equal(relativeContext.schema,1);
assert.equal(relativeContext.course,'gr1');
assert.equal(relativeContext.autoPromote,false);
assert.equal(relativeContext.automaticGradingEnabled,false);
assert.equal(relativeContext.morphologyPromotion,false);
assert.equal(relativeContext.items.length,15);
assert.equal(relativeContext.totals.distinctForms,3);
assert.equal(relativeContext.totals.occurrences,15);
const allowedRelativeForms=new Map([
 ['οἳ',{parse:'PRON;NOM;PL;MASC',lemmas:['ο','οσ'],count:11}],
 ['ὃν',{parse:'PRON;ACC;SG;MASC',lemmas:['ειμι','οσ'],count:3}],
 ['ἣν',{parse:'PRON;ACC;SG;FEM',lemmas:['ειμι','οσ'],count:1}]
]);
const relativeByForm=new Map(),relativeByPlace=new Map();
for(const entry of relativeContext.items){
 const expected=allowedRelativeForms.get(entry.form);
 assert(expected,'Relativo no autorizable en este lote: '+entry.form);
 assert.equal(entry.lemma,'οσ');
 assert.equal(entry.entry,'ὅς, ἥ, ὅ (pron. rel.)');
 assert.equal(entry.morphology,expected.parse);
 assert.equal(entry.analyzerStatus,'review');
 assert.deepEqual(entry.analyzerCandidates,expected.lemmas);
 assert(/^https:\/\//.test(entry.reference));
 assert(/^https:\/\//.test(entry.accentReference));
 assert.equal(entry.role,entry.morphology==='PRON;NOM;PL;MASC'?
  'sujeto de subordinada de relativo':'complemento directo de subordinada de relativo');
 assert(entry.context.includes(entry.antecedent),'No consta el antecedente: '+entry.unit+':'+entry.line);
 const source=project.units[entry.unit-1];
 assert.equal(source?.title,'UD'+entry.unit);
 const realLine=source.text.split(/\r?\n/)[entry.line-1];
 assert.equal(realLine,entry.context,'Colación contextual obsoleta: '+entry.unit+':'+entry.line);
 const place=entry.unit+':'+entry.line;
 assert(!relativeByPlace.has(place),'Anclaje duplicado '+place);
 relativeByPlace.set(place,entry);
 if(!relativeByForm.has(entry.form))relativeByForm.set(entry.form,[]);
 relativeByForm.get(entry.form).push(entry);
}
for(const [form,expected] of allowedRelativeForms)
 assert.equal(relativeByForm.get(form)?.length,expected.count,'Falta cotejo de alguna aparición '+form);

// Comprobar la grafía normalizada, el contraste politónico y la búsqueda
// sin diacríticos por separado. El registro histórico sigue siendo válido.
const spellingChecks=[
 ['ὃν','ον','οσ','ὤν','ειμι'],
 ['ἣν','ην','οσ','ἦν','ειμι'],
 ['οἳ','οι','οσ','οἱ','ο'],
 ['νέων','νεων','νεοσ','νεῶν','ναυσ']
];
const onlyLemma=(row,lemma)=>{
 assert.equal(row.status,'documented','Grafía politónica: '+row.form);
 assert.deepEqual(Array.from(row.candidates,c=>c.lemma),[lemma],'Lectura incorrecta: '+row.form);
};
for(const [form,bare,lemma,contrast,alternative] of spellingChecks){
 const expected=[alternative,lemma].sort();
 for(const contextual of [false,true]){
  const [matched,plain,other]=api.analyze(data,[form,bare,contrast].join(' . '),
   'gr1',greekBank,{contextual});
  onlyLemma(matched,lemma);
  onlyLemma(other,alternative);
  assert.equal(plain.status,'review','Búsqueda sin diacríticos: '+plain.form);
  assert.deepEqual(Array.from(plain.candidates,c=>c.lemma).sort(),expected,
   'Se ha perdido un candidato de la búsqueda: '+plain.form);
 }
}
const relativeSpellings=new Set(['ὅν','ὃν','ἥν','ἣν','οἵ','οἳ']);
assert(!data.rows.grc.some(([,surface,,source])=>
 source===5&&relativeSpellings.has(surface.normalize('NFC'))),
 'Se ha incorporado una acreditación de fuente 5 ajena al cotejo de relativos');

// ἀποπλευσασῶν no se reconoce de forma automática en el índice actual;
// la lectura se acredita únicamente en el contexto exacto de UD10:39.
const genitiveEvidence=JSON.parse(load('data/vocabulary/greek1-absolute-genitive-agreement-20261121.json'));
assert.equal(genitiveEvidence.schema,1);
assert.equal(genitiveEvidence.course,'gr1');
assert.equal(genitiveEvidence.unit,10);
assert.equal(genitiveEvidence.items.length,12);
assert.equal(genitiveEvidence.automaticGradingEnabled,false);
assert.equal(genitiveEvidence.morphologyPromotion,false);
const genitiveForm=genitiveEvidence.editorialFormAttestation;
assert.equal(genitiveForm.form,'ἀποπλευσασῶν');
assert.equal(genitiveForm.indexLemma,'αποπλεω');
assert.equal(genitiveForm.lemma,'ἀποπλέω');
assert.equal(genitiveForm.entry,'ἀποπλέω');
assert.equal(genitiveForm.reading,'PARTICIPLE;AOR;ACT;GEN;PL;FEM');
assert.equal(genitiveForm.expectedStatus,'unknown');
assert.equal(genitiveForm.expectedCandidateCount,0);
assert.deepEqual(genitiveForm.units,[10]);
assert.equal(genitiveForm.line,39);
assert.equal(genitiveForm.occurrences,1);
assert.equal(genitiveForm.context,project.units[9].text.split(/\r?\n/)[38]);
assert.equal(genitiveEvidence.items[10].participle,genitiveForm.form);
assert.equal(genitiveEvidence.items[10].subject,genitiveForm.subject);
assert(/^https:\/\//.test(genitiveForm.reference));
assert(/^https:\/\//.test(genitiveForm.secondaryReference));
assert.equal(data.vocabulary.grc[genitiveForm.indexLemma]?.gr1?.entry,genitiveForm.entry);
assert(!data.rows.grc.some(r=>r[0]===genitiveForm.indexLemma&&r[3]===5),
 'No certificar el paradigma de ἀποπλέω desde una única forma editorial');
assert(!editorialByForm.has(genitiveForm.form),'Cotejo individual duplicado');
editorialByForm.set(genitiveForm.form,{...genitiveForm,kind:'absolute-participle'});

const externalCounts=new Map();

const all=new Map(),unitReports=[];
const clean=t=>t.replace(/([\p{L}\p{M}])[’'](?=[\p{L}\p{M}])/gu,'$1 ');
const tokens=t=>[...clean(t).matchAll(/[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*/gu)].map(x=>x[0].normalize('NFC'));
const seenRelativePlaces=new Set();
for(let i=0;i<project.units.length;i++){
 const unit=i+1,lines=project.units[i].text.split(/\r?\n/);
 for(let j=0;j<lines.length;j++){
  const eligible=tokens(lines[j]).filter(form=>allowedRelativeForms.has(form));
  if(!eligible.length)continue;
  assert.equal(eligible.length,1,'Varias apariciones de relativos cotejados en una oración');
  const key=unit+':'+(j+1),item=relativeByPlace.get(key);
  assert(item,'Forma homógrafa de relativo sin cotejo editorial: '+key);
  assert.equal(item.form,eligible[0]);assert.equal(item.context,lines[j]);
  seenRelativePlaces.add(key);
 }
}
assert.equal(seenRelativePlaces.size,relativeContext.items.length,
 'Alguna forma relativa acreditada no está presente en el texto real');
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
  const relativeItems=relativeByForm.get(form);
  let status=found.status;
  if(relativeItems){
   assert(!citation,'Cotejos superpuestos en una superficie: '+form);
   onlyLemma(found,'οσ');
   assert(found.candidates.some(c=>c.lemma==='οσ'&&c.entry==='ὅς, ἥ, ὅ (pron. rel.)'),
    'El lematizador no presenta el pronombre relativo: '+form);
   assert.equal(slot.count,relativeItems.filter(x=>x.unit===unit).length,
    'Cambió la frecuencia de los relativos en UD'+unit+': '+form);
   status='documented'; // Reconocimiento local únicamente en este informe.
  }
  if(citation){
   assert(citation.units.includes(unit),'Forma con colación fuera de UD autorizada: '+form);
   if(citation.kind==='absolute-participle'){
    assert.equal(found.status,citation.expectedStatus,
     'Cambió el estado no acreditado del participio: '+form);
    assert.equal(found.candidates.length,citation.expectedCandidateCount,
     'Se han introducido candidaturas morfológicas que requieren nueva auditoría');
    assert.equal(slot.count,citation.occurrences,'Cambió el número de participios: '+form);
    assert(slot.lines.includes(citation.context),'Cambió el contexto de la nave');
   }else if(citation.kind==='contextual-homography'){
    onlyLemma(found,citation.indexLemma);
    assert.equal(slot.count,citation.occurrences,'Cambió el número de apariciones de '+form);
    assert(found.candidates.some(c=>c.lemma===citation.indexLemma&&c.entry===citation.entry),
     'El contexto de UD11 dejó de proponer el lema de jóvenes');
   }else if(citation.kind==='noun-case'){
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
   entry:citation?.lemma||citation?.entry||(relativeItems?'ὅς, ἥ, ὅ (pron. rel.)':found.entry),meaning:found.meaning,
   warning:relativeItems?'Desambiguación editorial por contexto, no evaluable automáticamente':citation?'Acreditado exclusivamente para el corpus docente, no evaluable':found.warning||'',
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
for(const citation of [...editorial.items,...nounCaseEvidence.items,...systematic.contextualHomographies,genitiveForm])
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
