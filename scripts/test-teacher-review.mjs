import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
const source=readFileSync(new URL('../verification-review.js',import.meta.url),'utf8');
const data=JSON.parse(readFileSync(new URL('../data/lemmas/teacher-forms.json',import.meta.url),'utf8'));
const sandbox=createContext({
  window:{},
  document:{readyState:'loading',addEventListener:()=>{}},
  localStorage:{getItem:()=>null,setItem:()=>{}}
});
new Script(source,{filename:'verification-review.js'}).runInContext(sandbox);
const api=sandbox.window.ExaminaTeacherReview;
assert.equal(typeof api?.buildCases,'function');
const latin=api.buildCases(data,'lat1'),greek=api.buildCases(data,'gr1');
for(const [course,items] of [['lat1',latin],['gr1',greek]]){
 assert(items.length>200,course+': faltan incidencias');
 assert.equal(new Set(items.map(x=>x.id)).size,items.length,'ID duplicados: '+course);
 assert(items.every(x=>x.course===course),'Cursos mezclados');
 assert(items.every(x=>Array.isArray(x.units)&&x.detail&&x.entry),'Falta descripción o procedencia');
 assert(items.every(x=>['correccion','etiquetas','ampliacion','candidatas','sin-flexion','variantes','homografia'].includes(x.kind)));
}
for(const lemma of ['moveo','eripio']){
 const issue=latin.find(x=>x.kind==='correccion'&&x.lemma===lemma);
 assert(issue&&issue.source.includes('Lewis'),'La corrección debe citar fuente contrastada: '+lemma);
}
assert(latin.some(x=>x.lemma==='sum'&&x.kind==='sin-flexion'),'No se ha detectado la laguna de sum');
assert(greek.some(x=>x.lemma==='γιγνομαι'&&x.kind==='ampliacion'),'Falta revisión de γίγνομαι');
assert(greek.some(x=>x.lemma==='παισ'&&x.kind==='variantes'),'Falta revisión de variantes de παῖς');
assert(latin.some(x=>x.kind==='homografia'),'Se han perdido las homografías');
assert(greek.some(x=>x.kind==='candidatas'),'Se han promocionado indebidamente candidatos a verificados');
console.log('Revisión filológica: '+latin.length+' incidencias de Latín I y '+greek.length+' de Griego I. Sin cambios automáticos en exámenes.');
