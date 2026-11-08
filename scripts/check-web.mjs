import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1]);
if (!scripts.length) throw new Error('No hay JavaScript integrado');
for (const script of scripts) new Script(script, { filename: 'index.html' });
for (const id of ['paper','generate','docx','docxAnswers','saveDraft','restoreDraft','downloadDraft','loadDraft']) {
  if (!html.includes('id="' + id + '"')) throw new Error('Falta el control ' + id);
}
console.log('Comprobación estática correcta: JavaScript y controles principales.');
