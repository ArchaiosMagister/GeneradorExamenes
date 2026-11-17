'use strict';
/* Regresiones de interfaz, lemas Eulexis y propuesta Evolutio sin activación. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const standalone=read('offline.html');
const proposal=JSON.parse(read('docs/propuestas/evolutio-300-candidatas-20261117.json'));
const reviewed=read('docs/propuestas/sintagmas-latin-griego-20261117.md');

function functionFromHtml(name,next){
 const first=html.indexOf('function '+name+'(');
 const end=html.indexOf('\n'+next,first);
 assert(first>=0&&end>first,'Función no encontrada: '+name);
 return new Function(html.slice(first,end)+'\nreturn '+name+';')();
}

const eulexis=functionFromHtml('greekEulexisSchoolCitation','async function openExternalGlossLookup');
for(const [before,after] of [
 ['λόγος, –ου (ὁ)','λόγος, –ου'],
 ['ὁδός, –οῦ (ἡ)','ὁδός, –οῦ'],
 ['ἡμέρα, –ας (ἡ)','ἡμέρα, –ας'],
 ['ὁ ἄνθρωπος','ὁ ἄνθρωπος'],
 ['νύξ, νυκτός (ἡ)','νύξ, νυκτός (ἡ)'],
 ['γένος, –ους (τὸ)','γένος, –ους (τὸ)'],
 ['σῶμα, –ματος (τὸ)','σῶμα, –ματος (τὸ)']
])assert.equal(eulexis(before),after,'Enunciado Eulexis no ajustado: '+before);
assert(html.includes("if(reader==='Eulexis')proposed=greekEulexisSchoolCitation(proposed);"),
 'El formulario Eulexis no aplica el criterio');
assert(html.includes("x.source==='eulexis'&&greek?greekEulexisSchoolCitation(entry)"),
 'Las citas Eulexis previamente aceptadas no siguen el criterio');

const vaPrefix=functionFromHtml('valencianPrefixIsOneWord','function latinLexPool');
for(const value of ['adjunt','desfavorable','ultramarí','d’ara','rere-botiga','cap·i·cua'])
 assert(vaPrefix({prompt_va:value,valencianPrefixEligible:true}),'Excluye una sola palabra: '+value);
for(const value of ['per endavant','de nou','sense res','un altre','ulleres verdes'])
 assert(!vaPrefix({prompt_va:value,valencianPrefixEligible:true}),'Incluye una locución: '+value);
assert(!vaPrefix({prompt_va:'avantbraç',valencianPrefixEligible:false}),
 'Una exclusión filológica se convirtió en inclusión');
assert(html.includes("!valencianPrefixIsOneWord(x)"),'Sorteo valenciano sin filtro');

const printPart=html.slice(html.indexOf('function buildLatinLexQuestion('),html.indexOf('function buildLatinLexQuestion(')+3000);
assert(!printPart.includes("phonetic-origin-label"),'Se siguen imprimiendo etiquetas de transmisión');
assert(html.includes("slot.querySelector('.phonetic-origin-label')?.remove()"),
 'La edición podría conservar una etiqueta anterior');
assert(!html.includes("culta?'Hay adaptaciones cultas etiquetadas"),'Aviso de cultismo en examen');

for(const klass of ['exam-gloss-pending','exam-gloss-review','exam-gloss-selected','exam-gloss-unknown']){
 assert(html.includes(klass),'Falta un tipo de tarjeta: '+klass);
}
assert(html.includes('class="exam-gloss-line"'), 'No se construyen filas individuales');
assert(html.includes('class="exam-gloss-review-choice exam-gloss-line"'), 'No se separan formas ambiguas');
assert(html.includes(".exam-gloss-line::before"),'Sin guiones de lectura');
assert(html.includes(".exam-gloss-reset,.exam-reader-lookup"),'Botones de acción no compactados');

assert.equal(proposal.schema,'examina-evolutio-proposal/v1');
assert.equal(proposal.state,'PROPUESTA_DOCENTE_SIN_APLICAR');
assert.equal(proposal.items.length,300);
assert.deepEqual(proposal.nivelResumen,{facil:186,medio:113,dificilExcepcion:1});
const knownRules=new Set(Array.from({length:20},(_,i)=>'N'+String(i+1).padStart(2,'0')));
assert.equal(proposal.normas.length,20);
assert.deepEqual(new Set(proposal.normas.map(x=>x.id)),knownRules);
assert.equal(new Set(proposal.items.map(x=>x.sourceId)).size,300);
assert.equal(new Set(proposal.items.map(x=>x.latin.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())).size,300);
for(const item of proposal.items){
 assert(item.latin&&item.castellano&&item.normas.length);
 assert([1,2,3].includes(item.nivelSchola));
 assert(item.normas.every(n=>knownRules.has(n)));
}
for(const rule of knownRules)
 assert(proposal.items.some(x=>x.normas.includes(rule)), 'Falta una norma: '+rule);
const difficult=proposal.items.filter(x=>x.nivelSchola===3);
assert.equal(difficult.length,1);
assert.equal(difficult[0].sourceId,'xl-1029');
assert.equal(difficult[0].latin,'saltum');
assert.equal(difficult[0].castellano,'soto');
assert(proposal.items.every(x=>x.nivelSchola!==4));
assert(reviewed.includes('**Ninguna de estas decisiones ha sido aplicada al banco del generador.**'));
assert(reviewed.includes('GR-13')&&reviewed.includes('LI-09')&&reviewed.includes('L4-07'));

const officialBank=JSON.parse(read('data/fonetica/banco_examenes.json'));
assert.equal(officialBank.items.length,655,'El banco publicado ha sido alterado sin autorización');
assert(!officialBank.items.some(x=>x.id==='xl-1029'),'Se activó una ficha propuesta sin permiso');

const stripped=s=>s.replace(/\r\n/g,'\n');
assert(stripped(standalone).includes('function greekEulexisSchoolCitation(value)'),
 'La versión offline no incorpora el ajuste Eulexis');
assert(stripped(standalone).includes('function valencianPrefixIsOneWord(row)'),
 'La versión offline no incorpora la validación valenciana');
assert(stripped(standalone).includes('class="exam-gloss-line"'),
 'La versión offline no incorpora las filas de revisión');
console.log('Editorial: guiones, controles, Eulexis 1ª/2ª/3ª, prefijos VA, normas y 300 propuestas sin activar: OK');
