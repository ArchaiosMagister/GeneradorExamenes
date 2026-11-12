import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {PALABRAS_POR_EXAMEN,seleccionarEvoluciones} from '../data/fonetica/seleccionar_evoluciones.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const banco=JSON.parse(readFileSync(resolve(root,'data/fonetica/banco_examenes.json'),'utf8'));
const ids=banco.items.map(x=>x.id);
assert.equal(banco.items.length,514);
assert.equal(new Set(ids).size,banco.items.length,'Identificadores duplicados');
assert.equal(banco.normas.length,20);
assert.equal(PALABRAS_POR_EXAMEN,4);
const loteCincuenta=banco.items.filter(x=>x.lote===3);
assert.equal(loteCincuenta.length,50,'La nueva ampliación debe tener 50 fichas');
assert.equal(new Set(loteCincuenta.map(x=>x.id)).size,50,'IDs repetidos en la ampliación');
assert(loteCincuenta.every(x=>x.estado==='APTO_PROPUESTO' && x.normas?.length>0),'Ficha nueva no válida');
assert(loteCincuenta.some(x=>x.latin==='plānum' && x.castellano==='llano'),'Corrección de étimo omitida');
const segundoLote=[33,56,95,117,158,164,249,255,312,326,376,509,720,724,736,784,794,801,819,825,835,859,865,869,912,946,951,999,1003,1053];
assert.equal(segundoLote.length,30);
assert(segundoLote.every(fila=>banco.items.some(item=>item.fila_origen===fila)),'Faltan palabras del lote PAU');
const validas=new Set(banco.normas.map(x=>x.id));
for(const e of banco.items){
 assert(e.latin&&e.castellano&&e.estado==='APTO_PROPUESTO','Ficha incompleta');
 assert(e.normas.length>0&&e.normas.every(n=>validas.has(n)),'Normas inexistentes');
}
const loteOnce=banco.items.filter(e=>e.lote===11);
assert.equal(loteOnce.length,3,'El primer lote del Excel debe contener tres fichas');
for(const [latin,castellano,normas] of [
 ['sagittam','saeta',['N01','N15','N16']],
 ['vivite','vivid',['N03','N17']],
 ['tripedem','trébede',['N01','N17']]
]){
 const row=loteOnce.find(e=>e.latin===latin);
 assert(row,'Falta en el banco '+latin);
 assert.equal(row.castellano,castellano);
 assert.deepEqual(row.normas,normas);
 assert.equal(row.estado,'APTO_PROPUESTO');
}
const accepted=banco.items.find(x=>x.latin==='pelliculam');
assert(accepted&&accepted.castellano==='pelleja'&&accepted.estado==='APTO_PROPUESTO');
assert.deepEqual(accepted.normas,['N01','N13','N16','N20']);
assert(!banco.items.some(x=>['inde','pirum'].includes(x.latin)),'Decisiones editoriales excluidas del sorteo');
const todas=banco.normas.map(n=>n.id);
const caso=seleccionarEvoluciones(banco,{normasSeleccionadas:todas,semilla:'mismo-examen'});
assert.equal(caso.ejercicios.length,4);
assert.equal(caso.controlDocente.length,4);
assert.equal(new Set(caso.ejercicios.map(e=>e.id)).size,4,'Ejercicios repetidos');
assert(caso.ejercicios.every(e=>e.latin&&!('castellano' in e)),'Respuestas en copia del alumno');
assert.deepEqual(caso.ejercicios,seleccionarEvoluciones(banco,{normasSeleccionadas:todas,semilla:'mismo-examen'}).ejercicios,'Selección no reproducible');
assert.throws(()=>seleccionarEvoluciones(banco,{normasSeleccionadas:todas,cantidad:3}),/cuatro/);
assert.throws(()=>seleccionarEvoluciones(banco,{normasSeleccionadas:['N99']}),/norma/);
const escasos=seleccionarEvoluciones(banco,{normasSeleccionadas:['N01'],excluidos:ids});
assert(!escasos.completo&&escasos.ejercicios.length===0,'No deben emitirse ejercicios incompletos');
for(const n of todas){
 const r=seleccionarEvoluciones(banco,{normasSeleccionadas:[n],semilla:2026});
 assert(r.ejercicios.length===0||r.ejercicios.length===4,'Cantidad distinta de cuatro');
 assert(r.controlDocente.every(x=>x.normas.every(c=>c===n)),'Filtrado incorrecto');
}
console.log('OK: '+banco.items.length+' fichas, 20 normas, 4 palabras o ninguna.');
