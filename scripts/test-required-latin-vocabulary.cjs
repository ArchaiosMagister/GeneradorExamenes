'use strict';
// Auditoría de los documentos de vocabulario exigible y los paradigmas latinos
// (perfectum, imperfecto, futuro), sin convertir inferencias en flexiones verificadas.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=pathName=>fs.readFileSync(path.join(root,pathName),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('required-latin-units.js'),ctx);
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(read(file),ctx,{filename:file});
const source=JSON.parse(JSON.stringify(ctx.window.ExaminaRequiredLatinUnits));
const engine=ctx.window.ExaminaVocabulary;
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
assert.equal(source.schema,1);
const html=read('index.html'),marker='let vocab=';
const start=html.indexOf(marker)+marker.length;
assert(start>=marker.length,'El banco docente no está integrado');
const bank=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const found of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 bank.push(...JSON.parse(found[1]));
const perCourse={latin1:bank.filter(x=>(x.course||'latin1')==='latin1'),
 latin4:bank.filter(x=>x.course==='latin4')};
const expectedCounts={latin1:1106,latin4:541};
const normal=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'')
 .replace(/æ/g,'ae').replace(/œ/g,'oe').toLowerCase();
for(const course of ['latin1','latin4']){
 const document=source.courses[course];
 assert(document&&typeof document==='object');
 const original=perCourse[course];
 assert.equal(original.length,expectedCounts[course],course+': total de origen');
 const originalByUnit=new Map();
 for(const row of original){
  if(!originalByUnit.has(row.unit))originalByUnit.set(row.unit,[]);
  originalByUnit.get(row.unit).push(row.entry);
 }
 assert.equal(Object.keys(document).length,10,course+': diez bloques docentes');
 assert.equal(Object.values(document).reduce((n,a)=>n+a.length,0),expectedCounts[course]);
 for(const [unit,entries] of Object.entries(document)){
  assert.deepEqual(entries,originalByUnit.get(unit),course+' '+unit+
   ': conservar todas las fichas literales y sus unidades');
 }
}
assert(source.courses.latin1['UD9–10']?.length===194,'UD9–10 no se debe desdoblar');
assert(source.courses.latin1['UD11-12']?.length===138,'UD11–12 no se debe desdoblar');
assert(!source.courses.latin1.UD9&&!source.courses.latin1.UD10);
assert(html.includes('examina_required_latin_docentes_v1'),'Falta migración única');
assert(html.includes('latinRequiredStart'),'Falta umbral de bloque exigible');
assert(read('sw.js').includes('required-latin-units.js'),'La PWA debe funcionar sin red');
assert(read('scripts/build-offline.mjs').includes("const requiredLatinExternal"),
 'El HTML único debe llevar las listas docentes');
assert(read('.github/workflows/publish-online.yml').includes('required-latin-units.js'),
 'GitHub Pages debe publicar el recurso');

// Probar realmente la lematización, con enunciados originales de los bancos.
const cases=[
 ['latin1','amaverunt','amo','perfecto de 3.ª plural'],
 ['latin1','amavisse','amo','infinitivo de perfecto'],
 ['latin1','amaverat','amo','pluscuamperfecto'],
 ['latin1','amabamus','amo','imperfecto'],
 ['latin1','amabo','amo','futuro'],
 ['latin1','duxerunt','duco','perfecto en -x-'],
 ['latin1','dixerant','dico','pluscuamperfecto en -x-'],
 ['latin1','miserunt','mitto','perfecto en -s-'],
 ['latin1','scripserunt','scribo','perfecto en -ps-'],
 ['latin1','vicerunt','vinco','perfecto en -c-'],
 ['latin1','fuerant','sum','pluscuamperfecto irregular'],
 ['latin4','laudaverunt','laudo','perfecto de 1.ª'],
 ['latin4','pugnaverat','pugno','pluscuamperfecto de 1.ª'],
 ['latin4','fecerunt','facio','perfecto mixto'],
 ['latin4','habuerunt','habeo','perfecto de 2.ª'],
 ['latin4','duxerunt','duco','perfecto de 3.ª'],
 ['latin4','ducebant','duco','imperfecto de 3.ª'],
 ['latin4','legebant','lego','imperfecto de 3.ª'],
 ['latin4','fuerunt','sum','perfecto irregular']
];
for(const [course,form,lemma,desc] of cases){
 const row=engine.analyze(data,form,course==='latin1'?'lat1':'lat4',perCourse[course],{contextual:true})[0];
 assert(row,course+' '+form+': no se produjo un análisis');
 assert(row.candidates.some(x=>normal(x.lemma)===lemma),
  course+' '+form+' ('+desc+'): no se localizó el lema '+lemma+
  '; propuestas: '+row.candidates.map(x=>x.lemma).join(', '));
}
// Auditoría adicional de todos los enunciados latinos que citan expresamente
// un perfecto en -i; sin prometer que una forma homógrafa tenga lectura única.
let verbHeads=0,supported=0,absent=[];
for(const [course,items] of Object.entries(perCourse)){
 const seen=new Set();
 for(const row of items){
  const fields=row.entry.split(',').map(x=>normal(x).replace(/\([^)]*\)/g,'').trim());
  if(fields.length<3||!/\((?:1ª|2ª|3ª|4ª|mx\.)\)/u.test(row.entry))continue;
  const perf=fields[1],lemma=fields[0];
  if(!/^[a-z]+i$/.test(perf)||perf.length<3||seen.has(lemma))continue;
  seen.add(lemma);verbHeads++;
  const form=perf.slice(0,-1)+'erunt';
  const result=engine.analyze(data,form,course==='latin1'?'lat1':'lat4',items,{contextual:true})[0];
  if(result?.candidates.some(x=>normal(x.lemma)===lemma))supported++;
  else absent.push(course+': '+row.entry+' → '+form);
 }
}
assert(verbHeads>=100,'No se han auditado suficientes paradigmas completos');
assert(supported/verbHeads>=0.95,
 'No alcanza el 95 % de recuperación de perfectos docentes: '+supported+'/'+verbHeads+
 ' pendientes: '+absent.slice(0,20).join('; '));
// No añadir filas al índice verificado por el simple hecho de que el documento
// incluye el tema de perfecto; las flexiones extrapoladas se distinguen por origen.
assert(data.rows.lat.some(row=>row[3]===2),'Debe preservarse la categoría de propuestas');
console.log('Exigible latín:',expectedCounts,
 ' | formas de perfecto derivables:',supported+'/'+verbHeads,
 ' | pendientes:',absent.length);
