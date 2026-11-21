'use strict';
// Conciliación puntual y estrictamente de solo lectura. NO importa, promociona,
// autoriza, regenera ni cambia los bancos de GeneradorExamenes o ScholaClassica.
// Uso: node scripts/reconcile-schola-morphology.cjs --schola /ruta/paradigmas.json
//       [--generador data/lemmas/teacher-forms.json] [--report test-artifacts/conciliacion.json]
//       [--schola-commit SHA] [--generador-commit SHA]
const fs=require('node:fs');
const path=require('node:path');
const {parseArgs}=require('node:util');
const assert=require('node:assert/strict');
const COURSE={
 latin:{language:'lat',course:'lat1'},
 latin4:{language:'lat',course:'lat4'},
 griego:{language:'grc',course:'gr1'}
};
const CATEGORY={
 sustantivo:'N',adjetivo:'ADJ',pronombre:'PRON',verbo:'V',
 participio:'V.PTCP',infinitivo:'V.INF',artículo:'ART',desinencia:'ENDING'
};
const CASE={nominativo:'NOM',vocativo:'VOC',acusativo:'ACC',genitivo:'GEN',dativo:'DAT',ablativo:'ABL'};
const NUMBER={singular:'SG',plural:'PL',sg:'SG',pl:'PL'};
const GENDER={masculino:'MASC',femenino:'FEM',neutro:'NEUT',m:'MASC',f:'FEM',n:'NEUT'};
const keyLemma=(value,lang)=>{
 let text=String(value||'').split(' · ')[0].split(',')[0].trim().toLowerCase();
 if(lang==='lat')text=text.replace(/æ/g,'ae').replace(/œ/g,'oe');
 text=text.normalize('NFD').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
 return text.normalize('NFC');
};
const keyForm=(value,lang)=>{
 let text=String(value||'').trim().toLowerCase();
 if(lang==='lat')text=text.replace(/æ/g,'ae').replace(/œ/g,'oe');
 text=text.normalize('NFD').replace(/[\u0304\u0306]/gu,'');
 // Los acentos, espíritus e iotas suscritas griegos NUNCA se eliminan.
 return text.normalize('NFC');
};
function getFeatures(tags){
 const parts=String(tags||'').split(';'),set=new Set(parts),kind=parts[0];
 const obj={};
 if(['N','PROPN','ADJ','PRON','V','V.PTCP','V.INF'].includes(kind))
  obj.kind=kind==='PROPN'?'N':kind;
 for(const [field,choices] of Object.entries({
  case:['NOM','VOC','ACC','GEN','DAT','ABL'],
  number:['SG','PL','DU'],gender:['MASC','FEM','NEUT'],
  person:['1','2','3'],voice:['ACT','PASS','MID','DEP']
 })){
  const match=choices.find(x=>set.has(x));
  if(match)obj[field]=match;
 }
 if(set.has('PRS'))obj.tense='PRS';
 else if(set.has('PST')&&set.has('IPFV'))obj.tense='PST;IPFV';
 else if(set.has('PST')&&set.has('PFV'))obj.tense='PST;PFV';
 else if(set.has('PSTP'))obj.tense='PSTP';
 else if(set.has('PRF'))obj.tense='PRF';
 else if(set.has('FUT'))obj.tense='FUT';
 if(set.has('IND'))obj.mood='IND';
 return obj;
}
function scholaFeatures(record,form){
 const obj={kind:CATEGORY[record.kind]||'OTHER'};
 const analysis=String(form.analysis||''),lower=String([form.tense,analysis].filter(Boolean).join(' ')).toLowerCase();
 const ck=(field,source,table)=>{let item=String(source||'').toLowerCase().trim();if(table[item])obj[field]=table[item];};
 ck('case',form.case,CASE);ck('number',form.number,NUMBER);ck('gender',form.gender,GENDER);
 let person=String(form.person||analysis).match(/(^|\D)([123])\s*\./u);
 if(person)obj.person=person[2];
 if(/pluscuamperfecto/u.test(lower))obj.tense='PSTP';
 else if(/imperfecto/u.test(lower))obj.tense='PST;IPFV';
 else if(/aoristo/u.test(lower))obj.tense='PST;PFV';
 else if(/perfecto/u.test(lower))obj.tense='PRF';
 else if(/futuro/u.test(lower))obj.tense='FUT';
 else if(/presente/u.test(lower))obj.tense='PRS';
 // Una flexión pasiva deponente tiene semántica activa; UniMorph puede
 // etiquetarla ACT. No se declara error ni identidad verificadora.
 const context=String(record.id||'')+' '+String(record.evidence?.topic||'');
 if(/deponent/iu.test(context))obj.voice='DEP';
 // El presente medio-pasivo griego es morfológicamente sincrético.
 else if(/medio[\s-]*pasiv|media[\s-]*pasiv/u.test(lower))obj.voice='MIDPASS';
 else if(/pasiv/u.test(lower))obj.voice='PASS';
 else if(/activ/u.test(lower))obj.voice='ACT';
 else if(/medio/u.test(lower))obj.voice='MID';
 if(/indicativ/u.test(lower))obj.mood='IND';
 return obj;
}
function compare(a,b){
 const common=[],conflicts=[],unresolved=[];
 for(const k of ['kind','case','number','gender','person','tense','voice','mood']){
  if(!a[k]||!b[k])continue;
  // En deponentes, etiquetas de voz de distintas fuentes no bastan para
  // afirmar equivalencia de los análisis; se registra como indeterminado.
  if(k==='voice'&&a[k]!==b[k]&&
   [a[k],b[k]].some(x=>x==='DEP'||x==='MIDPASS')){
   unresolved.push('voice');continue;
  }
  common.push(k);
  if(a[k]!==b[k])conflicts.push(k);
 }
 return {common,conflicts,unresolved,
  compatible:common.length>=2&&!conflicts.length&&!unresolved.length};
}
function getExamUnit(units){
 const ends=(units||[]).flatMap(x=>{
  const m=String(x).match(/^UD\s*(\d+)(?:\s*[–—-]\s*(\d+))?$/iu);
  return m?[Number(m[2]||m[1])]:[];
 });
 return ends.length?Math.min(...ends):null;
}
function reconcile(schola,generator,options={}){
 assert.equal(schola.schema,'schola-morphology-source/v1','Schema ScholaClassica incompatible');
 assert.match(schola.appendixSha,/^[0-9a-f]{40}$/,'Falta SHA de Appendix');
 assert(Array.isArray(schola.records)&&schola.records.length,'Banco ScholaClassica vacío');
 assert.equal(generator.schema,1,'Schema del índice GeneradorExamenes incompatible');
 for(const lang of ['lat','grc'])assert(Array.isArray(generator.rows?.[lang])&&generator.vocabulary?.[lang],
  'Índice de GeneradorExamenes incompleto: '+lang);
 const index={};
 for(const [course,{language,course:genCourse}] of Object.entries(COURSE)){
  const vocabulary=generator.vocabulary[language],entries=new Map();
  for(const row of generator.rows[language]){
   if(!vocabulary[row[0]]?.[genCourse])continue;
   const k=row[0]+'|'+keyForm(row[1],language);
   if(!entries.has(k))entries.set(k,[]);
   entries.get(k).push(row);
  }
  index[course]={language,genCourse,vocabulary,entries};
 }
 const cells=[],greekByLemma=new Map(),counts={};
 const count=(obj,key)=>{obj[key]=(obj[key]||0)+1};
 for(const record of schola.records){
  if(!COURSE[record.language])continue; // Latín II, fuera de esta integración.
  assert.equal(record.evidence?.status,'paradigma-documentado',
   'Ficha Schola sin fuente: '+record.id);
  const scope=index[record.language],lemma=keyLemma(
   record.headword||record.enunciation||record.paradigm,scope.language);
  const vocabEntry=scope.vocabulary[lemma]?.[scope.genCourse];
  for(let i=0;i<record.forms.length;i++){
   const form=record.forms[i],normalized=keyForm(form.form,scope.language);
   const sf=scholaFeatures(record,form);
   const cell={
    course:record.language,recordId:record.id,cellIndex:i,
    lemma,form:form.form,normalizedForm:normalized,
    analysis:sf,scholaUnit:record.unit,
    generadorUnits:vocabEntry?.units||[],
    availableFromExamUnit:getExamUnit(vocabEntry?.units||[]),
    source:{scholaStatus:record.evidence.status,scholaReference:record.evidence,
     verification:form.verification||null,usage:form.usage||null},
    automaticPromotion:false
   };
   if(record.kind==='desinencia'||/^[–-]/u.test(String(form.form).trim()))
    cell.status='terminacion_no_forma_completa';
   else if(!vocabEntry)
    cell.status='lema_no_presente_en_curso';
   else if(/[|/\[\]]/u.test(form.form))
    cell.status='variante_sin_desglosar';
   else{
    const matches=scope.entries.get(lemma+'|'+normalized)||[];
    const compared=matches.map(row=>({
     tags:row[2],sourceCode:row[3],...compare(getFeatures(row[2]),sf)
    }));
    cell.matches=compared;
    if(compared.some(x=>x.compatible&&[1,5].includes(x.sourceCode)))
     cell.status='ya_documentada_en_generador';
    else if(compared.some(x=>x.compatible))
     cell.status='coincide_con_fuente_externa_o_candidata';
    else if(compared.some(x=>x.conflicts.length))
     cell.status='rasgos_discordantes';
    else if(compared.length)cell.status='grafia_igual_analisis_no_comparable';
    else cell.status='forma_ausente_del_indice';
   }
   if(vocabEntry&&Number.isInteger(record.unit)&&cell.availableFromExamUnit!==null&&
     record.unit<cell.availableFromExamUnit)
    cell.curricularWarning='Schola introduce el paradigma antes de la exigibilidad léxica del Generador; NO adelantar unidades';
   cells.push(cell);
   if(record.language==='griego'&&record.kind!=='desinencia'){
    const k=lemma+'|'+normalized;
    if(!greekByLemma.has(k))greekByLemma.set(k,[]);
    greekByLemma.get(k).push(cell);
   }
   counts[record.language]||={};
   count(counts[record.language],cell.status);
  }
 }
 const greek=[];
 for(const row of generator.rows.grc){
  const [lemma,surface,tags,sourceCode]=row;
  const vocabEntry=generator.vocabulary.grc[lemma]?.gr1;
  if(sourceCode!==4||!vocabEntry?.units?.length)continue;
  const candidates=greekByLemma.get(lemma+'|'+keyForm(surface,'grc'))||[];
  const same=candidates.filter(c=>compare(getFeatures(tags),c.analysis).compatible);
  let category='SIN_PARADIGMA_EQUIVALENTE';
  if(lemma==='αθανατοσ'||lemma==='αισχροσ'&&tags.includes('FEM'))
   category='EXCLUIDA_POR_DECISION_DOCENTE';
  else if(lemma==='πρωτοσ')category='CUARENTENA_ACENTUACION';
  else if(same.length)category='COINCIDENCIA_PENDIENTE_COTEJO_INDIVIDUAL';
  else if(candidates.length)category='RASGOS_NO_COMPARABLES_O_DISCORDANTES';
  greek.push({lemma,form:surface,tags,units:vocabEntry.units,category,
   scholaMatches:same.map(c=>({recordId:c.recordId,cellIndex:c.cellIndex,
    form:c.form,evidence:c.source})),automaticPromotion:false});
 }
 const totals={};
 for(const item of greek)count(totals,item.category);
 return {
  schema:'examina-schola-conciliation/v1',
  policy:{readOnly:true,automaticPromotions:0,
   noAutomaticCurricularChanges:true,latin2Excluded:true,
   greekAccentsAndBreathingsPreserved:true},
  source:{
   scholaAppendixSha:schola.appendixSha,scholaVocabulaSha:schola.vocabulaSha||null,
   scholaCommit:options.scholaCommit||null,
   generadorCommit:options.generadorCommit||null
  },
  summary:{
   scholaRecordsInScope:schola.records.filter(x=>!!COURSE[x.language]).length,
   comparedCells:cells.length,byCourseAndStatus:counts,
   greekProvisionalCurricular:greek.length,greekPriorityCategories:totals
  },
  greekCurricularCandidates:greek,cells
 };
}
function main(argv){
 const args=parseArgs({args:argv,options:{
  schola:{type:'string'},generador:{type:'string'},report:{type:'string'},
  'schola-commit':{type:'string'},'generador-commit':{type:'string'}
 }});
 if(!args.values.schola)throw Error('Indica --schola /ruta/paradigmas.json (exportación local; no se accede a la red)');
 const sourcePath=path.resolve(args.values.schola);
 const genPath=path.resolve(args.values.generador||path.join(__dirname,'../data/lemmas/teacher-forms.json'));
 const before=[fs.readFileSync(sourcePath),fs.readFileSync(genPath)];
 const result=reconcile(JSON.parse(before[0]),JSON.parse(before[1]),{
  scholaCommit:args.values['schola-commit'],generadorCommit:args.values['generador-commit']
 });
 if(args.values.report){
  const out=path.resolve(args.values.report);
  if([sourcePath,genPath].includes(out))throw Error('Prohibido sobrescribir bancos de origen');
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 }
 assert.deepEqual(fs.readFileSync(sourcePath),before[0],'Se alteró la fuente Schola');
 assert.deepEqual(fs.readFileSync(genPath),before[1],'Se alteró la fuente del Generador');
 console.log(JSON.stringify(result.summary,null,2));
 return result;
}
if(require.main===module){
 try{main(process.argv.slice(2))}catch(error){console.error(error);process.exitCode=1}
}
module.exports={reconcile,keyLemma,keyForm,getFeatures,scholaFeatures,compare,getExamUnit,main};
