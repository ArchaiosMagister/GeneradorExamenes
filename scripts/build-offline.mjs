import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');

/**
 * HTML totalmente autónomo: interfaz más bancos ya incluidos en el repositorio.
 * No descarga recursos externos y conserva index.html como fuente de la web pública.
 */
export async function renderOffline(root=projectRoot){
 const sourceHtml=await readFile(resolve(root,'index.html'),'utf8');
 // Los enlaces y controles PWA no deben aparecer en el HTML de archivo único.
 const metadata='<meta name="theme-color" content="#16355d"><link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icons/icon-192.png" type="image/png">';
 const begin='<!-- EXAMINA_PWA_START -->',end='<!-- EXAMINA_PWA_END -->';
 const first=sourceHtml.indexOf(begin),last=sourceHtml.indexOf(end,first);
 if(!sourceHtml.includes(metadata)||first<0||last<0||
    !sourceHtml.includes('<script src="pwa.js" defer></script>')){
  throw new Error('Faltan los marcadores PWA en index.html');
 }
 const noHead=sourceHtml.replace(metadata,'');
 const noPanel=noHead.slice(0,noHead.indexOf(begin))+noHead.slice(noHead.indexOf(end)+end.length);
 const html=noPanel.replace('<script src="pwa.js" defer></script>','');
 const latin=JSON.parse(await readFile(resolve(root,'data/unimorph/lat-v.json'),'utf8'));
 if(!Array.isArray(latin.rows)||!latin.rows.length||
    !latin.rows.every(row=>Array.isArray(row)&&row.length>=4)){
  throw new Error('El banco latino no tiene el formato esperado');
 }
 if(!html.includes('function examinaEmbeddedAsset(path)')){
  throw new Error('index.html no admite bancos morfológicos embebidos');
 }
 const lemmatizer=JSON.parse(await readFile(resolve(root,'data/lemmas/teacher-forms.json'),'utf8'));
 if(lemmatizer.schema!==1||!Array.isArray(lemmatizer.rows?.lat)||!Array.isArray(lemmatizer.rows?.grc)||
    lemmatizer.rows.lat.length<10000||lemmatizer.rows.grc.length<1400){
  throw new Error('Falta el índice bilingüe para la versión autónoma');
 }
 const lexicalPaths=['data/latinismos-docente.json','data/prefijos-docente.json','data/modificacion-preverbial-docente.json'];
 const lexicalAssets={};
 for(const path of lexicalPaths){
  const data=JSON.parse(await readFile(resolve(root,path),'utf8'));
  if(data.schema!==1||!Array.isArray(data.items)||!data.items.length)throw new Error('Banco léxico docente incompleto: '+path);
  lexicalAssets[path]=data;
 }
 const latin4ProgressPath='data/lat4-progresion-lexico.json';
 const latin4Progress=JSON.parse(await readFile(resolve(root,latin4ProgressPath),'utf8'));
 if(latin4Progress.schema!==1||latin4Progress.course!=='latin4'||
   latin4Progress.units?.length!==8)throw new Error('Falta programación de léxico de Latín 4.º');
 const syllabusPath='data/modificacion-preverbial-unidades-lat1.json';
 const syllabus=JSON.parse(await readFile(resolve(root,syllabusPath),'utf8'));
 if(syllabus.schema!==1||syllabus.course!=='latin1'||!Array.isArray(syllabus.units)||
    syllabus.units.reduce((n,x)=>n+(x.verbs?.length||0),0)!==28)
  throw new Error('Programa docente de modificación preverbial incompleto');
 const phonetics=JSON.parse(await readFile(resolve(root,'data/fonetica/banco_examenes.json'),'utf8'));
 if(phonetics.esquema!=='evoluciones-latin-castellano/v1'||phonetics.items?.length!==460||
  new Set(phonetics.items.map(x=>x.id)).size!==460)
  throw new Error('El banco fonético integrado debe contener 460 fichas distintas');
 const assets={'data/unimorph/lat-v.json':latin,'data/lemmas/teacher-forms.json':lemmatizer,...lexicalAssets,[syllabusPath]:syllabus,[latin4ProgressPath]:latin4Progress,'data/fonetica/banco_examenes.json':phonetics};
 // Evita cerrar prematuramente el elemento HTML script inerte.
 const json=JSON.stringify(assets).replace(/</g,'\\u003c');
 const marker='<script>';
 if(!html.includes(marker))throw new Error('No existe el script de la webapp');
 const offlineModule=await readFile(resolve(root,'offline-lemmas.js'),'utf8');
 const reviewModule=await readFile(resolve(root,'verification-review.js'),'utf8');
 const reviewExternal='<script src="verification-review.js" defer></script>';
 if(!html.includes(reviewExternal))throw new Error('Falta el panel de revisión filológica');
 const reviewScript='<script>'+reviewModule.replace(/<\/script/gi,'<\\/script')+'</script>';
 const external='<script src="offline-lemmas.js" defer></script>';
 if(!html.includes(external))throw new Error('No existe el lematizador en index.html');
 const script='<script>'+offlineModule.replace(/<\/script/gi,'<\\/script')+'</script>';
 const offline=html.replace(external,script).replace(reviewExternal,reviewScript).replace(marker,
  '<script id="examina-offline-assets" type="application/json">'+json+'</script>\n'+marker);
 return {content:offline,datasetCount:Object.keys(assets).length,latinRows:latin.rows.length,lemmaRows:lemmatizer.rows.lat.length+lemmatizer.rows.grc.length};
}
export async function buildOffline(output=resolve(projectRoot,'offline.html')){
 const result=await renderOffline();
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,result.content,'utf8');
 console.log('HTML autónomo creado:',output,'·',result.latinRows,'formas latinas y',result.lemmaRows,'análisis bilingües de lematización');
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 await buildOffline();
}
