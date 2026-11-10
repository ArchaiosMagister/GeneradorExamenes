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
assert.equal(blocks.length,4,'Se esperan tres scripts JS y un banco JSON');
const data=blocks.filter(block=>/type="application\/json"/.test(block[1]));
assert.equal(data.length,1,'Debe existir un único banco JSON embebido');
const payload=JSON.parse(data[0][2]);
assert.equal(payload['data/unimorph/lat-v.json'].rows.length,16988);
assert.ok(payload['data/lemmas/teacher-forms.json'].rows.lat.length>10000);
assert.ok(payload['data/lemmas/teacher-forms.json'].rows.grc.length>1400);
assert(html.includes('Lematizador del vocabulario · sin conexión'),'Falta la interfaz local de consulta');
for(const [,attributes,body] of blocks){
 if(!/type="application\/json"/.test(attributes))new Script(body,{filename:'offline.html'});
}
assert(!/<script[^>]+src=/.test(html),'El HTML no debe descargar scripts');
assert(!/<link[^>]+href=/.test(html),'El HTML no debe descargar CSS ni manifest');
assert(!html.includes('EXAMINA_PWA_START')&&!html.includes('id="pwaPanel"'),
 'La versión HTML de archivo único no necesita controles PWA');
assert(!html.includes('pwa.js')&&!html.includes('manifest.webmanifest'),
 'El HTML autónomo no debe depender de recursos PWA');
assert(html.includes("if(location.protocol==='file:')return"),'No consultar archivos al abrir file://');
assert(html.includes('r.length>=4'),'Se admiten filas de cuatro campos UniMorph');
const network=[...html.matchAll(/\bfetch\(/g)];
assert.equal(network.length,3,'Revisar nuevos accesos fetch antes de publicar la edición autónoma');
console.log('Pruebas offline superadas: HTML reproducible, dos scripts válidos y',
 expected.latinRows,'formas latinas.');
