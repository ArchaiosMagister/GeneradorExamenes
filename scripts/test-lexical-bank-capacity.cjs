'use strict';
// Inventario del repertorio léxico distribuido, sin datos personales ni importaciones.
// Usa los mismos filtros que el generador. No exige variedad imposible si el docente
// restringe deliberadamente el intervalo, los prefijos o las normas fonéticas.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const assets={
 p4:json('data/lat4-progresion-lexico.json'),
 p1:json('data/fonetica/lat1-programacion.json'),
 phon:json('data/fonetica/banco_examenes.json'),
 pref:json('data/prefijos-docente.json'),
 idioms:json('data/latinismos-docente.json'),
 pv:json('data/modificacion-preverbial-unidades-lat1.json'),
 verbs:json('data/modificacion-preverbial-docente.json')
};
function extract(html,a,b){
 const first=html.indexOf(a),last=html.indexOf(b,first);
 assert(first>=0&&last>first,'No se localiza '+a);
 return html.slice(first,last);
}
const results=[];
for(const filename of ['index.html','offline.html']){
 const html=read(filename);
 const normalization=html.match(/const normLex=x=>([^;\n]+);/);
 assert(normalization,'Falta normalizador léxico');
 const source=[
 extract(html,'function parseTeacherPhonetics(','const LATIN_LEX_STORAGE='),
 extract(html,'function latin1PhoneticMaxUnit(','function syncLatin1PhoneticRuleControls('),
 extract(html,'function examLexFilter(','function latinLexPriorities(')
 ].join('\n');
 const normLex=vm.runInNewContext('x=>'+normalization[1]);
 const report=vm.runInNewContext(source+`
 const phoneticRules=Array.from({length:20},(_,i)=>({id:'N'+String(i+1).padStart(2,'0')}));
 const latin4LexCurriculum=p4,latin1PreverbCurriculum=pv;
 const latin1PhoneticCurriculum=parseLatin1PhoneticCurriculum(p1);
 const general=parseTeacherPhonetics(phon);
 const p1rows=latin1PhoneticCurriculum.rows.filter(r=>r.estado==='APTO_PROPUESTO'&&
  !general.some(x=>normLex(x.latin)===normLex(r.latin)));
 const latinLexBanks={
  latin4:{prefixes:pref.items,phonetics:general},
  latin1:{prefixes:pref.items,phonetics:[...general,...p1rows],latinisms:idioms.items,preverbs:verbs.items}
 };
 const selectedPhoneticRules=new Set(phoneticRules.map(x=>x.id));
 let lang='es',prefix='all';
 const $=id=>id==='lang'?{value:lang}:id==='lex-prefix'?{value:prefix}:null;
 const inventory=[];
 const selections=[
  ['latin4',Array.from({length:10},(_,i)=>'UD'+(i+1)),['prefixes','phonetics']],
  ['latin1',[...Array.from({length:8},(_,i)=>'UD'+(i+1)),'UD9–10','UD11–12'],
   ['prefixes','phonetics','latinisms','preverbs']]
 ];
 for(const [course,units,kinds] of selections)for(const unit of units)for(lang of ['es','va']){
  const pools={};
  for(const kind of kinds){
   const rows=latinLexPool(course,kind,[unit]);
   pools[kind]={distinct:new Set(rows.map(x=>latinLexTermKey(x,kind)).filter(Boolean)).size,
    requested:kind==='preverbs'&&unit==='UD1'?0:latinLexExpectedCount(kind)};
  }
  inventory.push({course,unit,lang,pools});
 }
 const groups=[];
 for(const group of pref.groups)for(lang of ['es','va']){
  prefix=group.prefix;
  const rows=latinLexPool('latin1','prefixes',['UD1']);
  groups.push({prefix,lang,distinct:new Set(rows.map(x=>latinLexTermKey(x,'prefixes')).filter(Boolean)).size});
 }
 ({inventory,groups});
 `,{...assets,normLex});
 for(const {course,unit,lang,pools} of report.inventory)for(const [kind,{distinct,requested}] of Object.entries(pools)){
  const label=[filename,course,unit,lang,kind].join('/');
  if(requested===0)assert.equal(distinct,0,label+': contenido adelantado');
  else assert(distinct>requested,label+': falta al menos una alternativa para regenerar ('+distinct+'/'+requested+')');
 }
 for(const {prefix,lang,distinct} of report.groups)assert(distinct>4,filename+' '+prefix+'/'+lang+': sin repuesto');
 results.push(JSON.stringify(report));
 console.log('LEXICAL_CAPACITY '+filename+' '+JSON.stringify(report));
}
assert.equal(results[0],results[1],'Web y autónomo divergen en los filtros léxicos');
console.log('PASS: capacidad léxica por unidad e idioma y por grupo de prefijos; web y autónomo.');
