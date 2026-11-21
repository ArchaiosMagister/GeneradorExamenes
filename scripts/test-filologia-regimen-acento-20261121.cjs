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
 ['UD13','θνητῆς δὲ μητρὸς','θνητῆς δε μητρὸς'],
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
 ['UD5','οὐκ ἀεὶ δίκαιός','οὐκ ἀεί δικαιός'],
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
const greekNegationCorrections=[
 ['UD10','μάχεσθαι οὐκ ἐβούλοντο.','μάχεσθαι οὐ ἐβούλοντο.'],
 ['UD12','οἱ Λακεδαιμόνιοι οὐκ ἔσωσαν','οἱ Λακεδαιμόνιοι οὐ ἔσωσαν']
];
for(const [unit,good,bad] of greekNegationCorrections){
 const text=project.units.find(row=>row.title===unit)?.text;
 assert(text&&text.includes(good),unit+': falta '+good);
 assert(!text.includes(bad),unit+': persiste '+bad);
}
assert.equal(greekNegationCorrections.length,2);

// Ronda complementaria: nominativo plural de πολέμιος, sin tocar otros casos.
const polemioFixes={UD6:2,UD7:2,UD11:2,UD12:1};
let correctedPolemioi=0;
for(const [unit,number] of Object.entries(polemioFixes)){
 const raw=project.units.find(row=>row.title===unit).text.normalize('NFC');
 const correct=(raw.match(/πολέμιοι/g)||[]).length;
 assert(correct>=number,unit+': faltan nominativos πολέμιοι ('+correct+'/'+number+')');
 correctedPolemioi+=number;
}
for(const unit of project.units){
 const raw=unit.text.normalize('NFC');
 assert(!/(^|[^\p{L}])πολεμίοι($|[^\p{L}])/u.test(raw),unit.title+': nominativo plural mal acentuado');
}
assert.equal(correctedPolemioi,7);

// Elisión ático clásica: apóstrofo y separación del término siguiente.
for(const [unit,good,bad] of [
 ['UD11','δ’ Ἕλληνες','δ’Ἕλληνες'],
 ['UD12','οὐδ’ ἔλεξε','οὐδ’ἔλεξε']
]){
 const t=project.units.find(x=>x.title===unit)?.text;
 assert(t?.includes(good),unit+' elision absent');assert(!t.includes(bad),unit+' elision not spaced');
}
// Smyth §187b: ἔστιν tras οὐκ, no ἐστιν ni proclítico οὔκ.
const ud5neg=project.units.find(x=>x.title==='UD5').text.normalize('NFC');
assert.equal(ud5neg.split('οὐκ ἔστιν').length-1,3,'Tres casos de negación + ἔστιν');
assert(!ud5neg.includes('οὔκ ἐστιν'));
assert(!ud5neg.includes('οὐκ ἐστιν'));

// Smyth §§183c, 187b: acento léxico y ἐστιν enclítico en predicaciones no existenciales.
for(const [ud,correct,incorrect] of [["UD5","ὁ ἄνθρωπος οὐκ ἀεὶ δίκαιός ἐστιν.","ὁ ἄνθρωπος οὐκ ἀεὶ δικαιός ἐστιν."],["UD5","ὁ ἄνθρωπός ἐστιν οὔτε ἰατρός οὔτε φιλόσοφος.","ὁ ἄνθρωπος ἔστιν οὔτε ἰατρός οὔτε φιλόσοφος."],["UD5","ὁ πόλεμος οὔτε καλὸς οὔτε δίκαιός ἐστιν.","ὁ πόλεμος οὔτε καλὸς οὔτε δίκαιος ἔστιν."],["UD8","διὰ τί ὁ πόλεμος κακός ἐστιν;","διὰ τί ὁ πόλεμος κακός ἔστιν;"]]){
 const text=project.units.find(x=>x.title===ud).text;
 assert(text.includes(correct),ud+': falta acentuación enclítica '+correct);
 assert(!text.includes(incorrect),ud+': persiste acentuación errónea '+incorrect);
}
// Sólo los cuatro renglones de UD13 con marcas combinantes se normalizan, sin rehacer el resto.
const comb=/[\u0370-\u03ff\u1f00-\u1fff][\u0300-\u036f]/u;
assert(project.units.every(x=>!comb.test(x.text)),'Aún quedan marcas de acentuación descompuestas');
const ud13b=project.units.find(x=>x.title==='UD13').text;
for(const token of ['ἐπεπυρεύκεισαν:','πατρὸς:','οἱ στρατιῶται τὰς τῶν ἐχθρῶν κώμας','Ἡρακλῆς ἐπεφύκει'])
 assert(ud13b.includes(token),'Falta grafía Ud13 '+token);

console.log('TERCERA RONDA FILOLÓGICA: 14 UD, 471 entradas, 11 oraciones seleccionables y análisis coherentes');
