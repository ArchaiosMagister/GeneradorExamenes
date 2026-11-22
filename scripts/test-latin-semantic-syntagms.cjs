'use strict';
// Regresión académica: parejas latinas revisadas, concordancia,
// singular y plural, 18 aprobaciones de 17/11, ES/VA, web/autónoma.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const units=[1,2,3,4,5,8,9];
async function check(page,course,lang,unit){
 return page.evaluate(({course,lang,unit})=>{
  const select=(id,value)=>{
   const el=document.getElementById(id);el.value=value;
   el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  select('course',course);
  select('model','tablas');
  select('lang',lang);
  const choices=[...document.querySelectorAll('.unit-choice')];
  const target=choices.find(x=>units[Number(x.value)]==='UD'+unit)||
   (unit===9?choices.find(x=>/^UD9(?:\D|$)/u.test(units[Number(x.value)])):null);
  if(!target)throw Error('UD'+unit+' no existe en '+course);
  document.querySelectorAll('.unit-choice').forEach(x=>x.checked=x===target);
  target.dispatchEvent(new Event('change',{bubbles:true}));
  generate();
  const selected=selectedUnits(),active=latinCompleteCompoundActive(selected);
  const adjectives=latinCompleteAdjectives(selected);
  const adjs=adjectives.map(({x})=>mNormalize(headLex(x.entry)).toLowerCase());
  const nouns=latinSyntagmNouns(selected);
  const tableItems=latinCompleteDeclensionItems(selected);
  const issues=[];
  const normal=x=>mNormalize(headLex(x)).toLowerCase();
  if(active&&adjs.some(a=>a==='unus'||a==='nullus'))issues.push('adjetivo irregular permitido');
  const exists=Object.entries(latinSyntagmSemanticPairs);
  if(exists.length!==196||exists.reduce((sum,[,adjs])=>sum+adjs.split(' ').length,0)!==561)
   issues.push('repertorio semántico inesperado: '+exists.length+' sustantivos');
  for(const [noun,removed] of [
   ['ferrum','durus clarus'],['littera','parvus clarus'],
   ['cognomen','verus'],['signum','clarus'],['oraculum','occultus']
  ]){
   const allowed=(latinSyntagmSemanticPairs[noun]||'').split(' ');
   if(removed.split(' ').some(adj=>allowed.includes(adj)))
    issues.push('pareja eliminada reaparece en '+noun);
  }
  for(const [noun,required] of [['pecunia','magnus'],['ludus','publicus']]){
   if(!(latinSyntagmSemanticPairs[noun]||'').split(' ').includes(required))
    issues.push('se retiró la pareja conservada '+noun+' '+required);
  }
  for(const [noun,allowed] of exists){
   if(/(?:^|\s)(?:unus|nullus)(?:\s|$)/u.test(allowed))
    issues.push('paradigma prohibido en lista de '+noun);
  }
  if(!active){
   if(tableItems.some(x=>x.compound))issues.push('adjetivo anticipado');
   return {course,unit,lang,active,pool:tableItems.length,
    count:nouns.length,issues,hold:[],distinctAdjs:0};
  }
  const byNoun=new Map(tableItems.map(x=>[normal(x.p.lemma),x]));
  const accepted=new Set();
  const hold=[];
  for(const noun of nouns){
   const nounKey=normal(noun.p.lemma);
   const manual=latinApprovedSyntagmAdjective(noun,adjectives,unit);
   const pool=manual?[manual]:latinSemanticSyntagmChoices(noun,adjectives);
   const chosen=byNoun.get(nounKey);
   if(!pool.length){hold.push(nounKey);if(chosen)issues.push('pareja creada sin revisión '+nounKey);continue}
   if(!chosen){issues.push('sustantivo con parejas no utilizado '+nounKey);continue}
   const actual=normal(chosen.compound?.adjective?.entry);
   if(!pool.some(p=>normal(p.x.entry)===actual))
    issues.push('pareja fuera de la lista '+nounKey+' '+actual);
   if(!chosen.compound?.forms||chosen.compound.forms.length!==2||
      chosen.compound.forms.some(n=>n.length!==6||n.some(v=>!v?.trim())))
    issues.push('tabla incompleta '+nounKey);
   if(['unus','nullus'].includes(actual))
    issues.push('irregular en tabla '+nounKey);
   accepted.add(actual);
  }
  if(tableItems.length!==byNoun.size)issues.push('sustantivos duplicados');
  // Aprobaciones previas: siguen siendo pares forzosos, no candidatos opcionales.
  for(const [noun,lemma,minUnit] of latinApprovedSyntagms[course]){
   if(minUnit>unit)continue;
   const current=byNoun.get(noun);
   if(!current||normal(current.compound?.adjective?.entry)!==lemma.toLowerCase())
    issues.push('se ha perdido la aprobación '+noun+' + '+lemma);
  }
  const senator=nouns.find(x=>normal(x.p.lemma)==='senator');
  const dense=adjectives.find(x=>normal(x.x.entry)==='densus');
  if(senator&&dense&&latinSemanticSyntagmChoices(senator,[dense]).length)
   issues.push('senator densus sigue permitido');
  if(byNoun.has('aqua')||byNoun.has('lux')||byNoun.has('sol'))
   issues.push('sustantivo sin plural natural incluido');
  return {course,unit,lang,active,pool:tableItems.length,
   count:nouns.length,issues,hold,distinctAdjs:accepted.size,
   senator:byNoun.get('senator')?.compound?.forms?.[0]?.[0]||'',
   silva:byNoun.get('silva')?.compound?.forms?.[0]?.[0]||''};
 },{course,lang,unit});
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])for(const course of ['latin1','latin4']){
   const ctx=await browser.newContext({viewport:{width:1380,height:950}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
   for(const lang of ['es','va'])for(const unit of units){
    const result=await check(page,course,lang,unit);
    assert.deepEqual(result.issues,[],JSON.stringify({file,...result}));
    if(result.active&&unit>=5){
     assert(result.pool>=100,'Banco de sintagmas demasiado pequeño '+JSON.stringify(result));
     assert(result.distinctAdjs>=18,'Repetición excesiva de adjetivos '+JSON.stringify(result));
    }
    console.log('LATIN_SEMANTIC '+JSON.stringify({
     file,course,lang,unit,eligible:result.count,pool:result.pool,
     held:result.hold.length,usedAdjectives:result.distinctAdjs
    }));
   }
   assert.deepEqual(errors,[],file+'/'+course+' errores de JS');
   // Regeneración aleatoria completa: distintas parejas naturales para un
   // mismo sustantivo, sin que pueda reintroducirse «senator densus».
   const varied=await page.evaluate(()=>{
    const seen={senator:new Set(),silva:new Set()};
    for(let k=0;k<100;k++){
     const items=latinCompleteDeclensionItems(selectedUnits());
     for(const noun of Object.keys(seen)){
      const item=items.find(x=>mNormalize(x.p.lemma).toLowerCase()===noun);
      if(item)seen[noun].add(mNormalize(headLex(item.compound.adjective.entry)).toLowerCase());
     }
    }
    return Object.fromEntries(Object.entries(seen).map(([key,set])=>[key,[...set]]));
   });
   assert(varied.senator.length>=2,'Regeneraciones sin variedad natural del senador: '+JSON.stringify(varied));
   assert(!varied.senator.includes('densus'),'«senator densus» reapareció');
   assert(varied.silva.includes('densus')&&varied.silva.length>=2,
    'No se utiliza «silva densa» junto a otras alternativas: '+JSON.stringify(varied));
   await ctx.close();
  }
  console.log('PASS: 56 contextos latinos, 196 lemas revisados, singular/plural, variación y veto permanente unus/nullus.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
