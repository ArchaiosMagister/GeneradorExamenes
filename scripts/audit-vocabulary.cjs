const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(fs.readFileSync(path.join(root,'offline-lemmas.js'),'utf8'),ctx);
const api=ctx.window.ExaminaOfflineLemmatizer,data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json')));
const start=html.indexOf('let vocab=')+10,end=html.indexOf(';',start);
const bank=JSON.parse(html.slice(start,end));
for(const match of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(match[1]));
for(const [c,course,lang] of [['lat1','latin1','lat'],['lat4','latin4','lat'],['gr1','greek1','grc']]){
 const rows=bank.filter(x=>(x.course||'latin1')===course),heads=new Set(rows.map(x=>api.normalize(x.entry.split(',')[0].replace(/\s*\([^)]*\).*/,''))));
 console.log(JSON.stringify({course,rows:rows.length,missingTranslation:rows.filter(x=>!x.meaning?.trim()).length,indexedLemmasWithoutBankMatch:Object.keys(data.vocabulary[lang]).filter(k=>data.vocabulary[lang][k][c]&&!heads.has(api.normalize(k))&&!rows.some(x=>api.normalize(x.entry)===api.normalize(data.vocabulary[lang][k][c].entry))),coverage:api.coverage(data,c)}));
}
