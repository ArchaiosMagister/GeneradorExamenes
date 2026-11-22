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


// Las once variantes -re son sincréticas con el imperativo; seis también con el futuro.
// Estas aserciones usan SOLO registros históricos (fuente 0), sin ampliar lo evaluable.
const alternatePresentImperative={
 gratulor:'gratulare',loquor:'loquere',miror:'mirare',nascor:'nascere',
 obliviscor:'obliviscere',orior:'orere',patior:'patere',polliceor:'pollicere',
 revertor:'revertere',sequor:'sequere',utor:'utere'
};
for(const [lemma,form] of Object.entries(alternatePresentImperative)){
 const rows=corpus.rows.lat.filter(r=>r[0]===lemma&&r[3]===0);
 for(const tag of ['V;IND;ACT;PRS;2;SG','V;IMP;ACT;PRS;2;SG']){
  assert.equal(rows.filter(r=>r[2]===tag&&normalize(r[1])===form).length,1,
   lemma+' sincretismo presente/imperativo: '+form+' ('+tag+')');
 }
 const future=rows.some(r=>r[2]==='V;IND;ACT;FUT;2;SG'&&normalize(r[1])===form);
 assert.equal(future,collisions.includes(lemma),lemma+' variante -re debe coincidir con futuro solo en 3ª');
}
const individuallyCotejados={
 gratulor:['gratulor','gratularis','gratulatur','gratulamur','gratulamini','gratulantur'],
 miror:['miror','miraris','miratur','miramur','miramini','mirantur'],
 polliceor:['polliceor','polliceris','pollicetur','pollicemur','pollicemini','pollicentur'],
 patior:['patior','pateris','patitur','patimur','patimini','patiuntur']
};
const alternate2sg={gratulor:'gratulare',miror:'mirare',polliceor:'pollicere',patior:'patere'};
for(const [lemma,forms] of Object.entries(individuallyCotejados)){
 const rows=corpus.rows.lat.filter(r=>r[0]===lemma&&r[3]===0);
 const slots=['1;SG','2;SG','3;SG','1;PL','2;PL','3;PL'];
 assert.equal(forms.length,6,lemma+' debe tener seis casillas principales');
 for(let i=0;i<6;i++){
  const tag='V;IND;ACT;PRS;'+slots[i];
  assert.equal(rows.filter(r=>r[2]===tag&&normalize(r[1])===forms[i]).length,1,
   lemma+' presente contrastado histórico '+tag+': '+forms[i]);
  assert(!rows.some(r=>r[2]==='V;IND;ACT;FUT;'+slots[i]&&normalize(r[1])===forms[i]),
   lemma+' presente principal colisiona con futuro: '+forms[i]);
 }
 const alt=alternate2sg[lemma];
 assert.equal(rows.filter(r=>r[2]==='V;IND;ACT;PRS;2;SG'&&normalize(r[1])===alt).length,1,
  lemma+' variante -re de segunda singular');
 assert.equal(rows.filter(r=>r[2]==='V;IMP;ACT;PRS;2;SG'&&normalize(r[1])===alt).length,1,
  lemma+' variante -re coincide con imperativo y no se pregunta aislada');
 assert.equal(corpus.rows.lat.filter(r=>r[0]===lemma&&r[3]===5&&r[2].startsWith('V;IND;DEP;PRS')).length,0,
  lemma+' aún no promovido: solo cotejo aislado');
}
console.log('PASS: 11 deponentes UD9–10, 24 presentes cotejados, 11 variantes -re/imperativo, 6 sincretismos, sin promoción automática.');
