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
assert.equal(blocks.length,3,'Se esperan dos scripts JS y un script de datos');
const data=blocks.filter(block=>/type="application\/json"/.test(block[1]));
assert.equal(data.length,1,'Debe existir un único banco JSON embebido');
const payload=JSON.parse(data[0][2]);
assert.equal(payload['data/unimorph/lat-v.json'].rows.length,16988);
for(const [,attributes,body] of blocks){
 if(!/type="application\/json"/.test(attributes))new Script(body,{filename:'offline.html'});
}
assert(!/<script[^>]+src=/.test(html),'El HTML no debe descargar scripts');
assert(!/<link[^>]+href=/.test(html),'El HTML no debe descargar CSS');
assert(html.includes("if(location.protocol==='file:')return"),'No consultar archivos al abrir file://');
assert(html.includes('r.length>=4'),'Se admiten filas de cuatro campos UniMorph');
const network=[...html.matchAll(/\bfetch\(/g)];
assert.equal(network.length,2,'Revisar nuevos accesos fetch antes de publicar la edición autónoma');
console.log('Pruebas offline superadas: HTML reproducible, dos scripts válidos y',
 expected.latinRows,'formas latinas.');
