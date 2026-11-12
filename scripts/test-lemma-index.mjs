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
assert.ok(data.rows.grc.some(row=>row[3]===4),'Falta el complemento nominal griego de Wikcionario');
assert.match(data.extensions.greek_nominal_candidates.license,/CC BY-SA 4.0/);
assert.ok(data.extensions.greek_nominal_candidates.lemmas>0);
assert.ok(data.extensions.greek_nominal_candidates.rows>0);
assert.ok(data.extensions?.candidate_lemmas>=100,'Faltan lemas candidatos regulares');
assert.ok(data.extensions?.candidate_rows>=1000,'Faltan las formas propuestas');
assert.ok(data.extensions?.citation_only.lat>=100&&data.extensions?.citation_only.grc>=150,
 'Deben poder consultarse los lemas sin flexiones');
assert.ok(data.rows.lat.some(x=>x[3]===2)&&data.rows.grc.some(x=>x[3]===3));
const latinEditorial=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/latin-editorial-decisions.json'),'utf8'));
assert.equal(latinEditorial.verifiedMorphology,false);
assert.equal(latinEditorial.decisions.length,1);
assert.equal(latinEditorial.textCorrections[0].corrected,'Pecunia carere nonnullis philosophis placebat.');
assert.equal(data.vocabulary.lat.tener.lat1.entry,'tener, tenera, tenerum');
assert.deepEqual([...data.vocabulary.lat.tener.lat1.units].sort(),['UD 2','UD 3']);
assert.equal(data.vocabulary.lat.tenerus,undefined,'La clave antigua no debe sobrevivir a la reconstrucción');
assert(data.rows.lat.some(row=>row[0]==='tener'&&row[1]==='tener'&&row[2]==='LEX;ENTRY'&&row[3]===3));
assert(!data.rows.lat.some(row=>row[0]==='tenerus'),'No deben conservarse registros huérfanos');
assert.equal(data.extensions.latin_editorial_decisions.verifiedFormsAdded,0,
 'La corrección de un enunciado no acredita nuevas flexiones');
assert.equal(data.vocabulary.lat.moveo.lat1.entry,'moveo, movi, motum (2ª)');
assert.equal(data.vocabulary.lat.eripio.lat1.entry,'eripio, eripui, ereptum (mx.)');
const overrides=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/verified-overrides.json'),'utf8'));
const expectedOverridden=overrides.paradigms.reduce((n,p)=>n+p.blocks.reduce((sum,b)=>sum+b.forms.length,0),0)+overrides.singleForms.length;
assert.equal(data.rows.lat.filter(x=>x[3]===5).length+
 data.rows.grc.filter(x=>x[3]===5).length,expectedOverridden,
 'El número de formas individualmente contrastadas debe calcularse desde la fuente persistente');
assert(data.rows.lat.some(x=>x[0]==='vinco'&&x[1]==='vicerunt'&&x[2]==='V;IND;ACT;PRF;3;PL'&&x[3]===5));
assert(data.rows.grc.filter(x=>x[3]===5).length>=30,
 'Deben mantenerse los presentes medios griegos documentados');
assert.equal(data.rows.lat.filter(x=>x[0]==='sum'&&x[3]===5).length,30);
assert.equal(data.rows.grc.filter(x=>x[0]==='γιγνομαι'&&x[3]===5).length,6);
assert.equal(data.rows.grc.filter(x=>x[0]==='ερχομαι'&&x[3]===5).length,6);
assert.equal(data.rows.grc.filter(x=>x[0]==='διδασκω'&&x[3]===5).length,6);
assert.equal(data.rows.grc.filter(x=>x[0]==='ακουω'&&x[3]===5).length,6);
assert.equal(data.source.externalVerification.length,overrides.paradigms.length+overrides.singleForms.length);
assert.equal(data.extensions.verifiedIndividualForms,overrides.singleForms.length);
for(const row of overrides.singleForms){
 assert(data.rows[row.lang].some(x=>x[0]===row.lemma&&x[1]===row.form&&x[2]===row.tags&&x[3]===5),
  'Falta la comprobación individual de '+row.form);
 assert(data.source.externalVerification.some(x=>x.lemma===row.lemma&&x.form===row.form&&x.reference===row.reference));
}

assert.ok(data.extensions.rejected_for_conflict.every(x=>x.lemma&&x.features.length>0));
assert.equal(Object.keys(data.vocabulary.lat).length,772+(data.extensions?.readerEnrichment?.additions?.lat||0),
 'El enriquecimiento solo puede añadir lemas presentes en el banco docente');
assert.equal(Object.keys(data.vocabulary.grc).length,351+(data.extensions?.readerEnrichment?.additions?.grc||0),
 'El enriquecimiento griego solo puede añadir lemas presentes en el banco docente');
assert.ok(data.vocabulary.lat.amo?.lat1,'Falta el lema latino del vocabulario docente');
assert.ok(data.vocabulary.grc['λυω']?.gr1,'Falta λύω en el vocabulario griego');
const script=fs.readFileSync(path.join(root,'offline-lemmas.js'),'utf8');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}},console};
runInNewContext(script,ctx,{filename:'offline-lemmas.js'});
const {normalize,query,describe,coverage,coverageByUnit,uniqueLemmaFromData}=ctx.window.ExaminaOfflineLemmatizer;
const latCoverage=coverage(data,'lat1'),grCoverage=coverage(data,'gr1');
assert.ok(latCoverage.lemmas>=664,'No puede perderse ningún lema del temario de Latín I');
for(const course of ['lat1','lat4','gr1']){
 const units=coverageByUnit(data,course);
 assert.ok(units.length>=5,'Faltan unidades de '+course);
 assert.ok(units.every(u=>u.documented+u.candidatesOnly+u.onlyCitation===u.total));
 assert.ok(units.every(u=>u.total>=u.documented));
 assert.ok(units.every(u=>/^UD\s*[1-9]/.test(u.unit)));
}

assert.ok(grCoverage.lemmas>=351,'No puede perderse ningún lema del temario de Griego I');
assert.ok(latCoverage.documented>250&&latCoverage.proposed>100);
assert.ok(grCoverage.documented>=100&&grCoverage.onlyCitation>=0);
assert.ok(grCoverage.proposed>0,'Faltan candidatos nominales griegos claramente identificados');
assert.equal(normalize('AMĀBAM'),normalize('amabam'));
assert.equal(normalize('λόγῳ'),normalize('ΛΌΓῼ'));
assert.notEqual(normalize('ᾳ'),normalize('α'),'La iota suscrita no puede eliminarse');
assert.equal(normalize('λόγος'),normalize('λόγοσ'));
const a=query(data,{course:'lat1',mode:'lemma',text:'amo'});
assert.ok(a.items.length>=6,'Faltan formas de amo');
assert.ok(a.items.every(r=>r.lemma==='amo'));
assert.ok(a.items.some(r=>r.source==='Paradigma docente'));
assert.equal(uniqueLemmaFromData(data,'lat1','amabam'),'amo','Lematizar una forma para el glosario offline');
const model=query(data,{course:'lat1',mode:'form',text:'appropinquabas'});
assert.ok(model.items.some(x=>x.provisional),'Debe figurar como propuesta, no como dato certificado');
if(data.source.readers){
 assert.equal(uniqueLemmaFromData(data,'lat1','appropinquabas'),'appropinquo',
  'La forma contrastada por Collatinus sustituye la antigua candidatura');
 assert.ok(data.rows.lat.some(r=>r[3]===6),'El índice enriquecido contiene Collatinus');
 assert.ok(data.rows.grc.some(r=>r[3]===7),'El índice enriquecido contiene Eulexis');
 assert.ok(data.extensions.readerEnrichment.counts.lat>5000,'La ampliación latina es insuficiente');
 assert.ok(data.extensions.readerEnrichment.counts.grc>5000,'La ampliación griega es insuficiente');
}else assert.equal(uniqueLemmaFromData(data,'lat1','appropinquabas'),null,
 'Una flexión exclusivamente propuesta no puede aprobarse sin fuente contrastada');
const greekMissing=query(data,{course:'gr1',mode:'lemma',text:'ἀδελφός'});
assert.ok(greekMissing.items.some(x=>x.citation),'La entrada griega debe encontrarse sin paradigma disponible');
assert.ok(greekMissing.items.every(x=>!x.provisional||x.source.includes('Wikcionario')),'Las formas griegas propuestas deben conservar origen explícito');
const greek=query(data,{course:'gr1',mode:'lemma',text:'λύω'});
assert.ok(greek.items.length>=5,'Faltan formas de λύω');
assert.ok(greek.items.every(r=>r.info.gr1));
const provisionalGreekRow=data.rows.grc.find(r=>r[3]===4);
const greekForm=query(data,{course:'gr1',text:provisionalGreekRow[1]});
assert.ok(greekForm.items.some(q=>q.provisional&&q.source.includes('Wikcionario')));
assert.equal(greekForm.items.filter(q=>q.provisional).every(q=>q.tags.startsWith('N;')||q.tags.startsWith('ADJ;')),true);
const standaloneGreek={schema:1,vocabulary:{grc:{'δελτα':{gr1:{entry:'δέλτα, -ου',units:['UD 1']}}},lat:{}},
 rows:{grc:[['δελτα','δέλτῳ','N;DAT;SG',4]],lat:[]}};
assert.equal(uniqueLemmaFromData(standaloneGreek,'gr1','δέλτῳ'),null,
 'Una candidata griega no se puede usar como solución ni para el glosario de examen');

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
assert.equal(uniqueLemmaFromData(synthetic,'lat1','rosae'),null,'Un homógrafo no debe resolverse automáticamente');
assert.equal(new Set(ambiguous.items.map(x=>x.lemma)).size,2);
assert.equal(query(synthetic,{course:'gr1',text:'rosae'}).total,0);
const citationOnly={schema:1,vocabulary:{lat:{solo:{lat1:{entry:'solo',units:['UD 1']}}},grc:{}},
 rows:{lat:[['solo','solo','LEX;ENTRY',3]],grc:[]}};
assert.equal(uniqueLemmaFromData(citationOnly,'lat1','solo'),null,
 'Una mera cita del lema no autoriza lematizar automáticamente');
const competingCandidates={schema:1,vocabulary:{lat:{
 rex:{lat1:{entry:'rex, regis',units:['UD 4']}},
 rectus:{lat1:{entry:'rectus, -a, -um',units:['UD 4']}}
},grc:{}},rows:{lat:[
 ['rex','regem','N;ACC;SG',0],
 ['rectus','regem','ADJ;ACC;SG',2]
],grc:[]}};
assert.equal(uniqueLemmaFromData(competingCandidates,'lat1','regem'),null,
 'Si un candidato provisional tiene un lema distinto, no se puede resolver el homógrafo');
const sameLemmaCandidate={...competingCandidates,rows:{lat:[
 ['rex','regem','N;ACC;SG',0],['rex','regem','N;ACC;SG',2]
],grc:[]}};
assert.equal(uniqueLemmaFromData(sameLemmaCandidate,'lat1','regem'),'rex',
 'Una propuesta coincidente del mismo lema no bloquea una identificación documentada');
assert.ok(query(data,{course:'lat1',text:'dos palabras'}).invalid);
console.log('Lematizador offline validado:',data.rows.lat.length,'registros latinos y',data.rows.grc.length,'griegos, sin pérdida de ambigüedad ni iota suscrita.');
