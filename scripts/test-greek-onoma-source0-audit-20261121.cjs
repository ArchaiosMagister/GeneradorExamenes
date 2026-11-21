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
console.log('AUDITORÍA ὄνομα: 11 asignaciones de UniMorph detectadas como INCORRECTAS; no hay formas de ὄνομα promovidas a examen. Pendiente depuración sincronizada de índice y HTML autónomo.');
