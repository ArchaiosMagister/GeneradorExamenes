const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'lexicon-valenciano.js'),'utf8'),ctx);
const dictionary=ctx.window.ExaminaValencianGloss;
assert.ok(dictionary?.count>1000,'El diccionario valenciano debería contener más de mil equivalencias.');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('let vocab=')+'let vocab='.length;
assert.ok(start>10);
const end=html.indexOf('];',start)+1;
const initial=JSON.parse(html.slice(start,end));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))initial.push(...JSON.parse(m[1]));
assert.equal(initial.length,2046,'La comprobación debe cubrir todo el léxico inicial.');
const pending=initial.filter(item=>!dictionary.lookup(item.meaning).ready);
assert.deepEqual(pending.map(x=>x.entry),[],'Significados pendientes de versión valenciana');
for(const item of initial){
 assert.equal(dictionary.forEntry(item,'es').value,item.meaning,'El castellano original no debe modificarse');
 assert.ok(dictionary.forEntry(item,'va').value,'Falta glosa valenciana: '+item.entry);
}

for(const [es,va] of Object.entries({
 'Eneas':'Enees','Haníbal':'Anníbal','Pericles':'Pèricles','Darío':'Darios',
 'Jerjes':'Xerxes','Sócrates':'Sòcrates','Filipo':'Filip','Catón':'Cató'})){
 assert.equal(dictionary.lookup(es).value,va,'Nombre propio sin adaptar: '+es);
}
assert.equal(dictionary.lookup('NombrePropioInexistente').ready,false,
 'Los nombres inventados no deben pasar a la lista de verificados');
assert.equal(dictionary.quoteGloss("ser’, ‘estar’, ‘haber"),'‘ser’, ‘estar’, ‘haber’');
assert.equal(dictionary.quoteGloss('llevar a cabo'),'“llevar a cabo”');
assert.equal(dictionary.quoteGloss("abundancia’ (sing.), ‘tropas’ (pl.)"),'‘abundancia’ (sing.), ‘tropas’ (pl.)');
const typoValues=new Set(['trær','cær','mæstro','aporximadamente']);
assert.ok(initial.every(x=>!typoValues.has(x.meaning)),'Erratas castellanas no corregidas');
const dux=initial.filter(x=>x.entry==='dux, ducis (m.)');
assert.ok(dux.length>=1&&dux.every(x=>x.meaning==='general'),'dux es sustantivo, no verbo');
assert.ok(initial.some(x=>x.entry==='gens, gentis (f.)'),'gens debe ser femenino');
const prefijos=JSON.parse(fs.readFileSync(path.join(root,'data/prefijos-docente.json'),'utf8'));
assert.equal(prefijos.items.find(x=>x.prompt==='Antifaz').prefix,'ANTE-/ANTI- (anterioridad)');
assert.equal(prefijos.items.length,286);
assert.ok(!prefijos.items.some(x=>/ultrapuert|ultraport/i.test(x.prompt+' '+x.prompt_va)),
 'Debe eliminarse Ultrapuertos de las dos versiones del banco');
const review=JSON.parse(fs.readFileSync(path.join(root,'data/revision-valenciano-pendiente.json'),'utf8'));
assert.equal(review.items.length,0,'No quedan decisiones pendientes');
assert.equal(review.resolved.length,13,'Se han aprobado las trece decisiones');
assert.ok(review.resolved.some(x=>x.id==='LAT1-REDUCO'&&x.decision.option==='c'),
 'Reduco fue aprobado por el docente');
assert.ok(review.resolved.some(x=>x.id==='PREF-ULTRAPUERTOS'&&x.decision.option==='c'));
const choices=[
 ['importo, importavi, importatum (1ª)','traer','portar',1],
 ['reduco, reduxi, reductum (3ª)','conducir de vuelta','conduir de tornada',1],
 ['impono, imposui, impositum (3ª)','imponer, colocar encima','imposar, posar damunt',1],
 ['καλέω','llamar','cridar, anomenar',1],
 ['μάλιστα (adv.)','muy','moltíssim, especialment',1],
 ['Ἀθηναῖος, –α, –ον','ateniense','atenenc/atenenca',1],
 ['στρατηγός, –ου','estratego','estrateg (general)',1],
 ['Gērmānus, –a, –um','germano/a','germànic/germànica',1],
 ['Paulus, –i','Paulo','Paulus',1],
 ['Callus, –i','Calo’ (gentilicio)','Calo (gentilici)',1],
 ['Orgetorix, –igis','Orgétorix','Orgétorix',1],
 ['Ἱέραξ, –ακος (ὁ)','Hiérax','Hiérax',1]
];
for(const [entry,es,va,expectedCount] of choices){
 const selected=initial.filter(x=>x.entry===entry);
 assert.equal(selected.length,expectedCount,'Número de entradas incorrecto: '+entry);
 for(const item of selected){
  assert.equal(item.meaning,es,'No debe cambiar el castellano salvo elección expresa: '+entry);
  assert.equal(item.meaning_va,va,'No se ha guardado el valenciano docente: '+entry);
  assert.equal(dictionary.forEntry(item,'va').value,va,'Glosa valenciana incorrecta: '+entry);
 }
 assert.equal(dictionary.forEntry({entry,meaning:es},'va').value,va,
  'La elección debe persistir también en proyectos anteriores: '+entry);
}
const reduco=initial.find(x=>x.entry==='reduco, reduxi, reductum (3ª)');
assert.ok(reduco&&reduco.meaning==='conducir de vuelta'&&reduco.meaning_va==='conduir de tornada',
 'La traducción aprobada de reduco debe figurar en los dos idiomas');
assert.equal(dictionary.lookup('conducir de vuelta').value,'conduir de tornada');



const sample={entry:'πόλις, –εως',meaning:'ciudad',meaning_va:'la meua traducció'};
assert.equal(dictionary.forEntry(sample,'va').value,'la meua traducció','La corrección docente valenciana tiene prioridad');
assert.equal(dictionary.forEntry(sample,'es').value,'ciudad','No sustituir traducción original');
assert.ok(html.includes('<script src="lexicon-valenciano.js"></script>'));
assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('./lexicon-valenciano.js'));
console.log('Léxico ES/VA: '+initial.length+' entradas originales conservadas y traducidas; prioridad del docente verificada.');
