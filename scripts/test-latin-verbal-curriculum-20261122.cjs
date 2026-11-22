'use strict';
// Regression: grammar-stage gates for irregular/deponent/semideponent verbs.
// Regular verbs retain the shared-bank policy; no lexical-unit gate for them.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const cases={
 latin1:[
  {unit:'UD1',yes:['sum'],no:['eo','pereo','confero','transeo','possum','nolo','conor','loquor','sequor','proficiscor','audeo']},
  {unit:'UD2',yes:['eo'],no:['pereo','confero','transeo','possum','nolo','conor']},
  {unit:'UD4',yes:['pereo'],no:['confero','transeo','possum','nolo','conor']},
  {unit:'UD5',yes:['confero','transeo'],no:['possum','nolo','conor']},
  {unit:'UD6',no:['conor','loquor','sequor','proficiscor','audeo']},
  {unit:'UD7',yes:['conor','loquor','sequor','proficiscor'],no:['possum','nolo','audeo']},
  {unit:'UD8',yes:['possum','redeo'],no:['nolo','audeo']},
  {unit:'UD9–10',yes:['absum','praesum','audeo'],no:['nolo','abeo','ineo']},
  {unit:'UD11–12',yes:['nolo','abeo','ineo']}
 ],
 latin4:[
  {unit:'UD1',yes:['sum'],no:['eo','redeo','transeo','possum','conor','proficiscor']},
  {unit:'UD2',no:['eo','redeo','transeo','possum','conor','proficiscor']},
  {unit:'UD3',yes:['redeo','transeo'],no:['eo','possum','conor','proficiscor']},
  {unit:'UD4',yes:['eo'],no:['possum','conor','proficiscor']},
  {unit:'UD8',no:['possum','conor','proficiscor']},
  {unit:'UD9',no:['possum','conor','proficiscor']},
  {unit:'UD10',yes:['possum','conor','proficiscor']}
 ]
};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1365,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
   await page.waitForFunction(()=>typeof latinMorphologyVerbPool==='function'&&
    typeof latinExamFormCandidates==='function'&&typeof latinSpecialVerbEligible==='function');
   for(const course of ['latin1','latin4'])for(const lang of ['es','va']){
    const results=await page.evaluate(({course,lang,checks})=>{
     const set=(id,v)=>{const x=document.getElementById(id);x.value=v;
      x.dispatchEvent(new Event('change',{bubbles:true}));};
     set('course',course);set('model','morf');set('lang',lang);
     const normalize=entry=>examKey(entry);
     return checks.map(({unit})=>{
      const chosen=[unit],limit=examUnitNumber(unit);
      const morphological=latinMorphologyVerbPool(chosen);
      const isolated=latinExamFormCandidates(chosen,true)[2];
      const pool=[new Set(morphological.map(x=>normalize(x.entry))),
       new Set(isolated.map(x=>normalize(x.entry)))];
      const lemmata=[...new Set([...pool[0],...pool[1]])];
      const regular=isolated.some(x=>normalize(x.entry)==='amo');
      const wrongVoice=morphological.filter(x=>
       ['conor','loquor','sequor','proficiscor'].includes(normalize(x.entry))&&
       x.voice!=='deponente');
      const ambiguous=morphological.filter(x=>
       [['proficiscor','proficisceris'],['loquor','loqueris'],['sequor','sequeris']]
        .some(([lemma,form])=>normalize(x.entry)===lemma&&
         normLex(x.form)===form));
      const earlySpecial=lemmata.filter(lemma=>{
       const entry=[...morphological,...isolated].find(x=>normalize(x.entry)===lemma)?.entry;
       return entry&&!latinSpecialVerbEligible(entry,course,limit);
      });
      const conjugation=course==='latin4'?latin4ConjugationPool(chosen)
       .map(x=>normalize(x.x.entry)):[];
      return {unit,pools:pool.map(x=>[...x]),regular,wrongVoice,ambiguous,
       earlySpecial,conjugation};
     });
    },{course,lang,checks:cases[course]});
    for(let k=0;k<results.length;k++){
     const r=results[k],spec=cases[course][k],context=file+'/'+course+'/'+lang+'/'+r.unit;
     for(const name of spec.yes||[])
      for(const [i,pool] of r.pools.entries())
       assert(pool.includes(name),context+' no incluye '+name+' en grupo '+i);
     for(const name of spec.no||[])
      for(const [i,pool] of r.pools.entries())
       assert(!pool.includes(name),context+' adelanta '+name+' en grupo '+i);
     if(course==='latin1')assert(r.regular,
      context+' perdió el verbo regular del banco compartido');
     assert.deepEqual(r.wrongVoice,[],context+' cambió voz de deponente');
     assert.deepEqual(r.ambiguous,[],context+' pregunta sin contexto ambiguo');
     assert.deepEqual(r.earlySpecial,[],context+' formas especiales anteriores a su unidad');
     if(course==='latin4')assert(r.conjugation.every(x=>x==='sum'||!
      ['eo','redeo','transeo','possum','conor','proficiscor'].includes(x)),
      context+' conjugación irregular indebida en 4.º');
    }
   }
   assert.deepEqual(errors,[],file+' sin errores de navegador');
   await page.close();
  }
  console.log('PASS: 16 unidades, LAT1/LAT4, ES/VA, web/autónoma, dos rutas de análisis, sincretismos, conjugación y regulares');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
