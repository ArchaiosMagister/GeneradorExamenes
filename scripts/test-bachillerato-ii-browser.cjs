const assert=require('node:assert/strict'),fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer(async(req,res)=>{
 if(req.url!=='/offline.html'){res.writeHead(404).end();return}
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(await fs.readFile(root+'/offline.html'));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
 try{
  const page=await browser.newPage();page.setDefaultTimeout(60000);
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push(r.url()));
  await page.route('**/*',route=>route.request().url()===origin+'/offline.html'?route.continue():route.abort());
  await page.goto(origin+'/offline.html');
  // La entrega autónoma se sirve por HTTP únicamente para sortear la política
  // del entorno de pruebas que bloquea file://; no se permite ningún recurso adicional.
  await page.waitForFunction(()=>!!window.ExaminaVocabulary&&!!window.ExaminaBachilleratoII);
  const common=await page.evaluate(async()=>{
   const data=await window.ExaminaOfflineLemmatizer.load();
   return window.ExaminaBachilleratoII.commonEntries.map(word=>{
    const query=window.ExaminaOfflineLemmatizer.query(data,{course:word.lang==='lat'?'lat1':'gr1',text:word.lemma});
    const row=window.ExaminaVocabulary.analyze(data,word.lemma,word.lang==='lat'?'lat2':'gr2',[])[0];
    return {lemma:word.lemma,found:query.total,status:row.status,meaning:row.meaning,va:row.meaning_va};
   });
  });
  assert.equal(common.length,40);assert(common.every(x=>x.found===1&&x.status==='documented'&&x.meaning&&x.va));
  await page.locator('#vgShow').click();
  await page.evaluate(()=>{
   document.getElementById('vgQualityPanel').open=true;
   const select=document.getElementById('vgCourse');select.value='gr2';select.dispatchEvent(new Event('change'));
  });
  await page.locator('#vgText').fill('ἐφιλοτεχνείτην κἀγὼ πείσεσθαι Λεξιξυζω');
  await page.locator('#vgAnalyzeAll').click({force:true});
  await page.waitForFunction(()=>!document.getElementById('vgAnalyzeAll').disabled);
  const content=(await page.locator('#vgResults').textContent()).normalize('NFC');
  assert.match(content,/φιλοτεχνέω/);assert.match(content,/καὶ ἐγώ/);assert.match(content,/Λεξιξυζω/);
  assert.match(content,/πείθω/);assert.match(content,/πάσχω/);
  await page.reload();
  await page.locator('#vgShow').click();
  assert.equal(await page.locator('#vgCourse').inputValue(),'gr2','El curso persiste');
  assert.match(await page.locator('#vgText').inputValue(),/ἐφιλοτεχνείτην/);
  await page.evaluate(()=>document.getElementById('vgQualityPanel').open=true);
  await page.locator('#vgQualityRefresh').click({force:true});
  assert.match(await page.locator('#vgQualityTotals').textContent(),/530 fichas/);
  // Exportación real de Word con alternativas todavía señaladas como pendientes.
  const project={course:'gr2',lang:'es',count:1,wordAlternatives:true,units:[{
   title:'Platón · prueba',text:'ἐφιλοτεχνείτην κἀγὼ',mode:'complete',rows:[],analyzed:false}]};
  await page.locator('#vgImport').setInputFiles({name:'proyecto-griego-ii.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#vgWord').click({force:true});
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'vocabulario-unidades.docx');
  const target='/tmp/bachillerato-ii-browser.docx';await download.saveAs(target);
  const {execFileSync}=require('node:child_process');
  const xml=execFileSync('python',['-c',"import zipfile;print(zipfile.ZipFile('/tmp/bachillerato-ii-browser.docx').read('word/document.xml').decode())"],{encoding:'utf8'});
  assert.match(xml,/Griego II/);assert.match(xml,/φιλοτεχνέω/);assert.match(xml,/Pendientes de revisión/);assert.doesNotMatch(xml,/<w:i\/>/);
  await page.locator('#vgCourse').selectOption('lat2');
  await page.locator('#vgText').fill('quaestorem adgressus est');
  await page.locator('#vgAnalyzeAll').click({force:true});
  await page.waitForFunction(()=>!document.getElementById('vgAnalyzeAll').disabled);
  const latin=await page.locator('#vgResults').textContent();assert.match(latin,/quaestor/);assert.match(latin,/aggredior/);
  assert.deepEqual(errors,[],'Errores JavaScript');
  assert(requests.every(url=>url===origin+'/offline.html'||url.startsWith(origin+'/data/unimorph/')),
   'Petición inesperada: '+JSON.stringify(requests));
  // Los intentos de cargar índices opcionales del laboratorio antiguo están
  // bloqueados por la ruta: la prueba completa debe funcionar igualmente.
  console.log('Bachillerato II en navegador: HTML autónomo sin recursos externos, cursos, persistencia, revisión, importación y Word real correctos.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
