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
  'θαλαττα':{es:['el mar','los mares'],va:['la mar','les mars'],gender:'m',single:'mar'},
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
 let selected=[],signature='',quantity=4;
 const lang=()=>$('lang').value==='va'?'va':'es';
 const candidates=()=>{
  const limit=greekLimit();
  if(limit<3)return [];
  const nominative=greekVerifiedCorpus.filter(x=>x.kind==='declension'&&x.verified&&
   greekMorphologyEligible(x,limit)&&x.table?.rows?.length>=5&&
   greekSyntagmNounGenders[x.id.slice(2)]&&!(x.lemmas||[]).some(isProperNounLemma));
  const available=limit>=5?greekAvailableSyntagmAdjectives(limit):[];
  const rows=[];
  for(const item of nominative){
   const head=greekBankKey(item.lemmas[0]);
   const info=nouns[head];if(!info)continue;
   const gender=greekSyntagmNounGenders[item.id.slice(2)];
   for(const [number,article] of [0,1].map(number=>[number,greekArticles[gender][number][0]])){
    const greek=article+' '+item.table.rows[0][number+1];
    rows.push({id:item.id+':nom:'+number,prompt:info[lang()][number],answer:greek,
     minUnit:item.minUnit,source:item.id,type:'nominal'});
   }
   // Ningún sintagma nominal libre exige adivinar nominativo/acusativo:
   // la pregunta usa el nominativo; las preposiciones fijan los otros casos.
   if(limit>=4)for(const [number,sg] of [0,1].map(n=>[n,item.table.rows])){
    for(const prep of [
     {id:'en',unit:4,caseIndex:4,gr:'ἐν',es:'en ',va:'en '},
     {id:'eis',unit:4,caseIndex:2,gr:'εἰς',es:'hacia ',va:'cap a '},
     {id:'syn',unit:4,caseIndex:4,gr:'σὺν',es:'con ',va:'amb '}
    ]){
     const k=prep.caseIndex,article=greekArticles[gender][number][k],noun=item.table.rows[k]?.[number+1];
     if(!article||!noun)continue;
     rows.push({id:item.id+':prep:'+prep.id+':'+number,
      prompt:(lang()==='va'?prep.va:prep.es)+info[lang()][number],
      answer:prep.gr+' '+article+' '+noun,minUnit:Math.max(4,item.minUnit),
      source:item.id,type:'preposition',preposition:prep.id});
    }
   }
   if(limit>=5)for(const adj of available){
    const word=adjectives[greekBankKey(adj.lemma)];
    if(!word)continue;
    const group=greekCompleteNominalGroup(item,true,adj);
    if(!group)continue;
    for(const number of [0,1]){
     const forms=group.rows[0]?.[1],translated=info[lang()][number];
     if(!forms?.[number])continue;
     const index=(number?2:0)+(info.gender==='f'?1:0);
     rows.push({id:item.id+':adj:'+adj.lemma+':'+number,
      prompt:translated+' '+word[lang()][index],answer:forms[number],
      minUnit:Math.max(5,item.minUnit),source:item.id,adjective:adj.lemma,type:'adjective'});
    }
   }
  }
  return [...new Map(rows.map(x=>[x.id,x])).values()];
 };
 const signatureOf=()=>JSON.stringify([greekMarkedUnits(),$('model').value,quantity,lang()]);
 function current(){
  const sign=signatureOf(),pool=candidates();
  if(sign!==signature){selected=sample(pool,Math.min(quantity,pool.length)).map(x=>x.id);signature=sign}
  return selected.map(id=>pool.find(x=>x.id===id)).filter(Boolean);
 }
 function setCount(value){
  const n=Math.max(1,Math.min(20,Math.round(Number(value)||4)));
  if(n!==quantity){quantity=n;signature=''}
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
  if(pool.length<quantity)return false;
  selected=sample(pool,quantity).map(x=>x.id);signature=signatureOf();return true;
 }
 function state(){return {quantity,signature,ids:selected.slice(),items:current()}}
 window.ExaminaGreekRetroversion={current,candidates,setCount,regenerateOne,regenerateAll,state};
})();
