'use strict';
// No repetir étimos en una frase ni anticipar prefijos o lexemas no estudiados.
// Audita el catálogo íntegro, la selección curricular, ambos idiomas y la PWA.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route(/^https?:\/\//,r=>r.abort());
   await page.goto(pathToFileURL(path.resolve(__dirname,'..',filename)).href);
   const audit=await page.evaluate(()=>{
    $('course').value='greek1';$('course').dispatchEvent(new Event('change',{bubbles:true}));
    $('model').value='complete';$('model').dispatchEvent(new Event('change',{bubbles:true}));
    const api=window.ExaminaGreekEtymSentence,catalog=api.catalog(),known=new Set();
    const expected=['prologo-democracia','anfibio-zoologia','hipofonia-biografia',
     'hipergrafia-psicologia','paradoja-bibliografia','hipodermis-filosofia',
     'hiperemia-psicologia','hipercromia-economia'];
    if(catalog.length<125)throw Error('La cobertura etimológica se ha reducido: '+catalog.length);
    const newRecords=catalog.filter(r=>r.id.startsWith('cobertura-'));
    if(newRecords.length<100)throw Error('Faltan nuevos ejercicios: '+newRecords.length);
    const firstStudiedUnit=root=>{
     const matches=greekEtymologyBank.entries.filter(e=>e.verified&&
      String(e.word).split(/\\s*\\|\\s*/).some(variant=>greekBankKey(variant)===greekBankKey(root)));
     return matches.length?Math.min(...matches.map(e=>e.firstUnit)):Infinity;
    };
    const newByUnit=Object.fromEntries(Array.from({length:12},(_,i)=>[i+1,0]));
    for(const record of newRecords){
     const first=Math.max(...record.roots.flat().map(firstStudiedUnit));
     if(!Number.isFinite(first)||first>12)throw Error('Étimo sin estudiar: '+record.id);
     newByUnit[first]++;
    }
    for(let unit=1;unit<=12;unit++)
     if(newByUnit[unit]<3)throw Error('Insuficientes oraciones nuevas para UD'+unit+': '+newByUnit[unit]);
    // Cobertura por familia léxica, evitando contar como nuevos las
    // repeticiones de una misma ficha entre unidades.
    const represented=new Set(catalog.flatMap(r=>r.roots.flat().map(api.canonicalRoot)));
    const uncovered=greekEtymologyBank.entries.filter(e=>e.verified&&
     !String(e.word).split(/\\s*\\|\\s*/).some(w=>represented.has(api.canonicalRoot(w))))
     .map(e=>e.word);
    if(uncovered.length>5)throw Error('Raíces verificadas sin cobertura: '+uncovered.join(', '));
    for(const record of catalog){
     if(known.has(record.id))throw Error('ID duplicado: '+record.id);
     known.add(record.id);
     if(record.es.length!==5||record.va.length!==5||
       record.roots.length!==2||record.roots.some(pair=>pair.length!==2))
      throw Error('Dos palabras y dos raíces por palabra: '+record.id);
     if(record.es[1].trim()===''||record.es[3].trim()===''||
       record.va[1].trim()===''||record.va[3].trim()==='')
      throw Error('Subrayado vacío: '+record.id);
     const roots=record.roots.flat().map(api.canonicalRoot);
     if(new Set(roots).size!==roots.length)
      throw Error('Étimo repetido en '+record.id+': '+record.roots.flat().join(', '));
    }
    for(const id of expected)if(!known.has(id))throw Error('Falta oración '+id);
    const stats={catalog:catalog.length,newRecords:newRecords.length,newByUnit,
     uncovered,perUnit:{},prefixes:{}};
    for(let unit=1;unit<=14;unit++)for(const lang of ['es','va']){
     $('lang').value=lang;$('lang').dispatchEvent(new Event('change',{bubbles:true}));
     document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=
      units[Number(x.value)]==='UD'+unit);
     const pool=api.candidates();
     if(!pool.length)throw Error('Sin oraciones en UD'+unit+'/'+lang);
     for(const record of pool){
      const original=catalog.find(x=>x.id===record.id);
      const expectedSentence=original[lang==='va'?'va':'es'];
      if(JSON.stringify(record.sentence)!==JSON.stringify(expectedSentence))
       throw Error('Idioma incoherente '+record.id+'/'+lang);
      if(!record.roots.flat().every(root=>greekEtymologyBank.entries.some(e=>
       e.verified&&e.firstUnit<=unit&&String(e.word).split(/\s*\|\s*/).some(w=>
        greekBankKey(w)===greekBankKey(root)))))
       throw Error('Étimo antes de la unidad correspondiente: '+record.id+'/'+unit);
      if((api.render(record).match(/<u>/g)||[]).length!==2)
       throw Error('Dos subrayados obligatorios: '+record.id+'/'+lang);
     }
     const ids=new Set(pool.map(x=>x.id));
     if(unit<4&&['prologo-democracia','anfibio-zoologia','hipofonia-biografia',
       'hipergrafia-psicologia','paradoja-bibliografia'].some(id=>ids.has(id)))
      throw Error('Prefijos de UD4 anticipados a UD'+unit);
     if(unit>=4&&['prologo-democracia','anfibio-zoologia','hipofonia-biografia',
       'hipergrafia-psicologia','paradoja-bibliografia'].some(id=>!ids.has(id)))
      throw Error('Prefijos de UD4 no disponibles en UD'+unit);
     if(unit<8&&ids.has('hipodermis-filosofia'))throw Error('δέρμα antes de UD8');
     if(unit>=8&&!ids.has('hipodermis-filosofia'))throw Error('Falta hipodermis desde UD8');
     if(unit<9&&ids.has('hiperemia-psicologia'))throw Error('αἷμα antes de UD9');
     if(unit>=9&&!ids.has('hiperemia-psicologia'))throw Error('Falta hiperemia desde UD9');
     if(unit<12&&ids.has('hipercromia-economia'))throw Error('χρῶμα antes de UD12');
     if(unit>=12&&!ids.has('hipercromia-economia'))throw Error('Falta hipercromía desde UD12');
     stats.perUnit[unit+'-'+lang]=ids.size;
     if(unit===4)stats.prefixes[lang]=[...ids].filter(id=>
      ['prologo-democracia','anfibio-zoologia','hipofonia-biografia',
       'hipergrafia-psicologia','paradoja-bibliografia'].includes(id));
    }
    $('lang').value='es';$('lang').dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=
     units[Number(x.value)]==='UD4');
    generate();
    const selected=api.current();
    if(!selected||document.querySelectorAll('#paper .greek-choice-etym-sentence u').length!==2)
     throw Error('La vista previa pierde los subrayados de la oración');
    for(let i=0;i<Math.min(10,api.candidates().length-1);i++){
     const old=api.current()?.id;
     if(!api.regenerate()||api.current()?.id===old)
      throw Error('No se puede regenerar una oración distinta');
    }
    return stats;
   });
   assert.deepEqual(errors,[],filename+': errores del navegador');
   assert(audit.perUnit['4-es']>=6,'Cobertura insuficiente en UD4');
   console.log(filename+': '+audit.catalog+' oraciones ('+audit.newRecords+' nuevas); cobertura UD1–12 '+JSON.stringify(audit.newByUnit)+'; sin representar: '+audit.uncovered.join(', ')+'; UD1–14 ES/VA online/offline OK');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
