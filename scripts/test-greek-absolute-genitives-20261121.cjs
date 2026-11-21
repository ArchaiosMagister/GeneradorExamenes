'use strict';
// Auditoría contextual del genitivo absoluto en UD10: no acreditar paradigmas.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const load=p=>fs.readFileSync(p,'utf8');
const greek=JSON.parse(load('data/vocabulary/greek1-units-corrected.json'));
const audit=JSON.parse(load('data/vocabulary/greek1-absolute-genitive-agreement-20261121.json'));
const verified=JSON.parse(load('data/lemmas/teacher-forms.json'));
assert.equal(greek.course,'gr1');
assert.equal(greek.units.length,14);
assert.equal(greek.units.reduce((n,u)=>n+u.text.split('\\n').filter(Boolean).length,0),471);
assert.equal(audit.schema,1);
assert.equal(audit.unit,10);
assert.equal(audit.total,12);
assert.equal(audit.automaticGradingEnabled,false);
assert.equal(audit.morphologyPromotion,false);
assert.equal(verified.rows.grc.length,2817);
assert.equal(verified.rows.grc.filter(row=>row[3]===5).length,478);
const lines=greek.units[9].text.split('\\n');
const oldPart='ἀποπλευσάντων τῶν νεῶν';
const goodPart='ἀποπλευσασῶν τῶν νεῶν';
assert(lines[38].includes(goodPart),'El genitivo absoluto de las naves no concuerda');
assert(!lines.some(s=>s.includes(oldPart)),'Se ha recuperado el participio masculino');
assert(!lines[38].includes('τῶν νέων')&&!lines[38].includes('τῶν νέων'),
 'No sustituir las naves por jóvenes sin revisión editorial');
const expect=new Map([
 [29,['Ξέρξου','ἄρχοντος','M','SG','PRES']],
 [30,['Λυσάνδρου','ὄντος','M','SG','PRES']],
 [31,['τοῦ ἀρχόντος','ὄντος','M','SG','PRES']],
 [32,['τοῦ τυράννου','τελευτήσαντος','M','SG','AOR']],
 [33,['τοῦ κηροῦ','τήκοντος','M','SG','PRES']],
 [34,['τοῦ ἀνθρώπου','ἀποθνῄσκοντος','M','SG','PRES']],
 [35,['Περικλέους','ὄντος','M','SG','PRES']],
 [36,['τῶν κηρύκων','ἀγγελλόντων','M','PL','PRES']],
 [37,['τοῦ στρατηγοῦ','πέμποντος','M','SG','PRES']],
 [38,['τοῦ στρατηγοῦ','κελεύσαντος','M','SG','AOR']],
 [39,['τῶν νεῶν','ἀποπλευσασῶν','F','PL','AOR']],
 [40,['τοῦ ἱερέως','θύσαντος','M','SG','AOR']]
]);
assert.equal(audit.items.length,12);
const found=new Set();
for(const x of audit.items){
 assert.equal(x.unit,10);
 assert(expect.has(x.line),'Genitivo absoluto no inventariado: '+x.line);
 assert(!found.has(x.line),'Genitivo absoluto duplicado: '+x.line);
 found.add(x.line);
 const [subject,participle,gender,number,aspect]=expect.get(x.line);
 assert.equal(x.subject,subject);
 assert.equal(x.participle,participle);
 assert.equal(x.case,'GEN');assert.equal(x.gender,gender);
 assert.equal(x.number,number);assert.equal(x.aspect,aspect);assert.equal(x.voice,'ACT');
 assert.equal(x.syntax,'genitivo absoluto');
 assert.equal(x.sentence,lines[x.line-1]);
 assert(x.sentence.includes(x.participle)&&x.sentence.includes(x.subject),
  'Falta concordancia contextual: '+x.line);
}
assert.equal(found.size,12);
// Las 11 oraciones evaluables no se modifican; esta UD es un corpus externo.
const marker='const greekSentenceRows=[';
function rows(t){
 const i=t.indexOf(marker),j=t.indexOf('];',i);
 assert(i>=0&&j>i,'Faltan las oraciones evaluables');
 return vm.runInNewContext('(['+t.slice(i+marker.length,j)+'])');
}
const web=rows(load('index.html'));
assert.equal(web.length,11);
if(process.argv.includes('--offline')){
 const offline=rows(load('offline.html'));
 assert.equal(JSON.stringify(web),JSON.stringify(offline),
  'Cambió la matriz de oraciones evaluables entre web y offline');
}
console.log('PASS: 12 genitivos absolutos UD10, concordancia femenina de ναῦς, 14 UD, 471 renglones y 11 evaluables inalteradas');
