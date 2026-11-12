const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function part(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Fragmento no encontrado: '+start);
 return html.slice(a,b);
}
const morphologyHelpers=part('/* Editable syntagm slots;','function generateLatinMorphologyReference(){');
const latinCode=part('const latinPronounRows=','let culture=')+morphologyHelpers+
 part('function generateLatinMorphologyReference(){','/* El título refleja las unidades')+
 part('function mVerb(','function mTable(');
const greekCode=morphologyHelpers+part('const greekModes=','// Vista del temario:')+
 part('function generateGreekMorphologyFixed(){','let greekExamState=null;')+
 part('function generateGreekExam(){','const legacyUpdateUnits=');

const sentenceList=vm.runInNewContext(part('function sentenceList(','function sentenceGlossary(')+
 'sentenceList',{$:()=>({value:'es'}),esc:String});
const sentenceGlossary=()=>'<div class="final-gloss">Vocabulario de oraciones</div>';
function latinSuite(){
 const noun={entry:'puella, -ae',meaning:'niña',unit:'UD3'};
 const adj={entry:'bonus, -a, -um',meaning:'bueno',unit:'UD2'};
 const vb={entry:'amo, amavi, amatum (1ª)',meaning:'amar',unit:'UD3'};
 const state={model:{value:'tablas'},lang:{value:'es'},paper:{innerHTML:'',setAttribute(){}},
  solutions:{textContent:''},cultureType:{value:'all'},
  'count-decl':{value:2},'count-verb':{value:2},'count-forms':{value:6},'count-sent':{value:5}};
 const scope={course:'latin1',units:['UD3']};
 const sandbox={
  $:id=>state[id]||(state[id]={value:'',checked:true}),
  currentCourse:()=>scope.course,selectedUnits:()=>scope.units,
  sample:(a,n)=>a.slice(0,n),countFor:id=>Number(state['count-'+id]?.value)||5,
  window:{},document:{getElementById:()=>null},tr:x=>x,esc:x=>String(x),normLex:x=>String(x).toLowerCase(),
  examKey:x=>String(x).split(',')[0].toLowerCase(),
  examUnitNumber:x=>Number(String(x).replace('UD','')),
  M_CASES:['Nominativo','Vocativo','Acusativo','Genitivo','Dativo','Ablativo'],
  M_END:{'1':[['a','a','am','ae','ae','a'],['ae','ae','as','arum','is','is']],
    '2m':[['us','e','um','i','o','o'],['i','i','os','orum','is','is']],
    '2n':[['um','um','um','i','o','o'],['a','a','a','orum','is','is']]},
  mNormalize:x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(),
  headLex:x=>String(x||'').split(',')[0].trim(),
  isProperNounLemma:()=>false,isExcludedExamMorphLemma:()=>false,
  mNoun:x=>x===noun.entry?{lemma:'puella',kind:'1',gender:'f',forms:[
    ['puella','puella','puellam','puellae','puellae','puella'],
    ['puellae','puellae','puellas','puellarum','puellis','puellis']
  ]}:null,
  adjective:x=>x.entry===adj.entry?{forms:['bonus','bona'],labels:['nom. masc sg','nom. fem sg']}:null,
  verb:x=>x.entry===vb.entry?{forms:['amo','amas','amat','amamus','amatis','amant'],labels:['1sg','2sg','3sg','1pl','2pl','3pl']}:null,
  latinSharedBank:null,
  culture:Array.from({length:4},(_,i)=>({course:'latin4',units:['UD3'],type:'essay',question:'Cultura '+i,answer:'Respuesta '+i})),
  latinExamHeader:()=>'<div class="exam-header">Latín</div>',
  sentenceList,sentenceGlossary,sentenceLines:()=>[],
  refreshManualMorphWords:()=>{},generateGreekExam:()=>{},syncLatin1PhoneticRuleControls:()=>{},
  morphConfig:()=>({offer:3,decline:2,verbs:2,words:5}),
  examQuestionEnabled:kind=>kind!=='pronouns'||state.model.value==='morf',
  stickyExamRows:(_kind,create)=>create(),
  examQuotaPick:(_groups,_n,defaultPick)=>defaultPick(),
  examMorphQuotasActive:()=>false,
  examMorphQuotaCount:()=>0,
  examSelectedLexParts:()=>['preverbs','phonetics','prefixes','latinisms'],
  buildLatinLexQuestion:course=>({
    html:course==='latin1'?'<p class="exam-item">a. Modificación preverbial · b. Evolución fonética · c. Prefijos · d. Latinismos</p>':
      '<p class="exam-item">a. Prefijos · b. Evolución fonética</p>',
    solution:'<ol></ol>'
  })
 };
 sandbox.latinSharedBank={
  vocabulary:()=>[noun,adj,vb],
  paradigms:()=>[{x:vb,p:sandbox.verb(vb)}],
  sentences:()=>Array.from({length:9},(_,i)=>({text:'Puella amat '+i+'.',sol:'La niña ama '+i+'.'}))
 };
 vm.createContext(sandbox);vm.runInContext(latinCode,sandbox,{filename:'latin-exams.js'});
 const run=()=>{vm.runInContext('generate()',sandbox);return state.paper.innerHTML.split('<div id="answerkey"')[0]};
 let output=run();
 assert.equal((output.match(/class="exam-question"/g)||[]).length,5,'Latín I completo: cinco preguntas');
 assert(output.includes('exam-nouns')&&output.includes('exam-verbs'));
 assert(output.includes('bonus, –a, –um + puella, –æ'),'Latín I desde UD2: falta el enunciado completo de adjetivo y sustantivo');
 assert(output.includes('Modificación preverbial')&&output.includes('Latinismos'),'Latín I: las cuatro partes del léxico deben estar disponibles');
 assert(output.includes('final-gloss'));
 assert.equal((output.match(/data-sentence-slot=/g)||[]).length,5);
 assert(!output.includes('Puella amat'),'El banco no rellena los huecos');
 assert(output.includes('exam-sentences'),'Las oraciones latinas carecen de estilo para espaciado');
 assert(!output.includes('<div class="answer"></div>'),'Las oraciones latinas todavía contienen líneas de respuesta');
 assert(!output.includes('Cultura 0'),'Cultura no se incluye en Latín I');
 state.model.value='mixto';state['count-sent'].value=7;output=run();
 assert.equal((output.match(/class="exam-question"/g)||[]).length,3,'Traducción: formas, léxico y oraciones');
 assert(!output.includes('exam-nouns')&&!output.includes('exam-verbs'));
 assert.equal((output.match(/data-sentence-slot=/g)||[]).length,7);
 assert(output.includes('final-gloss'));
 sandbox.sentenceLines=()=>['Puella amat.','','Rosam portat.'];
 output=run();
 assert.equal((output.match(/data-sentence-slot=/g)||[]).length,7);
 assert.match(output,/data-sentence-slot="0"[^>]*>Puella amat\./);
 assert.match(output,/data-sentence-slot="1"[^>]*><\/i>/);
 assert.match(output,/data-sentence-slot="2"[^>]*>Rosam portat\./);
 sandbox.sentenceLines=()=>[];
 state.model.value='morf';vm.runInContext('generateLatinMorphologyReference()',sandbox);
 output=state.paper.innerHTML.split('<div id="answerkey"')[0];
 assert.equal((output.match(/class="exam-question"/g)||[]).length,4,'Latín I UD3: pronombres como tercera pregunta');
 assert(output.includes('exam-pronouns')&&output.includes('Analiza morfológicamente las siguientes palabras (1 p.).'));
 assert(output.includes('Declina 2 de los 3 sintagmas propuestos.'),'Latín: enunciado dinámico de sintagmas');
 assert(!output.includes('Elige y declina')&&!output.includes('class="small">Elige'),'Latín: subtítulo duplicado');
 assert(output.includes('(sustantivo) + (adjetivo)'));
 assert(output.includes('(<i>puella, –æ</i>)'),'Latín: falta el enunciado al lado de la forma');
 // El perfecto no se pide hasta UD4; conjugación siempre en redonda y
 // dentro de un único paréntesis exterior, también en modelos no morfológicos.
 const morphologyMarkup=(category,entry,units)=>vm.runInContext(
  'latinMorphologyEnunciationHtml('+JSON.stringify({category,entry})+','+JSON.stringify(units)+')',sandbox);
 assert.equal(morphologyMarkup('verbs','duco, duxi, ductum (3ª)',['UD3']),' (<i>duco</i>, 3ª)');
 assert.equal(morphologyMarkup('verbs','duco, duxi, ductum (3ª)',['UD4']),' (<i>duco, duxi, ductum</i>, 3ª)');
 assert.equal(morphologyMarkup('verbs','duco, duxi, ductum (3ª)',['UD2','UD4']),' (<i>duco, duxi, ductum</i>, 3ª)');
 assert.equal(morphologyMarkup('verbs','capio, cepi, captum (mx.)',['UD3']),' (<i>capio</i>, mx.)');
 assert.equal(morphologyMarkup('verbs','sum, fui, – (irr.)',['UD3']),' (<i>sum</i>, irr.)');
 assert.equal(morphologyMarkup('verbs','amo, amavi, amatum (1ª)',['UD4']),' (<i>amo, amavi, amatum</i>, 1ª)');
 assert.equal(morphologyMarkup('verbs','invenio, inveni, inventum',['UD4']),' (<i>invenio, inveni, inventum</i>)');
 assert.equal(morphologyMarkup('nouns','puella, –æ',['UD3']),' (<i>puella, –æ</i>)');
 assert.match(output,/\(<i>amo<\/i>, 1ª\)/,'Latín UD3: enunciado verbal en examen de morfología');
 // No basta con verificar la lista de palabras: la PRUEBA 2 de morfología
 // debe incluir los lemas de cada fila de la tabla verbal y ambas voces desde UD3.
 const verbTable=output.match(/class="exam-paradigm reference-morph-table reference-verb-table"[^]*?<\/table>/)?.[0]||'';
 assert(verbTable.includes('(<i>amo</i>, 1ª)'),'La tabla de verbos debe mostrar el enunciado al lado de cada forma');
 assert(verbTable.includes('<i>amor</i>')&&verbTable.includes('<i>amo</i>'),
  'Desde UD3 debe seleccionar al menos un verbo pasivo y uno activo');
 const poolFor=units=>Array.from(vm.runInContext(
  'latinMorphologyVerbPool('+JSON.stringify(units)+')',sandbox));
 const ud2=poolFor(['UD2']),ud3=poolFor(['UD3']),
  ud4=poolFor(['UD4']),ud7=poolFor(['UD7']);
 assert(ud2.length>0&&ud2.every(x=>x.voice==='activa'&&!/^(?:futuro|perfecto|pluscuamperfecto) de indicativo$/.test(x.tense)),
  'UD2 debe contener presente e imperfecto activos, no pasivos');
 assert(ud2.some(x=>x.tense==='imperfecto de indicativo'));
 assert(ud3.some(x=>x.form==='amatur'&&x.voice==='pasiva'&&x.tense==='presente de indicativo'));
 assert(ud3.some(x=>x.form==='amabatur'&&x.voice==='pasiva'&&x.tense==='imperfecto de indicativo'));
 assert(ud3.every(x=>!/^(?:futuro|perfecto|pluscuamperfecto) de indicativo$/.test(x.tense)));
 assert(ud4.some(x=>x.form==='amavit'&&x.tense==='perfecto de indicativo'));
 assert(ud4.some(x=>x.form==='amaverat'&&x.tense==='pluscuamperfecto de indicativo'));
 assert(ud7.some(x=>x.form==='amabitur'&&x.voice==='pasiva'&&x.tense==='futuro de indicativo'));
 // Una misma forma ambigua nunca debe recibir dos tiempos posibles.
 const identical=ud7.filter(x=>x.entry==='amo, amavi, amatum (1ª)'&&x.form==='amatur');
 assert.equal(identical.length,1);
 // UD9 introduce el perfectum pasivo, nunca UD8.
 const ud8=poolFor(['UD8']),ud9=poolFor(['UD9']),
  ud10=poolFor(['UD10']),udCombined=poolFor(['UD9–10']);
 const isCompoundPassive=item=>item.voice==='pasiva'&&
  /^(?:perfecto|pluscuamperfecto) de indicativo$/.test(item.tense);
 assert(ud8.every(x=>!isCompoundPassive(x)),'UD8: perfectum pasivo adelantado');
 assert(ud9.some(isCompoundPassive)&&ud10.some(isCompoundPassive)&&udCombined.some(isCompoundPassive),
  'UD9, UD10 y UD9–10 deben incorporar el perfectum pasivo');
 const expected=[
  ['amatus sum','perfecto de indicativo','masculino','1.ª persona singular'],
  ['amatus est','perfecto de indicativo','masculino','3.ª persona singular'],
  ['amata est','perfecto de indicativo','femenino','3.ª persona singular'],
  ['amatum est','perfecto de indicativo','neutro','3.ª persona singular'],
  ['amati sunt','perfecto de indicativo','masculino','3.ª persona plural'],
  ['amatae sunt','perfecto de indicativo','femenino','3.ª persona plural'],
  ['amata sunt','perfecto de indicativo','neutro','3.ª persona plural'],
  ['amatus erat','pluscuamperfecto de indicativo','masculino','3.ª persona singular'],
  ['amatae erant','pluscuamperfecto de indicativo','femenino','3.ª persona plural']
 ];
 for(const [form,tense,gender,person] of expected){
  assert(ud9.some(x=>x.form===form&&x.entry===vb.entry&&
   x.tense===tense&&x.voice==='pasiva'&&x.participleGender===gender&&x.person===person),
   'UD9: forma compuesta incorrecta '+form);
 }
 const genders={masculino:['us','i'],femenino:['a','ae'],neutro:['um','a']};
 const auxPerfect=['sum','es','est','sumus','estis','sunt'],
  auxPluperfect=['eram','eras','erat','eramus','eratis','erant'];
 const persons=['1.ª persona singular','2.ª persona singular','3.ª persona singular',
  '1.ª persona plural','2.ª persona plural','3.ª persona plural'];
 for(const row of ud9.filter(isCompoundPassive)){
  const [participle,aux]=row.form.split(' ');
  const i=persons.indexOf(row.person);
  assert(i>=0,'Perfectum pasivo sin persona y número válidos');
  assert(participle.endsWith(genders[row.participleGender][i>=3?1:0]),
   'Concordancia incorrecta del participio: '+row.form);
  assert.equal(aux,(row.tense==='perfecto de indicativo'?auxPerfect:auxPluperfect)[i],
   'Auxiliar incorrecto: '+row.form);
 }
 // Con 3 filas, los dos tiempos pasivos nuevos y una activa son obligatorios.
 scope.units=['UD9'];
 const selected=Array.from(vm.runInContext(
  'latinMorphologyVerbSelection(latinMorphologyVerbPool(["UD9"]),3)',sandbox));
 assert.equal(selected.length,3);
 assert(selected.some(x=>x.tense==='perfecto de indicativo'&&x.voice==='pasiva'));
 assert(selected.some(x=>x.tense==='pluscuamperfecto de indicativo'&&x.voice==='pasiva'));
 assert(selected.some(x=>x.voice==='activa'));
 scope.units=['UD3'];


 assert.equal(vm.runInContext("latinExamSurface('reginae','regina, –æ')",sandbox),'reginæ');
 assert.equal(vm.runInContext("latinExamSurface('poeta','poeta, –æ')",sandbox),'poeta');
 assert.equal(vm.runInContext("latinExamSurface('poetae','poeta, –æ')",sandbox),'poetæ');
 assert.equal(vm.runInContext("latinExamSurface('proelium','prœlium, –i')",sandbox),'prœlium');
 assert.equal(vm.runInContext("latinExamSurface('proelia','prœlium, –i')",sandbox),'prœlia');
 scope.units=['UD1'];vm.runInContext('generateLatinMorphologyReference()',sandbox);
 output=state.paper.innerHTML.split('<div id="answerkey"')[0];
 assert.equal((output.match(/class="exam-question"/g)||[]).length,3,'UD1: sin pronombres');
 scope.course='latin4';scope.units=['UD3'];state.model.value='tablas';state['count-sent'].value=4;output=run();
 assert.equal((output.match(/class="exam-question"/g)||[]).length,6,'Latín 4: seis apartados');
 assert.equal((output.match(/Cultura \d/g)||[]).length,4,'Latín 4: cuatro preguntas de cultura');
 assert(output.includes('Prefijos')&&output.includes('Evolución fonética'),'Latín 4: dos partes léxicas');
 assert.equal((output.match(/data-sentence-slot=/g)||[]).length,4);
 sandbox.culture.length=0;output=run();
 assert.equal((output.match(/class="exam-question"/g)||[]).length,5,'Sin banco de cultura no debe exportarse una pregunta vacía');
 assert(output.includes('No hay preguntas de cultura del tipo elegido en las unidades marcadas'));
}
function greekSuite(){
 const state={model:{value:'complete'},lang:{value:'es'},paper:{innerHTML:'',setAttribute(){}},
  solutions:{textContent:''},greekCoverage:{textContent:''},autoGloss:{checked:true},
  'count-decl':{value:2},'count-verb':{value:8},'count-lex':{value:3},'count-sent':{value:5}};
 const rows=[
  {id:'n',kind:'declension',minUnit:1,contentUnits:[1],verified:true,prompt:'λόγος',answer:'λόγος; λόγου',lemmas:['λόγος'],table:{rows:[['Nom','λόγος','λόγοι']]}},
  {id:'v',kind:'conjugation',minUnit:2,contentUnits:[2],verified:true,prompt:'λύω',answer:'λύω; λύεις',lemmas:['λύω'],table:{rows:[['1ª','λύω','λύομεν'],['2ª','λύεις','λύετε'],['3ª','λύει','λύουσι']]}},
  {id:'f',kind:'forms',minUnit:2,contentUnits:[2],verified:true,prompt:'λύεις',answer:'2.ª persona singular del presente de indicativo activo',lemmas:['λύω']},
  {id:'pf',kind:'forms',minUnit:7,contentUnits:[7],verified:true,prompt:'οἵδε',answer:'Pronombre demostrativo: nominativo plural masculino',lemmas:[]},
  {id:'p',kind:'pronouns',minUnit:7,contentUnits:[7],verified:true,prompt:'οἵδε',answer:'Nominativo plural masculino; demostrativo',lemmas:[]},
  {id:'e',kind:'etymology',minUnit:1,contentUnits:[1],verified:true,prompt:'λόγος',answer:'lógica, logopedia',lemmas:['λόγος']},
  ...Array.from({length:8},(_,i)=>({id:'s'+i,kind:'sentences',minUnit:2,contentUnits:[2],verified:true,prompt:'ὁ ἄνθρωπος λέγει '+i+'.',answer:'El hombre habla. Análisis: sujeto y verbo.',lemmas:['λόγος']}))
 ];
 const scope={limit:7};
 const sandbox={
  $:id=>state[id]||(state[id]={checked:true,value:''}),
  sample:(a,n)=>a.slice(0,n),countFor:id=>Number(state['count-'+id]?.value)||5,
  sentenceList,sentenceGlossary,sentenceLines:()=>[],
  greekVerifiedCorpus:rows,greekMorphologyEligible:(x,n)=>x.minUnit<=n,
  // En este test sintético no hay banco nominal ni diccionario de adjetivos.
  greekAvailableSyntagmAdjectives:()=>[],greekSyntagmNounGenders:{},
  isProperNounLemma:()=>false,isExcludedExamMorphLemma:()=>false,greekMarkedUnits:()=>['UD7'],greekLimit:()=>scope.limit,
  examUnitNumber:x=>Number(String(x).replace('UD','')),
  morphConfig:()=>({offer:3,decline:1,verbs:3,words:5}),
  greekSelectedItems:(pool,chosen,counts)=>({items:pool.filter(x=>pool.filter(y=>y.kind===x.kind).indexOf(x)<(counts[x.kind]||0)),covered:[7],missing:[]}),
  greekPoints:kind=>Number(state['greek-points-'+kind].value),
  greekTable:()=>'<table class="exam-nouns"></table>',greekVerbTable:()=>'<table class="exam-verbs"></table>',
  greekExamHeader:()=>'<div class="exam-header">Griego</div>',
  greekQuestionLabel:kind=>({declension:'Declina',conjugation:'Conjuga',forms:'Analiza',pronouns:'Pronombres',etymology:'Etimología',sentences:'Traduce'}[kind]),
  greekLemma:head=>({entry:head,meaning:'palabra'}),examKey:x=>x,
  localizedGloss:row=>({value:row.meaning,ready:!!row.meaning}),
  glossAccept:()=>true,isRequired:()=>false,quoteGloss:x=>"'"+x+"'",esc:x=>String(x),tr:x=>x,document:{getElementById:()=>null},
  greekExamControls:()=>{},refreshManualMorphWords:()=>{},window:{},
  examQuestionEnabled:kind=>kind!=='pronouns'||state.model.value==='morphology',
  stickyExamRows:(_kind,create)=>create(),
  examMorphQuotasActive:()=>false,
  examMorphQuotaCount:()=>0,
  examQuotaGreek:(pool,count)=>pool.slice(0,count)
 };
 vm.createContext(sandbox);vm.runInContext(greekCode,sandbox,{filename:'greek-exams.js'});
 const modes=vm.runInContext('greekModes',sandbox),kinds=vm.runInContext('greekKinds',sandbox);
 const run=mode=>{
  state.model.value=mode;
  kinds.forEach((kind,i)=>state['greek-points-'+kind]={value:modes[mode].points[i]});
  vm.runInContext('generateGreekExam()',sandbox);
  return state.paper.innerHTML.split('<div id="answerkey"')[0];
 };
 let output=run('complete');
 assert.equal((output.match(/class="exam-question/g)||[]).length,5,'Griego completo: cinco apartados');
 assert(output.includes('final-gloss'));
 output=run('translation');
 assert.equal((output.match(/class="exam-question/g)||[]).length,3,'Griego traducción: formas, etimología y oraciones');
 assert(!output.includes('exam-nouns')&&!output.includes('exam-verbs'));
 assert(output.includes('final-gloss'),'Griego traducción debe llevar vocabulario de las oraciones');
 assert.equal(sandbox.window.greekLastExam.total,10);
 assert(!output.includes('ὁ ἄνθρωπος λέγει'),'Griego tampoco rellena el examen desde el banco');
 sandbox.sentenceLines=()=>['ὁ δοῦλος λέγει.'];
 state['count-sent'].value=12;
 output=run('translation');
 assert.match(output,/data-sentence-slot="0"[^>]*>ὁ δοῦλος λέγει\./);
 assert.match(output,/data-sentence-slot="11"[^>]*><\/span>/);
 output=run('morphology');
 assert.equal((output.match(/class="exam-question"/g)||[]).length,4,'Griego UD7: pronombres');
 assert(output.includes('exam-pronouns')&&output.includes('Analiza morfológicamente las siguientes palabras (1 p.).'));
 assert(output.includes('Declina 1 de los 3 sintagmas propuestos.'),'Griego: enunciado dinámico');
 assert(!output.includes('Tria i declina')&&!output.includes('Elige y declina'),'Griego: subtítulo duplicado');
 assert(output.includes('(artículo) + (sustantivo) + (adjetivo)'));
 assert(output.includes('(λύω)'),'Griego: falta enunciado del verbo en análisis');
 assert(!output.includes('οἵδε ()'),'Griego: no inventar lema para formas sin enunciado');
}
latinSuite();greekSuite();
assert(html.indexOf('<nav class="vocab-tabbar"')<html.indexOf('<header class="top">'),
 'La barra de generadores debe estar antes que la cabecera de selectores');
assert(html.includes("course==='latin4'?['tablas']"),'Latín 4 solamente tiene el modelo completo');
assert(html.includes("const alphabetic=tag==='ol'"),'Word debe conservar listas a–d');
assert(html.includes('class="small no-print"'),'Los avisos docentes no deben salir en impresión');
console.log('Exámenes comprobados: Latín 4 completo; Latín I completo, morfología y traducción; Griego I completo, morfología y traducción.');
