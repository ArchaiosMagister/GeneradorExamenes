/* Inventario independiente para lectura de Latín II y Griego II.
 * No modifica el banco exigible ni las claves de los exámenes.
 * Las propuestas de los repasos griegos conservan su estado de revisión.
 */
(function(root){
'use strict';
const payload=__BACHILLERATO_II_DATA__;
const head=s=>String(s||'').split(',')[0].replace(/\s*\([^)]*\).*/,'').trim();
const fold=s=>String(s||'').normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'')
 .replace(/æ/gi,'ae').replace(/œ/gi,'oe').replace(/ς/g,'σ').toLowerCase();
// La grave por aguda es contextual; nunca se suprimen espíritus o iota suscrita.
const spelling=s=>String(s||'').replace(/([\u0313\u0314])([\u0391-\u03A9])/gu,'$2$1')
 .normalize('NFD').replace(/\u0300/g,'\u0301').normalize('NFC');
const prepared=new WeakMap();
function prepare(data,course,bank){
 if(!['lat2','gr2'].includes(course))return {data,bank};
 let cache=prepared.get(data);if(!cache){cache=new Map();prepared.set(data,cache)}
 // Las ediciones del banco cambian de identidad o firma y no se pisan.
 const signature=JSON.stringify(bank.map(r=>[r.entry,r.meaning,r.meaning_va]));
 const prior=cache.get(course);if(prior?.signature===signature)return prior.value;
 const greek=course==='gr2',lang=greek?'grc':'lat',base=greek?'gr1':'lat1';
 const catalog={...data.vocabulary[lang]},rows=[...data.rows[lang]],extra=[];
 const teachers=new Map();
 for(const row of bank){const k=fold(head(row.entry));if(!teachers.has(k))teachers.set(k,row)}
 if(!greek){
  for(const item of payload.latin.items){
   const lemma=fold(head(item.entry));
   const teacher=teachers.get(lemma);
   const entry=teacher?.entry||item.entry;
   if(!teachers.has(lemma)){
    const gloss=payload.latinGlosses[lemma]||'';
    const row={entry,meaning:gloss,meaning_va:'',origin:'ScholaClassica · Latín II'};
    teachers.set(lemma,row);extra.push(row);
   }
   catalog[lemma]={...catalog[lemma],[base]:{...catalog[lemma]?.[base],entry}};
   for(const [form,tags] of item.forms){
    // Las perífrasis se conservan como evidencia, sin prometer segmentación sintáctica.
    if(!/\s/u.test(form))rows.push([lemma,form,'DOCENTE;Latín II;'+tags,5]);
   }
  }
 }else{
  for(const item of payload.greek){
   const lemma=fold(head(item.entry));
   if(!teachers.has(lemma)){
    const row={entry:item.entry,meaning:item.meaning,meaning_va:'',origin:'Repasos Griego II · propuesta'};
    teachers.set(lemma,row);extra.push(row);
   }
  }
 }
 const merged={...data,vocabulary:{...data.vocabulary,[lang]:catalog},rows:{...data.rows,[lang]:rows}};
 const value={data:merged,bank:[...bank,...extra]};cache.set(course,{signature,value});return value;
}
const greekForms=new Map();
for(const item of payload.greek)for(const form of item.forms){
 const k=spelling(form);if(!greekForms.has(k))greekForms.set(k,[]);greekForms.get(k).push(item);
}
function candidates(form,bank){
 const teachers=new Map();
 for(const row of bank){const k=fold(head(row.entry));if(!teachers.has(k))teachers.set(k,row)}
 return (greekForms.get(spelling(form))||[]).map(item=>{
  const lemma=fold(head(item.entry)),teacher=teachers.get(lemma);
  return {lemma,entry:teacher?.entry||item.entry,meaning:teacher?teacher.meaning||'':item.meaning,
   meaning_va:teacher?.meaning_va||'',attested:false,lexicalCitation:true,
   origin:'Repasos Griego II · propuesta léxica; pendiente de revisión'};
 });
}
// Un participio registrado dentro de una perífrasis permite proponer el lema,
// pero aislado conserva revisión: no se lo certifica como la perífrasis entera.
const latinComponents=new Map();
for(const item of payload.latin.items)for(const [form] of item.forms){
 if(!/\s/u.test(form))continue;
 const component=form.split(/\s+/u)[0],k=fold(component);
 if(!latinComponents.has(k))latinComponents.set(k,new Map());
 latinComponents.get(k).set(item.entry,item);
}
const latinTextNotes={
 comsumpserat:{lemma:'consumo',note:'El cuaderno imprime comsumpserat; posible errata por consumpserat. Confirmar la grafía.'},
 sensitur:{lemma:'sentio',note:'El inventario del cuaderno recoge sensitur; posible errata por sentitur. Confirmar la grafía.'}
};
function latinCandidates(form,bank){
 const teachers=new Map();
 for(const row of bank){const k=fold(head(row.entry));if(!teachers.has(k))teachers.set(k,row)}
 const items=[...(latinComponents.get(fold(form))?.values()||[])];
 const note=latinTextNotes[fold(form)];
 if(note){const item=payload.latin.items.find(x=>fold(head(x.entry))===note.lemma);if(item)items.push(item)}
 return items.map(item=>{
  const lemma=fold(head(item.entry)),teacher=teachers.get(lemma);
  return {lemma,entry:teacher?.entry||item.entry,meaning:teacher?.meaning||payload.latinGlosses[lemma]||'',
   meaning_va:teacher?.meaning_va||'',attested:false,
   origin:note?note.note:'Componente de perífrasis documentada de Latín II; revisar con su auxiliar'};
 });
}
// Invariables comunes: léxico de consulta disponible en todos los cursos,
// separado del vocabulario exigible y de cualquier certificación de flexiones.
function commonCandidates(form,lang,bank=[]){
 const matches=payload.common.filter(item=>item.lang===lang&&item.forms.some(surface=>
  lang==='lat'?fold(surface)===fold(form):spelling(surface)===spelling(form)));
 return matches.map(item=>{
  const teacher=bank.find(row=>fold(head(row.entry))===fold(item.lemma));
  return {lemma:fold(item.lemma),entry:teacher?.entry||item.entry,
   meaning:teacher?teacher.meaning||'':item.meaning,
   meaning_va:teacher?teacher.meaning_va||'':item.meaning_va,
   attested:true,origin:'Suplemento léxico común · palabra invariable'};
 });
}
function commonReferences(text,lang){
 return payload.common.filter(item=>item.lang===lang&&item.forms.some(surface=>fold(surface)===fold(text)))
  .map(item=>({lemma:item.lemma,surface:item.forms.find(surface=>fold(surface)===fold(text)),
   tags:'LEX;INVARIABLE',source:'Suplemento léxico común · palabra invariable',
   provisional:false,citation:false,reference:true,
   info:Object.fromEntries((lang==='lat'?['lat1','lat4']:['gr1']).map(course=>[course,
    {entry:item.entry,meaning:item.meaning,meaning_va:item.meaning_va,units:[]}]))}));
}
root.ExaminaBachilleratoII={prepare,candidates,latinCandidates,spelling,commonCandidates,commonReferences,
 commonEntries:payload.common,
 spellingNote:form=>latinTextNotes[fold(form)]?.note||'',metadata:payload.metadata};
})(window);
