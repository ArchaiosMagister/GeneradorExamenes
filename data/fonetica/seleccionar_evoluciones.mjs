/**
 * Selector de evoluciones fonéticas latín → castellano.
 * Compatible con evoluciones-latin-castellano/v1. Siempre 4 palabras.
 */
import {erroresBancoFonetico} from './criterios-docentes.mjs';
export const PALABRAS_POR_EXAMEN=4;
function claveEtimo(valor){
 return String(valor??'').toLowerCase().replace(/æ/g,'ae').replace(/œ/g,'oe')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]/gu,'');
}
function azar(semilla){
 if(semilla===undefined||semilla===null)return Math.random;
 let h=2166136261>>>0;
 for(const c of String(semilla)){h^=c.codePointAt(0);h=Math.imul(h,16777619)}
 return ()=>{
  h=(h+0x6D2B79F5)>>>0;
  let t=h;t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
function barajar(entradas,rng){
 const a=[...entradas];
 for(let i=a.length-1;i>0;i--){
  const j=Math.floor(rng()*(i+1));
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
/**
 * @param {object} banco - Contenido de banco_examenes.json
 * @param {object} opciones - {normasSeleccionadas:['N07'],semilla?,excluidos?,cantidad?}
 * @returns {object} {ejercicios,controlDocente,avisos,completo,disponibles,normasSinRepresentar}
 */
export function seleccionarEvoluciones(banco,opciones={}){
 if(banco?.esquema!=='evoluciones-latin-castellano/v1'||!Array.isArray(banco.items))
  throw new TypeError('Esquema de evoluciones fonéticas incompatible');
 const errores=erroresBancoFonetico(banco);
 if(errores.length)throw new Error('Banco fonético no homologado: '+errores.slice(0,4).join('; '));
 const cantidad=PALABRAS_POR_EXAMEN;
 if(opciones.cantidad!==undefined&&opciones.cantidad!==cantidad)
  throw new RangeError('Cada ejercicio debe contener exactamente cuatro palabras');
 const validas=new Set((banco.normas||[]).map(n=>n.id));
 const elegidas=[...new Set(opciones.normasSeleccionadas||[])];
 if(!elegidas.length||elegidas.some(n=>!validas.has(n)))
  throw new RangeError('Selecciona al menos una norma existente en el banco');
 const permitidas=new Set(elegidas),excluidos=new Set(opciones.excluidos||[]);
 const rng=azar(opciones.semilla);
 const compatibles=banco.items.filter(e=>
  e.estado==='APTO_PROPUESTO' && e.id && e.latin && e.castellano &&
  !excluidos.has(e.id) && Array.isArray(e.normas) && e.normas.length>0 &&
  e.normas.every(n=>permitidas.has(n)) && e.normas.some(n=>permitidas.has(n))
 );
 const distintos=[],vistos=new Set();
 for(const e of barajar(compatibles,rng)){
  const k=claveEtimo(e.latin);
  if(!k||vistos.has(k))continue;
  vistos.add(k);distintos.push(e);
 }
 const disponibles=distintos.length;
 if(disponibles<cantidad){
  return {ejercicios:[],controlDocente:[],avisos:['Solo hay '+disponibles+' palabras compatibles; se necesitan cuatro.'],
   completo:false,disponibles,normasSinRepresentar:elegidas};
 }
 const orden=barajar(elegidas,rng).sort((a,b)=>
  distintos.filter(e=>e.normas.includes(a)).length-distintos.filter(e=>e.normas.includes(b)).length);
 const resultado=[],usados=new Set(),cubiertas=new Set();
 function incluir(e){
  if(!e||usados.has(e.id)||resultado.length>=cantidad)return;
  resultado.push(e);usados.add(e.id);
  for(const n of e.normas)cubiertas.add(n);
 }
 for(const n of orden){
  if(resultado.length>=cantidad)break;
  if(!cubiertas.has(n))incluir(distintos.find(e=>!usados.has(e.id)&&e.normas.includes(n)));
 }
 for(const e of distintos){
  if(resultado.length>=cantidad)break;
  incluir(e);
 }
 const sinRepresentar=elegidas.filter(n=>!cubiertas.has(n));
 return {
  ejercicios:resultado.map(({id,latin})=>({id,latin})),
  controlDocente:resultado.map(({id,latin,castellano,normas})=>({id,latin,castellano,normas})),
  avisos:sinRepresentar.length?['Normas sin representación: '+sinRepresentar.join(', ')]:[],
  completo:true,disponibles,normasSinRepresentar:sinRepresentar
 };
}
