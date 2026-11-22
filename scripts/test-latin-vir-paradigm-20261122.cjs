'use strict';
// Test de paradigma nominal y concordancia: vir, viri (2.ª, -ir).
// Gaffiot: https://www.gaffiot.org/95624
// Collatinus / apoyo: https://www.azimonti.com/philology/latin/resources/paradigms-nouns/
// No modifica el léxico, la valoración ni las fuentes de lematización.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const wordIndex=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
assert.equal(wordIndex.vocabulary.lat.vir.lat1.entry,'vir, –i');
assert.equal(wordIndex.vocabulary.lat.mors.lat1.entry,'mors, mortis (f.)');
assert(wordIndex.rows.lat.some(row=>row[0]==='mors'&&
 row[2]==='N;GEN;PL'&&row[3]===0&&
 row[1].normalize('NFD').replace(/\p{M}/gu,'')==='mortium'),
 'El índice de referencia debe documentar el genitivo plural mortium');
const morsExpected=[
 ['mors','mors','mortem','mortis','morti','morte'],
 ['mortes','mortes','mortes','mortium','mortibus','mortibus']
];
const singular=['vir','vir','virum','viri','viro','viro'];
const plural=['viri','viri','viros','virorum','viris','viris'];
const expected=[singular,plural]; // NOM, VOC, ACC, GEN, DAT, ABL

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   const errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
   for(const course of ['latin1','latin4'])for(const lang of ['es','va']){
    const got=await page.evaluate(({course,lang})=>{
     const set=(id,val)=>{
      const el=document.getElementById(id);
      if(!el)throw Error('Selector ausente: '+id);
      el.value=val;el.dispatchEvent(new Event('change',{bubbles:true}));
     };
     set('course',course);set('model','tablas');set('lang',lang);
     document.querySelectorAll('.unit-choice').forEach(x=>x.checked=true);
     const chosen=selectedUnits(),m=mNoun('vir, –i'),mors=mNoun('mors, mortis (f.)');
     const bank=latinSyntagmNouns(chosen).find(x=>mNormalize(x.p.lemma).toLowerCase()==='vir');
     const table=latinCompleteDeclensionItems(chosen)
      .find(x=>mNormalize(x.p.lemma).toLowerCase()==='vir');
     return {m,mors,bank:bank?.p||null,table:table?{
      noun:table.p,compound:table.compound?.forms||null,
      adjective:mNormalize(headLex(table.compound?.adjective?.entry||'')).toLowerCase(),
      title:table.compound?.title||''
     }:null,semantic:latinSyntagmSemanticPairs.vir,
     earlyClass:latinSyntagmNounUnit('2er'),
     hasUnus:latinCompleteAdjectives(chosen).some(x=>
      ['unus','nullus'].includes(mNormalize(headLex(x.x.entry)).toLowerCase()))};
    },{course,lang});
    const where=file+' '+course+' '+lang;
    assert(got.mors&&got.mors.kind==='3mf'&&got.mors.gender==='f',where+': mors tercera femenina');
    assert.deepEqual(got.mors.forms,morsExpected,where+': mors debe formar mortium, no *mortum');
    assert(got.m&&got.bank&&got.table,where+': vir debe ser evaluable');
    for(const paradigm of [got.m,got.bank,got.table.noun]){
     assert.equal(paradigm.kind,'2er',where+': clase nominal');
     assert.equal(paradigm.gender,'m',where+': género masculino');
     assert.deepEqual(paradigm.forms,expected,where+': doce formas nominales');
    }
    assert.equal(got.semantic,'bonus doctus strenuus',where+': pares aprobados');
    assert(['bonus','doctus','strenuus'].includes(got.table.adjective),
     where+': sintagma semánticamente incorrecto');
    assert(!got.hasUnus,where+': no reintroducir unus/nullus');
    assert.equal(got.table.compound.length,2);
    for(let number=0;number<2;number++)for(let k=0;k<6;k++){
     const words=got.table.compound[number][k].split(' ');
     assert.equal(words.length,2,where+': dos palabras en el sintagma');
     assert.equal(words[0],expected[number][k],where+': sustantivo en '+number+'/'+k);
    }
    assert.equal(got.earlyClass,course==='latin1'?1:2,where+': progreso curricular');
   }
   assert.deepEqual(errors,[],file+': error JavaScript en la página');
   await page.close();
  }
  console.log('OK: vir viri y mors mortis (mortium): 24 casillas, concordancia, web/offline y ES/VA');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
