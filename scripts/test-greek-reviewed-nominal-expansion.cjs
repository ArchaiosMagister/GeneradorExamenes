'use strict';
// Esta prueba no convierte un catálogo provisional en evidencia.
// Cada forma de la ampliación debe proceder de un paradigma explícito v19
// o de una casilla YA contrastada individualmente en verified-overrides.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const raw=html.match(/const greekExamReviewedNominalRows=(\[[^\n]+\]);\nfunction greekExamNominalAnswer/);
assert(raw,'Falta el registro nominal contrastado de Griego I');
const rows=JSON.parse(raw[1]);
const overrides=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/verified-overrides.json'),'utf8'));
const teacher=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const provisional=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/greek-nominal-candidates.json'),'utf8'));
assert.equal(provisional.status,'WIKTIONARY_CANDIDATES_NOT_FOR_GRADING');
const spelling=s=>String(s).normalize('NFD').replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const sources=new Map();
for(const line of overrides.singleForms.filter(x=>x.lang==='grc'&&/^(N|ADJ);/.test(x.tags))){
 const key=[line.lemma,spelling(line.form),line.tags,line.reference].join('|');
 sources.set(key,(sources.get(key)||0)+1);
}
const seen=new Set(),counts={nouns:0,adjectives:0},available={};
for(const [lemma,entry,unit,category,gender,declension,reference,forms] of rows){
 assert(!seen.has(lemma),lemma+': registro duplicado');
 seen.add(lemma);
 assert.equal(entry,teacher.vocabulary.grc[lemma]?.gr1?.entry,lemma+': enunciado sin respaldo docente');
 assert([3,5,7,8,2,1].includes(unit),lemma+': unidad irregular');
 assert(/^https:\/\//.test(reference),lemma+': falta referencia individual');
 if(category==='adjectives'){
  assert(unit===5||unit===7,lemma+': adjetivo adelantado');
  assert.equal(gender,'',lemma+': género fijo incompatible con adjetivos');
  assert.equal(declension,'',lemma+': declinación noun incompatible con adjetivos');
 }else{
  assert.equal(category,'nouns');
  assert(['m','f','n'].includes(gender),lemma+': género sin validar');
  assert(['primera','segunda','tercera'].includes(declension),lemma+': declinación sin validar');
  assert.equal(unit,declension==='tercera'?8:declension==='primera'?3:gender==='n'?2:1,
   lemma+': se anticipó un contenido aún no explicado');
 }
 assert(Array.isArray(forms)&&forms.length>0,lemma+': sin formas');
 const localForms=new Set();
 for(const [form,analyses]of forms){
  assert.equal(form,spelling(form),lemma+': grafía todavía con cantidades vocálicas');
  assert(!localForms.has(form),lemma+': falta agrupar lecturas de la misma forma '+form);
  localForms.add(form);
  assert(!/\s/u.test(form),lemma+': el análisis es de palabras aisladas');
  const fullTags=(analyses||'').split('|').map(analysis=>
   (category==='adjectives'?'ADJ;':'N;')+analysis);
  assert(fullTags.length>0&&fullTags.every(Boolean),lemma+': análisis vacío');
  for(const tag of fullTags){
   assert(sources.has([lemma,form,tag,reference].join('|')),
    lemma+': forma o lectura sin contraste individual: '+form+' / '+tag);
   assert(/^(?:N|ADJ);(?:NOM|VOC|GEN|DAT|ACC);(?:SG|PL)(?:;(MASC|FEM|NEUT))?$/.test(tag),
    lemma+': etiquetas fuera de programa: '+tag);
  }
 }
 counts[category]+=forms.length;
 available[lemma]=forms.length;
}
assert(rows.length>=40,'La ampliación nominal es demasiado pequeña');
assert(counts.nouns>=90,'Faltan sustantivos contrastados');
assert(counts.adjectives>=120,'Faltan adjetivos contrastados');
assert(!seen.has('ολιγοσ'),'ὀλιγός no se puede reintroducir por esta vía');
assert(!seen.has('ελλην'),'Los gentilicios quedan fuera del análisis griego');
assert(!seen.has('τοποσ'),'El paradigma pendiente τόπος requiere revisión separada');
assert(html.includes('for(const [key,forms] of Object.entries(greekNounData))'),'No se reutilizan los diez paradigmas explícitos');
assert(html.includes("addNominalForm('gn-reviewed-'"),'Las formas ampliadas no entran en el corpus');
assert(!html.includes("greek-nominal-candidates.json';"),'El catálogo de candidatas no es un motor evaluable');
console.log('EVIDENCIA NOMINAL GRIEGA '+JSON.stringify({lemmas:rows.length,forms:counts,first:Object.entries(available).slice(0,6)}));
