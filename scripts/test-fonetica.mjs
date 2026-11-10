import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {PALABRAS_POR_EXAMEN,seleccionarEvoluciones} from '../data/fonetica/seleccionar_evoluciones.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const banco=JSON.parse(readFileSync(resolve(root,'data/fonetica/banco_examenes.json'),'utf8'));
const ids=banco.items.map(x=>x.id);
assert.equal(banco.items.length,430);
assert.equal(new Set(ids).size,430,'Identificadores duplicados');
assert.equal(banco.normas.length,20);
assert.equal(PALABRAS_POR_EXAMEN,4);
const validas=new Set(banco.normas.map(x=>x.id));
for(const e of banco.items){
 assert(e.latin&&e.castellano&&e.estado==='APTO_PROPUESTO','Ficha incompleta');
 assert(e.normas.length>0&&e.normas.every(n=>validas.has(n)),'Normas inexistentes');
}
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
console.log('OK: 430 fichas, 20 normas, 4 palabras o ninguna.');
