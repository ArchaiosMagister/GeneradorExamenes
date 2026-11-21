'use strict';
// Auditoría de concordancia, régimen, acento y análisis efectivo.
// No añade lemas de análisis ni modifica las restricciones por unidad.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const project=JSON.parse(fs.readFileSync('data/vocabulary/greek1-units-corrected.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
assert.equal(project.count,14);
assert.equal(project.units.length,14);
assert.equal(project.units.reduce((n,x)=>n+x.text.split('\n').filter(Boolean).length,0),471);
const expectations=[
 ['UD4','ἐν ταῖς Ἀθήναις οἱ πολῖται'],['UD5','τοῖς φίλοις πολλάκις'],
 ['UD8','οὗτος ὁ σοφὸς ἄνθρωπος;'],
 ['UD8','περὶ τί λέγει ὁ Σωκράτης ἐν τῇ ἀγορᾷ;'],
 ['UD8','Ἕλλησι'],['UD8','τοὺς θῆρας'],
 ['UD8','ἐν Ἀθήναις οἱ ῥήτορες'],['UD8','θωράκων'],
 ['UD12','ἡ αὐλητρὶς μὲν ηὔλησεν'],['UD12','ἐδόκουν πολὺ εὐφραίνεσθαι ἐπὶ τῷ ἀκροάματι'],
 ['UD14','μᾶλλον ἢ τὰ χρήματα']
];
for(const [unit,token] of expectations){
 const row=project.units.find(x=>x.title===unit);
 assert(row?.text.includes(token),unit+': falta '+token);
}
for(const wrong of ['ἐν ταῖς Αθηναῖς','τοῖς φίλιοις','οὗτος σοφὸς ἄνθρωπος',
'Ἐλλήσι','τοὺς θήρας','ἡ αὑλητρὶς','εὐφραίνειν τοῦ ἀκροάματος','μᾶλλον ἤ τὰ','θώρακων','ἐν Ἀθηναῖς οἱ ῥήτορες'])
 assert(!project.units.some(x=>x.text.includes(wrong)),'Persiste '+wrong);
const mark='const greekSentenceRows=[',a=html.indexOf(mark),b=html.indexOf('];',a);
assert(a>=0&&b>a);
const rows=vm.runInNewContext('(['+html.slice(a+mark.length,b)+'])');
assert.equal(rows.length,11);
assert(rows.every(x=>x.length===6));
const athens=rows.find(x=>x[0].includes('οἱ πολῖται μετέχουσι'));
assert(athens&&athens[0].includes('ἐν ταῖς Ἀθήναις')&&athens[4].includes('ἐν ταῖς Ἀθήναις'));
const field=rows.find(x=>x[0].includes('τὰ ξύλα φέρει'));
assert(field&&field[4].includes('ἀγρὸν: dirección'));
const animal=rows.find(x=>x[0].includes('τόδε τὸ ζῷον'));
assert(animal&&animal[4].includes('ἡμῖν: dativo complemento del adjetivo φίλον'));
for(const bad of ['Ἀθηναῖς','ἀγρόν: dirección','ἡμῖν: dativo de relación'])
 assert(!rows.some(x=>x[4].includes(bad)),bad);
if(process.argv.includes('--offline')){
 const offline=fs.readFileSync('offline.html','utf8');
 for(const term of ['ἐν ταῖς Ἀθήναις οἱ πολῖται','ἡμῖν: dativo complemento del adjetivo φίλον','ἀγρὸν: dirección'])
  assert(offline.includes(term),'La versión offline conserva una versión previa: '+term);
}
console.log('TERCERA RONDA FILOLÓGICA: 14 UD, 471 entradas, 11 oraciones seleccionables y análisis coherentes');
