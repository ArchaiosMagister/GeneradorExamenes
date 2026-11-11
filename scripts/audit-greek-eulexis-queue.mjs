#!/usr/bin/env node
/* Auditoría local: no publica el corpus Eulexis; solo informa agregados. */
import fs from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const context=vm.createContext({window:{},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>null,setItem:()=>{}}});
new vm.Script(fs.readFileSync('greek-review.js','utf8')).runInContext(context);
const api=context.window.ExaminaGreekReview;
const args=process.argv.slice(2);
const path=args[0]||'private/eulexis-review.json';
const source=fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):null;
const imported=source?api.parseImport(source):[];
const cases=api.buildCases(data,imported);
let nOne=0,nMultiple=0,nMultiLemma=0,nSameLemma=0,nExternal=0;
const samples={sameLemma:[],multiLemma:[],eulexisSingle:[]};
for(const c of cases){
 const lemmas=new Set(c.options.map(o=>api.norm(o.lemma)));
 if(c.options.length===1)nOne++;else nMultiple++;
 if(lemmas.size>1){nMultiLemma++;if(samples.multiLemma.length<8)samples.multiLemma.push({form:c.form,options:c.options.map(o=>o.lemma+' | '+o.analysis).slice(0,4)});}
 else if(c.options.length>1){nSameLemma++;if(samples.sameLemma.length<30)samples.sameLemma.push({form:c.form,options:c.options.map(o=>o.lemma+' | '+o.analysis).slice(0,7)});}
 if(c.withEulexis)nExternal++;
 if(c.kind==='eulexis-proposal'&&samples.eulexisSingle.length<8)samples.eulexisSingle.push({form:c.form,analysis:c.options[0].analysis});
}
console.log('AUDITORIA_CASOS '+JSON.stringify({sourceRows:imported.length,cases:cases.length,nOne,nMultiple,nMultiLemma,nSameLemma,nExternal,samples}));
