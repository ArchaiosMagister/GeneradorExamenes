// Regression of the 15 historical Greek I vocabulary-review discrepancies.
// Source of truth: the corrected 14-unit texts in this branch, not a
// normalized lemmatizer index. Spelling corrections do not verify paradigms.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/vocabulary/greek1-units-corrected.json'),'utf8'));
assert.equal(data.count,14);
assert.equal(data.course,'gr1');
assert.equal(data.units.length,14);
const cases=[
 [1,'ἄνρωπος','ἄνθρωπος'],
 [4,'στρατεγὸς','στρατηγός'],
 [6,'Aἰσχύλος','Αἰσχύλος'],
 [8,'στρατεγοὶ','στρατηγοὶ'],
 [8,'στρατεγὸς','στρατηγὸς'],
 [11,'oἱ','οἱ'],
 [11,'εἷχεν','εἶχεν'],
 [11,'στρατεγός','στρατηγός'],
 [12,'oἱ','οἱ'],
 [12,'ἐφεύξεν','ἔφυγεν'],
 [12,'Δημοσθήνης','Δημοσθένης'],
 [13,'εἴς','εἰς'],
 [13,'σωτερίας','σωτηρίας'],
 [14,'θάλάττῃ','θαλάττῃ'],
 [14,'οἰκῦσιν','οἰκοῦσιν'],
 [14,'Περίκλους','Περικλέους'],
 [14,'ὠρᾶ','ἑώρα']
];
const words=text=>[...text.matchAll(/[\p{L}\p{M}]+/gu)].map(m=>m[0].normalize('NFC'));
for(const [num,old,correct] of cases){
 const unit=data.units.find(u=>u.title==='UD'+num);
 assert.ok(unit,'Unidad ausente: '+num);
 const tokens=words(unit.text);
 assert.ok(!tokens.includes(old.normalize('NFC')),'Persiste una errata en UD'+num+': '+old);
 assert.ok(tokens.includes(correct.normalize('NFC')),'Falta la corrección en UD'+num+': '+correct);
}
// Do not store supposedly checked analyses or overwrite the teacher's originals.
for(const unit of data.units){
 assert.ok(unit.text.trim(),'Texto original desaparecido en '+unit.title);
 assert.ok(!unit.rows?.some(row=>row.verified===true),
  'Una revisión editorial no verifica formas: '+unit.title);
}
console.log('OK: 17 comprobaciones de grafía sobre 15 incidencias, 14 unidades sin flexiones promovidas.');
