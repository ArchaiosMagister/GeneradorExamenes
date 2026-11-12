import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 NORMA_M_FINAL,RESOLUCIONES_DOCENTES,normalizarFichaFonetica,
 erroresCriteriosFoneticos,erroresBancoFonetico,erroresProgramacionFonetica,
 prepararAltaFonetica,claveFonetica
} from '../data/fonetica/criterios-docentes.mjs';
import {seleccionarEvoluciones} from '../data/fonetica/seleccionar_evoluciones.mjs';

const load=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const banco=load('data/fonetica/banco_examenes.json');
const programa=load('data/fonetica/lat1-programacion.json');
const decisiones=load('data/fonetica/decisiones-docentes.json');
const row=latin=>banco.items.find(x=>claveFonetica(x.latin)===latin);
const finM=latin=>claveFonetica(latin).endsWith('m');
const finUm=latin=>claveFonetica(latin).endsWith('um');

assert.equal(NORMA_M_FINAL,'FIX_M');
assert.equal(banco.items.length,655);
assert.equal(programa.unidades.reduce((n,u)=>n+u.palabras.length,0),73);
assert.deepEqual(erroresBancoFonetico(banco),[]);
assert.deepEqual(erroresProgramacionFonetica(programa),[]);
assert.equal(banco.items.filter(w=>finM(w.latin)).length,531);
assert.equal(banco.items.filter(w=>finUm(w.latin)).length,249);
for(const w of banco.items){
 if(finM(w.latin))assert.deepEqual(w.normasFijas,['FIX_M'],w.latin);
 else assert.equal(w.normasFijas,undefined,w.latin);
 if(finUm(w.latin)){
  assert(w.castellano.endsWith('o'),w.latin+' tiene terminación inesperada');
  assert(w.normas.includes('N01'),w.latin+' requiere abertura final');
  assert(!w.normasFijas.includes('N03'),w.latin);
 }
 if(claveFonetica(w.latin).includes('ns')&&!claveFonetica(w.castellano).includes('ns'))
  assert(w.normas.includes('N15'),w.latin+' requiere simplificación -ns-');
 assert.deepEqual(normalizarFichaFonetica(w),w,'No debe modificarse una ficha ya homologada: '+w.latin);
}
for(const u of programa.unidades)for(const w of u.palabras){
 if(finM(w.latin))assert.deepEqual(w.normasFijas,['FIX_M'],w.latin);
 if(w.estado==='APTO_PROPUESTO'&&finUm(w.latin))assert(w.normas.includes('N01'),w.latin);
 assert.deepEqual(normalizarFichaFonetica(w),w,'Falta homologación en UD'+u.unit+' '+w.latin);
}
const expected=[
 ['seniorem','señor',['N03','N13']],
 ['sensum','seso',['N01','N15']],
 ['sponsam','esposa',['N14','N15']],
 ['sponsum','esposo',['N01','N14','N15']]
];
for(const [latin,es,normas] of expected){
 const w=row(latin);
 assert(w&&w.castellano===es,latin);
 assert.deepEqual(w.normas,normas,latin);
 assert.deepEqual(w.normasFijas,['FIX_M'],latin);
 assert(decisiones.decisiones.some(x=>x.latin===latin&&x.decision==='conservar_criterio_evolucion_fonetica'&&
  JSON.stringify(x.normasFinales)===JSON.stringify(normas)),latin+' decisión no persistente');
}
const programSpons=programa.unidades.flatMap(u=>u.palabras).find(w=>w.latin==='sponsam');
assert.deepEqual(programSpons.normas,['N14','N15']);
assert.deepEqual(programSpons.normasFijas,['FIX_M']);
assert.deepEqual(row('iam').normas,['N06'],'iam pierde la -m fija, no una apócope');
assert.deepEqual(row('insulam').normas.includes('N16'),true,'insŭlam tiene otra síncopa independiente');
assert(!row('consilium').normas.includes('N15'),'En consilium se conserva -ns-');

// ALTAS FUTURAS: el normalizador agrega leyes independientes sin atribuir
// automáticamente una transmisión patrimonial ni aprobar etimologías.
const future=prepararAltaFonetica({
 id:'FUT-1',latin:'pensum',castellano:'peso',normas:['N16'],
 estado:'APTO_PROPUESTO'
});
assert.deepEqual(future.ficha.normas,['N01','N15','N16']);
assert.deepEqual(future.ficha.normasFijas,['FIX_M']);
assert(future.errores.some(e=>e.includes('síncopa independiente')));
const validFuture=prepararAltaFonetica({
 id:'FUT-2',latin:'ansam',castellano:'asa',normas:['N15'],
 estado:'APTO_PROPUESTO'
});
assert.deepEqual(validFuture.ficha.normasFijas,['FIX_M']);
assert.deepEqual(validFuture.errores,[]);
const futureIncorrect=normalizarFichaFonetica({id:'FUT-3',latin:'portum',castellano:'puerto',normas:['N07'],estado:'APTO_PROPUESTO'});
assert(futureIncorrect.normas.includes('N01'));
assert.deepEqual(erroresCriteriosFoneticos({...futureIncorrect,normas:futureIncorrect.normas.filter(x=>x!=='N01')} ).some(x=>x.includes('falta N01')),true);
assert(erroresCriteriosFoneticos({...futureIncorrect,normasFijas:[]}).some(x=>x.includes('FIX_M')));
assert(erroresCriteriosFoneticos({...row('iam'),normas:['N03','N06']}).some(x=>x.includes('N03')));
assert(erroresCriteriosFoneticos({...row('seniorem'),normas:['N13','N16']}).some(x=>x.includes('decisión docente')));
assert.deepEqual(erroresCriteriosFoneticos({...programSpons,estado:'REVISAR'}),[]);
const selected=seleccionarEvoluciones(banco,{normasSeleccionadas:banco.normas.map(n=>n.id),semilla:'fonetica-docente'});
assert.equal(selected.ejercicios.length,4);
assert(selected.ejercicios.every(x=>!('castellano' in x)));
const corrupted={...banco,items:[{...row('sponsum'),normas:['N14','N16']}]};
assert.throws(()=>seleccionarEvoluciones(corrupted,{normasSeleccionadas:['N14','N16']}),/no homologado/);
console.log('Criterios docentes comprobados en 655 fichas y 73 de Latín I. FIX_M, N01, N15 y cuatro decisiones persistentes correctos.');

const aprobacionesExcel=load('data/fonetica/decisiones-excel-pau-2026.json');
const conciliacion=load('data/fonetica/imports/excel-pau-2026-pendientes.json');
assert.equal(aprobacionesExcel.decisiones.length,29);
assert.equal(aprobacionesExcel.decisiones.filter(x=>x.decision==='patrimonial').length,24);
assert.equal(aprobacionesExcel.decisiones.filter(x=>x.decision==='excluir').length,5);
assert.equal(conciliacion.items.length,354);
assert.equal(conciliacion.baseActiveCount,655);
for(const w of aprobacionesExcel.decisiones){
 const found=banco.items.find(row=>claveFonetica(row.latin)===claveFonetica(w.latin));
 if(w.decision==='excluir'){
  assert.equal(found,undefined,'Excluida en el banco activo: '+w.latin);
  assert(erroresCriteriosFoneticos({id:'TEST-'+w.filaBanco,latin:w.latin,castellano:w.castellano,normas:['N01'],normasFijas:claveFonetica(w.latin).endsWith('m')?['FIX_M']:[],estado:'APTO_PROPUESTO'}).some(e=>e.includes('exclusión docente PAU')),w.latin);
 }else if(found){
  assert.equal(found.tipoTransmision,'PATRIMONIAL',w.latin);
  assert.ok(found.decisionDocentePAU,w.latin);
 }else{
  assert(conciliacion.items.some(row=>claveFonetica(row.latin)===claveFonetica(w.latin)&&row.estadoIntegracion==='PENDIENTE_VERIFICACION'),w.latin);
 }
}
for(let n=1;n<=5;n++){
 const num=String(n).padStart(2,'0');
 const segment=load('data/fonetica/imports/excel-pau-2026-lote-'+num+'.json');
 assert.equal(segment.items.length,211,'Lote '+n+' del Excel incompleto');
}
assert.deepEqual(erroresBancoFonetico(banco),[],'La nueva fuente no puede modificar el banco ya validado');
console.log('Conciliación PAU 2026: 1.055 registros, 29 decisiones, 354 candidatas externas y cinco exclusiones protegidas.');
