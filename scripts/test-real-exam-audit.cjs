'use strict';
// Auditoría transversal con datos de los bancos REALES, no fixtures sintéticos.
// No modifica la aplicación, los bancos, la distribución offline ni main.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'test-artifacts');
const cases=[
 {course:'latin1',models:['tablas','morf','mixto']},
 {course:'latin4',models:['tablas']},
 {course:'greek1',models:['complete','morphology','translation']}
];
const report={
 schema:'examina-real-exam-audit/v1',
 date:'2026-11-14',
 source:'Banco real de index.html y offline.html (sin inventar soluciones)',
 limits:[
  'El navegador de CI no reemplaza Safari físico en iPhone/iPad.',
  'Se examina la estructura académica y el DOCX, no se certifica automáticamente la corrección filológica de cada respuesta.',
  'Para inspeccionar la serialización del DOCX, se aísla únicamente el bloqueo de evidencias docentes; no se concede autorización persistente a ninguna forma.',
  'Los apartados con huecos deliberados para el alumnado no se consideran preguntas incompletas.'
 ],
 cases:[],words:[],editors:[],issues:[]
};
const issue=(severity,where,detail)=>report.issues.push({severity,where,detail});
function entry(bytes,name){
 let off=0;
 while(off+30<=bytes.length&&bytes.readUInt32LE(off)===0x04034b50){
  const method=bytes.readUInt16LE(off+8),size=bytes.readUInt32LE(off+18);
  const length=bytes.readUInt16LE(off+26),extra=bytes.readUInt16LE(off+28);
  const filename=bytes.toString('utf8',off+30,off+30+length);
  const start=off+30+length+extra;
  assert(start+size<=bytes.length,'DOCX truncado: '+filename);
  if(filename===name){assert.equal(method,0,'Método ZIP inesperado');return bytes.toString('utf8',start,start+size)}
  off=start+size;
 }
 throw Error('No se encuentra '+name+' en DOCX');
}
async function unitsFor(page,course){
 return page.evaluate(course=>{
  const c=document.getElementById('course');
  c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  return [...document.querySelectorAll('#unitChoices .unit-choice')]
   .map(el=>units[Number(el.value)]).filter(u=>/^UD\d+(?:[–-]\d+)?$/.test(u));
 },course);
}
async function configure(page,course,model,unit,lang){
 return page.evaluate(({course,model,unit,lang})=>{
  const select=(id,value)=>{
   const el=document.getElementById(id);el.value=value;
   el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  select('course',course);select('model',model);select('lang',lang);
  document.getElementById('cumulative').checked=true;
  const selected=[...document.querySelectorAll('#unitChoices .unit-choice')];
  selected.forEach(el=>{el.checked=units[Number(el.value)]===unit});
  if(!selected.some(el=>el.checked))throw Error('Unidad inexistente: '+unit);
  examSelectionCache.clear();
  if(typeof greekExamState!=='undefined')greekExamState=null;
  generate();
  window.ExaminaScoring?.sync?.();
  const paper=document.getElementById('paper'),engine=window.ExaminaScoring;
  const qs=[...paper.querySelectorAll('.exam-question')];
  const rows=engine?.rows()||[];
  const total=engine?.total()??null;
  const check=document.getElementById('examFinalMode');
  check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));
  const definitive=engine.preflight();
  check.checked=false;check.dispatchEvent(new Event('change',{bubbles:true}));
  const draft=engine.preflight();
  const cultural=course==='latin4'?
    (examSelectionCache.get(examCacheSignature('culture'))||[]).map(x=>({id:x.id,units:x.units})):null;
  const tableCount=paper.querySelectorAll('table').length;
  const questions=qs.map(q=>({
   kind:q.dataset.examKind||q.dataset.morphKind||q.dataset.greekKind||'unknown',
   prompt:q.textContent.trim().slice(0,180),
   hasPoints:!!q.querySelector('.exam-question-points')||/\(\s*\d+(?:[,.]\d+)?\s*p\.\)/.test(q.textContent)
  }));
  const date=paper.querySelector('.exam-header-line:last-child span:last-child')?.textContent||'';
  const warnings=[...paper.querySelectorAll('.small.no-print')]
   .map(el=>el.textContent.trim()).filter(v=>/No hay|No s.han|Solo hay|Faltan|pendiente|revisi.n|Selecciona las normas/i.test(v));
  const pronounRows=[...paper.querySelectorAll('table.exam-pronouns tbody tr')].length;
  const greekForms=[...paper.querySelectorAll('.reference-analysis-item i, [data-analysis-slot] i')]
   .slice(0,3).map(el=>({form:el.textContent,context:el.parentElement?.textContent.slice(0,130)}));
  const lexParts=paper.querySelectorAll('.lex-subquestion[data-lex-kind]').length;
  return {course,model,unit,lang,effective:selectedUnits(),questions,questionCount:qs.length,
   scoreRows:rows.length,total,definitive:{ok:definitive.ok,total:definitive.total,normalized:definitive.normalized},
   draft:{ok:draft.ok,mode:draft.mode},detailErrors:engine.detailErrors?.()||[],
   hasSheet:!!paper.querySelector('.exam-sheet'),header:paper.querySelector('.exam-header')?.textContent.slice(0,180)||'',
   date,tableCount,pronounRows,greekForms,lexParts,cultural,warnings};
 },{course,model,unit,lang});
}
function inspect(row,file){
 const where=file+' '+row.course+'/'+row.model+'/'+row.unit+'/'+row.lang;
 report.cases.push({file,...row});
 if(!row.hasSheet||row.questionCount===0)issue('bloqueante',where,'Examen sin contenido imprimible');
 if(row.scoreRows!==row.questionCount)issue('bloqueante',where,'Número de preguntas y controles de puntuación no coincide');
 if(row.questions.some(q=>!q.hasPoints))issue('bloqueante',where,'Hay un enunciado sin puntuación visible');
 if(row.total===null||row.total<=0)issue('bloqueante',where,'Puntuación total ausente');
 if(row.definitive.normalized!==false)issue('bloqueante',where,'Reparto implícito en la validación definitiva');
 if(row.total!==1000&&row.definitive.ok)issue('bloqueante',where,'Permite definitivo con puntuación distinta de 10');
 if(!row.draft.ok)issue('bloqueante',where,'Un borrador no puede exportarse');
 if(row.date!==(row.lang==='va'?'Data: ':'Fecha: '))issue('bloqueante',where,'Encabezado de fecha mal localizado: '+JSON.stringify(row.date));
 if(row.total!==1000)issue('revisión',where,'Puntuación inicial '+(row.total/100).toFixed(2)+'; para definitivo requiere ajuste docente');
 for(const warning of row.warnings)issue('revisión',where,'Aviso curricular: '+warning.slice(0,250));
 if(row.course==='latin4'&&row.cultural){
  for(const c of row.cultural)if(c.units&&!c.units.includes(row.unit))
   issue('bloqueante',where,'Cultura de unidad ajena: '+c.id);
  if(row.cultural.some(c=>c.id&&!c.id.includes('-'+row.unit+'-')))
   issue('bloqueante',where,'Código de cultura ajeno a '+row.unit);
 }
 if(row.course==='latin1'&&row.questions.some(q=>q.kind==='pronouns')&&
  Number((row.unit.match(/\d+/)||[0])[0])>=6&&row.pronounRows!==10)
  issue('revisión',where,'Esperados 10 pronombres; generados '+row.pronounRows);
 if(row.course==='latin1'&&row.model!=='morf'&&row.lexParts>0&&row.lexParts<2)
  issue('revisión',where,'Léxico con menos de dos alternativas disponibles');
 if(row.course==='greek1'&&row.model==='morphology'&&row.greekForms.some(x=>/\(\s*\)/.test(x.context||'')))
  issue('bloqueante',where,'Enunciado griego vacío junto a forma');
}
async function word(page,file,course,model,unit,lang){
 const where=file+' '+course+'/'+model+'/'+unit+'/'+lang;
 const selected=await configure(page,course,model,unit,lang);
 const exported=await page.evaluate(async()=>{
  const review=window.ExaminaTeacherReview;
  const old=review?.evidenceMayExport;
  let blob,name;
  const original=downloadBlob;
  try{
   if(review)review.evidenceMayExport=()=>true;
   downloadBlob=(filename,value)=>{name=filename;blob=value};
   document.getElementById('docx').click();
  }finally{
   downloadBlob=original;
   if(review)review.evidenceMayExport=old;
  }
  if(!blob)throw Error('El exportador real no produjo DOCX');
  return {name,bytes:Array.from(new Uint8Array(await blob.arrayBuffer()))};
 });
 const bytes=Buffer.from(exported.bytes),xml=entry(bytes,'word/document.xml'),styles=entry(bytes,'word/styles.xml');
 assert(exported.name.endsWith('.docx'),where+' nombre Word inválido');
 assert(xml.includes('<w:document')&&xml.includes('<w:body>')&&xml.includes('<w:sectPr>'),where+' XML Word incompleto');
 assert(styles.includes('Palatino'),where+' estilo Word cambiado');
 assert(xml.includes((lang==='va'?'Data: ':'Fecha: ')),where+' etiqueta Fecha/Data ausente del Word');
 assert(xml.includes('p.).'),where+' puntuación de pregunta ausente del Word');
 if(selected.tableCount)assert(xml.includes('<w:tbl>'),where+' desaparecieron tablas en Word');
 if(course==='greek1'&&selected.tableCount)assert(!xml.includes('<w:i/>'),where+' griego en cursiva Word');
 if(xml.includes('exam-subscore')||xml.includes('data-exam-subscore'))
  issue('bloqueante',where,'Controles docentes internos filtrados al Word');
 const filename=['examen',course,model,unit.replace(/[^a-zA-Z0-9]/g,''),lang,file==='index.html'?'online':'offline'].join('-')+'.docx';
 if(file==='index.html'){
  fs.writeFileSync(path.join(artifacts,filename),bytes);
 }
 report.words.push({file,course,model,unit,lang,filename:file==='index.html'?filename:null,bytes:bytes.length,
  hasTables:!!selected.tableCount,questionCount:selected.questionCount});
}
async function edit(page,file,course,model,unit){
 const where=file+' '+course+'/'+model+'/'+unit;
 await configure(page,course,model,unit,'es');
 const editor=page.locator('#examQuestionMenus .question-editor input[data-exam-editor-link]').first();
 if(!await editor.count()){
  issue('revisión',where,'No hay editor genérico vinculado que probar; revisar categorías específicas');
  return;
 }
 await editor.evaluate(el=>{for(let node=el;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true});
 const key=await editor.getAttribute('data-exam-editor-link');
 const target=page.locator('#paper [data-exam-editor-link="'+key+'"]');
 if(await target.count()!==1){issue('bloqueante',where,'Editor sin nodo de vista previa único: '+key);return}
 const before=await page.evaluate(key=>({
  root:document.querySelector('#paper .exam-sheet'),
  cache:[...examSelectionCache],
  others:[...document.querySelectorAll('#paper [data-exam-editor-link]')]
    .filter(el=>el.dataset.examEditorLink!==key)
    .map(el=>[el.dataset.examEditorLink,el.textContent])
 }),key);
 const replacement=course==='greek1'?'δοκιμή':'probāre';
 await editor.fill(replacement);
 const after=await page.evaluate(key=>({
  editor:document.querySelector('#examQuestionMenus input[data-exam-editor-link="'+key+'"]')?.value,
  target:document.querySelector('#paper [data-exam-editor-link="'+key+'"]')?.textContent,
  others:[...document.querySelectorAll('#paper [data-exam-editor-link]')]
   .filter(el=>el.dataset.examEditorLink!==key)
   .map(el=>[el.dataset.examEditorLink,el.textContent])
 }),key);
 if(!String(after.target).includes(replacement))issue('bloqueante',where,'Menú no actualizó la vista previa');
 if(JSON.stringify(after.others)!==JSON.stringify(before.others))issue('bloqueante',where,'Edición aislada modificó otras formas');
 const back=course==='greek1'?'λόγος':'puella';
 await target.evaluate((el,value)=>{
  el.textContent=value;
  el.dispatchEvent(new InputEvent('input',{bubbles:true}));
 },back);
 const synced=await editor.inputValue();
 if(synced!==back)issue('bloqueante',where,'Vista previa no actualizó el editor: '+synced);
 report.editors.push({file,course,model,unit,key,menuToPreview:String(after.target).includes(replacement),
  otherSlotsStable:JSON.stringify(after.others)===JSON.stringify(before.others),previewToMenu:synced===back});
}
async function runFile(browser,file){
 const context=await browser.newContext({viewport:{width:1360,height:920},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(pathToFileURL(path.join(root,file)).href,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.ExaminaScoring?.preflight&&!!document.getElementById('unitChoices'),null,{timeout:20000});
  for(const group of cases){
   const list=await unitsFor(page,group.course);
   assert(list.length>0,file+' '+group.course+' sin unidades');
   for(const model of group.models){
    for(const unit of list){
     for(const lang of ['es','va']){
      try{inspect(await configure(page,group.course,model,unit,lang),file)}
      catch(e){issue('bloqueante',file+' '+group.course+'/'+model+'/'+unit+'/'+lang,'Excepción: '+e.message)}
     }
    }
   }
  }
  for(const group of cases){
   const list=await unitsFor(page,group.course);
   const mid=list.find(x=>x==='UD7')||list[Math.floor(list.length/2)];
   for(const model of group.models){
    for(const lang of ['es','va']){
     try{await word(page,file,group.course,model,mid,lang)}
     catch(e){issue('bloqueante',file+' Word '+group.course+'/'+model+'/'+lang,e.message)}
    }
    try{await edit(page,file,group.course,model,mid)}
    catch(e){issue('bloqueante',file+' edición '+group.course+'/'+model,e.message)}
   }
  }
 }finally{
  if(errors.length)issue('bloqueante',file,'Errores JavaScript: '+errors.join(' | ').slice(0,1500));
  await context.close();
 }
}
(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
 try{for(const file of ['index.html','offline.html'])await runFile(browser,file)}
 finally{await browser.close()}
 fs.writeFileSync(path.join(artifacts,'auditoria-examenes-reales-20261114.json'),JSON.stringify(report,null,2)+'\n');
 const n=severity=>report.issues.filter(x=>x.severity===severity).length;
 console.log('Auditoría de exámenes reales: '+report.cases.length+' combinaciones; '+report.words.length+
  ' DOCX; '+report.editors.length+' pruebas de edición; '+n('bloqueante')+
  ' bloqueantes y '+n('revisión')+' observaciones para revisión docente.');
 for(const item of report.issues.slice(0,35))console.log('['+item.severity+'] '+item.where+': '+item.detail);
 if(n('bloqueante'))process.exitCode=1;
})().catch(error=>{
 console.error(error);
 fs.mkdirSync(artifacts,{recursive:true});
 issue('bloqueante','ejecución',error.stack||error.message);
 fs.writeFileSync(path.join(artifacts,'auditoria-examenes-reales-20261114.json'),JSON.stringify(report,null,2)+'\n');
 process.exitCode=1;
});
