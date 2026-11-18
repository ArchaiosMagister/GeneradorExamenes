/* Plurilingüismo inverso · Griego I. Cada palabra subrayada tiene dos
 * componentes documentados en el MISMO programa etimológico de 2.a.
 * No se admiten palabras si alguno de sus étimos aún no se ha estudiado. */
(function(){
 'use strict';
 // Criterio docente confirmado el 17-11-2026: se admiten familias
 // etimológicas. οἰκία/οἶκος y νόμος/νέμω son equivalentes escolares;
 // la disponibilidad se decide por los lemas efectivamente estudiados.
 const records=[
  {id:'democracia-teologia',es:['La ','democracia',' antigua influyó en la ','teología',' posterior.'],
   va:['La ','democràcia',' antiga va influir en la ','teologia',' posterior.'],
   roots:[['δήμος','κράτος'],['θεός','λόγος']]},
  {id:'bibliografia-antropologia',es:['La ','bibliografía',' permite preparar estudios de ','antropología','.'],
   va:['La ','bibliografia',' permet preparar estudis d’','antropologia','.'],
   roots:[['βιβλίον','γράφω'],['ἄνθρωπος','λόγος']]},
  {id:'demografia-zoologia',es:['La ','demografía',' y la ','zoología',' son disciplinas diferentes.'],
   va:['La ','demografia',' i la ','zoologia',' són disciplines diferents.'],
   roots:[['δήμος','γράφω'],['ζῷον','λόγος']]},
  {id:'teologia-demografia',es:['La ','teología',' estudia las creencias, mientras que la ','demografía',' analiza las poblaciones.'],
   va:['La ','teologia',' estudia les creences, mentre que la ','demografia',' analitza les poblacions.'],
   roots:[['θεός','λόγος'],['δήμος','γράφω']]},
  {id:'cronologia-democracia',es:['La ','cronología',' permite fechar los cambios de la ','democracia','.'],
   va:['La ','cronologia',' permet datar els canvis de la ','democràcia','.'],
   roots:[['χρόνος','λόγος'],['δήμος','κράτος']]},
  {id:'economia-psicologia',es:['El alumnado de ','economía',' también puede estudiar ','psicología','.'],
   va:['L’alumnat d’','economia',' també pot estudiar ','psicologia','.'],
   roots:[['οἰκία','νόμος'],['ψυχή','λόγος']]},
  {id:'economia-democracia',es:['La ','economía',' afecta a la estabilidad de la ','democracia','.'],
   va:['L’','economia',' afecta l’estabilitat de la ','democràcia','.'],
   roots:[['οἰκία','νόμος'],['δήμος','κράτος']]},
  {id:'biologia-demografia',es:['La ','biología',' y la ','demografía',' estudian realidades diferentes.'],
   va:['La ','biologia',' i la ','demografia',' estudien realitats diferents.'],
   roots:[['βίος','λόγος'],['δήμος','γράφω']]},
  {id:'filologia-economia',es:['El alumnado de ','filología',' también adquiere conocimientos de ','economía','.'],
   va:['L’alumnat de ','filologia',' també adquirix coneixements d’','economia','.'],
   roots:[['φίλος','λόγος'],['οἰκία','νόμος']]},
  {id:'filosofia-geologia',es:['La ','filosofía',' y la ','geología',' utilizan numerosos términos griegos.'],
   va:['La ','filosofia',' i la ','geologia',' utilitzen nombrosos termes grecs.'],
   roots:[['φίλος','σοφία'],['γῆ','λόγος']]},
  {id:'filologia-democracia',es:['La ','filología',' estudia textos sobre la ','democracia',' antigua.'],
   va:['La ','filologia',' estudia textos sobre la ','democràcia',' antiga.'],
   roots:[['φίλος','λόγος'],['δήμος','κράτος']]},
  {id:'cardiologia-economia',es:['La financiación de la ','cardiología',' también depende de la ','economía','.'],
   va:['El finançament de la ','cardiologia',' també depén de l’','economia','.'],
   roots:[['καρδία','λόγος'],['οἰκία','νόμος']]},
  {id:'rinoplastia-podologia',es:['La ','rinoplastia',' no pertenece al campo de la ','podología','.'],
   va:['La ','rinoplàstia',' no pertany al camp de la ','podologia','.'],
   roots:[['ῥίς','πλαστός'],['πούς','λόγος']]},
  {id:'taquicardia-piromania',es:['La ','taquicardia',' y la ','piromanía',' son fenómenos clínicos distintos.'],
   va:['La ','taquicàrdia',' i la ','piromania',' són fenòmens clínics diferents.'],
   roots:[['ταχύς','καρδία'],['πῦρ','μανία']]},
  {id:'piromania-psicologia',es:['La ','piromanía',' puede estudiarse desde la ','psicología','.'],
   va:['La ','piromania',' pot estudiar-se des de la ','psicologia','.'],
   roots:[['πῦρ','μανία'],['ψυχή','λόγος']]},
  {id:'prologo-democracia',es:['El ','prólogo',' del libro presenta la ','democracia',' ateniense.'],
   va:['El ','pròleg',' del llibre presenta la ','democràcia',' atenesa.'],
   roots:[['πρό','λόγος'],['δήμος','κράτος']]},
  {id:'anfibio-zoologia',es:['La ','zoología',' estudia animales como los ','anfibios','.'],
   va:['La ','zoologia',' estudia animals com els ','amfibis','.'],
   roots:[['ζῷον','λόγος'],['ἀμφί','βίος']]},
  {id:'hipofonia-biografia',es:['Su ','biografía',' menciona la ','hipofonía',' que padecía.'],
   va:['La seua ','biografia',' esmenta la ','hipofonia',' que patia.'],
   roots:[['βίος','γράφω'],['ὑπό','φωνή']]},
  {id:'hipergrafia-psicologia',es:['La ','hipergrafía',' puede estudiarse desde la ','psicología','.'],
   va:['La ','hipergrafia',' pot estudiar-se des de la ','psicologia','.'],
   roots:[['ὑπέρ','γράφω'],['ψυχή','λόγος']]},
  {id:'paradoja-bibliografia',es:['La ','bibliografía',' explica aquella ','paradoja',' filosófica.'],
   va:['La ','bibliografia',' explica aquella ','paradoxa',' filosòfica.'],
   roots:[['βιβλίον','γράφω'],['παρά','δόξα']]},
  {id:'hipodermis-filosofia',es:['La ','hipodermis',' es una estructura anatómica, no un concepto de ','filosofía','.'],
   va:['La ','hipodermis',' és una estructura anatòmica, no un concepte de ','filosofia','.'],
   roots:[['ὑπό','δέρμα'],['φίλος','σοφία']]},
  {id:'hiperemia-psicologia',es:['La ','hiperemia',' puede estudiarse en medicina y no en ','psicología','.'],
   va:['La ','hiperèmia',' es pot estudiar en medicina i no en ','psicologia','.'],
   roots:[['ὑπέρ','αἷμα'],['ψυχή','λόγος']]},
  {id:'hipercromia-economia',es:['La ','hipercromía',' es un fenómeno biológico y no un concepto de ','economía','.'],
   va:['La ','hipercromia',' és un fenomen biològic i no un concepte d’','economia','.'],
   roots:[['ὑπέρ','χρῶμα'],['οἰκία','νόμος']]}
 ];
 const acceptedFamilies={
  'οἰκία':['οἰκία','οἶκος'],'νόμος':['νόμος','νέμω'],
  'γράφω':['γράφω','γράμμα']
 };
 function answerRoots(record){
  return record.roots.map(pair=>pair.map(root=>(acceptedFamilies[root]||[root]).join(' / ')).join(' + '));
 }
 const normalize=greekBankKey;
 // Un mismo lexema no puede repetirse en las dos palabras subrayadas,
 // tampoco bajo variantes escolares o étimos de una misma familia.
 const rootFamilies=[
  ['οἰκία','οἶκος'],['νόμος','νέμω'],['γράφω','γράμμα'],
  ['λόγος','λέγω'],['φίλος','φιλία'],['σοφός','σοφία'],['ἀρχή','ἄρχω']
 ];
 function canonicalRoot(root){
  const family=rootFamilies.find(group=>group.some(member=>normalize(member)===normalize(root)));
  return normalize(family?family[0]:root);
 }
 function distinctRoots(record){
  const roots=record.roots.flat().map(canonicalRoot);
  return roots.length===new Set(roots).size;
 }
 function studied(root,limit){
  return greekEtymologyBank.entries.some(e=>
   e.verified&&e.firstUnit<=limit&&
   String(e.word).split(/\s*\|\s*/).some(variant=>normalize(variant)===normalize(root)));
 }
 function candidates(){
  const limit=greekLimit();
  if(limit<1)return [];
  return records.filter(x=>distinctRoots(x)&&x.roots.every(roots=>roots.every(root=>studied(root,limit))))
   .map(x=>({...x,sentence:x[$('lang').value==='va'?'va':'es']}));
 }
 let selected=null,signature='';
 const signatureOf=()=>JSON.stringify([greekMarkedUnits(),$('model').value,$('lang').value]);
 function current(){
  const sign=signatureOf(),pool=candidates();
  if(sign!==signature||!pool.some(x=>x.id===selected)){
   selected=sample(pool,1)[0]?.id||null;signature=sign;
  }
  return pool.find(x=>x.id===selected)||null;
 }
 function regenerate(){
  const old=current(),others=candidates().filter(x=>x.id!==old?.id);
  const next=sample(others,1)[0];if(!next)return false;
  selected=next.id;return next;
 }
 function render(record){
  if(!record)return '';
  return record.sentence.map((part,i)=>i%2?'<u>'+esc(part)+'</u>':esc(part)).join('');
 }
 function state(){return {selected,signature,item:current(),available:candidates().length}}
 window.ExaminaGreekEtymSentence={current,candidates,regenerate,render,state,answerRoots,
  catalog:()=>records.map(x=>({...x,roots:x.roots.map(pair=>pair.slice())})),
  canonicalRoot,restore(data){
  if(candidates().some(x=>x.id===data?.selected)){selected=data.selected;signature=signatureOf()}
 }};
})();
