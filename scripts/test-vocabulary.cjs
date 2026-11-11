const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
for(const file of ['offline-lemmas.js','vocabulary-generator.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const api=ctx.window.ExaminaVocabulary,data=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json')));
const bank=[{entry:'amo, amavi, amatum (1ª)',meaning:'MI TRADUCCIÓN'}];
const rows=api.analyze(data,'Amo amo amamus xyzxyz','lat1',bank);
assert.equal(rows.length,3);assert.equal(rows.find(r=>r.form==='xyzxyz').status,'unknown');
assert.equal(rows.find(r=>r.form==='amamus').meaning,'MI TRADUCCIÓN');
assert.equal(api.entries(rows).length,2);
assert.equal(api.displayEntry(bank[0].entry,'simple'),'amo (1ª)');
assert.equal(api.displayEntry('amo','complete'),'amo');
assert.equal(api.displayEntry('λύω','simple'),'λύω');
const fixture={rows:{lat:[['amo','test','V',0],['bellum','test','N',2]]},vocabulary:{lat:data.vocabulary.lat}};
const ambiguous=api.analyze(fixture,'test','lat1',[])[0];assert.equal(ambiguous.status,'review');
const project={course:'lat1',lang:'es',count:2,units:[1,2].map(i=>({title:'UD'+i,mode:'complete',rows}))};
const xml=api.documentXml(project);
assert.equal((xml.match(/MI TRADUCCIÓN/g)||[]).length,2);
assert.equal((xml.match(/<w:sectPr>/g)||[]).length,1,'El documento utiliza una sola sección');
assert.equal((xml.match(/<w:cols w:num="1"/g)||[]).length,1,'Una sola columna');
assert.doesNotMatch(xml,/<w:cols w:num="2"/,'Sin columnas dobles');
assert.match(xml,/Vocabulario por unidades de Latín I/);
assert.match(xml,/<w:smallCaps\/><w:rFonts[^>]+><w:sz w:val="28"/);
assert.match(xml,/<w:top w:val="single" w:sz="4"/,'Borde del título de 0,5 pt');
assert.match(xml,/<w:i\/>[^]*amo, amavi, amatum/,'Enunciado latino en cursiva');
// El enunciado latino conserva la cursiva, pero cualquier paréntesis es redonda.
const formatProject={course:'lat1',lang:'es',count:1,units:[{
 title:'UD1',mode:'complete',rows:[
 {form:'ad',entry:'ad (prep. + ac.)',meaning:'a, hacia',status:'documented'},
 {form:'agricola',entry:'agricola, –æ (m.)',meaning:'campesino',status:'documented'},
 {form:'amo',entry:'amo, amavi, amatum (1ª)',meaning:'amar',status:'documented'},
 {form:'castra',entry:'castra, –orum (sólo pl.)',meaning:'campamento',status:'documented'},
 {form:'rex',entry:'rex, regis (m.)',meaning:'rey',status:'documented'},
 {form:'pendiente',entry:'pendiente (v.)',meaning:'',status:'review'}
]}]};
const wordFormat=api.documentXml(formatProject);
const runs=[...wordFormat.matchAll(/<w:r>(.*?)<\/w:r>/gs)].map(m=>({
 text:(m[1].match(/<w:t xml:space="preserve">([^<]*)<\/w:t>/)||[])[1]||'',
 italic:m[1].includes('<w:i/>')
}));
function runsWith(text){return runs.filter(r=>r.text.includes(text))}
for(const citation of ['ad ','agricola, –æ ','amo, amavi, amatum ','castra, –orum ','rex, regis '])
 assert.ok(runsWith(citation).some(r=>r.italic),'Falta cursiva en '+citation);
for(const note of ['(prep. + ac.)','(m.)','(1ª)','(sólo pl.)','(v.)'])
 assert.ok(runsWith(note).some(r=>!r.italic),'Debe ir en redonda '+note);
assert.ok(!runs.some(r=>/\([^)]*\)/.test(r.text)&&r.italic),'Algún paréntesis latino conserva cursiva');
const simpleProject={...formatProject,units:[{...formatProject.units[0],mode:'simple'}]};
const simpleRuns=[...api.documentXml(simpleProject).matchAll(/<w:r>(.*?)<\/w:r>/gs)]
 .map(m=>({text:(m[1].match(/<w:t xml:space="preserve">([^<]*)<\/w:t>/)||[])[1]||'',italic:m[1].includes('<w:i/>')}));
assert.ok(simpleRuns.some(r=>r.text==='amo '&&r.italic));
assert.ok(simpleRuns.some(r=>r.text==='(1ª)'&&!r.italic));

assert.match(xml,/<w:sectPr><w:pgSz[^]*<w:cols w:num="1"[^]*<\/w:body>/);
assert.match(xml,/<w:t xml:space="preserve">\* <\/w:t>/);assert.match(xml,/xyzxyz/);
const fromEulexis={course:'gr1',lang:'es',count:1,units:[{
 title:'UD1',mode:'complete',rows:[{
  form:'θεοῦ',lemma:'θεός',entry:'θεός, –οῦ (ὁ)',meaning:'dios',
  candidates:[],status:'manual',eulexisUnverified:true
 }]
}]};
const greekDocx=api.documentXml(fromEulexis);
assert.match(greekDocx,/Pendientes de revisión \(\*\)/,
 'La elección de Eulexis no certifica una flexión griega');
assert.match(greekDocx,/<w:t xml:space="preserve">\* θεός/,
 'La lectura de Eulexis conserva asterisco de revisión');

assert.throws(()=>api.documentXml({count:1,units:[{title:'UD1',text:'ὁ θεός',rows:[]}]}),/sin analizar/);
const greekRows=api.analyze(data,'λύω ἄγνωστον','gr1',[]);
assert.equal(greekRows.length,2);
assert.equal(greekRows[1].form,'ἄγνωστον','se deben conservar los diacríticos griegos originales');

const priorityBank=[
 {entry:'Ἀθηναῖος, –α, –ον',meaning:'ateniense'},
 {entry:'δοῦλος, –ου',meaning:'esclavo'},
 {entry:'θέος, –ου',meaning:'dios'},
 {entry:'γράφω',meaning:'escribir'},
 {entry:'εἰμί',meaning:'ser, estar, haber'},
 {entry:'οὐ, οὐκ, οὐχ (adv.)',meaning:'no'}
];
const priority=api.analyze(data,'Ἀθηναῖοι Ἀθηναίων οἱ δοῦλοι γράφει εἰσιν θεοὶ οὐκ','gr1',priorityBank);
for(const token of ['Ἀθηναῖοι','Ἀθηναίων','οἱ','δοῦλοι','γράφει','εἰσιν','θεοὶ','οὐκ']){
 const found=priority.find(r=>r.form===token);
 assert.ok(found,'Falta la palabra prioritaria '+token);
 assert.equal(found.status,'documented','No lematizada: '+token+' -> '+JSON.stringify(found.candidates));
 assert.ok(found.meaning,'Falta la traducción: '+token);
}
assert.equal(priority.find(r=>r.form==='Ἀθηναῖοι').entry,'Ἀθηναῖος, –α, –ον');
assert.equal(priority.find(r=>r.form==='Ἀθηναῖοι').meaning,'ateniense');
const frequentGreek=api.analyze(data,'ἡ ἐν εἰς μὲν πολλοὺς οὗτοι μαθήτας ἀλλὰ','gr1',priorityBank);
for(const token of ['ἡ','ἐν','εἰς','μὲν','πολλοὺς','οὗτοι','ἀλλὰ']){
 const found=frequentGreek.find(r=>r.form===token);
 assert.equal(found?.status,'documented','La forma frecuente debería quedar reconocida: '+token);
 assert.ok(found.meaning,'Falta traducción de '+token);
}


const contrast=api.analyze(data,'τίς τις ὁ ὅ οἱ οἵ ἀλλὰ ἄλλα','gr1',priorityBank);
for(const token of ['τίς','τις','ὁ','ὅ','οἱ','οἵ','ἀλλὰ','ἄλλα'])
 assert.ok(contrast.some(r=>r.form===token),'No conservar homógrafo griego: '+token);
assert.equal(contrast.find(r=>r.form==='τίς')?.status,'documented');
assert.equal(contrast.find(r=>r.form==='τις')?.status,'documented');
assert.equal(contrast.find(r=>r.form==='ὁ')?.status,'documented');
assert.equal(contrast.find(r=>r.form==='ὅ')?.status,'documented');

// El interrogativo mantiene siempre el agudo en la primera sílaba.
 // El indefinido enclítico admite ausencia de acento y acento final,
 // incluso grave ante la palabra siguiente (Smyth §334).
const indefiniteVariants=['τὶ','τινας','τινι','τινος','τισὶ',
 'τινά','τινὰ','τινάς','τινὰς','τινός','τινὸς','τινί','τινὶ',
 'τινές','τινὲς','τινῶν','τινων','τισί','τισίν','τισὶν','τισιν'];
const interrogativeVariants=['τί','τίνα','τίνας','τίνος','τίνι','τίνες','τίνων','τίσι','τίσιν'];
for(const form of indefiniteVariants){
 const found=api.analyze(data,form,'gr1',priorityBank)[0];
 assert.equal(found?.status,'documented','Indefinido no reconocido: '+form+' '+JSON.stringify(found?.candidates));
 assert.equal(found.entry,'τις, τι (pron. indef.)','Confusión con el interrogativo: '+form);
}
for(const form of interrogativeVariants){
 const found=api.analyze(data,form,'gr1',priorityBank)[0];
 assert.equal(found?.status,'documented','Interrogativo no reconocido: '+form);
 assert.equal(found.entry,'τίς, τί (pron. interr.)','Confusión con el indefinido: '+form);
}
const apart=api.analyze(data,'τὶ τί τινας τίνας τινος τίνος τισὶ τίσι','gr1',priorityBank);
assert.equal(apart.length,8,'El tokenizador no debe fundir grafías diferentes');
assert.notEqual(apart.find(r=>r.form==='τὶ').entry,apart.find(r=>r.form==='τί').entry);
assert.notEqual(apart.find(r=>r.form==='τινος').entry,apart.find(r=>r.form==='τίνος').entry);
// Otros pares sensibles al acento no deben sufrir regresiones.
const otherAccents=api.analyze(data,'οἱ οἵ ἡ ἥ ἀλλὰ ἄλλα','gr1',priorityBank);
assert.equal(otherAccents.find(r=>r.form==='οἱ')?.status,'documented');
assert.equal(otherAccents.find(r=>r.form==='ἡ')?.status,'documented');

const demosthenesTypo=api.analyze(data,'Δημοσθήνης','gr1',priorityBank)[0];
assert.equal(demosthenesTypo.status,'review','El nombre propio con acento incorrecto debe revisarse');
assert.match(demosthenesTypo.warning,/Δημοσθένης/,'Debe mostrarse la forma correcta sin modificar los textos');
// Four individually checked forms recovered from corrected unit texts.
 // This changes runtime recognition only, not the verified morphology index.
const revisedUnitForms=api.analyze(data,'εἶχεν ἔφυγεν σωτηρίας ἑώρα','gr1',priorityBank);
for(const [form,head] of [['εἶχεν','ἔχω'],['ἔφυγεν','φεύγω'],
 ['σωτηρίας','σωτηρία'],['ἑώρα','ὁράω']]){
 const row=revisedUnitForms.find(x=>x.form===form);
 assert.equal(row?.status,'documented','Forma correcta no reconocida: '+form);
 assert.ok(row.entry,'Falta enunciado para '+form);
 assert.equal(ctx.window.ExaminaOfflineLemmatizer.normalize(row.lemma),
  ctx.window.ExaminaOfflineLemmatizer.normalize(head),
  'Lema inesperado para '+form);
}
assert.equal(data.extensions.greek_editorial_decisions.verifiedFormsAdded,0,
 'La mejora del generador no certifica paradigmas en el índice persistente');

const misspelled=api.analyze(data,'ἄνρωπος','gr1',priorityBank);
assert.equal(misspelled[0].status,'review','La errata debe quedar señalada, no aceptada');
assert.match(misspelled[0].warning,/ἄνθρωπος/);
for(const typo of ['στρατεγός','Περίκλους','σωτερίας','Aἰσχύλος']){
 const row=api.analyze(data,typo,'gr1',priorityBank)[0];
 assert.equal(row.status,'review','No aceptar automáticamente la errata: '+typo);
 assert.match(row.warning,/Posible errata/,'Falta sugerencia para '+typo);
}

const newVerbs=api.analyze(data,'ἐπαίδευσαν ἔπλευσαν ἐπεπυρεύκεσαν ἅπερ','gr1',priorityBank);
for(const form of ['ἐπαίδευσαν','ἔπλευσαν','ἐπεπυρεύκεσαν','ἅπερ'])
 assert.equal(newVerbs.find(r=>r.form===form)?.status,'documented','Forma griega contrastada '+form);

assert.notEqual(misspelled[0].status,'documented','No corregir silenciosamente errores ortográficos');
console.log('Griego prioritario: ateniense, nominales, presente, artículo y formas de εἰμί reconocidos.');

// La desambiguación griega se basa en la grafía y el acento exactos.
const accentRows=api.analyze(data,'ἤ ἡ ὤν ὧν οὐ οὗ ἦν ἥν τινα τινες μάχῃ ψυχὴν','gr1',priorityBank);
const exact=(w)=>accentRows.find(r=>r.form===w);
for(const w of ['ἤ','ἡ','ὤν','οὐ','οὗ','ἦν','ἥν','τινα','τινες','μάχῃ','ψυχὴν']){
 assert.equal(exact(w)?.status,'documented','No resuelta la grafía exacta '+w+': '+JSON.stringify(exact(w)?.candidates));
}
assert.notEqual(exact('ἤ')?.entry,exact('ἡ')?.entry);
assert.ok(exact('ἤ')?.meaning,'Debe conservar la traducción de ἤ del banco docente');
for(const typo of ['εἴς','θάλάττῃ','στρατεγός','ἄνρωπος']){
 const row=api.analyze(data,typo,'gr1',priorityBank)[0];
 assert.equal(row.status,'review','Una grafía anómala no debe aceptarse en silencio: '+typo);
 assert.match(row.warning,/Posible errata/);
}

const originalHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bankStart=originalHTML.indexOf('let vocab=')+10;
const sourceBank=JSON.parse(originalHTML.slice(bankStart,originalHTML.indexOf(';',bankStart)));
for(const m of originalHTML.matchAll(/vocab\.push\(\.\.\.(\[.*\])\);/g))sourceBank.push(...JSON.parse(m[1]));
const GreekBank=sourceBank.filter(x=>x.course==='greek1');
const priorityFixture=JSON.parse(fs.readFileSync(path.join(root,'tests/greek-priority-forms.json'),'utf8'));
assert.equal(priorityFixture.units.length,14);
const originals=[...new Set(priorityFixture.units.flatMap(u=>u.forms))];
const benchmark=api.analyze(data,originals.join('\n'),'gr1',GreekBank);
const success=benchmark.filter(r=>r.status==='documented');
const review=benchmark.filter(r=>r.status==='review');
const unknown=benchmark.filter(r=>r.status==='unknown');
const remainingEditorialForms=[
 'εἴς','στρατεγός','στρατεγὸς','θάλάττῃ','oἱ','ἄνρωπος',
 'εἷχεν','ἐφεύξεν','οἰκῦσιν','Περίκλους','στρατεγοὶ',
 'σωτερίας','ὠρᾶ','Aἰσχύλος'
];
assert.equal(benchmark.find(r=>r.form==='ὅδε')?.status,'documented',
 'El demostrativo ὅδε debe tener un único lema');
assert.ok(review.length<=40,
 'El índice Eulexis debe resolver la mayoría de formas sin ocultar homografías: '+
 JSON.stringify(review.map(r=>({form:r.form,candidates:r.candidates.map(c=>c.entry)}))));
for(const row of review){
 if(remainingEditorialForms.includes(row.form)||row.warning){
  assert.match(row.warning,/Posible errata/,
   'La errata original sigue requiriendo revisión: '+row.form);
 }else{
  assert.ok(new Set(row.candidates.map(c=>c.lemma)).size>1,
   'Una lectura no errónea no debería quedar en revisión sin al menos dos lemas: '+row.form);
 }
}

assert.ok(success.some(r=>r.meaning==='ateniense'), 'Debe identificar ateniense usando el banco propio');
assert.ok(success.length>100,'El corpus prioritario sigue sin cobertura nominal básica');
// El corpus original de 14 unidades se conserva sin reescribir:
 // las grafías descartadas en la revisión filológica no pueden rehabilitarse
 // como «documentadas» únicamente para conseguir un test verde.
const knownSuperseded=new Set(['Δημοσθήνης','θέᾳ']);
assert.ok(unknown.every(x=>knownSuperseded.has(x.form)),
 'Hay formas nuevas sin lematizar fuera de las grafías ya descartadas: '+
 JSON.stringify(unknown.map(x=>x.form)));
console.log('Formas del corpus antiguo aún pendientes de corrección textual:',
 JSON.stringify(unknown.map(x=>x.form)));
console.log('Corpus docente Griego I / pendientes anteriores:',JSON.stringify({
 total:originals.length,formasDistintasNormalizadas:benchmark.length,
 reconocidas:success.length,revision:review.length,desconocidas:unknown.length
}));
const normGreek=s=>s.toLowerCase().normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ');
const occ=new Map();
for(const u of priorityFixture.units)for(const form of u.forms){
 const k=normGreek(form);occ.set(k,(occ.get(k)||0)+1);
}
const topPending=rows=>rows.map(r=>({form:r.form,frecuencia:occ.get(normGreek(r.form))||0}))
 .sort((a,b)=>b.frecuencia-a.frecuencia||a.form.localeCompare(b.form,'el')).slice(0,280);
console.log('Pendientes restantes prioritarios sin índice:',JSON.stringify(topPending(unknown)));
console.log('Pendientes con lecturas alternativas:',JSON.stringify(topPending(review)));


console.log('Vocabulario: prioridad docente, deduplicación por UD, ambigüedad, desconocidas, griego y XML de dos columnas correctos.');
(async()=>{
 const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
 const page=await browser.newPage({acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+root+'/offline.html');await page.click('#vgShow');
 await page.click('#vgQualityPanel summary');
 await page.click('#vgQualityRefresh');
 await page.waitForFunction(()=>document.getElementById('vgQualityTotals').textContent.includes('Fichas:'));
 assert.ok(await page.locator('#vgQualityRows tr').count()>4,'Deben presentarse varias unidades');
 assert.match(await page.locator('#vgQualityQueueSummary').innerText(),/fichas requieren contraste/);
 const qualityDownload=page.waitForEvent('download');await page.click('#vgQualityExport');
 const qualityFile=await qualityDownload;
 const qualityJSON=JSON.parse(fs.readFileSync(await qualityFile.path(),'utf8'));
 assert.equal(qualityJSON.course,'lat1');
 assert.equal(qualityJSON.totals.rows,1106);
 console.log('Panel de cobertura por UD, filtro de pendientes y exportación JSON operativos.');
 const analyzeAll=page.locator('#vgAnalyzeAll');
 assert.equal(await analyzeAll.innerText(),'Analizar todas las unidades');
 assert.ok(await analyzeAll.evaluate(el=>!!el.previousElementSibling?.querySelector('#vgMode')));
 assert.equal(await analyzeAll.evaluate(el=>getComputedStyle(el).fontWeight),'800');

 // Prueba real de interfaz: diez frases escolares, incluida la preposición «ab».
 const latinCorpus=JSON.parse(fs.readFileSync(path.join(root,'tests/latin-vocabulary-sentences.json'),'utf8')).sentences;
 await page.fill('#vgText',latinCorpus.join('\n'));
 await page.click('#vgAnalyze');
 await page.waitForFunction(()=>document.querySelector('#vgStatus')?.textContent.includes('pendientes'));
 const vocabularyPreview=await page.locator('#vgResults').innerText();
 assert.match(vocabularyPreview,/ab · Forma documentada/,'La UI debe reconocer ab sin revisión');
 assert.match(vocabularyPreview,/puella/i,'La UI debe identificar los lemas del texto');
 const sampleDownload=page.waitForEvent('download');await page.click('#vgWord');
 const sample=await sampleDownload;const samplePath=await sample.path();
 fs.mkdirSync(path.join(root,'test-artifacts'),{recursive:true});
 fs.copyFileSync(samplePath,path.join(root,'test-artifacts/vocabulario-latin-10-frases.docx'));
 console.log('Word real de diez frases guardado para revisión visual.');
 await page.fill('#vgText','');
 await page.fill('#vgCount','2');await page.locator('#vgCount').dispatchEvent('change');
 await page.fill('#vgText','Puella puella amamus xyzxyz');await page.click('#vgAnalyze');await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('pendientes'));
 assert.match(await page.locator('#vgResults').innerText(),/xyzxyz/);
 await page.selectOption('#vgMode','simple');await page.locator('#vgUnitButtons .vg-unit-button').nth(1).click();assert.equal(await page.inputValue('#vgText'),'');
 await page.fill('#vgText','Puella');await page.click('#vgAnalyzeAll');await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('pendientes'));
 await page.locator('#vgUnitButtons .vg-unit-button').first().click();assert.match(await page.inputValue('#vgText'),/amamus/);
 const downloadPromise=page.waitForEvent('download');await page.click('#vgWord');const dl=await downloadPromise;const file=await dl.path();assert.equal(fs.readFileSync(file).readUInt32LE(0),0x04034b50);
 await page.reload();await page.click('#vgShow');assert.equal(await page.inputValue('#vgCount'),'2');
 assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').count(),2,'Unidades en botones');
 const units=await page.locator('#vgUnitButtons .vg-unit-button').evaluateAll(nodes=>
  nodes.map(el=>({filled:el.dataset.filled,selected:el.getAttribute('aria-pressed')})));
 assert.deepEqual(units.map(x=>x.filled),['true','true'],'Los dos textos escritos se reflejan con marca de contenido');
 assert.equal(units.filter(x=>x.selected==='true').length,1,'Solo una unidad seleccionada');
 await page.locator('#vgUnitButtons .vg-unit-button').first().click();
 assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').first().getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#vgUnitButtons .vg-unit-button').nth(1).getAttribute('aria-pressed'),'false');
 // Reproduce un JSON antiguo de 14 unidades: textos, pero sin ningún análisis.
 const imported={count:14,course:'gr1',units:Array.from({length:14},(_,i)=>({
  title:'UD'+(i+1),text:'ὁ θεός ἐστιν. οἱ ἄνθρωποι.',mode:'complete',rows:[]
 }))};
 await page.locator('#vgImport').setInputFiles({
  name:'vocabulario-unidades.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))
 });
 await page.waitForFunction(()=>document.querySelector('#vgStatus')?.textContent.includes('14 por analizar'));
 assert.match(await page.locator('#vgStatus').innerText(),/14 por analizar/);
 const download14=page.waitForEvent('download');
 await page.click('#vgWord');const doc14=await download14;
 const body14=fs.readFileSync(await doc14.path()).toString('utf8');
 for(let n=1;n<=14;n++)assert.ok(body14.includes('UD'+n),'No existe contenido para UD'+n);
 assert.match(body14,/θεός|θεὸς|θεὸς|θέος/);
 assert.match(await page.locator('#vgStatus').innerText(),/Word generado con 14 unidades/);
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_vocabulary_project_v1')));
 assert.equal(persisted.units.length,14);
 assert.ok(persisted.units.every(u=>u.text.includes('θεός')&&u.rows.length>0));
 console.log('Importación JSON con 14 unidades sin analizar: Word completo y textos conservados.');
 
 await page.click('#vmShowExam');assert.equal(await page.locator('#vocabularyGenerator').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('Navegador offline: pestañas, unidades, persistencia y descarga DOCX correctas.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
