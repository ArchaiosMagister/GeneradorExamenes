'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const out=path.resolve('test-artifacts/greek1-qa');fs.mkdirSync(out,{recursive:true});
function entry(bytes,wanted){let p=0;while(bytes.readUInt32LE(p)===0x04034b50){const size=bytes.readUInt32LE(p+18),n=bytes.readUInt16LE(p+26),e=bytes.readUInt16LE(p+28),start=p+30+n+e,name=bytes.toString('utf8',p+30,p+30+n);if(name===wanted)return bytes.toString('utf8',start,start+size);p=start+size}throw Error(wanted)}
async function select(page,model,unit,lang='es'){
 await page.evaluate(({model,unit,lang})=>{
  $('course').value='greek1';$('course').dispatchEvent(new Event('change',{bubbles:true}));
  $('model').value=model;$('model').dispatchEvent(new Event('change',{bubbles:true}));
  $('lang').value=lang;$('lang').dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelectorAll('#unitChoices .unit-choice').forEach(x=>x.checked=units[Number(x.value)]==='UD'+unit);
  generate();
 },{model,unit,lang});
}
(async()=>{
 const browser=await chromium.launch({headless:true});const report=[];
 try{for(const file of ['index.html','offline.html']){
  const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await ctx.route(/^https?:\/\//,r=>r.abort());
  await page.goto(pathToFileURL(path.resolve(file)).href);
  for(const model of ['complete'])for(const lang of ['es','va'])for(let unit=1;unit<=14;unit++){
   await select(page,model,unit,lang);
   const row=await page.evaluate(({unit,lang})=>{
    const must=(condition,message)=>{if(!condition)throw Error('UD'+unit+'/'+lang+': '+message)};
    const numbers=ExaminaGreekNumber.candidates(),retros=ExaminaGreekRetroversion.candidates(),roots=ExaminaGreekEtymSentence.candidates();
    must(unit>=3||(!numbers.length&&!retros.length),'artículo anticipado');
    must(unit>=4||!retros.some(x=>x.type==='preposition'),'preposición anticipada');
    must(unit>=5||!numbers.some(x=>x.adjective)&&!retros.some(x=>x.adjective),'adjetivo anticipado');
    must(unit>=7||!numbers.some(x=>x.pronoun),'pronombre anticipado');
    must(retros.every(x=>x.minUnit<=unit),'lema anticipado');
    must(!numbers.some(x=>x.adjective&&greekBankKey(x.adjective)==='ολιγοσ'),'no propagar el paradigma heredado de ὀλιγός');
    must(!document.querySelector('#paper')?.textContent.includes('ὀλιγ'),'acento heredado en las tablas');
    if(unit>=3){
     const economy=roots.find(x=>x.id==='economia-democracia');
     must(economy&&economy.roots[0].join(' + ')==='οἰκία + νόμος','familias docentes de economía desde UD3');
     must(ExaminaGreekEtymSentence.answerRoots(economy)[0]==='οἰκία / οἶκος + νόμος / νέμω','variantes docentes de economía');
    }
    must(roots.every(x=>x.roots.flat().every(r=>r!=='θέος')),'étimo o acento incorrecto');
    if(unit>=5){
     for(const [prompt,answer] of [['ὁ ἀγαθὸς ἄνθρωπος','οἱ ἀγαθοὶ ἄνθρωποι'],['τὸ ἀγαθὸν δῶρον','τὰ ἀγαθὰ δῶρα']])
      must(numbers.some(x=>x.prompt===prompt&&x.answer===answer),'paradigma de control ausente: '+prompt);
    }
    if(unit>=7)must(numbers.some(x=>x.prompt==='ὁ αὐτὸς ἄνθρωπος'&&x.answer==='οἱ αὐτοὶ ἄνθρωποι'),'αὐτός identidad');
    if(unit>=5&&lang==='va')must(!retros.some(x=>/^la mar /.test(x.prompt)&&/ (bo|bonic|roín|just|menut)$/.test(x.prompt)),'concordancia valenciana de mar');
    for(const kind of ['change-number','retroversion','roots']){
     const question=document.querySelector('[data-greek-option="'+kind+'"]');
     const answer=document.querySelector('[data-greek-extra-answer="'+kind+'"]');
     must(!!question===!!answer,'falta clave de '+kind);
    }
    return {unit,lang,numberCount:numbers.length,retroCount:retros.length,etymIds:roots.map(x=>x.id),samples:{numbers:numbers.slice(0,2),retro:retros.slice(0,2)}};
   },{unit,lang});report.push({file,model,...row});
  }
  await select(page,'complete',7);
  await page.evaluate(()=>{
   document.querySelector('#paper .exam-header').append(' CABECERA_CONSERVADA');
   document.querySelector('[data-greek-choice-slot="retroversion:1"]').append(' RETRO_CONSERVADA');
   document.querySelector('[data-greek-answer-slot="retroversion:1"]').append(' SOLUCION_CONSERVADA');
   ExaminaGreekNumber.setCount(6);ExaminaGreekChoiceGroups.replaceGenerated('change-number',null,false);
  });
  assert.equal(await page.locator('[data-greek-choice-slot^="change-number:"]').count(),6);
  assert.match(await page.locator('#paper').textContent(),/CABECERA_CONSERVADA/);
  assert.match(await page.locator('[data-greek-choice-slot="retroversion:1"]').textContent(),/RETRO_CONSERVADA/);
  const unchanged=await page.locator('[data-greek-answer-slot="retroversion:1"]').textContent();
  await page.evaluate(()=>ExaminaGreekChoiceGroups.replaceGenerated('change-number',0));
  assert.equal(await page.locator('[data-greek-answer-slot="retroversion:1"]').textContent(),unchanged);
  const match=await page.evaluate(()=>ExaminaGreekNumber.current()[0].answer);
  assert.match(await page.locator('[data-greek-answer-slot="change-number:0"]').textContent(),new RegExp(match));
  const draft=await page.evaluate(()=>window.ExaminaUnifiedCurrentExam());
  await select(page,'morphology',3);
  await page.evaluate(d=>window.ExaminaUnifiedRestoreDraft(d),draft);
  assert.equal(await page.evaluate(()=>ExaminaGreekNumber.state().quantity),6);
  assert.deepEqual(await page.evaluate(()=>ExaminaGreekNumber.state().ids),draft.greekChoices.number.ids);
  assert.match(await page.locator('#paper').textContent(),/CABECERA_CONSERVADA/);
  await page.evaluate(()=>ExaminaGreekChoiceGroups.replaceGenerated('change-number',0));
  assert.equal(await page.locator('.greek-choice-etym-sentence u').count(),2,'Subrayado tras recuperar borrador');
  // A whole-alternative regeneration discards only that alternative's manual text.
  await page.evaluate(()=>{
   const node=document.querySelector('[data-greek-choice-slot="change-number:0"]');
   node.textContent='EDITADO_NUMERO';node.dispatchEvent(new InputEvent('input',{bubbles:true}));
   if(!ExaminaGreekChoiceGroups.replaceGenerated('change-number'))throw Error('No regeneró');
  });
  assert(!((await page.locator('[data-greek-option="change-number"]').textContent()).includes('EDITADO_NUMERO')));
  assert.match(await page.locator('#paper').textContent(),/RETRO_CONSERVADA/);
  // Actual DOCX exports, with and without solutions, in both languages/models.
  for(const model of ['complete','translation'])for(const lang of ['es','va']){
   await select(page,model,5,lang);
   await page.evaluate(()=>{ExaminaGreekNumber.setCount(4);ExaminaGreekRetroversion.setCount(4);generate()});
   const stem=file.replace('.html','')+'-'+model+'-'+lang;
   const answers=await page.evaluate(()=>[...document.querySelectorAll('[data-greek-extra-answer] p')].map(x=>x.textContent));
   for(const solutions of [false,true]){
    const bytes=Buffer.from(await page.evaluate(async solutions=>{
     const old=downloadBlob;let blob;try{downloadBlob=(_n,b)=>blob=b;exportWord(solutions)}finally{downloadBlob=old}
     if(!blob)throw Error('Word bloqueado');return [...new Uint8Array(await blob.arrayBuffer())];
    },solutions));
    const xml=entry(bytes,'word/document.xml');
    assert.match(xml,/<w:u w:val="single"\/>/);
    const subheads=await page.evaluate(()=>[...document.querySelectorAll('.greek-choice-subquestion')].map(x=>wordBlock(x)));
    assert(subheads.every(x=>x.includes('<w:keepNext/>')),'Enunciado de alternativa huérfano en Word');
    for(const answer of answers)assert.equal(xml.includes(answer),solutions,'Clave Word '+stem+': '+answer);
    fs.writeFileSync(path.join(out,stem+(solutions?'-soluciones':'')+'.docx'),bytes);
   }
   const waiting=page.waitForEvent('download');
   await page.locator('#pdfDownload').click({force:true});const pdf=await waiting;
   await pdf.saveAs(path.join(out,stem+'.pdf'));
   assert.equal(fs.readFileSync(path.join(out,stem+'.pdf')).subarray(0,5).toString(),'%PDF-');
  }
  assert.deepEqual(errors,[]);await ctx.close();
 }
 fs.writeFileSync(path.join(out,'curriculum-audit.json'),JSON.stringify(report,null,2));
 console.log('AUDITORÍA GRIEGO I: 56 contextos curriculares, paradigmas testigo, concordancia ES/VA, claves, borradores, regeneración y DOCX/PDF web/offline sin red: OK');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
