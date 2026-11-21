'use strict';
// Correcciones de Griego I, UD5, sin inferir paradigmas ni tocar fichas manuales.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const web=fs.readFileSync('index.html','utf8');
const offline=fs.readFileSync('offline.html','utf8');
const materials=JSON.parse(fs.readFileSync('data/greek1-materials.json','utf8'));
function functionSource(source,name){
 const start=source.indexOf('function '+name+'(');
 assert(start>=0,'Falta función: '+name);
 const end=source.indexOf('\n}\n',start);
 assert(end>start,'Función incompleta: '+name);
 return source.slice(start,end+2);
}
function fromSource(source,name,context={}){
 return vm.runInNewContext('('+functionSource(source,name)+')',context);
}
for(const [name,source] of [['web',web],['autónoma',offline]]){
 assert(!/"entry"\s*:\s*"ὀλιγός, –η, –ον"/u.test(source),name+': entrada antigua de vocabulario');
 assert(source.includes('ὀλίγος, –η, –ον'),name+': falta el enunciado corregido');
 assert(source.includes("lemma:'ὀλίγος',feminine:'η',accent:'oligos'"),
  name+': falta el paradigma explícito');
 const adjective=fromSource(source,'greekCompleteAdjectiveForms');
 const expected={
  m:[['ὀλίγος','ὀλίγε','ὀλίγον','ὀλίγου','ὀλίγῳ'],
     ['ὀλίγοι','ὀλίγοι','ὀλίγους','ὀλίγων','ὀλίγοις']],
  f:[['ὀλίγη','ὀλίγη','ὀλίγην','ὀλίγης','ὀλίγῃ'],
     ['ὀλίγαι','ὀλίγαι','ὀλίγας','ὀλίγων','ὀλίγαις']],
  n:[['ὀλίγον','ὀλίγον','ὀλίγον','ὀλίγου','ὀλίγῳ'],
     ['ὀλίγα','ὀλίγα','ὀλίγα','ὀλίγων','ὀλίγοις']]
 };
 for(const gender of ['m','f','n']){
  const actual=adjective({accent:'oligos'},gender);
  assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected[gender],
   name+': paradigma incorrecto de ὀλίγος ('+gender+')');
  assert.equal(actual.flat().length,10,name+': 10 casillas por género');
 }
 const polys={
  m:[['πολύς',null,'πολύν','πολλοῦ','πολλῷ'],['πολλοί','πολλοί','πολλούς','πολλῶν','πολλοῖς']],
  f:[['πολλή',null,'πολλήν','πολλῆς','πολλῇ'],['πολλαί','πολλαί','πολλάς','πολλῶν','πολλαῖς']],
  n:[['πολύ',null,'πολύ','πολλοῦ','πολλῷ'],['πολλά','πολλά','πολλά','πολλῶν','πολλοῖς']]
 };
 for(const gender of ['m','f','n']){
  assert.deepEqual(JSON.parse(JSON.stringify(adjective({accent:'mixed-polys'},gender))),polys[gender],
   name+': casilla de πολύς sin acreditar');
 }
 const irregular=fromSource(source,'greekIrregularAdjectiveAnalyses',{
  greekCompleteAdjectiveForms:adjective,
  greekExamNominalAnswer:tags=>tags.join('|')
 })();
 assert(irregular.some(x=>x.lemmas[0]==='μέγας, μεγάλη, μέγα'));
 assert(irregular.some(x=>x.lemmas[0]==='πολύς, πολλή, πολύ'));
 assert(!irregular.some(x=>x.lemmas[0]==='πολύς, πολλή, πολύ'&&
  /VOC;SG;[mfn]/.test(x.answer)),name+': falso vocativo de πολύς');
 assert(irregular.some(x=>x.prompt==='πολύς'&&x.answer.includes('NOM;SG;m')),
  name+': nominativo legítimo perdido');
 assert(irregular.some(x=>x.prompt==='πολύ'&&x.answer.includes('NOM;SG;n')),
  name+': neutro legítimo perdido');
 const migration=fromSource(source,'migrateGreekOligosAccent',{examKey:()=> 'same-canonical-key'});
 const rows=[
  {course:'greek1',unit:'UD5',entry:'ὀλιγός, –η, –ον',key:'same-canonical-key'},
  {course:'greek1',unit:'UD5',entry:'ὀλιγός, –η, –ον (edición personal)'},
  {course:'greek1',unit:'UD6',entry:'ὀλιγός, –η, –ον'},
  {course:'latin1',unit:'UD5',entry:'ὀλιγός, –η, –ον'}
 ];
 assert.equal(migration(rows),true,name+': migración inicial');
 assert.equal(rows[0].entry,'ὀλίγος, –η, –ον');
 assert.equal(rows[1].entry,'ὀλιγός, –η, –ον (edición personal)');
 assert.equal(rows[2].entry,'ὀλιγός, –η, –ον');
 assert.equal(rows[3].entry,'ὀλιγός, –η, –ον');
 assert.equal(migration(rows),false,name+': migración no idempotente');
}
const target=materials.required.filter(x=>x.unit==='UD5'&&/λιγ/.test(x.entry));
assert.equal(target.length,1,'UD5 debe conservar una entrada para ὀλίγος');
assert.equal(target[0].entry,'ὀλίγος, –η, –ον');
assert.equal(target[0].meaning,'poco/a');
console.log('GRIEGO AUDIT OK: ὀλίγος (30 casillas áticas), πολύς (sin vocativos no acreditados), migración no destructiva y paridad web/PWA.');
