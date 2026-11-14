const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['lexicon-valenciano.js','offline-lemmas.js','bachillerato-ii.js','vocabulary-generator.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const api=ctx.window.ExaminaVocabulary,lemmas=ctx.window.ExaminaOfflineLemmatizer,ii=ctx.window.ExaminaBachilleratoII;
const data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'))),before=JSON.stringify(data);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('let vocab=')+10;
const bank=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(m[1]));
const head=s=>String(s).split(',')[0].replace(/\s*\([^)]*\).*/,'').trim();
const existingLatin=JSON.parse(fs.readFileSync(path.join(root,'data/bachillerato-ii/latin-paradigms.json'))).items.map(x=>head(x.entry));
const existingGreek=fs.readFileSync(path.join(root,'data/bachillerato-ii/greek-corpus.tsv'),'utf8').split(/\r?\n/)
 .filter(line=>line&&!line.startsWith('#')).map(line=>head(line.split('|')[0]));
for(const lang of ['lat','grc']){
 const existing=new Set([...Object.keys(data.vocabulary[lang]),...(lang==='lat'?existingLatin:existingGreek),
  ...bank.filter(r=>lang==='grc'?r.course==='greek1':r.course!=='greek1').map(r=>head(r.entry))].map(lemmas.normalize));
 for(const word of ii.commonEntries.filter(x=>x.lang===lang))assert(!existing.has(lemmas.normalize(word.lemma)),'Lema ya presente en otro repertorio: '+word.lemma);
}
const savedCandidates=ii.commonCandidates,savedReferences=ii.commonReferences;
ii.commonCandidates=undefined;ii.commonReferences=undefined;
for(const [lang,course] of [['lat','lat2'],['grc','gr2']]){
 const words=ii.commonEntries.filter(x=>x.lang===lang);
 assert.equal(words.length,20);assert.equal(new Set(words.map(x=>x.lemma)).size,20);
 const teachers=bank.filter(r=>lang==='lat'?(!r.course||r.course==='latin1'):r.course==='greek1');
 const existing=api.analyze(data,words.map(x=>x.lemma).join(' '),course,teachers);
 assert(existing.every(row=>!row.candidates.length),'Se ha contado una palabra ya reconocida: '+JSON.stringify(existing.filter(x=>x.candidates.length)));
 for(const word of words){
  assert.equal(lemmas.query(data,{course:lang==='lat'?'lat1':'gr1',text:word.lemma}).total,0,'El lema ya estaba en la consulta offline: '+word.lemma);
 }
}
ii.commonCandidates=savedCandidates;ii.commonReferences=savedReferences;
for(const [lang,courses] of [['lat',['lat1','lat4','lat2']],['grc',['gr1','gr2']]]){
 const words=ii.commonEntries.filter(x=>x.lang===lang);
 for(const course of courses){
  const teachers=bank.filter(r=>lang==='grc'?r.course==='greek1':course==='lat4'?r.course==='latin4':!r.course||r.course==='latin1');
  for(const word of words)for(const form of word.forms){
   const row=api.analyze(data,form,course,teachers)[0];
   assert.equal(row.status,'documented',course+' '+form);
   assert.equal(row.entry,word.entry);assert.equal(row.meaning,word.meaning);assert.equal(row.meaning_va,word.meaning_va);
   assert.equal(row.candidates.length,1,'No inventar lecturas alternativas');
  }
 }
 for(const word of words){
  const result=lemmas.query(data,{course:lang==='lat'?'lat1':'gr1',text:word.lemma});
  assert.equal(result.total,1);assert.equal(result.items[0].lemma,word.lemma);
  assert.match(lemmas.describe(result.items[0].tags),/invariable/);
  assert.equal(lemmas.uniqueLemmaFromData(data,lang==='lat'?'lat1':'gr1',word.lemma),null,'No autorizar respuestas curriculares con el suplemento');
 }
}
const GreekGrave=api.analyze(data,'σχεδὸν πρὶν','gr2',[]);
assert(GreekGrave.every(r=>r.status==='documented'),'Aceptar la grave contextual conservando el lema');
assert.equal(api.analyze(data,'ἐξαιφνής','gr2',[])[0].status,'unknown','No eliminar acentos para aprobar una grafía incorrecta');
assert.equal(api.analyze(data,'palabrainexistente','lat2',[])[0].status,'unknown');
assert.equal(api.analyze(data,'quidem','lat2',[{entry:'quidem (part.)',meaning:'glosa docente',meaning_va:'glossa docent'}])[0].meaning,'glosa docente');
assert.equal(JSON.stringify(data),before,'No modificar el índice ni el vocabulario exigible');
console.log('40 lemas nuevos: ausencia previa, reconocimiento en todos los cursos, consulta offline, variantes, glosas y aislamiento curricular correctos.');
