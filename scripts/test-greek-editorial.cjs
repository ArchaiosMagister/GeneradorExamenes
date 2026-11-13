const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const decisions=JSON.parse(read('data/lemmas/greek-editorial-decisions.json'));
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const html=read('index.html');
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/\u0345/g,'ι')
 .replace(/\p{M}/gu,'').replace(/ς/g,'σ').trim();
const head=s=>{const h=String(s||'').split(/[,+(]/)[0].trim().split('/')[0];return !/\s/.test(h)?norm(h):null};
const first=html.indexOf('let vocab=')+'let vocab='.length;
assert.ok(first>10,'Falta el banco inicial de la aplicación');
const bank=JSON.parse(html.slice(first,html.indexOf(';',first)));
for(const match of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))
 bank.push(...JSON.parse(match[1]));
const greek=bank.filter(x=>x.course==='greek1');
assert.equal(greek.length,399,'Se han perdido fichas del vocabulario griego');
assert.equal(decisions.schema,1);
assert.equal(decisions.course,'gr1');
assert.equal(decisions.verifiedMorphology,false);
assert.equal(decisions.decisions.length,19);
assert.equal(new Set(decisions.decisions.map(x=>x.id)).size,19);
assert.equal(data.extensions.greek_editorial_decisions.count,19);
assert.equal(data.extensions.greek_editorial_decisions.verifiedFormsAdded,0);
assert.equal(data.extensions.greek_editorial_decisions.addedCitationOnlyEntries,2);
assert.equal(data.extensions.greek_editorial_decisions.rekeyedLemmas,5);
assert.deepEqual(data.extensions.greek_editorial_decisions.suspendedCandidateLemmas,['θεα']);
assert.equal(Object.keys(data.vocabulary.grc).length,351);
const verifiedOverrides=JSON.parse(read('data/lemmas/verified-overrides.json'));
const greekEvidence=verifiedOverrides.paradigms.filter(x=>x.lang==='grc')
 .reduce((n,p)=>n+p.blocks.reduce((a,b)=>a+b.forms.length,0),0)
 +verifiedOverrides.singleForms.filter(x=>x.lang==='grc').length;
assert.equal(data.rows.grc.filter(x=>x[3]===5).length,greekEvidence,
 'Solo incorporar casillas griegas contrastadas individualmente');
for(const item of decisions.decisions){
 const matching=greek.filter(x=>x.entry===item.entry);
 assert.equal(matching.length,1,'No hay exactamente una ficha griega para '+item.id);
 const row=matching[0];
 assert.ok(row.meaning,'Falta traducción en '+item.id);
 if(item.newMeaning!==null){
  assert.equal(row.meaning,item.newMeaning);
  if(item.newMeaningVa!==null)
   assert.equal(row.meaning_va,item.newMeaningVa,'La traducción valenciana debe ser explícita');
 }
 const oldKey=head(item.original),newKey=head(item.entry);
 const entry=data.vocabulary.grc[newKey]?.gr1;
 assert.ok(entry,'No aparece '+item.id+' en el índice griego');
 assert.equal(entry.entry,item.entry,'La reconstrucción ha restaurado una grafía antigua: '+item.id);
 if(oldKey!==newKey)assert.ok(!data.vocabulary.grc[oldKey],
   'La clave incorrecta sigue activa para '+item.id);
 const oldCitation=data.rows.grc.filter(x=>x[0]===oldKey&&x[3]===3);
 if(oldKey!==newKey)assert.equal(oldCitation.length,0,'Persisten citas antiguas de '+item.id);
 const rows=data.rows.grc.filter(x=>x[0]===newKey);
 assert.ok(rows.length>0,'No se puede consultar '+item.id+' en el lematizador');
 if(['ekklesia','probaton','thea'].includes(item.id)){
  assert.ok(rows.every(x=>x[3]===3||x[3]===4),
   'Se han aprobado flexiones sin evidencia para '+item.id);
 }
 if(item.id==='thea')assert.ok(rows.every(x=>x[3]===3),
  'No se deben confundir las flexiones de θέα con las de θεά');
}
const goddess=data.rows.grc.filter(x=>x[0]==='θεα');
assert.ok(goddess.length>0,'Debe encontrarse θεά');
assert.ok(goddess.every(x=>x[3]!==4),'Las flexiones de θέα (vista) no son de θεά (diosa)');
for(const lemma of ['εκκλησια','προβατον']){
 assert.equal(data.rows.grc.filter(x=>x[0]===lemma&&x[3]===3).length,1);
 assert.equal(data.rows.grc.filter(x=>x[0]===lemma&&[0,1,5,7].includes(x[3])).length,0,
  'No se deben promover automáticamente las propuestas nominales a verificadas');
}
assert.equal(data.vocabulary.grc['θεοσ'].gr1.units[0],'UD 1–4',
 'No se deben perder las unidades del índice fuente');
assert.equal(data.vocabulary.grc['σοφοσ'].gr1.units[0],'UD 1–4');
assert.equal(greek.find(x=>x.entry==='σοφός, –οῦ (ὁ)').meaning,'sabio');
assert.equal(greek.find(x=>x.entry==='πονηρός, –α, –ον').meaning,'desdichado/a, pobre, malo, perverso');
assert.equal(greek.find(x=>x.entry==='αἰσχρός, –ον').meaning,'vergonzoso/a');
assert.equal(data.vocabulary.grc['αδικοσ'].gr1.units[0],'UD 6–7');
const offline=read('offline.html');
for(const item of decisions.decisions)
 assert.ok(offline.includes(item.entry),'La versión autónoma carece de '+item.id);
assert.ok(!offline.includes('greek-editorial-decisions.json'),
 'El archivo offline no debe necesitar descargar el registro editorial');
console.log('OK: 19 decisiones en banco, índice y HTML autónomo; 399 fichas, unidades intactas, cero flexiones promovidas.');
