'use strict';
// Auditoría transversal de los verbos en los dos cursos: banco principal,
// listado exigible, índice de lemas, flexión regular y migración de fichas antiguas.
// No se atribuye evidencia filológica a formas generadas por analogía.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const offline=read('offline.html');
const corpus=JSON.parse(read('data/lemmas/teacher-forms.json'));
const overrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
const sandbox={window:{}};
vm.runInNewContext(read('required-latin-units.js'),sandbox);
const required=JSON.parse(JSON.stringify(sandbox.window.ExaminaRequiredLatinUnits.courses));
function bank(startMarker,endMarker){
 const a=html.indexOf(startMarker);
 assert(a>=0,'No se encontró '+startMarker);
 const from=a+startMarker.length,b=html.indexOf(endMarker,from);
 assert(b>from,'Banco incompleto '+startMarker);
 return JSON.parse(html.slice(from,b));
}
const banks={
 latin1:bank('let vocab=',';\n'),
 latin4:bank('vocab.push(...',');\n')
};
const fixes=[
 ['latin1','UD6','fugio','fugio, fugi – (4ª)','fugio, fugi – (mx.)'],
 ['latin1','UD9–10','fugio','fugio, fugi – (3ª)','fugio, fugi – (mx.)'],
 ['latin4','UD6','retineo','rĕtĭnĕō, retĭnŭī, retentum (3ª)','rĕtĭnĕō, retĭnŭī, retentum (2ª)'],
 ['latin1','UD11-12','accedo','accedo, accessi, acessum (3ª)','accedo, accessi, accessum (3ª)'],
 ['latin1','UD11-12','accido','accido, accidi, accesum (3ª)','accido, accidi, – (3ª)'],
 ['latin1','UD11-12','constituo','constituo, constiti, constitutum (3ª)','constituo, constitui, constitutum (3ª)'],
 ['latin1','UD2','invenio','invenio, inveni, inventum','invenio, inveni, inventum (4ª)']
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/æ/gi,'ae').replace(/œ/gi,'oe').toLowerCase();
const head=s=>norm(String(s).split(/[, (]/)[0]);
let vetted=0;
for(const [course,unit,lemma,before,after] of fixes){
 const selected=banks[course].filter(x=>x.unit===unit&&x.entry===after);
 assert.equal(selected.length,1,'Falta la corrección del banco general '+course+' '+unit+' '+lemma);
 assert(!banks[course].some(x=>x.unit===unit&&x.entry===before),
  'Queda grafía antigua en banco general: '+before);
 const list=required[course][unit]||[];
 assert(list.includes(after),'Corrección ausente del exigible '+course+' '+unit+' '+lemma);
 assert(!list.includes(before),'Enunciado antiguo exigible: '+before);
 const indexEntry=corpus.vocabulary.lat[lemma]?.[course==='latin1'?'lat1':'lat4']?.entry;
 assert(indexEntry,'No existe índice para '+lemma+' '+course);
 assert(!indexEntry.includes('accesum')&&!indexEntry.includes('constiti'),
  'El índice conserva una forma errónea: '+indexEntry);
 if(indexEntry===after)vetted++;
 else assert.equal(lemma,'fugio','Índice no corregido: '+lemma+' '+indexEntry);
 assert(offline.includes(JSON.stringify(after)),
  'La PWA offline carece de la corrección: '+course+' '+lemma+' '+after);
}
// Solo una corrección de origen por lema y curso, aunque fugio figurase
// en dos unidades con errores distintos. Son editoriales, no paradigmas.
const indexChanges=fixes.filter((x,i)=>!fixes.slice(0,i).some(y=>y[0]===x[0]&&y[2]===x[2]));
for(const [course,unit,lemma,before,after] of indexChanges){
 const matches=overrides.entryCorrections.filter(x=>x.lang==='lat'&&x.lemma===lemma&&
  x.course===(course==='latin1'?'lat1':'lat4')&&x.from===before&&x.to===after);
 assert.equal(matches.length,1,'Corrección persistente ausente: '+lemma);
 assert(/^https:\/\//.test(matches[0].reference),'Sin referencia externa: '+lemma);
 assert.equal(corpus.vocabulary.lat[lemma][course==='latin1'?'lat1':'lat4'].entry,after,
  'El índice reproducible no coincide: '+lemma);
}
const checks={entries:0,lemmas:new Set(),grades:{}};
for(const [course,rows] of Object.entries(banks)){
 const gradeMap=new Map();
 for(const entry of rows){
  const m=entry.entry.match(/\(([1-4]ª|mx\.|irr\.?)\)\s*$/);
  if(!m)continue;
  const grade=m[1],lemma=head(entry.entry);
  if(lemma==='vis'&&grade.startsWith('irr'))continue; // vis es sustantivo, no verbo
  checks.entries++;
  checks.lemmas.add(course+':'+lemma);
  checks.grades[course]=(checks.grades[course]||0)+1;
  if(!grade.startsWith('irr')){
   const good=grade==='1ª'?(lemma.endsWith('o')||lemma.endsWith('or')):
    grade==='2ª'?(lemma.endsWith('eo')||lemma.endsWith('eor')):
    grade==='3ª'?((lemma.endsWith('o')&&!lemma.endsWith('io')&&!lemma.endsWith('eo'))||
      (lemma.endsWith('or')&&!lemma.endsWith('ior')&&!lemma.endsWith('eor'))):
    grade==='4ª'?(lemma.endsWith('io')||lemma.endsWith('ior')):
    grade==='mx.'?(lemma.endsWith('io')||
      lemma.endsWith('ior')&&/,\s*[^,]+\s+sum\s*\(mx\.\)$/.test(entry.entry)):false;
   assert(good,'Conjugación incompatible con el presente: '+course+'/'+entry.unit+' '+entry.entry);
  }
  const k=course+':'+lemma;
  if(!gradeMap.has(k))gradeMap.set(k,new Set());
  gradeMap.get(k).add(grade.replace(/\.$/,'')); // (irr) y (irr.) son equivalentes
 }
 for(const [k,grades] of gradeMap)
  assert.equal(grades.size,1,'El mismo lema tiene conjugaciones incompatibles: '+k+' '+[...grades]);
}
assert(checks.entries>400&&checks.lemmas.size>250,
 'La auditoría estructural no está cubriendo el repertorio real');
assert.equal(corpus.counts.lat.contrastado,667,
 'Una corrección editorial no convierte formas propuestas en contrastadas');
const normalize=s=>norm(s).replace(/[–−—]/g,'-').trim();
const a=html.indexOf('function mVerb(raw){'),b=html.indexOf('// Corrections for conjugation:',a);
assert(a>0&&b>a,'Reglas de flexión inaccesibles');
const mVerb=new Function('mNormalize',html.slice(a,b)+'return mVerb;')(normalize);
assert.equal(mVerb('retineo, retinui, retentum (2ª)').tenses[0][1][1],'retines');
assert.equal(mVerb('retineo, retinui, retentum (2ª)').tenses[1][1][0],'retinebam');
assert.equal(mVerb('accedo, accessi, accessum (3ª)').supine,'accessum');
assert.equal(mVerb('constituo, constitui, constitutum (3ª)').tenses[3][1][0],'constitui');
assert.equal(mVerb('invenio, inveni, inventum (4ª)').tenses[0][1][5],'inveniunt');
assert.equal(mVerb('fugio, fugi – (mx.)'),null,
 'El perfecto sin supino docente no habilita un paradigma analógico');
assert.equal(mVerb('accido, accidi, – (3ª)'),null,
 'Accido con sentido de suceder carece de supino; no inventarlo');
const first=html.indexOf('function migrateSeededLatinVerbEntries(items){');
const last=html.indexOf('if(migrateSeededLatinVerbEntries(examRequired))saveRequired();',first);
assert(first>0&&last>first,'Migración de fichas exigibles no localizada');
const migrate=new Function('examKey',html.slice(first,last)+'return migrateSeededLatinVerbEntries;')
 (x=>head(x));
const saved=fixes.map(([course,unit,lemma,before])=>({
 course,unit,origin:'listado docente exigible',key:lemma,entry:before,meaning:'Conservar'
}));
const custom={course:'latin1',unit:'UD6',origin:'manual',
 entry:'fugio, fugi – (4ª)',meaning:'Mi versión'};
saved.push(custom);
assert.equal(migrate(saved),true);
fixes.forEach((x,i)=>{assert.equal(saved[i].entry,x[4]);assert.equal(saved[i].meaning,'Conservar')});
assert.equal(custom.entry,'fugio, fugi – (4ª)','No se permite sobrescribir ediciones manuales');
assert.equal(migrate(saved),false,'La migración no es idempotente');
console.log('Auditoría verbal estructural: '+checks.entries+' entradas calificadas y '+
 checks.lemmas.size+' parejas curso/lema, con comprobación de bancos, lista exigible, '+
 'índice, PWA, seis correcciones editoriales reproducibles, migración y paradigmas de muestra.');
console.log('La identidad de committo está cubierta por la auditoría de claves y su migración.');
