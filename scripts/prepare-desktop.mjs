import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'web'), { recursive: true });
await copyFile(resolve(root, 'index.html'), resolve(root, 'web/index.html'));
console.log('Interfaz web copiada a web/index.html para Tauri.');
