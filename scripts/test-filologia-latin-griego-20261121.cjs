'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),lat=read('required-latin-units.js'),greek=JSON.parse(read('data/greek1-materials.json'));
const teacher=JSON.parse(read('data/lemmas/teacher-forms.json')),ledger=JSON.parse(read('data/lemmas/verified-overrides.json'));
const examples=JSON.parse(read('data/vocabulary/greek1-units-corrected.json'));
for(const [lang,course,lemma,expected]of [
 ['lat','lat1','carthago','Carthago, −inis (f.)'],
 ['lat','lat4','pugno','pūgnō (1ª)'],
 ['lat','lat4','myro','Myro, –ōnis (m.)'],
 ['lat','lat4','stilus','stĭlus, –ī'],
 ['grc','gr1','μικροσ','μικρός, –ά, –όν']
]){
 assert.equal(teacher.vocabulary[lang][lemma]?.[course]?.entry,expected,lemma);
 const history=ledger.entryCorrections.filter(x=>x.lang===lang&&x.course===course&&x.lemma===lemma);
 assert.equal(history.length,1,lemma+' no tiene decisión única reproducible');
 assert.equal(history[0].to,expected);
 assert(/^https:\/\//.test(history[0].reference));
}
assert.equal(greek.required.length,172);
assert.equal(greek.required.find(x=>x.unit==='UD5'&&x.entry.startsWith('μικρός'))?.entry,'μικρός, –ά, –όν');
assert.equal(greek.required.find(x=>x.unit==='UD10'&&x.entry==='ἔτι (adv.)')?.meaning,'aún, todavía');
assert.equal(examples.units.length,14);
for(const correct of ['οἱ πολῖται μετέχουσι','πρὸς τὴν γῆν','αἱ γυναῖκες αὐταὶ τὸν πόλεμον παύουσιν.','τὴν αὐτῶν πόλιν','οἱ σοφοὶ περὶ τῆς σοφίας'])
 assert(html.includes(correct),'No se corrigió oración evaluable: '+correct);
const valenciano=read('lexicon-valenciano.js');
for(const term of ['"aún, todavía": "encara"','"estilo, punzón para escribir": "estil, punxó per a escriure"'])
 assert(valenciano.includes(term),'Falta traducción valenciana '+term);
for(const wrong of ['πολλοὶ ἂνθρωποι','ἀκούειν των Ἀθηναίων','ὁ τὴς πόλεως νόμος','τοῦς δούλους','τῇ θέᾳ','ὁ φιλόσοφὸς'])
 assert(!examples.units.some(x=>x.text.includes(wrong)),'Oración antigua: '+wrong);
for(const entry of ['Carthago, −inis (f.)','pūgnō (1ª)','Myro, –ōnis (m.)','stĭlus, –ī'])assert(lat.includes(entry));
assert(!/[\u0400-\u04FF]/u.test(lat));
assert(!Object.keys(teacher.vocabulary.lat).some(k=>/[\u0400-\u04FF]/u.test(k)));
assert(!teacher.rows.lat.some(x=>/[\u0400-\u04FF]/u.test(x[0])||/[\u0400-\u04FF]/u.test(x[1])));
assert(!teacher.rows.lat.some(x=>['myro','stilus'].includes(x[0])&&x[3]===5),'Se ha promovido un paradigma no autorizado');
assert(teacher.rows.grc.some(x=>x[0]==='μικροσ'&&x[3]===5),'Se perdieron formas cotejadas de μικρός');
const mark='const greekMaterials=',a=html.indexOf(mark),b=html.indexOf(';\n',a);
assert(a>=0&&b>a);
const embedded=JSON.parse(html.slice(a+mark.length,b)).required;
assert.equal(embedded.length,greek.required.length,'Cantidad de exigible distinta');
for(const [unit,entry] of [['UD5','μικρός, –ά, –όν'],['UD10','ἔτι (adv.)']]){
 const web=embedded.find(x=>x.unit===unit&&x.entry===entry);
 const source=greek.required.find(x=>x.unit===unit&&x.entry===entry);
 assert(web&&source,'Enunciado no sincronizado: '+entry);
 assert.equal(web.meaning,source.meaning,'Significado de exigible distinto para '+entry);
}
for(const error of ['Carthago, −inis (m.)','Mўrō̆','stўlus'])assert(!html.includes(error),'La web conserva '+error);
if(process.argv.includes('--offline')){
 const offline=read('offline.html');
 for(const entry of ['Carthago, −inis (f.)','pūgnō (1ª)','Myro, –ōnis (m.)','stĭlus, –ī','μικρός, –ά, –όν','aún, todavía'])
  assert(offline.includes(entry),'Paquete autónomo desactualizado: '+entry);
}
console.log('AUDITORÍA LÉXICA: 5 decisiones, 172 exigibles griegos, 14 unidades, sin contaminación cirílica o promociones');
