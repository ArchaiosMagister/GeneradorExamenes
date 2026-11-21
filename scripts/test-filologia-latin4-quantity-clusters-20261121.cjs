'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const required=JSON.parse(read('required-latin-units.js').split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
const html=read('index.html'),offline=read('offline.html');
const idx=JSON.parse(read('data/lemmas/teacher-forms.json')),over=JSON.parse(read('data/lemmas/verified-overrides.json'));
const spec=[
 ['altus','āltus, –a, –um','ăltus, –a, –um',['UD1','UD3','UD4','UD7']],
 ['longus','lōngus, –a, –um','lŏngus, –a, –um',['UD1','UD2']],
 ['gemma','gēmma, –æ','gĕmma, –æ',['UD1']],
 ['littera','līttĕra, –æ','lĭttĕra, –æ',['UD2','UD3']]
];
assert.equal(Object.values(required.courses.latin1).flat().length,1106);
assert.equal(Object.values(required.courses.latin4).flat().length,541);
const a=html.indexOf('vocab.push(...'),b=html.indexOf(');\n',a);
assert(a>0&&b>a);
const bank=JSON.parse(html.slice(a+'vocab.push(...'.length,b));
const t='<script id="examina-offline-assets" type="application/json">';
const x=offline.indexOf(t),y=offline.indexOf('</script>',x);
assert(x>=0&&y>x);
const embedded=JSON.parse(offline.slice(x+t.length,y))['data/lemmas/teacher-forms.json'];
assert(embedded?.vocabulary?.lat);
let checked=0;
for(const [lemma,before,after,units] of spec){
 for(const ud of units){
  assert.equal(required.courses.latin4[ud].filter(s=>s===after).length,1,lemma+'/'+ud);
  assert(!required.courses.latin4[ud].includes(before));
  const selection=bank.filter(r=>r.course==='latin4'&&r.unit===ud);
  assert.equal(selection.filter(r=>r.entry===after).length,1,'Banco '+lemma+'/'+ud);
  assert(!selection.some(r=>r.entry===before));
  checked++;
 }
 const o=over.entryCorrections.filter(r=>r.lang==='lat'&&r.course==='lat4'&&r.lemma===lemma);
 assert.equal(o.length,1,'Override '+lemma);
 assert.equal(o[0].from,before); assert.equal(o[0].to,after);
 assert(/^https:\/\//.test(o[0].reference));
 assert.equal(idx.vocabulary.lat[lemma].lat4.entry,after);
 assert.equal(embedded.vocabulary.lat[lemma].lat4.entry,after);
}
assert.equal(checked,9);
assert.equal(idx.counts.lat.contrastado,619);
assert.deepEqual(idx.rows.lat,embedded.rows.lat,'Índice offline distinto');
const f=html.indexOf('function migrateSeededLatinVerbEntries(items){');
const z=html.indexOf('if(migrateSeededLatinVerbEntries(examRequired))saveRequired();',f);
assert(f>=0&&z>f);
const migrate=new Function('examKey',html.slice(f,z)+'return migrateSeededLatinVerbEntries;')
(s=>s.split(',')[0].toLowerCase().normalize('NFD').replace(/\p{M}/gu,''));
const seeded=spec.flatMap(([lemma,old,after,units])=>units.map(unit=>({
 course:'latin4',unit,entry:old,key:'old',origin:'listado docente exigible',meaning:'Conservar glosa'
})));
const custom={course:'latin4',unit:'UD1',entry:'māgnus, –a, –um',origin:'manual',meaning:'Sin cambios'};
seeded.push(custom);
assert.equal(migrate(seeded),true);
let i=0;
for(const [lemma,old,after,units] of spec)for(const unit of units){
 assert.equal(seeded[i].entry,after);assert.equal(seeded[i].meaning,'Conservar glosa');i++;
}
assert.equal(custom.entry,'māgnus, –a, –um');
assert(required.courses.latin4.UD1.includes('māgnus, –a, –um'),'Conservar māgnus; cantidad ante gn no es inequívoca');
assert(!required.courses.latin4.UD1.includes('măgnus, –a, –um'));
assert.equal(idx.vocabulary.lat.magnus.lat4.entry,'māgnus, –a, –um');
assert.equal(embedded.vocabulary.lat.magnus.lat4.entry,'māgnus, –a, –um');
assert.equal(migrate(seeded),false,'La migración debe ser idempotente');
// Nueva ronda de ocho lemas: 25 apariciones, sin promover flexiones.
const continued=[
 ['pulcher','pūlchĕr, –chra, –chrum','pŭlchĕr, –chra, –chrum',['UD1','UD3']],
 ['puella','pŭēlla, –æ','pŭĕlla, –æ',['UD1','UD2','UD3','UD8']],
 ['albus','ālbus, –a, –um','ălbus, –a, –um',['UD2']],
 ['multus','mūltus, –a, –um','mŭltus, –a, –um',['UD2','UD4','UD8','UD9']],
 ['bellum','bēllŭm, –ī','bĕllŭm, –ī',['UD3','UD4','UD5','UD7']],
 ['noster','nōstĕr, –tra, –trum','nŏstĕr, –tra, –trum',['UD3','UD5','UD6','UD7','UD8']],
 ['vinco','vīnco (3ª)','vĭnco (3ª)',['UD4']],
 ['omnis','ōmnĭs, –e','ŏmnĭs, –e',['UD7','UD8','UD9','UD10']]
];
let counted=0;
const oldSeeds=[];
for(const [lemma,oldEntry,newEntry,uds] of continued){
 const override=over.entryCorrections.filter(r=>r.lang==='lat'&&r.course==='lat4'&&r.lemma===lemma);
 assert.equal(override.length,1,'Override único '+lemma);
 assert.equal(override[0].from,oldEntry);assert.equal(override[0].to,newEntry);
 assert.equal(idx.vocabulary.lat[lemma]?.lat4?.entry,newEntry,'Índice '+lemma);
 assert.equal(embedded.vocabulary.lat[lemma]?.lat4?.entry,newEntry,'Offline '+lemma);
 for(const unit of uds){
  assert.equal(required.courses.latin4[unit].filter(e=>e===newEntry).length,1,'Exigible '+lemma+'/'+unit);
  assert(!required.courses.latin4[unit].includes(oldEntry));
  assert.equal(bank.filter(e=>e.course==='latin4'&&e.unit===unit&&e.entry===newEntry).length,1,'Banco '+lemma+'/'+unit);
  assert(!bank.some(e=>e.course==='latin4'&&e.unit===unit&&e.entry===oldEntry));
  oldSeeds.push({course:'latin4',unit,entry:oldEntry,origin:'listado docente exigible',meaning:'Glosa intacta'});
  counted++;
 }
}
assert.equal(counted,25);
assert.equal(migrate(oldSeeds),true,'Migración de semillas 25');
assert(oldSeeds.every(x=>x.meaning==='Glosa intacta'));
assert(oldSeeds.every(x=>!continued.some(([k,old])=>x.entry===old)));
assert.equal(migrate(oldSeeds),false,'Migración idempotente 25');
assert.equal(idx.counts.lat.contrastado,619,'No promover flexiones por cambios de cantidad');

// Nueva tanda de diez lemas: 17 apariciones. Sin validar flexiones por analogía.
const newest=[
 ['parvus','pārvus, –a, –um','părvus, –a, –um',['UD1','UD10']],
 ['victoria','vīctōrĭa, –æ','vĭctōrĭa, –æ',['UD1','UD3','UD4']],
 ['arma','ārma, –orum','ărma, –orum',['UD2']],
 ['castra','cāstra, –orum','căstra, –orum',['UD2','UD3','UD10']],
 ['porta','pōrta, –æ','pŏrta, –æ',['UD2']],
 ['porto','pōrto (1ª)','pŏrto (1ª)',['UD2']],
 ['fortis','fōrtĭs, –e','fŏrtĭs, –e',['UD6','UD7','UD9']],
 ['serva','sērva, –æ','sĕrva, –æ',['UD4']],
 ['servus','sērvus, –ī','sĕrvus, –ī',['UD4']],
 ['incola','īncŏla, –æ','ĭncŏla, –æ',['UD2']]
];
let newestCount=0;
const newestSeeds=[];
for(const [lemma,oldEntry,newEntry,units] of newest){
 const saved=over.entryCorrections.filter(r=>r.lang==='lat'&&r.course==='lat4'&&r.lemma===lemma);
 assert.equal(saved.length,1,'Override nuevo '+lemma);
 assert.equal(saved[0].from,oldEntry);assert.equal(saved[0].to,newEntry);
 assert(/^https:\/\//.test(saved[0].reference));
 assert.equal(idx.vocabulary.lat[lemma]?.lat4?.entry,newEntry,'Índice nuevo '+lemma);
 assert.equal(embedded.vocabulary.lat[lemma]?.lat4?.entry,newEntry,'Offline nuevo '+lemma);
 for(const unit of units){
  assert.equal(required.courses.latin4[unit].filter(e=>e===newEntry).length,1,'Exigible nuevo '+lemma+'/'+unit);
  assert(!required.courses.latin4[unit].includes(oldEntry));
  assert.equal(bank.filter(e=>e.course==='latin4'&&e.unit===unit&&e.entry===newEntry).length,1,'Banco nuevo '+lemma+'/'+unit);
  assert(!bank.some(e=>e.course==='latin4'&&e.unit===unit&&e.entry===oldEntry));
  newestSeeds.push({course:'latin4',unit,entry:oldEntry,origin:'listado docente exigible',meaning:'Glosa sin modificar'});
  newestCount++;
 }
}
assert.equal(newestCount,17);
newestSeeds.push({course:'latin4',unit:'UD1',entry:'pārvus, –a, –um',origin:'manual',meaning:'Manual intacto'});
assert.equal(migrate(newestSeeds),true,'Migración 17 entradas');
assert(newestSeeds.slice(0,-1).every(e=>e.meaning==='Glosa sin modificar'));
assert.equal(newestSeeds.at(-1).entry,'pārvus, –a, –um');
assert.equal(newestSeeds.at(-1).meaning,'Manual intacto');
assert.equal(migrate(newestSeeds),false,'Migración 17 idempotente');
assert(required.courses.latin4.UD1.includes('stēlla, –æ'),'No alterar stēlla: ē larga acreditada');
assert(required.courses.latin4.UD1.includes('māgnus, –a, –um'),'Conservar magnus pendiente editorial');
assert.equal(idx.counts.lat.contrastado,619);
assert.equal(Object.values(required.courses.latin4).flat().length,541);

console.log('LAT4: 9/9 grafías, 4 overrides, 541 exigibles, 619 formas acreditadas, migración y offline concordantes');
