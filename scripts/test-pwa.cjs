// Regression real en Chromium: instalación en subdirectorio de GitHub Pages,
// uso totalmente sin red, datos/lematizador, actualización voluntaria y borrador.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/GeneradorExamenes/';
let release='test-one';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8',
 '.png':'image/png'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith(PREFIX)){res.writeHead(404).end();return}
 const partial=url.pathname.slice(PREFIX.length)||'index.html';
 const filepath=path.resolve(ROOT,partial);
 if(!filepath.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
 try{
  let body=await fs.readFile(filepath);
  if(partial==='sw.js')body=Buffer.from(body.toString().replace('__PWA_BUILD_VERSION__',release));
  res.writeHead(200,{'content-type':types[path.extname(partial)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404).end()}
});
(async()=>{
 const pngs=await Promise.all([192,512].map(size=>fs.readFile(path.join(ROOT,'icons','icon-'+size+'.png'))));
 for(let i=0;i<pngs.length;i++){
  const png=pngs[i],size=i?512:192;
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Icono PNG inválido');
  assert.equal(png.readUInt32BE(16),size,'Dimensión incorrecta en icono PWA');
 }
 const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'manifest.webmanifest'),'utf8'));
 assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');
 assert.equal(manifest.icons.length,2);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,
  ...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',err=>errors.push(String(err)));
  page.on('request',req=>requests.push(req.url()));
  await page.goto(origin+PREFIX);
  await page.waitForFunction(()=>window.ExaminaTeacherLexBankReady===true,null,{timeout:30000});
  const lex=await page.evaluate(()=>({
   latinisms:latinLexBanks.latin1.latinisms.length,
   prefixes:latinLexBanks.latin1.prefixes.length,
   preverbs:latinLexBanks.latin1.preverbs.length,
   phonetics:latinLexBanks.latin1.phonetics.length
  }));
  assert.deepEqual([lex.latinisms,lex.prefixes,lex.preverbs,lex.phonetics],[87,286,120,73],
   'No han cargado todos los bancos léxicos docentes');
  const expanded=await page.evaluate(()=>latinLexBanks.latin4.phonetics.some(x=>x.id==='EVF-0008'));
  assert(expanded,'Las ampliaciones del banco general no han llegado a Latín 4.º: falta EVF-0008');
  const latin4Progress=await page.evaluate(()=>{
   const result={};
   for(let unit=1;unit<=8;unit++){
    const chosen=['UD'+unit];
    const prefixes=latinLexPool('latin4','prefixes',chosen),phonetics=latinLexPool('latin4','phonetics',chosen);
    result[unit]={prefixes:prefixes.map(x=>x.prompt),groups:[...new Set(prefixes.map(x=>x.prefix))],
      phonetics:phonetics.map(x=>x.prompt),phoneticRows:phonetics.length};
   }
   return result;
  });
  assert(latin4Progress[1].prefixes.length>6,'Latín 4.º UD1: los seis ejemplos de clase no son el banco');
  assert(latin4Progress[1].phonetics.length>6,'Latín 4.º UD1: se debe utilizar el banco fonético general');
  assert.deepEqual(latin4Progress[1].groups.sort(),['PRE-','RE-/RED-'].sort(),
    'UD1: solo los prefijos re- y pre-');
  assert(!latin4Progress[2].groups.includes('CONTRA-'),'La UD2 no puede anticipar contra-');
  assert(latin4Progress[4].groups.includes('CONTRA-')&&latin4Progress[4].groups.includes('ANTI- (oposición)'),
    'La UD4 debe introducir contra-/anti-');
  assert(latin4Progress[7].groups.includes('INTER-'),'La UD7 debe incluir inter-');
  assert.deepEqual(latin4Progress[8].groups.sort(),latin4Progress[7].groups.sort(),
    'La UD8 no introduce prefijos nuevos: debe reutilizar los anteriores');
  for(let u=1;u<=8;u++){
   assert(latin4Progress[u].prefixes.length>=4&&latin4Progress[u].phoneticRows>=4,
     'Latín 4.º UD'+u+': debe disponer de al menos cuatro propuestas por apartado');
   if(u>1){
    assert(latin4Progress[u].prefixes.length>=latin4Progress[u-1].prefixes.length,
     'Latín 4.º: las palabras de prefijos no son acumulativas en UD'+u);
    assert(latin4Progress[u].phoneticRows>=latin4Progress[u-1].phoneticRows,
     'Latín 4.º: las formas fonéticas no son acumulativas en UD'+u);
   }
  }
  const latin4Excluded=await page.evaluate(()=>({
    all:latinLexBanks.latin4.prefixes.length,
    earlier:latinLexPool('latin4','prefixes',['UD1']).length,
    selected:latinLexRandomFour('prefixes',latinLexPool('latin4','prefixes',['UD1']),'latin4').map(x=>x.prompt)
  }));
  assert(latin4Excluded.all===286&&latin4Excluded.earlier<286,
    'Latín 4.º debe usar los 286 prefijos generales pero con filtro curricular');
  assert.equal(latin4Excluded.selected.length,4,'Latín 4.º debe seleccionar cuatro formas para prefijos');
  const taught=await page.evaluate(()=>{
   const result={};
   for(let i=1;i<=10;i++)result['UD'+i]=latinLexPool('latin1','preverbs',['UD'+i]).map(x=>x.prompt);
   result.fligo=latinLexPool('latin1','preverbs',['UD9']).find(x=>x.prompt==='fligo');
   result.fromFirstUnit=latinLexRandomFour('preverbs',latinLexPool('latin1','preverbs',['UD2'])).map(x=>x.prompt);
   return result;
  });
  assert.deepEqual(taught.UD2.slice().sort(),['mitto','pono','duco','fero'].sort(),'UD2: verbos ajenos al programa');
  for(const [unit,count] of Object.entries({UD1:0,UD2:4,UD3:8,UD4:12,UD5:16,UD6:20,UD7:24,UD8:24,UD9:28,UD10:28}))
   assert.equal(taught[unit].length,count,'Error en los verbos explicados hasta '+unit);
  assert.deepEqual(taught.UD7,taught.UD8,'UD8 no introduce verbos');
  assert.deepEqual(taught.UD9,taught.UD10,'UD10 no introduce verbos');
  assert(!taught.UD7.includes('fligo')&&taught.UD9.includes('fligo'),
   'fligo solo es elegible a partir de la UD9');
  assert(taught.fligo.reviewRequired&&taught.fligo.derivatives.length===0,
   'No se deben inventar derivados de fligo');
  assert.equal(taught.fromFirstUnit.length,2,'UD2 debe generar dos verbos (3 y 2 derivados)');
  await page.evaluate(()=>{
   const ud6=units.indexOf('UD6');
   if(ud6<0)throw Error('No existe UD6 en Latín I');
   document.querySelectorAll('.unit-choice').forEach(el=>el.checked=Number(el.value)===ud6);
   selectedPhoneticRules.clear();selectedPhoneticRules.add('N07');selectedPhoneticRules.add('N17');generate();
  });
  const examLex=await page.evaluate(()=>({
   html:buildLatinLexQuestion('latin1',['UD6'])?.html||'',
   exam:[...document.querySelectorAll('#paper .lex-subquestion')].map(el=>({
    kind:el.dataset.lexKind,terms:[...el.querySelectorAll('i')].map(i=>i.textContent)
   })),
   phonetics:latinLexChosenRows('latin1','phonetics',['UD6'])
  }));
  assert.equal(examLex.exam.length,4,'Latín I: deben estar presentes las cuatro subpreguntas de léxico');
  assert.equal(examLex.exam.find(x=>x.kind==='preverbs').terms.length,2,
   'Modificación preverbial requiere dos verbos (3 + 2 derivados)');
  assert(examLex.exam.filter(x=>x.kind!=='preverbs').every(x=>x.terms.length===4),
   'Las demás subpreguntas deben tener cuatro formas');
  assert.equal((examLex.html.match(/<i>/g)||[]).length,14,'Deben imprimirse catorce términos en cursiva');
  assert(examLex.html.includes('(3) y de ')&&examLex.html.includes('(2). Cinco derivados'),
   'La modificación preverbial debe pedir primero tres derivados y después dos');
  assert(examLex.exam.every(x=>x.terms.every(term=>term===term.toLocaleLowerCase('es'))),
   'Hay palabras de léxico con mayúsculas');
  assert(examLex.phonetics.every(row=>row.normas.every(n=>['N07','N17'].includes(n))),
   'Evolución fonética incluye una norma aún no seleccionada');
  const before=examLex.exam.map(x=>({kind:x.kind,terms:x.terms.slice()}));
  const prefixEditor=()=>page.locator('[id^="lex-slot-prefixes-"]').allTextContents();
  const beforeSlots=await prefixEditor();
  await page.locator('#examQuestionSettings').evaluate(el=>el.open=true);
  await page.locator('#examQuestionMenus [data-question="lex"]').evaluate(el=>el.open=true);
  await page.locator('#lex-slot-prefixes-1 + button').click();
  const afterSlots=await prefixEditor();
  assert.notEqual(afterSlots[1],beforeSlots[1],'Regenerar una palabra no ha cambiado la forma elegida');
  assert.deepEqual(afterSlots.filter((_,i)=>i!==1),beforeSlots.filter((_,i)=>i!==1));
  const afterOne=await page.evaluate(()=>[...document.querySelectorAll('#paper .lex-subquestion')].map(x=>({
   kind:x.dataset.lexKind,terms:[...x.querySelectorAll('i')].map(i=>i.textContent)
  })));
  for(const old of before){
   const next=afterOne.find(x=>x.kind===old.kind);
   const expected=old.kind==='prefixes'?afterSlots.slice().sort((a,b)=>a.localeCompare(b,'es')):old.terms;
   assert.deepEqual(next.terms,expected,'Regenerar una palabra ha alterado términos ajenos o el orden alfabético');
  }
  await page.locator('#lex-slot-latinisms-0').locator('..').locator('..').getByRole('button',{name:'Regenerar las cuatro formas'}).click();
  const afterAll=await page.evaluate(()=>[...document.querySelector('#paper [data-lex-kind="latinisms"]').querySelectorAll('i')].map(x=>x.textContent));
  assert(afterAll.some((x,i)=>x!==before.find(x=>x.kind==='latinisms').terms[i]),
   'Regenerar subpregunta no ha sustituido las cuatro formas');
  const freeVerbs=await page.evaluate(()=>{
   const input=document.getElementById('lex-verb-0');
   input.value='VERBO_PERSONALIZADO';input.dispatchEvent(new Event('change',{bubbles:true}));
   const result=buildLatinLexQuestion('latin1',['UD6'])?.html||'';
   input.value='';input.dispatchEvent(new Event('change',{bubbles:true}));
   return result;
  });
  assert(freeVerbs.includes('<i>verbo_personalizado</i> (3)'),'El primer verbo manual debe aparecer en minúscula y con tres derivados');
  const preverbButtons=await page.evaluate(()=>({
    twoSlots:document.querySelectorAll('#lex-slot-preverbs-0, #lex-slot-preverbs-1').length,
    nonexistent:!!document.getElementById('lex-slot-preverbs-2'),
    inputs:[0,1].map(i=>!!document.getElementById('lex-verb-'+i)),
    thirdInput:!!document.getElementById('lex-verb-2')
  }));
  assert(preverbButtons.twoSlots===2&&!preverbButtons.nonexistent&&preverbButtons.inputs.every(Boolean)&&!preverbButtons.thirdInput,
   'El panel de modificación preverbial debe permitir modificar solo dos verbos');
  const morphExclusions=await page.evaluate(()=>{
    const forbidden=['Marcus, -i','Roma, -ae','romanus, -a, -um','graecus, -a, -um','Ἀθήνα','ῥωμαῖος'];
    const allowed=['puella, -ae','bonus, -a, -um','λύω'];
    return {forbidden:forbidden.map(isExcludedExamMorphLemma),
      allowed:allowed.map(isExcludedExamMorphLemma)};
  });
  assert(morphExclusions.forbidden.every(Boolean)&&morphExclusions.allowed.every(x=>!x),
   'El análisis morfológico no excluye correctamente nombres propios y gentilicios');
  const noRules=await page.evaluate(()=>{
   selectedPhoneticRules.clear();examSelectionCache.delete(examCacheSignature('lex-phonetics'));generate();
   return [...document.querySelectorAll('#paper [data-lex-kind="phonetics"]')].length;
  });
  assert.equal(noRules,0,'Se ha generado una evolución sin seleccionar normas');
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#pwaStatus')?.textContent.includes('Preparada'),null,{timeout:30000});
  const cache=await page.evaluate(async()=>{
   const reg=await navigator.serviceWorker.ready;
   const keys=await caches.keys();
   const storage=await caches.open(keys.find(k=>k.startsWith('examina-pwa-')));
   const paths=['index.html','offline.html','pwa.js','exam-scoring.js','offline-lemmas.js','verification-review.js',
    'data/unimorph/lat-v.json','data/lemmas/teacher-forms.json',
    'data/latinismos-docente.json','data/prefijos-docente.json','data/modificacion-preverbial-docente.json',
    'data/modificacion-preverbial-unidades-lat1.json','data/lat4-progresion-lexico.json',
    'data/fonetica/banco_examenes.json','data/fonetica/lat1-programacion.json',
    'manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
   return {scope:reg.scope,keys,entries:await Promise.all(paths.map(async p=>({
    path:p,stored:!!await storage.match(new URL(p,reg.scope).href)
   })))};
  });
  assert.equal(cache.scope,origin+PREFIX);
  assert(cache.entries.every(x=>x.stored),'Precache incompleta: '+JSON.stringify(cache.entries));
  const firstVersion=cache.keys.find(k=>k.startsWith('examina-pwa-'));
  assert(firstVersion?.includes('test-one'));
  // El documento es la misma aplicación en línea y sin conexión.
  // Las opciones de cabecera actualizan los selectores nativos ocultos.
  await page.locator('#exam-header-controls fieldset:nth-child(1) button[data-value="latin1"]').click();
  await page.locator('#exam-header-controls fieldset:nth-child(2) button[data-value="tablas"]').click();
  assert.deepEqual(await page.evaluate(()=>[document.getElementById('course').value,document.getElementById('model').value]),['latin1','tablas'],
   'Los botones de cabecera no sincronizan asignatura y modelo');
  await page.evaluate(()=>{generate();document.getElementById('saveDraft').click()});
  const storedDraft=await page.evaluate(()=>Object.keys(localStorage)
   .find(key=>key.toLowerCase().includes('draft')||key.toLowerCase().includes('borrador')));
  assert(storedDraft,'El borrador no se ha guardado en el navegador');
  await context.setOffline(true);
  await page.reload({waitUntil:'load'});
  assert(await page.locator('#paper .exam-sheet').count()>0,'La vista previa no se carga sin red');
  await page.locator('#pwaStatus').waitFor({state:'visible'});
  assert.match(await page.locator('#pwaStatus').innerText(),/Sin conexión/);
  assert(await page.evaluate(key=>!!localStorage.getItem(key),storedDraft),
   'El borrador local se ha perdido tras recargar offline');
  await page.evaluate(()=>document.getElementById('restoreDraft').click());
  assert(await page.locator('#paper .exam-sheet').count()>0,
   'No se recupera el examen guardado sin red');
  await page.waitForFunction(()=>!!window.ExaminaOfflineLemmatizer.currentData());
  const offlineGloss=await page.evaluate(()=>{
   const bank=latinSharedBank.vocabulary('latin1');
   const gloss=analyzeExamVocabulary('In villa puellaque. Quoque quisque uterque. Formadesconocidaxyz.',
    'latin1',bank);
   return gloss.map(({form,lemma,status})=>({form,lemma,status}));
  });
  for(const lemma of ['in','puella','-que','quoque','quisque','uterque']){
   assert(offlineGloss.some(row=>row.lemma===lemma&&row.status==='documented'),'Falta en el glosario offline: '+lemma);
  }
  assert(offlineGloss.some(row=>row.form==='Formadesconocidaxyz'&&row.status==='unknown'));
  const latin=await page.evaluate(async()=>{
   const response=await fetch('data/unimorph/lat-v.json');
   return {status:response.status,length:(await response.json()).rows.length};
  });
  assert(latin.status===200&&latin.length===16988,'No funciona el banco latino offline');
  await page.locator('#offlineLemmaPanel').waitFor({state:'attached'});
  await page.evaluate(()=>{const d=document.getElementById('offlineLemmaPanel').closest('details');if(d)d.open=true});
  await page.selectOption('#offlineLemmaCourse','gr1');
  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('λύω');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor({timeout:30000});
  assert(await page.locator('#offlineLemmaResults .lemma-entry').count()>=5,
   'Faltan las flexiones griegas offline');
  assert(requests.every(url=>url.startsWith(origin+PREFIX)),
   'La PWA contactó un servidor externo: '+JSON.stringify(requests));
  // Regresar online y simular publicación nueva: la app antigua no se recarga.
  await context.setOffline(false);
  release='test-two';
  await page.evaluate(()=>{window.__borradorSinGuardar=77});
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update()});
  await page.locator('#pwaUpdate').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.evaluate(()=>window.__borradorSinGuardar),77,
   'Se recargó la página sin autorización al detectar la actualización');
  await page.click('#pwaUpdate');
  await page.locator('#pwaReload').waitFor({state:'visible',timeout:45000});
  assert.equal(await page.evaluate(()=>window.__borradorSinGuardar),77,
   'Se perdió una edición manual al activar el nuevo SW');
  // controllerchange puede notificarse antes de que activate termine su
  // limpieza asíncrona; esperar la eliminación efectiva de la caché antigua.
  let keys=[];
  for(let attempt=0;attempt<50;attempt++){
   keys=await page.evaluate(async()=>await caches.keys());
   if(keys.some(k=>k.includes('test-two'))&&!keys.some(k=>k.includes('test-one')))break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  const worker=await page.evaluate(async()=>{
   const reg=await navigator.serviceWorker.getRegistration();
   return {active:reg.active?.state,waiting:reg.waiting?.state,controller:navigator.serviceWorker.controller?.state};
  });
  assert(keys.length===1&&keys[0].includes('test-two'),
   'Las cachés no se actualizaron de forma atómica: '+JSON.stringify({keys,worker}));
  await context.setOffline(true);
  await page.reload();
  assert(await page.locator('#paper .exam-sheet').count()>0,'La nueva versión no funciona offline');
  assert.deepEqual(errors,[],'Errores JavaScript en la PWA');
  console.log('OK PWA: instalación, 9 recursos precargados, latín/griego sin Internet, borradores y actualización voluntaria.');
  await context.close();
 }finally{await browser.close()}
})().finally(()=>server.close()).catch(err=>{console.error(err);process.exitCode=1});
