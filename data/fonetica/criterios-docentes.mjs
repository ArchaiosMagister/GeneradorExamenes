// Criterios docentes para todas las altas de evolución fonética (PAU).
// No se añade una norma 21: FIX_M es fija y NO seleccionable.
export const NORMA_M_FINAL='FIX_M';
// Exclusiones expresas del Excel PAU: no pueden habilitarse mediante importaciones futuras.
export const EXCLUSIONES_PAU_2026=Object.freeze(['adpodiare','adripare','brochum','stuppaculum','refectum']);
export const RESOLUCIONES_DOCENTES=Object.freeze({
 seniorem: Object.freeze({castellano:'senor',normas:['N03','N13']}),
 sensum:   Object.freeze({castellano:'seso',normas:['N01','N15']}),
 sponsam: Object.freeze({castellano:'esposa',normas:['N14','N15']}),
 sponsum: Object.freeze({castellano:'esposo',normas:['N01','N14','N15']})
});
export const claveFonetica=s=>String(s??'').toLocaleLowerCase('es')
  .replace(/æ/g,'ae').replace(/œ/g,'oe').normalize('NFD')
  .replace(/[\u0300-\u036f]/gu,'').replace(/[^\p{L}\p{N}]/gu,'');
const codigoN=n=>Number(n.slice(1));
const ordenaNormas=values=>[...new Set(values)].sort((a,b)=>codigoN(a)-codigoN(b));
const finalM=latin=>claveFonetica(latin).endsWith('m');
const finalUm=latin=>claveFonetica(latin).endsWith('um');
const nsSimplificada=row=>claveFonetica(row.latin).includes('ns')&&!claveFonetica(row.castellano).includes('ns');

// Preparación canónica para ALTAS FUTURAS. No eleva el estado de aprobación:
// el juicio histórico y la elegibilidad siguen requiriendo decisión docente.
export function normalizarFichaFonetica(entrada){
 const row={...entrada,normas:[...(entrada.normas??[])]};
 const latin=claveFonetica(row.latin),esp=claveFonetica(row.castellano);
 if(finalM(row.latin))row.normasFijas=[NORMA_M_FINAL];
 else delete row.normasFijas;
 if(row.estado!=='APTO_PROPUESTO')return row;
 const canon=RESOLUCIONES_DOCENTES[latin];
 if(canon && canon.castellano===esp) {
  row.normas=[...canon.normas];
 }else{
  if(finalUm(row.latin)&&esp.endsWith('o'))row.normas.push('N01');
  if(nsSimplificada(row))row.normas.push('N15');
  // IAM > ya: la pérdida de -m no puede contarse como apócope.
  if(latin==='iam'&&esp==='ya')row.normas=row.normas.filter(n=>n!=='N03');
  row.normas=ordenaNormas(row.normas);
 }
 return row;
}

// Comprobación de todos los datos antes de seleccionar palabras o publicar.
// Una ficha irregular no se activa ni se modifica de forma silenciosa.
export function erroresCriteriosFoneticos(row){
 const errors=[],latin=claveFonetica(row.latin),esp=claveFonetica(row.castellano);
 const prefix=row.id||row.latin||'(sin identificador)';
 const normas=Array.isArray(row.normas)?row.normas:[];
 if(EXCLUSIONES_PAU_2026.includes(latin)&&row.estado==='APTO_PROPUESTO')errors.push(prefix+': exclusión docente PAU 2026; fuera del sorteo');
 const fijas=Array.isArray(row.normasFijas)?row.normasFijas:[];
 if(finalM(row.latin)){
  if(fijas.length!==1||fijas[0]!==NORMA_M_FINAL)errors.push(prefix+': falta FIX_M fija (sin N03)');
 }else if(fijas.length)errors.push(prefix+': FIX_M solo corresponde a -m final');
 if(row.estado!=='APTO_PROPUESTO')return errors;
 if(!normas.length)errors.push(prefix+': faltan normas seleccionables');
 if(new Set(normas).size!==normas.length)errors.push(prefix+': normas repetidas');
 if(normas.some(n=>!/^N(?:0[1-9]|1[0-9]|20)$/.test(n)))errors.push(prefix+': norma ajena a N01–N20');
 if(finalUm(row.latin)){
  if(!esp.endsWith('o'))errors.push(prefix+': -um sin resultado en -o: revisión etimológica necesaria');
  if(!normas.includes('N01'))errors.push(prefix+': falta N01 (u → o) en -um');
 }
 if(nsSimplificada(row) && !normas.includes('N15'))errors.push(prefix+': -ns- → -s- debe ser N15');
 // N16 solo se admite JUNTO a N15 cuando existe otra síncopa independiente
 // documentada (p. ej., insŭlam: síncopa de ŭ y simplificación de -ns-).
 // En altas futuras sin esa evidencia, la ficha permanece para revisión.
 if(nsSimplificada(row)&&normas.includes('N16')&&
    !/[ăĕĭŏŭ]/iu.test(String(row.latin))&&
    row.sincopeIndependienteVerificada!==true)
  errors.push(prefix+': N16 sin síncopa independiente documentada; -ns- corresponde a N15');
 // Al desaparecer solo la -m, sin -e previa, no hay apócope N03.
 if(finalM(row.latin) && !latin.endsWith('em') && normas.includes('N03'))
  errors.push(prefix+': N03 no debe contabilizar la -m fija (revisar una apócope adicional)');
 const canon=RESOLUCIONES_DOCENTES[latin];
 if(canon && canon.castellano===esp && JSON.stringify(normas)!==JSON.stringify(canon.normas))
  errors.push(prefix+': se ha revertido una decisión docente ya aprobada');
 return errors;
}
export function erroresBancoFonetico(banco){
 const errores=[];
 if(banco?.esquema!=='evoluciones-latin-castellano/v1'||!Array.isArray(banco.items))
  return ['Banco fonético: esquema no compatible'];
 for(const row of banco.items)errores.push(...erroresCriteriosFoneticos(row));
 return errores;
}
export function erroresProgramacionFonetica(programa){
 if(programa?.course!=='latin1'||!Array.isArray(programa.unidades))return ['Programación de Latín I: esquema incompatible'];
 return programa.unidades.flatMap(u=>(u.palabras??[]).flatMap(row=>erroresCriteriosFoneticos(row)));
}
export function prepararAltaFonetica(entrada){
 const ficha=normalizarFichaFonetica(entrada);
 return {ficha,errores:erroresCriteriosFoneticos(ficha)};
}
