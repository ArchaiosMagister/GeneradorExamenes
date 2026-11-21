'use strict';
// Dos cantidades inequívocas; no cancelar en masa dobles marcas de valor variable.
const assert=require('node:assert/strict'),fs=require('node:fs');
const requiredText=fs.readFileSync('required-latin-units.js','utf8');
const required=JSON.parse(requiredText.split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
const index=fs.readFileSync('index.html','utf8');
const bank=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const courses=required.courses;
assert.equal(Object.values(courses.latin1).reduce((n,arr)=>n+arr.length,0),1106);
assert.equal(Object.values(courses.latin4).reduce((n,arr)=>n+arr.length,0),541);
const expectations=[['UD1','ăgrĭcŏla, –æ'],['UD3','Āfrĭca, –æ']];
for(const [unit,form] of expectations){
 assert(courses.latin4[unit].includes(form),unit+': '+form);
 for(const src of [requiredText,index,JSON.stringify(bank)])
  assert(src.includes(form),'La fuente o índice sigue sin corregirse: '+form);
}
for(const obsolete of ['ā̆grĭcŏla','Ā̆frĭca']){
 for(const src of [requiredText,index,JSON.stringify(bank)])
  assert(!src.includes(obsolete),'Cantidad no conciliada: '+obsolete);
}
for(const [course,units] of Object.entries(courses))
 for(const [unit,rows] of Object.entries(units))
  for(const row of rows){
   assert(row.trim(),course+unit+': entrada vacía');
   assert(!/[\u0400-\u052f]/u.test(row),course+unit+': signo cirílico');
  }
assert(courses.latin4.UD7.includes('pătrĭa, æ'),
 'La primera a de patria es breve; no conservar simultáneamente macrón y breve');
assert(!courses.latin4.UD7.includes('pā̆trĭa, æ'),
 'El enunciado de patria conserva marcas contradictorias');
if(process.argv.includes('--offline')){
 const offline=fs.readFileSync('offline.html','utf8');
 for(const [,form] of expectations)assert(offline.includes(form),'Offline: '+form);
 for(const obsolete of ['ā̆grĭcŏla','Ā̆frĭca'])assert(!offline.includes(obsolete),'Offline: '+obsolete);
}
console.log('DOS CANTIDADES LATINAS: 1647 exigibles, fuentes/índice/HTML coherentes, sin caracteres cirílicos');
