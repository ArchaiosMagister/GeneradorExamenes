import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');

/**
 * HTML totalmente autónomo: interfaz más bancos ya incluidos en el repositorio.
 * No descarga recursos externos y conserva index.html como fuente de la web pública.
 */
export async function renderOffline(root=projectRoot){
 const html=await readFile(resolve(root,'index.html'),'utf8');
 const latin=JSON.parse(await readFile(resolve(root,'data/unimorph/lat-v.json'),'utf8'));
 if(!Array.isArray(latin.rows)||!latin.rows.length||
    !latin.rows.every(row=>Array.isArray(row)&&row.length>=4)){
  throw new Error('El banco latino no tiene el formato esperado');
 }
 if(!html.includes('function examinaEmbeddedAsset(path)')){
  throw new Error('index.html no admite bancos morfológicos embebidos');
 }
 const assets={'data/unimorph/lat-v.json':latin};
 // Evita cerrar prematuramente el elemento HTML script inerte.
 const json=JSON.stringify(assets).replace(/</g,'\\u003c');
 const marker='<script>';
 if(!html.includes(marker))throw new Error('No existe el script de la webapp');
 const offline=html.replace(marker,
  '<script id="examina-offline-assets" type="application/json">'+json+'</script>\n'+marker);
 return {content:offline,datasetCount:Object.keys(assets).length,latinRows:latin.rows.length};
}
export async function buildOffline(output=resolve(projectRoot,'offline.html')){
 const result=await renderOffline();
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,result.content,'utf8');
 console.log('HTML autónomo creado:',output,'·',result.latinRows,'formas latinas');
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 await buildOffline();
}
