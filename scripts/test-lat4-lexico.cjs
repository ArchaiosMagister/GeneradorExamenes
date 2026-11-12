const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const curriculum=read('data/lat4-progresion-lexico.json');
const prefixes=read('data/prefijos-docente.json');
const phonetics=read('data/fonetica/banco_examenes.json');
assert.equal(curriculum.units.length,8);
assert.equal(prefixes.items.length,286);
assert.ok(!prefixes.items.some(x=>x.prompt==='Ultrapuertos'||x.prompt_va==='ultraports'),
 'Ultrapuertos y ultraports no deben participar en el sorteo de ningún idioma');
assert.ok(prefixes.items.every(x=>typeof x.prompt_va==='string'&&x.prompt_va.trim()));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/gi,'ae').replace(/œ/gi,'oe');
function phoneticEligible(row,lessons,allowed){
 if(row.estado!=='APTO_PROPUESTO'||!Array.isArray(row.normas)||!row.normas.length)return false;
 if(!row.normas.every(code=>allowed.has(code)))return false;
 // La unidad define las normas, no un subconjunto de palabras por patrón.
 return true;
}
const expectedAvailable={1:96,2:121,4:195,8:337};
for(let last=1;last<=8;last++){
 const taught=curriculum.units.filter(x=>x.unit<=last);
 const prefixCodes=new Set(taught.flatMap(x=>x.prefixGroups));
 const lessons=taught.flatMap(x=>x.phoneticLessons);
 const rules=new Set([...curriculum.baselineNormCodes,...lessons.map(x=>x.code)]);
 const es=prefixes.items.filter(x=>prefixCodes.has(x.prefix));
 const va=es.filter(x=>x.valencianPrefixEligible!==false);
 const phon=phonetics.items.filter(x=>phoneticEligible(x,lessons,rules));
 assert.ok(es.length>=4,'Prefijos ES: UD'+last);
 assert.ok(va.length>=4,'Prefijos VA: UD'+last);
 assert.ok(phon.length>=4,'Fonética: UD'+last);
 if(expectedAvailable[last]!==undefined)
  assert.equal(phon.length,expectedAvailable[last],'El banco general debe ser elegible según normas en UD'+last);
 for(const word of va)assert.ok(word.prompt_va && word.prefix,'Prefijo sin equivalencia: '+word.prompt);
 for(const word of phon)assert.ok(word.normas.every(code=>rules.has(code)),'Norma no enseñada: '+word.latin);
 console.log('UD'+last+': '+es.length+' prefijos ES, '+va.length+' VA, '+phon.length+' evoluciones fonéticas compatibles.');
}
