'use strict';
// Contraste independiente de las DOCE formas de 28 paradigmas de tercera
// declinación y de los tres casos especiales. Web/PWA, ES/VA, Latín I/4.º.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs');
const source=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const index=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../data/lemmas/teacher-forms.json'),'utf8'));
for(const text of [source,JSON.stringify(index)]){
 assert(!text.includes('ordo, ordinis (f.)'),'Ordo debe figurar como masculino en todos los bancos');
 assert(!text.includes('rĕgĭō, –onis (m.)'),'Regio debe figurar como femenino en Latín 4.º');
}
assert.equal(index.vocabulary.lat.ordo.lat1.entry,'ordo, ordinis (m.)');
assert.equal(index.vocabulary.lat.regio.lat4.entry,'rĕgĭō, –onis (f.)');

// [lema, fragmento de genitivo del banco, tema íntegro, género].
// Fixture editorial deliberadamente independiente de mNoun/M_END.
const cases=[
 ['arbor','oris','arbor','f'],['carmen','inis','carmin','n'],
 ['civitas','atis','civitat','f'],['clamor','oris','clamor','m'],
 ['cognomen','minis','cognomin','n'],['coniuratio','onis','coniuration','f'],
 ['dictator','oris','dictator','m'],['dolor','oris','dolor','m'],
 ['factio','onis','faction','f'],['furor','oris','furor','m'],
 ['gladiator','oris','gladiator','m'],['imperator','oris','imperator','m'],
 ['mercator','oris','mercator','m'],['origo','inis','origin','f'],
 ['pavo','onis','pavon','m'],['regio','onis','region','f'],
 ['sacerdos','otis','sacerdot','m'],['voluptas','atis','voluptat','f'],
 ['legio','onis','legion','f'],['custos','odis','custod','m'],
 ['flumen','inis','flumin','n'],['labor','oris','labor','m'],
 ['mater','tris','matr','f'],['mulier','eris','mulier','f'],
 ['oppugnatio','onis','oppugnation','f'],['pater','tris','patr','m'],
 ['uxor','oris','uxor','f'],['virtus','utis','virtut','f']
];
assert.equal(cases.length,28);
const expected=(nom,stem,gender)=>{
 const neuter=gender==='n';
 return [
  [nom,nom,neuter?nom:stem+'em',stem+'is',stem+'i',stem+'e'],
  [neuter?stem+'a':stem+'es',neuter?stem+'a':stem+'es',
   neuter?stem+'a':stem+'es',stem+'um',stem+'ibus',stem+'ibus']
 ];
};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1280,height:900}});
   const pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(e.message));
   await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
   for(const course of ['latin1','latin4'])for(const lang of ['es','va']){
    const found=await page.evaluate(({course,lang,cases})=>{
     function set(id,value){
      const el=document.getElementById(id);
      el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
     }
     set('course',course);set('model','tablas');set('lang',lang);
     document.querySelectorAll('.unit-choice').forEach(x=>x.checked=true);
     generate();
     const pool=latinSyntagmNouns(selectedUnits());
     const tables=latinCompleteDeclensionItems(selectedUnits());
     const byLemma=new Map(pool.map(x=>[mNormalize(x.p.lemma).toLowerCase(),x.p]));
     const byTable=new Map(tables.map(x=>[mNormalize(x.p.lemma).toLowerCase(),x]));
     const variants=cases.map(([nom,short,stem,gender])=>{
      const abbreviated=mNoun(nom+', -'+short+' ('+gender+'.)');
      const complete=mNoun(nom+', '+stem+'is ('+gender+'.)');
      const inPool=byLemma.get(nom)||null;
      const table=byTable.get(nom)||null;
      return {nom,abbreviated,complete,inPool,
       compound:table?.compound||null};
     });
     return {
      variants,
      nounCount:pool.length,tableCount:tables.length,
      corPool:byLemma.has('cor'),corTable:byTable.has('cor'),
      ordo:mNoun('ordo, -inis (f.)'),
      regionMislabel:mNoun('regio, -onis (m.)'),
      serpens:mNoun('serpens, -entis (m.)'),
      locus:latinApprovedNounParadigm({entry:'locus, -i (en pl. es n.)'}),
      locusTable:byTable.get('locus')?.compound?.forms||null,
      unsupported:mNoun('pseudolex, -oris (m.)'),
      semantic:latinSyntagmSemanticPairs
     };
    },{course,lang,cases});
    const context=file+' '+course+' '+lang;
    let covered=0;
    for(let i=0;i<cases.length;i++){
     const [nom,,stem,gender]=cases[i];
     const data=found.variants[i],want=expected(nom,stem,gender);
     for(const prop of ['abbreviated','complete']){
      assert(data[prop],context+' '+nom+' '+prop+' no admitido');
      assert.equal(data[prop].gender,gender,context+' '+nom+' género '+prop);
      assert.deepEqual(data[prop].forms,want,context+' '+nom+' doce formas '+prop);
     }
     if(data.inPool){
      covered++;
      assert.deepEqual(data.inPool.forms,want,context+' '+nom+' doce formas del banco');
      assert.equal(data.inPool.gender,gender,context+' '+nom+' género del banco');
      if(data.compound){
       const plain=data.compound.forms.map((row,n)=>row.map((form,k)=>{
        // El sustantivo debe aparecer como palabra íntegra en cada celda.
        const words=form.split(' ');
        return words.find(w=>w===want[n][k])||null;
       }));
       assert.deepEqual(plain,want,context+' '+nom+' tema en tabla con adjetivo');
      }
     }
    }
    assert(covered>=(course==='latin1'?19:27),
     context+' insuficiente cobertura de los lemas auditados: '+covered);
    assert.equal(found.corPool,false,context+' cor debe excluirse');
    assert.equal(found.corTable,false,context+' cor reaparece con adjetivo');
    assert.equal(found.ordo?.gender,'m',context+' ordo masculino');
    assert.equal(found.regionMislabel?.gender,'f',context+' regio femenino');
    assert.equal(found.serpens?.forms[1][3],'serpentium',context+' serpentium');
    assert.deepEqual(found.locus?.forms,[
      ['locus','loce','locum','loci','loco','loco'],
      ['loca','loca','loca','locorum','locis','locis']
    ],context+' locus/loca');
    assert(found.locusTable,context+' no se generó locus');
    assert(found.locusTable[0].every(x=>/\blocus|\bloce|\blocum|\bloci|\bloco/.test(x)),
      context+' locus singular');
    assert(found.locusTable[1].every(x=>/\bloca|\blocorum|\blocis/.test(x)),
      context+' locus plural');
    assert(found.locusTable[1][0].endsWith('a'),
      context+' adjetivo de locus ha de ser neutro plural');
    assert.equal(found.unsupported,null,context+' un genitivo no verificado no se inventa');
    const removed=[
      ['audacia','strenuus'],['furor','malus'],
      ['raptum','magnus'],['raptum','malus'],['raptum','occultus'],
      ['philosophia','magnus'],['societas','longus'],['voluptas','longus']
    ];
    for(const [noun,adjective] of removed){
     assert(!found.semantic[noun]?.split(' ').includes(adjective),
      context+' reaparece '+noun+' '+adjective);
    }
    for(const noun of ['pecunia','ferrum','littera','ludus','cognomen','signum','oraculum']){
     assert(found.semantic[noun],context+' se descartó sin permiso '+noun);
    }
    assert(!Object.values(found.semantic).some(allowed=>/\b(unus|nullus)\b/u.test(allowed)),
     context+' pronombres irregulares indebidamente habilitados');
    console.log('LATIN_12_CASES '+JSON.stringify({file,course,lang,corrected:covered,
      nouns:found.nounCount,tables:found.tableCount}));
   }
   assert.deepEqual(pageErrors,[],file+' sin excepciones JavaScript');
   await page.close();
  }
  console.log('PASS: 28 lemas x 12 formas, 2 géneros, serpens, locus/loca, cor y 8 exclusiones (web/PWA, ES/VA).');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
