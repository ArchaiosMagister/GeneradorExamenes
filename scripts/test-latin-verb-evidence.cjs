'use strict';
// Garantía de procedencia: cada forma irregular/deponente incorporada al
// generador existe exactamente en la ficha persistente de ese mismo análisis.
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {Script,createContext}=require('node:vm');
const root=resolve(__dirname,'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const corpus=JSON.parse(readFileSync(resolve(root,'data/lemmas/teacher-forms.json'),'utf8'));
const match=html.match(/const latinExplicitVerbEvidence=(\{[^\n]+\});\nfunction latinExplicitVerbRows/);
assert(match,'Falta la tabla explícita de evidencia verbal');
const evidence=JSON.parse(match[1]);
assert.deepEqual(Object.keys(evidence).sort(),
 ['audeo','confero','conor','eo','loquor','possum','sequor','sum']);
const overrides=JSON.parse(readFileSync(resolve(root,'data/lemmas/verified-overrides.json'),'utf8'));
let total=0;
for(const [lemma,series]of Object.entries(evidence)){
 const entry=corpus.vocabulary.lat[lemma]?.lat1;
 assert(entry,'La ficha no pertenece al vocabulario de Latín I: '+lemma);
 for(const item of series){
  assert.equal(item.forms.length,6);
  const suffixes=item.sourceCode===1?['1.sg','2.sg','3.sg','1.pl','2.pl','3.pl']:
   ['1;SG','2;SG','3;SG','1;PL','2;PL','3;PL'];
  const category=item.sourceCode===1?
   (item.voice==='semideponente'?'DOCENTE;perfecto de indicativo, sujeto masculino':'DOCENTE;presente de indicativo deponente'):
   item.voice==='deponente'?'V;IND;DEP;PRS':
   item.tense==='presente'?'V;IND;ACT;PRS':
   item.tense==='imperfecto'?'V;IND;ACT;PST;IPFV':
   item.tense==='futuro'?'V;IND;ACT;FUT':
   item.tense==='perfecto'?'V;IND;ACT;PRF':'V;IND;ACT;PSTP';
  if(item.sourceCode===5){
   const verified=overrides.paradigms.find(x=>x.lang==='lat'&&x.lemma===lemma)?.blocks.find(x=>x.tags===category);
   assert(verified,lemma+': falta la fuente persistente del tiempo '+item.tense);
   assert.deepEqual(item.forms,verified.forms,'El enunciado debe reflejar las casillas contrastadas');
  }
  item.forms.forEach((form,i)=>{
   const matches=corpus.rows.lat.filter(row=>row[0]===lemma&&row[1]===form&&
    row[2]===category+';'+suffixes[i]&&row[3]===item.sourceCode);
   assert.equal(matches.length,1,lemma+' '+item.tense+' '+form+' no se ha contrastado individualmente');
   total++;
  });
 }
}
assert.equal(total,120,'Cantidad de fichas contrastadas registrada inesperada');
assert.equal(evidence.audeo?.[0]?.voice,'semideponente');
assert.equal(evidence.audeo?.[0]?.tense,'perfecto');
assert(!evidence.audeo.some(x=>x.tense==='presente'),'No generalizar el infectum de audeo');
assert.equal(corpus.rows.lat.filter(row=>row[0]==='possum'&&row[3]===5).length,30);
assert.equal(corpus.rows.lat.filter(row=>row[0]==='confero'&&row[3]===5).length,30);
assert(!evidence.fero,'No incorporar el lema fero: no consta en el vocabulario docente');
assert(evidence.loquor[0].voice==='deponente'&&evidence.sequor[0].voice==='deponente');

const start=html.indexOf('function mVerb(raw){');
const end=html.indexOf('// Corrections for conjugation:',start);
assert(start>=0&&end>start,'No se encuentra el generador regular');
const sandbox=createContext({mNormalize:val=>String(val).normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/[–−—]/g,'-').replace(/æ/gi,'ae').replace(/œ/gi,'oe').trim()});
new Script(html.slice(start,end)+'\nglobalThis.testVerb=mVerb').runInContext(sandbox);
const verb=sandbox.testVerb;
const standard=verb('duco, duxi, ductum (3ª)');
assert.deepEqual(Array.from(standard.tenses[0][1]),['duco','ducis','ducit','ducimus','ducitis','ducunt']);
const mixed=verb('capio, cepi, captum (mx.)');
assert(mixed,'Debe reconocerse la conjugación mixta');
assert.equal(mixed.conj,'mx');
assert.deepEqual(Array.from(mixed.tenses[0][1]),['capio','capis','capit','capimus','capitis','capiunt']);
assert.deepEqual(Array.from(mixed.tenses[1][1]),['capiebam','capiebas','capiebat','capiebamus','capiebatis','capiebant']);
assert.deepEqual(Array.from(mixed.tenses[2][1]),['capiam','capies','capiet','capiemus','capietis','capient']);
assert.deepEqual(Array.from(mixed.tenses[3][1]),['cepi','cepisti','cepit','cepimus','cepistis','ceperunt']);
const facio=verb('facio, feci, factum (mx.)');
assert.deepEqual(Array.from(facio.tenses[0][1]),['facio','facis','facit','facimus','facitis','faciunt']);
assert.equal(verb('facio, feci, factum (3ª)'),null,'No asimilar facio a la tercera regular');
assert.equal(verb('loquor, locutus sum (3ª)'),null,'Un deponente no sigue la regla activa');
assert.equal(verb('sum, fui, – (irr.)'),null,'Sum exige registro explícito');
assert.equal(verb('fero, tuli, latum (irr.)'),null,'Fero no sigue una conjugación regular');

assert(html.includes("const latinPersonalPresentPassiveLemmas=new Set([...latinPersonalPerfectPassiveLemmas].filter(x=>x!=='facio'))"),
 'Falta la excepción de facio y el inventario de pasivas personales');
assert(html.includes("if(latinPersonalPresentPassiveLemmas.has(examKey(entry)))"),
 'La pasiva no está condicionada a la transitividad admitida');
console.log('Latín I: 120 fichas contrastadas (incluido el perfecto semideponente docente de audeo); cinco conjugaciones y mixta sin pasivas ficticias.');
