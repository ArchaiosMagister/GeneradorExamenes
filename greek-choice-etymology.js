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
 // Compuestos de dos étimos realmente cursados en el banco de etimología.
 // El catálogo se compone en frases nuevas y estables; no se reutiliza
 // ninguna raíz entre las dos palabras subrayadas.
 const coverageTerms=[["teocracia","teocracia","teocràcia","θεός","κράτος"],["bibliologia","bibliología","bibliologia","βιβλίον","λόγος"],["grafologia","grafología","grafologia","γράφω","λόγος"],["zoografia","zoografía","zoografia","ζῷον","γράφω"],["xilografia","xilografía","xilografia","ξύλον","γράφω"],["cronologia","cronología","cronologia","χρόνος","λόγος"],["biografia","biografía","biografia","βίος","γράφω"],["biologia","biología","biologia","βίος","λόγος"],["teosofia","teosofía","teosofia","θεός","σοφία"],["hipologia","hipología","hipologia","ἵππος","λόγος"],["ergonomia","ergonomía","ergonomia","ἔργον","νόμος"],["xilofono","xilófono","xilòfon","ξύλον","φωνή"],["doxologia","doxología","doxologia","δόξα","λόγος"],["ecologia","ecología","ecologia","οἰκία","λόγος"],["fonologia","fonología","fonologia","φωνή","λόγος"],["fonografia","fonografía","fonografia","φωνή","γράφω"],["psicografia","psicografía","psicografia","ψυχή","γράφω"],["anacronismo","anacronismo","anacronisme","ἀνά","χρόνος"],["antibiotico","antibiótico","antibiòtic","ἀντί","βίος"],["dialogo","diálogo","diàleg","διά","λόγος"],["entusiasmo","entusiasmo","entusiasme","ἐν","θεός"],["catalogo","catálogo","catàleg","κατά","λόγος"],["diacronia","diacronía","diacronia","διά","χρόνος"],["megafono","megáfono","megàfon","μέγας","φωνή"],["microbio","microbio","microbi","μικρός","βίος"],["macrobiotico","macrobiótico","macrobiòtic","μακρός","βίος"],["politeismo","politeísmo","politeisme","πολύς","θεός"],["caligrafia","caligrafía","cal·ligrafia","καλός","γράφω"],["cacofonia","cacofonía","cacofonia","κακός","φωνή"],["tanatologia","tanatología","tanatologia","θάνατος","λόγος"],["metafora","metáfora","metàfora","μετά","φέρω"],["periferia","periferia","perifèria","περί","φέρω"],["demagogia","demagogia","demagògia","δήμος","ἄγω"],["arcangel","arcángel","arcàngel","ἀρχή","ἀγγέλλω"],["geografia","geografía","geografia","γῆ","γράφω"],["geologia","geología","geologia","γῆ","λόγος"],["hidrofobia","hidrofobia","hidrofòbia","ὕδωρ","φόβος"],["hidrologia","hidrología","hidrologia","ὕδωρ","λόγος"],["filantropia","filantropía","filantropia","φίλος","ἄνθρωπος"],["apogeo","apogeo","apogeu","ἀπό","γῆ"],["hidrografia","hidrografía","hidrografia","ὕδωρ","γράφω"],["autonomia","autonomía","autonomia","αὐτός","νόμος"],["autografo","autógrafo","autògraf","αὐτός","γράφω"],["dendrologia","dendrología","dendrologia","δένδρον","λόγος"],["talasocracia","talasocracia","talassocràcia","θάλαττα","κράτος"],["metodo","método","mètode","μετά","ὁδός"],["exodo","éxodo","èxode","ἐξ","ὁδός"],["heliopolis","Heliópolis","Heliòpolis","ἥλιος","πόλις"],["heliografia","heliografía","heliografia","ἥλιος","γράφω"],["hemerografia","hemerografía","hemerografia","ἡμέρα","γράφω"],["pedagogia","pedagogía","pedagogia","παῖς","ἄγω"],["plutocracia","plutocracia","plutocràcia","πλοῦτος","κράτος"],["dermatologia","dermatología","dermatologia","δέρμα","λόγος"],["iconografia","iconografía","iconografia","εἰκών","γράφω"],["iconologia","iconología","iconologia","εἰκών","λόγος"],["somatologia","somatología","somatologia","σῶμα","λόγος"],["gerontologia","gerontología","gerontologia","γέρων","λόγος"],["neumologia","neumología","pneumologia","πνεῦμα","λόγος"],["androgino","andrógino","andrògin","ἀνήρ","γυνή"],["ginecologia","ginecología","ginecologia","γυνή","λόγος"],["hematologia","hematología","hematologia","αἷμα","λόγος"],["gastrologia","gastrología","gastrologia","γάστηρ","λόγος"],["hepatologia","hepatología","hepatologia","ἧπαρ","λόγος"],["encefalo","encéfalo","encèfal","ἐν","κεφαλή"],["laringologia","laringología","laringologia","λάρυγξ","λόγος"],["osteologia","osteología","osteologia","ὀστέον","λόγος"],["oftalmologia","oftalmología","oftalmologia","ὀφθαλμός","λόγος"],["rinologia","rinología","rinologia","ῥίς","λόγος"],["quirografia","quirografía","quirografia","χείρ","γράφω"],["blefaroplastia","blefaroplastia","blefaroplàstia","βλέφαρον","πλαστός"],["dermatitis","dermatitis","dermatitis","δέρμα","−ῖτις"],["otitis","otitis","otitis","οὖς","−ῖτις"],["proctologia","proctología","proctologia","πρόκτος","λόγος"],["anatomia","anatomía","anatomia","ἀνά","τομή"],["gastrotomia","gastrotomía","gastrotomia","γάστηρ","τομή"],["blefaritis","blefaritis","blefaritis","βλέφαρον","−ῖτις"],["gastritis","gastritis","gastritis","γάστηρ","−ῖτις"],["megalomania","megalomanía","megalomania","μέγας","μανία"],["misogino","misógino","misogin","μισέω","γυνή"],["misantropo","misántropo","misantrop","μισέω","ἄνθρωπος"],["pseudologia","pseudología","pseudologia","ψευδός","λόγος"],["bibliomania","bibliomanía","bibliomania","βιβλίον","μανία"],["hipomania","hipomanía","hipomania","ὑπό","μανία"],["misologia","misología","misologia","μισέω","λόγος"],["cefalalgia","cefalalgia","cefalàlgia","κεφαλή","ἄλγος"],["poliglota","políglota","políglot","πολύς","γλῶττα"],["isocromia","isocromía","isocromia","ἴσος","χρῶμα"],["criptografia","criptografía","criptografia","κρύπτω","γράφω"],["monologo","monólogo","monòleg","μόνος","λόγος"],["microscopio","microscopio","microscopi","μικρός","σκοπέω"],["cromosoma","cromosoma","cromosoma","χρῶμα","σῶμα"],["cosmologia","cosmología","cosmologia","κόσμος","λόγος"],["aforismo","aforismo","aforisme","ἀπό","ὅρος"],["macrocosmos","macrocosmos","macrocosmos","μακρός","κόσμος"],["cosmopolis","cosmópolis","cosmòpolis","κόσμος","πόλις"],["gastroscopia","gastroscopia","gastroscòpia","γάστηρ","σκοπέω"],["monografia","monografía","monografia","μόνος","γράφω"],["policromia","policromía","policromia","πολύς","χρῶμα"],["isocronia","isocronía","isocronia","ἴσος","χρόνος"],["monoteismo","monoteísmo","monoteisme","μόνος","θεός"],["hipocromia","hipocromía","hipocromia","ὑπό","χρῶμα"],["autodidacta","autodidacta","autodidacta","αὐτός","διδάσκω"],["crematologia","crematología","crematologia","χρήμα","λόγος"],["protologia","protología","protologia","πρῶτος","λόγος"]];
 const coverageAnchors=[{"es":"democracia","va":"democràcia","roots":["δήμος","κράτος"]},{"es":"teología","va":"teologia","roots":["θεός","λόγος"]},{"es":"bibliografía","va":"bibliografia","roots":["βιβλίον","γράφω"]},{"es":"zoología","va":"zoologia","roots":["ζῷον","λόγος"]},{"es":"antropología","va":"antropologia","roots":["ἄνθρωπος","λόγος"]},{"es":"demografía","va":"demografia","roots":["δήμος","γράφω"]}];
 const coverageTemplates=[{"es":["En clase analizamos «","» y «","»."],"va":["A classe analitzem «","» i «","»."]},{"es":["El diccionario recoge «","» y «","»."],"va":["El diccionari arreplega «","» i «","»."]},{"es":["El glosario reúne los términos «","» y «","»."],"va":["El glossari reunix els termes «","» i «","»."]},{"es":["Buscamos los étimos de «","» y «","»."],"va":["Busquem els ètims de «","» i «","»."]},{"es":["En este ejercicio aparecen «","» y «","»."],"va":["En este exercici apareixen «","» i «","»."]},{"es":["La actividad propone investigar «","» y «","»."],"va":["L'activitat proposa investigar «","» i «","»."]},{"es":["Las palabras «","» y «","» figuran en el cuaderno."],"va":["Les paraules «","» i «","» figuren en el quadern."]},{"es":["El alumnado estudia el origen de «","» y «","»."],"va":["L'alumnat estudia l'origen de «","» i «","»."]}];
 coverageTerms.forEach(([id,es,va,first,second],i)=>{
  const start=[...id].reduce((sum,ch)=>sum+ch.charCodeAt(0),0)%coverageAnchors.length;
  const anchors=coverageAnchors.slice(start).concat(coverageAnchors.slice(0,start));
  const anchor=anchors.find(x=>distinctRoots({roots:[[first,second],x.roots]}));
  if(!anchor)return;
  const frame=coverageTemplates[i%coverageTemplates.length];
  records.push({
   id:'cobertura-'+id,
   es:[frame.es[0],es,frame.es[1],anchor.es,frame.es[2]],
   va:[frame.va[0],va,frame.va[1],anchor.va,frame.va[2]],
   roots:[[first,second],anchor.roots.slice()]
  });
 });
 // Índice curricular calculado una única vez al cargar el banco: evita
 // 127 × 4 búsquedas morfológicas al generar o regenerar cada oración.
 const firstStudiedUnit=new Map();
 greekEtymologyBank.entries.forEach(e=>{
  if(!e.verified)return;
  String(e.word).split(/\s*\|\s*/).forEach(variant=>{
   const key=normalize(variant),previous=firstStudiedUnit.get(key);
   if(previous===undefined||e.firstUnit<previous)
    firstStudiedUnit.set(key,e.firstUnit);
  });
 });
 const eligibleRecords=records.filter(distinctRoots).map(record=>({
  record,
  minUnit:Math.max(...record.roots.flat().map(root=>
   firstStudiedUnit.get(normalize(root))??Infinity))
 }));
 function candidates(){
  const limit=greekLimit();
  if(limit<1)return [];
  return eligibleRecords.filter(x=>x.minUnit<=limit)
   .map(x=>({...x.record,sentence:x.record[$('lang').value==='va'?'va':'es']}));
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
