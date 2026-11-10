import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
assert.equal(data.schema,1);
assert.equal(data.kind,'referencia-lematizacion-no-calificacion');
assert.match(data.scope,/no es un diccionario exhaustivo/);
assert.match(data.source.unimorph.lat.license,/CC BY-SA/);
assert.ok(data.rows.lat.length>10000&&data.rows.grc.length>1400);
assert.ok(data.vocabulary.lat.amo?.lat1,'Falta el lema latino del vocabulario docente');
assert.ok(data.vocabulary.grc['λυω']?.gr1,'Falta λύω en el vocabulario griego');
const script=fs.readFileSync(path.join(root,'offline-lemmas.js'),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}},console};
runInNewContext(script,ctx,{filename:'offline-lemmas.js'});
const {normalize,query,describe}=ctx.window.ExaminaOfflineLemmatizer;
assert.equal(normalize('AMĀBAM'),normalize('amabam'));
assert.equal(normalize('λόγῳ'),normalize('ΛΌΓῼ'));
assert.notEqual(normalize('ᾳ'),normalize('α'),'La iota suscrita no puede eliminarse');
assert.equal(normalize('λόγος'),normalize('λόγοσ'));
const a=query(data,{course:'lat1',mode:'lemma',text:'amo'});
assert.ok(a.items.length>=6,'Faltan formas de amo');
assert.ok(a.items.every(r=>r.lemma==='amo'));
assert.ok(a.items.some(r=>r.source==='Paradigma docente'));
const greek=query(data,{course:'gr1',mode:'lemma',text:'λύω'});
assert.ok(greek.items.length>=5,'Faltan formas de λύω');
assert.ok(greek.items.every(r=>r.info.gr1));
const disallowed=query(data,{course:'gr1',mode:'lemma',text:'amo'});
assert.equal(disallowed.total,0,'No debe mezclar cursos');
assert.equal(query(data,{course:'lat1',text:'palabra-inventada'}).total,0);
assert.match(describe('N;NOM;SG'),/nominativo/);
const synthetic={schema:1,vocabulary:{lat:{
  rosa:{lat1:{entry:'rosa, rosae',units:['UD 1']}},
  roso:{lat1:{entry:'roso, rosi',units:['UD 1']}}
},grc:{}},rows:{lat:[
 ['rosa','rosae','N;GEN;SG',0],
 ['rosa','rosae','N;NOM;PL',0],
 ['roso','rosae','N;DAT;SG',1]
],grc:[]}};
const ambiguous=query(synthetic,{course:'lat1',text:'rosae'});
assert.equal(ambiguous.total,3,'Debe conservar análisis múltiples y lemas homógrafos');
assert.equal(new Set(ambiguous.items.map(x=>x.lemma)).size,2);
assert.equal(query(synthetic,{course:'gr1',text:'rosae'}).total,0);
assert.ok(query(data,{course:'lat1',text:'dos palabras'}).invalid);
console.log('Lematizador offline validado:',data.rows.lat.length,'registros latinos y',data.rows.grc.length,'griegos, sin pérdida de ambigüedad ni iota suscrita.');
