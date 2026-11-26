'use strict';
// Todas las personas griegas de una misma forma han de conservarse en el
// ejercicio verbal de morfología y al regenerar una palabra. Las abreviaciones
// de tabla con (ν) no deben sortearse como palabras independientes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const offline=fs.readFileSync(path.join(root,'offline.html'),'utf8');
const begin=html.indexOf('function greekVerbAnalysisCandidates(eligible){');
const end=html.indexOf('function generateGreekMorphologyFixed(){',begin);
assert(begin>0&&end>begin,'No se localiza la función compartida de lecturas verbales');
const snippet=html.slice(begin,end);
const helperBegin=html.indexOf('function greekWrittenFormVariants(form){');
const helperEnd=html.indexOf('function greekCorpus(){',helperBegin);
assert(helperBegin>0&&helperEnd>helperBegin,'No se encontró el expansor griego de ν móvil');
const helper=html.slice(helperBegin,helperEnd);
assert(offline.includes(helper),'La PWA no contiene el expansor de ν móvil');
assert(offline.includes(snippet),'La PWA no contiene el mismo motor de análisis griego');
const sandbox=new Function('normLex',helper+snippet+
 'return {generator:greekVerbAnalysisCandidates,expand:greekWrittenFormVariants};')
 (x=>String(x).toLocaleLowerCase('el').normalize('NFC'));
const generator=sandbox.generator,expand=sandbox.expand;
const m=html.match(/const greekExplicitVerbEvidence=(\{[^\n]+\});\n/);
assert(m,'Faltan las diez series verbales griegas explícitas');
const series=JSON.parse(m[1]);
assert.equal(Object.keys(series).length,10);
let count=0;
for(const [id,record] of Object.entries(series)){
 const item={
  verified:true,kind:'conjugation',minUnit:record.unit,lemmas:[record.lemma],
  verbTense:record.tense,verbVoice:record.voice,
  table:{rows:[0,1,2].map(i=>[(i+1)+'ª',record.forms[i],record.forms[i+3]])}
 };
 const actual=generator([item]);
 const expectedForms=new Set(record.forms.flatMap(expand));
 assert.equal(actual.length,expectedForms.size,
  id+': duplicados, lecturas perdidas o variantes editoriales sorteadas');
 assert.equal(new Set(actual.map(x=>x.prompt)).size,actual.length,id+': duplicación de forma escrita');
 assert(actual.every(x=>x.lemma===record.lemma&&x.minUnit===record.unit),
  id+': cambio de lema o disponibilidad curricular');
 assert(actual.every(x=>!/[()]/.test(x.prompt)&&x.answer.includes(record.tense)),
  id+': respuesta incompleta o forma no apta para análisis individual');
 const ambiguities=record.forms.filter((form,i)=>record.forms.indexOf(form)===i&&
  record.forms.lastIndexOf(form)!==i);
 for(const form of ambiguities){
  const analyses=actual.filter(x=>x.prompt===form);
  assert.equal(analyses.length,1,id+': el sincretismo debe aparecer una sola vez');
  assert.match(analyses[0].answer,/primera persona singular o tercera persona plural/,
   id+': faltan ambas lecturas de '+form);
  assert.match(analyses[0].person,/1ª singular o 3ª plural/,
   id+': se perdió la pluralidad en el campo de persona');
 }
 count+=actual.length;
}
assert.equal(count,64,'Las seis notaciones opcionales aportan doce formas escritas verificables');
for(const variant of ['ἔλυον','ἦλθον'])
 assert(html.includes(variant),'Falta el sincretismo académico '+variant);
const generation=html.slice(end,html.indexOf('let greekExamState',end));
assert.match(generation,/greekMorphologyReplacementPool\('verb',limit,eligible\)/,
 'El sorteo inicial debe consultar el mismo banco de sustituciones verbales');
const pool=html.slice(html.indexOf('function greekMorphologyReplacementPool('),
 html.indexOf('function regenerateLatinMorphologyVerb('));
assert.match(pool,/if\(kind==='verb'\)return greekVerbAnalysisCandidates\(eligible\)/,
 'El banco compartido debe conservar las lecturas verbales sincréticas');
assert(!html.includes("syncretic:x.verbTense==='aoristo segundo'"),
 'No mantener el viejo filtro que excluía ἦλθον sin explicar sus lecturas');
console.log('Griego I: '+count+' formas individuales no duplicadas en 10 series, '+
 'ἔλυον y ἦλθον con doble interpretación; web, PWA y regeneración sincronizadas.');

// Reconstrucción de distribución offline en rama aislada, sin publicación.

// Segunda ejecución: dependencias de navegador se validarán en la PR.

// CI de PR #195: cotejar ambos modelos y el comportamiento offline final.
