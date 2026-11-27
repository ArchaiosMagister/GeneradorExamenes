const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

for(const filename of ['index.html','offline.html']){
 const html=fs.readFileSync(path.join(__dirname,'..',filename),'utf8');
 const start=html.indexOf('function regenerateExamQuestion(kind){');
 const end=html.indexOf('function examSelectedLexParts(course){',start);
 assert(start>=0&&end>start,filename+': falta el controlador de regeneración');
 const source=html.slice(start,end);
 function scenario({course='latin1',model='tablas',kind='forms',enabled=true,third=false,greekState=null,success=false}={}){
  const previous=[{id:'original'}],other=[{id:'otra pregunta'}],previousThird=[{id:'tercera'}];
  const cache=new Map([[kind,previous],['other',other],['latin-third-declension',previousThird]]);
  const calls={global:0,isolated:0,greek:0};
  const field={value:'sintagma editado'};
  const sandbox={
   examQuestionEnabled:()=>enabled,latin4NominalKinds:[],
   currentCourse:()=>course,$:id=>id==='model'?{value:model}:field,
   examCacheSignature:k=>k,examSelectionCache:cache,latinThirdDeclensionAvailable:()=>third,
   greekExamState:greekState,greekRegenerate:()=>{calls.greek++;return success},
   generate:()=>{calls.global++},
   renderOnlyRegeneratedLatinQuestion:()=>{calls.isolated++;return success},
   renderOnlyRegeneratedMorphQuestion:()=>{calls.isolated++;return success},
  };
  vm.createContext(sandbox);
  vm.runInContext(source+';regenerateExamQuestion('+JSON.stringify(kind)+')',sandbox);
  assert.equal(calls.global,0,filename+': se regeneró globalmente '+course+'/'+model+'/'+kind);
  assert.equal(cache.get('other'),other,filename+': cambió una pregunta ajena');
  if(!success)assert.equal(cache.get(kind),previous,filename+': se perdió el sorteo previo');
  if(third&&!success)assert.equal(cache.get('latin-third-declension'),previousThird);
  assert.equal(field.value,'sintagma editado');
  return calls;
 }
 assert.equal(scenario({kind:'obsoleta',enabled:false}).isolated,0);
 assert.equal(scenario({kind:'forms',enabled:false}).isolated,0);
 assert.equal(scenario({kind:'obsoleta'}).isolated,0);
 assert.equal(scenario({course:'greek1',model:'complete',kind:'forms'}).greek,0);
 assert.equal(scenario({course:'greek1',model:'complete',kind:'forms',greekState:{}}).greek,1);
 assert.equal(scenario({kind:'decl',model:'morf',third:true}).isolated,1);
 assert.equal(scenario({kind:'forms'}).isolated,1);
 assert.equal(scenario({kind:'forms',success:true}).isolated,1);
 console.log(filename+': ocho rutas de regeneración sin escape global y con restauración de caché');
}
