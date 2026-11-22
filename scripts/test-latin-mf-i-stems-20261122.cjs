'use strict';
// Auditoría cerrada de 36 casillas: civis, navis, urbs; índices fuente 0.
// Los genitivos en -ium y las variantes son datos, no inferencias por sufijo.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const sourceOnly=process.argv.includes('--source-only');
const root=path.resolve(__dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const norm=s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const names=['NOM','VOC','ACC','GEN','DAT','ABL'];
const fixtures={
 civis:{forms:[['civis','civis','civem','civis','civi','cive'],['cives','cives','cives','civium','civibus','civibus']],gender:'m',genders:['m','f'],allowed:'bonus doctus fidus'},
 navis:{forms:[['navis','navis','navem','navis','navi','navi'],['naves','naves','naves','navium','navibus','navibus']],gender:'f',genders:['f'],allowed:'magnus parvus longus'},
 urbs:{forms:[['urbs','urbs','urbem','urbis','urbi','urbe'],['urbes','urbes','urbes','urbium','urbibus','urbibus']],gender:'f',genders:['f'],allowed:'magnus parvus vicinus'}
};
const alternatives={
 civis:[['civi','ABL','SG'],['civis','ACC','PL']],
 navis:[['nave','ABL','SG'],['navim','ACC','SG'],['navis','ACC','PL']],
 urbs:[['urbis','ACC','PL']]
};
for(const [lemma,f] of Object.entries(fixtures)){
 assert(index.vocabulary.lat[lemma]?.lat1,'Lema no exigible en Latín I: '+lemma);
 const source=index.rows.lat.filter(r=>r[0]===lemma&&r[3]===0);
 assert(source.length>=12,'Sin matriz histórica: '+lemma);
 assert.equal(index.rows.lat.filter(r=>r[0]===lemma&&r[3]===5).length,0,'Promoción indebida: '+lemma);
 const matches=(form,cas,num)=>source.some(r=>norm(r[1])===form&&
  r[2].startsWith('N;')&&r[2].split(';').includes(cas)&&r[2].split(';').includes(num));
 for(let num=0;num<2;num++)for(let k=0;k<6;k++)
  assert(matches(f.forms[num][k],names[k],num?'PL':'SG'),
   'Sin respaldo en índice: '+lemma+' '+names[k]+' '+(num?'PL':'SG'));
 for(const [form,cas,num] of alternatives[lemma])
  assert(matches(form,cas,num),'Variante histórica desaparecida: '+lemma+' '+form);
}
if(sourceOnly){
 for(const name of ['index.html','offline.html']){
  const html=fs.readFileSync(path.join(root,name),'utf8');
  assert(html.includes('LATIN_VERIFIED_MF_I_STEMS')&&html.includes('civium')&&
   html.includes('navium')&&html.includes('urbium'),
   name+' no incorpora los tres paradigmas morfológicos');
 }
 console.log('PASS: 36 casillas y variantes de fuente 0; HTML web/autónomo presentes (sin navegador)');
 process.exit(0);
}
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const page=await browser.newPage({viewport:{width:1320,height:900}});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
   for(const course of ['latin1','latin4'])for(const lang of ['es','va']){
    const result=await page.evaluate(({course,lang})=>{
     const set=(id,value)=>{const x=document.getElementById(id);
      x.value=value;x.dispatchEvent(new Event('change',{bubbles:true}));};
     set('course',course);set('model','tablas');set('lang',lang);
     document.querySelectorAll('.unit-choice').forEach(x=>x.checked=true);
     const chosen=selectedUnits(),bank=latinSyntagmNouns(chosen),
      tables=latinCompleteDeclensionItems(chosen);
     const key=s=>mNormalize(s).toLowerCase(),out={};
     for(const lemma of ['civis','navis','urbs']){
      const sample={civis:'civis, –is (m. o f.)',navis:'navis, –is (f.)',
       urbs:'urbs, urbis (f.)'}[lemma];
      const full={civis:'civis, civis (m.)',navis:'navis, navis (f.)',
       urbs:'urbs, urbis (f.)'}[lemma];
      const item=tables.find(x=>key(x.p.lemma)===lemma);
      out[lemma]={short:mNoun(sample),full:mNoun(full),
       bank:bank.find(x=>key(x.p.lemma)===lemma)?.p||null,
       table:item?.p||null,compound:item?.compound?.forms||null,
       adjective:key(headLex(item?.compound?.adjective?.entry||'')),
       allowed:latinSyntagmSemanticPairs[lemma]};
     }
     const genderFemale=mNoun('civis, civis (f.)'),
      genderY=mNoun('civis, –is (m. y f.)'),
      invalid=['civis, civis (n.)','civis, ovis (m.)',
       'navis, navis (m.)','navis, nabis (f.)',
       'urbs, urbis (m.)','urbs, orbis (f.)','hostis, hostis (f.)']
       .map(x=>mNoun(x));
     const early=['UD1','UD2','UD3'].map(u=>latinSyntagmNouns([u])
      .map(x=>key(x.p.lemma)).filter(x=>['civis','navis','urbs'].includes(x)));
     set('model','morf');
     const available=new Set(latinExamFormCandidates(chosen,true)[0]
      .map(x=>key(headLex(x.entry))));
     const required=course==='latin1'?['civis','navis','urbs']:['civis','urbs'];
     return {out,genderFemale,genderY,invalid,early,
      morphology:required.map(x=>[x,available.has(x)])};
    },{course,lang});
    const ctx=file+'/'+course+'/'+lang;
    assert(result.invalid.every(x=>x===null),ctx+' se admitió un enunciado falso');
    assert.equal(result.genderFemale?.gender,'f',ctx+' civis femenino');
    assert.deepEqual(result.genderFemale?.genders,['m','f'],ctx+' civis dos géneros');
    assert.equal(result.genderY?.gender,'m',ctx+' civis «m. y f.»');
    assert(result.early.every(x=>x.length===0),ctx+' tercera declinación anticipada');
    assert(result.morphology.every(x=>x[1]),ctx+' morfología omitida '+JSON.stringify(result.morphology));
    for(const [lemma,f] of Object.entries(fixtures)){
     const p=result.out[lemma];
     for(const field of ['short','full','bank','table']){
      const value=p[field];
      assert(value,ctx+' '+lemma+' falta '+field);
      assert.equal(value.kind,'3mf',ctx+' '+lemma+' clase');
      assert.equal(value.gender,f.gender,ctx+' '+lemma+' género');
      assert.deepEqual(value.genders,f.genders,ctx+' '+lemma+' géneros válidos');
      assert.deepEqual(value.forms,f.forms,ctx+' '+lemma+' 12 casillas');
     }
     assert.equal(p.allowed,f.allowed,ctx+' '+lemma+' pares naturales');
     assert(f.allowed.split(' ').includes(p.adjective),ctx+' '+lemma+' pareja no autorizada');
     assert.equal(p.compound?.length,2,ctx+' '+lemma+' sin sintagma');
     for(let n=0;n<2;n++)for(let k=0;k<6;k++){
      const words=p.compound[n][k].split(' ');
      assert.equal(words.length,2,ctx+' '+lemma+' dos palabras');
      assert.equal(words[0],f.forms[n][k],ctx+' '+lemma+' flexión del nombre');
     }
    }
   }
   assert.deepEqual(errors,[],file+' errores de página');
   await page.close();
  }
  console.log('PASS: 36 casillas y variantes históricas; concordancia, web/PWA ES/VA, Latín I y 4.º');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
