'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const required=JSON.parse(read('required-latin-units.js').split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
const html=read('index.html'),offline=read('offline.html');
const index=JSON.parse(read('data/lemmas/teacher-forms.json'));
const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
assert.equal(Object.values(required.courses.latin1).flat().length,1106);
assert.equal(Object.values(required.courses.latin4).flat().length,541);
const start=html.indexOf('vocab.push(...'),end=html.indexOf(');\n',start);
assert(start>0&&end>start);
const bank=JSON.parse(html.slice(start+'vocab.push(...'.length,end));
const expected=[
 ['UD5','īmpĕro (1ª)','ĭmpĕro (1ª)'],
 ['UD2','ōppĭdŭm, –ī','ŏppĭdŭm, –ī'],
 ['UD5','ōppĭdŭm, –ī','ŏppĭdŭm, –ī'],
 ['UD7','ōppĭdŭm, –ī','ŏppĭdŭm, –ī'],
 ['UD8','ōppĭdŭm, –ī','ŏppĭdŭm, –ī']
];
for(const [unit,old,newForm] of expected){
 assert.equal(required.courses.latin4[unit].filter(x=>x===newForm).length,1,unit+': exigible '+newForm);
 assert(!required.courses.latin4[unit].includes(old));
 const rows=bank.filter(x=>x.course==='latin4'&&x.unit===unit);
 assert.equal(rows.filter(x=>x.entry===newForm).length,1,unit+': banco '+newForm);
 assert(!rows.some(x=>x.entry===old));
}
for(const [lemma,old,newForm] of [
 ['impero','īmpĕro (1ª)','ĭmpĕro (1ª)'],
 ['oppidum','ōppĭdŭm, –ī','ŏppĭdŭm, –ī']
]){
 assert.equal(index.vocabulary.lat[lemma].lat4.entry,newForm,lemma+': índice');
 const matched=overrides.entryCorrections.filter(x=>x.lang==='lat'&&x.course==='lat4'&&x.lemma===lemma);
 assert.equal(matched.length,1);
 assert.equal(matched[0].from,old);assert.equal(matched[0].to,newForm);
 assert(/^https:\/\//.test(matched[0].reference));
}
assert.equal(index.counts.lat.contrastado,619,'Las correcciones no verifican paradigmas');
const a=html.indexOf('function migrateSeededLatinVerbEntries(items){');
const b=html.indexOf('if(migrateSeededLatinVerbEntries(examRequired))saveRequired();',a);
assert(a>=0&&b>a);
const migrate=new Function('examKey',html.slice(a,b)+'return migrateSeededLatinVerbEntries;')
 (x=>String(x).split(',')[0].normalize('NFD').replace(/\p{M}/gu,'').toLowerCase());
const seeded=expected.map(([unit,entry])=>({
 course:'latin4',unit,entry,key:'old',meaning:'Glosa propia',origin:'listado docente exigible'
}));
const manual={course:'latin4',unit:'UD5',entry:'īmpĕro (1ª)',meaning:'Manual',origin:'manual'};
seeded.push(manual);
assert.equal(migrate(seeded),true);
expected.forEach((item,i)=>{
 assert.equal(seeded[i].entry,item[2]);
 assert.equal(seeded[i].meaning,'Glosa propia');
});
assert.equal(manual.entry,'īmpĕro (1ª)');
assert.equal(migrate(seeded),false);
const tag='<script id="examina-offline-assets" type="application/json">';
const t=offline.indexOf(tag),u=offline.indexOf('</script>',t);
assert(t>=0&&u>t);
const assets=JSON.parse(offline.slice(t+tag.length,u));
const embedded=assets['data/lemmas/teacher-forms.json'];
assert(embedded?.vocabulary?.lat);
for(const [lemma,newForm] of [['impero','ĭmpĕro (1ª)'],['oppidum','ŏppĭdŭm, –ī']])
 assert.equal(embedded.vocabulary.lat[lemma].lat4.entry,newForm);
assert.deepEqual(embedded.rows.lat,index.rows.lat);
assert(offline.includes('ĭmpĕro (1ª)')&&offline.includes('ŏppĭdŭm, –ī'));
assert.equal(expected.length,5);
console.log('Latín IV: cinco apariciones corregidas, dos overrides, migración local y offline OK');
