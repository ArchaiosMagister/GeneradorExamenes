/* Auditoría conservadora del vocabulario docente por curso y unidad.
 * Una forma contrastada no certifica el paradigma completo.
 * No altera bancos ni toma decisiones filológicas; funciona sin red.
 */
(function(root){
'use strict';
const courseMap={lat1:'latin1',lat4:'latin4',gr1:'greek1'};
const courseNames={lat1:'Latín I',lat4:'Latín 4.º',gr1:'Griego I'};
const head=x=>String(x||'').split(',')[0].replace(/\s*\([^)]*\).*/,'').trim();
const normalize=x=>head(x).toLocaleLowerCase('el').normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ς/g,'σ').replace(/[^a-zα-ω0-9]/g,'');
const unitNumber=x=>Number((String(x||'').match(/\d+/)||[])[0])||0;
function expandUnit(raw){
 const x=String(raw||'Sin unidad').trim(),range=x.match(/^UD\s*(\d+)\s*[–—-]\s*(\d+)$/i);
 if(range){
  const start=Number(range[1]),end=Number(range[2]);
  if(end>=start&&end-start<=20)return Array.from({length:end-start+1},(_,i)=>'UD'+(start+i));
 }
 const single=x.match(/^UD\s*(\d+)$/i);
 return single?['UD'+Number(single[1])]:[x];
}
function evidence(data,course){
 if(!courseMap[course])throw new Error('Curso desconocido');
 const lang=course==='gr1'?'grc':'lat',map=new Map();
 for(const [lemma,info] of Object.entries(data.vocabulary?.[lang]||{})){
  const item=info?.[course];if(!item)continue;
  const k=normalize(item.entry||lemma);
  if(!map.has(k))map.set(k,{documented:false,proposed:false,citation:false,lemmas:new Set(),sources:new Set(),units:new Set()});
  const record=map.get(k);record.lemmas.add(lemma);
  for(const label of item.units||[])for(const unit of expandUnit(label))record.units.add(unit);
 }
 for(const [lemma,, ,source] of data.rows?.[lang]||[]){
  const info=data.vocabulary?.[lang]?.[lemma]?.[course];if(!info)continue;
  const record=map.get(normalize(info.entry||lemma));if(!record)continue;
  if([0,1,5,6,7].includes(source))record.documented=true;
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
 const totals={rows:rows.length,uniqueEntries:new Set(rows.map(x=>(x.course||'latin1')+'|'+x.unit+'|'+String(x.entry||'').trim())).size,
  documented:0,proposalsOnly:0,citationsOnly:0,noIndex:0,spanishMissing:0,valencianMissing:0,readyForMorphology:0,
  duplicateRows:0,meaningConflicts:0,unassigned:0};
 const seenRaw=new Set();
 for(const row of rows){
  const k=normalize(row.entry),proof=map.get(k),inputUnit=String(row.unit||'Sin unidad');
  // En Griego I el banco inicial no tiene UD: usar solo asignaciones expresas del índice.
  // Las entradas sin asignación permanecen visiblemente en «Banco general».
  const units=course==='gr1'&&inputUnit==='Banco general'&&proof?.units.size?
   [...proof.units].sort((a,b)=>unitNumber(a)-unitNumber(b)):expandUnit(inputUnit);
  const originalId=inputUnit+'|'+String(row.entry||'').trim().normalize('NFC');
  if(seenRaw.has(originalId))totals.duplicateRows++;else seenRaw.add(originalId);
  const es=!!String(row.meaning||'').trim();
  const va=!!(translator?.forEntry?translator.forEntry(row,'va').ready:String(row.meaning_va||'').trim());
  const status=proof?.documented?'documented':proof?.proposed?'proposal':proof?.citation?'citation':'unindexed';
  if(status==='documented')totals.documented++;
  else if(status==='proposal')totals.proposalsOnly++;
  else if(status==='citation')totals.citationsOnly++;
  else totals.noIndex++;
  if(!es)totals.spanishMissing++;
  if(!va)totals.valencianMissing++;
  if(status==='documented'&&es&&va)totals.readyForMorphology++;
  if(course==='gr1'&&units.length===1&&units[0]==='Banco general')totals.unassigned++;
  const conflictKey=inputUnit+'|'+k;
  if(!conflicts.has(conflictKey))conflicts.set(conflictKey,new Set());
  conflicts.get(conflictKey).add(String(row.meaning||'').trim());
  for(const unit of units){
   if(!unitMap.has(unit))unitMap.set(unit,{unit,rows:0,uniqueEntries:new Set(),documented:0,proposalsOnly:0,citationsOnly:0,noIndex:0,spanishMissing:0,valencianMissing:0,readyForMorphology:0,duplicateRows:0});
   const u=unitMap.get(unit),id=String(row.entry||'').trim().normalize('NFC');
   u.rows++;
   if(u.uniqueEntries.has(id))u.duplicateRows++;else u.uniqueEntries.add(id);
   if(!es)u.spanishMissing++;
   if(!va)u.valencianMissing++;
   if(status==='documented')u.documented++;
   else if(status==='proposal')u.proposalsOnly++;
   else if(status==='citation')u.citationsOnly++;
   else u.noIndex++;
   if(status==='documented'&&es&&va)u.readyForMorphology++;
   if(status!=='documented'||!es||!va)queue.push({course,unit,entry:row.entry,meaning:row.meaning||'',status,missingSpanish:!es,missingValencian:!va,
    reason:status==='proposal'?'Solo hay propuestas sin verificar':status==='citation'?'Solo constan formas de cita':status==='unindexed'?'Sin correspondencia segura con el índice':'Falta traducción'});
  }
 }
 totals.meaningConflicts=[...conflicts.values()].filter(x=>x.size>1).length;
 const units=[...unitMap.values()].sort((a,b)=>unitNumber(a.unit)-unitNumber(b.unit)||a.unit.localeCompare(b.unit,'es'))
  .map(u=>({...u,uniqueEntries:u.uniqueEntries.size,coverage:u.rows?Math.round(u.documented*1000/u.rows)/10:0}));
 return {schema:1,course,courseName:courseNames[course],criteria:'Una forma contrastada no implica paradigma completo. Las UD griegas solo proceden de etiquetas explícitas del índice; el resto queda en Banco general.',totals,units,reviewQueue:queue};
}
root.ExaminaVocabularyQuality={audit,evidence,normalize,expandUnit,courseNames};
})(typeof window!=='undefined'?window:globalThis);
