'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const policy=JSON.parse(read('data/lemmas/filological-variant-decisions.json'));
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const source=JSON.parse(read('data/lemmas/verified-overrides.json'));
assert.equal(policy.schema,1);
assert.deepEqual(policy.decisions.map(x=>x.id),[
 'principal-boulei','principal-erche','ambas-abfui','conservar-nonvis','sin-sorteo']);
assert.deepEqual(data.extensions.filological_variants,policy);
const has=(lang,lemma,form,tags,src=5)=>data.rows[lang].some(
 row=>row[0]===lemma&&row[1]===form&&row[2]===tags&&row[3]===src);
for(const [lang,lemma,form,tags]of [
 ['grc','βουλομαι','βούλει','V;IND;MID;PRS;2;SG'],
 ['grc','ερχομαι','ἔρχῃ','V;IND;MID;PRS;2;SG'],
 ['lat','absum','abfui','V;IND;ACT;PRF;1;SG'],
 ['lat','nolo','nonvis','V;IND;ACT;PRS;2;SG']])assert(has(lang,lemma,form,tags),'Modelo original alterado: '+form);
for(const [lang,lemma,form]of [['grc','βουλομαι','βούλῃ'],
 ['grc','ερχομαι','ἔρχει'],['grc','ερχομαι','ἔρχεαι'],['lat','absum','afui']])
 assert(!data.rows[lang].some(x=>x[0]===lemma&&x[1]===form&&x[3]===5),
  'Promoción indebida de variante: '+form);
assert(!data.rows.lat.some(x=>x[1]==='non vis'));
assert.deepEqual(source.paradigms.find(x=>x.lemma==='absum').blocks[3].forms.slice(0,1),['abfui']);
for(const decision of policy.decisions){
 assert((decision.lemmas||[decision.lemma]).every(x=>data.vocabulary[decision.lang][x]?.[decision.course]));
 if(decision.unitPolicy){
  for(const lemma of decision.lemmas){
   assert.deepEqual(data.vocabulary.grc[lemma].gr1.units,[]);
   assert(data.rows.grc.filter(x=>x[0]===lemma).every(x=>x[3]===3));
  }
 }
}
assert(policy.decisions.find(x=>x.id==='principal-boulei').variants.find(
 x=>x.form==='βούλῃ').note.includes('subjuntivo'));
const host={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('offline-lemmas.js'),host,{filename:'offline-lemmas.js'});
const q=(course,form)=>host.window.ExaminaOfflineLemmatizer.query(data,{course,mode:'form',text:form}).items;
for(const [course,lemma,form] of [['gr1','βουλομαι','βούλῃ'],['gr1','βουλομαι','βούλεαι'],
 ['gr1','ερχομαι','ἔρχει'],['gr1','ερχομαι','ἔρχεαι'],['lat1','absum','afui']]){
 const hits=q(course,form).filter(x=>x.lemma===lemma&&x.variant);
 assert.equal(hits.length,1,'Variante no registrada: '+form);
 assert(hits[0].provisional&&!hits[0].citation);
 assert.equal(host.window.ExaminaOfflineLemmatizer.uniqueLemmaFromData(data,course,form),null);
}
assert.equal(q('lat1','non vis').length,0);
const offline=read('offline.html'),mark='<script id="examina-offline-assets" type="application/json">';
const a=offline.indexOf(mark),b=offline.indexOf('</script>',a+mark.length);
assert(a>=0&&b>a);
assert.deepEqual(JSON.parse(offline.slice(a+mark.length,b))['data/lemmas/teacher-forms.json'],data);
assert(offline.includes('Variante filológica documentada'));
console.log('OK: cinco decisiones, variantes, bloqueo curricular e índice offline sin promociones.');
