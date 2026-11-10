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
const project={count:2,units:[1,2].map(i=>({title:'UD'+i,mode:'complete',rows}))};
const xml=api.documentXml(project);assert.equal((xml.match(/MI TRADUCCIÓN/g)||[]).length,2);assert.equal((xml.match(/<w:sectPr>/g)||[]).length,3,'cada UD y la última tienen cierre continuo');
assert.equal((xml.match(/<w:cols w:num="2"/g)||[]).length,2);
assert.match(xml,/<w:sectPr><w:type w:val="continuous"\/><w:pgSz[^]*<w:cols w:num="1"[^]*<\/w:body>/);
assert.match(xml,/\* xyzxyz/);
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
const misspelled=api.analyze(data,'ἄνρωπος','gr1',priorityBank);
assert.equal(misspelled[0].status,'unknown','No corregir silenciosamente errores ortográficos de los textos');
console.log('Griego prioritario: ateniense, nominales, presente, artículo y formas de εἰμί reconocidos.');

console.log('Vocabulario: prioridad docente, deduplicación por UD, ambigüedad, desconocidas, griego y XML de dos columnas correctos.');
(async()=>{
 const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{
 const page=await browser.newPage({acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+root+'/offline.html');await page.click('#vgShow');
 await page.fill('#vgCount','2');await page.locator('#vgCount').dispatchEvent('change');
 await page.fill('#vgText','Puella puella amamus xyzxyz');await page.click('#vgAnalyze');await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('pendientes'));
 assert.match(await page.locator('#vgResults').innerText(),/xyzxyz/);
 await page.selectOption('#vgMode','simple');await page.selectOption('#vgUnit','1');assert.equal(await page.inputValue('#vgText'),'');
 await page.fill('#vgText','Puella');await page.click('#vgAnalyzeAll');await page.waitForFunction(()=>document.querySelector('#vgStatus').textContent.includes('pendientes'));
 await page.selectOption('#vgUnit','0');assert.match(await page.inputValue('#vgText'),/amamus/);
 const downloadPromise=page.waitForEvent('download');await page.click('#vgWord');const dl=await downloadPromise;const file=await dl.path();assert.equal(fs.readFileSync(file).readUInt32LE(0),0x04034b50);
 await page.reload();await page.click('#vgShow');assert.equal(await page.inputValue('#vgCount'),'2');
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
 assert.match(body14,/θεός|θεὸς|θεὸς/);
 assert.match(await page.locator('#vgStatus').innerText(),/Word generado con 14 unidades/);
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('examina_vocabulary_project_v1')));
 assert.equal(persisted.units.length,14);
 assert.ok(persisted.units.every(u=>u.text.includes('θεός')&&u.rows.length>0));
 console.log('Importación JSON con 14 unidades sin analizar: Word completo y textos conservados.');
 
 await page.click('#vmShowExam');assert.equal(await page.locator('#vocabularyGenerator').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('Navegador offline: pestañas, unidades, persistencia y descarga DOCX correctas.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
