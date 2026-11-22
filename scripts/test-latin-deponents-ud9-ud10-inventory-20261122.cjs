'use strict';
// Auditoría *solo de procedencia*: no certifica formas para evaluación ni altera bancos.
const assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const corpus=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const names=['gratulor','loquor','miror','nascor','obliviscor','orior','patior','polliceor','revertor','sequor','utor'];
const historical={gratulor:53,loquor:53,miror:54,nascor:54,obliviscor:54,orior:54,patior:54,polliceor:53,revertor:54,sequor:53,utor:54};
const verified={gratulor:0,loquor:6,miror:1,nascor:0,obliviscor:0,orior:0,patior:0,polliceor:0,revertor:0,sequor:6,utor:0};
const collisions=['loquor','nascor','obliviscor','revertor','sequor','utor'];
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
for(const name of names){
 const entry=corpus.vocabulary.lat[name]?.lat1;
 assert(entry,'Falta lema Latín I: '+name);
 assert(entry.units.includes('UD 9–10'),'No aparece en UD9–10: '+name);
 const rows=corpus.rows.lat.filter(r=>r[0]===name);
 for(const [source,count] of [[0,historical[name]],[5,verified[name]]])
  assert.equal(rows.filter(r=>r[3]===source).length,count,name+' alteró evidencia '+source);
 assert(rows.every(r=>r[3]===0||r[3]===5),name+' origen de fila imprevisto');
 const pres=rows.filter(r=>r[3]===0&&r[2]==='V;IND;ACT;PRS;2;SG').map(r=>normalize(r[1]));
 const fut=rows.filter(r=>r[3]===0&&r[2]==='V;IND;ACT;FUT;2;SG').map(r=>normalize(r[1]));
 const ambiguous=pres.some(form=>fut.includes(form));
 assert.equal(ambiguous,collisions.includes(name),name+' perdió/cambió el sincretismo histórico presente-futuro');
 // Un testimonio histórico con etiqueta ACT no cambia la voz escolar deponente.
}
for(const name of ['gratulor','obliviscor','revertor','orior','patior','polliceor','nascor','utor']){
 assert.equal(corpus.rows.lat.filter(r=>r[0]===name&&r[3]===5).length,0,
  'Promoción de paradigma requiere documentación individual: '+name);
}
const mirati=corpus.rows.lat.filter(r=>r[0]==='miror'&&r[3]===5);
assert.equal(mirati.length,1);
assert.deepEqual(mirati[0],['miror','mirati','V;PTCP;ACT;PRF;NOM;PL;MASC',5]);
for(const name of ['loquor','sequor']){
 const good=corpus.rows.lat.filter(r=>r[0]===name&&r[3]===5);
 assert.equal(good.length,6);
 assert(good.every(r=>r[2].startsWith('V;IND;DEP;PRS;')),'Solo presentes acreditados: '+name);
}
console.log('PASS: 11 deponentes UD9–10; 6 sincretismos; fuentes 0/5 sin promoción automática.');
