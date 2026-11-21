'use strict';
// La fuente morfológica original de ὄνομα está corrupta. Garantía de que
// jamás se incorporan esas once casillas al índice reconstruido o al examen.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('data/lemmas/teacher-forms.json','utf8'));
const bad=[
 ['Dual','N;GEN;DU'],['Plural','N;GEN;PL'],['Singular','N;GEN;SG'],
 ['ὄνομᾰ','N;DAT;SG'],['ὀνόμᾰσῐ','N;VOC;PL'],
 ['ὀνόμᾰτᾰ','N;DAT;PL'],['ὀνόμᾰτε','N;DAT;DU'],
 ['ὀνομᾰ́τοιν','N;ACC;DU'],['ὀνομᾰ́τοιν','N;VOC;DU'],
 ['ὀνόμᾰτος','N;ACC;SG'],['ὀνομᾰ́των','N;ACC;PL']
];
const audit=data.extensions.quarantinedGreekOnoma;
assert.equal(audit?.lemma,'ονομα');
assert.equal(audit.count,11);
assert.equal(audit.source,0);
assert.equal(audit.automaticallyVerified,false);
assert.equal(data.rows.grc.length,2817,'Cambió el total: cotejo de nuevas fuentes necesario');
const rows=data.rows.grc.filter(r=>r[0]==='ονομα');
assert.equal(rows.length,1,'No admitir flexiones de ὄνομα sin cotejo externo');
assert.deepEqual(rows[0],['ονομα','ονομα','LEX;ENTRY',3]);
assert.equal(data.vocabulary.grc.ονομα?.gr1?.entry,'ὄνομα, –ματος (τό)');
for(const [surface,features] of bad)
 assert(!rows.some(r=>r[1]===surface&&r[2]===features),
   'Persistencia de forma corrupta: '+surface+' '+features);
const web=fs.readFileSync('index.html','utf8');
const marker='const greekExamReviewedNominalRows=';
const start=web.indexOf(marker),end=web.indexOf(';\n',start);
assert(start>=0&&end>start);
const verified=JSON.parse(web.slice(start+marker.length,end));
assert(!verified.some(x=>x[0]==='ονομα'),
 'Nunca añadir ὄνομα a ejercicios verificados sin cotejo individual');
const third=verified.filter(x=>x[3]==='nouns'&&x[5]==='tercera');
assert.equal(third.length,15,'Han cambiado las fichas nominales verificadas');
let checked=0;
for(const row of third)for(const [surface,analyses] of row[7])for(const analysis of analyses.split('|')){
 assert(data.rows.grc.some(r=>r[0]===row[0]&&r[1]===surface&&
   r[2]==='N;'+analysis&&r[3]===5),
  'Sin evidencia contrastada: '+row[0]+' '+surface+' '+analysis);
 checked++;
}
assert.equal(checked,45);
const offline=fs.readFileSync('offline.html','utf8');
const tag='<script id="examina-offline-assets" type="application/json">';
const at=offline.indexOf(tag),finish=offline.indexOf('</script>',at);
assert(at>=0&&finish>at,'Falta el banco incrustado de la versión autónoma');
const assets=JSON.parse(offline.slice(at+tag.length,finish));
const embedded=assets['data/lemmas/teacher-forms.json'];
assert(embedded&&embedded.rows?.grc&&embedded.extensions?.quarantinedGreekOnoma,
 'El paquete autónomo no tiene las correcciones morfológicas');
assert.deepEqual(embedded.rows.grc,data.rows.grc,
 'La web y el paquete autónomo no incluyen el mismo índice griego');
assert.equal(embedded.extensions.quarantinedGreekOnoma.count,11);
console.log('GRIEGO: 11 casillas corruptas excluidas, 15 lemas/45 lecturas verificados y paridad completa de índice y offline.');
