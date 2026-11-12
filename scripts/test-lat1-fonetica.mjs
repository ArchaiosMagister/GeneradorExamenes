import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const curriculum=JSON.parse(readFileSync(resolve(root,'data/fonetica/lat1-programacion.json'),'utf8'));
const generic=JSON.parse(readFileSync(resolve(root,'data/fonetica/banco_examenes.json'),'utf8'));
assert.equal(curriculum.schema,1);
assert.equal(curriculum.course,'latin1');
assert.equal(curriculum.unidades.length,11);
assert.equal(generic.items.length,514,'El banco general es elegible también en Latín I');
const known=new Set(generic.normas.map(n=>n.id));
const introduced=new Set(),seen=new Set();
let total=0,valid=0,revisar=0,previous=0;
for(let unit=0;unit<=10;unit++){
 const current=curriculum.unidades[unit];
 assert.equal(current.unit,unit,'Las unidades deben estar consecutivas y ordenadas');
 assert.equal(current.palabras.length,unit===0?3:7,'Reparto original 3 + 7 x 10');
 for(const code of current.nuevas){
  assert(known.has(code),'Código de norma desconocido: '+code);
  assert(!introduced.has(code),'Una norma se introduce una sola vez: '+code);
  introduced.add(code);
 }
 assert(introduced.size>=previous,'Las normas no son acumulativas');
 previous=introduced.size;
 for(const item of current.palabras){
  assert(/^LAT1-FON-\d{3}$/.test(item.id)&&!seen.has(item.id),'Identificador repetido o incorrecto');
  seen.add(item.id);total++;
  assert(item.latin&&item.castellano,'Falta el étimo o el resultado');
  assert(['APTO_PROPUESTO','REVISAR'].includes(item.estado),'Estado inválido');
  assert(Array.isArray(item.normas)&&item.normas.every(code=>introduced.has(code)),
   'Norma no explicada para '+item.latin);
  if(item.estado==='APTO_PROPUESTO'){valid++;assert(item.normas.length>0)}
  else{revisar++;assert(item.observacion,'La ficha pendiente necesita explicar la reserva')}
 }
}
assert.equal(total,73);
assert.equal(introduced.size,20);
assert.equal(valid,67);
assert.equal(revisar,6);
assert.deepEqual(curriculum.unidades.map(u=>u.nuevas.length),[5,7,4,2,0,0,0,1,0,1,0]);
const rulesThrough=unit=>new Set(curriculum.unidades.filter(x=>x.unit<=unit).flatMap(x=>x.nuevas));
const availableThrough=unit=>curriculum.unidades.filter(x=>x.unit<=unit).flatMap(x=>x.palabras)
 .filter(x=>x.estado==='APTO_PROPUESTO'&&x.normas.every(n=>rulesThrough(unit).has(n)));
const eligibleGlobal=unit=>generic.items.filter(x=>x.estado==='APTO_PROPUESTO'&&
 x.normas?.length&&x.normas.every(n=>rulesThrough(unit).has(n)));
assert.equal(eligibleGlobal(0).length,103,'UD0 debe admitir étimos del banco general');
assert.equal(eligibleGlobal(3).length,509,'UD3 debe admitir étimos de cualquier unidad con normas impartidas');
assert.equal(eligibleGlobal(10).length,514,'UD10 debe admitir todo el banco general');
assert(eligibleGlobal(0).some(x=>x.latin==='advocatum'),'El banco general no debe restringirse a los tres étimos de UD0');
const lesson0=availableThrough(0),lesson1=availableThrough(1);
assert.deepEqual(lesson0.map(x=>x.latin),['terram','apotheca','farinam']);
assert.equal(lesson1.length,10,'UD1 debe incluir las tres palabras de UD0 y las siete nuevas');
assert(lesson1.length>=4,'UD1 debe poder proponer cuatro étimos');
assert.equal(availableThrough(10).length,67);
for(let unit=1;unit<=10;unit++)
 assert(availableThrough(unit).length>=availableThrough(unit-1).length,'El vocabulario no es acumulativo');
assert(!availableThrough(6).some(x=>x.latin==='adpodiare'),'Asimilación introducida antes de UD7');
assert(availableThrough(7).some(x=>x.latin==='adpodiare'),'Falta la asimilación de UD7');
assert(!availableThrough(8).some(x=>x.latin==='arborem'),'Disimilación introducida antes de UD9');
assert(availableThrough(9).some(x=>x.latin==='arborem'),'Falta la disimilación de UD9');
assert(!availableThrough(10).some(x=>['impignum','vaxillam','lignam','æqualitatem','complexum','crocodillum'].includes(x.latin)),
 'Se están sorteando étimos pendientes de revisión');
const html=readFileSync(resolve(root,'index.html'),'utf8');
for(const marker of ['parseLatin1PhoneticCurriculum','latin1PhoneticMaxUnit','latin1PhoneticAllowed',
 'lat1-programacion.json',"if(row.unit&&kind!=='phonetics')",'input.disabled=!allowed.has('])
 assert(html.includes(marker),'Falta la integración en la web: '+marker);
assert(html.includes('latinLexBanks.latin1.phonetics=parsed.rows;'),'Debe conservarse el programa docente');
assert(html.includes('for(const course of [\'prefixes\',\'phonetics\'].includes(kind)?[\'latin1\',\'latin4\']'),
 'El banco general debe cargarse en Latín I y 4.º');
assert(!html.includes('row.unidad>latin1PhoneticMaxUnit(chosen)'),
 'La unidad original de una palabra no debe limitar su selección');
console.log('Latín I: 514 candidatas generales según normas acumulativas; 73 étimos docentes conservados.');
