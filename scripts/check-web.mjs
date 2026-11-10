import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
if (!scripts.length) throw new Error('No hay JavaScript integrado');
for (const script of scripts) new Script(script, { filename: 'index.html' });
for (const id of ['paper','generate','docx','docxAnswers','saveDraft','restoreDraft','downloadDraft','loadDraft']) {
  if (!html.includes('id="' + id + '"')) throw new Error('Falta el control ' + id);
}
const review=readFileSync(new URL('../verification-review.js',import.meta.url),'utf8');
new Script(review,{filename:'verification-review.js'});
if(!html.includes('src="verification-review.js"'))throw new Error('No se enlaza la revisión docente');
console.log('Comprobación estática correcta: JavaScript y controles principales.');
