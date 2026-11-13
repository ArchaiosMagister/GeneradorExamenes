'use strict';
// Fuente persistente -> índice -> copia de uso en el generador: identidad completa
// para las formas contrastadas, sin considerar documentado el resto del paradigma.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/verified-overrides.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const latinMatch=html.match(/const latinExplicitVerbEvidence=(\{[^\n]+\});\nfunction latinExplicitVerbRows/);
const greekMatch=html.match(/const greekExplicitVerbEvidence=(\{[^\n]+\});\nfunction greekCorpus/);
assert(latinMatch&&greekMatch,'La app debe contener solo extractos de los paradigmas contrastados');
const latin=JSON.parse(latinMatch[1]),greek=JSON.parse(greekMatch[1]);
const records=source.paradigms.filter(x=>['possum','confero','loquor','sequor','βουλομαι','ερχομαι','eo','redeo','transeo','proficiscor','ηγεομαι','μαχομαι'].includes(x.lemma));
assert.equal(records.length,12);
const translate={
 'V;IND;ACT;PRS':'presente','V;IND;ACT;PST;IPFV':'imperfecto',
 'V;IND;ACT;FUT':'futuro','V;IND;ACT;PRF':'perfecto',
 'V;IND;ACT;PSTP':'pluscuamperfecto','V;IND;DEP;PRS':'presente',
 'V;IND;DEP;PST;IPFV':'imperfecto','V;IND;DEP;FUT':'futuro'
};
let newForms=0;
for(const x of records){
 assert(index.vocabulary[x.lang][x.lemma],'Lema inexistente: '+x.lemma);
 assert(index.source.externalVerification.some(y=>y.lang===x.lang&&y.lemma===x.lemma&&y.reference===x.reference),
  'No se ha preservado la referencia de '+x.lemma);
 assert(!index.rows[x.lang].some(row=>row[0]===x.lemma&&row[2]==='LEX;ENTRY'),
  'Una ficha con flexiones contrastadas no puede quedar como cita léxica');
 const selected=x.lang==='lat'?latin[x.lemma]:null;
 for(const block of x.blocks.filter(b=>!(x.lemma==='ερχομαι'&&b.tags==='V;IND;MID;PRS'))){
  if(selected){
   const entry=selected.find(y=>y.tense===translate[block.tags]&&
    y.voice===(block.tags.includes('DEP')?'deponente':'activa'));
   assert(entry,'Falta bloque visible '+x.lemma+' '+block.tags);
   assert.deepEqual(entry.forms,block.forms);
   assert.equal(entry.sourceCode,5);
  }else{
   const selectedGreek=greek[x.lemma+(block.tags.endsWith(';FUT')?'-future':'')];
   assert(selectedGreek,'Falta el modelo griego explícito '+x.lemma);
   assert.deepEqual(selectedGreek.forms,block.forms);
   assert.equal(selectedGreek.sourceCode,5);
   assert.equal(selectedGreek.unit,x.lemma==='βουλομαι'||x.lemma==='μαχομαι'?6:
    x.lemma==='ηγεομαι'?(block.tags.endsWith(';FUT')?11:10):12);
   assert.equal(selectedGreek.voice,['βουλομαι','ηγεομαι','μαχομαι'].includes(x.lemma)?'medio (deponente)':'activo');
   if(x.lemma==='ερχομαι')assert.equal(selectedGreek.tense,'aoristo segundo');
  }
  assert.equal(block.forms.length,6);
  for(let i=0;i<6;i++){
   const tags=block.tags+';'+(i%3+1)+';'+(i<3?'SG':'PL');
   const matches=index.rows[x.lang].filter(row=>
    row[0]===x.lemma&&row[1]===block.forms[i]&&row[2]===tags&&row[3]===5);
   assert.equal(matches.length,1,'Ficha no coincidente: '+x.lemma+' '+tags+' '+block.forms[i]);
   newForms++;
  }
 }
}
assert.equal(newForms,210);
for(const lang of ['lat','grc']){
 const sum=Object.values(index.counts[lang]).reduce((a,b)=>a+b,0);
 assert.equal(sum,index.rows[lang].length,'Desajuste de contadores: '+lang);
}
assert.equal(index.source.externalVerification.length,source.paradigms.length+source.singleForms.length+
 source.paradigms.reduce((n,p)=>n+p.blocks.filter(b=>b.reference).length,0));
for(const record of source.paradigms){
 for(const block of record.blocks.filter(b=>b.reference)){
  assert(index.source.externalVerification.some(x=>x.lang===record.lang&&x.lemma===record.lemma&&
   x.tags===block.tags&&x.reference===block.reference),'Falta la referencia particular de '+record.lemma);
 }
}
const currentBuilder=fs.readFileSync(path.join(root,'scripts/build-lemma-index.mjs'),'utf8');
assert(currentBuilder.includes('ACT|MID|DEP'),'La regeneración perdería la etiqueta latina deponente');
assert(!greek.βουλομαι.forms.includes('βούλῃ'),
 'Una variante no aprobada para el modelo no puede colarse como la lectura elegida');
console.log('Cotejo positivo: 210 casillas de los lotes de revisión (84 previas y 126 del conjunto ampliado contado con eo presente), índices y fuentes contrastadas.');
