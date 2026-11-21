#!/usr/bin/env node
'use strict';
// 16 cantidades en cinco lemas de Latín 4.º; no se añaden formas evaluables.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const fixes=[
 ['altus','āltus','ăltus',4,'āltus, –a, –um','ăltus, –a, –um','https://en.wiktionary.org/wiki/altus'],
 ['magnus','māgnus','măgnus',7,'māgnus, –a, –um','măgnus, –a, –um','https://en.wiktionary.org/wiki/magnus'],
 ['longus','lōngus','lŏngus',2,'lōngus, –a, –um','lŏngus, –a, –um','https://en.wiktionary.org/wiki/longus'],
 ['gemma','gēmma','gĕmma',1,'gēmma, –æ','gĕmma, –æ','https://en.wiktionary.org/wiki/gemma'],
 ['littera','līttĕra','lĭttĕra',2,'līttĕra, –æ','lĭttĕra, –æ','https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n26829/']
];
const count=(s,t)=>s.split(t).length-1;
function patch(source,label){
 let out=source;
 for(const [lemma,before,after,total] of fixes){
  const n=count(out,before);
  assert(n===0||n===total,label+': '+lemma+' appears '+n+' times');
  if(n)out=out.replaceAll(before,after);
 }
 return out;
}
const reqPath='required-latin-units.js',origReq=read(reqPath),newReq=patch(origReq,reqPath);
const required=JSON.parse(newReq.split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
assert.equal(Object.values(required.courses.latin1).flat().length,1106);
assert.equal(Object.values(required.courses.latin4).flat().length,541);
const pairs=[
 ['UD1','ăltus, –a, –um'],['UD3','ăltus, –a, –um'],['UD4','ăltus, –a, –um'],['UD7','ăltus, –a, –um'],
 ['UD1','măgnus, –a, –um'],['UD2','măgnus, –a, –um'],['UD3','măgnus, –a, –um'],['UD5','măgnus, –a, –um'],
 ['UD6','măgnus, –a, –um'],['UD7','măgnus, –a, –um'],['UD9','măgnus, –a, –um'],
 ['UD1','lŏngus, –a, –um'],['UD2','lŏngus, –a, –um'],
 ['UD1','gĕmma, –æ'],['UD2','lĭttĕra, –æ'],['UD3','lĭttĕra, –æ']
];
assert.equal(pairs.length,16);
for(const [ud,entry] of pairs)assert.equal(required.courses.latin4[ud].filter(s=>s===entry).length,1,ud+': '+entry);
const htmlPath='index.html',origHtml=read(htmlPath),a=origHtml.indexOf('vocab.push(...['),b=origHtml.indexOf(');\n',a);
assert(a>0&&b>a,'Banco lat4 ausente');
let html=origHtml.slice(0,a)+patch(origHtml.slice(a,b),'Banco lat4')+origHtml.slice(b);
const marker='["ōppĭdŭm, –ī","ŏppĭdŭm, –ī"]]';
const expanded='["ōppĭdŭm, –ī","ŏppĭdŭm, –ī"],'+fixes.map(x=>JSON.stringify([x[4],x[5]])).join(',')+']';
if(!html.includes(expanded)){
 assert.equal(count(html,marker),1,'Migración previa no localizada');
 html=html.replace(marker,expanded);
}
const path='data/lemmas/verified-overrides.json',origOver=read(path),over=JSON.parse(origOver);
assert.equal(over.schema,1);assert.equal(over.sourceCode,5);
for(const [lemma,before,after,total,from,to,reference] of fixes){
 const matches=over.entryCorrections.filter(x=>x.lang==='lat'&&x.course==='lat4'&&x.lemma===lemma);
 assert(matches.length<=1,'Override duplicado '+lemma);
 if(matches.length){assert.equal(matches[0].from,from);assert.equal(matches[0].to,to);}
 else over.entryCorrections.push({lang:'lat',lemma,course:'lat4',from,to,reference,
  note:'Breve inicial contrastada; no equivale a cantidad silábica ni certifica nuevas flexiones.'});
}
const newOver=JSON.stringify(over,null,2)+'\n';
for(const [file,before,after] of [[reqPath,origReq,newReq],[htmlPath,origHtml,html],[path,origOver,newOver]])
 if(before!==after)fs.writeFileSync(file,after);
console.log('Latín 4.º: 16 entradas, 5 overrides y listas conservadas.');
