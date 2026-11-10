import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {renderOffline} from './build-offline.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=await readFile(resolve(root,'offline.html'),'utf8');
const expected=await renderOffline(root);
assert.equal(html,expected.content,'offline.html desactualizado: ejecuta npm run offline:build');
const blocks=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.ok(blocks.length>=5,'Faltan los módulos JS o el banco JSON; los scripts de apariencia pueden añadirse sin romper la versión offline');
const data=blocks.filter(block=>/type="application\/json"/.test(block[1]));
assert.equal(data.length,1,'Debe existir un único banco JSON embebido');
const payload=JSON.parse(data[0][2]);
assert.equal(payload['data/unimorph/lat-v.json'].rows.length,16988);
assert.ok(payload['data/lemmas/teacher-forms.json'].rows.lat.length>10000);
assert.ok(payload['data/lemmas/teacher-forms.json'].rows.grc.length>1400);
assert.equal(payload['data/latinismos-docente.json'].items.length,87);
assert.equal(payload['data/prefijos-docente.json'].groups.length,25);
const latin4=payload['data/lat4-progresion-lexico.json'];
assert.equal(latin4.units.length,8,'Deben definirse las 8 unidades de Latín 4.º');
assert.deepEqual(latin4.units[7].prefixGroups,[],'UD8 de Latín 4.º repasa los prefijos anteriores');
assert.equal(payload['data/modificacion-preverbial-docente.json'].items.length,120);
const syllabus=payload['data/modificacion-preverbial-unidades-lat1.json'];
assert.equal(syllabus.units.reduce((n,x)=>n+x.verbs.length,0),28);
assert.deepEqual(syllabus.units.filter(x=>x.verbs.length===0).map(x=>x.unit),[8,10]);
assert.equal(payload['data/fonetica/banco_examenes.json'].esquema,'evoluciones-latin-castellano/v1');
assert.equal(payload['data/fonetica/banco_examenes.json'].items.length,510);
const latin1Phonetics=payload['data/fonetica/lat1-programacion.json'];
assert.equal(latin1Phonetics.unidades.length,11);
assert.equal(latin1Phonetics.unidades.reduce((n,u)=>n+u.palabras.length,0),73);
assert.equal(latin1Phonetics.unidades.flatMap(u=>u.nuevas).length,20);
assert(html.includes('Lematizador del vocabulario · sin conexión'),'Falta la interfaz local de consulta');
for(const [,attributes,body] of blocks){
 if(!/type="application\/json"/.test(attributes))new Script(body,{filename:'offline.html'});
}
assert(!/<script[^>]+src=/.test(html),'El HTML no debe descargar scripts');
assert(!/<link[^>]+href=/.test(html),'El HTML no debe descargar CSS ni manifest');
assert(!html.includes('EXAMINA_PWA_START')&&!html.includes('id="pwaPanel"'),
 'La versión HTML de archivo único no necesita controles PWA');
assert(html.includes('Revisión filológica y decisiones docentes'),'Falta revisión docente offline');
assert(!html.includes('verification-review.js'),'El panel no se incrustó en HTML autónomo');
assert(!html.includes('pwa.js')&&!html.includes('manifest.webmanifest'),
 'El HTML autónomo no debe depender de recursos PWA');
assert(html.includes("if(location.protocol==='file:')return"),'No consultar archivos al abrir file://');
assert(html.includes('r.length>=4'),'Se admiten filas de cuatro campos UniMorph');
const network=[...html.matchAll(/\bfetch\(/g)];
assert.equal(network.length,4,'Revisar nuevos accesos fetch antes de publicar la edición autónoma');
console.log('Pruebas offline superadas: HTML reproducible, dos scripts válidos y',
 expected.latinRows,'formas latinas.');
