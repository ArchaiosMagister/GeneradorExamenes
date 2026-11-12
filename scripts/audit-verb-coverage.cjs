'use strict';
// Informe operativo y legible: la existencia de un lema o una forma externa
// NO equivale a verificar su paradigma ni habilita una casilla de examen.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const corpus=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const overrides=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/verified-overrides.json'),'utf8'));
const LATIN_SLOTS=[
 ['presente','V;IND;ACT;PRS'],
 ['imperfecto','V;IND;ACT;PST;IPFV'],
 ['futuro','V;IND;ACT;FUT'],
 ['perfecto','V;IND;ACT;PRF'],
 ['pluscuamperfecto','V;IND;ACT;PSTP']
];
const norm=raw=>String(raw||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/ς/g,'σ').trim();
function kindFor(lemma,entry,lang){
 if(lang==='grc')return /ομαι$/.test(lemma)?'medio':null;
 if(/\(irr\.\)/i.test(entry))return 'irregular';
 if(/or$/i.test(lemma)&&/,\s*[^,]+\s+sum\s*\(/i.test(entry))return 'deponente';
 if(/(?:eo|o)$/i.test(lemma)&&/,\s*[^,]+\s+sum\s*\(/i.test(entry))return 'semideponente';
 return null;
}
function profile(lang,course,lemma,record){
 const vocab=record[course],kind=kindFor(lemma,vocab.entry,lang);
 if(!kind)return null;
 const markedUnits=[...new Set((vocab.units||[]).flatMap(u=>[...String(u).matchAll(/\d+/g)].map(m=>Number(m[0]))))];
 const sourceBlocks=overrides.paradigms.filter(p=>p.lang===lang&&p.lemma===lemma)
  .flatMap(p=>p.blocks.map(b=>({tags:b.tags,forms:b.forms,reference:b.reference||p.reference})));
 const docs=corpus.rows[lang].filter(r=>r[0]===lemma&&r[3]===1),external=corpus.rows[lang].filter(r=>r[0]===lemma&&r[3]===0);
 const candidate=corpus.rows[lang].filter(r=>r[0]===lemma&&[2,4].includes(r[3]));
 const verified=sourceBlocks.map(block=>{
  const readings=block.forms.map((surface,i)=>{
   const expected=block.tags+';'+((i%3)+1)+';'+(i<3?'SG':'PL');
   assert(corpus.rows[lang].some(x=>x[0]===lemma&&x[1]===surface&&x[2]===expected&&x[3]===5),
    'Bloque sin persistencia verificable: '+lang+' '+lemma+' '+expected);
   return {form:surface,person:(i%3)+1,number:i<3?'singular':'plural'};
  });
  return {tags:block.tags,reference:block.reference,readings};
 });
 const documentary=[];
 if(kind==='deponente'||kind==='semideponente'){
  const desc=kind==='deponente'?'DOCENTE;presente de indicativo deponente':
   'DOCENTE;perfecto de indicativo, sujeto masculino';
  const explicit=docs.filter(x=>x[2].startsWith(desc+';'));
  if(explicit.length)documentary.push({tags:desc,forms:explicit.map(x=>x[1]),
   note:'Fichas docentes individuales; no completar el paradigma a partir de ellas'});
 }
 const attestedKeys=new Set(verified.map(x=>x.tags));
 let expectations=[];
 if(lang==='lat'){
  expectations=LATIN_SLOTS.map(([tense,tags])=>({
   tense,tags:kind==='deponente'?tags.replace('ACT','DEP'):tags,
   voice:kind==='deponente'?'deponente':kind==='semideponente'&&['perfecto','pluscuamperfecto'].includes(tense)?
    'semideponente':'activa'
  }));
 }else{
  expectations=[{tense:'presente',tags:'V;IND;MID;PRS',voice:'media'},
   {tense:'futuro',tags:'V;IND;MID;FUT',voice:'media',threshold:11},
   {tense:'aoristo',tags:'V;IND;ACT;PST;PFV',voice:'según paradigma',threshold:12}];
 }
 const coverage=expectations.map(x=>{
  const byBlock=verified.find(y=>y.tags===x.tags);
  const byTeacher=kind==='deponente'&&x.tense==='presente'?
   documentary.some(y=>y.tags.includes('presente de indicativo deponente')):
   kind==='semideponente'&&x.tense==='perfecto'?
    documentary.some(y=>y.tags.includes('perfecto de indicativo, sujeto masculino')):false;
  const state=byBlock?'contrastado de forma individual':
   byTeacher?'solo formas explícitas docentes, no paradigma':'pendiente de contraste';
  return {...x,state,formCount:byBlock?byBlock.readings.length:(byTeacher?6:0),
   sortearAutomaticamente:!!byBlock||byTeacher,
   note:x.threshold?'Contenido no elegible antes de UD'+x.threshold:undefined};
 });
 // No se acepta un criterio de "contrastar todo" en los medios y deponentes
 // si una forma exterior presenta lecturas o variantes sin atribución fiable.
 const outstanding=coverage.filter(x=>x.state==='pendiente de contraste');
 return {course,language:lang,lemma,entry:vocab.entry,units:vocab.units,
  earliestUnit:markedUnits.length?Math.min(...markedUnits):null,kind,
  sourceCounts:{uniMorph:external.length,teacher:docs.length,
   proposals:candidate.length,contrastIndividual:corpus.rows[lang].filter(x=>x[0]===lemma&&x[3]===5).length},
  verified,documentary,coverage,pending:outstanding.map(x=>x.tense),
  auditStatus:outstanding.length?'REVISAR':'COBERTURA_VERIFICADA_PARA_LOS_TIEMPOS_DESCRITOS',
  decision:'Conservar las formas no respaldadas fuera del sorteo. Si hay variantes/sincretismo, exigir contexto o mostrar todas las lecturas.'};
}
const latin=Object.entries(corpus.vocabulary.lat).map(([lemma,r])=>r.lat1&&profile('lat','lat1',lemma,r))
 .filter(Boolean).sort((a,b)=>(a.earliestUnit||99)-(b.earliestUnit||99)||a.lemma.localeCompare(b.lemma));
const greek=Object.entries(corpus.vocabulary.grc).map(([lemma,r])=>r.gr1&&profile('grc','gr1',lemma,r))
 .filter(Boolean).sort((a,b)=>(a.earliestUnit||99)-(b.earliestUnit||99)||a.lemma.localeCompare(b.lemma));
for(const lemma of ['possum','confero','loquor','sequor','audeo']){
 assert(latin.some(x=>x.lemma===lemma),'Ausente de la cola '+lemma);
}
const audeo=latin.find(x=>x.lemma==='audeo');
assert(audeo.documentary.some(x=>x.forms.includes('ausus sum')),'No se ve el perfecto docente de audeo');
assert(audeo.coverage.find(x=>x.tense==='perfecto').state.includes('docentes'));
assert(audeo.coverage.find(x=>x.tense==='imperfecto').state==='pendiente de contraste');
assert(greek.some(x=>x.lemma==='βουλομαι'&&x.verified.some(y=>y.tags==='V;IND;MID;PRS')));
const output=path.join(root,'test-artifacts/fase-ii-cobertura-verbal-por-lema.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({
 schema:'examina-morph-individual-coverage/v1',generated:new Date().toISOString(),
 policy:'Las lagunas no se rellenan por analogía ni se importan de una fuente que no certifique cada casilla.',
 latin1:latin,greek1:greek,
 summary:{latTotal:latin.length,greekTotal:greek.length,
  latPending:latin.filter(x=>x.pending.length).length,greekPending:greek.filter(x=>x.pending.length).length}
},null,2)+'\n');
console.log('Cobertura individual auditable: '+latin.length+' entradas latinas y '+greek.length+
 ' griegas. El perfecto de audeo se distingue del infectum no contrastado.');
