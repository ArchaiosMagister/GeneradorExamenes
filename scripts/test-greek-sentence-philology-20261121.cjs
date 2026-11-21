'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const corpus=JSON.parse(fs.readFileSync('data/vocabulary/greek1-units-corrected.json','utf8'));
const web=fs.readFileSync('index.html','utf8');
assert.equal(corpus.units.length,14);
assert.equal(corpus.units.reduce((n,u)=>n+u.text.split('\n').filter(Boolean).length,0),471);
const expected=[
['UD1','τῆς Αἰγύπτου'],['UD3','τῆς ἀληθείας θεά ἐστιν'],['UD3','ἡ νίκη'],
['UD3','ὁ φιλόσοφος'],['UD4','οἱ φιλόσοφοι'],
['UD4','οἱ θεοὶ τοῖς ἀνθρώποις δῶρα ἐκ τῆς γῆς καὶ τοῦ ὕδατος παρέχουσιν.'],
['UD5','ἀλλ’ αἰσχρός'],['UD5','οὔτε φιλόσοφος'],
['UD8','οἱ φιλόσοφοι'],['UD8','παῖδές τινες'],
['UD10','ἀγγελλόντων'],['UD11','ἐν τῷ τῆς μάχης κινδύνῳ'],
['UD11','τούτους τοὺς νεανίας'],['UD11','τοῦ διδασκάλου λόγων'],['UD11','τοῖς Ἀθηναίοις'],
['UD12','ἔσωσαν'],['UD12','ἐθαύμασε'],['UD12','ἐφύλαξαν'],
['UD12','ἔρριψαν'],['UD12','ἔγραψαν'],['UD12','ἐδίωξε'],['UD12','ἔγραψε'],['UD12','εἰσέβαλον'],
['UD14','ἐτιμᾶτο'],['UD14','ᾤκουν'],['UD14','τίνα ἐν τῇ οἰκίᾳ ὁρῶ;'],['UD14','εἰς τὴν πόλιν ἡγούμεθα']
];
for(const [unit,token] of expected)assert(corpus.units.find(x=>x.title===unit)?.text.includes(token),unit+': '+token);
for(const bad of ['ἐσῴσαν','ἐθαυμάσε','ἐφυλάξαν','ἐρίψαν','ἐγράψαν','ἐδιώξε','ἐγράψε','ἐσέβαλον','ἐτιμητο','ᾠκουν'])
 assert(!corpus.units.some(u=>u.text.includes(bad)),bad);
// Quinta ronda: grafías lexicográficas comprobadas, sin añadir respuestas automáticas.
const ud2=corpus.units.find(u=>u.title==='UD2').text;
const ud5=corpus.units.find(u=>u.title==='UD5').text;
assert(ud2.includes('ὁ ἰατρὸς ζῷον ἔχει.'));
assert(ud2.includes('ὁ ἵππος ζῷον ἐστιν.'));
assert(ud5.includes('ἐκ τῶν τῆς Ἀσίας χώρων.'));
assert(!corpus.units.some(u=>u.text.includes('ζῳόν')||u.text.includes('Ἁσίας')));
const anchor='const greekSentenceRows=[',a=web.indexOf(anchor),b=web.indexOf('];',a);
assert(a>=0&&b>a,'No hay oraciones de Griego I en el generador');
const rows=vm.runInNewContext('(['+web.slice(a+anchor.length,b)+'])');
assert.equal(rows.length,11,'Inventario evaluable modificado');
assert(rows.every(row=>row.length===6&&typeof row[0]==='string'&&Array.isArray(row[2])&&Array.isArray(row[5])));
assert(rows.some(row=>row[0]==='τόδε τὸ ζῷον φίλον ἡμῖν ἐστίν.'&&
 row[4].includes('τόδε τὸ ζῷον: sujeto')&&row[4].includes('ἡμῖν: dativo complemento del adjetivo φίλον')),'Demostrativo, dativo o análisis no sincronizados');
assert(rows.some(row=>row[0].includes('ἀγρὸν σὺν ἵπποις')),'Falta grave ante σὺν');
for(const typo of ['τὸδε τὸ ζῷον','ἡμίν','ἀγρόν σὺν'])assert(!rows.some(x=>x[0].includes(typo)),typo);
assert(web.includes("['s-2','s-3','s-7','s-9','p-13','pf-13']"),'Cuarentena histórica alterada');
if(process.argv.includes('--offline')){
 const offline=fs.readFileSync('offline.html','utf8');
 for(const token of ['τόδε τὸ ζῷον φίλον ἡμῖν ἐστίν.','ἀγρὸν σὺν ἵπποις'])
  assert(offline.includes(token),'Versión autónoma sin revisar: '+token);
}
const citations=JSON.parse(fs.readFileSync('data/vocabulary/greek1-aorist-audit-evidence-20261121.json','utf8'));
assert.equal(citations.items.length,3,'Faltan las tres colaciones externas');
assert.equal(citations.morphologyPromotion,false);
assert.equal(citations.automaticGradingEnabled,false);
console.log('FILOLÓGICA GRIEGA: 471 renglones docentes, 11 oraciones evaluables, acentos, formas y cuarentena OK');
