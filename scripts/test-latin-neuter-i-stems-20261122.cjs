'use strict';
// Revisión individual de los neutros en -i mare/animal: no inferir otras palabras.
// Paradigmas: https://www.azimonti.com/philology/latin/resources/paradigms-nouns/
// Cantidad vocálica no evaluada; las fuentes del índice no se promocionan.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');
const index=JSON.parse(read('data/lemmas/teacher-forms.json'));
const normalized=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const expected={
 mare:{
  singular:['mare','mare','mare','maris','mari','mari'],
  plural:['maria','maria','maria','marium','maribus','maribus'],
  entries:['mare, maris (n.)','mare, –is (n.)'],
  adjectives:['magnus','altus','serenus']
 },
 animal:{
  singular:['animal','animal','animal','animalis','animali','animali'],
  plural:['animalia','animalia','animalia','animalium','animalibus','animalibus'],
  entries:['animal, animalis (n.)','animal, −alis (n.)'],
  adjectives:['magnus','parvus','formosus']
 }
};
const names=['NOM','VOC','ACC','GEN','DAT','ABL'];
assert.equal(index.vocabulary.lat.mare.lat1.entry,'mare, maris (n.)');
assert.equal(index.vocabulary.lat.mare.lat4.entry,'mare, –is (n.)');
assert.equal(index.vocabulary.lat.animal.lat1.entry,'animal, −alis (n.)');
assert.equal(index.rows.lat.filter(r=>r[0]==='mare'&&r[3]===5).length,0,
 'No atribuir a mare una acreditación individual inexistente');
const animalRows=index.rows.lat.filter(r=>r[0]==='animal'&&r[3]===0);
assert.equal(animalRows.length,12,'El índice histórico tiene doce registros de animal');
for(const [i,n] of ['SG','PL'].entries())for(const [k,cas] of names.entries()){
 const wanted=expected.animal[i===0?'singular':'plural'][k];
 assert(animalRows.some(r=>r[2]==='N;'+cas+';'+n&&normalized(r[1])===wanted),
  'Animal no está contrastado en el índice: '+cas+'/'+n);
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const html of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(root,html)).href,{waitUntil:'load'});
   for(const course of ['latin1','latin4'])for(const lang of ['es','va']){
    const r=await page.evaluate(({course,lang})=>{
     const set=(id,v)=>{const x=document.getElementById(id);x.value=v;x.dispatchEvent(new Event('change',{bubbles:true}));};
     set('course',course);set('model','tablas');set('lang',lang);
     document.querySelectorAll('.unit-choice').forEach(x=>x.checked=true);
     const chosen=selectedUnits();
     const all=latinCompleteDeclensionItems(chosen);
     const nouns=latinSyntagmNouns(chosen);
     const key=s=>mNormalize(s).toLowerCase();
     const info={};
     for(const name of ['mare','animal']){
      const entry=name==='mare'?'mare, –is (n.)':'animal, −alis (n.)';
      const complete=name==='mare'?'mare, maris (n.)':'animal, animalis (n.)';
      const table=all.find(x=>key(x.p.lemma)===name);
      const bank=nouns.find(x=>key(x.p.lemma)===name);
      const choices=(latinSyntagmSemanticPairs[name]||'').split(' ');
      info[name]={
       abbreviate:mNoun(entry),full:mNoun(complete),
       bank:bank?.p,table:table?.p,
       compound:table?.compound?.forms,
       adjective:key(headLex(table?.compound?.adjective?.entry||'')),
       choices,sourceEntry:bank?.x?.entry
      };
     }
     const early=course==='latin1'?['UD1','UD2','UD3']:['UD1','UD2','UD3','UD4'];
     return {info,
      early:early.map(ud=>[ud,latinSyntagmNouns([ud]).map(x=>key(x.p.lemma)).filter(x=>x==='mare'||x==='animal')]),
      rejects:[
       mNoun('mare, maris (m.)'),
       mNoun('animal, animalis (f.)'),
       mNoun('mare, moris (n.)'),
       mNoun('animal, animalaris (n.)'),
       mNoun('rete, retis (n.)')
      ],
      neuterEndings:M_END['2n'],
      disallowed:latinCompleteAdjectives(chosen).some(x=>
       ['unus','nullus'].includes(key(headLex(x.x.entry))))
     };
    },{course,lang});
    const ctx=html+'/'+course+'/'+lang;
    for(const [name,fixture] of Object.entries(expected)){
     const p=r.info[name],expectedForms=[fixture.singular,fixture.plural];
     for(const kind of ['abbreviate','full','bank','table']){
      assert(p[kind],ctx+' '+name+' sin paradigma '+kind);
      assert.equal(p[kind].kind,'3n',ctx+' '+name+' clase '+kind);
      assert.equal(p[kind].gender,'n',ctx+' '+name+' género '+kind);
      assert.deepEqual(p[kind].forms,expectedForms,ctx+' '+name+' '+kind);
     }
     assert.deepEqual(p.choices,fixture.adjectives,ctx+' '+name+' opciones naturales');
     assert(fixture.adjectives.includes(p.adjective),ctx+' '+name+' adjetivo no autorizado');
     assert.equal(p.compound.length,2,ctx+' '+name+' sin números completos');
     for(let n=0;n<2;n++)for(let k=0;k<6;k++){
      const words=p.compound[n][k].split(' ');
      assert.equal(words.length,2,ctx+' '+name+' binomio');
      assert.equal(words[0],expectedForms[n][k],ctx+' '+name+' forma nominal '+n+'/'+k);
      assert.equal(words[1],p.adjective.slice(0,-2)+r.neuterEndings[n][k],
       ctx+' '+name+' concordancia neutra '+n+'/'+k);
     }
    }
    assert(r.early.every(([,names])=>names.length===0),
     ctx+': no adelantar tercera declinación por el vocabulario');
    assert(r.rejects.every(x=>x===null),ctx+': inferencia morfológica indebida');
    assert.equal(r.disallowed,false,ctx+': reaparecieron unus o nullus');
   }
   assert.deepEqual(errors,[],html+': error JavaScript');
   await page.close();
  }
  console.log('OK: 24 casillas neutras en -i de mare/animal, semántica y concordancia, 8 contextos web/offline ES/VA');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
