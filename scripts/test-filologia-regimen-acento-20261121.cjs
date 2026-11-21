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
// Continuación 21/11: seis correcciones sin ampliar el repertorio ni tocar el motor evaluable.
const greekAccentFixes=[
 ['UD5','ἀγαθὴν ψυχὴν','ἀγαθήν ψυχὴν'],
 ['UD7','ὑμεῖς δ’ ἐμοῦ οὐκ ἀκούετε','ὑμεῖς δ’ ἑμοῦ οὐκ ἀκούετε'],
 ['UD10','οἱ δὲ μένοντες','οἱ δε μένοντες'],
 ['UD10','τῶν πτερῶν','τών πτερῶν'],
 ['UD13','θνητῆς δὲ μητρὸς','θνητῆς δε μητρὸς'],
 ['UD13','τῶν ἐχθρῶν κώμας','τῶν ἑχθρῶν κώμας']
];
for(const [unit,correct,incorrect] of greekAccentFixes){
 const text=project.units.find(row=>row.title===unit)?.text;
 assert(text&&text.includes(correct),unit+': falta '+correct);
 assert(!text.includes(incorrect),unit+': persiste '+incorrect);
}
assert.equal(greekAccentFixes.length,6);
// Dos superficies de ζῷον (UD13): el nominativo/acusativo neutro plural es ζῷα.
const unit13=project.units.find(row=>row.title==='UD13').text;
assert(unit13.includes('ζῷα:'),'UD13: listado nominal sin iota suscrita');
assert(unit13.includes('τεθηρεύκασι ζῷα ἐν τῇ νήσῳ'),'UD13: oración sin iota suscrita');
assert(!unit13.includes('ζῶα'),'UD13 conserva grafías sin iota de ζῷον');
// Continuación: acentos graves ante palabra siguiente y οὐκ ante vocal suave.
const greekContextualAccentFixes=[
 ['UD3','ἡ φωνὴ τῆς Ἀθηνᾶς','ἡ φωνή τῆς Ἀθηνᾶς'],
 ['UD5','οὐκ ἀεὶ δικαιός','οὐκ ἀεί δικαιός'],
 ['UD5','οὐκ ἀεὶ οἱ ἄνθρωποί','οὐ ἀεί οἱ ἄνθρωποί'],
 ['UD9','οἱ θεοὶ γιγνώσκουσι','οἱ θεοί γιγνώσκουσι'],
 ['UD10','ἀγαθοὶ οὐκ εἰσίν','ἀγαθοί οὐκ εἰσίν'],
 ['UD11','τῷ παιδὶ τὸν πλούτον','τῷ παιδί τὸν πλούτον'],
 ['UD14','χρὴ τὰς δόξας','χρή τὰς δόξας'],
 ['UD14','πολλοὶ ἄνθρωποι τὸν θάνατον','πολλοί ἄνθρωποι τὸν θάνατον']
];
for(const [unit,good,bad] of greekContextualAccentFixes){
 const text=project.units.find(row=>row.title===unit)?.text;
 assert(text&&text.includes(good),unit+': falta '+good);
 assert(!text.includes(bad),unit+': persiste '+bad);
}
assert.equal(greekContextualAccentFixes.length,8);
console.log('TERCERA RONDA FILOLÓGICA: 14 UD, 471 entradas, 11 oraciones seleccionables y análisis coherentes');
