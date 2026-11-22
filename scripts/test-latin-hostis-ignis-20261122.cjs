'use strict';
// Cotejo individual en fuente 0 de hostis/ignis, 24 casillas y variantes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const norm=s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const casus=['NOM','VOC','ACC','GEN','DAT','ABL'];
const specs={
 hostis:{sg:['hostis','hostis','hostem','hostis','hosti','hoste'],
  pl:['hostes','hostes','hostes','hostium','hostibus','hostibus'],
  entry:'hostis, –is (m.)',adjectives:'strenuus improbus perterritus',
  variants:[['hostis','ACC','PL']]},
 ignis:{sg:['ignis','ignis','ignem','ignis','igni','igne'],
  pl:['ignes','ignes','ignes','ignium','ignibus','ignibus'],
  entry:'ignis, –is (m.)',adjectives:'magnus parvus',
  variants:[['igni','ABL','SG'],['ignis','ACC','PL']]}
};
for(const [lemma,s] of Object.entries(specs)){
 assert.equal(index.vocabulary.lat[lemma]?.lat1.entry,s.entry,'Vocabulario '+lemma);
 const rows=index.rows.lat.filter(r=>r[0]===lemma&&r[3]===0);
 assert(rows.length>=12,'Faltan testimonios fuente 0 '+lemma);
 assert.equal(index.rows.lat.filter(r=>r[0]===lemma&&r[3]===5).length,0,
  'No promover registro histórico a fuente 5: '+lemma);
 const has=(form,cas,num)=>rows.some(r=>norm(r[1])===form&&
  r[2].split(';').includes(cas)&&r[2].split(';').includes(num));
 for(const [num,forms] of [['SG',s.sg],['PL',s.pl]])
  for(const [k,form] of forms.entries())
   assert(has(form,casus[k],num),lemma+' '+casus[k]+'/'+num+' = '+form);
 for(const [form,cas,num] of s.variants)
  assert(has(form,cas,num),'Variante no conservada: '+lemma+' '+form);
}
if(process.argv.includes('--source-only')){
 for(const file of ['index.html','offline.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert(html.includes('LATIN_VERIFIED_MF_I_STEMS')&&html.includes('hostium')&&
   html.includes('ignium'),file+' sin tablas de -i');
 }
 console.log('PASS: 24 formas fuente 0, variantes y HTML web/autónomo');
 process.exit(0);
}
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1350,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
   for(const course of ['latin1','latin4'])for(const lang of ['es','va']){
    const result=await page.evaluate(({course,lang})=>{
     const set=(id,v)=>{const x=document.getElementById(id);x.value=v;
      x.dispatchEvent(new Event('change',{bubbles:true}));};
     set('course',course);set('model','tablas');set('lang',lang);
     document.querySelectorAll('.unit-choice').forEach(x=>x.checked=true);
     const units=selectedUnits(),nouns=latinSyntagmNouns(units),
      tables=latinCompleteDeclensionItems(units),key=s=>mNormalize(s).toLowerCase(),out={};
     for(const lemma of ['hostis','ignis']){
      const short=lemma+', –is (m.)',full=lemma+', '+lemma+' (m.)';
      const table=tables.find(x=>key(x.p.lemma)===lemma);
      out[lemma]={short:mNoun(short),full:mNoun(full),
       bank:nouns.find(x=>key(x.p.lemma)===lemma)?.p||null,
       table:table?.p||null,compounds:table?.compound?.forms||null,
       adj:key(headLex(table?.compound?.adjective?.entry||'')),
       semantic:latinSyntagmSemanticPairs[lemma]};
     }
     const invalid=['hostis, hostis (f.)','hostis, hotis (m.)',
      'ignis, ignis (f.)','ignis, ignaris (m.)',
      'turris, turris (f.)'].map(x=>mNoun(x));
     const before=latinSyntagmNouns(['UD1','UD2','UD3'])
      .map(x=>key(x.p.lemma)).filter(x=>['hostis','ignis'].includes(x));
     set('model','morf');
     const formHeads=new Set(latinExamFormCandidates(units,true)[0]
      .map(x=>key(headLex(x.entry))));
     return {out,invalid,before,
      morph:['hostis','ignis'].map(x=>[x,formHeads.has(x)]),
      irregular:latinCompleteAdjectives(units)
       .some(x=>['unus','nullus'].includes(key(headLex(x.x.entry))))};
    },{course,lang});
    const ctx=file+'/'+course+'/'+lang;
    assert(result.invalid.every(x=>x===null),ctx+' enunciado no admisible');
    assert.deepEqual(result.before,[],ctx+' adelantó tema en -i');
    assert(result.morph.every(x=>x[1]),ctx+' formas aisladas omitidas');
    assert.equal(result.irregular,false,ctx+' reaparece unus/nullus');
    for(const [lemma,spec] of Object.entries(specs)){
     const r=result.out[lemma],forms=[spec.sg,spec.pl];
     for(const field of ['short','full','bank','table']){
      const p=r[field];assert(p,ctx+' '+lemma+' sin '+field);
      assert.equal(p.kind,'3mf',ctx+' '+lemma+' clase');
      assert.equal(p.gender,'m',ctx+' '+lemma+' género');
      assert.deepEqual(p.forms,forms,ctx+' '+lemma+' doce casillas');
     }
     assert.equal(r.semantic,spec.adjectives,ctx+' '+lemma+' pares semánticos');
     const allowed=spec.adjectives.split(' ');
     if(course==='latin1'&&lemma==='hostis')allowed.push('romanus');
     assert(allowed.includes(r.adj),ctx+' '+lemma+' adjetivo incorrecto: '+r.adj);
     assert.equal(r.compounds?.length,2,ctx+' '+lemma+' sin concordancias');
     for(let number=0;number<2;number++)for(let k=0;k<6;k++){
      const parts=r.compounds[number][k].split(' ');
      assert.equal(parts.length,2,ctx+' '+lemma+' sin dos palabras');
      assert.equal(parts[0],forms[number][k],ctx+' '+lemma+' forma nominal');
     }
    }
   }
   assert.deepEqual(errors,[],file+' errores JavaScript');
   await page.close();
  }
  console.log('PASS: 24 casillas, variantes, sintagmas, morfología, currículo, 8 contextos web/autónoma ES/VA');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
