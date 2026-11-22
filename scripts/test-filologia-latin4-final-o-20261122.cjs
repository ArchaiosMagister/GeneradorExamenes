'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const required=JSON.parse(read('required-latin-units.js').split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
const audit=JSON.parse(read('data/vocabulary/latin4-final-o-quantity-audit-20261122.json'));
const teacher=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html');
const a=html.indexOf('vocab.push(...'),b=html.indexOf(');',a);
assert(a>=0&&b>a);
const bank=JSON.parse(html.slice(a+'vocab.push(...'.length,b));
assert.equal(audit.schema,1);assert.equal(audit.course,'lat4');
assert.equal(audit.total,7);assert.equal(audit.items.length,7);
assert.equal(audit.distinctLemmas,4);
assert.equal(audit.automaticGradingEnabled,false);
assert.equal(audit.morphologyPromotion,false);
assert.equal(Object.values(required.courses.latin1).flat().length,1106);
assert.equal(Object.values(required.courses.latin4).flat().length,541);
const pairs=new Set();
for(const x of audit.items){
 const key=x.lemma+'/'+x.unit;
 assert(!pairs.has(key),'Repetido '+key);pairs.add(key);
 assert(/^https:\/\//.test(x.reference));
 assert(x.from.includes('ō̆')&&x.to.includes('ō'),'No es la cantidad debatida');
 assert.equal(x.from.replace('ō̆','ō'),x.to);
 assert.equal(required.courses.latin4[x.unit].filter(v=>v===x.to).length,1,'Exigible '+key);
 assert(!required.courses.latin4[x.unit].includes(x.from),'Exigible antiguo '+key);
 const rows=bank.filter(v=>v.course==='latin4'&&v.unit===x.unit);
 assert.equal(rows.filter(v=>v.entry===x.to).length,1,'Banco '+key);
 assert(!rows.some(v=>v.entry===x.from),'Banco antiguo '+key);
}
for(const [ud,entries] of Object.entries(required.courses.latin4))
 for(const e of entries)assert(!/[āēīōūȳăĕĭŏŭ][̆̄]/u.test(e),'Doble cantidad '+ud+' '+e);
assert.equal(teacher.vocabulary.lat.cicero.lat4.entry,'Cĭcĕrō, –onis (m.)');
assert.equal(teacher.vocabulary.lat.oppugnatio.lat4.entry,'ŏppūgnātĭō, –onis (f.)');
assert.equal(teacher.vocabulary.lat.homo.lat4.entry,'homo, hominis (m.)');
assert.equal(teacher.vocabulary.lat.legio.lat4.entry,'legio, legiōnis (f.)');
assert.equal(teacher.counts.lat.contrastado,619);
const m=html.indexOf('function migrateSeededLatinVerbEntries(items){');
const z=html.indexOf('if(migrateSeededLatinVerbEntries(examRequired))saveRequired();',m);
assert(m>=0&&z>m);
const migrate=new Function('examKey',html.slice(m,z)+'return migrateSeededLatinVerbEntries;')
 (s=>String(s).split(',')[0].normalize('NFD').replace(/\p{M}/gu,'').toLowerCase());
const seeded=audit.items.map(x=>({course:'latin4',unit:x.unit,entry:x.from,key:'old',meaning:'Glosa propia',origin:'listado docente exigible'}));
const manual={course:'latin4',unit:'UD6',entry:audit.items[0].from,key:'manual',meaning:'No modificar',origin:'manual'};
seeded.push(manual);
assert.equal(migrate(seeded),true);
for(let i=0;i<audit.items.length;i++){
 assert.equal(seeded[i].entry,audit.items[i].to);
 assert.equal(seeded[i].meaning,'Glosa propia');
}
assert.equal(manual.entry,audit.items[0].from);
assert.equal(migrate(seeded),false,'Migración no idempotente');
const obsolete={course:'latin4',unit:'UD6',entry:'ōppūgnātĭō̆, –onis',origin:'listado docente exigible'};
assert.equal(migrate([obsolete]),true);
assert.equal(obsolete.entry,'ŏppūgnātĭō, –onis');
if(process.argv.includes('--offline')){
 const offline=read('offline.html');
 const tag='<script id="examina-offline-assets" type="application/json">';
 const t=offline.indexOf(tag),u=offline.indexOf('</script>',t);
 assert(t>=0&&u>t);
 const embedded=JSON.parse(offline.slice(t+tag.length,u))['data/lemmas/teacher-forms.json'];
 assert(embedded,'Índice offline ausente');
 assert.equal(embedded.vocabulary.lat.cicero.lat4.entry,teacher.vocabulary.lat.cicero.lat4.entry);
 assert.deepEqual(embedded.rows.lat,teacher.rows.lat);
 assert(offline.includes('hŏmō, hominis (m.)'));
 assert(offline.includes('Cĭcĕrō, –onis (m.)'));
}
console.log('PASS: siete lecturas LAT4 en -ō, banco, 1647 entradas, migración sin tocar manuales y paridad web/offline');
