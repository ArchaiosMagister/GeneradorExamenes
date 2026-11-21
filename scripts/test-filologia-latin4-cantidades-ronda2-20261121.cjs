'use strict';
// PR #205: decisiones de cantidad vocálica, enunciados de Latín 4.º y PWA.
// No se certifican flexiones por analogía.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const required=JSON.parse(read('required-latin-units.js').split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
const html=read('index.html');
const index=JSON.parse(read('data/lemmas/teacher-forms.json'));
const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
assert.equal(Object.values(required.courses.latin1).flat().length,1106);
assert.equal(Object.values(required.courses.latin4).flat().length,541);
const variants=[
 ['UD5','hōstĭs, –is (m.)','hŏstĭs, –is (m.)'],
 ['UD7','hōstĭs, –is','hŏstĭs, –is'],
 ['UD8','hōstĭs, –is (m.)','hŏstĭs, –is (m.)'],
 ['UD10','hōstĭs, –is (m.)','hŏstĭs, –is (m.)'],
 ['UD5','īmpĕrātŏr, –oris (m.)','ĭmpĕrātŏr, –oris (m.)'],
 ['UD6','īmpĕrātŏr, –oris (m.)','ĭmpĕrātŏr, –oris (m.)'],
 ['UD7','īmpĕrātŏr, –oris','ĭmpĕrātŏr, –oris'],
 ['UD5','cōllĭs, –is (m.)','cŏllĭs, –is (m.)'],
 ['UD5','ōppūgnātĭō, –onis (f.)','ŏppūgnātĭō, –onis (f.)'],
 ['UD6','ōppūgnātĭō̆, –onis','ŏppūgnātĭō̆, –onis'],
 ['UD8','mŭlĭĕr, –ris','mŭlĭĕr, –eris (f.)']
];
const start=html.indexOf('vocab.push(...'),end=html.indexOf(');\n',start);
assert(start>0&&end>start,'No se ha encontrado el banco latino de 4.º');
const bank=JSON.parse(html.slice(start+'vocab.push(...'.length,end));
for(const [ud,before,after] of variants){
 const expected=required.courses.latin4[ud];
 assert.equal(expected.filter(s=>s===after).length,1,'Exigible '+ud+' '+after);
 assert(!expected.includes(before),'Exigible antiguo '+before);
 const inBank=bank.filter(x=>x.course==='latin4'&&x.unit===ud);
 assert.equal(inBank.filter(x=>x.entry===after).length,1,'Banco '+ud+' '+after);
 assert(!inBank.some(x=>x.entry===before),'Banco antiguo '+ud+' '+before);
}
assert.equal(variants.length,11);
const catalog=[
 ['hostis','hōstĭs, –is (m.)','hŏstĭs, –is (m.)'],
 ['imperator','īmpĕrātŏr, –oris (m.)','ĭmpĕrātŏr, –oris (m.)'],
 ['collis','cōllĭs, –is (m.)','cŏllĭs, –is (m.)'],
 ['oppugnatio','ōppūgnātĭō, –onis (f.)','ŏppūgnātĭō, –onis (f.)']
];
for(const [lemma,oldEntry,newEntry] of catalog){
 const correction=overrides.entryCorrections.filter(x=>x.lang==='lat'&&x.course==='lat4'&&x.lemma===lemma);
 assert.equal(correction.length,1,lemma+': evidencia editorial duplicada');
 assert.equal(correction[0].from,oldEntry);
 assert.equal(correction[0].to,newEntry);
 assert(/^https:\/\//.test(correction[0].reference));
 assert.equal(index.vocabulary.lat[lemma].lat4.entry,newEntry,lemma+': índice distinto');
}
assert.equal(index.vocabulary.lat.mulier.lat4.entry,'mŭlĭĕr, –eris (f.)');
assert.equal(index.counts.lat.contrastado,619,
 'Una corrección de cantidad no puede promover formas nuevas de evaluación');
const begin=html.indexOf('function migrateSeededLatinVerbEntries(items){');
const finish=html.indexOf('if(migrateSeededLatinVerbEntries(examRequired))saveRequired();',begin);
assert(begin>0&&finish>begin,'Falta migración de vocabulario local');
const migrate=new Function('examKey',html.slice(begin,finish)+'return migrateSeededLatinVerbEntries;')
  (entry=>entry.split(',')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
const seeded=variants.map(([ud,entry])=>({course:'latin4',unit:ud,key:'old',entry,
 origin:'listado docente exigible',meaning:'Mi glosa'}));
const manual={course:'latin4',unit:'UD5',key:'manual',entry:variants[0][1],
 origin:'manual',meaning:'Conservar literalmente'};
seeded.push(manual);
assert.equal(migrate(seeded),true);
variants.forEach(([ud,before,after],i)=>{
 assert.equal(seeded[i].unit,ud);
 assert.equal(seeded[i].entry,after,'No se migró '+before);
 assert.equal(seeded[i].meaning,'Mi glosa');
});
assert.equal(manual.entry,variants[0][1],'Se alteró vocabulario manual');
assert.equal(migrate(seeded),false,'La migración debe ser idempotente');
const offline=read('offline.html');
const marker='<script id="examina-offline-assets" type="application/json">';
const a=offline.indexOf(marker),b=offline.indexOf('</script>',a);
assert(a>=0&&b>a,'No se encontró el banco embebido offline');
const embedded=JSON.parse(offline.slice(a+marker.length,b))['data/lemmas/teacher-forms.json'];
assert(embedded?.vocabulary?.lat&&embedded?.rows?.lat);
for(const [lemma,oldEntry,newEntry] of catalog)
 assert.equal(embedded.vocabulary.lat[lemma].lat4.entry,newEntry,'Offline '+lemma);
assert.equal(embedded.vocabulary.lat.mulier.lat4.entry,'mŭlĭĕr, –eris (f.)');
assert.deepEqual(embedded.rows.lat,index.rows.lat,'Los análisis morfológicos offline no coinciden');
for(const [ud,before,after] of variants)
 assert(offline.includes('"entry": "'+after+'"')||offline.includes('"entry":"'+after+'"'),
  'No aparece en el HTML autónomo '+ud+' '+after);
console.log('LAT4: 11/11 fichas, 4 overrides, 541 exigibles, migración local idempotente y paridad web/offline.');
