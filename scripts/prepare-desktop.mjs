import { mkdir, copyFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'web'), { recursive: true });
await copyFile(resolve(root, 'index.html'), resolve(root, 'web/index.html'));
await cp(resolve(root, 'data'), resolve(root, 'web/data'), {recursive:true});
console.log('Interfaz y bancos locales preparados para Tauri.');
