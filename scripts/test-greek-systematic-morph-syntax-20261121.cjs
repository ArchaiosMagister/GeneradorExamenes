'use strict';
// Regresión del corpus de las 14 UD, once oraciones evaluables y glosario,
// sin declarar automáticamente ninguna forma verificada por analogía.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const source=JSON.parse(read('data/vocabulary/greek1-units-corrected.json'));
const evidence=JSON.parse(read('data/vocabulary/greek1-systematic-morph-syntax-audit-20261121.json'));
const verified=JSON.parse(read('data/lemmas/teacher-forms.json'));
const engine=read('vocabulary-generator.js'),online=read('index.html'),offline=read('offline.html');
const historical=JSON.parse(read('tests/greek-priority-forms.json'));
const marker='const greekSentenceRows=[';
function examRows(text){
 const i=text.indexOf(marker),j=text.indexOf('];',i);
 assert(i>=0&&j>i,'Faltan oraciones evaluables de Griego I');
 return vm.runInNewContext('(['+text.slice(i+marker.length,j)+'])');
}
const ons=examRows(online),offs=examRows(offline);
assert.equal(source.count,14);assert.equal(source.course,'gr1');assert.equal(source.units.length,14);
assert.equal(source.units.reduce((n,u)=>n+u.text.split('\n').filter(Boolean).length,0),471);
assert.equal(ons.length,11);assert.equal(offs.length,11);
assert.equal(JSON.stringify(ons),JSON.stringify(offs),'Divergencia web/autónoma en las 11 oraciones');
assert.equal(evidence.schema,1);assert.equal(evidence.course,'gr1');
assert.equal(evidence.unitCount,14);assert.equal(evidence.sourceLines,471);
assert.equal(evidence.gradedSentenceCount,11);
assert.equal(evidence.automaticGradingEnabled,false);assert.equal(evidence.morphologyPromotion,false);
assert.equal(evidence.corrections.length,6);
assert.equal(evidence.contextualHomographies.length,1);
const homonym=evidence.contextualHomographies[0];
assert.equal(homonym.form,'νέων');
assert.deepEqual(homonym.units,[11]);
assert.equal(homonym.indexLemma,'νεοσ');
assert.equal(homonym.competingLemma,'ναυσ');
assert.equal(homonym.expectedStatus,'review');
assert(source.units[10].text.includes(homonym.context),
 'La frase de los jóvenes debe permanecer reconocible, sin sustituirla por naves');
for(const fix of evidence.corrections){
 assert(/^https:\/\//.test(fix.reference));assert.notEqual(fix.old,fix.updated);
 if(fix.scope==='corpus'){
  const lines=source.units[fix.unit-1].text.split('\n');
  assert(lines[fix.line-1]?.includes(fix.updated),'UD'+fix.unit+': '+fix.updated);
  assert(!source.units.some(u=>u.text.includes(fix.old)),'Persiste '+fix.old);
 }else{
  assert.equal(fix.scope,'gradedSentence');
  assert(ons[fix.index-1]?.[0].includes(fix.updated),'Enunciado web '+fix.index);
  assert(offs[fix.index-1]?.[0].includes(fix.updated),'Enunciado offline '+fix.index);
  assert(!ons.some(x=>x[0].includes(fix.old)),'Web conserva error '+fix.old);
  assert(!offs.some(x=>x[0].includes(fix.old)),'Autónoma conserva error '+fix.old);
 }
}
assert(ons[2][4].includes('ἀδίκους')||ons[2][4].includes('ἀδίκους'),
 'Se ha perdido el análisis del acusativo de ἄδικος');
assert(!ons[2][4].includes('ἀδικοί'),'Análisis discordante con la forma corregida');
assert(engine.includes("['ἐρωτάω','preguntar',['ἐρωτᾶται','ἠρωτῶντο']]"));
assert(engine.includes("['ναῦς','nave',['νεῶν']]"));
assert(engine.includes("['λείπω','dejar',['ἔλιπον','ἔλειψαν']]"));
assert(!engine.includes("['ἐρωτάω','preguntar',['ἐρωτᾶται','ἠρωτᾶντο']]"));
assert(offline.includes("['ἐρωτάω','preguntar',['ἐρωτᾶται','ἠρωτῶντο']]"),
 'Glosario autónomo desactualizado');
assert(offline.includes("['ναῦς','nave',['νεῶν']]"),
 'Glosario autónomo no incluye la lectura náutica');
assert(!verified.rows.grc.some(row=>
 ['ἠρωτῶντο','νεῶν','ἔλιπον'].includes(row[1].normalize('NFC'))&&row[3]===5),
 'Se elevó una forma contextual al índice de fuente 5');
assert(historical.units[13].forms.includes('ἠρωτᾶντο'),
 'La ficha histórica debe preservar el testigo retirado');
console.log('GRIEGO 14 UD / 471 renglones / 11 evaluables: 6 correcciones contrastadas, web y autónoma sincronizadas, ninguna promoción morfológica.');
