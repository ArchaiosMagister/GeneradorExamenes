'use strict';
// Regresión filológica posterior a #201. Los expedientes no verificados NO son soluciones.
const assert=require('node:assert/strict'),fs=require('node:fs');
const teacher=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const over=JSON.parse(fs.readFileSync('data/lemmas/verified-overrides.json','utf8'));
const cand=JSON.parse(fs.readFileSync('data/lemmas/greek-nominal-candidates.json','utf8'));
const rows=[
 ['σωκρατησ','Σωκράτης, –ου','Σωκράτης, Σωκράτους (ὁ)','Sócrates'],
 ['ακροαμα','ἀκρόαμα, –ματος','ἀκρόαμα, –ματος (τό)','audición, recitación o espectáculo para escuchar'],
 ['αιθηρ','αἰθήρ, αἰθέρος','αἰθήρ, αἰθέρος (ὁ/ἡ)','cielo'],
 ['αιμα','αἷμα, αἵματος','αἷμα, αἵματος (τό)','sangre']
];
const norm=s=>s.split(',')[0].normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/ς/gu,'σ');
function bank(s){
 const rows=[];let p=0,k;
 while((k=s.indexOf('vocab.push(...[',p))>=0){
  const a=k+'vocab.push(...'.length,b=s.indexOf(']);',a);
  assert(b>a,'Banco general mal cerrado');rows.push(...JSON.parse(s.slice(a,b+1)));p=b+3;
 }
 return rows.filter(x=>x.course==='greek1'&&x.unit==='Banco general');
}
for(const [lemma,from,to] of rows){
 assert.equal(teacher.vocabulary.grc[lemma]?.gr1?.entry,to);
 const fixes=over.entryCorrections.filter(x=>x.lang==='grc'&&x.course==='gr1'&&x.lemma===lemma);
 assert.equal(fixes.length,1,lemma+': falta decisión reproducible');
 assert.equal(fixes[0].from,from);assert.equal(fixes[0].to,to);
 assert(/^https:\/\//.test(fixes[0].reference));
}
for(const file of ['index.html','offline.html']){
 const html=fs.readFileSync(file,'utf8'),v=bank(html);
 for(const [lemma,from,to,meaning] of rows){
  const same=v.filter(x=>norm(x.entry)===lemma);
  assert.equal(same.length,1,file+': lema ausente o duplicado '+lemma);
  assert.equal(same[0].entry,to,file+': entrada '+lemma);
  assert.equal(same[0].meaning,meaning,file+': significado '+lemma);
  assert.notEqual(same[0].entry,from);
 }
 assert(html.includes('"ακροαμα":{"gr1":{"entry":"ἀκρόαμα, –ματος (τό)"'),file+': índice incrustado obsoleto');
 assert(html.includes('"audición, recitación o espectáculo para escuchar": "audició, recitació o espectacle per a escoltar"'),file+': falta traducción');
}
assert.equal(cand.entries.find(x=>x.lemma==='πρωτοσ'),undefined,'πρῶτος provisional reutilizable');
assert.equal(cand.stats.rejectedAccentForms,24);
assert.equal(cand.stats.rejectedAccentParadigms,1);
assert.equal(cand.stats.acceptedLemmas,cand.entries.length);
assert.equal(cand.stats.additionalRows,cand.entries.reduce((n,x)=>n+x.forms.length,0));
assert.equal(teacher.extensions.greek_nominal_candidates.lemmas,cand.entries.length);
assert.equal(teacher.extensions.greek_nominal_candidates.historicalRows,559);
assert.equal(over.singleForms.length,479,'Se han promovido formas no autorizadas');
assert(!over.singleForms.some(x=>x.lemma==='πρωτοσ'||(x.lemma==='πολιτησ'&&x.form==='πολίτῃ')||(x.lemma==='υδωρ'&&x.form==='ὕδατι')));
console.log('GRIEGO I LÉXICO: 4 fichas, traducción española/valenciana, 24 candidaturas no evaluables excluidas y sin promoción morfológica.');
