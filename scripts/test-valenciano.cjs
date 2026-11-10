const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'lexicon-valenciano.js'),'utf8'),ctx);
const dictionary=ctx.window.ExaminaValencianGloss;
assert.ok(dictionary?.count>1000,'El diccionario valenciano debería contener más de mil equivalencias.');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=html.indexOf('let vocab=')+'let vocab='.length;
assert.ok(start>10);
const end=html.indexOf('];',start)+1;
const initial=JSON.parse(html.slice(start,end));
for(const m of html.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))initial.push(...JSON.parse(m[1]));
assert.equal(initial.length,2046,'La comprobación debe cubrir todo el léxico inicial.');
const pending=initial.filter(item=>!dictionary.lookup(item.meaning).ready);
assert.deepEqual(pending.map(x=>x.entry),[],'Significados pendientes de versión valenciana');
for(const item of initial){
 assert.equal(dictionary.forEntry(item,'es').value,item.meaning,'El castellano original no debe modificarse');
 assert.ok(dictionary.forEntry(item,'va').value,'Falta glosa valenciana: '+item.entry);
}
const sample={entry:'πόλις, –εως',meaning:'ciudad',meaning_va:'la meua traducció'};
assert.equal(dictionary.forEntry(sample,'va').value,'la meua traducció','La corrección docente valenciana tiene prioridad');
assert.equal(dictionary.forEntry(sample,'es').value,'ciudad','No sustituir traducción original');
assert.ok(html.includes('<script src="lexicon-valenciano.js"></script>'));
assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('./lexicon-valenciano.js'));
console.log('Léxico ES/VA: '+initial.length+' entradas originales conservadas y traducidas; prioridad del docente verificada.');
