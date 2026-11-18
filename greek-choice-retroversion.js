/* Retroversión · Griego I. Patrones castellanos y valencianos auditables;
 * únicamente lemas nominales con tablas escolares explícitas, concordancia
 * verificada y preposiciones introducidas desde UD4. */
(function(){
 'use strict';
 const nouns={
  'ανθρωποσ':{es:['el hombre','los hombres'],va:['l’home','els homes'],gender:'m',single:'hombre'},
  'λογοσ':{es:['la palabra','las palabras'],va:['la paraula','les paraules'],gender:'f',single:'palabra'},
  'δωρον':{es:['el regalo','los regalos'],va:['el regal','els regals'],gender:'m',single:'regalo'},
  'εργον':{es:['el trabajo','los trabajos'],va:['el treball','els treballs'],gender:'m',single:'trabajo'},
  'αγορα':{es:['la plaza','las plazas'],va:['la plaça','les places'],gender:'f',single:'plaza'},
  'χωρα':{es:['la región','las regiones'],va:['la regió','les regions'],gender:'f',single:'region'},
  'θαλαττα':{es:['el mar','los mares'],va:['la mar','les mars'],gender:'m',gender_va:'f',single:'mar'},
  'νεανιασ':{es:['el joven','los jóvenes'],va:['el jove','els jóvens'],gender:'m',single:'joven'},
  'παιδεια':{es:['la educación','las educaciones'],va:['l’educació','les educacions'],gender:'f',single:'educacion'},
  'αδελφοσ':{es:['el hermano','los hermanos'],va:['el germà','els germans'],gender:'m',single:'hermano'}
 };
 const adjectives={
  'αγαθοσ':{es:['bueno','buena','buenos','buenas'],va:['bo','bona','bons','bones']},
  'καλοσ':{es:['hermoso','hermosa','hermosos','hermosas'],va:['bonic','bonica','bonics','boniques']},
  'κακοσ':{es:['malo','mala','malos','malas'],va:['roín','roïna','roïns','roïnes']},
  'δικαιοσ':{es:['justo','justa','justos','justas'],va:['just','justa','justos','justes']},
  'μικροσ':{es:['pequeño','pequeña','pequeños','pequeñas'],va:['menut','menuda','menuts','menudes']}
 };
// Solo entradas estudiadas del vocabulario, no lemas disponibles
// exclusivamente en el banco de etimología o en paradigmas externos.
const additionalAdjectives={
 'μεγασ':{es:['grande','grande','grandes','grandes'],va:['gran','gran','grans','grans']},
 'αδικος':{es:['injusto','injusta','injustos','injustas'],va:['injust','injusta','injustos','injustes']},
 'βαρβαροσ':{es:['bárbaro','bárbara','bárbaros','bárbaras'],va:['bàrbar','bàrbara','bàrbars','bàrbares']},
 'ενδοξοσ':{es:['famoso','famosa','famosos','famosas'],va:['famós','famosa','famosos','famoses']},
 'πονηροσ':{es:['malvado','malvada','malvados','malvadas'],va:['malvat','malvada','malvats','malvades']},
 'αθανατοσ':{es:['inmortal','inmortal','inmortales','inmortales'],va:['immortal','immortal','immortals','immortals']},
 'φρονιμοσ':{es:['prudente','prudente','prudentes','prudentes'],va:['prudent','prudent','prudents','prudents']},
 'θνητοσ':{es:['mortal','mortal','mortales','mortales'],va:['mortal','mortal','mortals','mortals']}
};
Object.assign(adjectives,additionalAdjectives);
 let selected=[],signature='';
 const quantities={complete:4};
 const count=()=>quantities[$('model').value]??4;
 const lang=()=>$('lang').value==='va'?'va':'es';
 const studied=(lemma,limit)=>{
  const key=greekBankKey(lemma);
  const required=greekMaterials.required.some(row=>greekBankKey(row.entry)===key&&
   greekRequiredStart(row.unit)<=limit);
  const general=vocab.some(row=>courseOf(row)==='greek1'&&
   greekBankKey(row.entry)===key&&
   greekRequiredStart(String(row.unit||''))<=limit);
  return required||general;
 };
 const candidates=()=>{
  const limit=greekLimit();
  if(limit<3)return [];
  const nominative=greekVerifiedCorpus.filter(x=>x.kind==='declension'&&x.verified&&
   greekMorphologyEligible(x,limit)&&x.table?.rows?.length>=5&&
   greekSyntagmNounGenders[x.id.slice(2)]&&!(x.lemmas||[]).some(isProperNounLemma)&&
   studied(x.lemmas[0],limit));
  const available=limit>=5?greekAvailableSyntagmAdjectives(limit)
   .filter(adj=>studied(adj.lemma,limit)&&adjectives[greekBankKey(adj.lemma)]):[];
  const prepositions=[
   {id:'en',unit:4,caseIndex:4,gr:'ἐν',es:'en ',va:'en '},
   {id:'eis',unit:4,caseIndex:2,gr:'εἰς',es:'hacia ',va:'cap a '},
   {id:'syn',unit:4,caseIndex:4,gr:'σὺν',es:'con ',va:'amb '}
  ];
  const rows=[];
  for(const item of nominative){
   const head=greekBankKey(item.lemmas[0]),info=nouns[head];if(!info)continue;
   const gender=greekSyntagmNounGenders[item.id.slice(2)];
   // Desde UD5 todas las retroversiones contienen artículo + adjetivo + nombre.
   // Se seleccionan solo colocaciones naturales y voces del vocabulario estudiado.
   const modifiers=limit>=5?available.filter(adj=>greekSemanticallyValidSyntagm(item,adj))
    .map(adj=>({adj,group:greekCompleteNominalGroup(item,true,adj),
      word:adjectives[greekBankKey(adj.lemma)]})).filter(x=>x.group):[null];
   for(const modifier of modifiers)for(const number of [0,1]){
    if(head==='παιδεια'&&number===1)continue;
    const base=info[lang()][number],index=(number?2:0)+
     ((lang()==='va'?(info.gender_va||info.gender):info.gender)==='f'?1:0);
    const suffix=modifier?' '+modifier.word[lang()][index]:'';
    const greek=modifier?modifier.group.rows[0]?.[1]?.[number]:
     greekArticles[gender][number][0]+' '+item.table.rows[0][number+1];
    if(!greek)continue;
    rows.push({id:item.id+':nom:'+(modifier?.adj.lemma||'plain')+':'+number,
     prompt:base+suffix,answer:greek,minUnit:Math.max(item.minUnit,modifier?5:3),
     source:item.id,adjective:modifier?.adj.lemma,type:modifier?'adjective':'nominal'});
    if(limit<4)continue;
    for(const prep of prepositions){
     const locative=['αγορα','χωρα','θαλαττα'].includes(head);
     const companion=['ανθρωποσ','νεανιασ','αδελφοσ'].includes(head);
     if(prep.id==='syn'?!companion:!locative)continue;
     const k=prep.caseIndex,inflected=modifier?modifier.group.rows[k]?.[1]?.[number]:
      greekArticles[gender][number][k]+' '+item.table.rows[k]?.[number+1];
     if(!inflected||inflected.includes('undefined'))continue;
     rows.push({id:item.id+':prep:'+prep.id+':'+(modifier?.adj.lemma||'plain')+':'+number,
      prompt:(lang()==='va'?prep.va:prep.es)+base+suffix,
      answer:prep.gr+' '+inflected,minUnit:Math.max(4,item.minUnit,modifier?5:3),
      source:item.id,adjective:modifier?.adj.lemma,
      type:'preposition',preposition:prep.id});
    }
   }
  }
  return [...new Map(rows.map(item=>[item.id,item])).values()];
 };
 const signatureOf=()=>JSON.stringify([greekMarkedUnits(),$('model').value,count(),lang()]);
 function current(){
  const sign=signatureOf(),pool=candidates();
  if(sign!==signature){selected=sample(pool,Math.min(count(),pool.length)).map(x=>x.id);signature=sign}
  return selected.map(id=>pool.find(x=>x.id===id)).filter(Boolean);
 }
 function setCount(value){
  const n=Math.max(1,Math.min(20,Math.round(Number(value)||4)));
  if(n!==count()){quantities[$('model').value]=n;signature=''}
 }
 function regenerateOne(index){
  const rows=current(),old=new Set(selected),pool=candidates().filter(x=>!old.has(x.id));
  if(index<0||index>=rows.length||!pool.length)return false;
  const sameType=pool.filter(x=>x.type===rows[index].type);
  const next=sample(sameType.length?sameType:pool,1)[0];
  if(!next)return false;selected[index]=next.id;return next;
 }
 function regenerateAll(){
  const pool=candidates().filter(x=>!selected.includes(x.id));
  if(pool.length<count())return false;
  selected=sample(pool,count()).map(x=>x.id);signature=signatureOf();return true;
 }
 function state(){return {quantity:count(),signature,ids:selected.slice(),items:current()}}
 function restore(data){
  if(!data||!Array.isArray(data.ids)||data.ids.length>20)return;
  setCount(data.quantity);
  const pool=new Set(candidates().map(x=>x.id));
  if(data.ids.every(id=>typeof id==='string'&&pool.has(id))){
   selected=[...new Set(data.ids)];signature=signatureOf();
  }
 }
 window.ExaminaGreekRetroversion={current,candidates,setCount,regenerateOne,regenerateAll,state,restore};
})();
