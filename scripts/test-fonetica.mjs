import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {PALABRAS_POR_EXAMEN,seleccionarEvoluciones} from '../data/fonetica/seleccionar_evoluciones.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const banco=JSON.parse(readFileSync(resolve(root,'data/fonetica/banco_examenes.json'),'utf8'));
const ids=banco.items.map(x=>x.id);
assert.equal(banco.items.length,533);
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
const audited14=banco.items.filter(x=>x.lote===14);
assert.equal(audited14.length,2,'Faltan las dos nuevas fichas auditadas');
for(const [latin,spanish,normas] of [
 ['gannitum','gañido',['N13','N17']],
 ['laicum','lego',['N12','N17']]
]){
 const row=audited14.find(x=>x.latin===latin);
 assert(row&&row.castellano===spanish,latin+': correspondencia incorrecta');
 assert.deepEqual(row.normas,normas,latin+': normas incorrectas');
 assert(row.fuente.startsWith('https://')&&row.estado==='APTO_PROPUESTO');
}
const accepted=banco.items.find(x=>x.latin==='pelliculam');
assert(accepted&&accepted.castellano==='pelleja'&&accepted.estado==='APTO_PROPUESTO');
assert.deepEqual(accepted.normas,['N01','N13','N16','N20']);
assert(!banco.items.some(x=>['inde','pirum'].includes(x.latin)),'Decisiones editoriales excluidas del sorteo');
const loteTrece=[
 ['audīte','oíd',['N03','N12','N17']],
 ['audītum','oído',['N12','N16','N17']],
 ['date','dad',['N03','N17']],
 ['octavum','ochavo',['N13']],
 ['fluxum','flojo',['N01','N13']],
 ['pelagum','piélago',['N07']],
 ['folliculum','hollejo',['N01','N05','N13','N20']]
];
assert.equal(banco.items.filter(x=>x.lote===13).length,7,'Lote 13 incompleto');
for(const [latin,castellano,normas] of loteTrece){
 const row=banco.items.find(x=>x.latin===latin);
 assert(row&&row.castellano===castellano,'Étimo incorporado incorrecto: '+latin);
 assert.deepEqual(row.normas,normas,'Normas inexactas: '+latin);
 assert.equal(row.estado,'APTO_PROPUESTO');
 assert(row.fila_origen&&row.fuente,'Falta trazabilidad: '+latin);
}
assert.equal(new Set(banco.items.map(x=>x.latin.normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase())).size,banco.items.length,
 'No deben duplicarse étimos equivalentes por acento de cantidad');
const audit=JSON.parse(readFileSync(resolve(root,'data/fonetica/auditoria-excel-lote-100-20261112.json'),'utf8'));
assert.equal(audit.total_revisadas,100,'La auditoría debe documentar exactamente 100 entradas nuevas');
assert.equal(audit.items.length,100,'Auditoría incompleta');
assert.equal(new Set(audit.items.map(x=>x.fila_origen)).size,100,'Filas de Excel duplicadas');
const expectedStatus={INCORPORADA:4,EXCLUIDA_DOCENTE:2,CORREGIDA_PENDIENTE:1,
 VARIANTE_CORREGIDA:1,PENDIENTE_VERIFICACION:62,DUPLICADA_O_VARIANTE:3,
 INCORPORADA_CULTA:6,REVISION_CULTA_CONDICIONADA:21};
assert.deepEqual(audit.resumen,expectedStatus,'Estados de auditoría alterados');
const normalizeAudit=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'')
 .replace(/[æÆ]/g,'ae').replace(/[œŒ]/g,'oe').toLowerCase();
for(const row of audit.items){
 assert(row.latin&&row.castellano&&row.normasExcel.length&&row.observacionExcel,
  'Fila de auditoría sin trazabilidad');
 const found=banco.items.find(x=>normalizeAudit(x.latin)===normalizeAudit(row.latin));
 if(row.estado==='INCORPORADA'||row.estado==='INCORPORADA_CULTA'){
  assert(found&&found.id===row.idBanco,'Ficha aprobada ausente: '+row.latin);
  assert(found.lote===(row.idBanco==='EVF-1074'||row.estado==='INCORPORADA_CULTA'?16:15),
   'Lote incorrecto para '+row.latin);
  assert(row.estado!=='INCORPORADA_CULTA'||found.tipoTransmision==='ADAPTACION_CULTA',
   'Cultismo aprobado sin etiqueta: '+row.latin);
 }else{
  assert(!found,'Se ha activado una ficha no aprobada: '+row.latin);
  if(row.estado==='CORREGIDA_PENDIENTE'){
   assert(!banco.items.some(x=>normalizeAudit(x.latin)===normalizeAudit(row.latinCorregido)),
    'La corrección sin validación fonética no puede sortearse: '+row.latinCorregido);
  }
  if(row.estado==='VARIANTE_CORREGIDA')
   assert(banco.items.some(x=>x.id===row.idBancoReferencia&&x.latin===row.latinCorregido),
    'La corrección del étimo estilum no está registrada');
 }
}
const loteCien=banco.items.filter(x=>x.lote===15);
assert.equal(loteCien.length,3,'Solo tres étimos han superado el lote de 100');
for(const [latin,castellano,normas] of [
 ['senatum','senado',['N17']],
 ['rixosum','rijoso',['N13']],
 ['virilia','verija',['N01','N13']]
]){
 const row=loteCien.find(x=>x.latin===latin);
 assert(row&&row.castellano===castellano,'Etimología auditada ausente: '+latin);
 assert.deepEqual(row.normas,normas,'Normas inesperadas en '+latin);
 assert(row.fuente.startsWith('https://'),'Fuente no documentada: '+latin);
}
const decisiones=JSON.parse(readFileSync(resolve(root,'data/fonetica/decisiones-docentes.json'),'utf8'));
const decisions=new Map(decisiones.decisiones.filter(x=>x.latin).map(x=>[x.latin,x]));
assert.equal(decisions.get('scrinium').estado,'EXCLUIDA','Escriño debe permanecer excluido');
assert.equal(decisions.get('quinionem').estado,'EXCLUIDA','Quiñón debe permanecer excluido');
assert.equal(decisions.get('contum').decision,'aceptar_acepcion');
assert.equal(decisions.get('sŏcrum').latinCorregido,'sŏcram');
assert.equal(decisions.get('sŏcrum').estado,'CORREGIDA_PENDIENTE');
assert.equal(decisions.get('stylum').latinCorregido,'stilum');
assert(banco.items.some(x=>x.latin==='socerum'&&x.castellano==='suegro'),
 'La corrección femenina no debe eliminar el suegro patrimonial');
const cultismos=decisiones.decisiones.find(x=>x.grupo==='cultismos');
assert.equal(cultismos.decision,'inclusion_condicionada');
assert.equal(cultismos.restantes_auditadas,21);
const cuatro=banco.items.filter(x=>x.lote===16);
assert.equal(cuatro.length,4,'Lote 16 incompleto');
for(const [latin,spanish,normas,tipo] of [
 ['contum','cuento',['N07'],'PATRIMONIAL'],
 ['stilum','estilo',['N14'],'ADAPTACION_CULTA'],
 ['athletam','atleta',['N10'],'ADAPTACION_CULTA'],
 ['blasphemiam','blasfemia',['N10'],'ADAPTACION_CULTA']
]){
 const row=cuatro.find(x=>x.latin===latin);
 assert(row&&row.castellano===spanish,'No incorporada: '+latin);
 assert.deepEqual(row.normas,normas,'Normas incorrectas en '+latin);
 assert.equal(row.tipoTransmision,tipo,'Sin clasificación de transmisión: '+latin);
 assert(row.fuente.startsWith('https://'),'Falta verificación filológica en '+latin);
}
const nextCultos=banco.items.filter(x=>x.lote===17);
assert.equal(nextCultos.length,3,'La continuación culta no consta como lote 17');
for(const [latin,spanish,normas] of [
 ['architectum','arquitecto',['N10']],
 ['asphaltum','asfalto',['N10']],
 ['Chimæram','quimera',['N10','N12']]
]){
 const row=nextCultos.find(x=>x.latin===latin);
 assert(row&&row.castellano===spanish,'No incorporada la culta: '+latin);
 assert.deepEqual(row.normas,normas,'Normas incorrectas en '+latin);
 assert(row.fuente.startsWith('https://'),'Sin respaldo en '+latin);
 assert.equal(row.tipoTransmision,'ADAPTACION_CULTA','La adaptación no está etiquetada: '+latin);
}
const sourceHtml=readFileSync(resolve(root,'index.html'),'utf8');
assert(sourceHtml.includes('phonetic-origin-label'),'No se muestra la etiqueta de cultismo');
assert(sourceHtml.includes("slot.querySelector('i')?.textContent"),
 'La etiqueta no debe contaminar el campo de texto editable de la palabra');
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
