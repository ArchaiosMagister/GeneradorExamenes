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
