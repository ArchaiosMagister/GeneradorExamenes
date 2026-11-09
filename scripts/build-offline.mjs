import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Produce un HTML autosuficiente para abrir con file:// sin servidor.
 * Solo incluye recursos ya presentes en el repositorio y conserva el index.html
 * original como fuente de la interfaz publicada.
 */
export async function renderOffline(root = projectRoot) {
 const html = await readFile(resolve(root, 'index.html'), 'utf8');
 const latin = JSON.parse(await readFile(resolve(root, 'data/unimorph/lat-v.json'), 'utf8'));
 if (!Array.isArray(latin.rows) || latin.rows.length === 0 ||
     !latin.rows.every(row => Array.isArray(row) && row.length >= 4)) {
  throw new Error('Datos latinos inesperados: no se construirá un archivo incompleto.');
 }
 if (!html.includes('function examinaEmbeddedAsset(path)')) {
  throw new Error('La webapp no admite todavía bancos de datos embebidos.');
 }
 // La fuente original ya está en el proyecto; no se descargan recursos externos.
 const assets = {'data/unimorph/lat-v.json': latin};
 const json = JSON.stringify(assets).replace(/</g, '\\u003c');
 const marker = '<script>';
 if (!html.includes(marker)) throw new Error('No existe el script principal de la webapp.');
 const content = html.replace(marker, '<script id="examina-offline-assets" type="application/json">' +
  json + '</script>\\n' + marker);
 return {content, datasetCount: Object.keys(assets).length, latinRows: latin.rows.length};
}

export async function buildOffline(output = resolve(projectRoot, 'offline.html')) {
 const result = await renderOffline();
 await mkdir(dirname(output), {recursive:true});
 await writeFile(output, result.content, 'utf8');
 console.log('Versión autónoma creada:', output, '·', result.latinRows,
  'formas latinas incluidas ·', result.content.length, 'caracteres');
 return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 await buildOffline();
}
