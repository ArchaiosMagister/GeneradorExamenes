'use strict';
// Auditoría no destructiva: la fuente griega 0 desalineó las once casillas
// de ὄνομα. NO certifica sus lecturas ni las añade a exámenes.
// La depuración de teacher-forms y offline.html debe ser una sola operación.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const bad=[
 ['Dual','N;GEN;DU'],
 ['Plural','N;GEN;PL'],
 ['Singular','N;GEN;SG'],
 ['ὄνομᾰ','N;DAT;SG'],
 ['ὀνόμᾰσῐ','N;VOC;PL'],
 ['ὀνόμᾰτᾰ','N;DAT;PL'],
 ['ὀνόμᾰτε','N;DAT;DU'],
 ['ὀνομᾰ́τοιν','N;ACC;DU'],
 ['ὀνομᾰ́τοιν','N;VOC;DU'],
 ['ὀνόμᾰτος','N;ACC;SG'],
 ['ὀνομᾰ́των','N;ACC;PL']
];
const rows=data.rows.grc.filter(r=>r[0]==='ονομα');
assert.equal(rows.length,bad.length,'Ha cambiado el lote: cotejar antes de actuar');
assert(rows.every(r=>r[3]===0),'Formas espurias promovidas: la fuente debe seguir siendo 0');
const signatures=new Set(rows.map(r=>r[1]+'|'+r[2]));
assert.equal(signatures.size,bad.length);
for(const [form,features] of bad)
 assert(signatures.has(form+'|'+features),'Alteración de lectura que requiere cotejo: '+form+' '+features);
const html=fs.readFileSync('index.html','utf8');
const mark='const greekExamReviewedNominalRows=';
const start=html.indexOf(mark),end=html.indexOf(';\n',start);
assert(start>=0&&end>start);
const verified=JSON.parse(html.slice(start+mark.length,end));
assert(!verified.some(row=>row[0]==='ονομα'),
 'Una casilla de ὄνομα ha llegado al conjunto de respuestas revisadas');
// Mantener separados los errores de la fuente 0 de las fichas de examen
// realmente contrastadas de tercera declinación.
const third=verified.filter(row=>row[3]==='nouns'&&row[5]==='tercera');
assert.equal(third.length,15,'Ha cambiado el conjunto nominal revisado de tercera');
let checked=0;
for(const row of third){
 for(const [surface,analyses] of row[7]){
  for(const analysis of analyses.split('|')){
   assert(data.rows.grc.some(r=>r[0]===row[0]&&r[1]===surface&&
     r[2]==='N;'+analysis&&r[3]===5),
    'Falta evidencia individual de fuente 5: '+row[0]+' '+surface+' '+analysis);
   checked++;
  }
 }
}
assert.equal(checked,45,'Han cambiado las casillas contrastadas de tercera');
console.log('TERCERA DECLINACIÓN: 15 lemas revisados; 45/45 lecturas exactas en fuente 5');
console.log('AUDITORÍA ὄνομα: 11 asignaciones de UniMorph detectadas como INCORRECTAS; no hay formas de ὄνομα promovidas a examen. Pendiente depuración sincronizada de índice y HTML autónomo.');
