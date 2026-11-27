'use strict';
// Auditoría transversal con datos de los bancos REALES, no fixtures sintéticos.
// No modifica la aplicación, los bancos, la distribución offline ni main.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

const root=path.resolve(__dirname,'..');
const artifacts=path.join(root,'test-artifacts');
// Sirve el archivo web con origen HTTP: file:// bloquea la lectura de bancos JSON
// externos y produce exámenes artificialmente incompletos.
const server=http.createServer((request,response)=>{
 let url;
 try{url=new URL(request.url||'/', 'http://127.0.0.1')}
 catch{response.writeHead(400).end();return}
 let requested;
 try{requested=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html'}
 catch{response.writeHead(400).end();return}
 const filename=path.resolve(root,requested);
 if(!filename.startsWith(root+path.sep)){response.writeHead(403).end();return}
 fs.readFile(filename,(error,bytes)=>{
  if(error){response.writeHead(404).end();return}
  const type=filename.endsWith('.html')?'text/html':
   filename.endsWith('.js')||filename.endsWith('.mjs')?'text/javascript':
   filename.endsWith('.json')?'application/json':
   filename.endsWith('.webmanifest')?'application/manifest+json':
   filename.endsWith('.png')?'image/png':'application/octet-stream';
  response.setHeader('Content-Type',type+'; charset=utf-8');
  response.end(bytes);
 });
});
const cases=[
 {course:'latin1',models:['tablas','morf','mixto']},
 {course:'latin4',models:['tablas']},
 {course:'greek1',models:['complete','morphology']}
];
const report={
 schema:'examina-real-exam-audit/v1',
 date:'2026-11-14',
 source:'Banco real de index.html y offline.html (sin inventar soluciones)',
 limits:[
  'El navegador de CI no reemplaza Safari físico en iPhone/iPad.',
  'Se examina la estructura académica y el DOCX, no se certifica automáticamente la corrección filológica de cada respuesta.',
  'Se generan exámenes desde un perfil limpio y se mantienen activos los filtros de evidencias y puntuación.',
  'Los apartados con huecos deliberados para el alumnado no se consideran preguntas incompletas.',
  'index.html se prueba servido vía HTTP local; offline.html mantiene bancos integrados.',
  'Se comprueban todas las unidades por separado y acumuladas; Word se serializa en primera, última e intermedia por modelo e idioma.'
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
async function configure(page,course,model,unit,lang,cumulative=true){
 return page.evaluate(({course,model,unit,lang,cumulative})=>{
  const select=(id,value)=>{
   const el=document.getElementById(id);el.value=value;
   el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  select('course',course);select('model',model);select('lang',lang);
  document.getElementById('cumulative').checked=cumulative;
  const selected=[...document.querySelectorAll('#unitChoices .unit-choice')];
  const chosen=Array.isArray(unit)?unit:[unit];
  selected.forEach(el=>{el.checked=chosen.includes(units[Number(el.value)])});
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
  const lexNodes=[...paper.querySelectorAll('.lex-subquestion[data-lex-kind]')];
  const lexParts=lexNodes.length;
  const lexLetters=lexNodes.map(el=>el.querySelector('.exam-letter')?.textContent.trim());
  const sentenceSlots=[...paper.querySelectorAll('[data-sentence-slot]')];
  const blankSentenceSlots=sentenceSlots.filter(el=>!el.textContent.trim()).length;
  const code={latin1:'lat1',latin4:'lat4',greek1:'gr1'}[course];
  const evidence=window.ExaminaTeacherReview.evidenceCheckExam(paper,code);
  const authorized=paper.querySelectorAll('[data-academic-key]').length;
  // Inventario de términos distintos realmente elegibles. No se amplían bancos
  // ni se fuerzan cuotas imposibles: las insuficiencias se notifican para revisión.
  const poolCapacity={};
  const chosenUnits=selectedUnits();
  const morph=['morf','morphology'].includes(model);
  const put=(kind,rows,key,requested)=>{
   const distinct=new Set(rows.map(key).filter(Boolean)).size;
   poolCapacity[kind]={distinct,requested,spare:distinct-requested};
  };
  const cfg=morph?morphConfig():null;
  if(course==='greek1'){
   const mapping={decl:'declension',verb:'conjugation',forms:'forms',pronouns:'pronouns'};
   const counts=morph?null:greekCompleteCounts();
   for(const [kind,corpusKind] of Object.entries(mapping)){
    if(!examQuestionEnabled(kind))continue;
    const pool=morph?greekMorphologyReplacementPool(kind):greekChoicePool(corpusKind);
    const requested=morph?({decl:cfg.offer,verb:cfg.verbs,forms:cfg.words,pronouns:10})[kind]:counts[corpusKind];
    put(kind,pool,x=>kind==='decl'&&morph?x.title:kind==='verb'&&morph?
     normLex(x.prompt)+'|'+normLex(x.lemma):kind==='forms'||kind==='pronouns'?normLex(x.prompt):x.id,requested);
    if(kind==='forms'){
     const quotas=Object.fromEntries(['nouns','adjectives','verbs','pronouns'].map((category,i)=>[
      category,{distinct:new Set(pool.filter(x=>examGreekWordClass(x)===category).map(x=>normLex(x.prompt)).filter(Boolean)).size,
       requested:examMorphQuotaValues()[i]}]));
     poolCapacity.formCategories=quotas;
    }
   }
  }else{
   if(examQuestionEnabled('decl'))put('decl',morph?latinMorphSyntagmPool(chosenUnits):latinCompleteDeclensionItems(chosenUnits),
    x=>morph?x.title:examKey(x.x.entry),morph?cfg.offer:Math.min(3,countFor('decl')));
   if(examQuestionEnabled('verb'))put('verb',morph?latinMorphologyVerbPool(chosenUnits):latin4ConjugationPool(chosenUnits),
    x=>morph?normLex(x.form)+'|'+examKey(x.entry):examKey(x.x.entry),morph?cfg.verbs:Math.min(3,countFor('verb')));
   if(examQuestionEnabled('forms')){
    const groups=latinExamFormCandidates(chosenUnits,true);
    put('forms',groups.flat(),x=>normLex(x.form),morph?cfg.words:countFor('forms'));
    poolCapacity.formCategories=Object.fromEntries(['nouns','adjectives','verbs','pronouns'].map((category,i)=>[
     category,{distinct:new Set(groups[i].map(x=>normLex(x.form)).filter(Boolean)).size,requested:examMorphQuotaValues()[i]}]));
   }
   if(examQuestionEnabled('pronouns'))put('pronouns',latinExamPronouns(chosenUnits),x=>normLex(x.form),10);
   if(course==='latin4'){
    for(const kind of ['latin4-nominal-decl','latin4-nominal-stem'])
     if(examQuestionAvailable(kind))put(kind,latin4NominalPromptPool(kind,chosenUnits),x=>examKey(x[0]),6);
    if(examQuestionAvailable('latin4-nominal-table')){
     const pool=latinThirdDeclensionPool(chosenUnits);
     put('latin4-nominal-table',pool,x=>x.lemma,latin4ThirdSettings.count);
    }
   }
  }
  return {course,model,unit,lang,cumulative,evidence,authorized,poolCapacity,selectedRaw:selectedUnits(false),effective:selectedUnits(),questions,questionCount:qs.length,
   scoreRows:rows.length,scoreDetails:rows.map(x=>({kind:x.key.split('/').pop().replace(/#\\d+$/,''),points:x.points})),
   total,definitive:{ok:definitive.ok,mode:definitive.mode,total:definitive.total,normalized:definitive.normalized},
   draft:{ok:draft.ok,mode:draft.mode},detailErrors:engine.detailErrors?.()||[],
   hasSheet:!!paper.querySelector('.exam-sheet'),header:paper.querySelector('.exam-header')?.textContent.slice(0,180)||'',
   date,tableCount,pronounRows,greekForms,lexParts,lexLetters,sentenceSlots:sentenceSlots.length,blankSentenceSlots,cultural,warnings};
 },{course,model,unit,lang,cumulative});
}
function inspect(row,file){
 const where=file+' '+row.course+'/'+row.model+'/'+row.unit+'/'+row.lang+(row.cumulative?'/acumulativo':'/solo-UD');
 report.cases.push({file,...row});
 for(const [kind,pool] of Object.entries(row.poolCapacity||{})){
  if(kind==='formCategories')continue;
  if(pool.requested>0&&pool.distinct<pool.requested)
   issue('revisión',where,'Banco '+kind+': '+pool.distinct+' términos para '+pool.requested+' casillas');
  else if(pool.requested>0&&pool.spare===0)
   issue('revisión',where,'Banco '+kind+': no quedan términos alternativos al completar las casillas');
 }
 const selected=Array.isArray(row.unit)?row.unit:[row.unit];
 if(JSON.stringify(row.selectedRaw)!==JSON.stringify(selected))
  issue('bloqueante',where,'El selector no mantiene las unidades marcadas');
 if(!row.cumulative&&JSON.stringify(row.effective)!==JSON.stringify(selected))
  issue('bloqueante',where,'Selección aplicada distinta con acumulación desactivada: '+JSON.stringify(row.effective));
 if(!row.evidence.ok||row.authorized!==0)
  issue('bloqueante',where,'El sorteo sin permisos docentes incluye formas que requieren autorización');
 if(!row.hasSheet||row.questionCount===0)issue('bloqueante',where,'Examen sin contenido imprimible');
 if(row.scoreRows!==row.questionCount)issue('bloqueante',where,'Número de preguntas y controles de puntuación no coincide');
 if(row.questions.some(q=>!q.hasPoints))issue('bloqueante',where,'Hay un enunciado sin puntuación visible');
 if(row.total===null||row.total<=0)issue('bloqueante',where,'Puntuación total ausente');
 if(row.definitive.normalized!==false)issue('bloqueante',where,'Reparto implícito en la validación definitiva');
 const morph=['morf','morphology'].includes(row.model);
 if(morph){
  if(!row.definitive.ok||row.definitive.mode!=='parcial'||
     row.scoreDetails.some(x=>x.points!==100)||row.total!==row.questionCount*100)
   issue('bloqueante',where,'Prueba parcial morfológica: no respeta 1 p. por pregunta');
 }else if(row.total!==1000||!row.definitive.ok)
  issue('bloqueante',where,'Examen completo no alcanza los 10 puntos definitivos');
 if(row.course==='latin4'&&['UD9','UD10'].includes(row.unit)){
  if(row.questions.some(x=>x.kind==='culture')||row.cultural?.length||
     row.warnings.some(x=>/cultura|culture/i.test(x)))
   issue('bloqueante',where,'Cultura aparece o genera aviso en UD9/10');
  if(row.total!==1000||['decl','verb','forms'].some(kind=>
     row.scoreDetails.find(x=>x.kind===kind)?.points!==100))
   issue('bloqueante',where,'UD9/10 sin cultura no reparte 1+1+1+2+5 puntos');
 }
 if(!row.draft.ok)issue('bloqueante',where,'Un borrador no puede exportarse');
 if(row.date!==(row.lang==='va'?'Data: ':'Fecha: '))issue('bloqueante',where,'Encabezado de fecha mal localizado: '+JSON.stringify(row.date));
 if(!morph&&row.total!==1000)issue('revisión',where,'Puntuación inicial '+(row.total/100).toFixed(2)+'; para definitivo requiere ajuste docente');
 for(const warning of row.warnings)issue('revisión',where,'Aviso curricular: '+warning.slice(0,250));
 if(row.course==='latin4'&&row.cultural){
  for(const c of row.cultural)if(c.units&&!c.units.some(unit=>selected.includes(unit)))
   issue('bloqueante',where,'Cultura de unidad ajena: '+c.id);
  if(row.cultural.some(c=>c.id&&!selected.some(unit=>c.id.includes('-'+unit+'-'))))
   issue('bloqueante',where,'Código de cultura ajeno a '+row.unit);
 }
 if(row.course==='latin1'&&row.questions.some(q=>q.kind==='pronouns')&&
  selected.some(unit=>Number((unit.match(/\d+/)||[0])[0])>=6)&&row.pronounRows!==10)
  issue('revisión',where,'Esperados 10 pronombres; generados '+row.pronounRows);
 if(row.lexLetters?.length&&row.lexLetters.join('|')!==row.lexLetters.map((_,i)=>String.fromCharCode(97+i)+'.').join('|'))
  issue('bloqueante',where,'Letras de alternativas léxicas no consecutivas: '+JSON.stringify(row.lexLetters));
 if(row.course==='latin1'&&row.model!=='morf'&&row.unit==='UD1'&&row.lexParts!==3)
  issue('bloqueante',where,'Latín I UD1 debe ofrecer tres alternativas de léxico, no modificación preverbial');
 if(row.course==='latin1'&&row.model!=='morf'&&row.lexParts>0&&row.lexParts<2)
  issue('revisión',where,'Léxico con menos de dos alternativas disponibles');
 if(row.course==='greek1'&&row.model==='morphology'&&row.greekForms.some(x=>/\(\s*\)/.test(x.context||'')))
  issue('bloqueante',where,'Enunciado griego vacío junto a forma');
}
async function word(page,file,course,model,unit,lang,cumulative=true){
 const where=file+' '+course+'/'+model+'/'+unit+'/'+lang;
 const selected=await configure(page,course,model,unit,lang,cumulative);
 const exported=await page.evaluate(async()=>{
  let blob,name;
  const original=downloadBlob;
  try{
   // Mantener activa la validación definitiva en el exportador real.
   document.getElementById('examFinalMode').checked=true;
   downloadBlob=(filename,value)=>{name=filename;blob=value};
   document.getElementById('docx').click();
  }finally{
   document.getElementById('examFinalMode').checked=false;
   downloadBlob=original;
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
 const filename=['examen',course,model,unit.replace(/[^a-zA-Z0-9]/g,''),cumulative?'acumulativo':'soloUD',lang,file==='index.html'?'online':'offline'].join('-')+'.docx';
 if(file==='index.html'){
  fs.writeFileSync(path.join(artifacts,filename),bytes);
 }
 report.words.push({file,course,model,unit,lang,cumulative,filename:file==='index.html'?filename:null,bytes:bytes.length,
  hasTables:!!selected.tableCount,questionCount:selected.questionCount});
}
async function edit(page,file,course,model,unit){
 const where=file+' '+course+'/'+model+'/'+unit;
 await configure(page,course,model,unit,'es');
 // El editor de escritorio usa pestañas excluyentes: abrir Preguntas antes de editar.
 await page.locator('#examPanelShortcuts>button[data-target="examQuestionSettings"]').click();
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
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+file,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.ExaminaScoring?.preflight&&!!document.getElementById('unitChoices'),null,{timeout:20000});
  for(const group of cases){
   const list=await unitsFor(page,group.course);
   assert(list.length>0,file+' '+group.course+' sin unidades');
   if(group.course==='greek1'&&list.includes('UD0'))issue('bloqueante',file+' Griego I','UD0 sigue disponible en el selector de exámenes');
   for(const model of group.models){
    for(const cumulative of [true,false]){
     for(const unit of list){
      for(const lang of ['es','va']){
       try{inspect(await configure(page,group.course,model,unit,lang,cumulative),file)}
       catch(e){issue('bloqueante',file+' '+group.course+'/'+model+'/'+unit+'/'+lang+
        (cumulative?'/acumulativo':'/solo-UD'),'Excepción: '+e.message)}
      }
     }
     const mixed=[list[0],list[Math.floor(list.length/2)]];
     for(const lang of ['es','va'])inspect(await configure(page,group.course,model,mixed,lang,cumulative),file);
    }
   }
  }
  for(const group of cases){
   const list=await unitsFor(page,group.course);
   const mid=list.find(x=>x==='UD7')||list[Math.floor(list.length/2)];
   // En cada modelo se serializa Word en una UD intermedia acumulativa
   // y en la primera y última UD aisladas, tanto en ES como en VA.
   const wordCases=[{unit:mid,cumulative:true},
    {unit:list[0],cumulative:false},{unit:list[list.length-1],cumulative:false}];
   for(const model of group.models){
    for(const {unit,cumulative} of wordCases){
     for(const lang of ['es','va']){
      try{await word(page,file,group.course,model,unit,lang,cumulative)}
      catch(e){issue('bloqueante',file+' Word '+group.course+'/'+model+'/'+unit+'/'+lang+
       (cumulative?'/acumulativo':'/solo-UD'),e.message)}
     }
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
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
  for(const file of ['index.html','offline.html'])await runFile(browser,file);
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
 fs.writeFileSync(path.join(artifacts,'auditoria-examenes-reales-20261114.json'),JSON.stringify(report,null,2)+'\n');
 const n=severity=>report.issues.filter(x=>x.severity===severity).length;
 console.log('Auditoría de exámenes reales: '+report.cases.length+' combinaciones; '+report.words.length+
  ' DOCX; '+report.editors.length+' pruebas de edición; '+n('bloqueante')+
  ' bloqueantes y '+n('revisión')+' observaciones para revisión docente.');
 const groups=new Map();
 for(const item of report.issues){
  const key=item.detail.replace(/Puntuación inicial \d+(?:[.,]\d+)?/, 'Puntuación inicial X');
  if(!groups.has(key))groups.set(key,{count:0,examples:[]});
  const group=groups.get(key);group.count++;
  if(group.examples.length<3)group.examples.push(item.where);
 }
 console.log('Observaciones consolidadas:', JSON.stringify([...groups.entries()].map(([reason,data])=>({reason,...data}))));
 for(const item of report.issues.slice(0,35))console.log('['+item.severity+'] '+item.where+': '+item.detail);
 if(n('bloqueante'))process.exitCode=1;
})().catch(error=>{
 console.error(error);
 fs.mkdirSync(artifacts,{recursive:true});
 issue('bloqueante','ejecución',error.stack||error.message);
 fs.writeFileSync(path.join(artifacts,'auditoria-examenes-reales-20261114.json'),JSON.stringify(report,null,2)+'\n');
 process.exitCode=1;
});
