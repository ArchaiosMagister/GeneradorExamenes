import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(start,end){
 const p=html.indexOf(start),q=html.indexOf(end,p+start.length);
 assert(p>=0&&q>p,'No se encuentra la sección: '+start);
 return html.slice(p,q);
}
const plans=JSON.parse(new Function(extract('const EXAM_COMPOSITION=','function examComposition(')+
 'return JSON.stringify(EXAM_COMPOSITION)')());
assert.deepEqual(Object.keys(plans.latin4),['tablas']);
assert.equal(plans.latin4.tablas.lexicalParts,2);
assert.equal(plans.latin4.tablas.cultureParts,4);
assert.equal(plans.latin4.tablas.sentences,4);
assert.equal(plans.latin1.tablas.lexicalParts,3);
assert.equal(plans.latin1.tablas.sentences,5);
assert.equal(plans.latin1.mixto.lexicalParts,3);
assert.equal(plans.latin1.mixto.sentences,7);
assert.equal(plans.greek1.complete.sentences,5);
assert.equal(plans.greek1.translation.sentences,7);
const shared=extract('const EXAM_COMPOSITION=','function generateLatinMorphologyReference(){');
const latinMorph=extract('function generateLatinMorphologyReference(){','/* El título refleja');
const latinGen=extract('function generate(){','let culture=[];');
const fixtures=String.raw`
const nouns=Array.from({length:5},(_,i)=>({entry:'rosa'+i+', -ae',unit:'UD1',meaning:'flor'+i}));
const verbs=[{entry:'amo, amavi, amatum (1ª)',unit:'UD1',meaning:'amar'}];
const adjectives=[{entry:'bonus, -a, -um',unit:'UD2',meaning:'bueno'}];
const bank=[...nouns,...verbs,...adjectives,...Array.from({length:20},(_,i)=>({entry:'lemma'+i+', -i',unit:'UD1',meaning:'palabra'+i}))];
const forms12=[['rosa','rosa','rosam','rosae','rosae','rosa'],['rosae','rosae','rosas','rosarum','rosis','rosis']];
const state={model:{value:'tablas'},lang:{value:'es'},paper:{innerHTML:'',setAttribute(){}},solutions:{textContent:''},cultureType:{value:'all'}};
for(const id of ['morphCategory-n','morphCategory-adj','morphCategory-pro'])state[id]={checked:true};
const $=id=>state[id]||{value:'',checked:true};
let course='latin1',chosen=['UD1','UD2','UD3'],counts={decl:2,verb:2,forms:8,lex:3,sent:5};
const currentCourse=()=>course,selectedUnits=()=>chosen,countFor=id=>counts[id]||2;
const examUnitNumber=x=>+(String(x).match(/\d+/)?.[0]||0);
const esc=x=>String(x),tr=x=>x,normLex=x=>String(x).toLowerCase(),examKey=x=>x.split(',')[0].toLowerCase();
const sample=(a,n)=>a.slice(0,n),isProperNounLemma=()=>false,refreshManualMorphWords=()=>{};
const greekExamHeader=()=>'',latinExamHeader=()=>'<header>Latín</header>';
const buildFinalLexicon=(...args)=>{if(args[5]!==true)throw Error('Vocabulario final no forzado');return '<h3>Vocabulario</h3>'};
const generateGreekExam=()=>{throw Error('Rama griega imprevista')};
const mNoun=e=>e.startsWith('rosa')?{forms:forms12}:null;
const latinSharedBank={vocabulary:()=>bank,
 paradigms:(c,u,kind)=>{
  const xs=kind==='noun'?nouns:kind==='adjective'?adjectives:kind==='verb'?verbs:[];
  return xs.map(x=>({x,p:{forms:kind==='verb'?['amo','amas','amat','amamus','amatis','amant']:['rosa','rosae'],
   labels:kind==='verb'?['1 sg','2 sg','3 sg','1 pl','2 pl','3 pl']:['nominativo singular','genitivo singular']}}));
 },
 sentences:c=>Array.from({length:7},(_,i)=>({text:'Rosa amat '+i+'.',sol:'La rosa ama.'}))};
const culture=Array.from({length:3},(_,i)=>({course:'latin4',units:['UD1'],type:'essay',
 question:'Pregunta cultural '+i,answer:'Respuesta '+i}));
const morphConfig=()=>({offer:3,decline:2,verbs:5,words:5});
`;
const outputs=new Function(fixtures+shared+latinMorph+latinGen+String.raw`
const results={};
for(const [c,m,count] of [['latin4','tablas',4],['latin1','tablas',5],['latin1','mixto',7]]){
 course=c;state.model.value=m;counts.sent=count;generate();
 const page=state.paper.innerHTML;
 results[c+'-'+m]={sections:(page.match(/class="exam-question"/g)||[]).length,
  hasMorph:page.includes('Analiza morfológicamente las siguientes formas'),
  hasLexC:page.includes('c. Relaciona'),
  hasCultureD:page.includes('<strong>d.</strong>'),
  hasVocabulary:page.includes('<h3>Vocabulario</h3>'),
  hasSentences:page.includes('Rosa amat 0.')};
}
course='latin1';state.model.value='morf';generate();
results.morph={sections:(state.paper.innerHTML.match(/class="exam-question"/g)||[]).length,
 hasPronouns:state.paper.innerHTML.includes('Analiza los pronombres'),
 hasFour:state.paper.innerHTML.includes('4. Analiza morfológicamente')};
return results;
`)();
assert.equal(outputs['latin4-tablas'].sections,6);
assert.equal(outputs['latin4-tablas'].hasCultureD,true);
assert.equal(outputs['latin4-tablas'].hasLexC,false);
assert.equal(outputs['latin1-tablas'].sections,5);
assert.equal(outputs['latin1-tablas'].hasLexC,true);
assert.equal(outputs['latin1-mixto'].sections,3);
assert.equal(outputs['latin1-mixto'].hasMorph,true);
assert.equal(outputs['latin1-mixto'].hasSentences,true);
for(const result of Object.values(outputs))if('hasVocabulary'in result)assert(result.hasVocabulary);
assert.equal(outputs.morph.sections,4);
assert.equal(outputs.morph.hasPronouns,true);
assert.equal(outputs.morph.hasFour,true);
assert(html.includes("translation:{es:'3 · Examen de traducción',va:'3 · Examen de traducció',points:[0,0,2,0,1,7]}"));
assert(html.includes('const pronouns=limit>=7?'));
assert(html.includes("const relevant=model==='mixto'||model==='translation'?['forms','lex','sent']"));
console.log('Composición de exámenes validada: Latín 4.º, Latín I (3 modelos) y esquema de Griego I.');
