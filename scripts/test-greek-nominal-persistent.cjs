'use strict';
// El proceso de CI sin conexión verifica el catálogo de candidatos versionado.
// El extractor remoto se ejecuta solo de manera explícita en una revisión de fuentes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const data=read('data/lemmas/greek-nominal-candidates.json');
const teacher=read('data/lemmas/teacher-forms.json');
assert.equal(data.schema,1,'Esquema provisional inesperado');
assert.equal(data.status,'WIKTIONARY_CANDIDATES_NOT_FOR_GRADING','Los candidatos no son soluciones');
assert.equal(data.license,'CC BY-SA 4.0','Se perdió la atribución del catálogo');
assert.match(data.attribution,/Wiktionary|Wiktextract/);
assert.match(data.source,/kaikki\.org/);
assert.match(data.warning,/NEVER use for answer keys/);
assert.equal(teacher.schema,1);
assert(teacher.vocabulary?.grc&&Array.isArray(teacher.rows?.grc),'Falta inventario docente original');
assert(Array.isArray(data.entries)&&data.entries.length>0,'Catálogo provisional vacío');
assert.equal(data.stats.acceptedLemmas,data.entries.length);
const lemmas=new Set();let rows=0;
for(const entry of data.entries){
 assert(['N','ADJ'].includes(entry.kind),'Categoría inesperada: '+entry.lemma);
 assert(teacher.vocabulary.grc[entry.lemma]?.gr1,'Lema sin respaldo docente: '+entry.lemma);
 const key=entry.lemma+'|'+entry.kind;
 assert(!lemmas.has(key),'Lema duplicado: '+key);lemmas.add(key);
 assert(Array.isArray(entry.forms)&&entry.forms.length>0,key+': sin formas');
 assert.equal(typeof entry.source_page,'string');
 const tags=new Set();
 for(const cell of entry.forms){
  assert(Array.isArray(cell)&&cell.length===2,key+': casilla no válida');
  const [surface,tag]=cell;
  assert(typeof surface==='string'&&/[\u0370-\u03ff\u1f00-\u1fff]/u.test(surface),key+': grafía no griega');
  assert(typeof tag==='string'&&tag.startsWith(entry.kind+';'),key+': análisis incompatible');
  assert(!/;DU(?:;|$)/.test(tag),key+': dual no apto');
  assert(!tags.has(tag),key+': forma morfológica duplicada');
  tags.add(tag);rows++;
 }
}
assert.equal(rows,data.stats.additionalRows,'Incoherencia entre recuento e inventario');
console.log('Candidatos griegos persistentes: '+data.entries.length+' lemas y '+rows+
 ' formas contrastadas solo como propuestas; CI offline sin red, no aptas para calificación.');
