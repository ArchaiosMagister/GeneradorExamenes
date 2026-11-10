const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'culture-lat4.js'),'utf8'),scope);
const rows=scope.window.ExaminaCultureBank;
assert.equal(rows.length,58);
const seen=new Set();
for(const row of rows){
 assert.equal(row.course,'latin4');
 assert.ok(row.units.length===1 && /^UD[1-8]$/.test(row.units[0]));
 assert.ok(['short','essay','tf','mc'].includes(row.type));
 for(const key of ['question','answer','question_va','answer_va'])assert.ok(typeof row[key]==='string'&&row[key].trim(),row.id+' '+key);
 assert.ok(!seen.has(row.id),row.id);seen.add(row.id);
}
for(let u=1;u<=8;u++)assert.ok(rows.filter(x=>x.units[0]==='UD'+u).length>=7,'UD'+u);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/<script src="culture-lat4.js"><\\/script>/);
assert.ok(html.indexOf('window.ExaminaCultureBank')<html.indexOf('const initialCulture'));
assert.ok(!/Nota sobre [^<]*: __________|Nota: __________/.test(html));
assert.match(html,/1\.er trimestre/);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.match(sw,/culture-lat4\.js/);
console.log('Banco Cultura LAT4: 58 preguntas, 8 unidades, 2 idiomas, caché y encabezados correctos.');
