/* Plurilingüismo inverso · Griego I. Cada palabra subrayada tiene dos
 * componentes documentados en el MISMO programa etimológico de 2.a.
 * No se admiten palabras si alguno de sus étimos aún no se ha estudiado. */
(function(){
 'use strict';
 const records=[
  {id:'democracia-teologia',es:['La ','democracia',' antigua influyó en la ','teología',' posterior.'],
   va:['La ','democràcia',' antiga va influir en la ','teologia',' posterior.'],
   roots:[['δήμος','κράτος'],['θέος','λόγος']]},
  {id:'bibliografia-antropologia',es:['La ','bibliografía',' permite preparar estudios de ','antropología','.'],
   va:['La ','bibliografia',' permet preparar estudis d’','antropologia','.'],
   roots:[['βιβλίον','γράμμα'],['ἄνθρωπος','λόγος']]},
  {id:'demografia-zoologia',es:['La ','demografía',' y la ','zoología',' son disciplinas diferentes.'],
   va:['La ','demografia',' i la ','zoologia',' són disciplines diferents.'],
   roots:[['δήμος','γράμμα'],['ζῷον','λόγος']]},
  {id:'teologia-antropologia',es:['En ','teología',' se emplean palabras conocidas por la ','antropología','.'],
   va:['En ','teologia',' s’empren paraules conegudes per l’','antropologia','.'],
   roots:[['θέος','λόγος'],['ἄνθρωπος','λόγος']]},
  {id:'cronologia-zoologia',es:['La ','cronología',' ayuda a ordenar los descubrimientos de la ','zoología','.'],
   va:['La ','cronologia',' ajuda a ordenar els descobriments de la ','zoologia','.'],
   roots:[['χρόνος','λόγος'],['ζῷον','λόγος']]},
  {id:'economia-psicologia',es:['El alumnado de ','economía',' también puede estudiar ','psicología','.'],
   va:['L’alumnat d’','economia',' també pot estudiar ','psicologia','.'],
   roots:[['οἰκία','νόμος'],['ψυχή','λόγος']]},
  {id:'economia-democracia',es:['La ','economía',' afecta a la estabilidad de la ','democracia','.'],
   va:['L’','economia',' afecta l’estabilitat de la ','democràcia','.'],
   roots:[['οἰκία','νόμος'],['δήμος','κράτος']]},
  {id:'biologia-psicologia',es:['La ','biología',' y la ','psicología',' estudian aspectos diferentes de la vida.'],
   va:['La ','biologia',' i la ','psicologia',' estudien aspectes diferents de la vida.'],
   roots:[['βίος','λόγος'],['ψυχή','λόγος']]},
  {id:'filologia-economia',es:['El alumnado de ','filología',' también adquiere conocimientos de ','economía','.'],
   va:['L’alumnat de ','filologia',' també adquirix coneixements d’','economia','.'],
   roots:[['φίλος','λόγος'],['οἰκία','νόμος']]},
  {id:'filosofia-geologia',es:['La ','filosofía',' y la ','geología',' utilizan numerosos términos griegos.'],
   va:['La ','filosofia',' i la ','geologia',' utilitzen nombrosos termes grecs.'],
   roots:[['φίλος','σοφία'],['γῆ','λόγος']]},
  {id:'filologia-geologia',es:['La ','filología',' y la ','geología',' tienen raíces etimológicas griegas.'],
   va:['La ','filologia',' i la ','geologia',' tenen arrels etimològiques gregues.'],
   roots:[['φίλος','λόγος'],['γῆ','λόγος']]},
  {id:'cardiologia-psicologia',es:['La ','cardiología',' y la ','psicología',' se ocupan de problemas distintos.'],
   va:['La ','cardiologia',' i la ','psicologia',' s’ocupen de problemes diferents.'],
   roots:[['καρδία','λόγος'],['ψυχή','λόγος']]},
  {id:'rinoplastia-podologia',es:['La ','rinoplastia',' no pertenece al campo de la ','podología','.'],
   va:['La ','rinoplàstia',' no pertany al camp de la ','podologia','.'],
   roots:[['ῥίς','πλαστός'],['πούς','λόγος']]},
  {id:'taquicardia-cardiologia',es:['La ','taquicardia',' es un término frecuente en ','cardiología','.'],
   va:['La ','taquicàrdia',' és un terme freqüent en ','cardiologia','.'],
   roots:[['ταχύς','καρδία'],['καρδία','λόγος']]},
  {id:'piromania-psicologia',es:['La ','piromanía',' puede estudiarse desde la ','psicología','.'],
   va:['La ','piromania',' pot estudiar-se des de la ','psicologia','.'],
   roots:[['πῦρ','μανία'],['ψυχή','λόγος']]}
 ];
 const normalize=greekBankKey;
 function studied(root,limit){
  return greekEtymologyBank.entries.some(e=>
   e.verified&&e.firstUnit<=limit&&
   String(e.word).split(/\s*\|\s*/).some(variant=>normalize(variant)===normalize(root)));
 }
 function candidates(){
  const limit=greekLimit();
  if(limit<1)return [];
  return records.filter(x=>x.roots.every(roots=>roots.every(root=>studied(root,limit))))
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
 window.ExaminaGreekEtymSentence={current,candidates,regenerate,render,state};
})();
