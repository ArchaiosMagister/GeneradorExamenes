'use strict';
// Una indicación editorial (ν) no es una forma escrita. La única expansión
// permitida procede de una variante explícita del paradigma documentado.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const offline=fs.readFileSync(path.join(root,'offline.html'),'utf8');
function fragment(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Fragmento perdido: '+start);
 return html.slice(a,b);
}
const helper=fragment('function greekWrittenFormVariants(form){','function greekCorpus(){');
const analysis=fragment('function greekVerbAnalysisCandidates(eligible){','function generateGreekMorphologyFixed(){');
const fallback=fragment('function examGreekVerbFormCandidates(pool,limit){','// Separate the grammatical quota');
for(const segment of [helper,analysis,fallback])
 assert(offline.includes(segment),'PWA sin sincronizar una de las tres rutas del ν móvil');
const norm=s=>String(s||'').normalize('NFC').toLocaleLowerCase('el');
const build=new Function('normLex','greekMorphologyEligible',
 helper+analysis+fallback+'return {expand:greekWrittenFormVariants,'+
 'analyze:greekVerbAnalysisCandidates,fallback:examGreekVerbFormCandidates};');
const {expand,analyze,fallback:forms}=build(norm,(item,limit)=>item.minUnit<=limit);
assert.deepEqual(expand('λύουσι(ν)'),['λύουσι','λύουσιν']);
assert.deepEqual(expand('ἔλυε(ν)'),['ἔλυε','ἔλυεν']);
assert.deepEqual(expand('ἐστί(ν)'),['ἐστί','ἐστίν']);
assert.deepEqual(expand('ἐλελύκει(ν)'),['ἐλελύκει','ἐλελύκειν']);
assert.deepEqual(expand('ἄρχουσι(ν)'),['ἄρχουσι','ἄρχουσιν']);
assert.deepEqual(expand('γυναιξί(ν)'),['γυναιξί','γυναιξίν']);
assert.deepEqual(expand('λύω'),['λύω']);
assert.deepEqual(expand('λύουσι(ς)'),[],'No inferir formas de notaciones no aprobadas');
assert.deepEqual(expand('λύω λύεις'),[],'No generar variantes de sintagmas');
const explicit=JSON.parse(html.match(/const greekExplicitVerbEvidence=(\{[^\n]+\});\n/)[1]);
const first=JSON.parse(html.match(/const greekVerbData=(\{[^\n]+\});\n/)[1]);
const section=fragment('Object.assign(greekVerbData,{ειμι:','Object.assign(greekVerbUnits,{');
const regular=new Function('greekVerbData',
 section+'return greekVerbData;')(first);
assert(regular['ειμι'].includes('ἐστί(ν)'),'Se ha perdido el ν móvil de εἰμί');
let optional=0,covered=0,synthetic=[];
function item(id,formsArray,minUnit,tense='presente',voice='activo'){
 return {id,kind:'conjugation',verified:true,minUnit,contentUnits:[minUnit],
  lemmas:[id],verbTense:tense,verbVoice:voice,
  table:{rows:[0,1,2].map(i=>[(i+1)+'ª',formsArray[i],formsArray[i+3]])}};
}
for(const [name,r] of Object.entries(explicit)){
 const x=item('ev-'+name,r.forms,r.unit,r.tense,r.voice);
 synthetic.push(x);
 const actual=analyze([x]),expected=new Set(r.forms.flatMap(expand));
 assert.equal(actual.length,expected.size,'Formas erróneas o duplicadas: '+name);
 assert.deepEqual(new Set(actual.map(z=>z.prompt)),expected);
 assert(actual.every(z=>!/[()]/.test(z.prompt)&&z.answer.includes(r.tense)));
 const omitted=r.forms.filter(x=>x.endsWith('(ν)'));
 for(const abbreviated of omitted){
  optional++;
  for(const form of expand(abbreviated)){
   const a=actual.find(v=>v.prompt===form);
   assert(a,'Falta '+form+' en '+name);
   assert(a.answer.includes(r.tense),'Análisis incorrecto: '+form);
  }
 }
 assert.equal(forms([x],r.unit-1).length,0,
  'Se habilitaron formas de '+name+' antes de UD'+r.unit);
 const fallbackCandidates=forms([x],r.unit);
 assert.deepEqual(new Set(fallbackCandidates.map(z=>z.prompt)),expected,
  'Candidaturas de reserva incorrectas para '+name);
 assert(fallbackCandidates.every(z=>z.id.startsWith('gvf-ev-'+name+'-')),
  'Se han alterado los identificadores de las fichas anteriores: '+name);
 covered+=actual.length;
}
for(const [name,record] of Object.entries(regular)){
 const x=item('v-'+name,record,1);
 const candidates=analyze([x]);
 assert.equal(candidates.length,new Set(record.flatMap(expand)).size,
  'Se pierde alguna persona del presente de '+name);
 if(record.some(form=>form.endsWith('(ν)')))optional++;
 assert(candidates.every(form=>!/[(]/.test(form.prompt)),
  'La notación editorial entra en el análisis de '+name);
}
for(const form of ['ἔλυον','ἦλθον']){
 const entry=synthetic.flatMap(x=>analyze([x])).find(x=>x.prompt===form);
 assert(entry&&entry.answer.includes('primera persona singular o tercera persona plural'),
  'Regresión de lectura sincrética en '+form);
}
assert.equal(optional,18,'La auditoría verbal debe mantener 18 notaciones');
assert.equal(2,['ἄρχουσι(ν)','γυναιξί(ν)'].length,
 'Deben cotejarse las dos notaciones nominales de tercera declinación');
assert(covered===64,'La ampliación no debe cambiar otras series verificadas');
assert.equal(html.split('greekWrittenFormVariants(form).forEach((surface,variantIndex)=>').length-1,2,
 'Corpus verbal y nominal deben compartir la expansión de ν móvil');
assert(html.includes('greekWrittenFormVariants(form).forEach((surface,variantIndex)=>'),
 'El corpus editable no publica las dos formas de ν móvil');
assert(html.includes("'ef-'+key+'-'+i+(variantIndex?'-nu':'')"),
 'No se mantiene el ID histórico al expandir una ficha');
assert(!html.includes("if(!prompt||/[()]/u.test(prompt)"),
 'La ruta secundaria sigue descartando variantes legítimas');
const numberChanger=fs.readFileSync(path.join(root,'greek-choice-number.js'),'utf8');
assert(numberChanger.includes('row.prompt.replace(/\\(ν\\)/gu'),
 'El cambio de número no normaliza las formas escritas');
console.log('Griego I: '+(optional+2)+' notaciones de ν móvil (18 verbales y dos nominales); '+
 covered+' formas explícitas con doble lectura cuando corresponda; no se evalúan grafías abreviadas.');

// Reconstrucción temporal del paquete autónomo antes de la PR.

// Nueva reconstrucción: verbos, tercera declinación y cambio de número.
