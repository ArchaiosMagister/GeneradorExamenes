'use strict';
// Script temporal de reconstrucción sobre rama aislada. No modifica upstream.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,t)=>fs.writeFileSync(path.join(root,p),t,'utf8');
function substitute(s,from,to,name){
 const n=s.split(from).length-1;
 assert.equal(n,1,'Sustitución ambigua en '+name+': '+n+' ocurrencias');
 return s.replace(from,to);
}
const old='commito, commisi, commissum (3ª)';
const corrected='committo, commisi, commissum (3ª)';
let html=read('index.html');
html=substitute(html,'"entry": '+JSON.stringify(old),'"entry": '+JSON.stringify(corrected),'Banco HTML');
const migrationAnchor="['invenio, inveni, inventum','invenio, inveni, inventum (4ª)']";
html=substitute(html,migrationAnchor,
 migrationAnchor+",\n   ['"+old+"','"+corrected+"']",'Migración de exigible');
let required=read('required-latin-units.js');
required=substitute(required,JSON.stringify(old),JSON.stringify(corrected),'Exigible de Latín I');
const decisionsFile='data/lemmas/latin-editorial-decisions.json';
const decisions=JSON.parse(read(decisionsFile));
assert.equal(decisions.schema,1);assert.equal(decisions.course,'lat1');
assert.equal(decisions.verifiedMorphology,false);
assert.equal(decisions.decisions.length,1,'Decisiones docentes inesperadas');
decisions.decisions.push({
 id:'committo-lat1-unify',type:'entry',fromLemma:'commito',toLemma:'committo',
 fromEntry:old,toEntry:corrected,units:['UD 4'],preserveMeaning:true,
 mergeExistingCourse:'lat4',reference:'https://logeion.org/committo',
 reason:'Corregir grafía y fusionar el lema con Latín 4.º sin perder cursos, unidades, traducciones ni certificar formas por analogía',
 approved:'2026-11-21',verifiedMorphology:false
});
let builder=read('scripts/build-lemma-index.mjs');
builder=substitute(builder,
 ' const latinEditorialLemmaRekeys=new Map();',
 ' const latinEditorialLemmaRekeys=new Map();\n let mergedLatinEditorialLemmas=0;',
 'Contador de fusiones autorizadas');
const oldStart=builder.indexOf('  if(original?.lat1){',builder.indexOf('const latinEditorialLemmaRekeys'));
const oldEnd=builder.indexOf('  latinEditorialLemmaRekeys.set(decision.fromLemma,decision.toLemma);',oldStart);
assert(oldStart>0&&oldEnd>oldStart,'Bloque de re-clave no reconocible');
const oldBlock=builder.slice(oldStart,oldEnd);
assert(oldBlock.includes("if(revised||original.lat1.entry!==decision.fromEntry"),'Condiciones previas de seguridad no esperadas');
const newBlock=[
"  if(original?.lat1){",
"   // Solo autorizar la fusión explícita commito -> committo entre cursos disjuntos.",
"   const joining=decision.mergeExistingCourse==='lat4';",
"   if(joining&&(decision.fromLemma!=='commito'||decision.toLemma!=='committo'))",
"    throw Error('Fusión no autorizada: '+decision.id);",
"   if((revised&&!joining)||(!revised&&joining)||",
"      (joining&&(original.lat4||!revised.lat4||revised.lat1))||",
"      original.lat1.entry!==decision.fromEntry||",
"      JSON.stringify([...original.lat1.units].sort())!==JSON.stringify([...decision.units].sort()))",
"    throw Error('La ficha latina cambió inesperadamente: '+decision.id);",
"   catalog.lat[decision.toLemma]={",
"    ...(joining?revised:original),",
"    lat1:{...original.lat1,entry:decision.toEntry}",
"   };",
"   delete catalog.lat[decision.fromLemma];",
"   if(joining)mergedLatinEditorialLemmas++;",
"  }else if(!revised?.lat1||revised.lat1.entry!==decision.toEntry){",
"   throw Error('No se puede reproducir la decisión latina: '+decision.id);",
"  }",
""
].join('\n');
builder=builder.slice(0,oldStart)+newBlock+builder.slice(oldEnd);
builder=substitute(builder,
 'if(Object.keys(catalog[lang]).length!==manifest.languages[lang].vocabulary_lemmas)',
 "if(Object.keys(catalog[lang]).length!==manifest.languages[lang].vocabulary_lemmas-\n  (lang==='lat'?mergedLatinEditorialLemmas:0))",
 'Inventario fuente con unificación de dos claves');
let lemmaTest=read('scripts/test-lemma-index.mjs');
lemmaTest=substitute(lemmaTest,'assert.equal(latinEditorial.decisions.length,1);',
 'assert.equal(latinEditorial.decisions.length,2);','Decisiones editoriales');
lemmaTest=substitute(lemmaTest,
 "assert.equal(Object.keys(data.vocabulary.lat).length,772+(data.extensions?.readerEnrichment?.additions?.lat||0),",
 "assert.equal(Object.keys(data.vocabulary.lat).length,771+(data.extensions?.readerEnrichment?.additions?.lat||0),",
 'Conteo neto de lemas');
lemmaTest=substitute(lemmaTest,
 "assert(!data.rows.lat.some(row=>row[0]==='tenerus'),'No deben conservarse registros huérfanos');",
 "assert(!data.rows.lat.some(row=>row[0]==='tenerus'),'No deben conservarse registros huérfanos');\n"+
 "assert(!data.vocabulary.lat.commito&&!data.rows.lat.some(row=>row[0]==='commito'),\n"+
 " 'No puede quedar una segunda clave por la errata commito');\n"+
 "assert(data.vocabulary.lat.committo.lat1&&data.vocabulary.lat.committo.lat4,\n"+
 " 'Ambos cursos deben compartir committo');",
 'Prueba explícita de re-clave');
let morph=read('scripts/test-comprehensive-morph-audit.cjs');
morph=substitute(morph,'3244+4*18','3244+4*18-18','Propuestas deduplicadas');
morph=substitute(morph,
 "'Cambio de candidaturas ajeno a los cuatro lemas con propuestas regulares recuperadas'",
 "'Cambio ajeno a cuatro lemas recuperados y a la fusión de 18 propuestas duplicadas'",
 'Mensaje de auditoría');
let batch=read('scripts/test-candidaturas-lote200.cjs');
batch=substitute(batch,'3244+4*18','3244+4*18-18','Propuestas deduplicadas del lote');
batch=substitute(batch,
 "'Únicamente 72 propuestas provisionales: sepelio, solvo, vivo e invenio (18 cada uno)'",
 "'Cuatro lemas recuperan 72 propuestas; se deduplican 18 de commito, sin certificar formas'",
 'Mensaje del lote');
let verbAudit=read('scripts/test-latin-verb-corpus-audit.cjs');
verbAudit=substitute(verbAudit,
 "console.log('Pendiente de auditoría léxica separada: commito/committo (cambio de clave del lema).');",
 "console.log('La identidad de committo está cubierta por la auditoría de claves y su migración.');",
 'Estado de auditoría latina');
let ci=read('.github/workflows/offline-check.yml');
ci=substitute(ci,
 '      - name: Cotejar paradigmas individuales verificados con la fuente persistente',
 '      - name: Proteger committo, su unificación intercurricular, la migración y la PWA\n'+
 '        run: node scripts/test-committo-lemma-unification.cjs\n'+
 '      - name: Cotejar paradigmas individuales verificados con la fuente persistente',
 'Integración continua');
for(const [p,data] of [
 ['index.html',html],['required-latin-units.js',required],
 [decisionsFile,JSON.stringify(decisions,null,2)+'\n'],
 ['scripts/build-lemma-index.mjs',builder],['scripts/test-lemma-index.mjs',lemmaTest],
 ['scripts/test-comprehensive-morph-audit.cjs',morph],
 ['scripts/test-candidaturas-lote200.cjs',batch],
 ['scripts/test-latin-verb-corpus-audit.cjs',verbAudit],
 ['.github/workflows/offline-check.yml',ci]
])write(p,data);
console.log('Fuentes y pruebas actualizadas; reconstruir índice y offline antes de evaluar.');

// Activación única de la reconstrucción en la rama aislada.
