const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','eulexis-local.js'),'utf8');
const sandbox={window:{},console};
vm.runInNewContext(src,sandbox,{filename:'eulexis-local.js'});
const E=sandbox.window.ExaminaEulexisLocal;
assert.equal(E.revision,'e3ca505b0e028af68a800673f5dc4565b0b05104');
assert.equal(E.betaToGreek('lo/gos'),'λόγος');
assert.equal(E.betaToGreek('lo/gou'),'λόγου');
assert.equal(E.betaToGreek('qe/a'),'θέα');
assert.equal(E.betaToGreek('qea/'),'θεά');
assert.equal(E.betaToGreek('*)aqh=nai'),'Ἀθῆναι');
assert.match(E.describe('pres ind act 3rd pl'),/presente indicativo activo 3.ª persona plural/);
assert.equal(E.norm('λόγος'),E.norm('λογὸς'));
assert.notEqual(E.norm('λόγῳ'),E.norm('λόγω'),'Se conserva la iota suscrita');
const data={schema:1,vocabulary:{grc:{
 λογοσ:{gr1:{entry:'λόγος, –ου',units:['UD1']}},
 θεα:{gr1:{entry:'θεά, –ᾶς (ἡ)',units:['UD1']}},
 θεοσ:{gr1:{entry:'θεός, –οῦ',units:['UD1']}}
}}};
const x=E.extractor(data,['nom sg masc','gen sg masc','nom sg fem']);
x.lemmas('a\tlo/gos\tix\nb\tqe/a\tix\nc\tqea/\tix\nd\tqe/os\tix\nf\tu(/mnos\tix');
x.forms('lo/gos\ta.0\na)/gnwstos\tf.0\nlo/gou\ta.1\nqe/a\tb.2\nqea/\tc.2\nqeou=\td.1\nlo/gos\ta.0');
const output=x.result();
assert.equal(output.matched,3,'No debe aceptarse la entrada θέα (vista)');
assert.equal(output.count,4,'Se eliminan duplicados, palabras ajenas y la flexión de θέα');
assert.ok(output.rows.some(x=>x[0]==='λόγος'&&x[1]==='λόγος'));
assert.ok(output.rows.some(x=>x[0]==='θεά'&&x[1]==='θεά'));
assert.ok(!output.rows.some(x=>x[0]==='θέα'),'No atribuir a la diosa la flexión de vista');
assert.ok(!output.rows.some(x=>x[1].includes('ὕμνος')));
assert.equal(E.fingerprint(data),E.fingerprint(JSON.parse(JSON.stringify(data))));
const changed=JSON.parse(JSON.stringify(data));
changed.vocabulary.grc.θεα.gr1.entry='θέα, –ας (ἡ)';
assert.notEqual(E.fingerprint(data),E.fingerprint(changed),'Cambios curriculares invalidan el índice personal');
console.log('Eulexis: conversión Beta, filtrado curricular, homografía θέα/θεά y versiones locales correctos.');
