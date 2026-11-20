/* Cambio de número · Griego I. Las flexiones proceden de los paradigmas
 * contrastados del curso; los pronombres se acotan a αὐτός, UD7. */
(function(){
 'use strict';
 let selected=[],signature='';
 const quantities={complete:4};
 const count=()=>quantities[$('model').value]??4;
 const candidates=()=>{
  const limit=greekLimit();
  if(limit<3)return []; // El artículo se introduce en la UD3.
  const nouns=greekVerifiedCorpus.filter(x=>x.kind==='declension'&&x.verified&&
   greekMorphologyEligible(x,limit)&&x.table?.rows?.length>=5&&
   greekSyntagmNounGenders[x.id.slice(2)]&&!(x.lemmas||[]).some(isProperNounLemma));
  const adjectives=limit>=5?greekAvailableSyntagmAdjectives(limit):[];
  const cases=[0,2,3,4],rows=[];
  for(const noun of nouns){
   const gender=greekSyntagmNounGenders[noun.id.slice(2)];
   if(limit<5){
    for(const k of cases){
     const singular=greekArticles[gender][0][k]+' '+noun.table.rows[k][1];
     const plural=greekArticles[gender][1][k]+' '+noun.table.rows[k][2];
     if(singular.trim()&&plural.trim())
      for(const dir of [0,1])rows.push({id:noun.id+':plain:'+k+':'+dir,prompt:dir?plural:singular,
       answer:dir?singular:plural,direction:dir?'singular':'plural',caseIndex:k,source:noun.id});
    }
    continue;
   }
   for(const adj of adjectives){
    // Reutilizar el repertorio de colocaciones semánticamente revisadas.
    if(!greekSemanticallyValidSyntagm(noun,adj))continue;
    const group=greekCompleteNominalGroup(noun,true,adj);
    if(!group)continue;
    for(const k of cases){
     const forms=group.rows[k]?.[1];
     if(!forms?.[0]||!forms?.[1])continue;
     for(const dir of [0,1])rows.push({id:noun.id+':adj:'+adj.lemma+':'+k+':'+dir,
      prompt:forms[dir],answer:forms[1-dir],direction:dir?'singular':'plural',
      caseIndex:k,source:noun.id,adjective:adj.lemma});
    }
   }
   // UD7: ὁ αὐτὸς ἄνθρωπος, οἱ αὐτοὶ ἄνθρωποι (pronombre de identidad).
   // No se forman artículos + demostrativo + sustantivo, orden no atributivo.
   if(limit>=7){
    const forms={
     m:[['αὐτός','αὐτόν','αὐτοῦ','αὐτῷ'],['αὐτοί','αὐτούς','αὐτῶν','αὐτοῖς']],
     f:[['αὐτή','αὐτήν','αὐτῆς','αὐτῇ'],['αὐταί','αὐτάς','αὐτῶν','αὐταῖς']],
     n:[['αὐτό','αὐτό','αὐτοῦ','αὐτῷ'],['αὐτά','αὐτά','αὐτῶν','αὐτοῖς']]
    };
    for(let i=0;i<cases.length;i++){
     const k=cases[i],surface=[0,1].map(number=>{
      const article=greekArticles[gender][number][k];
      const pron=greekAccentBeforeNoun(forms[gender][number][i]);
      const head=noun.table.rows[k][number+1];
      return article+' '+pron+' '+head;
     });
     for(const dir of [0,1])rows.push({id:noun.id+':autos:'+k+':'+dir,
      prompt:surface[dir],answer:surface[1-dir],direction:dir?'singular':'plural',
      caseIndex:k,source:noun.id,pronoun:'αὐτός'});
    }
   }
  }
  // Nominativo y acusativo neutros pueden compartir forma y solución:
  // son lecturas distintas, pero una sola pregunta visible.
  const seen=new Set();
  return rows.filter(row=>{
   const key=row.prompt.normalize('NFC')+'\u241F'+row.answer.normalize('NFC');
   if(seen.has(key))return false;
   seen.add(key);return true;
  });
 };
 const distinctive=(pool,quantity)=>{
  const taken=[],prompts=new Set();
  for(const row of sample(pool,pool.length)){
   const key=row.prompt.normalize('NFC');
   if(prompts.has(key))continue;
   taken.push(row);prompts.add(key);
   if(taken.length>=quantity)break;
  }
  return taken;
 };
 const signatureOf=()=>JSON.stringify([greekMarkedUnits(),$('model').value,count()]);
 function current(){
  const sign=signatureOf(),pool=candidates();
  if(sign!==signature){
   selected=distinctive(pool,count()).map(x=>x.id);
   signature=sign;
  }
  return selected.map(id=>pool.find(x=>x.id===id)).filter(Boolean);
 }
 function setCount(n){
  const next=Math.max(1,Math.min(20,Math.round(Number(n)||4)));
  if(count()!==next){quantities[$('model').value]=next;signature=''}
 }
 function regenerateOne(i){
  const rows=current(),used=new Set(selected);
  const otherPrompts=new Set(rows.filter((_,j)=>j!==i).map(x=>x.prompt.normalize('NFC')));
  const pool=candidates().filter(x=>!used.has(x.id)&&x.prompt!==rows[i]?.prompt&&
   !otherPrompts.has(x.prompt.normalize('NFC')));
  if(i<0||i>=rows.length||!pool.length)return false;
  const previous=rows[i],preferred=pool.filter(x=>x.direction===previous.direction);
  const replacement=sample(preferred.length?preferred:pool,1)[0];
  if(!replacement)return false;
  selected[i]=replacement.id;
  return replacement;
 }
 function regenerateAll(){
  const before=new Set(selected);const pool=candidates().filter(x=>!before.has(x.id));
  const fresh=distinctive(pool,count());
  if(fresh.length<count())return false;
  selected=fresh.map(x=>x.id);signature=signatureOf();
  return true;
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
 window.ExaminaGreekNumber={current,candidates,setCount,regenerateOne,regenerateAll,state,restore};
})();
