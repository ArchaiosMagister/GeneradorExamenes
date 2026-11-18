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
 // Oraciones revisadas individualmente: no se usan plantillas automáticas.
 // Las raíces de la clave siguen el orden de las dos palabras subrayadas.
 const reviewedSentences=[
 {
  "id": "teocracia",
  "es": [
   "La ",
   "antropología",
   " analiza cómo se organizaba el poder en una ",
   "teocracia",
   "."
  ],
  "va": [
   "L’",
   "antropologia",
   " analitza com s’organitzava el poder en una ",
   "teocràcia",
   "."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "θεός",
    "κράτος"
   ]
  ]
 },
 {
  "id": "grafologia",
  "es": [
   "En una ",
   "democracia",
   ", la ",
   "grafología",
   " no puede utilizarse para identificar votos secretos."
  ],
  "va": [
   "En una ",
   "democràcia",
   ", la ",
   "grafologia",
   " no es pot utilitzar per a identificar vots secrets."
  ],
  "roots": [
   [
    "δήμος",
    "κράτος"
   ],
   [
    "γράφω",
    "λόγος"
   ]
  ]
 },
 {
  "id": "xilografia",
  "es": [
   "Una ",
   "xilografía",
   " antigua ilustraba el libro de ",
   "antropología",
   "."
  ],
  "va": [
   "Una ",
   "xilografia",
   " antiga il·lustrava el llibre d’",
   "antropologia",
   "."
  ],
  "roots": [
   [
    "ξύλον",
    "γράφω"
   ],
   [
    "ἄνθρωπος",
    "λόγος"
   ]
  ]
 },
 {
  "id": "cronologia",
  "es": [
   "La ",
   "bibliografía",
   " permitió establecer la ",
   "cronología",
   " de los hechos históricos."
  ],
  "va": [
   "La ",
   "bibliografia",
   " va permetre establir la ",
   "cronologia",
   " dels fets històrics."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "χρόνος",
    "λόγος"
   ]
  ]
 },
 {
  "id": "biografia",
  "es": [
   "La ",
   "biografía",
   " de la investigadora recoge sus descubrimientos en ",
   "zoología",
   "."
  ],
  "va": [
   "La ",
   "biografia",
   " de la investigadora arreplega els seus descobriments en ",
   "zoologia",
   "."
  ],
  "roots": [
   [
    "βίος",
    "γράφω"
   ],
   [
    "ζῷον",
    "λόγος"
   ]
  ]
 },
 {
  "id": "biologia",
  "es": [
   "La ",
   "biología",
   " estudia los seres vivos, mientras que la ",
   "demografía",
   " analiza las poblaciones."
  ],
  "va": [
   "La ",
   "biologia",
   " estudia els éssers vius, mentre que la ",
   "demografia",
   " analitza les poblacions."
  ],
  "roots": [
   [
    "βίος",
    "λόγος"
   ],
   [
    "δήμος",
    "γράφω"
   ]
  ]
 },
 {
  "id": "ergonomia",
  "es": [
   "La ",
   "bibliografía",
   " del proyecto incluye estudios sobre ",
   "ergonomía",
   " en las aulas."
  ],
  "va": [
   "La ",
   "bibliografia",
   " del projecte inclou estudis sobre ",
   "ergonomia",
   " a les aules."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ἔργον",
    "νόμος"
   ]
  ]
 },
 {
  "id": "xilofono",
  "es": [
   "La ",
   "bibliografía",
   " musical contiene un estudio sobre el ",
   "xilófono",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " musical conté un estudi sobre el ",
   "xilòfon",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ξύλον",
    "φωνή"
   ]
  ]
 },
 {
  "id": "ecologia",
  "es": [
   "La ",
   "bibliografía",
   " del curso de ",
   "ecología",
   " se ha actualizado este año."
  ],
  "va": [
   "La ",
   "bibliografia",
   " del curs d’",
   "ecologia",
   " s’ha actualitzat enguany."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "οἰκία",
    "λόγος"
   ]
  ]
 },
 {
  "id": "fonologia",
  "es": [
   "La ",
   "demografía",
   " estudia cuántas personas hablan una lengua y la ",
   "fonología",
   " analiza sus sonidos."
  ],
  "va": [
   "La ",
   "demografia",
   " estudia quantes persones parlen una llengua i la ",
   "fonologia",
   " n’analitza els sons."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "φωνή",
    "λόγος"
   ]
  ]
 },
 {
  "id": "anacronismo",
  "es": [
   "La ",
   "bibliografía",
   " permitió detectar un ",
   "anacronismo",
   " en la novela histórica."
  ],
  "va": [
   "La ",
   "bibliografia",
   " va permetre detectar un ",
   "anacronisme",
   " en la novel·la històrica."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ἀνά",
    "χρόνος"
   ]
  ]
 },
 {
  "id": "antibiotico",
  "es": [
   "El manual de ",
   "zoología",
   " explica el uso de un ",
   "antibiótico",
   " en medicina veterinaria."
  ],
  "va": [
   "El manual de ",
   "zoologia",
   " explica l’ús d’un ",
   "antibiòtic",
   " en medicina veterinària."
  ],
  "roots": [
   [
    "ζῷον",
    "λόγος"
   ],
   [
    "ἀντί",
    "βίος"
   ]
  ]
 },
 {
  "id": "dialogo",
  "es": [
   "Un ",
   "diálogo",
   " entre especialistas permitió aclarar los datos de ",
   "demografía",
   "."
  ],
  "va": [
   "Un ",
   "diàleg",
   " entre especialistes va permetre aclarir les dades de ",
   "demografia",
   "."
  ],
  "roots": [
   [
    "διά",
    "λόγος"
   ],
   [
    "δήμος",
    "γράφω"
   ]
  ]
 },
 {
  "id": "entusiasmo",
  "es": [
   "Las clases de ",
   "antropología",
   " despertaron un gran ",
   "entusiasmo",
   " entre los estudiantes."
  ],
  "va": [
   "Les classes d’",
   "antropologia",
   " van despertar un gran ",
   "entusiasme",
   " entre els estudiants."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "ἐν",
    "θεός"
   ]
  ]
 },
 {
  "id": "catalogo",
  "es": [
   "El ",
   "catálogo",
   " de la biblioteca ayuda a preparar la ",
   "bibliografía",
   " del trabajo."
  ],
  "va": [
   "El ",
   "catàleg",
   " de la biblioteca ajuda a preparar la ",
   "bibliografia",
   " del treball."
  ],
  "roots": [
   [
    "κατά",
    "λόγος"
   ],
   [
    "βιβλίον",
    "γράφω"
   ]
  ]
 },
 {
  "id": "diacronia",
  "es": [
   "La ",
   "bibliografía",
   " de lingüística incluye investigaciones sobre ",
   "diacronía",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " de lingüística inclou investigacions sobre ",
   "diacronia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "διά",
    "χρόνος"
   ]
  ]
 },
 {
  "id": "megafono",
  "es": [
   "La conferencia de ",
   "antropología",
   " se retransmitió por el ",
   "megáfono",
   " del patio."
  ],
  "va": [
   "La conferència d’",
   "antropologia",
   " es va retransmetre pel ",
   "megàfon",
   " del pati."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "μέγας",
    "φωνή"
   ]
  ]
 },
 {
  "id": "microbio",
  "es": [
   "La ",
   "bibliografía",
   " científica explica cómo se transmite un ",
   "microbio",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " científica explica com es transmet un ",
   "microbi",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "μικρός",
    "βίος"
   ]
  ]
 },
 {
  "id": "macrobiotico",
  "es": [
   "La ",
   "bibliografía",
   " del estudio incluía investigaciones sobre la dieta ",
   "macrobiótico",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " de l’estudi incloïa investigacions sobre la dieta ",
   "macrobiòtic",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "μακρός",
    "βίος"
   ]
  ]
 },
 {
  "id": "politeismo",
  "es": [
   "La ",
   "bibliografía",
   " de historia de las religiones dedica un capítulo al ",
   "politeísmo",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " d’història de les religions dedica un capítol al ",
   "politeisme",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "πολύς",
    "θεός"
   ]
  ]
 },
 {
  "id": "caligrafia",
  "es": [
   "El manuscrito de ",
   "teología",
   " destacaba por su cuidada ",
   "caligrafía",
   "."
  ],
  "va": [
   "El manuscrit de ",
   "teologia",
   " destacava per la seua ",
   "cal·ligrafia",
   " acurada."
  ],
  "roots": [
   [
    "θεός",
    "λόγος"
   ],
   [
    "καλός",
    "γράφω"
   ]
  ]
 },
 {
  "id": "cacofonia",
  "es": [
   "El orador corrigió una ",
   "cacofonía",
   " en su discurso sobre la ",
   "democracia",
   "."
  ],
  "va": [
   "L’orador va corregir una ",
   "cacofonia",
   " en el discurs sobre la ",
   "democràcia",
   "."
  ],
  "roots": [
   [
    "κακός",
    "φωνή"
   ],
   [
    "δήμος",
    "κράτος"
   ]
  ]
 },
 {
  "id": "tanatologia",
  "es": [
   "La ",
   "bibliografía",
   " sobre cuidados paliativos incluye estudios de ",
   "tanatología",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " sobre cures pal·liatives inclou estudis de ",
   "tanatologia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "θάνατος",
    "λόγος"
   ]
  ]
 },
 {
  "id": "metafora",
  "es": [
   "La ",
   "teología",
   " utiliza a menudo una ",
   "metáfora",
   " para explicar conceptos abstractos."
  ],
  "va": [
   "La ",
   "teologia",
   " utilitza sovint una ",
   "metàfora",
   " per a explicar conceptes abstractes."
  ],
  "roots": [
   [
    "θεός",
    "λόγος"
   ],
   [
    "μετά",
    "φέρω"
   ]
  ]
 },
 {
  "id": "periferia",
  "es": [
   "La ",
   "zoología",
   " estudia especies que habitan en la ",
   "periferia",
   " de la ciudad."
  ],
  "va": [
   "La ",
   "zoologia",
   " estudia espècies que habiten a la ",
   "perifèria",
   " de la ciutat."
  ],
  "roots": [
   [
    "ζῷον",
    "λόγος"
   ],
   [
    "περί",
    "φέρω"
   ]
  ]
 },
 {
  "id": "demagogia",
  "es": [
   "La ",
   "bibliografía",
   " de ciencias políticas distingue la ",
   "demagogia",
   " de la argumentación."
  ],
  "va": [
   "La ",
   "bibliografia",
   " de ciències polítiques distingix la ",
   "demagògia",
   " de l’argumentació."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "δήμος",
    "ἄγω"
   ]
  ]
 },
 {
  "id": "arcangel",
  "es": [
   "En ",
   "teología",
   " se estudia la figura del ",
   "arcángel",
   " Miguel."
  ],
  "va": [
   "En ",
   "teologia",
   " s’estudia la figura de l’",
   "arcàngel",
   " Miquel."
  ],
  "roots": [
   [
    "θεός",
    "λόγος"
   ],
   [
    "ἀρχή",
    "ἀγγέλλω"
   ]
  ]
 },
 {
  "id": "geografia",
  "es": [
   "La ",
   "geografía",
   " y la ",
   "zoología",
   " se complementan al estudiar la distribución de las especies."
  ],
  "va": [
   "La ",
   "geografia",
   " i la ",
   "zoologia",
   " es complementen en l’estudi de la distribució de les espècies."
  ],
  "roots": [
   [
    "γῆ",
    "γράφω"
   ],
   [
    "ζῷον",
    "λόγος"
   ]
  ]
 },
 {
  "id": "geologia",
  "es": [
   "La ",
   "geología",
   " y la ",
   "demografía",
   " aportan datos diferentes para planificar el territorio."
  ],
  "va": [
   "La ",
   "geologia",
   " i la ",
   "demografia",
   " aporten dades diferents per a planificar el territori."
  ],
  "roots": [
   [
    "γῆ",
    "λόγος"
   ],
   [
    "δήμος",
    "γράφω"
   ]
  ]
 },
 {
  "id": "hidrofobia",
  "es": [
   "Un manual de ",
   "zoología",
   " explica por qué la rabia puede causar ",
   "hidrofobia",
   "."
  ],
  "va": [
   "Un manual de ",
   "zoologia",
   " explica per què la ràbia pot causar ",
   "hidrofòbia",
   "."
  ],
  "roots": [
   [
    "ζῷον",
    "λόγος"
   ],
   [
    "ὕδωρ",
    "φόβος"
   ]
  ]
 },
 {
  "id": "hidrologia",
  "es": [
   "La ",
   "bibliografía",
   " sobre ",
   "hidrología",
   " incluye mapas de ríos y acuíferos."
  ],
  "va": [
   "La ",
   "bibliografia",
   " sobre ",
   "hidrologia",
   " inclou mapes de rius i aqüífers."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ὕδωρ",
    "λόγος"
   ]
  ]
 },
 {
  "id": "filantropia",
  "es": [
   "El ensayo de ",
   "teología",
   " reflexionaba sobre la ",
   "filantropía",
   " y la solidaridad."
  ],
  "va": [
   "L’assaig de ",
   "teologia",
   " reflexionava sobre la ",
   "filantropia",
   " i la solidaritat."
  ],
  "roots": [
   [
    "θεός",
    "λόγος"
   ],
   [
    "φίλος",
    "ἄνθρωπος"
   ]
  ]
 },
 {
  "id": "apogeo",
  "es": [
   "Los datos de ",
   "demografía",
   " ayudan a estudiar el ",
   "apogeo",
   " de una ciudad antigua."
  ],
  "va": [
   "Les dades de ",
   "demografia",
   " ajuden a estudiar l’",
   "apogeu",
   " d’una ciutat antiga."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "ἀπό",
    "γῆ"
   ]
  ]
 },
 {
  "id": "hidrografia",
  "es": [
   "La ",
   "antropología",
   " estudia cómo la ",
   "hidrografía",
   " condiciona los asentamientos humanos."
  ],
  "va": [
   "L’",
   "antropologia",
   " estudia com la ",
   "hidrografia",
   " condiciona els assentaments humans."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "ὕδωρ",
    "γράφω"
   ]
  ]
 },
 {
  "id": "autonomia",
  "es": [
   "La ",
   "teología",
   " moral reflexiona sobre la ",
   "autonomía",
   " de las personas."
  ],
  "va": [
   "La ",
   "teologia",
   " moral reflexiona sobre l’",
   "autonomia",
   " de les persones."
  ],
  "roots": [
   [
    "θεός",
    "λόγος"
   ],
   [
    "αὐτός",
    "νόμος"
   ]
  ]
 },
 {
  "id": "autografo",
  "es": [
   "El autor del tratado de ",
   "zoología",
   " firmó un ",
   "autógrafo",
   " para la biblioteca."
  ],
  "va": [
   "L’autor del tractat de ",
   "zoologia",
   " va firmar un ",
   "autògraf",
   " per a la biblioteca."
  ],
  "roots": [
   [
    "ζῷον",
    "λόγος"
   ],
   [
    "αὐτός",
    "γράφω"
   ]
  ]
 },
 {
  "id": "dendrologia",
  "es": [
   "La ",
   "bibliografía",
   " forestal reúne estudios de ",
   "dendrología",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " forestal reunix estudis de ",
   "dendrologia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "δένδρον",
    "λόγος"
   ]
  ]
 },
 {
  "id": "talasocracia",
  "es": [
   "La ",
   "antropología",
   " analiza la organización de algunas antiguas ",
   "talasocracia",
   "."
  ],
  "va": [
   "L’",
   "antropologia",
   " analitza l’organització d’algunes antigues ",
   "talassocràcia",
   "."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "θάλαττα",
    "κράτος"
   ]
  ]
 },
 {
  "id": "metodo",
  "es": [
   "El debate sobre la ",
   "democracia",
   " siguió un ",
   "método",
   " riguroso."
  ],
  "va": [
   "El debat sobre la ",
   "democràcia",
   " va seguir un ",
   "mètode",
   " rigorós."
  ],
  "roots": [
   [
    "δήμος",
    "κράτος"
   ],
   [
    "μετά",
    "ὁδός"
   ]
  ]
 },
 {
  "id": "exodo",
  "es": [
   "La ",
   "antropología",
   " investigó las causas del ",
   "éxodo",
   " rural de la región."
  ],
  "va": [
   "L’",
   "antropologia",
   " va investigar les causes de l’",
   "èxode",
   " rural de la regió."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "ἐξ",
    "ὁδός"
   ]
  ]
 },
 {
  "id": "heliopolis",
  "es": [
   "La ",
   "bibliografía",
   " de historia antigua incluye una investigación sobre ",
   "Heliópolis",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " d’història antiga inclou una investigació sobre ",
   "Heliòpolis",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ἥλιος",
    "πόλις"
   ]
  ]
 },
 {
  "id": "pedagogia",
  "es": [
   "La ",
   "demografía",
   " ayuda a planificar las plazas escolares y la ",
   "pedagogía",
   " orienta la enseñanza."
  ],
  "va": [
   "La ",
   "demografia",
   " ajuda a planificar les places escolars i la ",
   "pedagogia",
   " orienta l’ensenyament."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "παῖς",
    "ἄγω"
   ]
  ]
 },
 {
  "id": "plutocracia",
  "es": [
   "La ",
   "antropología",
   " examina las relaciones sociales de una ",
   "plutocracia",
   "."
  ],
  "va": [
   "L’",
   "antropologia",
   " examina les relacions socials d’una ",
   "plutocràcia",
   "."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "πλοῦτος",
    "κράτος"
   ]
  ]
 },
 {
  "id": "dermatologia",
  "es": [
   "La ",
   "bibliografía",
   " de ",
   "dermatología",
   " incluye guías sobre las alergias cutáneas."
  ],
  "va": [
   "La ",
   "bibliografia",
   " de ",
   "dermatologia",
   " inclou guies sobre les al·lèrgies cutànies."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "δέρμα",
    "λόγος"
   ]
  ]
 },
 {
  "id": "iconografia",
  "es": [
   "La ",
   "iconografía",
   " medieval representaba animales estudiados hoy por la ",
   "zoología",
   "."
  ],
  "va": [
   "La ",
   "iconografia",
   " medieval representava animals estudiats hui per la ",
   "zoologia",
   "."
  ],
  "roots": [
   [
    "εἰκών",
    "γράφω"
   ],
   [
    "ζῷον",
    "λόγος"
   ]
  ]
 },
 {
  "id": "gerontologia",
  "es": [
   "La ",
   "bibliografía",
   " sobre ",
   "gerontología",
   " estudia las consecuencias del envejecimiento."
  ],
  "va": [
   "La ",
   "bibliografia",
   " sobre ",
   "gerontologia",
   " estudia les conseqüències de l’envelliment."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "γέρων",
    "λόγος"
   ]
  ]
 },
 {
  "id": "neumologia",
  "es": [
   "La ",
   "demografía",
   " sanitaria ayuda a planificar los servicios de ",
   "neumología",
   "."
  ],
  "va": [
   "La ",
   "demografia",
   " sanitària ajuda a planificar els servicis de ",
   "pneumologia",
   "."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "πνεῦμα",
    "λόγος"
   ]
  ]
 },
 {
  "id": "androgino",
  "es": [
   "La ",
   "antropología",
   " estudia las representaciones culturales del ser ",
   "andrógino",
   "."
  ],
  "va": [
   "L’",
   "antropologia",
   " estudia les representacions culturals de l’ésser ",
   "andrògin",
   "."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "ἀνήρ",
    "γυνή"
   ]
  ]
 },
 {
  "id": "ginecologia",
  "es": [
   "La ",
   "bibliografía",
   " de ",
   "ginecología",
   " incluye investigaciones sobre prevención."
  ],
  "va": [
   "La ",
   "bibliografia",
   " de ",
   "ginecologia",
   " inclou investigacions sobre prevenció."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "γυνή",
    "λόγος"
   ]
  ]
 },
 {
  "id": "hematologia",
  "es": [
   "La ",
   "demografía",
   " sanitaria ayuda a dimensionar las consultas de ",
   "hematología",
   "."
  ],
  "va": [
   "La ",
   "demografia",
   " sanitària ajuda a dimensionar les consultes d’",
   "hematologia",
   "."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "αἷμα",
    "λόγος"
   ]
  ]
 },
 {
  "id": "hepatologia",
  "es": [
   "La ",
   "bibliografía",
   " médica incorpora un estudio de ",
   "hepatología",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " mèdica incorpora un estudi d’",
   "hepatologia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ἧπαρ",
    "λόγος"
   ]
  ]
 },
 {
  "id": "encefalo",
  "es": [
   "La ",
   "teología",
   " y la neurociencia debaten sobre la relación entre el ",
   "encéfalo",
   " y la conciencia."
  ],
  "va": [
   "La ",
   "teologia",
   " i la neurociència debaten sobre la relació entre l’",
   "encèfal",
   " i la consciència."
  ],
  "roots": [
   [
    "θεός",
    "λόγος"
   ],
   [
    "ἐν",
    "κεφαλή"
   ]
  ]
 },
 {
  "id": "laringologia",
  "es": [
   "La ",
   "bibliografía",
   " médica describe los avances de la ",
   "laringología",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " mèdica descriu els avanços de la ",
   "laringologia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "λάρυγξ",
    "λόγος"
   ]
  ]
 },
 {
  "id": "osteologia",
  "es": [
   "La ",
   "osteología",
   " ayuda a interpretar esqueletos antiguos y la ",
   "demografía",
   " reconstruye su población."
  ],
  "va": [
   "La ",
   "osteologia",
   " ajuda a interpretar esquelets antics i la ",
   "demografia",
   " en reconstruïx la població."
  ],
  "roots": [
   [
    "ὀστέον",
    "λόγος"
   ],
   [
    "δήμος",
    "γράφω"
   ]
  ]
 },
 {
  "id": "oftalmologia",
  "es": [
   "La ",
   "demografía",
   " del envejecimiento ayuda a prever las consultas de ",
   "oftalmología",
   "."
  ],
  "va": [
   "La ",
   "demografia",
   " de l’envelliment ajuda a preveure les consultes d’",
   "oftalmologia",
   "."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "ὀφθαλμός",
    "λόγος"
   ]
  ]
 },
 {
  "id": "quirografia",
  "es": [
   "La ",
   "antropología",
   " estudia los manuscritos antiguos y el uso histórico de la ",
   "quirografía",
   "."
  ],
  "va": [
   "L’",
   "antropologia",
   " estudia els manuscrits antics i l’ús històric de la ",
   "quirografia",
   "."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "χείρ",
    "γράφω"
   ]
  ]
 },
 {
  "id": "blefaroplastia",
  "es": [
   "La ",
   "bibliografía",
   " quirúrgica describe en qué consiste la ",
   "blefaroplastia",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " quirúrgica descriu en què consistix la ",
   "blefaroplàstia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "βλέφαρον",
    "πλαστός"
   ]
  ]
 },
 {
  "id": "dermatitis",
  "es": [
   "La ",
   "antropología",
   " médica estudia las prácticas culturales para tratar la ",
   "dermatitis",
   "."
  ],
  "va": [
   "L’",
   "antropologia",
   " mèdica estudia les pràctiques culturals per a tractar la ",
   "dermatitis",
   "."
  ],
  "roots": [
   [
    "ἄνθρωπος",
    "λόγος"
   ],
   [
    "δέρμα",
    "−ῖτις"
   ]
  ]
 },
 {
  "id": "otitis",
  "es": [
   "La ",
   "bibliografía",
   " pediátrica explica cómo prevenir la ",
   "otitis",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " pediàtrica explica com previndre l’",
   "otitis",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "οὖς",
    "−ῖτις"
   ]
  ]
 },
 {
  "id": "anatomia",
  "es": [
   "La ",
   "bibliografía",
   " del curso incluye un atlas de ",
   "anatomía",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " del curs inclou un atles d’",
   "anatomia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ἀνά",
    "τομή"
   ]
  ]
 },
 {
  "id": "gastritis",
  "es": [
   "La ",
   "bibliografía",
   " médica explica la diferencia entre ",
   "gastritis",
   " y úlcera."
  ],
  "va": [
   "La ",
   "bibliografia",
   " mèdica explica la diferència entre ",
   "gastritis",
   " i úlcera."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "γάστηρ",
    "−ῖτις"
   ]
  ]
 },
 {
  "id": "megalomania",
  "es": [
   "Un ensayo de ",
   "teología",
   " criticaba la ",
   "megalomanía",
   " de los gobernantes."
  ],
  "va": [
   "Un assaig de ",
   "teologia",
   " criticava la ",
   "megalomania",
   " dels governants."
  ],
  "roots": [
   [
    "θεός",
    "λόγος"
   ],
   [
    "μέγας",
    "μανία"
   ]
  ]
 },
 {
  "id": "misogino",
  "es": [
   "La ",
   "bibliografía",
   " del curso incluye un ensayo sobre un discurso ",
   "misógino",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " del curs inclou un assaig sobre un discurs ",
   "misogin",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "μισέω",
    "γυνή"
   ]
  ]
 },
 {
  "id": "misantropo",
  "es": [
   "La ",
   "bibliografía",
   " literaria dedica un capítulo a un personaje ",
   "misántropo",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " literària dedica un capítol a un personatge ",
   "misantrop",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "μισέω",
    "ἄνθρωπος"
   ]
  ]
 },
 {
  "id": "cefalalgia",
  "es": [
   "La ",
   "bibliografía",
   " médica explica que la ",
   "cefalalgia",
   " es un dolor de cabeza."
  ],
  "va": [
   "La ",
   "bibliografia",
   " mèdica explica que la ",
   "cefalàlgia",
   " és un mal de cap."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "κεφαλή",
    "ἄλγος"
   ]
  ]
 },
 {
  "id": "poliglota",
  "es": [
   "La ",
   "demografía",
   " registra cuántas lenguas habla una población ",
   "políglota",
   "."
  ],
  "va": [
   "La ",
   "demografia",
   " registra quantes llengües parla una població ",
   "políglot",
   "."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "πολύς",
    "γλῶττα"
   ]
  ]
 },
 {
  "id": "criptografia",
  "es": [
   "La ",
   "criptografía",
   " protege la seguridad del voto electrónico en una ",
   "democracia",
   "."
  ],
  "va": [
   "La ",
   "criptografia",
   " protegix la seguretat del vot electrònic en una ",
   "democràcia",
   "."
  ],
  "roots": [
   [
    "κρύπτω",
    "γράφω"
   ],
   [
    "δήμος",
    "κράτος"
   ]
  ]
 },
 {
  "id": "monologo",
  "es": [
   "El actor representó un ",
   "monólogo",
   " satírico sobre la ",
   "democracia",
   "."
  ],
  "va": [
   "L’actor va representar un ",
   "monòleg",
   " satíric sobre la ",
   "democràcia",
   "."
  ],
  "roots": [
   [
    "μόνος",
    "λόγος"
   ],
   [
    "δήμος",
    "κράτος"
   ]
  ]
 },
 {
  "id": "microscopio",
  "es": [
   "En ",
   "zoología",
   " se utiliza el ",
   "microscopio",
   " para observar tejidos animales."
  ],
  "va": [
   "En ",
   "zoologia",
   " s’utilitza el ",
   "microscopi",
   " per a observar teixits animals."
  ],
  "roots": [
   [
    "ζῷον",
    "λόγος"
   ],
   [
    "μικρός",
    "σκοπέω"
   ]
  ]
 },
 {
  "id": "cromosoma",
  "es": [
   "Un ",
   "cromosoma",
   " aporta información genética útil para la ",
   "antropología",
   " biológica."
  ],
  "va": [
   "Un ",
   "cromosoma",
   " aporta informació genètica útil per a l’",
   "antropologia",
   " biològica."
  ],
  "roots": [
   [
    "χρῶμα",
    "σῶμα"
   ],
   [
    "ἄνθρωπος",
    "λόγος"
   ]
  ]
 },
 {
  "id": "cosmologia",
  "es": [
   "La ",
   "bibliografía",
   " de astronomía reúne investigaciones de ",
   "cosmología",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " d’astronomia reunix investigacions de ",
   "cosmologia",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "κόσμος",
    "λόγος"
   ]
  ]
 },
 {
  "id": "aforismo",
  "es": [
   "Un ",
   "aforismo",
   " sobre la ",
   "democracia",
   " presidía la primera página del ensayo."
  ],
  "va": [
   "Un ",
   "aforisme",
   " sobre la ",
   "democràcia",
   " presidia la primera pàgina de l’assaig."
  ],
  "roots": [
   [
    "ἀπό",
    "ὅρος"
   ],
   [
    "δήμος",
    "κράτος"
   ]
  ]
 },
 {
  "id": "macrocosmos",
  "es": [
   "La ",
   "bibliografía",
   " filosófica examina la idea del ",
   "macrocosmos",
   "."
  ],
  "va": [
   "La ",
   "bibliografia",
   " filosòfica examina la idea del ",
   "macrocosmos",
   "."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "μακρός",
    "κόσμος"
   ]
  ]
 },
 {
  "id": "gastroscopia",
  "es": [
   "La ",
   "demografía",
   " sanitaria ayuda a planificar las unidades de ",
   "gastroscopia",
   "."
  ],
  "va": [
   "La ",
   "demografia",
   " sanitària ajuda a planificar les unitats de ",
   "gastroscòpia",
   "."
  ],
  "roots": [
   [
    "δήμος",
    "γράφω"
   ],
   [
    "γάστηρ",
    "σκοπέω"
   ]
  ]
 },
 {
  "id": "monografia",
  "es": [
   "La investigadora publicó una ",
   "monografía",
   " sobre ",
   "zoología",
   " marina."
  ],
  "va": [
   "La investigadora va publicar una ",
   "monografia",
   " sobre ",
   "zoologia",
   " marina."
  ],
  "roots": [
   [
    "μόνος",
    "γράφω"
   ],
   [
    "ζῷον",
    "λόγος"
   ]
  ]
 },
 {
  "id": "policromia",
  "es": [
   "La ",
   "zoología",
   " estudia la ",
   "policromía",
   " de algunas especies de peces."
  ],
  "va": [
   "La ",
   "zoologia",
   " estudia la ",
   "policromia",
   " d’algunes espècies de peixos."
  ],
  "roots": [
   [
    "ζῷον",
    "λόγος"
   ],
   [
    "πολύς",
    "χρῶμα"
   ]
  ]
 },
 {
  "id": "isocronia",
  "es": [
   "La ",
   "bibliografía",
   " de física explica la ",
   "isocronía",
   " de ciertos movimientos."
  ],
  "va": [
   "La ",
   "bibliografia",
   " de física explica la ",
   "isocronia",
   " de determinats moviments."
  ],
  "roots": [
   [
    "βιβλίον",
    "γράφω"
   ],
   [
    "ἴσος",
    "χρόνος"
   ]
  ]
 },
 {
  "id": "monoteismo",
  "es": [
   "El ensayo distinguía entre ",
   "monoteísmo",
   " y ",
   "democracia",
   ": una creencia religiosa y una forma de gobierno."
  ],
  "va": [
   "L’assaig distingia entre ",
   "monoteisme",
   " i ",
   "democràcia",
   ": una creença religiosa i una forma de govern."
  ],
  "roots": [
   [
    "μόνος",
    "θεός"
   ],
   [
    "δήμος",
    "κράτος"
   ]
  ]
 },
 {
  "id": "autodidacta",
  "es": [
   "La bióloga ",
   "autodidacta",
   " escribió un manual de ",
   "zoología",
   "."
  ],
  "va": [
   "La biòloga ",
   "autodidacta",
   " va escriure un manual de ",
   "zoologia",
   "."
  ],
  "roots": [
   [
    "αὐτός",
    "διδάσκω"
   ],
   [
    "ζῷον",
    "λόγος"
   ]
  ]
 }
];
 records.push(...reviewedSentences.map(x=>({...x,id:'cobertura-'+x.id})));
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
