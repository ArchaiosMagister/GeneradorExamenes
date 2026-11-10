/* Auditoría conservadora del vocabulario docente por curso y unidad.
 * La evidencia de una forma no certifica el paradigma entero.
 * No altera bancos, no toma decisiones filológicas y funciona sin conexión.
 */
(function(root){
'use strict';
const courseMap={lat1:'latin1',lat4:'latin4',gr1:'greek1'};
const courseNames={lat1:'Latín I',lat4:'Latín 4.º',gr1:'Griego I'};
const head=x=>String(x||'').split(',')[0].replace(/\s*\([^)]*\).*/,'').trim();
const normalize=x=>head(x).toLocaleLowerCase('el').normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ς/g,'σ').replace(/[^a-zα-ω0-9]/g,'');
const unitNumber=x=>Number((String(x||'').match(/\d+/)||[])[0])||0;
function evidence(data,course){
 if(!courseMap[course])throw new Error('Curso desconocido');
 const lang=course==='gr1'?'grc':'lat',map=new Map();
 for(const [lemma,info] of Object.entries(data.vocabulary?.[lang]||{})){
  const item=info?.[course];if(!item)continue;
  const k=normalize(item.entry||lemma);
  if(!map.has(k))map.set(k,{documented:false,proposed:false,citation:false,lemmas:new Set(),sources:new Set()});
  const record=map.get(k);record.lemmas.add(lemma);
 }
 for(const [lemma,, ,source] of data.rows?.[lang]||[]){
  const info=data.vocabulary?.[lang]?.[lemma]?.[course];if(!info)continue;
  const record=map.get(normalize(info.entry||lemma));if(!record)continue;
  if([0,1,5].includes(source))record.documented=true;
  if([2,4].includes(source))record.proposed=true;
  if(source===3)record.citation=true;
  record.sources.add(source);
 }
 return map;
}
function audit(data,bank,course,translator){
 if(!Array.isArray(bank))throw new Error('Banco docente no disponible');
 const map=evidence(data,course),unitMap=new Map(),queue=[],conflicts=new Map();
 const rows=bank.filter(x=>(x.course||'latin1')===courseMap[course]);
 for(const row of rows){
  const unit=String(row.unit||'Sin unidad'),k=normalize(row.entry),proof=map.get(k);
  if(!unitMap.has(unit))unitMap.set(unit,{unit,rows:0,uniqueEntries:new Set(),documented:0,proposalsOnly:0,citationsOnly:0,noIndex:0,spanishMissing:0,valencianMissing:0,readyForMorphology:0,duplicateRows:0});
  const u=unitMap.get(unit),id=String(row.entry||'').trim().normalize('NFC');
  u.rows++;
  if(u.uniqueEntries.has(id))u.duplicateRows++;else u.uniqueEntries.add(id);
  const es=!!String(row.meaning||'').trim();
  const va=!!(translator?.forEntry?translator.forEntry(row,'va').ready:String(row.meaning_va||'').trim());
  if(!es)u.spanishMissing++;
  if(!va)u.valencianMissing++;
  const status=proof?.documented?'documented':proof?.proposed?'proposal':proof?.citation?'citation':'unindexed';
  if(status==='documented')u.documented++;
  else if(status==='proposal')u.proposalsOnly++;
  else if(status==='citation')u.citationsOnly++;
  else u.noIndex++;
  if(status==='documented'&&es&&va)u.readyForMorphology++;
  const conflictKey=unit+'|'+k;
  if(!conflicts.has(conflictKey))conflicts.set(conflictKey,new Set());
  conflicts.get(conflictKey).add(String(row.meaning||'').trim());
  if(status!=='documented'||!es||!va)queue.push({course,unit,entry:row.entry,meaning:row.meaning||'',status,missingSpanish:!es,missingValencian:!va,
   reason:status==='proposal'?'Solo hay propuestas sin verificar':status==='citation'?'Solo constan formas de cita':status==='unindexed'?'Sin correspondencia segura con el índice':'Falta traducción'});
 }
 const units=[...unitMap.values()].sort((a,b)=>unitNumber(a.unit)-unitNumber(b.unit)||a.unit.localeCompare(b.unit,'es'))
  .map(u=>({...u,uniqueEntries:u.uniqueEntries.size,coverage:u.rows?Math.round(u.documented*1000/u.rows)/10:0}));
 const totals={rows:rows.length,uniqueEntries:new Set(rows.map(x=>x.course+'|'+x.unit+'|'+String(x.entry||'').trim())).size,
  documented:0,proposalsOnly:0,citationsOnly:0,noIndex:0,spanishMissing:0,valencianMissing:0,readyForMorphology:0,duplicateRows:0,meaningConflicts:0};
 for(const u of units)for(const k of ['documented','proposalsOnly','citationsOnly','noIndex','spanishMissing','valencianMissing','readyForMorphology','duplicateRows'])totals[k]+=u[k];
 totals.meaningConflicts=[...conflicts.values()].filter(x=>x.size>1).length;
 return {schema:1,course,courseName:courseNames[course],criteria:'Una forma contrastada no implica paradigma completo. No se valida ninguna propuesta automáticamente.',totals,units,reviewQueue:queue};
}
root.ExaminaVocabularyQuality={audit,evidence,normalize,courseNames};
})(typeof window!=='undefined'?window:globalThis);
