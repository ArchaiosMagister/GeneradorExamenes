// Consultas personales a revisiones fijas de los lectores. El resultado contiene
// formas y lemas, sin copiar sus glosas ni incorporar sus bases a la webapp.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const revisions={
 lat:['lector-latino','6e3a05c55dfd0514d1bd507a246172f103b49e92','latin.js','LatinCore'],
 grc:['lector-griego','e3ca505b0e028af68a800673f5dc4565b0b05104','greek.js','GreekCore']
};
const [projectPath,checkout,output]=process.argv.slice(2);
if(!projectPath||!checkout||!output)
 throw Error('Uso: node scripts/prepare-reader-proposals.mjs proyecto.json carpeta-del-lector salida.json');
const project=JSON.parse(await fs.readFile(projectPath,'utf8'));
if(!['gr1','lat4','lat1'].includes(project.course)||!Array.isArray(project.units)||
 !Number.isInteger(project.count)||project.count<1||project.count>100)
 throw Error('La copia del proyecto de vocabulario no es válida');
const language=project.course==='gr1'?'grc':'lat';
const [name,revision,filename,constructor]=revisions[language];
const actual=execFileSync('git',['-C',checkout,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(actual!==revision)throw Error('Se requiere '+name+' en la revisión '+revision);
const read=file=>fs.readFile(path.join(checkout,file),'utf8');
const scope={window:{}};
// Ejecutar solamente el archivo de la revisión fijada, desde el objeto Git.
const source=execFileSync('git',['-C',checkout,'show',revision+':'+filename],{encoding:'utf8'});
vm.runInNewContext(source,scope,{filename,timeout:10000});
const Reader=scope.window[constructor];
const reader=new Reader(read);
if(language==='grc')await reader.init();
else{
 const [models,lexicon,extra,regimen]=await Promise.all(
  ['modeles.txt','lexique.txt','extra.json','regimen.txt'].map(file=>read('data/'+file)));
 reader.load(models,lexicon,JSON.parse(extra),regimen);
}
const forms=new Set();
for(const unit of project.units.slice(0,project.count)){
 const text=String(unit.text||'');
 for(const word of text.match(/[\p{L}\p{M}]+/gu)||[])forms.add(word.normalize('NFC'));
}
const rows=[];
let found=0;
for(const form of forms){
 const results=await reader.analyse(form);
 const seen=new Set();
 for(const result of results){
  const lemma=(language==='lat'?result.lemme:result.lemme.replace(/\d+$/u,'')).normalize('NFC').trim();
  const analyses=result.formes.filter(item=>language==='lat'||!result.exact||item.exact)
   .map(item=>language==='lat'?(item.morpho||item.t):item.morpho).filter(Boolean);
  const analysis=[...new Set(analyses)].join(' · ').slice(0,500);
  const key=JSON.stringify([lemma,analysis]);
  if(!lemma||lemma.length>160||seen.has(key))continue;
  seen.add(key);rows.push({form,lemma,analysis});
 }
 if(seen.size)found++;
}
await fs.writeFile(output,JSON.stringify({schema:'examina-reader-proposals/v1',language,rows})+'\n',{flag:'wx'});
console.log(name+' · '+found+'/'+forms.size+' formas con propuestas · '+rows.length+' lecturas');
