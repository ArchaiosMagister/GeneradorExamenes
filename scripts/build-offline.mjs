import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {erroresBancoFonetico,erroresProgramacionFonetica} from '../data/fonetica/criterios-docentes.mjs';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');

/**
 * HTML totalmente autónomo: interfaz más bancos ya incluidos en el repositorio.
 * No descarga recursos externos y conserva index.html como fuente de la web pública.
 */
export async function renderOffline(root=projectRoot){
 const sourceHtml=await readFile(resolve(root,'index.html'),'utf8');
 // Los enlaces y controles PWA no deben aparecer en el HTML de archivo único.
 const metadata=['<meta name="theme-color" content="#16355d">',
  '<link rel="manifest" href="./manifest.webmanifest">',
  '<link rel="icon" href="./icons/icon-192.png" type="image/png">',
  '<link rel="icon" href="./icons/favicon-48.png" type="image/png" sizes="48x48">',
  '<link rel="apple-touch-icon" href="./icons/apple-touch-icon-180.png" sizes="180x180">'];
 const begin='<!-- EXAMINA_PWA_START -->',end='<!-- EXAMINA_PWA_END -->';
 const first=sourceHtml.indexOf(begin),last=sourceHtml.indexOf(end,first);
 if(!metadata.every(tag=>sourceHtml.includes(tag))||first<0||last<0||
    !sourceHtml.includes('<script src="pwa.js" defer></script>')){
  throw new Error('Faltan los marcadores PWA en index.html');
 }
 const noHead=metadata.reduce((html,tag)=>html.replace(tag,''),sourceHtml);
 const noPanel=noHead.slice(0,noHead.indexOf(begin))+noHead.slice(noHead.indexOf(end)+end.length);
 let html=noPanel.replace('<script src="pwa.js" defer></script>','');
 const qualityModule=await readFile(resolve(root,'vocabulary-quality.js'),'utf8');
 const qualityExternal='<script src="vocabulary-quality.js" defer></script>';
 if(!html.includes(qualityExternal))throw new Error('Falta el módulo de auditoría de vocabulario');
 html=html.replace(qualityExternal,'<script>'+qualityModule.replace(/<\/script/gi,'<\\/script')+'</script>');
 const unifiedExternal='<script src="unified-backup.js" defer></script>';
 if(!html.includes(unifiedExternal))throw new Error('Falta la copia unificada');
 const unifiedModule=await readFile(resolve(root,'unified-backup.js'),'utf8');
 html=html.replace(unifiedExternal,'<script>'+unifiedModule.replace(/<\/script/gi,'<\\/script')+'</script>');
 const scoringModule=await readFile(resolve(root,'exam-scoring.js'),'utf8');
 const scoringExternal='<script src="exam-scoring.js" defer></script>';
 if(!html.includes(scoringExternal))throw new Error('Falta el gestor de puntuación por pregunta');
 html=html.replace(scoringExternal,'<script>'+scoringModule.replace(/<\/script/gi,'<\\/script')+'</script>');
 const vocabularyModule=await readFile(resolve(root,'vocabulary-generator.js'),'utf8');
 const vocabularyExternal='<script src="vocabulary-generator.js" defer></script>';
 if(!html.includes(vocabularyExternal))throw new Error('Falta el generador de vocabulario independiente');
 html=html.replace(vocabularyExternal,'<script>'+vocabularyModule.replace(/<\/script/gi,'<\\/script')+'</script>');
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
 if(phonetics.esquema!=='evoluciones-latin-castellano/v1'||phonetics.items?.length<510||
  new Set(phonetics.items.map(x=>x.id)).size!==phonetics.items.length)
  throw new Error('El banco fonético integrado debe contener al menos 510 fichas distintas');
 const lat1PhoneticsPath='data/fonetica/lat1-programacion.json';
 const lat1Phonetics=JSON.parse(await readFile(resolve(root,lat1PhoneticsPath),'utf8'));
 if(lat1Phonetics.schema!==1||lat1Phonetics.course!=='latin1'||lat1Phonetics.unidades?.length!==11||
  lat1Phonetics.unidades.reduce((n,u)=>n+(u.palabras?.length||0),0)!==73)
  throw new Error('Falta la programación acumulativa de las 73 evoluciones de Latín I');
 const erroresFon=[...erroresBancoFonetico(phonetics),...erroresProgramacionFonetica(lat1Phonetics)];
 if(erroresFon.length)throw new Error('Criterios docentes fonéticos: '+erroresFon.slice(0,12).join('; '));
 const assets={'data/unimorph/lat-v.json':latin,'data/lemmas/teacher-forms.json':lemmatizer,...lexicalAssets,[syllabusPath]:syllabus,[latin4ProgressPath]:latin4Progress,[lat1PhoneticsPath]:lat1Phonetics,'data/fonetica/banco_examenes.json':phonetics};
 // Evita cerrar prematuramente el elemento HTML script inerte.
 const json=JSON.stringify(assets).replace(/</g,'\\u003c');
 const marker='<script>';
 if(!html.includes(marker))throw new Error('No existe el script de la webapp');
 const offlineModule=await readFile(resolve(root,'offline-lemmas.js'),'utf8');
 const reviewModule=await readFile(resolve(root,'verification-review.js'),'utf8');
 const greekReviewModule=await readFile(resolve(root,'greek-review.js'),'utf8');
 const eulexisModule=await readFile(resolve(root,'eulexis-local.js'),'utf8');
 const cultureModule=await readFile(resolve(root,'culture-lat4.js'),'utf8');
 const valencianModule=await readFile(resolve(root,'lexicon-valenciano.js'),'utf8');
 const requiredLatinExternal='<script src="required-latin-units.js"></script>';
 const requiredLatinModule=await readFile(resolve(root,'required-latin-units.js'),'utf8');
 if(!html.includes(requiredLatinExternal))throw new Error('Faltan listas exigibles latinas');
 html=html.replace(requiredLatinExternal,
  '<script>'+requiredLatinModule.replace(/<\/script/gi,'<\\/script')+'</script>');
 const valencianExternal='<script src="lexicon-valenciano.js"></script>';
 if(!html.includes(valencianExternal))throw new Error('Falta el léxico valenciano en index.html');
 html=html.replace(valencianExternal,'<script>'+valencianModule.replace(/<\/script/gi,'<\\/script')+'</script>');
 const cultureExternal='<script src="culture-lat4.js"></script>';
 if(!html.includes(cultureExternal))throw new Error('Falta banco de cultura en index.html');
 html=html.replace(cultureExternal,'<script>'+cultureModule.replace(/<\/script/gi,'<\\/script')+'</script>');
 const reviewExternal='<script src="verification-review.js" defer></script>';
 if(!html.includes(reviewExternal))throw new Error('Falta el panel de revisión filológica');
 const reviewScript='<script>'+reviewModule.replace(/<\/script/gi,'<\\/script')+'</script>';
 const eulexisExternal='<script src="eulexis-local.js" defer></script>';
 if(!html.includes(eulexisExternal))throw new Error('Falta adaptador local Eulexis');
 const eulexisScript='<script>'+eulexisModule.replace(/<\/script/gi,'<\\/script')+'</script>';
 const greekReviewExternal='<script src="greek-review.js" defer></script>';
 if(!html.includes(greekReviewExternal))throw new Error('Falta la cola de revisión griega');
 const greekReviewScript='<script>'+greekReviewModule.replace(/<\/script/gi,'<\\/script')+'</script>';
 const external='<script src="offline-lemmas.js" defer></script>';
 if(!html.includes(external))throw new Error('No existe el lematizador en index.html');
 const script='<script>'+offlineModule.replace(/<\/script/gi,'<\\/script')+'</script>';
 const offline=html.replace(external,script).replace(reviewExternal,reviewScript).replace(greekReviewExternal,greekReviewScript).replace(eulexisExternal,eulexisScript).replace(marker,
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
