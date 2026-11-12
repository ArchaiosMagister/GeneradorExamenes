/* Independent text-to-vocabulary engine. No inferred paradigms or translations. */
(function(){
'use strict';
const linguistic=()=>window.ExaminaOfflineLemmatizer;
const key=s=>linguistic().normalize(s);
const latinKey=s=>key(s).replace(/v/g,'u'); // u/v gráficas, sin cambiar los enunciados.
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
 [['male'],'male (adv.)','mal','mal'],
 [['dum'],'dum (conj.)','mientras, hasta que','mentre, fins que'],
 [['at'],'at (conj.)','pero, en cambio','però, en canvi'],
 [['statim'],'statim (adv.)','inmediatamente','immediatament'],
 [['illic'],'illic (adv.)','allí','allí'],
 [['longe'],'longe (adv.)','lejos','lluny'],
 [['itaque'],'itaque (conj.)','así pues, por tanto','per tant'],
 [['denique'],'denique (adv.)','finalmente, en suma','finalment, en suma'],
 [['namque'],'namque (conj.)','pues, en efecto','perquè, en efecte'],
 [['utique'],'utique (adv.)','en todo caso, ciertamente','en tot cas, certament'],
 [['ubique'],'ubique (adv.)','en todas partes','pertot arreu'],
 [['undique'],'undique (adv.)','de todas partes','de tot arreu'],
 [['usque'],'usque (adv.)','hasta, continuamente','fins a, contínuament'],
 [['absque'],'absque (prep. + abl.)','sin, lejos de','sense, lluny de'],
 [['ubicumque'],'ubicumque (adv.)','dondequiera que','allà on siga'],
 [['quandocumque'],'quandocumque (adv.)','cuandoquiera que','quan siga'],
 [['quandoque'],'quandoque (adv.)','alguna vez, cuandoquiera que','alguna vegada, quan siga'],
 [['numquam','nunquam'],'numquam (adv.)','nunca','mai'],
 [['modo'],'modo (adv.)','solamente, hace poco, ahora','solament, fa poc, ara']
];
const latinCore=new Map();
for(const [forms,entry,meaning,meaning_va] of latinInvariables){
 const lemma=latinKey(forms[0]);
 for(const surface of forms){
  const k=latinKey(surface);
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
   const form=latinKey(stem+ending);
   if(!byForm.has(form))byForm.set(form,new Map());
   const candidates=byForm.get(form),old=candidates.get(record.lemma);
   if(!old||score(record)>score(old))candidates.set(record.lemma,record);
  }
 }
 const result=new Map([...byForm].map(([k,values])=>[k,[...values.values()]]));
 latinPresentCache.set(bank,result);
 return result;
}



/* Reconocimiento de formas latinas escolares por PARADIGMAS DECLARADOS.
 * No modifica el índice de flexiones contrastadas, no genera solucionarios
 * y no aplica los modelos a verbos con enunciados insuficientes.
 * Cada propuesta conserva exactamente el enunciado y la glosa docentes;
 * una homografía entre lemas distintos sigue necesitando revisión.
 */
// -que coordinante es productivo, pero el mismo segmento puede ser parte
// inseparable de un pronombre compuesto o de un adverbio/conjunción.
 // No descomponer nunca un lexema completo reconocido por su paradigma.
const latinLexicalQueWords=new Set([
 'quoque','neque','atque','itaque','denique','namque','utique','ubique',
 'undique','usque','absque','quandoque','quaque','quaeque',
 // Pronombres compuestos: los casos oblicuos también son unidades léxicas.
 'quisque','quidque','quodque','quique','cuiusque','cuique','quemque',
 'quamque','quosque','quasque','quorumque','quarumque','quibusque',
 'uterque','utraque','utrumque','utriusque','utrique','utrumque',
 'utramque','utroque','utraque','utrorumque','utrarumque',
 'utrisque','utrosque','utrasque',
 'quicumque','quaecumque','quodcumque','cuiuscumque','cuicumque',
 'quemcumque','quamcumque','quocumque','quacumque','quibuscumque',
 'quorumcumque','quarumcumque','quoscumque','quascumque',
 'ubicumque','undecumque','quandocumque','qualiscumque',
 'quantuscumque'
].map(latinKey));
// Las sospechas ortográficas no son pruebas de que la palabra sea errónea.
// El docente decide con la frase original: no se sustituye el token ni el lema.
const latinContextNotes={
 'auarus':'puede ser avarus, –a, –um («avaro») o un nombre propio; consultar la oración',
 'medicum':'puede ser medicus, –i (m., «médico») o medicus, –a, –um (adjetivo); consultar la oración',
 'commiserat':'el banco propone commito y committo para el mismo tema commis-; contrastar la grafía de la ficha',
 'commiserunt':'el banco propone commito y committo para el mismo tema commis-; contrastar la grafía de la ficha',
 'commisit':'el banco propone commito y committo para el mismo tema commis-; contrastar la grafía de la ficha',
 'teneros':'coexisten los enunciados tenerus, –a, –um y tener, tenera, tenerum; revisar si son variantes de una sola ficha',
 'solis':'coexisten las fichas sol, solis y solis, –is; contrastar si la segunda es un duplicado editorial'
};
const latinSpellingNotes={
 'clasis':'comprobar classis, –is (f.), si se refiere a «flota» o «clase»',
 'consilo':'comprobar consilio (de consilium, –i), según el contexto',
 'pasuum':'comprobar passuum (genitivo plural de passus, –us)',
 'nonulli':'comprobar nonnulli (de nonnullus, –a, –um)',
 'propinquiis':'comprobar propinquis (de propinquus, –a, –um)',
 'templos':'comprobar templa si el sustantivo es templum, –i (n.); exige contexto',
 'c':'inicial o abreviatura, no lema autónomo; consultar la oración',
 'm':'inicial, cifra o abreviatura, no lema autónomo; consultar la oración',
 't':'inicial o abreviatura, no lema autónomo; consultar la oración'
};
const latinExpandedCache=new WeakMap();
function latinExpandedForms(bank){
 if(latinExpandedCache.has(bank))return latinExpandedCache.get(bank);
 const forms=new Map();
 const add=(form,record)=>{
  const k=latinKey(form);
  if(!k||!/^[a-z]+$/.test(k))return;
  if(!forms.has(k))forms.set(k,new Map());
  const stored=forms.get(k),existing=stored.get(record.lemma);
  const score=r=>(r.entry.split(',').length*8)+(r.entry.length/100);
  if(!existing||score(record)>score(existing))stored.set(record.lemma,record);
 };
 const addMany=(stem,ends,record)=>{for(const end of ends)add(stem+end,record)};
 const decl12=(stem,record,kind='all')=>{
  // Sólo terminaciones de primera/segunda y concordancia transparente.
  if(kind==='all'||kind==='m')addMany(stem,['us','i','o','um','e','orum','is','os'],record);
  if(kind==='all'||kind==='f')addMany(stem,['a','ae','am','arum','is','as'],record);
  if(kind==='all'||kind==='n')addMany(stem,['um','i','o','a','orum','is'],record);
 };
 // Formas pronominales lexicalizadas: -que NO es la conjunción copulativa.
 // No se infieren otras flexiones a partir de los tres últimos caracteres.
 const lexicalCompounds=[
  {head:'quisque',entry:'quisque, quaeque, quidque (pron. indef.)',
   meaning:'cada uno/a, cada cual',forms:[
    'quisque','quique','quaeque','quidque','quodque','cuiusque','cuique',
    'quemque','quamque','quaque','quosque','quasque',
    'quorumque','quarumque','quibusque']},
  {head:'uterque',entry:'uterque, utraque, utrumque (pron. indef.)',
   meaning:'uno y otro, ambos',forms:[
    'uterque','utraque','utrumque','utriusque','utrique','utroque',
    'utramque','utrosque','utrasque','utrorumque','utrarumque','utrisque']},
  {head:'quicumque',entry:'quicumque, quaecumque, quodcumque (pron. rel. indef.)',
   meaning:'cualquiera que, quienquiera que',forms:[
    'quicumque','quaecumque','quodcumque','cuiuscumque','cuicumque',
    'quemcumque','quamcumque','quocumque','quacumque','quorumcumque',
    'quarumcumque','quibuscumque','quoscumque','quascumque']}
 ];
 for(const compound of lexicalCompounds){
  const teacher=bank.find(r=>latinKey(head(r.entry))===latinKey(compound.head));
  const record={lemma:latinKey(compound.head),entry:teacher?.entry||compound.entry,
   meaning:teacher?.meaning||compound.meaning,meaning_va:teacher?.meaning_va||'',
   attested:true,origin:'paradigma pronominal compuesto, -que inseparable'};
  for(const surface of compound.forms)add(surface,record);
 }
 // Paradigmas pronominales cerrados: no se infieren a partir de sufijos.
 const personal=[
  [['ego','mei','mihi','me','nos','nostri','nostrum','nobis'],
    'ego, mei (pron. pers.)','yo','jo'],
  [['tu','tui','tibi','te','vos','vestri','vestrum','vobis'],
    'tu, tui (pron. pers.)','tú','tu'],
  [['se','sui','sibi','sese'],
    'sui, sibi, se (pron. refl.)','sí, se','si, es'],
  [['is','ea','id','eius','ei','eum','eam','eo','ii','i','eae','eorum','earum','eis','iis','eos','eas'],
    'is, ea, id (pron.)','él, ella, ello','ell, ella, això'],
  [['hic','haec','hoc','huius','huic','hunc','hanc','hac','hi','hae','horum','harum','his','hos','has'],
    'hic, haec, hoc (pron. dem.)','este, esta, esto','este, esta, açò'],
  [['ille','illa','illud','illius','illi','illum','illam','illo','illae','illorum','illarum','illis','illos','illas'],
    'ille, illa, illud (pron. dem.)','aquel, aquella, aquello','aquell, aquella, allò'],
  [['iste','ista','istud','istius','isti','istum','istam','isto','istae','istorum','istarum','istis','istos','istas'],
    'iste, ista, istud (pron. dem.)','ese, esa, eso','eixe, eixa, això'],
  [['ipse','ipsa','ipsum','ipsius','ipsi','ipsum','ipsam','ipso','ipsorum','ipsarum','ipsis','ipsos','ipsas'],
    'ipse, ipsa, ipsum (pron.)','mismo, propio','mateix, propi'],
  [['qui','quae','quod','cuius','cui','quem','quam','quo','qua','quos','quas','quorum','quarum','quibus'],
    'qui, quae, quod (pron. rel.)','que, el cual','que, el qual']
 ];
 for(const [surfaces,entry,meaning,meaning_va] of personal){
  const lemma=latinKey(surfaces[0]),record={lemma,entry,meaning,meaning_va,attested:true,
   origin:'paradigma pronominal explícito de gramática escolar (no índice verificado)'};
  for(const form of surfaces)add(form,record);
 }
 const supplementary=[
  ['meus, –a, –um','mío/a','meu/meua'],
  ['tuus, –a, –um','tuyo/a','teu/teua'],
  ['suus, –a, –um','suyo/a','seu/seua'],
  ['noster, nostra, nostrum','nuestro/a','nostre/nostra'],
  ['vester, vestra, vestrum','vuestro/a','vostre/vostra'],
  ['altus, –a, –um','alto/a','alt/alta'],
  ['humanus, –a, –um','humano/a','humà/humana'],
  // Lemas frecuentes ausentes de la selección docente; no sobrescribir glosas presentes.
  ['stilus, –i','punzón para escribir','punxó per a escriure'],
  ['aula, –æ','patio, aula','pati, aula'],
  ['tabula, –æ','tabla','taula'],
  ['Priscus, –i','Prisco','Prisc'],
  ['Atalanta, –æ','Atalanta','Atalanta'],
  ['Numa, –æ','Numa','Numa'],
  ['Sulpicia, –æ','Sulpicia','Sulpícia'],
  ['Romulus, –i','Rómulo','Ròmul'],
  ['Britannia, –æ','Britania','Britània'],
  ['Lydia, –æ','Lidia','Lídia'],
  ['Helena, –æ','Helena','Helena'],
  ['Socrates, –is','Sócrates','Sòcrates'],
  ['Thales, –is','Tales','Tales'],
  ['Alpes, Alpium (f. pl.)','los Alpes','els Alps'],
  ['Iuppiter, Iovis (m.)','Júpiter','Júpiter'],
  ['causa, –æ','causa','causa'],
  ['luna, –æ','luna','lluna'],
  ['culpa, –æ','culpa','culpa'],
  ['poena, –æ','pena, castigo','pena, càstig'],
  ['cibus, –i','alimento','aliment'],
  ['signum, –i','señal, estandarte','senyal, estendard'],
  ['agmen, agminis (n.)','columna de marcha','columna de marxa'],
  ['publicus, –a, –um','público/a','públic/a'],
  ['bellicosus, –a, –um','belicoso/a','bel·licós/osa'],
  ['pius, –a, –um','piadoso/a','pietós/osa'],
  ['tener, tenera, tenerum','tierno/a','tendre'],
  ['certus, –a, –um','seguro/a','segur/a'],
  ['vulpes, vulpis (f.)','zorro','rabosa'],
  ['parens, parentis (m. o f.)','progenitor, padre o madre','progenitor, pare o mare'],
  ['oratio, orationis (f.)','discurso','discurs'],
  ['Martius, –i','marzo, Marcial','març, Marcial'],
  ['Sergius, –i','Sergio','Sergi'],
  ['Servius, –i','Servio','Servi'],
  ['Livius, –i','Livio','Livi'],
  ['Terentius, –i','Terencio','Terenci'],
  ['Manlius, –i','Manlio','Manli'],
  ['Labienus, –i','Labieno','Labié'],
  ['Varro, Varronis (m.)','Varrón','Varró'],
  ['Aemilius, –i','Emilio','Emili'],
  ['Atheniensis, –e','ateniense','atenés/esa'],
  ['certo, certavi, certatum (1ª)','competir, luchar','competir, lluitar'],
  ['colloco, collocavi, collocatum (1ª)','colocar','col·locar'],
  ['servo, servavi, servatum (1ª)','guardar, salvar','guardar, salvar'],
  ['indico, indicavi, indicatum (1ª)','indicar','indicar'],
  ['nego, negavi, negatum (1ª)','negar','negar'],
  ['neco, necavi, necatum (1ª)','matar','matar'],
  ['committo, commisi, commissum (3ª)','emprender, cometer','emprendre, cometre'],
  ['recipio, recepi, receptum (mx.)','recibir','rebre'],
  ['callidus, –a, –um','astuto/a','astut/a'],
  ['facilis, –e','fácil','fàcil'],
  ['similis, –e','semejante','semblant'],
  ['dives, divitis','rico/a','ric/a'],
  ['eloquens, eloquentis','elocuente','eloqüent'],
  ['adventus, –us','llegada','arribada'],
  ['orno, ornavi, ornatum (1ª)','adornar','adornar'],
  ['declaro, declaravi, declaratum (1ª)','declarar','declarar'],
  ['pereo, perii, peritum (irr.)','perecer','perir'],
  ['redeo, redii, reditum (irr.)','regresar','tornar'],
  ['transeo, transii, transitum (irr.)','atravesar','travessar'],
  ['confero, contuli, collatum (irr.)','reunir, llevar','reunir, portar'],
  ['infero, intuli, illatum (irr.)','llevar, introducir','portar, introduir'],
  ['aufugio, aufugi, – (mx.)','huir','fugir'],
  ['mare, maris (n.)','mar','mar'],
  ['tres, tria (num.)','tres','tres'],
  ['mille, milia (num.)','mil','mil'],
  ['idem, eadem, idem (pron.)','el mismo, la misma','el mateix, la mateixa'],
  ['necesse (adj. indecl.)','necesario','necessari'],
  // Lemas escolares cuya ausencia explica varias formas del corpus docente.
  // Si el profesor ya ofrece ficha propia, se conserva sin sustitución.
  ['stylus, –i','punzón para escribir','punxó per a escriure'],
  ['campus, –i','campo','camp'],
  ['fera, –æ','fiera','fera'],
  ['hora, –æ','hora','hora'],
  ['multitudo, multitudinis (f.)','multitud','multitud'],
  ['peditatus, –us','infantería','infanteria'],
  ['pretiosus, –a, –um','precioso/a, valioso/a','valuós/valuosa'],
  ['sapiens, sapientis','sabio/a','savi/sàvia'],
  ['postremus, –a, –um','último/a','últim/a'],
  ['egregius, –a, –um','distinguido/a','distingit/ida'],
  ['Neapolis, Neapolis (f.)','Nápoles','Nàpols'],
  ['Boudicca, –æ','Boudica','Boudica'],
  ['Britannus, –i','britano','brità'],
  ['condicio, condicionis (f.)','condición','condició'],
  ['constantia, –æ','constancia','constància'],
  ['consulatus, –us','consulado','consolat'],
  ['cura, –æ','cuidado','cura'],
  ['elephantus, –i','elefante','elefant'],
  ['Graecia, –æ','Grecia','Grècia'],
  ['grammatica, –æ','gramática','gramàtica'],
  ['hasta, –æ','lanza','llança'],
  ['incolumis, –e','ileso/a','il·lés/esa'],
  ['patrocinium, –i','patrocinio, protección','patrocini, protecció'],
  ['pirata, –æ (m.)','pirata','pirata'],
  ['praetor, praetoris (m.)','pretor','pretor'],
  ['rebellio, rebellionis (f.)','rebelión','rebel·lió'],
  ['salus, salutis (f.)','salud, salvación','salut, salvació'],
  ['superfluus, –a, –um','superfluo/a','superflu/a'],
  ['tergum, –i','espalda, dorso','esquena, dors'],
  ['totus, –a, –um','todo/a, entero/a','tot/a, sencer/a'],
  ['nullus, –a, –um','ninguno/a','cap'],
  ['amor, amoris (m.)','amor','amor'],
  ['agmen, agminis (n.)','columna de marcha','columna de marxa'],
  ['gemo, gemui, gemitum (3ª)','gemir','gemegar'],
  ['vivo, vixi, victum (3ª)','vivir','viure'],
  ['aperio, aperui, apertum (4ª)','abrir','obrir'],
  ['dedico, dedicavi, dedicatum (1ª)','dedicar','dedicar'],
  ['affirmo, affirmavi, affirmatum (1ª)','afirmar','afirmar'],
  ['latro, latravi, latratum (1ª)','ladrar','lladrar'],
  ['placeo, placui, placitum (2ª)','agradar','agradar'],
  ['parco, peperci, parsum (3ª)','perdonar, respetar','perdonar, respectar'],
  ['perduco, perduxi, perductum (3ª)','conducir hasta','conduir fins a'],
  ['procedo, processi, processum (3ª)','avanzar, salir','avançar, eixir'],
  ['prohibeo, prohibui, prohibitum (2ª)','prohibir','prohibir'],
  ['verto, verti, versum (3ª)','volver, girar','girar, tornar'],
  ['reverto, reverti, reversum (3ª)','regresar','tornar'],
  ['intro, intravi, intratum (1ª)','entrar','entrar'],
  ['decerno, decrevi, decretum (3ª)','decidir, decretar','decidir, decretar'],
  ['solvo, solvi, solutum (3ª)','soltar, pagar','soltar, pagar'],
  ['disco, didici, – (3ª)','aprender','aprendre'],
  ['soleo, solitus sum (2ª)','soler, acostumbrar','soler, acostumar'],
  ['vagor, vagatus sum (1ª)','andar errante','vagar'],
  ['vescor, vesci, – (3ª)','alimentarse','alimentar-se'],
  ['admiror, admiratus sum (1ª)','admirar','admirar'],
  ['hortor, hortatus sum (1ª)','exhortar','exhortar'],
  ['egredior, egressus sum (mx.)','salir','eixir'],
  ['regredior, regressus sum (mx.)','regresar','tornar'],
  ['transgredior, transgressus sum (mx.)','atravesar','travessar'],
  ['moror, moratus sum (1ª)','detenerse, demorarse','detindre’s, demorar-se'],
  ['fugio, fugi, fugitum (mx.)','huir','fugir'],
  ['modus, –i','modo, manera','manera'],
  ['viso, visi, visum (3ª)','visitar, ir a ver','visitar, anar a veure'],
  ['testis, testis (m./f.)','testigo','testimoni'],
  ['turtur, turturis (m.)','tórtola','tórtora'],
  ['comparo, comparavi, comparatum (1ª)','preparar, comparar','preparar, comparar'],
  ['amitto, amisi, amissum (3ª)','perder, dejar marchar','perdre, deixar anar'],
  ['expello, expuli, expulsum (3ª)','expulsar','expulsar'],
  ['pronuntio, pronuntiavi, pronuntiatum (1ª)','pronunciar, anunciar','pronunciar, anunciar'],
  ['patefacio, patefeci, patefactum (mx.)','abrir, descubrir','obrir, descobrir'],
  ['Saguntinus, –a, –um','saguntino/a','saguntí/ina'],
  ['audeo, ausus sum (2ª)','atreverse','atrevir-se'],
  ['confido, confisus sum (3ª)','confiar','confiar']
 ];
 const complete=[...bank];
 for(const [entry,meaning,meaning_va] of supplementary){
  const lemma=latinKey(head(entry));
  if(!bank.some(x=>latinKey(head(x.entry))===lemma))
   complete.push({entry,meaning,meaning_va});
 }
 for(const row of complete){
  const raw=String(row.entry||'').trim(),lemma=head(raw),l=latinKey(lemma);
  if(!l||!row.meaning||!(/^[a-z]+$/.test(l)))continue;
  const fields=raw.split(',').map(x=>latinKey(x.replace(/\([^)]*\)/g,'').trim().replace(/^[–−—-]+/,'').trim()));
  const annotated=raw.match(/\((1ª|2ª|3ª|4ª|mx\.)\)\s*$/u);
  const record={lemma:l,entry:raw,meaning:row.meaning,meaning_va:row.meaning_va||'',
   attested:true,origin:'paradigma regular escolar derivado del enunciado (no flexión individual certificada)'};
  add(l,record); // La forma de cita del propio enunciado es léxica, no inferida.
  const proper=/^\p{Lu}/u.test(raw);
  if(fields.length>=3&&fields[1]==='a'&&fields[2]==='um'){
   let stem='';
   if(l.endsWith('us'))stem=l.slice(0,-2);
   else if(l.endsWith('er')){
    const female=fields[1]; // en -er los enunciados suelen indicar -ra o -era
    stem=l.endsWith('er')?l.slice(0,-2)+'r':'';
   }
   if(stem)decl12(stem,record);
   // Grado superlativo regular, evitando todos los positivos irregulares.
   if(stem&&!['bonus','malus','magnus','parvus','multus','vetus'].includes(l)&&l.endsWith('us')){
    decl12(stem+'issim',record);
    addMany(stem,['ior','ius','iorem','iore','iori','iores','iorum','ioribus','iora'],record);
   }
  }else if(fields.length>=3&&l.endsWith('er')&&fields[1].endsWith('a')&&fields[2].endsWith('um')){
   const stem=fields[1].endsWith('era')?l:l.slice(0,-2)+'r';
   add(l,record); // masculino nom./voc. sin -us
   addMany(stem,['i','o','um','orum','is','os','a','ae','am','arum','as'],record);
   decl12(stem,record,'n');
   if(!['noster','vester'].includes(l)){
    const compStem=fields[1].endsWith('era')?l:stem;
    addMany(compStem,['ior','ius','iorem','iore','iori','iores','ioribus','iora'],record);
    decl12(l+'rim',record); // pulcher -> pulcherrimus; miser -> miserrimus
   }
  }else if(fields.length===2&&fields[1]==='e'&&l.endsWith('is')){
   const stem=l.slice(0,-2);
   addMany(stem,['is','e','em','i','es','ia','ium','ibus'],record);
   if(!['facilis','difficilis','similis','humilis','gracilis'].includes(l)){
    decl12(stem+'issim',record);
    addMany(stem,['ior','ius','iorem','iore','iori','iores','iorum','ioribus','iora'],record);
   }
  }else if(fields.length===2&&l.endsWith('a')&&fields[1]==='ae'){
   addMany(l.slice(0,-1),proper?['a','ae','am']:['a','ae','am','arum','is','as'],record);
  }else if(fields.length===2&&['us','um'].some(e=>l.endsWith(e))&&fields[1]==='i'){
   const root=l.slice(0,-2),neuter=l.endsWith('um');
   if(proper){
    addMany(root,neuter?['um','i','o']:['us','i','o','um','e'],record);
   }else decl12(root,record,neuter?'n':'m');
  }else if(fields.length===2&&l.endsWith('us')&&fields[1]==='us'){
   const stem=l.slice(0,-2);
   addMany(stem,proper?['us','ui','um','u']:['us','ui','um','u','uum','ibus'],record);
  }else if(fields.length===2&&l.endsWith('is')&&fields[1]==='is'){
   const stem=l.slice(0,-2);
   addMany(stem,proper?['is','em','i','e']:['is','em','i','e','es','ibus'],record);
  }else if(fields.length===2&&fields[1].endsWith('is')&&fields[1].length>4&&
     !/\(n\.\)/i.test(raw)&&!['bos','vis','sus','grus','iuppiter'].includes(l)){
   const stem=fields[1].slice(0,-2);
   addMany(stem,proper?['is','em','i','e']:['is','em','i','e','es','ibus'],record);
   // Comparativos y superlativos regulares de adjetivos en -ens, -entis.
   if(l.endsWith('ens')&&fields[1].endsWith('entis')&&!/\((?:m|f)\.\)/i.test(raw)){
    addMany(stem,['ior','ius','iorem','iore','iori','iores','iorum','ioribus','iora'],record);
    decl12(stem+'issim',record);
   }
  }
  if(!annotated)continue;
  // Los deponentes dan un participio perfecto activo en su propio enunciado.
  // Las otras formas se proponen sin certificarlas individualmente.
  if(l.endsWith('or')&&(fields[1]&&/^(?:[a-z]+(?:tus|sus)) sum$/.test(fields[1])||
     fields[1]?.endsWith('i')&&/\(\s*(?:[1-4]ª|mx\.)\s*\)/.test(raw))){
   const group=annotated[1];
   if(fields[1].endsWith(' sum')){
    const p=fields[1].slice(0,-4),stemP=p.slice(0,-2);
    add(p,record);
    decl12(stemP,{...record,attested:false,origin:'participio deponente flexionado: pendiente de contraste'});
   }
   // Las desinencias activas NO sirven para los deponentes. El imperfecto
   // deponente sí es productivo y la conjugación está dada por el docente.
   const stem=(group==='2ª'||group==='4ª'||group==='mx.')?
    l.slice(0,-3):l.slice(0,-2);
   const deponent={
    '1ª':{present:['or','aris','atur','amur','amini','antur'],imperfect:'ab'},
    '2ª':{present:['eor','eris','etur','emur','emini','entur'],imperfect:'eb'},
    '3ª':{present:['or','eris','itur','imur','imini','untur'],imperfect:'eb'},
    '4ª':{present:['ior','iris','itur','imur','imini','iuntur'],imperfect:'ieb'},
    'mx.':{present:['ior','eris','itur','imur','imini','iuntur'],imperfect:'ieb'}
   }[group];
   addMany(stem,deponent.present,record);
   addMany(stem+deponent.imperfect,
    ['ar','aris','atur','amur','amini','antur'],record);
   const participleStem=stem+(group==='1ª'?'ant':['4ª','mx.'].includes(group)?'ient':'ent');
   add(participleStem.slice(0,-1)+'s',record);
   addMany(participleStem,['is','em','i','e','es','ibus'],record);
   continue;
  }
  const group=annotated[1],end=group==='2ª'?'eo':(['4ª','mx.'].includes(group)?'io':'o');
  if(!l.endsWith(end)||!l.slice(0,-end.length)){
   // Solo para dos etiquetas discordantes comprobadas en el banco docente.
   // No proponer formas de presente ni participios a partir de un supino dudoso.
   if(['soluo','uiuo'].includes(l)&&fields.length>=3&&
      fields[1].endsWith('i')&&fields[1].length>2){
    const root=fields[1].slice(0,-1);
    for(const suffix of ['i','isti','it','imus','istis','erunt','eram',
      'eras','erat','eramus','eratis','erant','ero','eris','erit',
      'erimus','eritis','erint','isse'])add(root+suffix,record);
   }
   continue;
  }
  const stem=l.slice(0,-end.length);
  const formsByGroup={
   '1ª':{inf:'are',imp:'a',imperf:'ab',future:'ab',passive:'1'},
   '2ª':{inf:'ere',imp:'e',imperf:'eb',future:'eb',passive:'2'},
   '3ª':{inf:'ere',imp:'e',imperf:'eb',future:'3',passive:'3'},
   '4ª':{inf:'ire',imp:'i',imperf:'ieb',future:'4',passive:'4'},
   'mx.':{inf:'ere',imp:'e',imperf:'ieb',future:'4',passive:'4'}
  };
  const rule=formsByGroup[group];
  // El mismo modelo explícito vale para las seis personas del presente,
  // también cuando el lema figura solo en el suplemento de vocabulario.
  const present={
   '1ª':['o','as','at','amus','atis','ant'],
   '2ª':['eo','es','et','emus','etis','ent'],
   '3ª':['o','is','it','imus','itis','unt'],
   '4ª':['io','is','it','imus','itis','iunt'],
   'mx.':['io','is','it','imus','itis','iunt']
  }[group];
  addMany(stem,present,record);
  add(stem+rule.inf,record);
  if(l!=='facio')add(stem+({
   '1ª':'ari','2ª':'eri','3ª':'i','4ª':'iri','mx.':'i'
  }[group]),record); // infinitivo de presente pasivo

  if(!['dico','duco','facio','fero'].includes(l))add(stem+rule.imp,record);
  const participleStem=stem+(group==='1ª'?'ant':['4ª','mx.'].includes(group)?'ient':'ent');
  add(participleStem.slice(0,-1)+'s',record);
  addMany(participleStem,['is','em','i','e','es','ium','ibus'],record);
  const endingActive=['am','as','at','amus','atis','ant'];
  for(const ending of endingActive)add(stem+rule.imperf+ending,record);
  // Pasiva de presente e imperfecto: no se extrapola a facio -> fio.
  if(l!=='facio'){
   const pres={
    '1ª':['or','aris','atur','amur','amini','antur'],
    '2ª':['eor','eris','etur','emur','emini','entur'],
    '3ª':['or','eris','itur','imur','imini','untur'],
    '4ª':['ior','iris','itur','imur','imini','iuntur'],
    'mx.':['ior','eris','itur','imur','imini','iuntur']
   }[group];
   const ipf=['ar','aris','atur','amur','amini','antur'];
   const pfx=rule.imperf;
   for(const form of pres)add(stem+form,record);
   for(const form of ipf)add(stem+pfx+form,record);
  }
  if(rule.future==='ab'||rule.future==='eb'){
   const p=rule.future;
   for(const end of ['o','is','it','imus','itis','unt'])add(stem+p+end,record);
   if(l!=='facio')for(const end of ['or','eris','itur','imur','imini','untur'])add(stem+p+end,record);
  }else{
   const p=group==='3ª'?'':'i';
   for(const end of ['am','es','et','emus','etis','ent'])add(stem+p+end,record);
   if(l!=='facio')for(const end of ['ar','eris','etur','emur','emini','entur'])add(stem+p+end,record);
  }

  // Perfecto y pluscuamperfecto solo con el tema expresamente aportado.
  const perf=fields[1]||'';
  if(fields.length>=3&&perf.endsWith('i')&&perf.length>2){
   const root=perf.slice(0,-1);
   for(const end of ['i','isti','it','imus','istis','erunt','eram','eras','erat','eramus','eratis','erant','ero','eris','erit','erimus','eritis','erint','isse']){
    add(root+end,record);
   }
   const sup=fields[2]||'';
   if(sup.endsWith('um')&&sup.length>3){
    // Un error en el supino docente no puede validar un falso participio.
    // Ofrecer como hipótesis revisable, conservando el índice contrastado.
    const proposal={...record,attested:false,
     origin:'participio deducido del supino docente: revisar individualmente'};
    decl12(sup.slice(0,-2),proposal);
   }
  }

 }
 // Modos y perfectos irregulares de enorme frecuencia, explícitos.
 const irregular=[
  {lemma:'sum',entry:'sum, fui, – (irr.)',meaning:'ser, estar, haber',
   forms:['sum','es','est','sumus','estis','sunt','eram','eras','erat','eramus','eratis','erant',
    'ero','eris','erit','erimus','eritis','erunt','esse','fui','fuisti','fuit','fuimus','fuistis','fuerunt',
    'fueram','fueras','fuerat','fueramus','fueratis','fuerant','fuisse']},
  {lemma:'possum',entry:'possum, potui, – (irr.)',meaning:'poder',
   forms:['possum','potes','potest','possumus','potestis','possunt','poteram','poteras','poterat',
    'poteramus','poteratis','poterant','potero','poteris','poterit','poterimus','poteritis','poterunt',
    'posse','potui','potuit','potuerunt']},
  {lemma:'do',entry:'do, dedi, datum (1ª)',meaning:'dar',forms:['dare']},
  // Formas del examen docente de Latín 4.º UD5. El banco activo conserva prioridad.
  {lemma:'terra',entry:'terra, −æ',meaning:'tierra, territorio',forms:['terra']},
  {lemma:'timeo',entry:'timeo (2ª)',meaning:'temer',forms:['timebant']},
  {lemma:'fortitudo',entry:'fortitudo, −dinis (f.)',meaning:'fuerza, fortaleza',forms:['fortitudinem']},
  {lemma:'eo',entry:'eo, ii, itum (irr.)',meaning:'ir',
   forms:['eo','is','it','imus','itis','eunt','ibam','ibas','ibat','ibamus','ibatis','ibant',
    'ibo','ibis','ibit','ibimus','ibitis','ibunt','ire','ii','ivi','iit','ierunt','ierat']},
  {lemma:'dico',entry:'dico, dixi, dictum (3ª)',meaning:'decir',forms:['dic']},
  {lemma:'duco',entry:'duco, duxi, ductum (3ª)',meaning:'conducir',forms:['duc']},
  {lemma:'facio',entry:'facio, feci, factum (mx.)',meaning:'hacer',forms:['fac']},
  {lemma:'humus',entry:'humus, –i (f.)',meaning:'suelo, tierra',forms:['humi']},
  {lemma:'mare',entry:'mare, maris (n.)',meaning:'mar',forms:['mare','maria','mari','marium','maribus']},
  {lemma:'tres',entry:'tres, tria (num.)',meaning:'tres',forms:['tres','tria','trium','tribus']},
  {lemma:'mille',entry:'mille, milia (num.)',meaning:'mil',forms:['mille','milia','milium','milibus']},
  {lemma:'idem',entry:'idem, eadem, idem (pron.)',meaning:'el mismo, la misma',
   forms:['idem','eadem','eiusdem','eidem','eundem','eandem','eodem','eadem','iidem','eaedem',
    'eorundem','earundem','eisdem','iisdem','eosdem','easdem']},
  {lemma:'pereo',entry:'pereo, perii, peritum (irr.)',meaning:'perecer',
   forms:['pereo','perire','periit','perierat','perierunt','perierant']},
  {lemma:'redeo',entry:'redeo, redii, reditum (irr.)',meaning:'regresar',
   forms:['redeo','redire','rediit','redierunt','redierant','redierat']},
  {lemma:'transeo',entry:'transeo, transii, transitum (irr.)',meaning:'atravesar',
   forms:['transeo','transire','transiri','transiit','transierunt','transierant']},
  {lemma:'confero',entry:'confero, contuli, collatum (irr.)',meaning:'reunir, llevar',
   forms:['contuli','contulit','contulerunt','contulerant']},
  {lemma:'infero',entry:'infero, intuli, illatum (irr.)',meaning:'llevar, introducir',
   forms:['intuli','intulit','intulerunt','intulerant']},
  {lemma:'aufugio',entry:'aufugio, aufugi, – (mx.)',meaning:'huir',
   forms:['aufugit','aufugerunt','aufugerat']},
  {lemma:'facilis',entry:'facilis, –e',meaning:'fácil',
   forms:['facillimus','facillima','facillimum','facillimi','facillimis']},
  {lemma:'similis',entry:'similis, –e',meaning:'semejante',
   forms:['simillimus','simillima','simillimum','simillimi']},
  {lemma:'dives',entry:'dives, divitis',meaning:'rico/a',
   forms:['ditissimus','ditissima','ditissimum','ditissimi']},
  {lemma:'eloquens',entry:'eloquens, eloquentis',meaning:'elocuente',
   forms:['eloquentior','eloquentius','eloquentissimus','eloquentissima','eloquentissimum']},
  {lemma:'malus',entry:'malus, –a, –um',meaning:'malo/a',
   forms:['peior','peius','pessimus','pessima','pessimum','pessimi']},
  {lemma:'bonus',entry:'bonus, –a, –um',meaning:'bueno/a',
   forms:['melior','melius','optimus','optima','optimum']},
  {lemma:'magnus',entry:'magnus, –a, –um',meaning:'grande',
   forms:['maior','maius','maximus','maxima','maximum']},
  {lemma:'parvus',entry:'parvus, –a, –um',meaning:'pequeño/a',
   forms:['minor','minus','minimus','minima','minimum']},
  {lemma:'multus',entry:'multus, –a, –um',meaning:'mucho/a',
   forms:['plures','plura','plurimus','plurima','plurimum','plurimos']},
  {lemma:'vivo',entry:'vivo, vixi, victum (3ª)',meaning:'vivir',
   forms:['vivo','vivis','vivit','vivimus','vivitis','vivunt']},
  {lemma:'solvo',entry:'solvo, solvi, solutum (3ª)',meaning:'soltar, pagar',
   forms:['solvo','solvis','solvit','solvimus','solvitis','solvunt',
    'solvebam','solvebas','solvebat','solvebamus','solvebatis','solvebant']},
  {lemma:'fugio',entry:'fugio, fugi, fugitum (mx.)',meaning:'huir',
   forms:['fugio','fugis','fugit','fugimus','fugitis','fugiunt',
    'fugi','fugisti','fugit','fugimus','fugistis','fugerunt',
    'fugeram','fugeras','fugerat','fugeramus','fugeratis','fugerant']},
  {lemma:'soleo',entry:'soleo, solitus sum (2ª)',meaning:'soler',
   forms:['solitus','solita','solitum']},
  {lemma:'absum',entry:'absum, afui, – (irr.)',meaning:'estar ausente, distar',
   forms:['absum','abes','abest','absumus','abestis','absunt',
    'aberam','aberas','aberat','aberamus','aberatis','aberant',
    'afui','afuit']},
  {lemma:'adsum',entry:'adsum, adfui, – (irr.)',meaning:'estar presente, asistir',
   forms:['adsum','ades','adest','adsumus','adestis','adsunt',
    'aderam','aderas','aderat','aderamus','aderatis','aderant',
    'adfui','affui','adfuit']},
  {lemma:'praesum',entry:'praesum, praefui, – (irr.)',
   meaning:'estar al frente de',
   forms:['praesum','praees','praeest','praesumus','praeestis','praesunt',
    'praeeram','praeeras','praeerat','praeeramus','praeeratis','praeerant',
    'praefui','praefuisti','praefuit','praefuerunt']},
  {lemma:'volo',entry:'volo, volui, – (irr.)',meaning:'querer',
   forms:['volo','vis','vult','volumus','vultis','volunt',
    'volebam','volebas','volebat','volebamus','volebatis','volebant']},
  {lemma:'duo',entry:'duo, duae, duo (num.)',meaning:'dos',
   forms:['duo','duae','duos','duas','duorum','duarum','duobus','duabus']},
  {lemma:'sexcenti',entry:'sexcenti, –æ, –a (num.)',meaning:'seiscientos',
   forms:['sexcenti','sexcentae','sexcenta','sexcentos','sexcentas',
    'sexcentorum','sexcentarum','sexcentis']},
  {lemma:'Belgæ',entry:'Belgæ, –arum (m. pl.)',meaning:'belgas',
   forms:['Belgae','Belgarum','Belgis','Belgas']},
  {lemma:'Atuatuci',entry:'Atuatuci, –orum (m. pl.)',meaning:'atuatucos',
   forms:['Atuatuci','Atuatucorum','Atuatucis','Atuatucos']},
  {lemma:'Allobroges',entry:'Allobroges, –um (m. pl.)',meaning:'alóbroges',
   forms:['Allobroges','Allobrogum','Allobrogibus']},
  {lemma:'Cannae',entry:'Cannae, –arum (f. pl.)',meaning:'Cannas',
   forms:['Cannae','Cannarum','Cannis','Cannas']},
  {lemma:'comitia',entry:'comitia, –orum (n. pl.)',meaning:'comicios',
   forms:['comitia','comitiorum','comitiis']},
  {lemma:'nonnumquam',entry:'nonnumquam (adv.)',meaning:'a veces',
   forms:['nonnumquam']},
  {lemma:'sapiens',entry:'sapiens, sapientis',meaning:'sabio/a',
   forms:['sapientissimus','sapientissima','sapientissimum']},
  {lemma:'neco',entry:'neco, necavi, necatum (1ª)',meaning:'matar',
   forms:['necaturos'],provisional:true},
  {lemma:'disco',entry:'disco, didici, – (3ª)',meaning:'aprender',forms:['didici']},
  {lemma:'patefacio',entry:'patefacio, patefeci, patefactum (mx.)',meaning:'abrir, descubrir',
   forms:['patefecit']},
  {lemma:'audeo',entry:'audeo, ausus sum (2ª)',meaning:'atreverse',forms:['ausus']},
  {lemma:'confido',entry:'confido, confisus sum (3ª)',meaning:'confiar',forms:['confisus']},
  {lemma:'colloco',entry:'colloco, collocavi, collocatum (1ª)',meaning:'colocar',
   forms:['collocaverat']},
  {lemma:'indico',entry:'indico, indicavi, indicatum (1ª)',meaning:'indicar',
   forms:['indicavit']},
  {lemma:'servo',entry:'servo, servavi, servatum (1ª)',meaning:'guardar, salvar',
   forms:['servavit']}
 ];
 for(const info of irregular){
  const existing=bank.find(row=>latinKey(head(row.entry))===latinKey(info.lemma));
  const rec={lemma:latinKey(info.lemma),entry:existing?.entry||info.entry,
   meaning:existing?existing.meaning||'':info.meaning,meaning_va:existing?.meaning_va||'',
   attested:!info.provisional,
   origin:info.provisional?'participio futuro derivado del supino: confirmar con contexto':
    'paradigma irregular escolar explícito; sin nuevas flexiones verificadas en índice'};
  for(const form of info.forms)add(form,rec);
 }
 const out=new Map([...forms].map(([f,rows])=>[f,[...rows.values()]]));
 latinExpandedCache.set(bank,out);
 return out;
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
   endings(lemma.slice(0,-1),['ω','εις','ει','ομεν','ετε','ουσι','ουσιν','ειν',
    'ομαι','ῃ','εται','όμεθα','εσθε','ονται','εσθαι'],record);
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
  'σωτηρία':'σωτηρία, –ας (ἡ)','Δημοσθένης':'Δημοσθένης, –ους (ὁ)',
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
  const saved=bankByHead(head(entry));
  const sourceEntry=saved?.entry||supplementaryEntries[entry]||entry;
  const outputEntry=saved?.entry||prepLabel(sourceEntry);
  const record={lemma:key(head(saved?.entry||entry)),entry:outputEntry,
   meaning:saved?saved.meaning||'':meaning,meaning_va:saved?.meaning_va||'',attested:true,origin:'paradigma gramatical explícito'};
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
  'τίνες','τίνες','τίνας','τίνας','τίνων','τίνων','τίσι','τίσιν','τίσιν'],'τίς','quién, cuál, qué');
 // Indefinido enclítico: sin tilde, con acento final o grave en contexto.
 // Nunca asimilar una grafía interrogativa con acento inicial.
 addIrregular(['τις','τὶς','τι','τὶ','τινά','τινὰ','τινα','τινάς','τινὰς','τινας',
  'τινός','τινὸς','τινος','τινί','τινὶ','τινι',
  'τινές','τινὲς','τινες','τινῶν','τινων',
  'τισί','τισὶ','τισίν','τισὶν','τισι','τισιν'],'τις','alguien, alguno, cierto');
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
  ['ἔχω','tener',['εἶχε','εἶχεν']],
  ['κελεύω','ordenar',['ἐκελεύσατο','ἐκέλευσεν']],
  ['κιθαρίζω','tocar la cítara',['ἐκιθάρισε']],
  ['ἐκκλησία','asamblea',['ἐκκλησίᾳ','ἐκκλησίαν','ἐκκλησίας']],
  ['κομίζω','llevarse',['ἐκόμισε']],
  ['λείπω','dejar',['ἔλειψαν','ἔλιπον']],
  ['λύω','liberar',['ἐλελύκειμεν']],
  // Formas individuales contrastadas con los textos de UD13–14;
  // no implican comprobación de paradigmas enteros ni elevan el índice a source 5.
  ['σωτηρία','salvación',['σωτηρίας']],
  ['ὁράω','ver',['ἑώρα']],
  // No extrapolar temas ni otras flexiones de estas formas del texto.
  ['Δημοσθένης','Demóstenes',['Δημοσθένης']],
  ['νίκη','victoria',['νίκαι']],
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
  ['παιδεύω','educar',['ἐπαίδευε','ἐπαίδευσαν','ἐπαίδευσε','ἐπαίδευσεν','ἐπεπαιδεύκει','παιδεύεται','παιδεύονται','παιδεύσει','πεπαιδεύκασιν','πεπαίδευκε']],
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
  ['σῴζω','salvar',['ἐσῴσαν','σῴζονται','σώζονται']],
  ['τέμνω','cortar',['ἔτεμον']],
  ['τιμάω','honrar',['ἐτιμᾶτο','ἐτιμῶμεθα','τιμᾶται']],
  ['τυγχάνω','alcanzar, conseguir',['ἔτυχεν']],
  ['εὐδαίμων','feliz',['εὐδαίμονές']],
  ['Εὐρώπη','Europa',['Εὐρώπην']],
  ['εὐχή','súplica, plegaria',['εὐχαῖς']],
  ['φέρω','llevar',['ἔφερε','ἔφερεν','φέρεται']],
  ['φεύγω','huir',['ἔφευγον','ἔφυγον','ἔφυγεν','φευγόντας']],
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
 'ἀνθρώποι':'ἄνθρωποι (revisar el acento del nominativo plural)',
 'νὸμοι':'νόμοι (revisar el acento del nominativo plural)',
 'ἀδικόν':'ἄδικον (revisar el acento)',
 'οἰ':'οἱ si es el artículo (revisar el espíritu)',
 'διδασκὰλου':'διδασκάλου (revisar el acento del genitivo)',
 'Δημοσθήνης':'Δημοσθένης (nominativo del nombre propio; revisar el acento)',
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
const documentedSources=new Set([0,1,5,6,7]);
function analyze(data,text,course,bank,{contextual=false}={}){
 const lang=course==='gr1'?'grc':'lat';
 let byCourse=vocabularyIndexCache.get(data);
 if(!byCourse){byCourse=new Map();vocabularyIndexCache.set(data,byCourse)}
 const indexKey=contextual?course+'-contextual':course;
 let index=byCourse.get(indexKey);
 if(!index){
  index=new Map();
  for(const [lemma,surface,tags,source] of data.rows[lang]){
   const indexedEntry=data.vocabulary[lang][lemma]?.[course];
   if(!indexedEntry&&(!contextual||!documentedSources.has(source)))continue;
   const k=lang==='lat'?latinKey(surface):key(surface);if(!index.has(k))index.set(k,new Map());
   const candidates=index.get(k),old=candidates.get(lemma);
   const lexicalInvariable=source===3&&key(surface)===key(lemma)&&
    invariableEntry(indexedEntry?.entry);
   const attested=documentedSources.has(source)||lexicalInvariable;
   const exactForms=old?.exactForms||new Set(),morphTags=old?.morphTags||new Set();
   if(lang==='grc'&&attested)exactForms.add(surface.normalize('NFC'));
   if(attested)morphTags.add(tags);
   candidates.set(lemma,{lemma,attested:attested||!!old?.attested,exactForms,morphTags});
  }
  byCourse.set(indexKey,index);
 }
 let greek=null;
 if(lang==='grc'){
  if(!greekReferenceCache.has(bank))greekReferenceCache.set(bank,greekReferenceForms(bank));
  greek=greekReferenceCache.get(bank);
 }
 const bankIndex=new Map();
 const normalizeCourse=lang==='lat'?latinKey:key;
 const attach=(id,row)=>{if(!bankIndex.has(id))bankIndex.set(id,[]);bankIndex.get(id).push(row)};
 for(const row of bank){attach('E'+normalizeCourse(row.entry),row);attach('H'+normalizeCourse(head(row.entry)),row)}
 const tokens=new Map();
 const passages=contextual?String(text).split(/[.!?;·;\n]+/u):[String(text)];
 // Distintas apariciones de una misma oración no pueden compartir la
 // decisión del profesor. Para el primer contexto mantenemos la clave antigua,
 // de modo que las decisiones existentes siguen siendo compatibles.
 const seenContexts=new Set();
 for(const [passageIndex,passage] of passages.entries()){
  const context=contextual?passage.trim().replace(/\s+/gu,' ').normalize('NFC'):'';
  const original=contextual?context:passage;
  const searchable=lang==='grc'?original.replace(/([\p{L}\p{M}])[’'](?=[\p{L}\p{M}])/gu,'$1 '):original;
  let previous='';
  const occurrences=new Map();
  for(const match of searchable.matchAll(/[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*/gu)){
   const form=match[0],normal=normalizeCourse(form);
   if(!normal)continue;
   const spelling=lang==='grc'?form.normalize('NFC'):normal;
   const occurrence=(occurrences.get(spelling)||0)+1;
   occurrences.set(spelling,occurrence);
   const identity=contextual?JSON.stringify(seenContexts.has(context)?
    [context,spelling,occurrence,passageIndex]:[context,spelling,occurrence]):spelling;
   if(!tokens.has(identity))tokens.set(identity,{normal,form,context,identity,offset:match.index,precededBy:new Set()});
   tokens.get(identity).precededBy.add(previous);
   previous=normal;
  }
  if(contextual&&context)seenContexts.add(context);
 }
 return [...tokens.values()].map(({normal,form,context,identity,offset,precededBy})=>{
  const indexedCandidates=[...(index.get(normal)?.values()||[])].flatMap(c=>{
   const original=data.vocabulary[lang][c.lemma]?.[course];
   const matches=[...new Set([...(original?bankIndex.get('E'+normalizeCourse(original.entry))||[]:[]),
    ...(bankIndex.get('H'+normalizeCourse(c.lemma))||[])])];
   // Repetir una misma palabra en distintas UD con glosas ligeramente
   // distintas no constituye una ambigüedad MORFOLÓGICA. Conservamos la
   // entrada docente más completa, dando preferencia a la del índice.
   // Los homógrafos de lemas distintos siguen separados en `candidates`.
   if(!original&&!matches.length)return [];
   const variants=matches.length?(lang==='lat'?[matches.slice().sort((a,b)=>{
    const score=x=>(x.entry===original?.entry?100:0)+
     (x.meaning_va?6:0)+(x.entry.split(',').length*3);
    return score(b)-score(a);
   })[0]]:matches):[{entry:original.entry,meaning:''}];
   return variants.map(x=>({...c,entry:x.entry,meaning:x.meaning||'',meaning_va:x.meaning_va||''}));
  });
  const regular=lang==='lat'?[...(latinPresentForms(bank).get(normal)||[]),
   ...(latinExpandedForms(bank).get(normal)||[])]:[];
  const directInvariable=lang==='lat'?(bankIndex.get('H'+normal)||[]).filter(x=>
   invariableEntry(x.entry)).map(x=>({
    lemma:normal,entry:x.entry,meaning:x.meaning||'',meaning_va:x.meaning_va||'',
    attested:true,origin:'invariable explícita del banco docente'
   })):[];
  const curated=lang==='lat'&&!directInvariable.length?
   (latinCore.get(normal)||[]):[];
  // La enclítica -que se separa SOLO si la base tiene un análisis
  // registrado o un paradigma regular explícito; nunca por sufijo solo.
  let enclitic=[];
  if(lang==='lat'&&normal.endsWith('que')&&normal.length>5&&
    !latinLexicalQueWords.has(normal)&&
    !indexedCandidates.length&&!regular.length&&!directInvariable.length&&
    !curated.length){
   const base=normal.slice(0,-3);
   const explicit=(latinExpandedForms(bank).get(base)||[]);
   const indexed=[...(index.get(base)?.values()||[])].map(x=>{
    const teacher=data.vocabulary.lat[x.lemma]?.[course];
    if(!teacher)return null;
    const found=(bankIndex.get('H'+latinKey(x.lemma))||[])[0]||teacher;
    return {...x,entry:found.entry,meaning:found.meaning||'',meaning_va:found.meaning_va||''};
   }).filter(Boolean);
   enclitic=[...explicit,...indexed].map(x=>({...x,
    origin:'análisis de la base con enclítica -que, sin alterar el original'}));
  }
  const supplement=greek?.get(normal)||[];
  // La normalización ayuda a encontrar formas; la grafía exacta con
  // diacríticos decide el lema cuando hay coincidencia documentada.
  const exactGreek=supplement.filter(x=>x.exactForms?.has(form.normalize('NFC')));
  const exactIndexed=lang==='grc'?indexedCandidates.filter(x=>x.exactForms?.has(form.normalize('NFC'))):[];
  const regularLemmas=new Set(regular.map(candidate=>candidate.lemma));
  let all=exactGreek.length?exactGreek:
   [...(exactIndexed.length?exactIndexed:indexedCandidates).filter(x=>
    !(supplement.length&&!x.attested&&!x.meaning)&&
    !(regularLemmas.has(x.lemma)&&!x.attested)),
    ...supplement,...directInvariable,...curated,...regular,...enclitic];
  if(contextual){
   for(const row of bankIndex.get('H'+normal)||[]){
    if(lang==='grc'&&head(row.entry).normalize('NFC')!==form.normalize('NFC'))continue;
    all.push({...row,lemma:normal,attested:false,lexicalCitation:true,origin:'forma de cita del banco docente'});
   }
  }
  // El banco de Latín 4.º puede no incluir el sustantivo plural bona.
  // La ficha del índice conserva la alternativa léxica sin tomar una glosa de otro curso.
  if(contextual&&lang==='lat'&&normal==='bona'&&!all.some(row=>row.lemma==='bona')){
   const noun=data.vocabulary.lat.bona?.lat1;
   if(noun)all.push({lemma:'bona',entry:noun.entry,meaning:'',attested:false,
    origin:'sustantivo plural registrado en el índice léxico'});
  }
  // §201 de Allen y Greenough: ēst es variante de edit, de edō.
  // Sin cantidad explícita, la grafía est admite también sum.
  if(contextual&&lang==='lat'&&normal==='est'){
   if(form.normalize('NFC').toLowerCase()==='ēst')
    all=all.filter(candidate=>latinKey(candidate.lemma)!=='sum');
   all.push({lemma:'edo',entry:'edō, edere, ēdī, ēsum',meaning:'comer',
    attested:true,origin:'Allen y Greenough, §201'});
  }
  // El superlativo adverbial y el vocativo pueden tener la misma grafía.
  // La lectura adverbial consta explícitamente en el glosario docente de UD5.
  if(contextual&&lang==='lat'&&normal==='fortissime'){
   all.push({lemma:'fortissime',entry:'fortissime (adv.)',meaning:'con mucha fuerza',
    attested:true,origin:'glosario docente de Latín 4.º UD5'});
  }
  // Preferimos la evidencia más firme para la misma entrada, sin descartar
  // una segunda lectura posible de un homógrafo.
  const compact=new Map();
  for(const candidate of all){
   // UniMorph contiene servus como sustantivo Y como adjetivo, pero si el
   // banco docente declara expresamente servus, –i (sustantivo), una flexión
   // exclusivamente adjetival como servae no pertenece a esa ficha.
   // Preservamos los análisis N y descartamos solo lecturas ADJ aisladas
   // incompatibles con un enunciado nominal inequívoco en -us, –i.
   if(lang==='lat'&&/^[a-z]+us,\s*[–−—-]i\b/.test(latinKey(candidate.entry))){
    const tags=[...(candidate.morphTags||[])];
    if(tags.length&&tags.every(tag=>tag.startsWith('ADJ;')))continue;
   }
   // Un único lema latino puede figurar en el banco con distintas rayas,
   // indicaciones de género o glosas de varias unidades. No son homógrafos:
   // conservar la ficha más completa en lugar de crear falsa ambigüedad.
   // Distintos lemas (bona / bonus, bello / bellum) siguen separados.
   const id=lang==='lat'?latinKey(candidate.lemma):
    candidate.lemma+'|'+candidate.entry+'|'+candidate.meaning;
   const previous=compact.get(id);
   const score=x=>(x.attested?100:0)+(x.meaning?3:0)+
    (x.entry.split(',').length*5)+(/\([^)]*\)/.test(x.entry)?4:0)+
    (/[æœ–−]/.test(x.entry)?2:0);
   if(!previous||score(candidate)>score(previous))compact.set(id,candidate);
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
    'τίνες','τίνες','τίνας','τίνας','τίνων','τίνων','τίσι','τίσιν','τίσιν'];
   const indefinite=['τις','τὶς','τι','τὶ','τινά','τινὰ','τινα','τινάς','τινὰς','τινας',
    'τινός','τινὸς','τινος','τινί','τινὶ','τινι',
    'τινές','τινὲς','τινες','τινῶν','τινων',
    'τισί','τισὶ','τισίν','τισὶν','τισι','τισιν'];
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
  if(contextual){
   const preferred=new Map();
   for(const candidate of candidates){
    const exact=bankIndex.get('E'+normalizeCourse(candidate.entry))||[];
    const matching=(bankIndex.get('H'+normalizeCourse(head(candidate.entry)))||[])
     .filter(row=>lang==='lat'||head(row.entry).normalize('NFC')===head(candidate.entry).normalize('NFC'));
    const teacher=exact.find(row=>row.entry===candidate.entry)||matching[0];
    const lexical=teacher?{...candidate,entry:teacher.entry,meaning:teacher.meaning||'',meaning_va:teacher.meaning_va||''}:candidate;
    const id=JSON.stringify([lexical.lemma,lexical.entry,lexical.meaning]);
    if(!preferred.has(id)||lexical.attested)preferred.set(id,lexical);
   }
   candidates=[...preferred.values()];
  }
  const resolved=candidates.length===1&&candidates[0].attested;
  const spellingHint=lang==='grc'?Object.entries(greekSpellingNotes)
   .find(([sample])=>sample.normalize('NFC')===form.normalize('NFC'))?.[1]:
   lang==='lat'?latinSpellingNotes[normal]:undefined;
  // Señalar erratas y abreviaturas sin modificar el original ni simular
  // una flexión contrastada. Distinguir sugerencia de evidencia.
  const contextHint=lang==='lat'?latinContextNotes[normal]:undefined;
  const requiresSpellingReview=!!(spellingHint||contextHint);
  return {form,candidates,...(contextual?{context,identity,offset,safeProposal:!requiresSpellingReview&&candidates.length===1&&!!candidates[0].lexicalCitation}:{}),status:requiresSpellingReview?'review':resolved?'documented':candidates.length?'review':'unknown',
   warning:contextHint?'Necesita contexto: '+contextHint:
    spellingHint?(lang==='grc'?'Posible errata: ':'Revisión de grafía o abreviatura: ')+spellingHint:'',
   // En una forma con -que copulativa se identifican DOS elementos:
   // el lexema base (quizá ambiguo) y la conjunción enclítica -que.
   encliticQue:lang==='lat'&&enclitic.length>0,
   lemma:resolved&&!requiresSpellingReview?candidates[0].lemma:'',
   entry:resolved&&!requiresSpellingReview?candidates[0].entry:form,
   meaning:resolved&&!requiresSpellingReview?candidates[0].meaning:'',
   meaning_va:resolved&&!requiresSpellingReview?(candidates[0].meaning_va||''):''};
 });
}
function entries(rows){
 // La descomposición del nexo produce una entrada de vocabulario propia,
 // pero nunca para quoque, quisque, uterque ni otros -que lexicalizados.
 // Incluso si bonaque tiene un lema base ambiguo, el nexo sigue siendo «y».
 rows=rows.filter(r=>r.status!=='omitted');
 const withEnclitic=rows.some(r=>r.encliticQue)?[...rows,{
  form:'-que',lemma:'-que',entry:'–que (conj.)',meaning:'y',meaning_va:'i',
  status:'documented',candidates:[],origin:'conjunción enclítica identificada'}]:rows;
 const seen=new Set();return withEnclitic.filter(r=>{
  const id=r.status==='manual'||r.status==='documented'?key(r.lemma||head(r.entry))+'|'+r.entry+'|'+r.meaning:'?'+(r.identity||r.form);
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
// Clasificación compartida por el glosario del examen y el vocabulario por UD.
// Es independiente del sorteo o certificación de paradigmas.
function classifyVocabularyEntry(item,course='lat1'){
 const entry=String(typeof item==='string'?item:item?.entry||'').trim();
 const first=entry.split(',')[0].trim();
 const norm=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'')
  .replace(/æ/gi,'ae').replace(/ς/g,'σ').toLowerCase();
 const lemma=norm(first),label=norm(entry);
 const greek=course==='gr1'||course==='greek1';
 if(greek&&(/^ὁ\s*,\s*ἡ\s*,\s*(?:τό|τὸ)/u.test(entry)||/\b(?:art[íi]culo|article)\b/iu.test(entry)))
  return 'articles';
 if(greek&&(/\((?:part\.?|part[íi]cula)\)/iu.test(entry)||
  ['μεν','δε','τε','γε','δη','περ','τοι','ουν','αρα'].includes(lemma)))
  return 'particles';
 const pronouns=greek?
  new Set(['εγω','συ','ημεισ','υμεισ','αυτοσ','ουτοσ','οδε','εκεινοσ',
   'οσ','οστισ','τισ','τι','εμαυτου','σεαυτου','αλληλων','εισ','ουδεισ']):
  new Set(['ego','tu','sui','se','nos','vos','is','hic','ille','iste','ipse',
   'idem','qui','quis','quisque','uterque','quicumque','aliquis','aliqui',
   'quidam','quisquam','quispiam','nemo','nihil','meus','tuus','suus',
   'noster','vester','nostras','vestras']);
 if(/\((?:pron\.?|pronombre|pronom\.?|demostrativo|interrogativo|relativo|anaf[oó]rico|personal|indefinido|f[oó]rico)[^)]*\)/iu.test(entry)||
  pronouns.has(lemma))return 'pronouns';
 if(/\((?:adv\.?|adverbio|conj\.?|conjunci[oó]n|prep\.?|preposici[oó]n|part\.?|interj\.?|interjecci[oó]n)[^)]*\)/iu.test(entry))
  return 'other';
 if(/\((?:[1-4][ªa]|mx\.?|irr\.?|dep\.?|semidep\.?|verbo)[^)]*\)/iu.test(entry))
  return 'verbs';
 if(greek){
  if(/(?:ω|ομαι|μι)(?:\s|$|,)/u.test(first))return 'verbs';
  if(/,\s*[–−-]?(?:α|η)\s*,\s*[–−-]?(?:ον|ο|όv|um)/iu.test(entry)||
   /,\s*[–−-]?(?:ον|όν)\s*$/u.test(entry)||/,\s*[–−-]?(?:εια|εῖα)\s*,/u.test(entry))
   return 'adjectives';
  if(/,/.test(entry))return 'nouns';
  return 'other';
 }
 if(/,\s*[–−-]?(?:a|ra|era)\s*,\s*[–−-]?um\b/iu.test(entry)||
  /,\s*[–−-]?e\b/iu.test(entry)||/\((?:adj\.?|adjetivo)[^)]*\)/iu.test(entry))
  return 'adjectives';
 if(/^[a-z]+(?:o|or)\s*,/i.test(first+',')&&entry.split(',').length>=3)return 'verbs';
 if(entry.includes(','))return 'nouns';
 return 'other';
}
function vocabularyGroups(rows,course,language='es'){
 const labels=language==='va'?[
  ['nouns','Substantius i adjectius'],
  ['verbs','Verbs'],
  ['pronouns','Pronoms'],
  ['other','Adverbis, conjuncions i altres paraules']
 ]:[
  ['nouns','Sustantivos y adjetivos'],
  ['verbs','Verbos'],
  ['pronouns','Pronombres'],
  ['other','Adverbios, conjunciones y otras palabras']
 ];
 const grouped=new Map(labels.map(([key])=>[key,[]]));
 for(const row of rows){
  const kind=classifyVocabularyEntry(row,course);
  const target=kind==='adjectives'?'nouns':
   ['articles','particles'].includes(kind)?'other':kind;
  (grouped.get(target)||grouped.get('other')).push(row);
 }
 return labels.map(([key,label])=>({key,label,rows:grouped.get(key)}))
  .filter(group=>group.rows.length);
}

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
function vocabularyRequiresReview(row){
  return !['manual','documented'].includes(row.status);
 }
 function documentXml(project,externalCandidates=()=>[]){
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
  const pending=vocabularyRequiresReview(row);
  const formatted=formatVocabularyEntry(row,unit.mode,project.course,project.lang||'es')+
   (pending&&row.alternative?' ['+row.form+(row.context?' · '+row.context:'')+']':
    pending&&row.context?' ['+row.context+']':'');
  if(!isLatin)return paragraph(run((pending?'* ':'')+formatted));
  const italicEntry=displayEntry(row.entry,unit.mode);
  if(formatted.startsWith(italicEntry)){
   const suffix=formatted.slice(italicEntry.length);
   // Solo los elementos del enunciado van en cursiva. Todas las
   // indicaciones parentéticas (conjugación, género, régimen, etc.)
   // se componen en redonda incluso cuando forman parte de la ficha.
   let wordRuns='',position=0;
   for(const note of italicEntry.matchAll(/\([^()]*\)/g)){
    if(note.index>position)wordRuns+=run(italicEntry.slice(position,note.index),{italic:true});
    wordRuns+=run(note[0]);
    position=note.index+note[0].length;
   }
   if(position<italicEntry.length)wordRuns+=run(italicEntry.slice(position),{italic:true});
   return paragraph((pending?run('* '):'')+wordRuns+run(suffix));
  }
  return paragraph(run((pending?'* ':'')+formatted));
 };
 // A4, márgenes de 2,5 cm y una columna en todo el documento.
 const layout='<w:pgSz w:w="11906" w:h="16838"/>'+
  '<w:pgMar w:top="1417" w:bottom="1417" w:left="1417" w:right="1417"/>'+
  '<w:cols w:num="1" w:space="0"/>';
 const units=project.units.slice(0,project.count);
 const body=units.map(u=>{
  const all=entries(typeof u.text==='string'&&!u.text.trim()?[]:u.rows||[]);
  const pending=all.filter(vocabularyRequiresReview).flatMap(row=>{
   if(project.wordAlternatives!==true)return [row];
   const readings=new Map();
   for(const candidate of [...(row.candidates||[]),...externalCandidates(row)]){
    if(!candidate.entry)continue;
    const citation=candidate.entry.normalize('NFC');
    if(!readings.has(citation))readings.set(citation,candidate);
   }
   if(!readings.size)return [row];
   return [...readings.values()].map(({entry,lemma,meaning,meaning_va})=>
    ({...row,entry,lemma,meaning:meaning||'',meaning_va,alternative:true}));
  });
  const safe=all.filter(r=>!vocabularyRequiresReview(r));
  const groupedLines=rows=>project.groupTypes===true?
   vocabularyGroups(rows,project.course,project.lang||'es').map(group=>
    p(group.label,true)+group.rows.map(r=>line(r,u)).join('')).join(''):
   rows.map(r=>line(r,u)).join('');
  return p(u.title,true)+groupedLines(safe)+
   (pending.length?p(project.lang==='va'?'Pendents de revisió (*)':'Pendientes de revisión (*)',true)+groupedLines(pending):'');
 }).join('');
 return '<?xml version="1.0" encoding="UTF-8"?>'+
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+
  titleParagraph+body+'<w:sectPr>'+layout+'</w:sectPr></w:body></w:document>';
}
const analysisVersion=5; // Reanalizar con las 12 flexiones verificadas sin perder decisiones docentes.
function needsAnalysis(unit,course){
 return !!unit.text?.trim()&&(unit.analysisVersion!==analysisVersion||
  unit.analyzedCourse!==course||unit.analyzedText!==unit.text);
}
function bankSignature(bank){
 let hash=2166136261;
 const content=JSON.stringify(bank.map(({entry,meaning,meaning_va})=>[entry,meaning,meaning_va]));
 for(let i=0;i<content.length;i++)hash=Math.imul(hash^content.charCodeAt(i),16777619);
 return (hash>>>0).toString(16);
}
function reviewedRows(unit,course,data,bank){
 const decisions=unit.decisions?.[course]||[];
 const byIdentity=new Map(decisions.map(row=>[row.identity,row]));
 const legacy=new Map(decisions.filter(row=>!row.identity).map(row=>[row.form,row]));
 return analyze(data,unit.text,course,bank,{contextual:true}).map(row=>{
  const decision=byIdentity.get(row.identity)||legacy.get(row.form);
  return decision?{...row,...decision,identity:row.identity,form:row.form}:row;
 });
}
function applyLatinEditorialProjectCorrections(project){
 const sources=[];
 if(project?.course==='lat1'&&Array.isArray(project.units))sources.push(project.units);
 if(Array.isArray(project?.workspaces?.lat1?.units))
  sources.push(project.workspaces.lat1.units);
 for(const units of new Set(sources)){
  for(const u of units){
   if(!/^UD\s*10$/iu.test(u.title)||typeof u.text!=='string')continue;
   const revised='Pecunia carere nonnullis philosophis placebat.';
   for(const prior of ['Pecunia carere nonulli philosophi placebat.',
    'Pecunia carere nonnulli philosophi placebat.']){
    if(u.text.includes(prior))u.text=u.text.replaceAll(prior,revised);
   }
  }
 }
}
function migrateProject(project){
 applyLatinEditorialProjectCorrections(project);
 for(const unit of project.units){
  const source=unit.decisions,decisions={};
  for(const course of ['lat1','lat4','gr1']){
   const legacy=course===project.course&&(!unit.analyzedCourse||unit.analyzedCourse===course);
   const rows=Array.isArray(source?.[course])?source[course]:legacy?unit.rows||[]:[];
   decisions[course]=rows.filter(row=>row&&['manual','omitted'].includes(row.status)&&
    typeof row.form==='string'&&typeof row.entry==='string'&&typeof row.meaning==='string')
    .map(({identity,form,status,entry,lemma,meaning,meaning_va,eulexisUnverified})=>
     ({identity,form,status,entry,lemma,meaning,meaning_va,eulexisUnverified}));
  }
  unit.decisions=decisions;
 }
 return project;
}
window.ExaminaVocabulary={analyze,entries,displayEntry,formatVocabularyEntry,documentXml,classifyVocabularyEntry,vocabularyGroups};
function init(){
 const $=id=>document.getElementById(id),storage='examina_vocabulary_project_v1';
 let project={count:1,course:'lat1',lang:'es',units:[]},selected=0;
 try{const saved=JSON.parse(localStorage.getItem(storage));if(saved?.units&&Number.isInteger(saved.count)&&saved.count>=1&&saved.count<=100&&['lat1','lat4','gr1'].includes(saved.course))project=saved}catch{}
 if(!['es','va'].includes(project.lang))project.lang='es';
 const unit=()=>{while(project.units.length<project.count)project.units.push({title:'UD'+(project.units.length+1),text:'',mode:'complete',rows:[],analyzed:false});return project.units[selected]};
 migrateProject(project);
 const stale=u=>needsAnalysis(u,project.course);
 const status=s=>{$('vgStatus').textContent=s};
 const save=()=>{try{localStorage.setItem(storage,JSON.stringify(project))}catch{status('No se pudo guardar en este navegador. Exporta una copia JSON.')}};


 // Eulexis es opcional y local. Una sugerencia nunca valida una flexión.
 let eulexisByForm=new Map(),eulexisAvailable=false;
 const eulexisAdapter=()=>window.ExaminaEulexisLocal;
 function eulexisStatus(message){
  const area=$('vgEulexisStatus');if(area)area.textContent=message;
 }
 async function prepareEulexis(install=false){
  const adapter=eulexisAdapter();
  if(!adapter)throw Error('No se encuentra el módulo Eulexis');
  const data=await linguistic().load();
  const result=install?await adapter.install(data,eulexisStatus):await adapter.load(data);
  const catalog=data.vocabulary?.grc||{},mapped=new Map();
  const teachers=vocab.filter(row=>courseOf(row)==='greek1');
  for(const proposal of result?.rows||[]){
   const entry=catalog[adapter.norm(proposal.lemma)]?.gr1;
   if(!entry?.entry)continue;
   const teacher=teachers.find(row=>row.entry===entry.entry)||
    teachers.find(row=>head(row.entry).normalize('NFC')===head(entry.entry).normalize('NFC')); // Una glosa pendiente no impide consultar la lectura morfológica.
   const form=adapter.norm(proposal.form);
   if(!mapped.has(form))mapped.set(form,new Map());
   const signature=entry.entry+'|'+proposal.analysis;
   if(!mapped.get(form).has(signature))mapped.get(form).set(signature,{
    lemma:proposal.lemma,entry:teacher?.entry||entry.entry,meaning:teacher?.meaning||'',
    meaning_va:teacher?.meaning_va||'',analysis:proposal.analysis,eulexisUnverified:true
   });
  }
  eulexisByForm=new Map([...mapped].map(([form,values])=>[form,[...values.values()]]));
  eulexisAvailable=!!result;
  eulexisStatus(result?.rows?.length?
   'Eulexis disponible: '+result.rows.length+' análisis locales; son propuestas sin verificar.':
   'Eulexis no instalado en este navegador. Se conserva la revisión habitual.');
  render();
 }
 const eulexisInstall=$('vgEulexisInstall'),eulexisRemove=$('vgEulexisRemove');
 if(eulexisInstall)eulexisInstall.onclick=async()=>{
  eulexisInstall.disabled=true;
  try{await prepareEulexis(true)}
  catch(error){eulexisStatus('No se pudo instalar Eulexis: '+error.message)}
  finally{eulexisInstall.disabled=false}
 };
 if(eulexisRemove)eulexisRemove.onclick=async()=>{
  try{await eulexisAdapter().clear();eulexisAvailable=false;eulexisByForm.clear();
   eulexisStatus('Eulexis borrado. Se conservan las decisiones manuales.');render()}
  catch(error){eulexisStatus('No se pudo borrar Eulexis: '+error.message)}
 };

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
 $('vgQualityPanel').addEventListener('toggle',()=>{if($('vgQualityPanel').open&&!qualitySnapshot)refreshQuality()});
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
 function renderUnitButtons(){
  const host=$('vgUnitButtons');if(!host)return;
  host.replaceChildren();
  project.units.slice(0,project.count).forEach((u,i)=>{
   const filled=!!u.text?.trim(),active=i===selected;
   const button=document.createElement('button');button.type='button';button.className='vg-unit-button';
   button.dataset.filled=String(filled);button.setAttribute('aria-pressed',String(active));
   button.setAttribute('aria-label',(u.title||'UD'+(i+1))+' — '+(filled?'con texto':'sin texto')+(active?', seleccionada':''));
   button.title=(filled?'Contiene texto':'Sin texto')+(active?' · Seleccionada':'');
   const dot=document.createElement('span');dot.className='vg-unit-dot';dot.setAttribute('aria-hidden','true');
   const label=document.createElement('span');label.textContent=u.title||'UD'+(i+1);
   button.append(dot,label);
   button.onclick=()=>{selected=i;render()};
   host.append(button);
  });
 }
 function render(){
  unit();$('vgCount').value=project.count;$('vgCourse').value=project.course;$('vgLang').value=project.lang||'es';
  $('vgWordAlternatives').checked=project.wordAlternatives===true;
  $('vgGroupTypes').checked=project.groupTypes===true;
  renderUnitButtons();
  if($('vgEulexisPanel'))$('vgEulexisPanel').hidden=project.course!=='gr1';
  $('vgUnit').replaceChildren(...project.units.slice(0,project.count).map((u,i)=>new Option(u.title,i,false,i===selected)));
  $('vgTitle').value=unit().title;$('vgText').value=unit().text;$('vgMode').value=unit().mode;
  renderReview();
  window.ExaminaValencianGloss?.translateDom?.($('vocabularyGenerator'),project.lang);
 }
 function decide(u,row,choice,decisionStatus){
  u.decisions||={};
  const decisions=u.decisions[project.course]||[];
  const {entry,meaning,meaning_va,lemma,eulexisUnverified}=choice;
  const decision={identity:row.identity,form:row.form,entry,meaning,meaning_va,lemma,
   eulexisUnverified,status:decisionStatus};
  u.decisions[project.course]=decisions.filter(d=>d.identity!==row.identity);
  u.decisions[project.course].push(decision);
  Object.assign(row,decision);
 }
 function record(u,row,choice,decisionStatus){
  decide(u,row,choice,decisionStatus);
  save();render();
  status(row.form+' · '+(decisionStatus==='omitted'?'Omitida del Word.':'Aceptada para Word.'));
 }
 function renderReview(){
  const target=$('vgResults');target.replaceChildren();
  const u=unit(),rows=stale(u)||!u.text.trim()?[]:u.rows;
  const active=project.units.slice(0,project.count).filter(item=>item.text.trim()&&!stale(item));
  const safe=active.flatMap(item=>item.rows.filter(r=>r.safeProposal&&vocabularyRequiresReview(r)&&r.status!=='omitted')
   .map(row=>({unit:item,row})));
  const paragraph=(value)=>{const p=document.createElement('p');p.textContent=value;return p};
  const button=(label,action)=>{
   const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.onclick=action;return b;
  };
  if(safe.length){
   const batch=document.createElement('details'),summary=document.createElement('summary');
   summary.textContent='Propuestas seguras del proyecto ('+safe.length+')';
   batch.append(summary,paragraph('Formas de cita del banco docente. La aceptación incorpora la ficha al Word.'));
   const checks=safe.map(({unit,row})=>{
    const label=document.createElement('label'),check=document.createElement('input');
    check.type='checkbox';check.checked=true;label.className='check';
    label.append(check,document.createTextNode(unit.title+' · '+row.form+' → '+row.candidates[0].entry+
     ' · '+(row.candidates[0].meaning||'Sin traducción registrada')+' · '+row.context));batch.append(label);
    return check;
   });
   batch.append(button('Aceptar propuestas seleccionadas',()=>{
    let accepted=0;
    safe.forEach(({unit,row},i)=>{if(checks[i].checked){decide(unit,row,row.candidates[0],'manual');accepted++}});
    save();render();status(accepted+' propuestas aceptadas para Word.');
   }));
   target.append(batch);
  }
  const pending=rows.filter(r=>vocabularyRequiresReview(r)&&r.status!=='omitted');
  const resolved=rows.filter(r=>!vocabularyRequiresReview(r)||r.status==='omitted');
  const unitsWithPending=project.units.slice(0,project.count).flatMap((item,i)=>{
   if(i===selected||!item.text.trim()||stale(item))return [];
   const count=item.rows.filter(r=>vocabularyRequiresReview(r)&&r.status!=='omitted').length;
   return count?[button(item.title+' · '+count+' pendientes',()=>{selected=i;render()})]:[];
  });
  if(unitsWithPending.length){
   const other=document.createElement('details'),summary=document.createElement('summary');
   summary.textContent='Otras unidades con pendientes ('+unitsWithPending.length+')';
   other.append(summary,...unitsWithPending);target.append(other);
  }
  if(!rows.length)return;
  target.append(paragraph(u.title+' · '+pending.length+' pendientes · '+
   resolved.filter(r=>r.status!=='omitted').length+' listas para Word · '+rows.filter(r=>r.status==='omitted').length+' omitidas'));
  const reviewed=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='Formas resueltas y omitidas ('+resolved.length+')';
  reviewed.append(summary);
  const relatedByForm=new Map();
  for(const item of active){
   for(const row of item.rows){
    if(!vocabularyRequiresReview(row)||row.status==='omitted')continue;
    const form=row.form.normalize('NFC').toLowerCase();
    if(!relatedByForm.has(form))relatedByForm.set(form,[]);
    relatedByForm.get(form).push({unit:item,row});
   }
  }
  for(const row of pending)target.append(reviewCard(u,row,paragraph,button,relatedByForm));
  const resolvedDisplay=project.groupTypes===true?
   [...vocabularyGroups(resolved.filter(row=>row.status!=='omitted'),project.course,project.lang||'es')
    .flatMap(group=>[{groupLabel:group.label},...group.rows]),
    ...resolved.filter(row=>row.status==='omitted')]:resolved;
  for(const row of resolvedDisplay){
   if(row.groupLabel){
    const heading=paragraph(row.groupLabel);heading.className='vm-help';
    heading.style.fontWeight='bold';reviewed.append(heading);continue;
   }
   const detail=document.createElement('details'),title=document.createElement('summary');
   const state={documented:'Identificación automática',manual:'Aceptada para Word',omitted:'Omitida del Word'}[row.status];
   title.textContent=row.form+' · '+state+' · '+formatVocabularyEntry(row,u.mode,project.course,project.lang);
   detail.append(title);
   detail.addEventListener('toggle',()=>{if(detail.open&&detail.children.length===1)detail.append(reviewCard(u,row,paragraph,button))});
   reviewed.append(detail);
  }
  if(resolved.length)target.append(reviewed);
 }
 function externalCandidates(row){
  return project.course==='gr1'&&eulexisAvailable?
   (eulexisByForm.get(eulexisAdapter().norm(row.form))||[]):[];
 }
 function reviewCard(u,row,paragraph,button,relatedByForm){
  const card=document.createElement('section');card.className='vg-eulexis-card';
  const heading=document.createElement('h3');heading.textContent=row.form;
  const context=paragraph(u.title+' · ');
  const text=row.context||row.form,start=row.offset||0,end=start+row.form.length;
  const highlight=document.createElement('mark');highlight.textContent=text.slice(start,end);
  context.append(text.slice(0,start),highlight,text.slice(end));
  context.className='vg-eulexis-context';card.append(heading,context);
  if(vocabularyRequiresReview(row)&&row.status!=='omitted'){
   card.append(paragraph(row.warning||(row.candidates.length>1?'Pendiente: varias lecturas posibles.':'Pendiente de revisión.')));
  }
  const external=externalCandidates(row).slice(0,16);
  const options=[...row.candidates,...external];
  if(options.length){
   const label=document.createElement('label'),select=document.createElement('select');
   label.textContent='Lectura para Word';
   select.append(new Option('Selecciona una lectura…',''));
   options.forEach((candidate,i)=>{
    const gloss=window.ExaminaValencianGloss?.forEntry(candidate,project.lang)?.value||candidate.meaning;
    select.append(new Option(candidate.entry+' · '+(gloss||'Sin traducción registrada')+
     (candidate.eulexisUnverified?' · Eulexis: '+candidate.analysis:' · '+(candidate.origin||'índice morfológico')),i));
   });
   const related=document.createElement('details');
   related.hidden=true;
   const extras=[];
   const accept=button('Aceptar',()=>{
    const chosen=options[Number(select.value)];
    for(const {item,choice,check} of extras){
     if(check.checked)decide(item.unit,item.row,choice,'manual');
    }
    record(u,row,chosen,'manual');
    const count=extras.filter(extra=>extra.check.checked).length;
    if(count)status(row.form+' · '+(count+1)+' apariciones aceptadas para Word.');
   });
   accept.disabled=true;
   select.onchange=()=>{
    accept.disabled=select.value==='';
    extras.length=0;related.replaceChildren();related.hidden=true;
    const chosen=options[Number(select.value)];
    if(!chosen||chosen.eulexisUnverified)return;
    const peers=relatedByForm?.get(row.form.normalize('NFC').toLowerCase())||[];
    for(const item of peers){
     if(item.row===row||item.row.warning!==row.warning)continue;
     const choice=item.row.candidates.find(c=>c.lemma===chosen.lemma&&c.entry===chosen.entry&&
      c.meaning===chosen.meaning&&c.meaning_va===chosen.meaning_va);
     if(!choice)continue;
     const l=document.createElement('label'),check=document.createElement('input');
     l.className='check';check.type='checkbox';
     check.checked=item.row.identity===row.identity;
     l.append(check,document.createTextNode(item.unit.title+' · '+item.row.context));
     extras.push({item,choice,check});related.append(l);
    }
    if(extras.length){
     const summary=document.createElement('summary');
     summary.textContent='Aplicar también a otras apariciones ('+extras.length+')';
     related.prepend(summary);related.open=true;related.hidden=false;
    }
   };
   label.append(select);card.append(label,related,accept);
  }
  if(row.eulexisUnverified||external.length)card.append(paragraph('Eulexis propone lecturas. Aceptar una ficha para Word no acredita la flexión.'));
  card.append(button('Editar',()=>{
   if(card.querySelector('form'))return;
   const form=document.createElement('form');
   const glossField=project.lang==='va'?'meaning_va':'meaning';
   const inputs=[['entry','Enunciado'],[glossField,project.lang==='va'?'Traducció':'Traducción']].map(([field,label])=>{
    const l=document.createElement('label'),input=document.createElement('input');
    l.textContent=label;input.value=row[field]||'';input.required=field==='entry';
    l.append(input);form.append(l);return input;
   });
   const submit=document.createElement('button');submit.type='submit';submit.textContent='Guardar corrección';
   form.append(submit,button('Cancelar',()=>form.remove()));
   form.onsubmit=event=>{
    event.preventDefault();
    const entry=inputs[0].value.trim();if(!entry)return;
    record(u,row,{...row,entry,lemma:head(entry),[glossField]:inputs[1].value.trim()},'manual');
   };
   card.append(form);inputs[0].focus();
  }));
  if(row.status!=='omitted')card.append(button('Omitir',()=>record(u,row,row,'omitted')));
  if(['manual','omitted'].includes(row.status))card.append(button('Restablecer análisis',async()=>{
   u.decisions[project.course]=(u.decisions[project.course]||[]).filter(d=>d.identity!==row.identity&&(d.identity||d.form!==row.form));
   u.analysisVersion=0;save();await analyzeUnits();
  }));
  return card;
 }
 $('vgCount').onchange=()=>{const n=Number($('vgCount').value);if(!Number.isInteger(n)||n<1||n>100){status('Elige entre 1 y 100 unidades.');return}project.count=n;selected=Math.min(selected,n-1);render();save()};
 $('vgUnit').onchange=()=>{selected=Number($('vgUnit').value);render()};
 $('vgWordAlternatives').onchange=()=>{project.wordAlternatives=$('vgWordAlternatives').checked;save()};
 $('vgGroupTypes').onchange=()=>{project.groupTypes=$('vgGroupTypes').checked;save();render()};
 $('vgLang').onchange=()=>{project.lang=$('vgLang').value;render();save()};
 $('vgCourse').onchange=()=>{
  project.course=$('vgCourse').value;qualitySnapshot=null;
  $('vgQualityTotals').textContent='Pulsa «Actualizar auditoría» para consultar el banco.';
  $('vgQualityRows').replaceChildren();$('vgQualityQueue').replaceChildren();
  $('vgQualityQueueSummary').textContent='';
  $('vgReviewUnit').replaceChildren(new Option('Todas las unidades',''));
  save();render();status('Banco cambiado. Analiza el vocabulario para actualizar las lecturas.');
  if($('vgQualityPanel').open)refreshQuality();
  if(project.course==='gr1')prepareEulexis().catch(error=>eulexisStatus(error.message));
 };
 for(const [id,field] of [['vgTitle','title'],['vgText','text'],['vgMode','mode']])$(id).oninput=()=>{
  unit()[field]=$(id).value;
  if(field==='text'){
   $('vgResults').replaceChildren();
   status('Texto modificado. El próximo análisis recuperará las decisiones de los contextos conservados.');
  }
  save();if(field==='mode')render();else renderUnitButtons();
 };
 async function analyzeUnits(){
  const controls=['vgAnalyzeAll','vgWord','vgClearAll','vgImport','vgRestore','vgCourse','vgText','vgCount'].map($);
  controls.forEach(control=>control.disabled=true);status('Analizando…');
  try{
   const data=await linguistic().load();
   const course={lat1:'latin1',lat4:'latin4',gr1:'greek1'}[project.course];
   const bank=vocab.filter(x=>courseOf(x)===course);
   const units=project.units.slice(0,project.count);
   const signature=bankSignature(bank);
   const updates=units.filter(u=>u.text.trim()&&(stale(u)||u.analyzedBank!==signature))
    .map(u=>({u,rows:reviewedRows(u,project.course,data,bank)}));
   for(const {u,rows} of updates)Object.assign(u,{rows,analyzed:true,analysisVersion,
    analyzedText:u.text,analyzedCourse:project.course,analyzedBank:signature});
   save();render();
   const pending=units.filter(u=>u.text.trim()).flatMap(u=>u.rows)
    .filter(r=>vocabularyRequiresReview(r)&&r.status!=='omitted').length;
   status(updates.length+' unidades actualizadas · '+pending+' formas pendientes en el proyecto.');
   return true;
  }catch(e){status('No se pudo analizar: '+e.message);return false}
  finally{controls.forEach(control=>control.disabled=false)}
 }
 $('vgAnalyzeAll').onclick=()=>analyzeUnits();
 $('vgBackup').onclick=()=>downloadBlob('vocabulario-unidades.json',new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));
 $('vgClearAll').onclick=()=>{
  // Solo se vacía ESTE proyecto local; no modificar el banco de vocabulario
  // compartido, las listas exigibles ni los proyectos exportados en JSON.
  const hasWork=project.count!==1||project.units.length>1||project.units.some((u,i)=>
   !!u.text?.trim()||!!u.rows?.length||!!u.analyzed||
   (u.title||'UD'+(i+1))!=='UD'+(i+1)||(u.mode||'complete')!=='complete');
  if(!hasWork){
   status(project.lang==='va'?'El projecte ja està buit.':'El proyecto ya está vacío.');
   return;
  }
  const warning=project.lang==='va'?
   'Esborrar tot el projecte? S’eliminaran els textos, títols, anàlisis i correccions de TOTES les unitats, incloses les ocultes. Es conservaran l’assignatura i l’idioma. Aquesta acció no es pot desfer si no tens una còpia JSON.':
   '¿Limpiar todo el proyecto? Se borrarán los textos, títulos, análisis y correcciones de TODAS las unidades, incluidas las ocultas. Se conservarán la asignatura y el idioma. No podrás deshacerlo sin una copia JSON.';
  if(!window.confirm(warning))return;
  // Reiniciar a una única UD1 vacía y persistir inmediatamente.
  // Mantener la asignatura y el idioma evita cambios inesperados de contexto.
  project={count:1,course:project.course,lang:project.lang,
   units:[{title:'UD1',text:'',mode:'complete',rows:[],analyzed:false}]};
  selected=0;
  save();render();
  status(project.lang==='va'?'Projecte net. Pots començar amb la UD1 o recuperar una còpia JSON.':
   'Proyecto limpiado. Puedes empezar por la UD1 o recuperar una copia JSON.');
 };
 $('vgWord').onclick=async()=>{
  if(!await analyzeUnits())return;
  try{
   const xml=documentXml(project,externalCandidates);
   downloadBlob('vocabulario-unidades.docx',zip([
    ['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml',xml]
   ]));
   const pending=project.units.slice(0,project.count).some(u=>u.text.trim()&&u.rows.some(r=>r.status!=='omitted'&&vocabularyRequiresReview(r)));
  status('Word generado con '+project.count+' unidades.'+(pending?' Las formas pendientes aparecen marcadas con *.':''));
  }catch(e){status('No se ha exportado el Word: '+e.message)}
 };
 $('vgRestore').onclick=()=>$('vgImport').click();
 $('vgImport').onchange=async e=>{if(!e.target.files.length)return;try{const p=JSON.parse(await e.target.files[0].text());if(!Number.isInteger(p.count)||p.count<1||p.count>100||!['lat1','lat4','gr1'].includes(p.course)||!Array.isArray(p.units)||p.units.length<p.count||!p.units.every(u=>typeof u.title==='string'&&typeof u.text==='string'&&['simple','complete'].includes(u.mode)&&Array.isArray(u.rows)&&u.rows.every(r=>typeof r.entry==='string'&&typeof r.meaning==='string'&&typeof r.form==='string'&&Array.isArray(r.candidates))))throw Error('Formato incorrecto');project=migrateProject(p);qualitySnapshot=null;project.lang=['es','va'].includes(p.lang)?p.lang:'es';selected=0;render();save();const pending=project.units.slice(0,project.count).filter(stale).length;status('Proyecto importado: '+project.count+' unidades y textos conservados. '+pending+' por analizar. Puedes pulsar «Analizar y revisar vocabulario» o «Exportar Word» (analizará las pendientes).')}catch(e){status('No se pudo importar: '+e.message)}finally{e.target.value=''}};
 $('vgShow').onclick=()=>{$('examLayout').hidden=true;$('examLayout').style.display='none';$('vocabManager').classList.remove('active');$('vocabularyGenerator').classList.add('active');for(const id of ['vmShowExam','vmShowList'])$(id).classList.remove('active');$('vgShow').classList.add('active');render();if($('vgQualityPanel').open)refreshQuality()};
 for(const id of ['vmShowExam','vmShowList'])$(id).addEventListener('click',()=>{$('vocabularyGenerator').classList.remove('active');$('vgShow').classList.remove('active')});
 render();
 if(project.course==='gr1')prepareEulexis().catch(error=>eulexisStatus('No se pudo abrir Eulexis: '+error.message));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
