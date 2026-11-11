const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const corpus=JSON.parse(fs.readFileSync(path.join(__dirname,'../tests/greek-priority-forms.json'),'utf8'));
assert.equal(corpus.schema,1);
assert.equal(corpus.units.length,14);
const corrections=[
 [1,'ἄνρωπος','ἄνθρωπος'],[4,'στρατεγὸς','στρατηγός'],
 [6,'Aἰσχύλος','Αἰσχύλος'],[8,'στρατεγοὶ','στρατηγοὶ'],[8,'στρατεγὸς','στρατηγὸς'],
 [11,'oἱ','οἱ'],[11,'εἷχεν','εἶχεν'],[11,'στρατεγός','στρατηγός'],
 [12,'oἱ','οἱ'],[12,'ἐφεύξεν','ἔφυγεν'],[12,'Δημοσθήνης','Δημοσθένης'],
 [13,'εἴς','εἰς'],[13,'σωτερίας','σωτηρίας'],
 [14,'θάλάττῃ','θαλάττῃ'],[14,'οἰκῦσιν','οἰκοῦσιν'],
 [14,'Περίκλους','Περικλέους'],[14,'ὠρᾶ','ἑώρα']
];
for(const [unit,previous,updated] of corrections){
 const text=corpus.units.find(u=>u.unit===unit);
 assert.ok(text,'Missing UD'+unit);
 const normalized=new Set(text.forms.map(form=>form.normalize('NFC')));
 assert.ok(!normalized.has(previous.normalize('NFC')),'Old typo persists UD'+unit+': '+previous);
 assert.ok(normalized.has(updated.normalize('NFC')),'Approved correction missing UD'+unit+': '+updated);
}
console.log('OK: 17 regression corrections in 14 Greek I units; text fixture only, no morphology verification.');
