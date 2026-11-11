import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,Script} from 'node:vm';

const source=readFileSync(new URL('../greek-review.js',import.meta.url),'utf8');
const context=createContext({window:{},document:{readyState:'loading',addEventListener(){}},
 localStorage:{getItem:()=>null,setItem:()=>{}}});
new Script(source,{filename:'greek-review.js'}).runInContext(context);
const {buildCases,parseImport,norm,contextParts}=context.window.ExaminaGreekReview;
assert.equal(typeof buildCases,'function');
assert.equal(norm('Λόγος'),norm('λόγος'));
assert.equal(norm('λόγος'),norm('λογὸς'));
const data={schema:1,vocabulary:{grc:{
 λογοσ:{gr1:{entry:'λόγος, -ου',units:['UD1']}},
 λυω:{gr1:{entry:'λύω',units:['UD4']}}
}},rows:{grc:[
 ['λογοσ','λόγος','N;NOM;SG;MASC',0],
 ['λογοσ','λόγος','N;VOC;SG;MASC',0],
 ['λογοσ','λόγος','N;NOM;SG;MASC',1],
 ['λυω','λύω','V;PRS;IND;ACT;1;SG',0],
 ['λογοσ','λόγου','N;GEN;SG;MASC',0],
 ['αλλοσ','λόγος','N;NOM;SG;MASC',0]
]}};
const base=buildCases(data);
assert.equal(base.length,1,'Únicamente la forma realmente ambigua requiere tarjeta');
assert.equal(base[0].options.length,2,'Una fuente duplicada no crea otra opción');
assert.equal(base[0].id,'gr1|λογοσ');
assert.deepEqual(Array.from(base[0].units),['UD1']);
const importRows=parseImport({schema:'examina-eulexis-review/v1',rows:[
 {form:'λόγος',lemma:'λόγος',analysis:'masculino nominativo singular'},
 {form:'λύω',lemma:'λύω',analysis:'presente indicativo activo 1.ª singular'},
 {form:'σῶμα',lemma:'σῶμα',analysis:'neutro nominativo singular'}
]});
assert.equal(importRows.length,3);
const withEulexis=buildCases(data,importRows);
const logos=withEulexis.find(x=>x.id==='gr1|λογοσ');
assert.ok(logos.withEulexis,'Eulexis debe figurar como fuente contrastable');
assert.equal(logos.options.length,3);
assert.ok(!withEulexis.some(x=>norm(x.form)===norm('σῶμα')),
 'Los lemas ajenos a las unidades no deben entrar en la cola');
const single={
 schema:1,vocabulary:{grc:{προβατον:{gr1:{entry:'πρόβατον, –ου (τό)',units:['UD2']}}}},
 rows:{grc:[['προβατον','πρόβατον','LEX;ENTRY',3]]}
};
const one=parseImport({schema:'examina-eulexis-review/v1',rows:[
 {form:'πρόβατον',lemma:'πρόβατον',analysis:'neutro nominativo singular'}
]});
const pending=buildCases(single,one);
assert.equal(pending.length,1,'Eulexis debe permitir revisar una entrada sin flexiones contrastadas');
assert.equal(pending[0].kind,'eulexis-proposal');
assert.equal(pending[0].options.length,1,'No se inventan análisis alternativos');
assert.equal(pending[0].options[0].provisional,true,
 'La lectura de Eulexis no constituye una verificación docente');
assert.equal(buildCases(single).length,0,'Una mera cita sin Eulexis no es discrepancia');
// Las variantes regionales NO son diferencias morfológicas: ἀδίκησα
// sigue siendo 1.ª persona sg. de aoristo indicativo activo en ambas.
const {analysisParts}=context.window.ExaminaGreekReview;
assert.equal(analysisParts('aoristo de indicativo activo, 1ª pers. singular · dórico, eólico').core,
 'aoristo de indicativo activo, 1ª pers. singular');
assert.equal(analysisParts('aoristo de indicativo activo, 1.ª persona singular (dórico eólico)').core,
 'aoristo de indicativo activo, 1.ª persona singular');
assert.equal(analysisParts('participio de aoristo activo (uso adverbial)').core,
 'participio de aoristo activo (uso adverbial)',
 'No se deben ignorar matices gramaticales ni de uso no dialectales');
const dialectFixture={schema:1,vocabulary:{grc:{
 αδικεω:{gr1:{entry:'ἀδικέω',units:['UD4']}}
}},rows:{grc:[]}};
const aorist=[
 {form:'ἀδίκησα',lemma:'ἀδικέω',analysis:'aoristo de indicativo activo, 1ª pers. singular · dórico, eólico'},
 {form:'ἀδίκησα',lemma:'ἀδικέω',analysis:'aoristo de indicativo activo, 1ª pers. singular · homérico, jónico'}
];
const oneDialect=buildCases(dialectFixture,aorist);
assert.equal(oneDialect.length,0,'Dos variedades dialectales del mismo análisis no generan tarjeta');
const mixed=buildCases(dialectFixture,[...aorist,
 {form:'ἀδίκησα',lemma:'ἀδικέω',analysis:'participio de aoristo activo, nominativo masculino singular'}
]);
assert.equal(mixed.length,1,'La diferencia de categoría morfológica sigue siendo discrepancia');
assert.equal(mixed[0].options.length,2,'Las variantes dialectales se agrupan, sin eliminar el participio');
const merged=mixed[0].options.find(x=>x.originalAnalyses.length===2);
assert.ok(merged,'La agrupación debe conservar las dos lecturas dialectales originales');
assert.deepEqual(Array.from(merged.dialects).sort(),['dórico','eólico','homérico','jónico'].sort());
assert.equal(merged.legacyIds.length,2,'Las decisiones anteriores deben conservar sus identificadores');
assert.ok(merged.provisional,'Eulexis no es una aprobación automática');
const localDialect=buildCases(dialectFixture,[
 {form:'ἀδίκησα',lemma:'ἀδικέω',analysis:'aoristo indicativo activo 1.ª persona singular (dórico eólico)'},
 {form:'ἀδίκησα',lemma:'ἀδικέω',analysis:'aoristo indicativo activo 1.ª persona singular (homérico jónico)'}
]);
assert.equal(localDialect.length,0,
 'La instalación directa Eulexis también fusiona diferencias exclusivamente dialectales');
const validAmbiguity=buildCases(dialectFixture,[
 {form:'ἀδίκησα',lemma:'ἀδικέω',analysis:'indicativo activo 1.ª persona singular'},
 {form:'ἀδίκησα',lemma:'ἀδικέω',analysis:'indicativo activo 3.ª persona singular'}
]);
assert.equal(validAmbiguity.length,1,'Nunca se deben confundir personas verbales distintas');
const embedded=JSON.parse(JSON.stringify(data));
embedded.rows.grc.push(['λογοσ','λόγος','EULEXIS;11',7]);
const fromEnriched=buildCases(embedded,[],{'11':'masc nom sg (attic)'});
assert.ok(fromEnriched[0].withEulexis);
assert.ok(fromEnriched[0].options.some(o=>o.analysis==='masc nom sg (attic)'));
assert.throws(()=>parseImport({schema:'wrong',rows:[]}),/formato/);
assert.throws(()=>parseImport({schema:'examina-eulexis-review/v1',rows:[
 {form:'<script>',lemma:'λόγος',analysis:'nom sg'}
]}),/griega/);
assert.throws(()=>parseImport({schema:'examina-eulexis-review/v1',rows:[
 {form:'λόγος',lemma:'λόγος'}
]}),/form, lemma y analysis/);
const parts=contextParts('ὁ λόγος καλός ἐστιν.', 'λόγος');
assert.equal(parts.filter(p=>p.match).length,1);
assert.equal(parts.filter(p=>p.match)[0].text,'λόγος');
const real=JSON.parse(readFileSync(new URL('../data/lemmas/teacher-forms.json',import.meta.url),'utf8'));
const count=buildCases(real);
assert.ok(count.length>0,'Las ambigüedades del banco actual deben poder revisarse');
assert.ok(count.every(x=>x.options.length>1&&Array.isArray(x.units)));
assert.ok(count.some(x=>x.units.length>0),'Las unidades asignadas deben conservarse');
assert.equal(real.rows.grc.length,JSON.parse(readFileSync(new URL('../data/lemmas/teacher-forms.json',import.meta.url),'utf8')).rows.grc.length);
console.log('Revisión de Griego I: '+count.length+' tarjetas locales; importación opcional Eulexis, contexto y deduplicación correctos.');
