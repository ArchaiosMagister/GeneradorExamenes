/* Independent text-to-vocabulary engine. No inferred paradigms or translations. */
(function(){
'use strict';
const linguistic=()=>window.ExaminaOfflineLemmatizer;
const key=s=>linguistic().normalize(s);
const head=s=>String(s).split(',')[0].replace(/\s*\([^)]*\).*/,'').trim();

/* Formas invariables de referencia: no requieren un paradigma flexivo.
 * Se usan solo cuando el banco no contiene otra lectura para la misma forma.
 * Las acepciones polisémicas pueden necesitar desambiguación contextual.
 * Los enunciados y glosas específicos del docente tienen prioridad.
 */
const latinInvariables=[
 [['a','ab','abs'],'a, ab (prep. + abl.)','de, desde, por','de, des de, per'],
 [['ad'],'ad (prep. + ac.)','a, hacia','a, cap a'],
 [['ante'],'ante (prep. + ac.)','delante de, antes de','davant de, abans de'],
 [['apud'],'apud (prep. + ac.)','junto a, en casa de','al costat de, en casa de'],
 [['circum'],'circum (prep. + ac.)','alrededor de','al voltant de'],
 [['contra'],'contra (prep. + ac.)','contra','contra'],
 [['de'],'de (prep. + abl.)','de, desde, acerca de','de, des de, sobre'],
 [['e','ex'],'e, ex (prep. + abl.)','de, desde, fuera de','de, des de, fora de'],
 [['in'],'in (prep. + ac./abl.)','a, hacia, en','a, cap a, en'],
 [['inter'],'inter (prep. + ac.)','entre','entre'],
 [['ob'],'ob (prep. + ac.)','a causa de','a causa de'],
 [['per'],'per (prep. + ac.)','por, a través de','per, a través de'],
 [['post'],'post (prep. + ac.)','después de, detrás de','després de, darrere de'],
 [['prae'],'prae (prep. + abl.)','delante de, a causa de','davant de, a causa de'],
 [['pro'],'pro (prep. + abl.)','en favor de, en lugar de','a favor de, en lloc de'],
 [['propter'],'propter (prep. + ac.)','cerca de, a causa de','prop de, a causa de'],
 [['sine'],'sine (prep. + abl.)','sin','sense'],
 [['sub'],'sub (prep. + ac./abl.)','debajo de, al pie de','davall de, al peu de'],
 [['super'],'super (prep. + ac./abl.)','sobre, encima de','sobre, damunt de'],
 [['trans'],'trans (prep. + ac.)','al otro lado de, a través de','a l’altre costat de, a través de'],
 [['et'],'et (conj.)','y','i'],
 [['atque','ac'],'atque, ac (conj.)','y, e incluso','i, i fins i tot'],
 [['aut'],'aut (conj.)','o','o'],
 [['vel'],'vel (conj.)','o, incluso','o, fins i tot'],
 [['sed'],'sed (conj.)','pero, sino','però, sinó'],
 [['neque','nec'],'neque, nec (conj.)','y no, ni','i no, ni'],
 [['enim'],'enim (conj.)','pues, en efecto','puix, en efecte'],
 [['tamen'],'tamen (adv.)','sin embargo','no obstant això'],
 [['non'],'non (adv.)','no','no'],
 [['etiam'],'etiam (adv.)','también, incluso','també, fins i tot'],
 [['quoque'],'quoque (adv.)','también','també'],
 [['nunc'],'nunc (adv.)','ahora','ara'],
 [['tum'],'tum (adv.)','entonces','aleshores'],
 [['iam'],'iam (adv.)','ya','ja'],
 [['semper'],'semper (adv.)','siempre','sempre'],
 [['saepe'],'saepe (adv.)','a menudo','sovint'],
 [['ibi'],'ibi (adv.)','allí','allí'],
 [['ubi'],'ubi (adv.)','donde, cuando','on, quan'],
 [['unde'],'unde (adv.)','de donde','d’on'],
 [['cur'],'cur (adv.)','por qué','per què'],
 [['hodie'],'hodie (adv.)','hoy','hui'],
 [['heri'],'heri (adv.)','ayer','ahir'],
 [['cras'],'cras (adv.)','mañana','demà'],
 [['bene'],'bene (adv.)','bien','bé'],
 [['male'],'male (adv.)','mal','mal']
];
const latinCore=new Map();
for(const [forms,entry,meaning,meaning_va] of latinInvariables){
 const lemma=key(forms[0]);
 for(const surface of forms){
  const k=key(surface);
  if(!latinCore.has(k))latinCore.set(k,[]);
  latinCore.get(k).push({lemma,entry,meaning,meaning_va,attested:true,origin:'invariable contrastada de gramática escolar'});
 }
}
const invariableEntry=entry=>/\((?:adv\.?|conj\.?|prep\.?|part\.?|interj\.?|loc\.|num\.\s*indecl\.)/i.test(String(entry||''));
/* Reconocimiento independiente de las SEIS formas del presente de indicativo
 * activo regular, deducibles de un enunciado y una conjugación EXPLÍCITOS.
 * No extrapola perfecto, aoristo, voz pasiva ni verbos sin clase conocida.
 * El lema y la traducción proceden siempre del banco del profesor.
 */
const latinPresentCache=new WeakMap();
function latinPresentForms(bank){
 if(latinPresentCache.has(bank))return latinPresentCache.get(bank);
 const byForm=new Map();
 const endings={
  '1ª':['o','as','at','amus','atis','ant'],
  '2ª':['eo','es','et','emus','etis','ent'],
  '3ª':['o','is','it','imus','itis','unt'],
  '4ª':['io','is','it','imus','itis','iunt'],
  'mx.':['io','is','it','imus','itis','iunt']
 };
 for(const row of bank){
  const raw=String(row.entry||'').trim();
  const m=/\((1ª|2ª|3ª|4ª|mx\.)\)\s*$/u.exec(raw);
  if(!m||!row.meaning)continue;
  const lemma=head(raw);
  if(!/^[\p{L}\p{M}]+$/u.test(lemma))continue;
  const group=m[1],terminal=group==='2ª'?'eo':group==='4ª'||group==='mx.'?'io':'o';
  if(!lemma.toLowerCase().endsWith(terminal))continue;
  const stem=lemma.slice(0,-terminal.length);
  if(!stem)continue;
  const record={lemma:key(lemma),entry:raw,meaning:row.meaning,
   meaning_va:row.meaning_va||'',attested:true,
   origin:'presente regular de la conjugación declarada en el banco docente'};
  const score=x=>x.entry.split(',').length*10+x.entry.length/100;
  for(const ending of endings[group]){
   const form=key(stem+ending);
   if(!byForm.has(form))byForm.set(form,new Map());
   const candidates=byForm.get(form),old=candidates.get(record.lemma);
   if(!old||score(record)>score(old))candidates.set(record.lemma,record);
  }
 }
 const result=new Map([...byForm].map(([k,values])=>[k,[...values.values()]]));
 latinPresentCache.set(bank,result);
 return result;
}


/* Paradigmas productivos de declinaciones 1.ª/2.ª y presente griego.
 * Solo se aplican a enunciados que constan en el banco docente, con su
 * traducción intacta. No se extrapolan flexiones irregulares ni temas
 * verbales (aoristo, perfecto) que el enunciado no documenta.
 */
function greekReferenceForms(bank){
 const map=new Map();
 const add=(form,record)=>{
  const k=key(form);
  if(!k)return;
  if(!map.has(k))map.set(k,[]);
  const slot=map.get(k),id=record.lemma+'|'+record.entry+'|'+record.meaning;
  const exact=form.normalize('NFC'),prior=slot.find(c=>c.lemma+'|'+c.entry+'|'+c.meaning===id);
  if(prior)prior.exactForms.add(exact);
  else slot.push({...record,exactForms:new Set([exact])});
 };
 const endings=(stem,list,row)=>{for(const ending of list)add(stem+key(ending),row)};
 for(const source of bank){
  if(!source?.entry||!source?.meaning)continue;
  const entry=source.entry,alternatives=head(entry).split(/\s+o\s+/i).map(key).filter(Boolean);
  for(const lemma of alternatives){
  const record={lemma,entry,meaning:source.meaning,attested:true,origin:'banco docente / paradigma regular'};
  // La forma de cita del propio banco es una identificación segura.
  add(lemma,record);
  const parts=entry.split(',').slice(1).map(s=>key(s.replace(/[–−—-]/g,'').replace(/\([^)]*\)/g,'')));
  const part=(word)=>parts.some(p=>p===word),stem=lemma;
  if(lemma.endsWith('οσ')&&(part('ου')||part('ον'))){
   endings(stem.slice(0,-2),['ος','ου','ῳ','ον','ε','οι','ων','οις','ους'],record);
   if(part('ον'))endings(stem.slice(0,-2),['ον','ου','ῳ','α','ων','οις'],record);
   if(part('η'))endings(stem.slice(0,-2),['η','ης','ῃ','ην','αι','ων','αις','ας'],record);
   if(part('α'))endings(stem.slice(0,-2),['α','ας','ᾳ','αν','αι','ων','αις','ας'],record);
  }else if(lemma.endsWith('ον')&&part('ου')){
   endings(stem.slice(0,-2),['ον','ου','ῳ','α','ων','οις'],record);
  }else if((lemma.endsWith('η')||lemma.endsWith('α'))&&(part('ης')||part('ας'))){
   const root=stem.slice(0,-1);
   endings(root,[stem.endsWith('η')?'η':'α',part('ης')?'ης':'ας',
    part('ης')?'ῃ':'ᾳ',stem.endsWith('η')?'ην':'αν','αι','ων','αις','ας'],record);
  }else if((lemma.endsWith('ης')||lemma.endsWith('ας'))&&part('ου')){
   const root=stem.slice(0,-2);
   endings(root,[lemma.endsWith('ης')?'ης':'ας','ου',
    lemma.endsWith('ης')?'ῃ':'ᾳ',lemma.endsWith('ης')?'ην':'αν',
    'αι','ων','αις','ας'],record);
  }else if(lemma.endsWith('αι')&&part('ων')){
   // Pluralia tantum como Ἀθῆναι, –ῶν.
   endings(stem.slice(0,-2),['αι','ων','αις','ας'],record);
  }
  // Solo presente de verbos en -ω y -ομαι; formas contractas transparentes.
  const hasInflection=parts.length===0;
  if(hasInflection&&lemma.endsWith('εω')){
   endings(lemma.slice(0,-2),['ῶ','εῖς','εῖ','οῦμεν','εῖτε','οῦσι','οῦσιν','εῖν'],record);
  }else if(hasInflection&&lemma.endsWith('αω')){
   endings(lemma.slice(0,-2),['ῶ','ᾷς','ᾷ','ῶμεν','ᾶτε','ῶσι','ῶσιν','ᾶν'],record);
  }else if(hasInflection&&/(?:εομαι|αομαι)$/.test(lemma)){
   // Los medios contractos requieren paradigmas específicos; no se extrapolan.
  }else if(hasInflection&&lemma.endsWith('ομαι')){
   endings(lemma.slice(0,-4),['ομαι','ῃ','εται','όμεθα','εσθε','ονται','εσθαι'],record);
  }else if(hasInflection&&lemma.endsWith('ω')){
   endings(lemma.slice(0,-1),['ω','εις','ει','ομεν','ετε','ουσι','ουσιν','ειν'],record);
  }
  }
 }
 // Los enunciados docentes prevalecen sobre las entradas suplementarias.
 // Estas equivalencias se usan únicamente donde la base docente no tiene
 // la entrada, y documentan el genitivo o las formas de los adjetivos.
 const supplementaryEntries={
  'Διόνυσος':'Διόνυσος, –ου','Νεῖλος':'Νεῖλος, –ου',
  'Αἴγυπτος':'Αἴγυπτος, –ου (ἡ)','Ἀλέξανδρος':'Ἀλέξανδρος, –ου',
  'Αἰσχύλος':'Αἰσχύλος, –ου','Ἀφροδίτη':'Ἀφροδίτη, –ης',
  'ἄγγελος':'ἄγγελος, –ου','ἀγρός':'ἀγρός, –οῦ',
  'δειλός':'δειλός, –ή, –όν','πολέμιος':'πολέμιος, –α, –ον',
  'τριήρης':'τριήρης, –ες','Μαραθών':'Μαραθών, –ῶνος',
  'ὁ, ἡ, τό':'ὁ, ἡ, τό (art.)',
  'ἐγώ':'ἐγώ, ἡμεῖς (pron. pers.)','σύ':'σύ, ὑμεῖς (pron. pers.)',
  'αὐτός':'αὐτός, –ή, –ό (pron.)',
  'οὗτος':'οὗτος, αὕτη, τοῦτο (pron. dem.)',
  'ἐκεῖνος':'ἐκεῖνος, –η, –ο (pron. dem.)',
  'ὅδε':'ὅδε, ἥδε, τόδε (pron. dem.)',
  'ὅς':'ὅς, ἥ, ὅ (pron. rel.)',
  'ὅστις':'ὅστις, ἥτις, ὅ τι (pron. rel.)',
  'τίς':'τίς, τί (pron. interr.)',
  'τις':'τις, τι (pron. indef.)',
  'ἅπας':'ἅπας, ἅπασα, ἅπαν',
  'ὦ':'ὦ (interj.)',
  'ἤ':'ἤ (conj.)',
  'μάχη':'μάχη, –ης','θάλαττα':'θάλαττα, –ης',
  'σοφία':'σοφία, –ας','ψυχή':'ψυχή, –ῆς',
  'πενία':'πενία, –ας','ἄλλος':'ἄλλος, –η, –ο',
  'Ἀκρόπολις':'Ἀκρόπολις, –εως (ἡ)',
  'αἰθήρ':'αἰθήρ, –έρος',
  'Ἕλλην':'Ἕλλην, –ηνος (ὁ/ἡ)','μήν':'μήν, μηνός (ὁ)',
  'τύχη':'τύχη, –ης','φύσις':'φύσις, –εως (ἡ)',
  'θέα':'θέα, –ας','πολύς':'πολύς, πολλή, πολύ',
  'πᾶς':'πᾶς, πᾶσα, πᾶν','μέγας':'μέγας, μεγάλη, μέγα',
  'μαθητής':'μαθητής, –οῦ',
  'μέν':'μέν… δέ (part.)','δέ':'μέν… δέ (part.)'
 };
 const bankByHead=form=>bank.find(row=>{
  const raw=head(row.entry),base=raw.split(/\s+\+/)[0];
  const parts=base.split('/');
  return raw.normalize('NFC')===String(form).normalize('NFC') ||
    (!['τίς','τις'].includes(form) &&
     (key(raw)===key(form)||parts.some(part=>key(part)===key(form))));
 });
 const prepLabel=entry=>entry.replace(/\s+\+\s*(genitivo|acusativo|dativo)(?:\s*\|\s*(genitivo|acusativo|dativo))?(?:\s*\|\s*(genitivo|acusativo|dativo))?$/,
  (_,a,b,c)=>' (prep. + '+[a,b,c].filter(Boolean).map(s=>({genitivo:'gen.',acusativo:'ac.',dativo:'dat.'}[s])).join('/')+')');
 const addIrregular=(forms,entry,meaning)=>{
  const saved=bankByHead(entry);
  const sourceEntry=saved?.entry||supplementaryEntries[entry]||entry;
  const outputEntry=/\s+\+\s*(genitivo|acusativo|dativo)/.test(sourceEntry)?prepLabel(sourceEntry):sourceEntry;
  const record={lemma:key(head(saved?.entry||entry)),entry:outputEntry,
   meaning:saved?.meaning||meaning,attested:true,origin:'paradigma gramatical explícito'};
  for(const form of forms)add(form,record);
 };
 addIrregular(['ὁ','ἡ','τό','τὸ','τοῦ','τῆς','τῷ','τῇ','τόν','τὸν','τήν','τὴν',
  'οἱ','αἱ','τά','τὰ','τῶν','τοῖς','ταῖς','τούς','τοὺς','τάς','τὰς'],
  'ὁ, ἡ, τό','el, la, lo (artículo)');
 addIrregular(['εἰμί','εἰμί','εἶ','ἐστί','ἐστὶ','ἐστί(ν)','ἐστίν','ἐστιν',
  'ἐσμέν','ἐστέ','ἐστε','εἰσί','εἰσι','εἰσίν','εἰσιν','εἶναι','ἦν','ἦσαν',
  'ἔσται','ἔσονται','ἐσόμεθα','ἐσόμεθα','ὤν','οὖσα','ὄν','ὄντος','ὄντες','ὄντων','οὖσαν'],
  'εἰμί','ser, estar, haber');
 addIrregular(['οὐ','οὐκ','οὐχ'],'οὐ','no');
 addIrregular(['ἀλλά','ἀλλὰ','ἀλλ'],'ἀλλά','pero, sino');
 addIrregular(['μέν','μὲν','μέν','δέ','δὲ','δέ','δ'],'μέν… δέ','por un lado… por otro');
 addIrregular(['καί','καὶ'],'καί','y, también');
 // Los nombres propios solo se añaden cuando el banco no los contiene.
 addIrregular(['Διόνυσος','Διόνυσος','Διονύσου','Διονύσου'],'Διόνυσος','Dioniso');
 addIrregular(['Νεῖλος','Νείλου'],'Νεῖλος','Nilo');
 addIrregular(['Ζεύς','Ζεὺς','Ζεύς','Διός','Διὸς','Διί','Δία','Ζεῦ'],'Ζεύς','Zeus');

 // Tercera declinación: únicamente formas explicitadas y comprobadas.
 addIrregular(['ἀνὴρ','ἀνήρ','ἄνδρα','ἀνδρός','ἀνδρὸς','ἄνδρες','ἄνδρας','ἀνδρῶν','ἀνδρί'],
  'ἀνήρ','hombre');
 addIrregular(['γυνή','γυνὴ','γυναῖκα','γυναικός','γυναικὸς','γυναικῶν','γυναῖκες'],
  'γυνή','mujer');
 addIrregular(['πατήρ','πατὴρ','πατέρα','πατρός','πατρὸς','πατρί','πατέρες','πατέρων','πατρῶν'],
  'πατήρ','padre');
 addIrregular(['μήτηρ','μήτηρ','μητὴρ','μητρός','μητρί','μητέρα','μητέρες'],
  'μήτηρ','madre');
 addIrregular(['παῖς','παῖδα','παιδί','παιδὶ','παιδός','παῖδες','παῖδας','παίδων','παισίν'],
  'παῖς','niño, niña');
 addIrregular(['βασιλεύς','βασιλεὺς','βασιλέα','βασιλέως','βασιλεῖ','βασιλεῖς','βασιλέων','βασιλεῦσι','βασιλέων'],
  'βασιλεύς','rey');
 addIrregular(['πόλις','πόλιν','πόλεως','πόλει','πόλεις','πόλεων','πόλεσι','πόλεσιν','πόλεσι','πόλεις'],
  'πόλις','ciudad');
 addIrregular(['ὕδωρ','ὕδατος','ὕδατι','ὕδατα','ὑδάτων','ὕδασι'],
  'ὕδωρ','agua');
 addIrregular(['σῶμα','σώματος','σώματι','σώματα','σωμάτων','σώμασι','σώματα'],
  'σῶμα','cuerpo');
 addIrregular(['πρᾶγμα','πράγμα','πράγματος','πραγμάτων','πράγματα','πράγματι'],
  'πρᾶγμα','asunto');
 addIrregular(['αἷμα','αἵματος','αἵματι','αἵματα','αἱμάτων'],
  'αἷμα','sangre');
 addIrregular(['γέρων','γέρων','γέροντος','γέροντι','γέροντα','γέροντες','γερόντων'],
  'γέρων','anciano');
 addIrregular(['ῥήτωρ','ῥήτωρ','ῥήτορα','ῥήτορος','ῥήτορες','ῥήτορας','ῥητόρων'],
  'ῥήτωρ','orador');
 addIrregular(['λέων','λέων','λέοντα','λέοντος','λέοντες','λεόντων'],
  'λέων','león');
 addIrregular(['φλέψ','φλέψ','φλεβός','φλέβες','φλέβας','φλεψί','φλεψὶ'],
  'φλέψ','vena');
 addIrregular(['ἀσπίς','ἀσπίς','ἀσπίδος','ἀσπίδα','ἀσπίδες','ἀσπίδας','ἀσπίδων'],
  'ἀσπίς','escudo');
 addIrregular(['χιών','χιών','χιόνος','χιόνι','χίονι','χιόνα'],
  'χιών','nieve');
 addIrregular(['ἄρχων','ἄρχοντος','ἄρχοντι','ἄρχοντα','ἄρχοντες','ἀρχόντων'],
  'ἄρχων','gobernante');
 addIrregular(['Αἴγυπτος','Αἴγυπτου','Αἰγύπτου','Αἰγύπτου'],'Αἴγυπτος','Egipto');


 // Partículas y preposiciones de alto rendimiento: son invariables,
 // se respeta el enunciado docente cuando existe.
 const closed=[
  ['τε','y (enclítica)',['τε']],
  ['οὔτε','ni',['οὔτε']],
  ['οὐδέ','ni, tampoco',['οὐδέ','οὐδὲ']],
  ['γάρ','pues, porque',['γάρ','γὰρ']],
  ['ὅτι','que, porque',['ὅτι']],
  ['ἀεί','siempre',['ἀεί','ἀεὶ']],
  ['οὔποτε','nunca',['οὔποτε']],
  ['πολλάκις','muchas veces',['πολλάκις']],
  ['ἐν','en, dentro de (+ dat.)',['ἐν']],
  ['εἰς','a, hacia (+ acc.)',['εἰς']],
  ['ἐκ','de, desde (+ gen.)',['ἐκ','ἐξ']],
  ['ἀπό','de, desde (+ gen.)',['ἀπό','ἀπὸ']],
  ['διά','a través de, por (+ gen./acc.)',['διά','διὰ']],
  ['κατά','según, contra (+ gen./acc.)',['κατά','κατὰ']],
  ['ἐπί','sobre, hacia (+ gen./dat./acc.)',['ἐπί','ἐπὶ']],
  ['ὑπέρ','por, sobre (+ gen./acc.)',['ὑπέρ','ὑπὲρ']],
  ['ὑπό','bajo, por (+ gen./dat./acc.)',['ὑπό','ὑπὸ']],
  ['μετά','con, después de (+ gen./acc.)',['μετά','μετὰ']],
  ['παρά','al lado de, de parte de (+ gen./dat./acc.)',['παρά','παρὰ']],
  ['περί','acerca de, alrededor de (+ gen./acc.)',['περί','περὶ']],
  ['πρός','hacia, a (+ acc.)',['πρός','πρὸς']],
  ['σύν','con (+ dat.)',['σύν','σὺν']],
  ['ἄνευ','sin (+ gen.)',['ἄνευ']],
  ['ἀντί','en lugar de (+ gen.)',['ἀντί','ἀντὶ']],
  ['πρό','antes de (+ gen.)',['πρό','πρὸ']],
  ['πῶς','cómo',['πῶς']],
  ['ποῦ','dónde',['ποῦ']],
  ['ποῖ','adónde',['ποῖ']],
  ['ἆρα','acaso (interrogación)',['ἆρα']],
  ['μή','no (negación subjetiva)',['μή','μὴ']]
 ];
 for(const [entry,meaning,forms] of closed)addIrregular(forms,entry,meaning);
 // Todas las formas de la negación comparten el enunciado del banco.
 // Las tres formas οὐ, οὐκ y οὐχ pertenecen a una única entrada.

 // Paradigmas pronominales irregulares que aparecen en las UDs 5–10.
 addIrregular(['ἐγώ','ἐγὼ','ἐμοῦ','ἐμοί','ἐμοὶ','ἐμέ','ἐμὲ','ἡμεῖς','ἡμῶν','ἡμῖν','ἡμᾶς'],
  'ἐγώ','yo; nosotros');
 addIrregular(['σύ','σὺ','σοῦ','σοί','σοὶ','σέ','σὲ','ὑμεῖς','ὑμῶν','ὑμῖν','ὑμᾶς'],
  'σύ','tú; vosotros');
 addIrregular(['αὐτός','αὐτὸς','αὐτόν','αὐτὸν','αὐτοῦ','αὐτῷ','αὐτῇ','αὐτή','αὐτὴ','αὐτήν','αὐτήν',
  'αὐτοί','αὐτοὶ','αὐτοῖς','αὐτῶν','αὐτούς','αὐτούς','αὐτά','αὐτὰ','αὐταῖς','αὐτάς'],
  'αὐτός','él mismo; él, ella; mismo');
 addIrregular(['οὗτος','οὗτοι','οὗτοι','οὗτοι','αὕτη','τοῦτο','τούτου','τούτου','τούτῳ',
  'τούτον','τοῦτον','τούτους','τούτους','τούτων','τούτων','ταῦτα','ταύτην','ταύτῃ','ταύτῃ'],
  'οὗτος','este, esta, esto');
 addIrregular(['ἐκεῖνος','ἐκεῖνοι','ἐκείνη','ἐκείνης','ἐκείνων','ἐκείνης','ἐκεῖνον','ἐκείνου','ἐκείνους'],
  'ἐκεῖνος','aquel, aquella, aquello');
 addIrregular(['ὅδε','ἥδε','τόδε','τόδε','οἵδε','αἵδε','τάδε'],
  'ὅδε','este, esta, esto');
 addIrregular(['ὅς','ὅ','ἥ','ὅν','οὗ','ᾧ','ᾗ','ἧς','ἥν','οἵ','αἵ','ἅ','οὕς','ὧν','οἷς','αἷς'],
  'ὅς','que, el cual');
 addIrregular(['ὅστις','ἥτις','ὅ τι','οἵτινες','οἵτινας','ὧντινων','ὅτου'],
  'ὅστις','quienquiera que, el que');
 addIrregular(['πολύς','πολὺς','πολλή','πολλὴ','πολύ','πολλοὶ','πολλοί','πολλὰ','πολλά',
  'πολλούς','πολλοὺς','πολλὰς','πολλάς','πολλαί','πολλαὶ','πολλῶν','πολλοῖς','πολλαῖς','πολλὴν','πολλῆς'],
  'πολύς','mucho, numeroso');
 addIrregular(['πᾶς','πᾶσα','πᾶν','πάντες','πάντες','πάντας','πάντα','πάντα','πάντων','πάντων',
  'πασῶν','πάσαις','πάσας','πᾶσι','πᾶσιν'],
  'πᾶς','todo');
 addIrregular(['ἅπας','ἅπασα','ἅπαν','ἅπαντες','ἅπαντα','ἅπαντας','ἁπάντων'],
  'ἅπας','todo, entero');
 addIrregular(['μέγας','μέγας','μεγάλη','μεγάλη','μέγα','μεγάλα','μεγάλαι','μεγάλαι',
  'μεγάλων','μεγάλους','μεγάλας'],
  'μέγας','grande');

 // Pronominales interrogativos e indefinidos. La acentuación del original
 // distingue las formas coincidentes tras quitar tildes del índice.
 addIrregular(['τίς','τίς','τί','τί','τίνα','τίνα','τίνος','τίνος','τίνι','τίνι',
  'τίνες','τίνες','τίνας','τίνας','τίσι','τίσιν','τίσιν'],'τίς','quién, cuál, qué');
 addIrregular(['τις','τι','τινά','τινὰ','τινάς','τινὰς','τινός','τινὸς','τινί','τινὶ',
  'τινές','τινὲς','τισι','τισιν','τινα','τινες'],'τις','alguien, alguno, cierto');
 addIrregular(['ἀγρός','ἀγρὸς','ἀγροῦ','ἀγρὸν','ἀγρόν','ἀγροὺς','ἀγρούς','ἀγροῖς'],
  'ἀγρός','campo');
 addIrregular(['δειλός','δειλὸς','δειλοῦ','δειλόν'],'δειλός','cobarde');
 addIrregular(['πολέμιος','πολέμιοι','πολεμίαν','πολεμίαν','πολεμίων','πολεμίων'],
  'πολέμιος','enemigo, hostil');
 addIrregular(['τριήρης','τριήρης','τριήρεις','τριήρεις','τριήρους'],
  'τριήρης','trirreme');
 addIrregular(['Μαραθών','Μαραθῶν','Μαραθῶνος','Μαραθῶνι'],
  'Μαραθών','Maratón');
 addIrregular(['Ἀφροδίτη','Ἀφροδίτη','Ἀφροδίτης','Ἀφροδίτης'],
  'Ἀφροδίτη','Afrodita');
 addIrregular(['Αἰσχύλος','Αἰσχύλος','Αἰσχύλου'],
  'Αἰσχύλος','Esquilo');
 addIrregular(['Ἀλέξανδρος','Ἀλέξανδρος','Ἀλεξάνδρου'],
  'Ἀλέξανδρος','Alejandro');
 addIrregular(['ἄγγελος','ἄγγελοι','ἀγγέλου'],
  'ἄγγελος','mensajero');

 addIrregular(['μαθητής','μαθητής','μαθητήν','μαθηταί','μαθηταὶ','μαθητάς','μαθητὰς',
  'μαθητῶν','μαθητοῖς'],'μαθητής','alumno');


 // Formas concretas comprobadas en los textos docentes de las UDs 1–14.
 // Solo se asigna una forma cuando hay identificación filológica segura.
 // Se prioriza siempre el enunciado/traducción del banco del profesor.
 const confirmed=[
  ['ἀγγέλλω','anunciar',['ἀγγέλλοντων']],
  ['Αἴγινα','Egina',['Αἰγίνῃ']],
  ['ἀκούω','escuchar',['ἀκούεται','ἀκούσει']],
  ['ἅμαξα','carro',['ἁμάξης']],
  ['ἀνδρεῖος','valiente',['ἀνδρεῖοί']],
  ['ἀνακράζω','gritar',['ἀνέκραγον']],
  ['ἀποθνῄσκω','morir',['ἀπέθανον','ἀπέθνῃσκον','ἀποθνῄσκοντα','ἀποθνῄσκοντος']],
  ['ἀποκτείνω','matar',['ἀπέκτεινον']],
  ['ἀποπλέω','zarpar',['ἀποπλευσάντων']],
  ['Ἀριστοτέλης','Aristóteles',['Ἀριστοτέλης']],
  ['ἄρχω','gobernar',['ἄρχεσθαι','ἄρχεται']],
  ['Ἀσία','Asia',['Ἁσίας']],
  ['Ἀσκληπιός','Asclepio',['Ἀσκληπιὸν']],
  ['Ἀττική','Ática',['Ἀττικὴν','Ἀττικῆς']],
  ['ἀφικνέομαι','llegar',['ἀφικόμενοι']],
  ['Ἀχιλλεύς','Aquiles',['Ἀχιλλέα']],
  ['βασιλεύω','reinar',['βασιλεύονται','ἐβασίλευε','ἐβασίλευσεν']],
  ['βούλομαι','querer',['βουλομένοι','ἐβούλοντο']],
  ['γίγνομαι','llegar a ser',['γιγνόμενος']],
  ['γιγνώσκω','conocer',['γιγνώσκοντες']],
  ['γύψ','buitre',['γύπας']],
  ['δέσποινα','señora, dueña',['δεσποίνῃ']],
  ['δεσπότης','amo, señor',['δεσπότῃ']],
  ['διαφθείρω','destruir',['διαφθείρων','διέφθειρον']],
  ['διαφέρω','diferir',['διέφερεν']],
  ['διώκω','perseguir',['διώκονται','διώκοντες','ἐδίωκον','ἐδιώξε']],
  ['δύναμαι','poder',['δυνάμενος']],
  ['γράφω','escribir',['ἔγραφεν','ἐγράψαν','ἐγράψε']],
  ['δοκέω','parecer',['ἐδόκουν']],
  ['δουλεύω','ser esclavo',['ἐδούλευσεν']],
  ['τρέχω','correr',['ἔδραμον']],
  ['θαυμάζω','admirar',['ἐθαυμάσε']],
  ['θεραπεύω','curar, venerar',['ἐθεράπευον']],
  ['λέγω','decir',['εἶπεν','εἶπον']],
  ['ἀπέρχομαι','marcharse',['ἀπήρχοντο']],
  ['εἰσέρχομαι','entrar',['εἰσήρχοντο']],
  ['ἔχω','tener',['εἶχε']],
  ['κελεύω','ordenar',['ἐκελεύσατο','ἐκέλευσεν']],
  ['κιθαρίζω','tocar la cítara',['ἐκιθάρισε']],
  ['ἐκκλησία','asamblea',['ἐκκλησίᾳ','ἐκκλησίαν','ἐκκλησίας']],
  ['κομίζω','llevarse',['ἐκόμισε']],
  ['λείπω','dejar',['ἔλειψαν','ἔλιπον']],
  ['λύω','liberar',['ἐλελύκειμεν']],
  ['Ἑλένη','Helena',['Ἑλένη']]
 ];
 for(const [lemma,meaning,forms] of confirmed)addIrregular(forms,lemma,meaning);

 // Segunda tanda: formas identificables de las mismas 14 UDs.
 // Solo se incluyen los análisis seguros; errores de grafía quedan pendientes.
 const secondPass=[
  ['Ἑλλάς','Grecia',['Ἑλλάδα','Ἑλλάδι','Ἑλλάδος']],
  ['Ἕλλην','griego',['Ἐλλήσι']],
  ['μένω','permanecer, esperar',['ἔμενον']],
  ['ἐμπίπτω','caer en',['ἐνέπεσεν']],
  ['πάσχω','sufrir',['ἔπαθεν']],
  ['παιδεύω','educar',['ἐπαίδευε','ἐπαίδευσαν','ἐπαίδευσε','ἐπαίδευσεν','ἐπεπαιδεύκει','παιδεύονται','παιδεύσει','πεπαιδεύκασιν','πεπαίδευκε']],
  ['ἐπαινέω','alabar',['ἐπαινεῖ']],
  ['πείθω','convencer',['ἔπειθον','ἔπεισαν']],
  ['πέμπω','enviar',['ἔπεμπεν','ἐπέμψατε','ἐπέμψεν','πέμποντος']],
  ['πρεσβεύω','ser embajador',['ἐπεπρεσβεύκεσάν']],
  ['φύω','engendrar, crecer',['ἐπεφύκει']],
  ['πλέω','navegar',['ἔπλευσαν']],
  ['ποιέω','hacer',['ἐποιεῖτε','ἐποιοῦντο']],
  ['πράττω','hacer',['ἔπραξαν','ἔπραξεν','πράττοντες','πράττων']],
  ['ῥίπτω','arrojar',['ἐρίψαν']],
  ['ἔρχομαι','ir, venir',['ἐρχόμενος']],
  ['Ἔρως','Eros',['Ἔρως']],
  ['ἐρωτάω','preguntar',['ἐρωτᾶται','ἠρωτᾶντο']],
  ['εἰσβάλλω','invadir',['ἐσέβαλον']],
  ['στρατεύω','hacer una expedición',['ἐστράτευσαν','στρατεύσουσιν']],
  ['ἔχω','tener',['ἔσχον']],
  ['σῴζω','salvar',['ἐσῴσαν']],
  ['τέμνω','cortar',['ἔτεμον']],
  ['τιμάω','honrar',['ἐτιμᾶτο','ἐτιμῶμεθα','τιμᾶται']],
  ['τυγχάνω','alcanzar, conseguir',['ἔτυχεν']],
  ['εὐδαίμων','feliz',['εὐδαίμονές']],
  ['Εὐρώπη','Europa',['Εὐρώπην']],
  ['εὐχή','súplica, plegaria',['εὐχαῖς']],
  ['φέρω','llevar',['ἔφερε','ἔφερεν','φέρεται']],
  ['φεύγω','huir',['ἔφευγον','ἔφυγον','φευγόντας']],
  ['φιλέω','amar',['ἐφιλεῖς']],
  ['φονεύω','matar',['ἐφόνευσαν']],
  ['φυλάσσω','proteger',['ἐφυλάξαν','ἐφυλάξατε','ἐφύλασσον']],
  ['ζητέω','buscar',['ζητεῖται']],
  ['ζυγόν','yugo',['ζυγά']],
  ['ζῷον','animal',['ζῶα']],
  ['ἀγγέλλω','anunciar',['ἤγγελλεν']],
  ['ἡγέομαι','guiar, considerar',['ἡγεῖσθε','ἡγούμεθα']],
  ['ἄγω','conducir',['ἤγεν']],
  ['ἐθέλω','querer',['ἤθελεν']],
  ['ἀκούω','escuchar',['ἤκουον','ἤκουσαν']],
  ['ἡμέρα','día',['ἡμέρᾳ','ἡμέραν']],
  ['Ἡρακλῆς','Heracles',['Ἡρακλῆς']],
  ['ἁρπάζω','arrebatar',['ἥρπασε']],
  ['ἄρχω','gobernar',['ἦρχε','ἦρχον']],
  ['αὐλέω','tocar la flauta',['ηὔλησεν']],
  ['εὑρίσκω','encontrar',['ηὕρισκον']],
  ['θεράπαινα','sirvienta',['θεράπαιναι']],
  ['θεραπεύω','curar, venerar',['θεραπεύονται','θεραπεύσει']],
  ['θνητός','mortal',['θνητῆς']],
  ['θύω','sacrificar',['θύσαντος','θύσουσι']],
  ['ἱερεύς','sacerdote',['ἱερέως']],
  ['κακῶς','mal',['κακῶς']],
  ['καλῶς','bien',['καλῶς']],
  ['Καλλίας','Calias',['Καλλίαν']],
  ['κατέχω','retener',['κατεῖχε']],
  ['καταλείπω','dejar atrás',['κατέλιπε']],
  ['κινδυνεύω','correr peligro',['κεκινδυμεύκαμεν']],
  ['κωλύω','impedir',['κεκωλύκαμεν']],
  ['κελεύω','ordenar',['κελεύσαντος']],
  ['Κρήτη','Creta',['Κρήτην']],
  ['Κῦρος','Ciro',['Κύρου']],
  ['λαμβάνω','tomar',['λαμβάνοντες']],
  ['λαμπρός','brillante, ilustre',['λαμπραὶ']],
  ['λέγω','decir',['λέγοντας','λέγοντες','λέγων','ἔλεξε']],
  ['μαθητής','alumno',['μαθητῇ']],
  ['μακάριος','feliz, bienaventurado',['μακάριος']],
  ['μάχομαι','combatir',['μαχόμενοι']],
  ['μένω','permanecer',['μένοντες']],
  ['μετέχω','participar',['μετεῖχον']],
  ['νικάω','vencer',['νικῶνται']],
  ['νομίζω','creer, considerar',['νομίζων']],
  ['Ξέρξης','Jerjes',['Ξέρξην','Ξέρξου']],
  ['οἶκος','casa',['οἶκός']],
  ['οἰκέω','habitar',['οἰκοῦντες','ᾠκουν']],
  ['οἶνος','vino',['οἴνου']],
  ['Ὄλυμπος','Olimpo',['Ὀλύμπῳ']],
  ['ὅσπερ','el cual precisamente',['ὅνπερ','ὅπερ']],
  ['ὅποι','adonde',['ὅποι']],
  ['ὀργή','ira',['ὀργὴν']],
  ['οὐδείς','ninguno',['οὐδὲν']],
  ['παλαιότης','antigüedad',['παλαιότητι']],
  ['παρέχω','ofrecer',['παρεῖχον']],
  ['παραλαμβάνω','recibir',['παρέλαβε']],
  ['πατρίς','patria',['πατρίδι']],
  ['πένης','pobre',['πένητες']],
  ['παύω','hacer cesar',['πεπαύκαμεν']],
  ['πρωτεύω','ser el primero',['πεπρώτευκεν']],
  ['Περικλῆς','Pericles',['Περικλέους','Περικλῆ']],
  ['πλούσιος','rico',['πλουσίαν','πλουσίοι','πλουσίος','πλουσίου','πλουσίων']],
  ['ποῖος','de qué clase',['ποῖος']],
  ['πόσος','cuánto, cuántos',['πόσοι']],
  ['πότερος','cuál de los dos',['πότερος']],
  ['προσβάλλω','atacar',['προσβάλλοντες','προσέβαλλον']],
  ['προσεῖπον','dirigirse a, decir a',['προσεῖπε']],
  ['προσέρχομαι','acercarse',['προσήρχετο']],
  ['προτεραῖος','del día anterior',['προτεραίᾳ']],
  ['Πυθαγόρας','Pitágoras',['Πυθαγόρας']],
  ['ῥήτωρ','orador',['ῥήτωρες']],
  ['Σικελία','Sicilia',['Σικελία']],
  ['Σπάρτη','Esparta',['Σπάρτην']],
  ['σπουδαῖος','diligente, virtuoso',['σπουδαῖαι']],
  ['Σωκράτης','Sócrates',['Σωκράτη','Σωκράτους']],
  ['ταράττω','perturbar',['ταράττουσι']],
  ['οὗτος','este',['ταύτης']],
  ['θηρεύω','cazar',['τεθηρεύκασι']],
  ['τεῖχος','muralla',['τείχεσι']],
  ['τέκνον','hijo, niño',['τέκνα']],
  ['τελευτάω','terminar, morir',['τελευτήσαντος']],
  ['τήκω','derretirse',['τήκοντος']],
  ['τοξότης','arquero',['τοξόται']],
  ['ὑστεραῖος','del día siguiente',['ὑστεραίᾳ']],
  ['φίλος','amigo',['φίλαι']],
  ['φίλιος','amigable',['φίλιοις']],
  ['φοβερός','temible',['φοβερὸς']],
  ['φοβέω','temer',['φοβούμεθα','φοβοῦνται']],
  ['Χείρων','Quirón',['Χείρων']],
  ['ὦ','oh (vocativo)',['ὦ']],
  ['οὐδέ','ni, tampoco',['οὐδ']],
  ['ὅσπερ','el cual precisamente',['ἅπερ']],
  ['πυρεύω','encender, incendiar',['ἐπεπυρεύκεισαν','ἐπεπυρεύκεισαν','ἐπεπυρεύκεσαν','ἐπεπυρεύκεσαν']],
  ['τιμάω','honrar',['ἐτίμητο','ἐτιμητο']]
 ];
 for(const [lemma,meaning,forms] of secondPass)addIrregular(forms,lemma,meaning);


 // Revisión de las 49 grafías pendientes contrastadas con los textos UD1–14.
 const lastGreekPass=[
  ['ἤ','o; que (comparación)',['ἤ','ἢ']],
  ['μάχη','batalla',['μάχῃ','μάχῃ']],
  ['θάλαττα','mar',['θάλατταν','θαλάττῃ','θαλάττης']],
  ['σοφία','sabiduría',['σοφίαν','σοφίᾳ','σοφίας']],
  ['ψυχή','alma',['ψυχὰς','ψυχῇ','ψυχὴν']],
  ['πενία','pobreza',['πενίαν']],
  ['ἄλλος','otro, los demás',['ἄλλους','ἄλλων']],
  ['Ἀκρόπολις','Acrópolis',['ἀκροπόλει','ἀκρόπολιν']],
  ['αἰθήρ','cielo',['αἰθέρι']],
  ['Ἕλλην','griego',['Ἕλληνες','Ἕλληνας','Ἑλλήνων']],
  ['μήν','mes',['μήνες']],
  ['τύχη','suerte',['τύχης']],
  ['φύσις','naturaleza',['φύσει']],
  ['θέα','diosa',['θέᾳ','θεάν']]
 ];
 for(const [lemma,meaning,forms] of lastGreekPass)addIrregular(forms,lemma,meaning);

 addIrregular(['Ἀθηναῖοι','Ἀθηναίοις','Ἀθηναῖοις','Ἀθηναίων','Ἀθηναίων',
  'Ἀθηναίους','Ἀθηναίους','Ἀθηναῖος'],'Ἀθηναῖος','ateniense');
 return map;
}
const greekSpellingNotes={
 'εἴς':'εἰς (revisar acentuación de la preposición)',
 'θάλάττῃ':'θαλάττῃ (revisar acentuación)',
 'στρατεγός':'στρατηγός (falta η)',
 'στρατεγὸς':'στρατηγός (falta η)',
 'στρατεγοὶ':'στρατηγοί (falta η)',
 'oἱ':'οἱ (la o inicial es latina)',
 'Aἰσχύλος':'Αἰσχύλος (la A inicial es latina)',
 'ἄνρωπος':'ἄνθρωπος (falta θ)',
 'εἷχεν':'εἶχεν (revisar el espíritu)',
 'οἰκῦσιν':'οἰκοῦσιν (falta ο)',
 'σωτερίας':'σωτηρίας (falta η)',
 'ὠρᾶ':'ὁρᾷ (revisar forma y aumento)',
 'Περίκλους':'Περικλέους (revisar el genitivo)',
 'ἐφεύξεν':'φεύγω: revisar el tiempo; aoristo usual ἔφυγεν'
};
const vocabularyIndexCache=new WeakMap(),greekReferenceCache=new WeakMap();
function analyze(data,text,course,bank){
 const lang=course==='gr1'?'grc':'lat';
 let byCourse=vocabularyIndexCache.get(data);
 if(!byCourse){byCourse=new Map();vocabularyIndexCache.set(data,byCourse)}
 let index=byCourse.get(course);
 if(!index){
  index=new Map();
  for(const [lemma,surface,tags,source] of data.rows[lang]){
   if(!data.vocabulary[lang][lemma]?.[course])continue;
   const k=key(surface);if(!index.has(k))index.set(k,new Map());
   const candidates=index.get(k),old=candidates.get(lemma);
   const lexicalInvariable=source===3&&key(surface)===key(lemma)&&
    invariableEntry(data.vocabulary[lang][lemma][course].entry);
   const attested=[0,1,5,6,7].includes(source)||lexicalInvariable;
   const exactForms=old?.exactForms||new Set(),morphTags=old?.morphTags||new Set();
   if(lang==='grc')exactForms.add(surface.normalize('NFC'));
   morphTags.add(tags);
   candidates.set(lemma,{lemma,attested:attested||!!old?.attested,exactForms,morphTags});
  }
  byCourse.set(course,index);
 }
 let greek=null;
 if(lang==='grc'){
  if(!greekReferenceCache.has(bank))greekReferenceCache.set(bank,greekReferenceForms(bank));
  greek=greekReferenceCache.get(bank);
 }
 const bankIndex=new Map();
 const attach=(id,row)=>{if(!bankIndex.has(id))bankIndex.set(id,[]);bankIndex.get(id).push(row)};
 for(const row of bank){attach('E'+key(row.entry),row);attach('H'+key(head(row.entry)),row)}
 const tokens=new Map();
 const cleanText=lang==='grc'?String(text).replace(/([\p{L}\p{M}])[’'](?=[\p{L}\p{M}])/gu,'$1 '):String(text);
 let previous='';
 for(const match of cleanText.matchAll(/[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*/gu)){
  const form=match[0],normal=key(form);
  // En griego, τίς/τις, ὁ/ὅ o ἀλλά/ἄλλα no pueden confundirse.
  const identity=lang==='grc'?form.normalize('NFC'):normal;
  if(normal){
   if(!tokens.has(identity))tokens.set(identity,{normal,form,precededBy:new Set()});
   tokens.get(identity).precededBy.add(previous);
   previous=normal;
  }
 }
 return [...tokens.values()].map(({normal,form,precededBy})=>{
  const indexedCandidates=[...(index.get(normal)?.values()||[])].flatMap(c=>{
   const original=data.vocabulary[lang][c.lemma][course];
   const matches=[...new Set([...(bankIndex.get('E'+key(original.entry))||[]),
    ...(bankIndex.get('H'+key(c.lemma))||[])])];
   // Repetir una misma palabra en distintas UD con glosas ligeramente
   // distintas no constituye una ambigüedad MORFOLÓGICA. Conservamos la
   // entrada docente más completa, dando preferencia a la del índice.
   // Los homógrafos de lemas distintos siguen separados en `candidates`.
   const variants=matches.length?(lang==='lat'?[matches.slice().sort((a,b)=>{
    const score=x=>(x.entry===original.entry?100:0)+
     (x.meaning_va?6:0)+(x.entry.split(',').length*3);
    return score(b)-score(a);
   })[0]]:matches):[{entry:original.entry,meaning:''}];
   return variants.map(x=>({...c,entry:x.entry,meaning:x.meaning||'',meaning_va:x.meaning_va||''}));
  });
  const regular=lang==='lat'?(latinPresentForms(bank).get(normal)||[]):[];
  const directInvariable=lang==='lat'?(bankIndex.get('H'+normal)||[]).filter(x=>
   invariableEntry(x.entry)).map(x=>({
    lemma:normal,entry:x.entry,meaning:x.meaning||'',meaning_va:x.meaning_va||'',
    attested:true,origin:'invariable explícita del banco docente'
   })):[];
  const curated=lang==='lat'&&!directInvariable.length&&!indexedCandidates.length?
   (latinCore.get(normal)||[]):[];
  const supplement=greek?.get(normal)||[];
  // La normalización ayuda a encontrar formas; la grafía exacta con
  // diacríticos decide el lema cuando hay coincidencia documentada.
  const exactGreek=supplement.filter(x=>x.exactForms?.has(form.normalize('NFC')));
  const exactIndexed=lang==='grc'?indexedCandidates.filter(x=>x.exactForms?.has(form.normalize('NFC'))):[];
  const regularLemmas=new Set(regular.map(candidate=>candidate.lemma));
  const all=exactGreek.length?exactGreek:
   [...(exactIndexed.length?exactIndexed:indexedCandidates).filter(x=>
    !(supplement.length&&!x.attested&&!x.meaning)&&
    !(regularLemmas.has(x.lemma)&&!x.attested)),
    ...supplement,...directInvariable,...curated,...regular];
  // Preferimos la evidencia más firme para la misma entrada, sin descartar
  // una segunda lectura posible de un homógrafo.
  const compact=new Map();
  for(const candidate of all){
   const id=candidate.lemma+'|'+candidate.entry+'|'+candidate.meaning;
   const previous=compact.get(id);
   if(!previous||(!previous.attested&&candidate.attested))compact.set(id,candidate);
  }
  let candidates=[...compact.values()];
  // Distinguir artículos de relativos de idéntica grafía sin acentos.
  if(lang==='grc'&&['ο','η','το'].includes(normal)){
   const accents={ο:['ὁ'],η:['ἡ'],το:['τὸ','τό']};
   if(!accents[normal].includes(form.normalize('NFC')))
    candidates=candidates.filter(x=>!x.entry.startsWith('ὁ, ἡ, τό'));
  }
  // Preposiciones y adverbios con grafía acentuada inequívoca:
  // al suprimir diacríticos, εἰς/εἷς y ἐν/ἕν no deben confundirse.
  if(lang==='grc'){
   const spelled=form.normalize('NFC');
   const fixed={
    'εἰς':'εἰς','ἐν':'ἐν','ἐκ':'ἐκ','οὐ':'οὐ','οὐκ':'οὐ','ἀπὸ':'ἀπό',
    'διὰ':'διά','σὺν':'σύν','ἄνευ':'ἄνευ','περὶ':'περί'
   };
   if(Object.prototype.hasOwnProperty.call(fixed,spelled)){
    const wanted=key(fixed[spelled]);
    const distinct=candidates.filter(x=>x.origin==='paradigma gramatical explícito' &&
     key(head(x.entry))===wanted);
    if(distinct.length)candidates=distinct;
   }
   // τίς (interrogativo) frente a τις (indefinido); ambas entradas
   // conservan su lema y traducción original.
   const interrogative=['τίς','τίς','τί','τί','τίνα','τίνα','τίνος','τίνος','τίνι','τίνι',
    'τίνες','τίνες','τίνας','τίνας','τίσι','τίσιν','τίσιν'];
   const indefinite=['τις','τι','τινά','τινὰ','τινάς','τινὰς','τινός','τινὸς',
    'τινί','τινὶ','τινές','τινὲς','τισι','τισιν'];
   if(interrogative.includes(spelled))candidates=candidates.filter(x=>head(x.entry).normalize('NFC')==='τίς');
   else if(indefinite.includes(spelled))candidates=candidates.filter(x=>head(x.entry).normalize('NFC')==='τις');
  }
  // 'ἀλλὰ' (conjunción) frente a 'ἄλλα' (neutro plural) son
  // grafías diferentes a pesar de la normalización sin acentos.
  if(lang==='grc'&&normal==='ο'&&form.normalize('NFC')==='ὁ')
   candidates=candidates.filter(x=>x.entry.startsWith('ὁ, ἡ, τό'));
  if(lang==='grc'&&normal==='η'&&form.normalize('NFC')==='ἡ')
   candidates=candidates.filter(x=>x.entry.startsWith('ὁ, ἡ, τό'));
  // El plural del artículo (οἱ, αἱ) no debe confundirse con el relativo
  // (οἵ, αἵ): la acentuación del original conserva esa distinción.
  if(lang==='grc'&&(['οι','αι'].includes(normal))){
   const written=form.normalize('NFC');
   if(['οἱ','αἱ'].includes(written))candidates=candidates.filter(x=>x.entry.startsWith('ὁ, ἡ, τό'));
   else if(['οἵ','αἵ'].includes(written))candidates=candidates.filter(x=>!x.entry.startsWith('ὁ, ἡ, τό'));
  }
  if(lang==='grc'&&normal==='αλλα'){
   if(/ἀλλ[άὰ]/u.test(form))candidates=candidates.filter(x=>x.lemma==='αλλα');
   else if(/ἄλλα/u.test(form))candidates=candidates.filter(x=>x.lemma!=='αλλα');
  }
  // Una preposición que rige exclusivamente ablativo permite descartar
  // un homógrafo verbal incompatible si TODOS los usos del texto comparten
  // ese contexto. Ej.: «de vita» (vita, abl.) frente a «vita!» (imperativo).
  // No se aplica a in/cum ni a preposiciones de doble régimen.
  if(lang==='lat'&&candidates.length>1&&precededBy?.size&&
   [...precededBy].every(x=>['a','ab','abs','de','e','ex','sine','prae','pro'].includes(x))){
   const abl=candidates.filter(candidate=>
    [...(candidate.morphTags||[])].some(t=>/^(?:N|ADJ|PRO);(?:[^;]+;)*ABL(?:;|$)/.test(t)));
   if(abl.length===1&&abl[0].attested)candidates=abl;
  }
  const resolved=candidates.length===1&&candidates[0].attested;
  const spellingHint=lang==='grc'?Object.entries(greekSpellingNotes)
   .find(([sample])=>sample.normalize('NFC')===form.normalize('NFC'))?.[1]:undefined;
  // Señalar erratas: proponer una corrección no equivale a lematizarla.
  const requiresSpellingReview=!!spellingHint;
  return {form,candidates,status:requiresSpellingReview?'review':resolved?'documented':candidates.length?'review':'unknown',
   warning:requiresSpellingReview?'Posible errata: '+spellingHint:'',
   lemma:resolved&&!requiresSpellingReview?candidates[0].lemma:'',
   entry:resolved&&!requiresSpellingReview?candidates[0].entry:form,
   meaning:resolved&&!requiresSpellingReview?candidates[0].meaning:'',
   meaning_va:resolved&&!requiresSpellingReview?(candidates[0].meaning_va||''):''};
 });
}
function entries(rows){
 const seen=new Set();return rows.filter(r=>{
  const id=r.status==='manual'||r.status==='documented'?key(r.lemma||head(r.entry))+'|'+r.entry+'|'+r.meaning:'?'+r.form;
  if(seen.has(id))return false;seen.add(id);return true;
 }).sort((a,b)=>key(a.entry).localeCompare(key(b.entry),'el'));
}
function displayEntry(entry,mode){
 if(mode!=='simple')return entry;
 // Only shorten explicitly labelled Latin verbs. Never synthesize missing themes.
 const m=entry.match(/\((?:[1-4]ª|mx\.|irr\.)\)/);
 return m?head(entry)+' '+m[0]:entry;
}
// Formato filológico de la exportación, sin alterar la base ni el JSON.
// Traducción de un único lema griego: comillas simples. Locuciones con
// varias palabras griegas (μέν… δέ): comillas dobles.
function formatVocabularyEntry(row,mode,course,language='es'){
 let entry=displayEntry(row.entry,mode);
 if(course==='gr1'){
  const raw=entry.trim();
  // Etiquetas gramaticales para invariables no etiquetadas en la fuente.
  const types={
   'καί':'conj.','καί':'conj.','τε':'part.','δέ':'part.',
   'μέν':'part.','μὲν':'part.','δὲ':'part.',
   'ὅτι':'conj.','ὦ':'interj.','οὐ':'adv.',
   'οὐκ':'adv.','οὐχ':'adv.','εἰς':'prep.',
   'ἐν':'prep.','ἐκ':'prep.','ἐξ':'prep.',
   'κακῶς':'adv.','καλῶς':'adv.',
   'οὐ μόνον ἀλλὰ καὶ':'loc. conj.'
  };
  if(!/\((?:adv\.|conj\.|part\.|prep\.|interj\.|loc\.)/.test(raw)){
   const type=types[raw.normalize('NFC')];
   if(type)entry+=' ('+type+')';
  }
 }
 const localized=window.ExaminaValencianGloss?.forEntry(row,language);
 const translated=localized?localized.value:row.meaning;
 if(!translated)return entry;
 const meaning=String(translated).trim().replace(/^[‘’'"]+|[‘’'"]+$/g,'');
 const pieces=meaning.split(/[’']\s*,\s*[‘']/).map(x=>x.trim()).filter(Boolean);
 const lemmaPart=head(entry);
 const phrase=(/\s|…/u.test(lemmaPart)&&!/\s+o\s+/i.test(lemmaPart)) &&
  !/^(?:ὁ,\s*ἡ|οὐ,\s*οὐκ)/u.test(entry);
 const quote=phrase?'"':"'";
 const quoted=window.ExaminaValencianGloss?.quoteGloss(meaning)||
  (phrase?quote+pieces.join(', ')+quote:pieces.map(x=>"'"+x+"'").join(', '));
 return entry+': '+quoted;
}
function documentXml(project){
 const unanalysed=project.units.slice(0,project.count).filter(u=>u.text?.trim()&&!u.analyzed&&!u.rows?.length);
 if(unanalysed.length)throw Error('Quedan '+unanalysed.length+' unidades con texto sin analizar.');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const run=(value,{bold=false,italic=false,smallCaps=false,size=21}={})=>
  '<w:r><w:rPr>'+(bold?'<w:b/>':'')+(italic?'<w:i/>':'')+
  (smallCaps?'<w:smallCaps/>':'')+
  '<w:rFonts w:ascii="Palatino Linotype" w:hAnsi="Palatino Linotype" w:cs="Palatino Linotype"/>'+
  '<w:sz w:val="'+size+'"/><w:szCs w:val="'+size+'"/></w:rPr>'+
  '<w:t xml:space="preserve">'+escape(value)+'</w:t></w:r>';
 const paragraph=(runs,{heading=false,title=false}={})=>
  '<w:p><w:pPr>'+(title?
  '<w:keepNext/><w:keepLines/><w:jc w:val="center"/><w:spacing w:before="0" w:after="240"/>'+
  // Bordes de medio punto: w:sz se expresa en octavos de punto.
  '<w:ind w:left="160" w:right="160"/><w:pBdr>'+
  ['top','left','bottom','right'].map(side=>'<w:'+side+' w:val="single" w:sz="4" w:space="8" w:color="404A56"/>').join('')+
  '</w:pBdr>':
  heading?'<w:keepNext/><w:keepLines/><w:spacing w:before="180" w:after="90"/>':
  '<w:keepLines/><w:spacing w:after="45"/>')+
  '</w:pPr>'+runs+'</w:p>';
 const p=(value,bold=false)=>paragraph(run(value,{bold}),{heading:bold});
 const titleNames={lat1:'Latín I',lat4:'Latín 4.º ESO',gr1:'Griego I'};
 const title='Vocabulario por unidades de '+(titleNames[project.course]||project.course||'la asignatura');
 const titleParagraph=paragraph(run(title,{bold:true,smallCaps:true,size:28}),{title:true});
 const isLatin=project.course!=='gr1';
 const line=(row,unit)=>{
  const pending=!['manual','documented'].includes(row.status);
  const formatted=formatVocabularyEntry(row,unit.mode,project.course,project.lang||'es');
  if(!isLatin)return paragraph(run((pending?'* ':'')+formatted));
  const italicEntry=displayEntry(row.entry,unit.mode);
  if(formatted.startsWith(italicEntry)){
   const suffix=formatted.slice(italicEntry.length);
   return paragraph((pending?run('* '):'')+run(italicEntry,{italic:true})+run(suffix));
  }
  return paragraph(run((pending?'* ':'')+formatted));
 };
 // A4, márgenes de 2,5 cm y una columna en todo el documento.
 const layout='<w:pgSz w:w="11906" w:h="16838"/>'+
  '<w:pgMar w:top="1417" w:bottom="1417" w:left="1417" w:right="1417"/>'+
  '<w:cols w:num="1" w:space="0"/>';
 const units=project.units.slice(0,project.count);
 const body=units.map(u=>{
  const all=entries(u.rows||[]),pending=all.filter(r=>!['manual','documented'].includes(r.status));
  return p(u.title,true)+all.filter(r=>['manual','documented'].includes(r.status)).map(r=>line(r,u)).join('')+
   (pending.length?p(project.lang==='va'?'Pendents de revisió (*)':'Pendientes de revisión (*)',true)+pending.map(r=>line(r,u)).join(''):'');
 }).join('');
 return '<?xml version="1.0" encoding="UTF-8"?>'+
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+
  titleParagraph+body+'<w:sectPr>'+layout+'</w:sectPr></w:body></w:document>';
}
window.ExaminaVocabulary={analyze,entries,displayEntry,formatVocabularyEntry,documentXml};
function init(){
 const $=id=>document.getElementById(id),storage='examina_vocabulary_project_v1';
 let project={count:1,course:'lat1',lang:'es',units:[]},selected=0;
 try{const saved=JSON.parse(localStorage.getItem(storage));if(saved?.units&&Number.isInteger(saved.count)&&saved.count>=1&&saved.count<=100&&['lat1','lat4','gr1'].includes(saved.course))project=saved}catch{}
 if(!['es','va'].includes(project.lang))project.lang='es';
 const unit=()=>{while(project.units.length<project.count)project.units.push({title:'UD'+(project.units.length+1),text:'',mode:'complete',rows:[],analyzed:false});return project.units[selected]};
 const needsAnalysis=u=>!!u.text?.trim()&&!(u.analyzed||u.rows?.length);
 const status=s=>{$('vgStatus').textContent=s};
 const save=()=>{try{localStorage.setItem(storage,JSON.stringify(project))}catch{status('No se pudo guardar en este navegador. Exporta una copia JSON.')}};

 let qualitySnapshot=null;
 function showQualityQueue(){
  const summary=$('vgQualityQueueSummary'),target=$('vgQualityQueue');
  target.replaceChildren();
  if(!qualitySnapshot){summary.textContent='Auditoría sin cargar.';return}
  const selected=$('vgReviewUnit').value;
  const all=qualitySnapshot.reviewQueue.filter(x=>!selected||x.unit===selected);
  summary.textContent=all.length+' fichas requieren contraste o ampliación de formas; se muestran las primeras 30. No se aceptan automáticamente.';
  for(const item of all.slice(0,30)){
   const line=document.createElement('p');
   line.style.cssText='margin:5px 0;padding:5px 8px;border-bottom:1px solid #d4dce7';
   line.textContent=item.unit+' · '+item.entry+' · '+item.reason+
    (item.missingSpanish?' · sin castellano':'')+(item.missingValencian?' · sin valenciano':'');
   target.append(line);
  }
 }
 async function refreshQuality(){
  const sourceCourse=project.course;
  const area=$('vgQualityTotals');area.textContent='Auditando el índice morfológico local…';
  try{
   const data=await linguistic().load();
   if(sourceCourse!==project.course)return;
   const audit=window.ExaminaVocabularyQuality?.audit;
   if(typeof audit!=='function')throw Error('No se ha cargado el módulo de auditoría.');
   qualitySnapshot=audit(data,vocab,sourceCourse,window.ExaminaValencianGloss);
   const t=qualitySnapshot.totals,locale=project.lang==='va';
   area.textContent=(locale?'Fitxes: ':'Fichas: ')+t.rows+
    ' · '+(locale?'amb alguna forma contrastada: ':'con alguna forma contrastada: ')+t.documented+
    ' · '+(locale?'només candidates: ':'solo candidatas: ')+t.proposalsOnly+
    ' · '+(locale?'sense equivalència segura: ':'sin equivalencia segura: ')+t.noIndex+
    ' · '+(locale?'dobles en la mateixa unitat: ':'repetidas en la misma unidad: ')+t.duplicateRows+
    ' · '+(locale?'conflictes de significat: ':'conflictos de significado: ')+t.meaningConflicts+'.';
   const target=$('vgQualityRows');target.replaceChildren();
   for(const u of qualitySnapshot.units){
    const tr=document.createElement('tr');
    for(const value of [u.unit,u.rows,u.documented+' ('+u.coverage+' %)',u.proposalsOnly,
      u.citationsOnly+u.noIndex,u.spanishMissing+' / '+u.valencianMissing]){
     const cell=document.createElement('td');cell.textContent=String(value);tr.append(cell);
    }
    target.append(tr);
   }
   const control=$('vgReviewUnit'),was=control.value;
   control.replaceChildren(new Option(locale?'Totes les unitats':'Todas las unidades',''),
    ...qualitySnapshot.units.map(u=>new Option(u.unit,u.unit)));
   control.value=qualitySnapshot.units.some(u=>u.unit===was)?was:'';
   showQualityQueue();
  }catch(e){qualitySnapshot=null;area.textContent='No se ha podido auditar el banco: '+e.message}
 }
 $('vgQualityRefresh').onclick=refreshQuality;
 $('vgReviewUnit').onchange=showQualityQueue;
 $('vgQualityExport').onclick=()=>{
  if(!qualitySnapshot){status('Actualiza primero la auditoría.');return}
  downloadBlob('auditoria-vocabulario-'+project.course+'.json',
   new Blob([JSON.stringify(qualitySnapshot,null,2)],{type:'application/json'}));
 };
 $('vgReviewExport').onclick=()=>{
  if(!qualitySnapshot){status('Actualiza primero la auditoría.');return}
  downloadBlob('revision-vocabulario-'+project.course+'.json',
   new Blob([JSON.stringify({schema:1,course:project.course,verifiedAutomatically:false,
    items:qualitySnapshot.reviewQueue},null,2)],{type:'application/json'}));
 };
 function render(){
  unit();$('vgCount').value=project.count;$('vgCourse').value=project.course;$('vgLang').value=project.lang||'es';
  $('vgUnit').replaceChildren(...project.units.slice(0,project.count).map((u,i)=>new Option(u.title,i,false,i===selected)));
  $('vgTitle').value=unit().title;$('vgText').value=unit().text;$('vgMode').value=unit().mode;
  const target=$('vgResults');target.replaceChildren();
  for(const r of entries(unit().rows)){
   const box=document.createElement('div');box.style.cssText='padding:10px 0;border-bottom:1px solid #ccd7e6';
   const states=project.lang==='va'?{documented:'Forma documentada',manual:'Revisat manualment',review:'* Ambigua o candidata sense verificar',unknown:'* Desconeguda'}:{documented:'Forma documentada',manual:'Revisado manualmente',review:'* Ambigua o candidata sin verificar',unknown:'* Desconocida'};
   const label=document.createElement('p');label.textContent=r.form+' · '+(r.warning||states[r.status]);box.append(label);
   if(r.candidates.length&&r.status!=='documented'){
    const select=document.createElement('select');select.append(new Option('Elegir una entrada documentada o candidata…',''));
    r.candidates.forEach((c,i)=>{const candidateGloss=window.ExaminaValencianGloss?.forEntry(c,project.lang)?.value||c.meaning;select.append(new Option(c.entry+' — '+candidateGloss+(c.attested?'':' [sin verificar]'),i))});
    select.onchange=()=>{if(select.value==='')return;const c=r.candidates[Number(select.value)];Object.assign(r,{lemma:c.lemma,entry:c.entry,meaning:c.meaning,status:'manual'});save();render()};box.append(select);
   }
   for(const [field,name] of [['entry','Enunciado'],[project.lang==='va'?'meaning_va':'meaning',project.lang==='va'?'Traducció':'Traducción']]){
    const lab=document.createElement('label');lab.textContent=name;const input=document.createElement('input');input.value=field==='meaning_va'?(window.ExaminaValencianGloss?.forEntry(r,'va')?.value||r.meaning_va||''):(r[field]||'');input.onchange=()=>{r[field]=input.value;r.lemma=head(r.entry);r.status='manual';save();render()};lab.append(input);box.append(lab);
   }
   const preview=document.createElement('p');preview.textContent=(project.lang==='va'?'Vista d’exportació: ':'Vista de exportación: ')+formatVocabularyEntry(r,unit().mode,project.course,project.lang);box.append(preview);target.append(box);
  }
  window.ExaminaValencianGloss?.translateDom?.($('vocabularyGenerator'),project.lang);
 }
 $('vgCount').onchange=()=>{const n=Number($('vgCount').value);if(!Number.isInteger(n)||n<1||n>100){status('Elige entre 1 y 100 unidades.');return}project.count=n;selected=Math.min(selected,n-1);render();save()};
 $('vgUnit').onchange=()=>{selected=Number($('vgUnit').value);render()};
 $('vgLang').onchange=()=>{project.lang=$('vgLang').value;render();save()};
 $('vgCourse').onchange=()=>{project.course=$('vgCourse').value;qualitySnapshot=null;project.units.forEach(u=>{u.rows=[];u.analyzed=false});save();render();status('Banco cambiado. Vuelve a analizar los textos.');refreshQuality()};
 for(const [id,field] of [['vgTitle','title'],['vgText','text'],['vgMode','mode']])$(id).oninput=()=>{unit()[field]=$(id).value;if(field==='text'){unit().rows=[];unit().analyzed=false;status('Texto modificado. Analiza la unidad antes de exportar.')}save();if(field==='mode')render()};
 async function analyzeUnits(mode){
  const button=$('vgAnalyze'),buttonAll=$('vgAnalyzeAll'),word=$('vgWord');
  button.disabled=true;buttonAll.disabled=true;word.disabled=true;status('Analizando…');
  try{
   const targets=mode==='missing'?project.units.slice(0,project.count).filter(needsAnalysis)
    :mode==='all'?project.units.slice(0,project.count):[unit()];
   if(!targets.length)return true;
   const data=await linguistic().load();
   const course={lat1:'latin1',lat4:'latin4',gr1:'greek1'}[project.course];
   const bank=vocab.filter(x=>courseOf(x)===course);
   for(const u of targets){u.rows=analyze(data,u.text,project.course,bank);u.analyzed=true}
   save();render();
   const distinct=targets.reduce((n,u)=>n+u.rows.length,0);
   const pending=targets.reduce((n,u)=>n+u.rows.filter(r=>r.status!=='documented').length,0);
   status(targets.length+' unidad(es) analizada(s). '+distinct+' formas distintas. '+pending+' pendientes de revisión. Textos conservados.');
   return true;
  }catch(e){status('No se pudo analizar: '+e.message);return false}
  finally{button.disabled=false;buttonAll.disabled=false;word.disabled=false}
 }
 $('vgAnalyze').onclick=()=>analyzeUnits('current');
 $('vgAnalyzeAll').onclick=()=>analyzeUnits('all');
 $('vgBackup').onclick=()=>downloadBlob('vocabulario-unidades.json',new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));
 $('vgWord').onclick=async()=>{
  const missing=project.units.slice(0,project.count).filter(needsAnalysis);
  if(missing.length){
   status('Hay '+missing.length+' unidad(es) sin analizar. Analizando antes de descargar el Word…');
   if(!await analyzeUnits('missing'))return;
  }
  try{
   const xml=documentXml(project);
   downloadBlob('vocabulario-unidades.docx',zip([
    ['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml',xml]
   ]));
   status('Word generado con '+project.count+' unidades. Revisa las formas marcadas con * antes de utilizarlo.');
  }catch(e){status('No se ha exportado el Word: '+e.message)}
 };
 $('vgImport').onchange=async e=>{try{const p=JSON.parse(await e.target.files[0].text());if(!Number.isInteger(p.count)||p.count<1||p.count>100||!['lat1','lat4','gr1'].includes(p.course)||!Array.isArray(p.units)||p.units.length<p.count||!p.units.every(u=>typeof u.title==='string'&&typeof u.text==='string'&&['simple','complete'].includes(u.mode)&&Array.isArray(u.rows)&&u.rows.every(r=>typeof r.entry==='string'&&typeof r.meaning==='string'&&typeof r.form==='string'&&Array.isArray(r.candidates))))throw Error('Formato incorrecto');project=p;project.lang=['es','va'].includes(p.lang)?p.lang:'es';selected=0;render();save();const pending=project.units.slice(0,project.count).filter(needsAnalysis).length;status('Proyecto importado: '+project.count+' unidades y textos conservados. '+pending+' por analizar. Puedes pulsar «Analizar todas las unidades» o «Exportar Word» (analizará las pendientes).')}catch(e){status('No se pudo importar: '+e.message)}};
 $('vgShow').onclick=()=>{$('examLayout').style.display='none';$('vocabManager').classList.remove('active');$('vocabularyGenerator').classList.add('active');for(const id of ['vmShowExam','vmShowList'])$(id).classList.remove('active');$('vgShow').classList.add('active');render();refreshQuality()};
 for(const id of ['vmShowExam','vmShowList'])$(id).addEventListener('click',()=>{$('vocabularyGenerator').classList.remove('active');$('vgShow').classList.remove('active')});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
