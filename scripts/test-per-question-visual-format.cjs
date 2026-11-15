'use strict';
/* Valores independientes por pregunta en pantalla, Word, borradores y PWA. */
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..');
function zipEntry(bytes,wanted){
 let off=0;
 while(off+30<=bytes.length&&bytes.readUInt32LE(off)===0x04034b50){
  const length=bytes.readUInt32LE(off+18),nameLen=bytes.readUInt16LE(off+26),extra=bytes.readUInt16LE(off+28);
  const name=bytes.toString('utf8',off+30,off+30+nameLen),start=off+30+nameLen+extra;
  if(name===wanted){assert.equal(bytes.readUInt16LE(off+8),0);return bytes.toString('utf8',start,start+length)}
  off=start+length;
 }
 throw Error('No se encontró '+wanted);
}
async function wordXml(page){
 const data=await page.evaluate(async()=>{
  const original=downloadBlob,review=window.ExaminaTeacherReview,old=review?.evidenceMayExport;
  let blob;
  try{
   if(review)review.evidenceMayExport=()=>true;
   downloadBlob=(_name,b)=>blob=b;
   exportWord(false);
  }finally{
   downloadBlob=original;
   if(review)review.evidenceMayExport=old;
  }
  if(!blob)throw Error('El exportador no produjo un DOCX');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
 });
 return zipEntry(Buffer.from(data),'word/document.xml');
}
const point=pt=>pt*96/72;
function closeTo(value,pt){
 assert(Math.abs(parseFloat(value)-point(pt))<1.6,
  'Espaciado CSS esperado '+pt+' pt, obtenido '+value);
}
function key(course,model,kind,scope='exam'){return course+'/'+model+'/'+scope+':'+kind}
async function configure(page,course,model,lang,ud){
 return page.evaluate(({course,model,lang,ud})=>{
  const choose=(id,value)=>{
   const el=document.getElementById(id);
   if(!el)throw Error('No existe el control '+id);
   el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  choose('course',course);choose('model',model);choose('lang',lang);
  const choice=[...document.querySelectorAll('#unitChoices .unit-choice')].find(el=>units[Number(el.value)]===ud);
  if(!choice)throw Error('No se encuentra '+course+' '+ud);
  document.querySelectorAll('#unitChoices .unit-choice').forEach(el=>{el.checked=el===choice});
  choice.dispatchEvent(new Event('change',{bubbles:true}));
  if(course==='latin4'){
   document.getElementById('culture').checked=true;
   examQuestionChoiceState['latin4/tablas/culture']=true;
  }
  examSelectionCache.clear();generate();
  window.ExaminaScoring?.sync?.();
  return {
   headings:[...document.querySelectorAll('#paper .exam-sheet > p.exam-question')]
    .map(x=>({kind:x.dataset.examKind||x.dataset.morphKind||x.dataset.greekKind,
      text:x.textContent.trim()})),
   scoreCount:window.ExaminaScoring.rows().length,
   body:document.querySelector('#paper .exam-sheet')?.textContent
  };
 },{course,model,lang,ud});
}
async function setPer(page,k,field,value){
 await page.locator('#examVisualSettings').evaluate(el=>el.open=true);
 const el=page.locator('#examVisualQuestionRows input[data-exam-visual-key="'+k+'"][data-exam-visual-field="'+field+'"]');
 assert.equal(await el.count(),1,'No hay control individual '+k+' / '+field);
 await el.fill(String(value));await el.press('Tab');
 return el;
}
function paragraphs(xml){
 return [...xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map(x=>x[0]);
}
function para(xml,needle){
 const p=paragraphs(xml).find(p=>p.includes(needle));
 assert(p,'No se ha encontrado el párrafo de Word '+needle);
 return p;
}
function margin(xml,text,pts){
 const p=para(xml,text);
 assert(p.includes('w:before="'+Math.round(pts*20)+'"'),
  text+': Word no aplica '+pts+' pt a su enunciado');
}
async function latin4(page,file){
 const state=await configure(page,'latin4','tablas','es','UD4');
 assert(state.headings.length>=5,file+': faltan preguntas de Latín 4.º');
 assert.equal(state.scoreCount,state.headings.length,file+': puntuación distinta de preguntas');
 const settings=page.locator('#examVisualSettings');
 await settings.evaluate(el=>el.open=true);
 for(const kind of ['decl','verb','forms','culture','sent'])
  assert.equal(await page.locator('#examVisualQuestionRows [data-exam-visual-key="'+key('latin4','tablas',kind)+'"]').count()>0,true,
   file+': falta fila '+kind);
 assert.equal(await page.locator('#examVisualQuestionRows input[data-exam-visual-field="items"][data-exam-visual-key="'+key('latin4','tablas','verb')+'"]').count(),0,
  file+': la tabla verbal única no debe tener un espaciado inoperante');
 assert.equal(await page.locator('#examQuestionBeforePt').inputValue(),'12',file+': se perdieron los 12 pt globales');
 assert.equal(await page.locator('#examCultureGapPt').inputValue(),'5',file+': se perdieron los 5 pt de cultura');
 const before=await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML);
 await setPer(page,key('latin4','tablas','verb'),'before',16);
 await setPer(page,key('latin4','tablas','culture'),'before',22);
 await setPer(page,key('latin4','tablas','forms'),'items',4);
 await setPer(page,key('latin4','tablas','culture'),'items',9.5);
 await setPer(page,key('latin4','tablas','sent'),'items',30);
 const decl=page.locator('#examVisualQuestionRows input[data-exam-visual-key="'+key('latin4','tablas','decl')+'"][data-exam-visual-field="items"]');
 if(await decl.count())await setPer(page,key('latin4','tablas','decl'),'items',10);
 assert.equal(await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML),before,
  file+': variar el formato alteró el HTML, las formas o la puntuación del examen');
 const values=await page.evaluate(()=>{
  const sheet=document.querySelector('#paper .exam-sheet');
  const elem=x=>getComputedStyle(sheet.querySelector(x)).marginTop;
  return {
   culture:elem('p.exam-question[data-exam-kind="culture"]'),
   verb:elem('p.exam-question[data-exam-kind="verb"]'),
   forms:elem('p.exam-question[data-exam-kind="forms"]'),
   cultureItem:elem('.exam-culture-items>li+li'),
   formItem:elem('p.exam-question[data-exam-kind="forms"]+ol.task>li+li'),
   sentenceItem:elem('.exam-sentences>li+li'),
   nouns:[...sheet.querySelectorAll('table.exam-nouns')].map(t=>getComputedStyle(t).marginTop),
   cultureTexts:[...sheet.querySelectorAll('.exam-culture-items>li')].map(el=>el.firstChild?.textContent.trim()),
   saved:window.ExaminaVisualFormat.snapshot()
  };
 });
 closeTo(values.culture,22);closeTo(values.verb,16);closeTo(values.forms,12);
 closeTo(values.cultureItem,9.5);closeTo(values.formItem,4);closeTo(values.sentenceItem,30);
 assert.equal(values.saved.perQuestion[key('latin4','tablas','culture')].items,9.5);
 const xml=await wordXml(page);
 margin(xml,'Cultura clásica',22);margin(xml,'Conjuga en',16);margin(xml,'Analiza morfológicamente',12);
 const culturePara=para(xml,values.cultureTexts[1]);
 assert(culturePara.includes('w:before="190"'),file+': los 9,5 pt culturales no llegaron a Word');
 assert(xml.includes('w:before="600"'),file+': los 30 pt de oraciones no llegaron a Word');
 assert(xml.includes('w:before="80"'),file+': los 4 pt de análisis no llegaron a Word');
 if(values.nouns.length>1){
  closeTo(values.nouns[1],10);
  assert(xml.includes('w:line="200" w:lineRule="exact"'),file+': los 10 pt entre tablas no llegan al DOCX');
 }
 // Una pregunta sin personalización sigue el valor general; otra se mantiene independiente.
 const global=page.locator('#examQuestionBeforePt');
 await global.fill('15');await global.press('Tab');
 const computed=await page.evaluate(()=>{
  const sheet=document.querySelector('#paper .exam-sheet');
  const get=kind=>getComputedStyle(sheet.querySelector('p.exam-question[data-exam-kind="'+kind+'"]')).marginTop;
  return [get('decl'),get('verb'),get('culture')];
 });
 closeTo(computed[0],15);closeTo(computed[1],16);closeTo(computed[2],22);
 const snapshot=await page.evaluate(()=>window.ExaminaUnifiedCurrentExam());
 await setPer(page,key('latin4','tablas','culture'),'items',1);
 await setPer(page,key('latin4','tablas','verb'),'before',2);
 await page.evaluate(snap=>window.ExaminaUnifiedRestoreDraft(snap),snapshot);
 assert.equal(await page.locator('input[data-exam-visual-key="'+key('latin4','tablas','culture')+'"][data-exam-visual-field="items"]').inputValue(),'9.5',
  file+': restaurar el borrador ha perdido el espacio cultural individual');
 assert.equal(await page.locator('input[data-exam-visual-key="'+key('latin4','tablas','verb')+'"][data-exam-visual-field="before"]').inputValue(),'16',
  file+': restaurar el borrador ha perdido el margen verbal individual');
 await page.reload({waitUntil:'load'});
 await page.waitForFunction(()=>!!window.ExaminaVisualFormat);
 const persisted=await page.evaluate(()=>window.ExaminaVisualFormat.snapshot());
 assert.equal(persisted.perQuestion[key('latin4','tablas','culture')].items,9.5,
  file+': no se ha persistido la configuración individual de cultura');
 assert.equal(persisted.perQuestion[key('latin4','tablas','verb')].before,16);
 const va=await configure(page,'latin4','tablas','va','UD4');
 assert.equal(va.scoreCount,va.headings.length,file+': el valenciano cambia la puntuación');
 assert.match(await page.locator('#examVisualIndividualsTitle').textContent(),/Per pregunta/);
 assert.equal(await page.locator('input[data-exam-visual-key="'+key('latin4','tablas','culture')+'"][data-exam-visual-field="items"]').inputValue(),'9.5',
  file+': al cambiar idioma desaparece el espaciado individual');
 const vaXML=await wordXml(page);
 margin(vaXML,'Cultura clàssica',22);
 assert.deepEqual(va.headings.some(x=>x.text.includes('Cultura clàssica')),true);
}
async function morph(page,file){
 // El identificador del apartado debe funcionar también en los exámenes
 // morfológicos de los dos cursos y en el exportador Word.
 for(const [course,model,unit] of [['latin1','morf','UD4'],['greek1','morphology','UD8']]){
  const state=await configure(page,course,model,'es',unit);
  assert(state.headings.length>0,file+': sin preguntas de '+course);
  const formsKey=key(course,model,'forms','morph');
  const before=page.locator('input[data-exam-visual-key="'+formsKey+'"][data-exam-visual-field="before"]');
  assert.equal(await before.count(),1,file+': el formato no reconoce la pregunta morfológica '+course);
  await setPer(page,formsKey,'before',19);
  const xml=await wordXml(page);
  const forms=state.headings.find(x=>x.kind==='forms');
  assert(forms,file+': no aparece análisis de palabras en '+course);
  // Se distingue de la pregunta de verbos: sus títulos empiezan igual.
  const title=forms.text.replace(/^\d+\.\s*/,'').trim().slice(0,70);
  margin(xml,title,19);
  if(await page.locator('input[data-exam-visual-key="'+formsKey+'"][data-exam-visual-field="items"]').count()){
   await setPer(page,formsKey,'items',6);
   const item=await page.locator('#paper .reference-analysis-item[data-analysis-slot]').nth(1).evaluate(el=>getComputedStyle(el).marginTop);
   closeTo(item,6);
   const formatted=await wordXml(page);
   assert(formatted.includes('w:before="120"'),file+': los 6 pt de análisis de '+course+' no llegan a Word');
  }
 }
}
async function checkReviewLocaleAndContrast(page,file){
 for(const [course,model,unit,es,va,expected] of [
  ['latin4','tablas','UD4','Ficha de repaso de Latín 4.º ESO','Fitxa de repàs de Llatí 4t ESO','rgb(243, 212, 81)'],
  ['greek1','morphology','UD8','Ficha de repaso de Griego I','Fitxa de repàs de Grec I','rgb(159, 216, 255)'],
  ['latin1','morf','UD4','Ficha de repaso de Latín I','Fitxa de repàs de Llatí I',null]
 ]){
  await configure(page,course,model,'es',unit);
  const actual=await page.evaluate(()=>{
   const sheet=document.getElementById('sheetType'),lang=document.getElementById('lang');
   sheet.value='review';sheet.dispatchEvent(new Event('change',{bubbles:true}));
   const original=document.getElementById('name').value;
   lang.value='va';lang.dispatchEvent(new Event('change',{bubbles:true}));
   return {original,localized:document.getElementById('name').value,
    heading:document.querySelector('#paper .exam-header-line:first-child span:first-child')?.textContent||''};
  });
  assert.equal(actual.original,es,file+': título ES inicial de '+course);
  assert.equal(actual.localized,va,file+': no localiza el campo de título de '+course);
  assert(actual.heading.startsWith(va),file+': no localiza el encabezado del documento de '+course);
  const xml=await wordXml(page);
  assert(xml.includes('Fitxa de repàs de'),file+': Word no contiene el título valenciano en '+course);
  assert(!xml.includes('Ficha de repaso de'),file+': Word conserva el título español en '+course);
  if(course==='latin4'){
   const old=await page.evaluate(es=>{
    document.getElementById('name').value=es;
    generate();
    return document.querySelector('#paper .exam-header-line:first-child span:first-child')?.textContent||'';
   },es);
   assert(old.startsWith(va),file+': borrador antiguo no se traduce');
   assert((await wordXml(page)).includes(va),file+': Word no traduce borrador antiguo');
  }
  if(expected)for(const mode of ['dark','oled']){
   const values=await page.evaluate(mode=>{
    document.documentElement.dataset.appearance=mode;
    return {text:getComputedStyle(document.querySelector('#examLayout aside.panel .settings-section-caption')).color,
      paper:getComputedStyle(document.getElementById('paper')).backgroundColor};
   },mode);
   assert.equal(values.text,expected,file+': contraste '+course+'/'+mode);
   assert.equal(values.paper,'rgb(255, 255, 255)',file+': papel no blanco en '+mode);
  }
 }
 const custom=await page.evaluate(()=>{
  const name=document.getElementById('name'),lang=document.getElementById('lang');
  name.value='Título docente personalizado';
  lang.value='es';lang.dispatchEvent(new Event('change',{bubbles:true}));
  lang.value='va';lang.dispatchEvent(new Event('change',{bubbles:true}));
  return name.value;
 });
 assert.equal(custom,'Título docente personalizado',file+': el cambio de idioma sobrescribe un título docente');
}

async function checkCourseThemeContrast(page,file){
 // El CSS específico del curso no puede ganar la cascada al tema oscuro/OLED.
 // El encabezado «Unidades del examen» usa --ink sobre --soft.
 const fixtures=[
  ['latin4','tablas','UD4','rgb(255, 251, 227)'],
  ['greek1','morphology','UD8','rgb(234, 245, 255)'],
  ['latin1','morf','UD4','rgb(255, 243, 226)']
 ];
 const rgb=s=>String(s).match(/\d+(?:\.\d+)?/g).slice(0,3).map(Number);
 const luminance=c=>{
  const v=rgb(c).map(x=>x/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);
  return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2];
 };
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
 for(const [course,model,unit,lightBackground] of fixtures){
  await configure(page,course,model,'es',unit);
  for(const mode of ['light','dark','oled']){
   const css=await page.evaluate(mode=>{
    document.documentElement.dataset.appearance=mode;
    const root=getComputedStyle(document.documentElement);
    const h=document.getElementById('primaryExamHeading');
    const heading=getComputedStyle(h);
    return {
     label:h.textContent.trim(),
     course:document.documentElement.dataset.course,
     foreground:heading.color,
     background:heading.backgroundColor,
     soft:root.getPropertyValue('--soft').trim(),
     softInk:root.getPropertyValue('--soft-ink').trim(),
     page:getComputedStyle(document.getElementById('paper')).backgroundColor,
     canvas:getComputedStyle(document.documentElement).backgroundColor
    };
   },mode);
   assert.equal(css.label,'Unidades del examen',file+': falta el encabezado visible');
   assert.equal(css.course,course,file+': no se ha aplicado el curso');
   if(mode==='light'){
    assert.equal(css.background,lightBackground,file+': ha cambiado la paleta clara de '+course);
   }else{
    assert.equal(css.background,'rgb(48, 61, 80)',file+': fondo claro residual en '+course+'/'+mode);
    assert.equal(css.foreground,'rgb(237, 243, 251)',file+': texto de título sin contraste en '+course+'/'+mode);
    assert.equal(css.soft,'#303d50',file+': --soft ignora tema '+mode+'/'+course);
    assert.equal(css.softInk,'#edf3fb',file+': --soft-ink ignora tema '+mode+'/'+course);
    assert.equal(css.canvas,mode==='oled'?'rgb(0, 0, 0)':'rgb(23, 29, 40)',
     file+': se ha cambiado el fondo del modo '+mode);
    assert.equal(css.page,'rgb(255, 255, 255)',file+': se ha oscurecido el documento imprimible');
   }
   assert(ratio(css.foreground,css.background)>=7,
    file+': contraste insuficiente ('+ratio(css.foreground,css.background).toFixed(2)+':1) en '+course+'/'+mode);
  }
 }
}

async function serveRealLexicalBanks(){
 const server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}
  catch{res.writeHead(400).end();return}
  const full=path.resolve(ROOT,'.'+pathname);
  if(!full.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
  fs.stat(full,(error,info)=>{
   if(error||!info.isFile()){res.writeHead(404).end();return}
   const ext=path.extname(full);
   res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8',
    '.js':'text/javascript; charset=utf-8','.json':'application/json',
    '.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
    '.png':'image/png','.css':'text/css'}[ext]||'application/octet-stream'));
   fs.createReadStream(full).pipe(res);
  });
 });
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
 });
 return {url:'http://127.0.0.1:'+server.address().port+'/index.html',
  close:()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections?.()})};
}
async function latinLexSpacing(page,file){
 // El HTML público carga sus bancos por fetch: file:// no los proporciona.
 // El archivo autónomo sí los tiene incrustados y se prueba sin HTTP.
 const site=file==='index.html'?await serveRealLexicalBanks():null;
 try{
  if(site)await page.goto(site.url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.ExaminaTeacherLexBankReady===true);
 const phrases={
  es:{preverbs:'Modificación preverbial a partir de',phonetics:'Evolución fonética de',
   prefixes:'Señala el prefijo',latinisms:'Latinismos. Explica'},
  va:{preverbs:'Modificació preverbial a partir de',phonetics:'Evolució fonètica de',
   prefixes:'Assenyala el prefix',latinisms:'Llatinismes. Explica'}
 };
 // 4.º: prefijos + evolución fonética. Latín I: hasta cuatro subapartados.
 // Comprobar ambos idiomas y ambos tipos de examen latino.
 for(const [course,model,unit,lang,gap] of [
  ['latin4','tablas','UD8','es',8.5],
  ['latin4','tablas','UD8','va',11.5],
  ['latin1','tablas','UD8','es',6.5],
  ['latin1','mixto','UD8','va',13.5]
 ]){
  await configure(page,course,model,lang,unit);
  const k=key(course,model,'lex');
  const row=page.locator('#examVisualQuestionRows input[data-exam-visual-key="'+k+'"][data-exam-visual-field="items"]');
  assert.equal(await row.count(),1,file+': falta el espaciado de léxico '+course+'/'+model+'/'+lang);
  const before=await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML);
  const other=await page.locator('#paper .exam-sheet').evaluate(el=>{
   const target=el.querySelector('p.exam-question[data-exam-kind="forms"]+ol.task>li+li');
   return target?getComputedStyle(target).marginTop:null;
  });
  await setPer(page,k,'items',gap);
  assert.equal(await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML),before,
   file+': cambiar el espaciado de léxico ha regenerado palabras');
  const items=await page.evaluate(()=>{
   const nodes=[...document.querySelectorAll('#paper .exam-sheet > p.exam-item.lex-subquestion')];
   return nodes.map(el=>({kind:el.dataset.lexKind,margin:getComputedStyle(el).marginTop}));
  });
  assert(items.length>=2,file+': sin varios apartados léxicos en '+course+'/'+model+'/'+lang);
  items.forEach((item,i)=>closeTo(item.margin,i?gap:0));
  assert.deepEqual(items.map(x=>x.kind),course==='latin4'?['prefixes','phonetics']:
   ['preverbs','phonetics','prefixes','latinisms'].filter(kind=>items.some(x=>x.kind===kind)),
   file+': se ha alterado el orden de subapartados');
  const afterOther=await page.locator('#paper .exam-sheet').evaluate(el=>{
   const target=el.querySelector('p.exam-question[data-exam-kind="forms"]+ol.task>li+li');
   return target?getComputedStyle(target).marginTop:null;
  });
  assert.equal(afterOther,other,file+': aplicar margen léxico altera el análisis morfológico');
  const xml=await wordXml(page);
  for(const [i,item] of items.entries()){
   const wordParagraph=para(xml,phrases[lang][item.kind]);
   assert(wordParagraph.includes('w:before="'+(i?Math.round(gap*20):0)+'"'),
    file+': Word no respeta el espacio de '+item.kind+' ('+course+'/'+lang+')');
   assert(wordParagraph.includes('w:after="0"'),
    file+': Word acumula márgenes verticales en '+item.kind);
  }
  // Continuidad: 50 pt entre subopciones -> 50 pt hasta el título siguiente.
  const next=await page.evaluate(()=>{
   const sheet=document.querySelector('#paper .exam-sheet');
   const headings=[...sheet.querySelectorAll(':scope > p.exam-question')];
   const lex=sheet.querySelector(':scope > p.exam-question[data-exam-kind="lex"]');
   const n=headings[headings.indexOf(lex)+1];
   if(!n)throw Error('Falta una pregunta después de léxico');
   return {text:n.textContent.trim().replace(/^\d+\.\s*/,''),kind:n.dataset.examKind};
  });
  await setPer(page,k,'items',50);
  const nextMargin=await page.evaluate(kind=>getComputedStyle(
   document.querySelector('#paper p.exam-question[data-exam-kind="'+kind+'"]')).marginTop,next.kind);
  closeTo(nextMargin,50);
  assert(para(await wordXml(page),next.text).includes('w:before="1000"'),
   file+': Word no conserva los 50 pt antes de la pregunta siguiente');
  assert.equal(await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML),before,
   file+': cambiar márgenes regeneró preguntas');
  // Vocabulario: mismo hueco que entre oraciones, tanto en Word como en pantalla.
  // Hay unidades de prueba cuyo glosario está vacío por filtros docentes.
  // En tal caso introducir solo un título de prueba dentro del examen ya
  // generado, sin tocar bancos ni preguntas, para verificar el exportador.
  if(!await page.locator('#paper .exam-sheet > p.exam-gloss-title').count()){
   await page.evaluate(()=>{
    const sheet=document.querySelector('#paper .exam-sheet');
    if(!sheet.querySelector('.exam-sentences > li, p.exam-sentence'))
     throw Error('Faltan las oraciones anteriores al glosario');
    const title=document.createElement('p');title.className='exam-gloss-title';
    title.innerHTML=document.getElementById('lang').value==='va'
     ?'<strong>Vocabulari</strong>':'<strong>Vocabulario</strong>';
    const list=document.createElement('div');list.className='final-gloss';
    list.innerHTML='<div class="gloss-item">puella, –ae: niña</div>';
    sheet.querySelector('#answerkey').before(title,list);
    applyExamVisualFormat();
   });
  }
  const withGloss=await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML);
  await setPer(page,key(course,model,'sent'),'items',''); // Quitar intervalo individual heredado.
  await page.evaluate(()=>{
   const field=document.getElementById('sentence-gap-pt');
   field.value='54';field.dispatchEvent(new Event('change',{bubbles:true}));
  }); // El campo original vive en un desplegable de configuración cerrado.
  const glossTitle=await page.locator('#paper .exam-sheet > p.exam-gloss-title').textContent();
  const glossMargin=await page.locator('#paper .exam-sheet > p.exam-gloss-title')
   .evaluate(el=>getComputedStyle(el).marginTop);
  closeTo(glossMargin,54);
  assert(para(await wordXml(page),glossTitle.trim()).includes('w:before="1080"'),
   file+': Word no deja 54 pt antes del vocabulario');
  await setPer(page,key(course,model,'sent'),'items',66);
  closeTo(await page.locator('#paper .exam-sheet > p.exam-gloss-title')
   .evaluate(el=>getComputedStyle(el).marginTop),66);
  assert(para(await wordXml(page),glossTitle.trim()).includes('w:before="1320"'),
   file+': Word no respeta los 66 pt específicos de oraciones');
  assert.equal(await page.locator('#paper .exam-sheet').evaluate(el=>el.innerHTML),withGloss,
   file+': cambiar espaciado del glosario ha regenerado el examen');
  // Prueba explícita de 0 puntos: ningún resto de los 7/9 pt heredados.
  await setPer(page,k,'items',0);
  const zeros=await page.evaluate(()=>[...document.querySelectorAll('#paper .exam-sheet > p.lex-subquestion')]
   .map(n=>getComputedStyle(n).marginTop));
  zeros.forEach(value=>closeTo(value,0));
  const zeroXml=await wordXml(page);
  for(const item of items){
   const p=para(zeroXml,phrases[lang][item.kind]);
   assert(p.includes('w:before="0"')&&p.includes('w:after="0"'),
    file+': Word conserva espacio antiguo al seleccionar cero puntos');
  }
 }
 }finally{if(site)await site.close()}
}

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html']){
   const context=await browser.newContext({viewport:{width:1180,height:850}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(pathToFileURL(path.join(ROOT,file)).href,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.ExaminaVisualFormat&&!!window.ExaminaScoring?.rows);
    await latin4(page,file);
    await morph(page,file);
    await checkReviewLocaleAndContrast(page,file);
    await checkCourseThemeContrast(page,file);
    await latinLexSpacing(page,file);
    assert.deepEqual(errors,[],file+': excepciones JavaScript tras cambiar valores por pregunta');
   }finally{await context.close()}
  }
  console.log('OK: espaciado individual y valores generales por pregunta, listas/tablas, Word ES/VA, tres cursos, borradores y PWA sin regenerar.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
