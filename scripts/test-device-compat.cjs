'use strict';
// Revisión de integración V→VI: Safari/WebKit y Android/Chromium simulados.
// No sustituye la inspección de un iPhone o iPad físicos.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
const PREFIX='/GeneradorExamenes/';
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8',
 '.png':'image/png','.css':'text/css; charset=utf-8'};
const profiles=[
 {engine:'webkit',name:'Safari iPhone vertical',width:390,height:844,mobile:true,expectedTabs:true},
 {engine:'webkit',name:'Safari iPhone horizontal',width:844,height:390,mobile:true,expectedTabs:true},
 {engine:'webkit',name:'Safari iPad vertical',width:820,height:1180,mobile:true,expectedTabs:true},
 {engine:'webkit',name:'Safari iPad horizontal',width:1180,height:820,mobile:true,expectedTabs:false},
 {engine:'webkit',name:'Safari escritorio',width:1366,height:900,mobile:false,expectedTabs:false},
 {engine:'chromium',name:'Android vertical',width:412,height:915,mobile:true,expectedTabs:true},
 {engine:'chromium',name:'Android horizontal',width:915,height:412,mobile:true,expectedTabs:true}
];
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith(PREFIX)){res.writeHead(404);res.end();return}
 const rel=url.pathname.slice(PREFIX.length)||'index.html';
 const target=path.resolve(ROOT,rel);
 if(target!==ROOT&&!target.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return}
 try{
  const body=await fs.readFile(target);
  res.writeHead(200,{'content-type':TYPES[path.extname(target)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(body);
 }catch{res.writeHead(404);res.end()}
});
const serving=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const closeServer=()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));

function zipXml(bytes,wanted='word/document.xml'){
 const data=Buffer.from(bytes);let position=0;
 while(position+30<=data.length&&data.readUInt32LE(position)===0x04034b50){
  const method=data.readUInt16LE(position+8),size=data.readUInt32LE(position+18);
  const nameLen=data.readUInt16LE(position+26),extraLen=data.readUInt16LE(position+28);
  const name=data.toString('utf8',position+30,position+30+nameLen);
  const content=position+30+nameLen+extraLen;
  assert(content+size<=data.length,'ZIP truncado');
  if(name===wanted){assert.equal(method,0,'DOCX sin compatibilidad ZIP básica');return data.toString('utf8',content,content+size)}
  position=content+size;
 }
 throw Error('Falta word/document.xml en DOCX');
}

async function word(page){
 const bytes=await page.evaluate(async()=>{
  const original=downloadBlob;let blob;
  try{
   document.getElementById('examFinalMode').checked=false;
   downloadBlob=(_name,data)=>{blob=data};
   exportWord(false);
  }finally{downloadBlob=original}
  if(!blob)throw Error('No se generó documento Word');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
 });
 const doc=zipXml(bytes);
 assert(doc.includes('<w:document')&&doc.includes('<w:sectPr'),'DOCX mal formado');
 assert(!doc.includes('exam-subpoint-label'),'Se exportó un control docente');
 return doc;
}
async function getState(page){
 return page.evaluate(()=>{
  const shown=id=>{
   const node=document.getElementById(id);
   if(!node)return false;
   const cs=getComputedStyle(node),box=node.getBoundingClientRect();
   return cs.display!=='none'&&cs.visibility!=='hidden'&&box.width>0&&box.height>0;
  };
  const layout=document.getElementById('examLayout'),tabs=document.getElementById('examMobileTabs');
  const box=layout.getBoundingClientRect();
  return {
   tabs:shown('examMobileTabs'),panel:shown('examEditorPanel'),paper:shown('paper'),
   active:layout.dataset.examTab,layoutWidth:box.width,viewportWidth:innerWidth,
   tabHeight:tabs.querySelector('button').getBoundingClientRect().height,
   questions:window.ExaminaScoring?.rows()?.length||0,
   details:window.ExaminaScoring?.details()?.flatMap(q=>q.groups).length||0,
   errors:window.ExaminaScoring?.detailErrors()?.length,
   theme:document.documentElement.dataset.appearance
  };
 });
}
async function checkQuestionLayout(page,p,filename){
 const profiles=['Safari escritorio','Safari iPad vertical','Android vertical'];
 if(!profiles.includes(p.name))return;
 if(p.expectedTabs)await page.locator('#examQuestionsTab').click();
 else await page.locator('#examPanelShortcuts>[data-target="examQuestionSettings"]').click();
 const menu=page.locator('#examQuestionMenus');
 const combinations=[
  ['latin1','tablas','UD4'],['latin1','morf','UD4'],['latin1','mixto','UD4'],
  ['latin4','tablas','UD4'],['greek1','complete','UD10'],['greek1','morphology','UD10']
 ];
 for(const [course,model,unit] of combinations){
  await page.evaluate(({course,model,unit})=>{
   const change=(id,value)=>{
    const input=document.getElementById(id);
    input.value=value;
    input.dispatchEvent(new Event('change',{bubbles:true}));
   };
   change('course',course);
   change('model',model);
   const selectors=[...document.querySelectorAll('#unitChoices .unit-choice')];
   const selected=selectors.find(el=>units[Number(el.value)]===unit);
   if(!selected)throw Error('Unidad no disponible: '+unit);
   for(const input of selectors)input.checked=input===selected;
   selected.dispatchEvent(new Event('change',{bubbles:true}));
  },{course,model,unit});
  const headings=menu.locator('details[data-included="true"] > summary.exam-question-heading');
  assert(await headings.count(),course+'/'+model+': ninguna pregunta incluida');
  const first=headings.first();
  const cards=menu.locator(':scope > details');
  await cards.evaluateAll(items=>items.forEach(el=>el.open=false));
  await first.click({position:{x:42,y:14}});
  assert(await first.evaluate(el=>el.parentElement.open),'El primer desplegable no se abre');
  if(await headings.count()>1){
   const second=headings.nth(1);
   await second.click({position:{x:42,y:14}});
   assert(await second.evaluate(el=>el.parentElement.open),'El segundo desplegable no se abre');
   assert(await first.evaluate(el=>el.parentElement.open),'Se cerró otro desplegable');
   await second.click({position:{x:42,y:14}});
   assert(await second.evaluate(el=>!el.parentElement.open),'El segundo desplegable no se cierra');
  }
  await cards.evaluateAll(items=>items.forEach(el=>el.open=el.dataset.included==='true'));
  for(const theme of ['light','dark','oled']){
   await page.locator('#appearanceMode').selectOption(theme);
   const issues=await menu.evaluate(el=>{
    const errors=[];
    const box=el.getBoundingClientRect();
    const visible=node=>node.getClientRects().length&&node.getBoundingClientRect().height>0;
    if(el.scrollWidth>el.clientWidth+1)errors.push('menú desbordado');
    el.querySelectorAll('input:not([type=hidden]),select,textarea,button,summary').forEach(node=>{
     if(!visible(node))return;
     const rect=node.getBoundingClientRect();
     if(rect.left<box.left-1||rect.right>box.right+1)errors.push(node.outerHTML.slice(0,160));
    });
    el.querySelectorAll('.exam-regenerate-word,.lex-word-control>button').forEach(button=>{
     if(!visible(button))return;
     const input=button.parentElement.querySelector('input[type=text]');
     const field=input.getBoundingClientRect(),action=button.getBoundingClientRect();
     if(Math.abs(field.bottom-action.bottom)>1||field.right>action.left)
      errors.push('campo y sustitución en filas distintas');
     if(!button.getAttribute('aria-label')||!button.title)errors.push('sustitución sin descripción');
    });
    return errors;
   });
   const label=[p.name,filename,course,model,theme].join(' ');
   assert.deepEqual(issues,[],label);
   if(process.env.QUESTION_SCREENSHOTS&&filename==='index.html'){
    const name=[p.engine,p.width,course,model,theme].join('-')+'.png';
    await headings.evaluateAll(items=>items.slice(1).forEach(el=>el.parentElement.open=false));
    await menu.screenshot({path:path.join(process.env.QUESTION_SCREENSHOTS,name)});
    await headings.evaluateAll(items=>items.slice(1).forEach(el=>el.parentElement.open=true));
   }
  }
 }
 console.log('Diseño de Preguntas comprobado en',p.name,filename,'6 modelos × 3 apariencias');
}

async function checkProfile(browser,p,filename,origin){
 const context=await browser.newContext({
  viewport:{width:p.width,height:p.height},hasTouch:p.mobile,isMobile:p.mobile,
  deviceScaleFactor:p.mobile?2:1,acceptDownloads:true
 });
 const page=await context.newPage(),exceptions=[];
 page.on('pageerror',err=>exceptions.push(err.message));
 try{
  await page.goto(origin+PREFIX+filename,{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>!!window.ExaminaScoring?.details&&
   document.querySelectorAll('#paper .exam-question').length>0,{timeout:30000});
  await page.evaluate(()=>{
   const c=document.getElementById('course');c.value='latin1';
   c.dispatchEvent(new Event('change',{bubbles:true}));
   const m=document.getElementById('model');m.value='tablas';
   m.dispatchEvent(new Event('change',{bubbles:true}));
   for(const x of document.querySelectorAll('#unitChoices .unit-choice'))
    x.checked=units[Number(x.value)]==='UD4';
   document.querySelector('#unitChoices .unit-choice:checked')
    ?.dispatchEvent(new Event('change',{bubbles:true}));
   generate();
  });
  await page.waitForFunction(()=>window.ExaminaScoring?.rows()?.length>0);
  const initial=await getState(page);
  assert.equal(initial.tabs,p.expectedTabs,filename+' '+p.name+': pestañas incorrectas');
  assert(initial.questions>0&&initial.details>0,filename+' '+p.name+': sin examen o desglose');
  assert(initial.layoutWidth<=initial.viewportWidth+2,
   filename+' '+p.name+': desborda el contenedor');
  assert.equal(initial.errors,0,filename+' '+p.name+': el desglose inicial no cuadra');
  if(p.expectedTabs){
   assert(initial.tabHeight>=44,filename+' '+p.name+': objetivo táctil menor de 44 píxeles');
   await page.locator('#examQuestionsTab').click();
   const questions=await getState(page);
   assert.equal(questions.active,'questions',filename+' '+p.name+': no cambia a Preguntas');
   assert(questions.panel&&!questions.paper,'Error de visibilidad en Preguntas');
   await page.locator('#examPreviewTab').click();
   const preview=await getState(page);
   assert.equal(preview.active,'preview',filename+' '+p.name+': no cambia a Vista previa');
   assert(preview.paper&&!preview.panel,'Error de visibilidad en Vista previa');
   await page.locator('#examSettingsTab').click();
  }else assert(initial.paper&&initial.panel,'El escritorio/iPad ancho pierde paneles');
  // La navegación no modifica ni duplica el examen ni sus puntuaciones.
  const stable=await page.evaluate(()=>({
   score:window.ExaminaScoring.total(),
   nodes:document.querySelectorAll('#paper .exam-sheet').length,
   scoreKeys:Object.keys(window.ExaminaScoring.snapshot()).length
  }));
  assert.equal(stable.nodes,1,filename+' '+p.name+': hoja duplicada');
  if(p.expectedTabs){
   await page.locator('#examQuestionsTab').click();
   await page.locator('#examPreviewTab').click();
   await page.locator('#examSettingsTab').click();
  }
  const after=await page.evaluate(()=>({
   score:window.ExaminaScoring.total(),nodes:document.querySelectorAll('#paper .exam-sheet').length,
   scoreKeys:Object.keys(window.ExaminaScoring.snapshot()).length
  }));
  assert.deepEqual(after,stable,filename+' '+p.name+': navegación destructiva');
  // La hoja académica no debe quedar oculta al imprimir desde Configuración.
  await page.emulateMedia({media:'print'});
  assert(await page.evaluate(()=>{
   const paper=getComputedStyle(document.getElementById('paper')).display;
   return paper!=='none'&&getComputedStyle(document.getElementById('examMobileTabs')).display==='none';
  }),filename+' '+p.name+': impresión incompleta');
  await page.emulateMedia({media:'screen'});
  if(p.mobile){
   // En WebKit la apariencia OLED y los botones deben mantener la paleta oscura.
   await page.locator('#appearanceMode').selectOption('dark');
   const dark=await page.evaluate(()=>getComputedStyle(document.querySelector('.vocab-tabbar button:not(.active)')).backgroundColor);
   await page.locator('#appearanceMode').selectOption('oled');
   const oled=await page.evaluate(()=>({
    button:getComputedStyle(document.querySelector('.vocab-tabbar button:not(.active)')).backgroundColor,
    bg:getComputedStyle(document.body).backgroundColor
   }));
   assert.equal(oled.button,dark,filename+' '+p.name+': OLED alteró el color de los botones');
   assert.equal(oled.bg,'rgb(0, 0, 0)',filename+' '+p.name+': OLED sin negro puro');
  }
  if(p.name==='Safari iPhone vertical'||p.name==='Android vertical'){
   const previous=await word(page);
   await page.locator('#examQuestionsTab').click();
   await page.locator('#examPreviewTab').click();
   const next=await word(page);
   assert.equal(next,previous,filename+' '+p.name+': cambiar de pestaña alteró DOCX');
   // El HTML autónomo debe seguir operando una vez que el navegador pierde la red.
   if(filename==='offline.html'){
    await context.setOffline(true);
    await page.locator('#examSettingsTab').click();
    await page.locator('#examQuestionsTab').click();
    await page.locator('#examPreviewTab').click();
    assert.equal((await getState(page)).paper,true,'El HTML offline necesita red para mostrar examen');
    await context.setOffline(false);
   }
  }
  if(p.name==='Safari iPad vertical'){
   // Interacción táctil real de Playwright sobre WebKit con una edición previa.
   // No reemplaza la prueba de Safari en hardware Apple.
   await page.locator('#examQuestionsTab').tap();
   await page.locator('#examPreviewTab').tap();
   const edit=await page.evaluate(()=>{
    const paper=document.getElementById('paper');
    const verb=paper.querySelector('.exam-verbs thead tr:first-child th[colspan] i')||
     paper.querySelector('.exam-nouns thead tr:first-child th[colspan] i');
    const sentence=paper.querySelector('.exam-sentences [data-sentence-slot]');
    if(!verb||!sentence)throw Error('Faltan dos superficies académicas para editar');
    verb.textContent+=' EDITADO_WEBKIT_IPAD';
    verb.dispatchEvent(new InputEvent('input',{bubbles:true}));
    sentence.textContent='Puella in villa laborat. EDITADA_WEBKIT_IPAD';
    sentence.dispatchEvent(new InputEvent('input',{bubbles:true}));
    document.getElementById('saveDraft').click();
    const saved=JSON.parse(localStorage.getItem('examina_draft_v14')||'null');
    const before=paper.querySelectorAll('[data-analysis-slot],.exam-form').length;
    const count=document.getElementById('count-forms');
    count.value=String(Number(count.value)+1);
    count.dispatchEvent(new Event('change',{bubbles:true}));
    return {
     saved:!!saved?.html?.includes('EDITADO_WEBKIT_IPAD')&&
      saved.html.includes('EDITADA_WEBKIT_IPAD'),
     stable:paper.textContent.includes('EDITADO_WEBKIT_IPAD')&&
      paper.textContent.includes('EDITADA_WEBKIT_IPAD'),
     before,after:paper.querySelectorAll('[data-analysis-slot],.exam-form').length
    };
   });
   assert(edit.saved&&edit.stable,filename+': WebKit iPad perdió dos cambios manuales');
   assert(edit.after>edit.before,filename+': WebKit iPad no redimensionó el análisis');
   const editedWord=await word(page);
   assert(editedWord.includes('EDITADO_WEBKIT_IPAD')&&editedWord.includes('EDITADA_WEBKIT_IPAD'),
    filename+': Word en WebKit iPad perdió las ediciones manuales');
   const restored=await page.evaluate(()=>{
    document.getElementById('restoreDraft').click();
    const paper=document.getElementById('paper');
    return {
     stable:paper.textContent.includes('EDITADO_WEBKIT_IPAD')&&
      paper.textContent.includes('EDITADA_WEBKIT_IPAD'),
     forms:paper.querySelectorAll('[data-analysis-slot],.exam-form').length
    };
   });
   assert(restored.stable&&restored.forms===edit.before,
    filename+': Safari iPad no recuperó el borrador con ambas ediciones');
   if(filename==='index.html'){
    // El motor de 946 KB no se ejecuta al abrir; Safari lo carga desde un
    // clic real de exportación después de conservar ediciones y borradores.
    assert.equal(await page.evaluate(()=>typeof window.html2pdf),'undefined',
     'El motor PDF cargó antes de solicitarlo en Safari iPad');
    await page.evaluate(()=>{
     const type=document.getElementById('sheetType');
     type.value='review';type.dispatchEvent(new Event('change',{bubbles:true}));
     // Aislar el motor PDF de las verificaciones filológicas ya ensayadas.
     if(window.ExaminaTeacherReview)window.ExaminaTeacherReview.evidenceMayExport=()=>true;
     if(window.ExaminaScoring)window.ExaminaScoring.canExport=()=>true;
    });
    const pendingPdf=page.waitForEvent('download',{timeout:120000});
    await page.locator('#pdfDownload').click();
    const pdf=await pendingPdf;
    const pdfBytes=await fs.readFile(await pdf.path());
    assert.equal(pdfBytes.subarray(0,5).toString('ascii'),'%PDF-',
     'Safari iPad WebKit descargó un PDF inválido');
    assert(pdfBytes.length>10000,'Safari iPad WebKit: PDF incompleto');
    assert.equal(await page.evaluate(()=>typeof window.html2pdf),'function',
     'Safari iPad WebKit no ejecutó el motor PDF tras solicitarlo');
   }
  }
  await checkQuestionLayout(page,p,filename);
  assert.deepEqual(exceptions,[],filename+' '+p.name+': excepciones JavaScript');
  console.log('OK',p.name,filename,'preguntas',initial.questions,'subapartados',initial.details);
 }finally{await context.close()}
}
(async()=>{
 await serving();
 const origin='http://127.0.0.1:'+server.address().port;
 const browsers={};
 try{
  for(const p of profiles){
   if(!browsers[p.engine])browsers[p.engine]=await ({chromium,webkit}[p.engine]).launch({headless:true});
   for(const filename of ['index.html','offline.html'])
    await checkProfile(browsers[p.engine],p,filename,origin);
  }
  console.log('Compatibilidad comprobada: WebKit Safari simulado y Android Chromium; 14 combinaciones.');
 }finally{
  await Promise.all(Object.values(browsers).map(b=>b.close()));
  await closeServer();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
