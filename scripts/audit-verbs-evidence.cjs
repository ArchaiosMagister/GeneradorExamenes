'use strict';
// Matriz de pendientes: inventario reproducible, NUNCA se promueven formas.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const sourceNames={0:'UniMorph (documentación externa)',1:'paradigma docente explícito',
 2:'modelo regular sin contraste',3:'solo cita léxica',4:'Wikcionario candidato',
 5:'forma contrastada individual',6:'Collatinus (solo referencia)',7:'Eulexis (solo referencia)'};
const types={irregular:'Conjugación irregular',deponent:'Deponente: morfología pasiva y sentido activo',
 semideponent:'Semideponente: infectum activo y perfectum deponente',
 greekMiddle:'Verbo griego con enunciado medio: revisar voz y variantes'};
function latinType(lemma,entry){
 if(/\(irr\.\)/i.test(entry))return 'irregular';
 if(/or$/i.test(lemma)&&/,\s*[^,]+\s+sum\s*\(/i.test(entry))return 'deponent';
 if(/(?:eo|o)$/i.test(lemma)&&/,\s*[^,]+\s+sum\s*\(/i.test(entry))return 'semideponent';
 return null;
}
function makeQueue(course,lang){
 const vocab=data.vocabulary[lang],rows=data.rows[lang],review=[];
 const counts=new Map();
 for(const row of rows){
  const lemma=row[0];if(!vocab[lemma]?.[course])continue;
  if(!counts.has(lemma))counts.set(lemma,{bySource:{},presentSet:new Set(),total:0,source0LabelConflict:0});
  const c=counts.get(lemma);c.total++;c.bySource[row[3]]=(c.bySource[row[3]]||0)+1;
  if([1,5].includes(row[3])&&(/DOCENTE;presente de indicativo deponente/.test(row[2])||
   /^V;IND;(?:ACT|MID|DEP|PASS);PRS;[1-3];(?:SG|PL)$/.test(row[2])))c.presentSet.add(row[1]);
  if(lang==='lat'&&row[3]===0&&row[2].startsWith('V;IND;ACT;')&&
   latinType(lemma,vocab[lemma][course].entry)==='deponent')c.source0LabelConflict++;
 }
 for(const [lemma,info] of Object.entries(vocab)){
  if(!info[course])continue;
  const entry=info[course].entry;
  const type=lang==='lat'?latinType(lemma,entry):(/ομαι$/u.test(lemma)?'greekMiddle':null);
  if(!type)continue;
  const countsRow=counts.get(lemma)||{bySource:{},presentSet:new Set(),total:0,source0LabelConflict:0};
  const verified=countsRow.bySource[1]||0,contrasted=countsRow.bySource[5]||0;
  const state=type==='irregular'&&['sum','possum','confero'].includes(lemma)&&contrasted>=30?
   'cinco tiempos de indicativo respaldados por casillas individuales (otros tiempos no contrastados)':
   type==='irregular'&&lemma==='eo'&&contrasted>=6?
   'solo presente documentado individualmente':
   type==='deponent'&&((lemma==='conor'&&verified>=6)||contrasted>=6)?
   'solo presente deponente documentado individualmente (otras variantes y tiempos pendientes)':
   type==='greekMiddle'&&lemma==='ερχομαι'&&contrasted>=12?
   'presente medio y aoristo segundo contrastados individualmente (otros tiempos y variantes pendientes)':
   type==='greekMiddle'&&contrasted>=6?
   'solo presente medio documentado individualmente (variantes y otros tiempos pendientes)':
   type==='semideponent'&&lemma==='audeo'&&verified>=6?
   'solo perfecto semideponente, sujeto masculino, documentado individualmente':
   'revisión filológica pendiente';
  const decisions=type==='deponent'||type==='greekMiddle'?
   ['Mantener sin nuevas formas de examen','Contrastar individualmente presente y variantes de 2.ª singular',
    'Decidir qué formas y voz se enseñan; incorporar solo los registros aprobados']:
   ['Mantener sin nuevas formas de examen','Contrastar individualmente las formas curriculares',
    'Incorporar solamente las formas contrastadas sin generalizar el paradigma'];
  review.push({course,lemma,entry,units:info[course].units||[],kind:type,
   description:types[type],state,sources:Object.fromEntries(Object.entries(countsRow.bySource)
    .map(([k,v])=>[sourceNames[k]||k,v])),
   individuallyBackedPresent:countsRow.presentSet.size,
   externalVoiceMismatch:countsRow.source0LabelConflict,
   needsTeacherDecision:state==='revisión filológica pendiente'||countsRow.source0LabelConflict>0,
   decisions});
 }
 return review.sort((a,b)=>Number(b.needsTeacherDecision)-Number(a.needsTeacherDecision)||
  a.units.join(',').localeCompare(b.units.join(','),'es',{numeric:true})||
  a.lemma.localeCompare(b.lemma,'es'));
}
const latin=makeQueue('lat1','lat'),greek=makeQueue('gr1','grc');
assert(latin.some(x=>x.lemma==='sum'&&x.state.includes('respaldados')));
assert(latin.some(x=>x.lemma==='eo'&&x.individuallyBackedPresent===6));
assert(latin.some(x=>x.lemma==='conor'&&x.individuallyBackedPresent===6));
assert(latin.some(x=>x.lemma==='possum'&&x.state.includes('respaldados')));
assert(latin.some(x=>x.lemma==='confero'&&x.state.includes('respaldados')));
assert(latin.some(x=>x.lemma==='loquor'&&x.individuallyBackedPresent>=6));
assert(latin.some(x=>x.lemma==='sequor'&&x.individuallyBackedPresent>=6));
assert(greek.some(x=>x.lemma==='βουλομαι'&&x.individuallyBackedPresent===6));
assert(latin.some(x=>x.lemma==='loquor'&&x.externalVoiceMismatch>0),
 'Las etiquetas ACT de UniMorph para deponentes no deben darse por voz escolar activa');
const target=path.join(root,'test-artifacts/fase-ii-revision-irregulares-deponentes.json');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify({schema:'examina-morph-verb-review/v1',
 generated:new Date().toISOString(),
 legend:'El contraste se hace por forma. Una etiqueta ACT externa de un deponente no implica morfología activa escolar.',
 latin1:latin,greek1:greek},null,2)+'\n');
console.log('Cola filológica: '+latin.length+' irregulares/deponentes/semideponentes de Latín I y '+
 greek.length+' verbos griegos con medio a revisar. No se han certificado entradas.');
console.log('Pendientes latinos prioritarios:',latin.filter(x=>x.needsTeacherDecision).slice(0,10).map(x=>x.lemma).join(', '));
