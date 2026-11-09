import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {renderOffline} from './build-offline.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=await readFile(resolve(root,'offline.html'),'utf8');
const expected=await renderOffline(root);
assert.equal(html,expected.content,'offline.html debe corresponder a index.html y a los datos originales');
const blocks=[...html.matchAll(/<script([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
assert.equal(blocks.length,3,'Dos scripts de la aplicación y un banco JSON embebido');
const data=blocks.filter(x=>/type="application\\/json"/.test(x[1]));
assert.equal(data.length,1,'El banco embebido debe estar en un script JSON inerte');
const payload=JSON.parse(data[0][2]);
assert.equal(payload['data/unimorph/lat-v.json'].rows.length,16988);
for(const [,attrs,body] of blocks){
 if(!/type="application\\/json"/.test(attrs))new Script(body,{filename:'offline.html'});
}
assert(!/<script[^>]+src=/.test(html),'Sin scripts remotos');
assert(!/<link[^>]+href=/.test(html),'Sin estilos remotos');
assert(html.includes("if(location.protocol==='file:')return"),'Las consultas a archivos no deben intentar fetch en file://');
assert(html.includes('r.length>=4'),'La tabla latina de cuatro campos debe admitirse');
// La aplicación no debe depender de URLs o servicios externos para generar exámenes.
const network=[...html.matchAll(/\\bfetch\\(/g)];
assert.equal(network.length,2,'Revisar manualmente nuevos puntos de red antes de publicar');
console.log('Pruebas offline superadas: HTML autosuficiente,',expected.latinRows,'formas, código validado.');
