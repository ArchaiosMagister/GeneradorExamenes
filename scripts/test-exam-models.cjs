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
 part('function generateLatinMorphologyReference(){','/* El título refleja las unidades');
const greekCode=morphologyHelpers+part('const greekModes=','// Vista del temario:')+
 part('function generateGreekMorphologyFixed(){','let greekExamState=null;')+
 part('function generateGreekExam(){','const legacyUpdateUnits=');

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
  mNoun:x=>x===noun.entry?{lemma:'puella',gender:'f',forms:[
    ['puella','puella','puellam','puellae','puellae','puella'],
    ['puellae','puellae','puellas','puellarum','puellis','puellis']
  ]}:null,
  adjective:x=>x.entry===adj.entry?{forms:['bonus','bona'],labels:['nom. masc sg','nom. fem sg']}:null,
  verb:x=>x.entry===vb.entry?{forms:['amo','amas','amat','amamus','amatis','amant'],labels:['1sg','2sg','3sg','1pl','2pl','3pl']}:null,
  latinSharedBank:null,
  culture:Array.from({length:4},(_,i)=>({course:'latin4',units:['UD3'],type:'essay',question:'Cultura '+i,answer:'Respuesta '+i})),
  latinExamHeader:()=>'<div class="exam-header">Latín</div>',
  buildFinalLexicon:()=>'<div class="final-gloss">Vocabulario de oraciones</div>',
  refreshManualMorphWords:()=>{},generateGreekExam:()=>{},syncLatin1PhoneticRuleControls:()=>{},
  morphConfig:()=>({offer:3,decline:2,verbs:2,words:5}),
  examQuestionEnabled:kind=>kind!=='pronouns'||state.model.value==='morf',
  stickyExamRows:(_kind,create)=>create(),
  examQuotaPick:(_groups,_n,defaultPick)=>defaultPick(),
  examMorphQuotasActive:()=>false,
  examMorphQuotaCount:()=>0,
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
 assert(output.includes('bonus, -a, -um + puella, -ae'),'Latín I desde UD2: falta el enunciado completo de adjetivo y sustantivo');
 assert(output.includes('Modificación preverbial')&&output.includes('Latinismos'),'Latín I: las cuatro partes del léxico deben estar disponibles');
 assert(output.includes('final-gloss'));
 assert.equal((output.match(/Puella amat \d+\./g)||[]).length,5);
 assert(output.includes('exam-sentences'),'Las oraciones latinas carecen de estilo para espaciado');
 assert(!output.includes('<div class="answer"></div>'),'Las oraciones latinas todavía contienen líneas de respuesta');
 assert(!output.includes('Cultura 0'),'Cultura no se incluye en Latín I');
 state.model.value='mixto';state['count-sent'].value=7;output=run();
 assert.equal((output.match(/class="exam-question"/g)||[]).length,3,'Traducción: formas, léxico y oraciones');
 assert(!output.includes('exam-nouns')&&!output.includes('exam-verbs'));
 assert.equal((output.match(/Puella amat \d+\./g)||[]).length,7);
 assert(output.includes('final-gloss'));
 state.model.value='morf';vm.runInContext('generateLatinMorphologyReference()',sandbox);
 output=state.paper.innerHTML.split('<div id="answerkey"')[0];
 assert.equal((output.match(/class="exam-question"/g)||[]).length,4,'Latín I UD3: pronombres como tercera pregunta');
 assert(output.includes('exam-pronouns')&&output.includes('palabras variables'));
 assert(output.includes('Declina 2 de los 3 sintagmas propuestos.'),'Latín: enunciado dinámico de sintagmas');
 assert(!output.includes('Elige y declina')&&!output.includes('class="small">Elige'),'Latín: subtítulo duplicado');
 assert(output.includes('(sustantivo) + (adjetivo)'));
 assert(output.includes('(puella, -ae)'),'Latín: falta el enunciado al lado de la forma');
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
 assert.equal((output.match(/Puella amat \d+\./g)||[]).length,4);
 sandbox.culture.length=0;output=run();
 assert.equal((output.match(/class="exam-question"/g)||[]).length,5,'Sin banco de cultura no debe exportarse una pregunta vacía');
 assert(output.includes('Banco de cultura pendiente de completar'));
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
 // Una oración griega añadida por el docente se ofrece en el banco,
 // y los lemas que el índice no reconoce quedan señalados.
 sandbox.sentences=[{course:'greek1',text:'ὁ δοῦλος λέγει.',sol:'[TRADUCCIÓN PENDIENTE]',
  units:['UD7'],teacherProvided:true}];
 sandbox.courseOf=x=>x.course||'latin1';
 sandbox.greekSharedBank={lookup:()=>null};
 state['count-sent'].value=12;
 output=run('translation');
 assert(output.includes('ὁ δοῦλος λέγει.'),'La oración griega importada no llegó al examen');
 assert(output.includes('revisa el vocabulario'),'La oración griega sin lematización necesita revisión');
 output=run('morphology');
 assert.equal((output.match(/class="exam-question"/g)||[]).length,4,'Griego UD7: pronombres');
 assert(output.includes('exam-pronouns')&&output.includes('palabras variables'));
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
