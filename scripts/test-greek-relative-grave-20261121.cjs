'use strict';
/* Regresión de 26 relativos en contexto: ninguna promoción morfológica. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=JSON.parse(fs.readFileSync('data/vocabulary/greek1-units-corrected.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('data/vocabulary/greek1-relative-grave-audit-20261121.json','utf8'));
const verified=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
assert.equal(source.course,'gr1');assert.equal(source.units.length,14);
assert.equal(source.units.reduce((n,u)=>n+u.text.split('\n').filter(Boolean).length,0),471);
assert.equal(ledger.schema,1);assert.equal(ledger.course,'gr1');assert.equal(ledger.unitCount,14);
assert.equal(ledger.sourceLines,471);assert.equal(ledger.contextualCorrections,26);
assert.equal(ledger.automaticGradingEnabled,false);assert.equal(ledger.morphologyPromotion,false);
assert.equal(ledger.items.length,26);
assert.equal(verified.rows.grc.length,2817);
assert.equal(verified.rows.grc.filter(row=>row[3]===5).length,478);
const distribution={};const seen=new Set();
const valid=new Map([['ὅς','ὃς'],['ὅν','ὃν'],['ἥν','ἣν'],['ὅ','ὃ'],['οἵ','οἳ'],['οὕς','οὓς'],['ἅ','ἃ']]);
for(const item of ledger.items){
 assert(Number.isInteger(item.unit)&&item.unit>=1&&item.unit<=14);
 assert(Number.isInteger(item.line)&&item.line>=1);
 const key=item.unit+':'+item.line;assert(!seen.has(key),'Corrección duplicada '+key);seen.add(key);
 assert.equal(valid.get(item.form),item.updatedForm,'Relativo ajeno a este cotejo');
 assert(item.before.includes(item.form+' '+item.nextWord),'Original no contextualizado: '+key);
 assert.equal(item.after,item.before.replace(item.form+' '+item.nextWord,item.updatedForm+' '+item.nextWord),
  'La sustitución debe ser exclusivamente contextual y diacrítica: '+key);
 const text=source.units[item.unit-1].text.split('\n')[item.line-1];
 assert.equal(text,item.after,'Texto docente desincronizado: '+key);
 assert.notEqual(text,item.before,'Grafía anterior reintroducida: '+key);
 distribution[item.unit]=(distribution[item.unit]||0)+1;
}
assert.deepEqual(distribution,{9:19,10:1,11:2,12:3,13:1});

const contextual=JSON.parse(fs.readFileSync('data/vocabulary/greek1-relative-contextual-attestations-20261121.json','utf8'));
assert.equal(contextual.schema,1);
assert.equal(contextual.course,'gr1');
assert.equal(contextual.autoPromote,false);
assert.equal(contextual.automaticGradingEnabled,false);
assert.equal(contextual.morphologyPromotion,false);
assert.equal(contextual.items.length,15);
const expectedEntries={'οἳ':11,'ὃν':3,'ἣν':1},recorded={};
const seenContext=new Set();
for(const item of contextual.items){
 const key=item.unit+':'+item.line;
 assert(!seenContext.has(key),'Colación repetida: '+key);seenContext.add(key);
 const original=ledger.items.find(x=>x.unit===item.unit&&x.line===item.line);
 assert(original,'No procede de las correcciones verificadas: '+key);
 assert.equal(item.form,original.updatedForm,'Forma no idéntica: '+key);
 assert.equal(item.context,original.after,'Oración no idéntica: '+key);
 assert(item.context.includes(item.antecedent),'Antecedente no localizado '+key);
 assert(item.role.includes('subordinada de relativo'),'No hay función de relativo '+key);
 assert.equal(item.analyzerStatus,'review');
 assert.deepEqual(item.analyzerCandidates,item.form==='οἳ'?['ο','οσ']:['ειμι','οσ']);
 recorded[item.form]=(recorded[item.form]||0)+1;
}
assert.deepEqual(recorded,expectedEntries);

const html=fs.readFileSync('index.html','utf8'),marker='const greekSentenceRows=[';
function sentences(t){
 const i=t.indexOf(marker),j=t.indexOf('];',i);
 assert(i>=0&&j>i,'Faltan las oraciones evaluables');
 return vm.runInNewContext('(['+t.slice(i+marker.length,j)+'])');
}
const graded=sentences(html);assert.equal(graded.length,11);
if(process.argv.includes('--offline')){
 const offline=fs.readFileSync('offline.html','utf8');
 assert.equal(JSON.stringify(graded),JSON.stringify(sentences(offline)),'11 evaluables distintas web/offline');
 // Las 26 frases son datos curriculares persistentes en data/vocabulary/;
 // el HTML autónomo contiene el motor y las once oraciones evaluables,
 // pero no inserta el archivo curricular completo como texto literal.
}
console.log('GRIEGO: 26 relativos con grave contextual en cinco unidades; 471 renglones, 11 evaluables e índice inalterados.');
