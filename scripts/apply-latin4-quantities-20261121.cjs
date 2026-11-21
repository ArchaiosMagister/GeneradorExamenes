#!/usr/bin/env node
'use strict';
// Aplicación idempotente y delimitada de correcciones documentadas de Latín 4.º.
// No modifica formas flexivas, unidades, traducciones ni decisiones particulares del usuario.
// El índice y offline.html se reconstruyen DESPUÉS con los constructores habituales.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');
const replacements = [
 {before:'hōstĭs',after:'hŏstĭs',occurrences:4,lemma:'hostis',
  catalogBefore:'hōstĭs, –is (m.)',catalogAfter:'hŏstĭs, –is (m.)',
  reference:'https://en.wiktionary.org/wiki/hostis',
  note:'O breve fonológica; sílaba hos- larga por posición ante -st-. No acredita flexiones nuevas.'},
 {before:'īmpĕrātŏr',after:'ĭmpĕrātŏr',occurrences:3,lemma:'imperator',
  catalogBefore:'īmpĕrātŏr, –oris (m.)',catalogAfter:'ĭmpĕrātŏr, –oris (m.)',
  reference:'https://en.wiktionary.org/wiki/imperator',
  note:'I inicial breve; sílaba im- larga por posición ante mp.'},
 {before:'cōllĭs',after:'cŏllĭs',occurrences:1,lemma:'collis',
  catalogBefore:'cōllĭs, –is (m.)',catalogAfter:'cŏllĭs, –is (m.)',
  reference:'https://en.wiktionary.org/wiki/collis',
  note:'O breve fonológica; sílaba col- larga por ll.'},
 {before:'ōppūgnātĭō',after:'ŏppūgnātĭō',occurrences:2,lemma:'oppugnatio',
  catalogBefore:'ōppūgnātĭō, –onis (f.)',catalogAfter:'ŏppūgnātĭō, –onis (f.)',
  reference:'https://logeion.uchicago.edu/oppugnatio',
  note:'Solo o inicial breve de ob-; conservar ū y notación de cantidad final variable.'},
 {before:'mŭlĭĕr, –ris',after:'mŭlĭĕr, –eris (f.)',occurrences:1,
  note:'Normalización editorial del genitivo abreviado: –ris no es una forma flexiva falsa.'}
];
function count(source,term){return source.split(term).length-1;}
function patchText(source,label){
 let updated=source;
 for(const fix of replacements){
  const n=count(updated,fix.before);
  assert(n===fix.occurrences||n===0,
    label+': recuento inesperado de '+fix.before+': '+n+' (esperado '+fix.occurrences+' o 0)');
  if(n)updated=updated.replaceAll(fix.before,fix.after);
 }
 return updated;
}
const requiredPath='required-latin-units.js';
const originalRequired=read(requiredPath);
assert(originalRequired.includes('window.ExaminaRequiredLatinUnits='));
const correctedRequired=patchText(originalRequired,requiredPath);
const required=JSON.parse(correctedRequired.split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
assert.equal(Object.values(required.courses.latin1).flat().length,1106);
assert.equal(Object.values(required.courses.latin4).flat().length,541);
const expectations=[
 ['UD5','hŏstĭs, –is (m.)'],['UD7','hŏstĭs, –is'],['UD8','hŏstĭs, –is (m.)'],['UD10','hŏstĭs, –is (m.)'],
 ['UD5','ĭmpĕrātŏr, –oris (m.)'],['UD6','ĭmpĕrātŏr, –oris (m.)'],['UD7','ĭmpĕrātŏr, –oris'],
 ['UD5','cŏllĭs, –is (m.)'],
 ['UD5','ŏppūgnātĭō, –onis (f.)'],['UD6','ŏppūgnātĭō̆, –onis'],
 ['UD8','mŭlĭĕr, –eris (f.)']
];
for(const [unit,entry] of expectations){
 assert.equal(required.courses.latin4[unit].filter(x=>x===entry).length,1,
  'Se ha perdido o duplicado '+unit+' / '+entry);
}
const htmlPath='index.html',originalHtml=read(htmlPath);
const start=originalHtml.indexOf('vocab.push(...[');
const stop=originalHtml.indexOf(');\n',start);
assert(start>0&&stop>start,'No se encuentra el banco independiente de Latín 4.º');
const vocabPart=originalHtml.slice(start,stop);
assert(vocabPart.includes('"course": "latin4"'),'La selección no corresponde a Latín 4.º');
let updatedHtml=originalHtml.slice(0,start)+patchText(vocabPart,htmlPath)+originalHtml.slice(stop);
const migrationMarker='/* Cantidades latinas PR205: solo fichas exigibles sembradas, nunca ediciones manuales. */';
if(!updatedHtml.includes(migrationMarker)){
 const marker="['rĕtĭnĕō, retĭnŭī, retentum (3ª)','rĕtĭnĕō, retĭnŭī, retentum (2ª)']]";
 assert.equal(count(updatedHtml,marker),1,'El marcador de migración histórica ha cambiado');
 const mappings=[
  ['hōstĭs, –is (m.)','hŏstĭs, –is (m.)'],
  ['hōstĭs, –is','hŏstĭs, –is'],
  ['īmpĕrātŏr, –oris (m.)','ĭmpĕrātŏr, –oris (m.)'],
  ['īmpĕrātŏr, –oris','ĭmpĕrātŏr, –oris'],
  ['cōllĭs, –is (m.)','cŏllĭs, –is (m.)'],
  ['ōppūgnātĭō, –onis (f.)','ŏppūgnātĭō, –onis (f.)'],
  ['ōppūgnātĭō̆, –onis','ŏppūgnātĭō̆, –onis'],
  ['mŭlĭĕr, –ris','mŭlĭĕr, –eris (f.)']
 ];
 const expansion=mappings.map(pair=>','+JSON.stringify(pair)).join('');
 updatedHtml=updatedHtml.replace(marker,marker.slice(0,-1)+expansion+']');
 updatedHtml=updatedHtml.replace('function migrateSeededLatinVerbEntries(items){',
  migrationMarker+'\nfunction migrateSeededLatinVerbEntries(items){');
}
const overridesPath='data/lemmas/verified-overrides.json';
const originalOverrides=read(overridesPath);
const overrides=JSON.parse(originalOverrides);
assert.equal(overrides.schema,1);assert.equal(overrides.sourceCode,5);
for(const fix of replacements.filter(x=>x.catalogBefore)){
 let found=overrides.entryCorrections.filter(x=>x.lang==='lat'&&x.course==='lat4'&&x.lemma===fix.lemma);
 assert(found.length<=1,'Corrección duplicada del lema '+fix.lemma);
 if(found.length){
  assert.equal(found[0].from,fix.catalogBefore);
  assert.equal(found[0].to,fix.catalogAfter);
 }else{
  overrides.entryCorrections.push({
   lang:'lat',lemma:fix.lemma,course:'lat4',
   from:fix.catalogBefore,to:fix.catalogAfter,reference:fix.reference,
   note:fix.note
  });
 }
}
const updatedOverrides=JSON.stringify(overrides,null,2)+'\n';
// Solo escribir una vez que estén validados TODOS los invariantes.
for(const [path,before,after] of [
 [requiredPath,originalRequired,correctedRequired],
 [htmlPath,originalHtml,updatedHtml],
 [overridesPath,originalOverrides,updatedOverrides]
])if(before!==after)fs.writeFileSync(path,after,'utf8');
console.log('Latín 4.º: 11 apariciones normalizadas, 4 overrides persistentes, semillas migrables, sin cambiar el inventario.');
