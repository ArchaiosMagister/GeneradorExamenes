const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=require('node:path').resolve(__dirname,'..');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['lexicon-valenciano.js','offline-lemmas.js','bachillerato-ii.js','vocabulary-generator.js'])
 vm.runInNewContext(fs.readFileSync(root+'/'+file,'utf8'),ctx,{filename:file});
const api=ctx.window.ExaminaVocabulary,ii=ctx.window.ExaminaBachilleratoII;
const data=JSON.parse(fs.readFileSync(root+'/data/lemmas/teacher-forms.json'));
const original=JSON.stringify(data);
const html=fs.readFileSync(root+'/index.html','utf8'),start=html.indexOf('let vocab=')+10;
const bank=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(m[1]));
const grBank=bank.filter(r=>r.course==='greek1'),latBank=bank.filter(r=>!r.course||r.course==='latin1');
const corpus=JSON.parse(fs.readFileSync(root+'/tests/greek-ii-corpus-forms.json'));
const report={greek:[],latin:[],notes:['Cobertura = al menos una lectura candidata, no desambiguación automática ni certificación morfológica.']};
for(const d of corpus){
 const text=d.forms.join(' '),old=api.analyze(data,text,'gr1',grBank),rows=api.analyze(data,text,'gr2',grBank);
 const unknown=rows.filter(r=>!r.candidates.length).map(r=>r.form);
 report.greek.push({document:d.document,passages:d.passages,total:rows.length,
  baselineCandidates:old.filter(r=>r.candidates.length).length,candidates:rows.filter(r=>r.candidates.length).length,
  automatic:rows.filter(r=>r.status==='documented').length,unknown});
 assert.equal(unknown.length,0,'Formas del repaso sin candidatas: '+d.document+' '+JSON.stringify(unknown));
}
for(const name of ['pau-cv-2006-2026.tsv','cuaderno-2026-27-morfologia.tsv']){
 const questions=fs.readFileSync(root+'/data/bachillerato-ii/'+name,'utf8').split(/\r?\n/)
  .filter(l=>l&&!l.startsWith('#')).flatMap(l=>l.split('|')[2].split(';')).filter(Boolean);
 const forms=[...new Set(questions)];
 const rows=api.analyze(data,forms.join('\n'),'lat2',latBank);
 const unknown=rows.filter(r=>!r.candidates.length).map(r=>r.form);
 report.latin.push({inventory:name,appearances:questions.length,expressions:forms.length,tokens:rows.length,
  candidates:rows.filter(r=>r.candidates.length).length,unknown});
 // Una errata impresa no se convierte en una forma latina acreditada.
 assert.equal(unknown.length,0,JSON.stringify(unknown));
}
assert.equal(JSON.stringify(data),original,'La ampliación no debe modificar el índice curricular');
assert.equal(api.analyze(data,'ἐφιλοτεχνείτην','gr1',grBank)[0].status,'unknown','No ampliar Griego I por accidente');
const typo=api.analyze(data,'comsumpserat sensitur','lat2',latBank);
assert(typo.every(r=>r.status==='review'&&r.warning&&r.candidates.length));
assert.equal(typo[0].form,'comsumpserat','No corregir el original silenciosamente');
const proposed=api.analyze(data,'ἐφιλοτεχνείτην','gr2',grBank)[0];
assert.equal(proposed.status,'review');assert.match(proposed.candidates[0].entry,/φιλοτεχνέω/);
assert(!proposed.candidates[0].attested,'Una propuesta de lectura no verifica el paradigma');
assert.equal(api.analyze(data,'Λεξιξυζω','gr2',grBank)[0].status,'unknown');
assert.equal(ii.candidates('ἡ',[]).length,0,'No confundir espíritus por normalización');
assert.equal(ii.candidates('κἀγώ',grBank)[0].meaning,'y yo');
assert.equal(ii.candidates('πείσεσθαι',grBank).length,2,'Conservar homografía de πάσχω y πείθω');
const prepared=ii.prepare(data,'lat2',latBank);
assert(prepared.bank.every(r=>r.meaning),'Las fichas latinas deben tener glosa castellana');
const custom=[...latBank,{entry:'φιλοτεχνέω',meaning:'glosa docente personalizada'}];
assert.equal(ii.candidates('ἐφιλοτεχνείτην',custom)[0].meaning,'glosa docente personalizada');
const grRow={form:'ἐφιλοτεχνείτην',lemma:'φιλοτεχνέω',entry:'φιλοτεχνέω',meaning:'practicar un arte',status:'manual',candidates:[]};
const grProject={course:'gr2',lang:'es',count:1,units:[{title:'Platón',text:'ἐφιλοτεχνείτην',mode:'complete',rows:[grRow],analyzed:true}]};
const grXml=api.documentXml(grProject);
assert.match(grXml,/Griego II/);assert.doesNotMatch(grXml,/<w:i\/>/,'Griego en redonda');assert.match(grXml,/practicar un arte/);
assert.equal(api.formatVocabularyEntry(grRow,'complete','gr2'),api.formatVocabularyEntry(grRow,'complete','gr1'),'Conservar las comillas del formateador vigente');
assert.equal(api.formatVocabularyEntry({entry:'καὶ ἐγώ (crasis)',meaning:'y yo'},'complete','gr2'),api.formatVocabularyEntry({entry:'καὶ ἐγώ (crasis)',meaning:'y yo'},'complete','gr1'));
const latRow={form:'quaestorem',lemma:'quaestor',entry:'quaestor, quaestoris (m.)',meaning:'cuestor',status:'manual',candidates:[]};
const latXml=api.documentXml({...grProject,course:'lat2',units:[{...grProject.units[0],rows:[latRow]}]});
assert.match(latXml,/Latín II/);assert.match(latXml,/<w:i\/>/);assert.match(latXml,/‘cuestor’/);
const genderRun=[...latXml.matchAll(/<w:r>[\s\S]*?<\/w:r>/g)].map(m=>m[0]).find(run=>run.includes('(m.)'));
assert(genderRun&&!genderRun.includes('<w:i/>'),'Género en redonda');
if(process.argv.includes('--report'))fs.writeFileSync(root+'/docs/cobertura-bachillerato-ii.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));console.log('Bachillerato II: aislamiento, candidatas, ambigüedad, glosas y formato Word comprobados.');
