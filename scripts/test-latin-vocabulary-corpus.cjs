/* Prueba de regresión del generador con diez frases latinas originales. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['lexicon-valenciano.js','offline-lemmas.js','vocabulary-generator.js'])
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const api=ctx.window.ExaminaVocabulary;
const dataset=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const corpus=JSON.parse(fs.readFileSync(path.join(root,'tests/latin-vocabulary-sentences.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('let vocab=')+10;
assert.ok(start>10,'No se encuentra el banco docente');
const bank=JSON.parse(html.slice(start,html.indexOf(';',start)));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))bank.push(...JSON.parse(m[1]));
const latin=bank.filter(row=>!row.course||row.course==='latin1');
assert.equal(corpus.sentences.length,10);
const analyzed=corpus.sentences.map((text,i)=>({title:'UD'+(i+1),text,mode:'complete',
 rows:api.analyze(dataset,text,'lat1',latin),analyzed:true}));
let total=0,documented=0,unknown=[];
for(const [i,u] of analyzed.entries()){
 assert.ok(u.rows.length>=3,'La frase '+(i+1)+' no se ha tokenizado');
 total+=u.rows.length;
 documented+=u.rows.filter(r=>r.status==='documented').length;
 const unresolved=u.rows.filter(r=>r.status!=='documented');
 unknown.push(...unresolved.map(r=>({sentence:i+1,form:r.form,status:r.status,candidates:r.candidates.map(c=>c.entry)})));
 console.log('Frase '+(i+1)+': '+u.text+' -> '+u.rows.map(r=>r.form+'='+r.entry+' ('+r.status+')').join(' | '));
}
const coverage=Number((100*documented/total).toFixed(1));
console.log('Cobertura de las diez frases: '+documented+'/'+total+' ('+coverage+' %); incidencias: '+JSON.stringify(unknown));
const all=analyzed.flatMap(u=>u.rows);
for(const w of ['ab','ad','in','de','per','et']){
 const found=all.find(r=>r.form.toLowerCase()===w);
 assert.equal(found?.status,'documented','Invariable sin reconocimiento: '+w);
 assert.ok(found.entry&&found.meaning,'Enunciado/glosa ausente para '+w);
}
const external=!!dataset.source.readers;
if(external)assert.ok(coverage>=95,'Cobertura baja para diez frases con motores externos: '+coverage+' %');
else console.log('Prueba de regresión sin índices externos: '+coverage+' %; se conservan las candidatas para revisión.');
const withPreposition=api.analyze(dataset,'de vita','lat1',latin);
if(external)assert.equal(withPreposition.find(x=>x.form==='vita')?.status,'documented',
 'El ablativo tras de debe resolver el homógrafo de vita/vito');
const withoutContext=api.analyze(dataset,'vita','lat1',latin);
if(external)assert.equal(withoutContext[0].status,'review',
 'Sin contexto vita sigue siendo homógrafa; no se debe adivinar');
if(external)assert.ok(!unknown.some(x=>x.status==='unknown'),
 'El índice ampliado debe reconocer todos los ejemplos escolares');
const project={course:'lat1',lang:'es',count:10,units:analyzed};
const xml=api.documentXml(project);
assert.match(xml,/Vocabulario por unidades de Latín I/);
assert.match(xml,/<w:smallCaps\/>/);
assert.match(xml,/<w:sz w:val="28"/);
assert.match(xml,/<w:top w:val="single" w:sz="4"/);
assert.match(xml,/<w:cols w:num="1"/);
assert.doesNotMatch(xml,/<w:cols w:num="2"/);
assert.match(xml,/<w:i\/>[^]*puella/i);
assert.match(xml,/UD10/);
assert.equal((xml.match(/<w:sectPr>/g)||[]).length,1);
project.lang='va';
const vaXml=api.documentXml(project);
assert.match(vaXml,/Vocabulario por unidades de Latín I/);
assert.match(vaXml,/des de|davant de|hui|per/,'La glosa valenciana de invariables debe exportarse');
console.log('Corpus latino y Word castellano/valenciano: validación superada.');
