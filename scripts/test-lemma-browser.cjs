// Test of the exact self-contained offline.html in Chromium WITHOUT network.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{
   if(/^https?:/i.test(request.url()))requests.push(request.url());
  });
  await page.goto(pathToFileURL(path.resolve(__dirname,'../offline.html')).href,{waitUntil:'load'});
  await page.locator('#offlineLemmaPanel').waitFor({state:'attached'});
  await page.locator('#offlineLemmaPanel').evaluate(el=>{
   const details=el.closest('details');if(details)details.open=true;
  });
  await page.selectOption('#offlineLemmaCourse','lat1');
  await page.locator('#offlineLemmaCoverage').filter({hasText:/\b66[4-9] lemas\b|\b6[7-9]\d lemas\b|\b[7-9]\d\d lemas\b/}).waitFor();
  assert.match(await page.locator('#offlineLemmaCoverage').textContent(),/formas candidatas/);
  await page.locator('#offlineLemmaPanel details.lemma-units').evaluate(el=>el.open=true);
  assert.ok(await page.locator('#offlineLemmaByUnit tbody tr').count()>=8,'Falta la cobertura por unidades latinas');
  assert.match(await page.locator('#offlineLemmaByUnit').textContent(),/Con formas documentadas/);
  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('amo');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor();
  assert.match(await page.locator('#offlineLemmaStatus').textContent(),/registros/);
  assert.ok(await page.locator('#offlineLemmaResults .lemma-entry').count()>=5,'No se muestran flexiones latinas');
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/amo/);

  // El apartado de revisión no debe interferir con el lematizador ni reclamar que
  // sus decisiones se apliquen directamente a las soluciones del examen.
  await page.locator('#morphTeacherReview').waitFor({state:'attached'});
  await page.locator('#morphTeacherReview > details').evaluate(el=>el.open=true);
  await page.locator('#reviewSummary').filter({hasText:/incidencias detectadas/}).waitFor();
  await page.selectOption('#reviewKind','candidatas');
  assert.ok(await page.locator('#reviewItems .review-item').count()>0,'Faltan candidatas latinas pendientes');
  await page.selectOption('#reviewCourse','gr1');
  await page.locator('#reviewSummary').filter({hasText:/incidencias detectadas/}).waitFor();
  await page.selectOption('#reviewKind','variantes');
  assert.match(await page.locator('#reviewItems').textContent(),/παῖς/);
  assert.match(await page.locator('#morphTeacherReview').textContent(),/ni altera las soluciones/i);
  await page.selectOption('#reviewKind','');

  // Lematización inversa: forma flexionada → lema y sus análisis.
  await page.selectOption('#offlineLemmaMode','form');
  await page.locator('#offlineLemmaInput').fill('amabam');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor();
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/amo/);
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/imperfecto/i);

  // Modelo provisional: sirve para consultar, pero nunca sustituye una forma contrastada.
  await page.selectOption('#offlineLemmaCourse','lat1');
  await page.selectOption('#offlineLemmaMode','form');
  await page.locator('#offlineLemmaInput').fill('appropinquabas');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor();
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/Collatinus|propuesta sin verificar/,
   'Se conserva el origen de la propuesta y del análisis contrastado');
  // Propuestas de tercera declinación completas solo en las casillas seguras.
  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('dux');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-provisional').first().waitFor();
  assert.ok(await page.locator('#offlineLemmaResults .lemma-provisional').count()>=10,
   'Faltan propuestas de tercera declinación para dux, ducis');
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/ducem/);
  assert.doesNotMatch(await page.locator('#offlineLemmaResults').textContent(),/N;GEN;PL/,
   'No debe inferirse el genitivo plural de un tema incierto');
  // Un lema griego sin formas queda localizable como entrada, sin inventar acentos.
  await page.selectOption('#offlineLemmaCourse','gr1');
  await page.locator('#offlineLemmaCoverage').filter({hasText:/\b(?:3[4-9]\d|[4-9]\d\d) lemas\b/}).waitFor();
  assert.ok(await page.locator('#offlineLemmaByUnit tbody tr').count()>=5,'Faltan las unidades agrupadas de griego');
  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('λύω');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor();
  assert.ok(await page.locator('#offlineLemmaResults .lemma-entry').count()>=5,'No se muestran flexiones griegas');
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/λύ/);

  await page.selectOption('#offlineLemmaMode','lemma');
  await page.locator('#offlineLemmaInput').fill('ἀδελφός');
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-entry').first().waitFor();
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/ἀδελφ/,
   'La entrada debe encontrarse, aunque cambie la cobertura flexiva gracias a Eulexis');

  // Consulta de una flexión griega nominal conservada con acento de Wikcionario,
  // pero sin pasar al solucionario ni al glosario automático.
  const greekCandidate=await page.evaluate(async()=>{
   const d=await window.ExaminaOfflineLemmatizer.load();
   return d.rows.grc.find(x=>x[3]===4)?.[1]||null;
  });
  assert.ok(greekCandidate,'No hay ninguna candidata griega nominal en el archivo autónomo');
  await page.selectOption('#offlineLemmaCourse','gr1');
  await page.selectOption('#offlineLemmaMode','form');
  await page.locator('#offlineLemmaInput').fill(greekCandidate);
  await page.locator('#offlineLemmaSearch').click();
  await page.locator('#offlineLemmaResults .lemma-provisional').first().waitFor();
  assert.match(await page.locator('#offlineLemmaResults').textContent(),/Wikcionario · forma griega candidata sin verificar/);

  await page.selectOption('#offlineLemmaMode','form');
  await page.locator('#offlineLemmaInput').fill('palabra-inexistente');
  await page.locator('#offlineLemmaSearch').click();
  assert.match(await page.locator('#offlineLemmaStatus').textContent(),/No hay un análisis registrado/);
  assert.equal(await page.locator('#offlineLemmaResults .lemma-entry').count(),0);

  assert.deepEqual(errors,[],'Errores JavaScript en página autónoma');
  assert.deepEqual(requests,[],'Un documento offline no debe contactar servidores: '+requests.join(', '));
  console.log('Chromium offline: latín, griego, sin resultados y cero solicitudes de red.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
