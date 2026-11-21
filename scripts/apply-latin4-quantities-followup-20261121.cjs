#!/usr/bin/env node
'use strict';
// Ronda posterior a PR205: cantidades vocálicas de impero y oppidum.
// Solo lista exigible de Latín 4.º, banco de su curso, migración de semillas
// y correcciones editoriales persistentes. Las flexiones no se certifican.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const qty=[
 {lemma:'impero',old:'īmpĕro',new:'ĭmpĕro',total:1,
  from:'īmpĕro (1ª)',to:'ĭmpĕro (1ª)',
  reference:'https://en.wiktionary.org/wiki/impero',
  note:'Vocal inicial i breve; la sílaba im- es larga por posición, no la vocal.'},
 {lemma:'oppidum',old:'ōppĭdŭm',new:'ŏppĭdŭm',total:4,
  from:'ōppĭdŭm, –ī',to:'ŏppĭdŭm, –ī',
  reference:'https://alatius.com/ls/index.php?l=oppidorum',
  note:'Primera o breve; la sílaba op- es larga por la geminada pp.'}
];
const num=(s,x)=>s.split(x).length-1;
function patch(s,label){
 let out=s;
 for(const {old,new:target,total} of qty){
  const count=num(out,old);
  assert(count===0||count===total,label+': número inesperado '+old+' = '+count);
  if(count)out=out.replaceAll(old,target);
 }
 return out;
}
const reqPath='required-latin-units.js', originalReq=read(reqPath), amendedReq=patch(originalReq,reqPath);
const required=JSON.parse(amendedReq.split('window.ExaminaRequiredLatinUnits=')[1].replace(/;\s*$/,''));
assert.equal(Object.values(required.courses.latin1).flat().length,1106);
assert.equal(Object.values(required.courses.latin4).flat().length,541);
for(const [unit,entry] of [
 ['UD5','ĭmpĕro (1ª)'],
 ['UD2','ŏppĭdŭm, –ī'],['UD5','ŏppĭdŭm, –ī'],
 ['UD7','ŏppĭdŭm, –ī'],['UD8','ŏppĭdŭm, –ī']]){
 assert.equal(required.courses.latin4[unit].filter(x=>x===entry).length,1,unit+' '+entry);
}
const htmlPath='index.html',oldHtml=read(htmlPath);
const bankStart=oldHtml.indexOf('vocab.push(...['),bankEnd=oldHtml.indexOf(');\n',bankStart);
assert(bankStart>0&&bankEnd>bankStart,'Bloque de Latín 4.º ausente');
let html=oldHtml.slice(0,bankStart)+patch(oldHtml.slice(bankStart,bankEnd),'banco latino 4.º')+oldHtml.slice(bankEnd);
const migrationMark='["mŭlĭĕr, –ris","mŭlĭĕr, –eris (f.)"]]';
const migrationNext='["mŭlĭĕr, –ris","mŭlĭĕr, –eris (f.)"],["īmpĕro (1ª)","ĭmpĕro (1ª)"],["ōppĭdŭm, –ī","ŏppĭdŭm, –ī"]]';
if(!html.includes(migrationNext)){
 assert.equal(num(html,migrationMark),1,'Migración de semillas desconocida');
 html=html.replace(migrationMark,migrationNext);
}
const overridesPath='data/lemmas/verified-overrides.json';
const originalOverrides=read(overridesPath),overrides=JSON.parse(originalOverrides);
assert.equal(overrides.schema,1); assert.equal(overrides.sourceCode,5);
for(const item of qty){
 const matches=overrides.entryCorrections.filter(x=>x.lang==='lat'&&x.course==='lat4'&&x.lemma===item.lemma);
 assert(matches.length<2,'Override duplicado: '+item.lemma);
 if(matches.length){
  assert.equal(matches[0].from,item.from);
  assert.equal(matches[0].to,item.to);
 }else overrides.entryCorrections.push({
  lang:'lat',course:'lat4',lemma:item.lemma,from:item.from,to:item.to,
  reference:item.reference,note:item.note
 });
}
const newOverrides=JSON.stringify(overrides,null,2)+'\n';
for(const [path,before,after] of [
 [reqPath,originalReq,amendedReq],
 [htmlPath,oldHtml,html],
 [overridesPath,originalOverrides,newOverrides]
])if(before!==after)fs.writeFileSync(path,after);
console.log('Continuación Latin4: impero y 4 oppidum, 541 exigibles y migraciones preservadas.');
