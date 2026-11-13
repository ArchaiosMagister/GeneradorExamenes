import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const candidatePath=path.join(root,'data/lemmas/greek-nominal-candidates.json');
const original=fs.readFileSync(candidatePath);
try{
const testLog=execFileSync(process.execPath,[
 'scripts/build-greek-nominal-candidates.mjs','tests/fixtures/greek-nominals-sample.jsonl'
],{cwd:root,stdio:'pipe',timeout:25000});
console.log(String(testLog));
const data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/greek-nominal-candidates.json'),'utf8'));
assert.equal(data.schema,1);
assert.equal(data.status,'WIKTIONARY_CANDIDATES_NOT_FOR_GRADING');
assert.match(data.license,/CC BY-SA 4.0/);
assert.ok(data.warning.includes('NEVER use'));
assert.equal(data.entries.length,2,'Solo se aceptan las dos palabras del vocabulario griego antiguo');
const noun=data.entries.find(x=>x.lemma==='αδελφοσ');
assert.ok(noun&&noun.kind==='N');
assert.ok(noun.forms.some(([f,t])=>f==='ἀδελφῷ'&&t==='N;DAT;SG'));
assert.ok(noun.forms.some(([f,t])=>f==='ἀδελφοῖς'&&t==='N;DAT;PL'));
assert.ok(noun.forms.every(([f,t])=>!t.includes('DU')));
assert.ok(noun.forms.every(([f])=>!f.includes('adelphos')));
const adj=data.entries.find(x=>x.lemma==='αγαθοσ');
assert.ok(adj&&adj.kind==='ADJ');
assert.ok(adj.forms.some(([f,t])=>f==='ἀγαθῆς'&&t==='ADJ;GEN;SG;FEM'));
assert.ok(data.entries.every(x=>x.source_page.startsWith('https://en.wiktionary.org/wiki/')));
assert.equal(data.stats.acceptedLemmas,2);
assert.equal(data.stats.conflicts,0);
assert.ok(data.stats.unsafeForms>=2,'Se deben rechazar variantes dialectales y duales');
console.log('Importación griega: nominativo, genitivo, dativos, géneros, acentos, etiquetas y aislamiento de claves correctos.');

}finally{
 // La muestra de ensayo no debe sobrescribir el catálogo persistente empleado por el índice offline.
 fs.writeFileSync(candidatePath,original);
}
