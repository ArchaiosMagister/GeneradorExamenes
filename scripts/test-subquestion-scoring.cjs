'use strict';
// Fase VI: subpuntuaciones por elemento, alternativas de léxico y edición bidireccional.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');

function zipEntry(buffer,wanted){
 let offset=0;
 while(offset+30<=buffer.length&&buffer.readUInt32LE(offset)===0x04034b50){
  const len=buffer.readUInt32LE(offset+18),n=buffer.readUInt16LE(offset+26),extra=buffer.readUInt16LE(offset+28);
  const name=buffer.toString('utf8',offset+30,offset+30+n),start=offset+30+n+extra;
  if(name===wanted){
   assert.equal(buffer.readUInt16LE(offset+8),0);
   return buffer.toString('utf8',start,start+len);
  }
  offset=start+len;
 }
 throw Error('Falta '+wanted);
}
async function configure(page,course,model,unit){
 await page.evaluate(({course,model,unit})=>{
  const c=document.getElementById('course');c.value=course;c.dispatchEvent(new Event('change',{bubbles:true}));
  const m=document.getElementById('model');m.value=model;m.dispatchEvent(new Event('change',{bubbles:true}));
  const choices=[...document.querySelectorAll('#unitChoices .unit-choice')];
  choices.forEach(x=>x.checked=units[Number(x.value)]===unit);
  choices.find(x=>x.checked)?.dispatchEvent(new Event('change',{bubbles:true}));
  examSelectionCache.clear();
  if(course==='greek1')greekExamState=null;
  generate();
 },{course,model,unit});
 await page.waitForFunction(()=>window.ExaminaScoring?.details()?.some(q=>q.groups.length>0));
 await page.evaluate(()=>window.ExaminaScoring.sync());
}
async function wordXml(page){
 const data=await page.evaluate(async()=>{
  if(window.ExaminaTeacherReview)window.ExaminaTeacherReview.evidenceMayExport=()=>true;
  const previous=downloadBlob;let blob;
  try{
   document.getElementById('examFinalMode').checked=false;
   downloadBlob=(_name,data)=>{blob=data};
   exportWord(false);
  }finally{downloadBlob=previous}
  if(!blob)throw Error('Exportación Word no disponible');
  return Array.from(new Uint8Array(await blob.arrayBuffer()));
 });
 return zipEntry(Buffer.from(data),'word/document.xml');
}
async function verifyModels(page,file){
 const cases=[
  ['latin1','tablas','UD7'],['latin1','morf','UD7'],['latin1','mixto','UD7'],
  ['latin4','tablas','UD7'],['latin4','morf','UD7'],['latin4','mixto','UD7'],
  ['greek1','complete','UD7'],['greek1','morphology','UD7'],['greek1','translation','UD7']
 ];
 let count=0,types=new Set();
 for(const [course,model,unit] of cases){
  await configure(page,course,model,unit);
  const info=await page.evaluate(()=>{
   const engine=window.ExaminaScoring,details=engine.details();
   return {errors:engine.detailErrors(),details,items:[...document.querySelectorAll('#paper [data-exam-subscore]')].length,
    inputs:[...document.querySelectorAll('#examScoring [data-subscore-key]')].length,
    previewKeys:[...document.querySelectorAll('#paper [data-exam-subscore]')].map(x=>x.dataset.examSubscore),
    inputKeys:[...document.querySelectorAll('#examScoring [data-subscore-key]')].map(x=>x.dataset.subscoreKey)};
  });
  assert.deepEqual(info.errors,[],file+' '+course+'/'+model+': desgloses iniciales no cuadran');
  const groups=info.details.flatMap(q=>q.groups);
  assert(groups.length>=1,file+' '+course+'/'+model+': no se desglosan elementos');
  const total=groups.length+groups.reduce((n,g)=>n+g.children.length,0);
  assert.equal(info.items,total,file+' '+course+'/'+model+': faltan indicadores de vista previa '+
   JSON.stringify(info.inputKeys.filter(key=>!info.previewKeys.includes(key))));
  assert.equal(info.inputs,total,file+' '+course+'/'+model+': faltan entradas en el menú');
  count+=total;
  for(const q of info.details)if(q.groups.length)types.add(q.base);
  // El total de cada pregunta es verificable sin multiplicar las alternativas.
  for(const q of info.details){
   if(!q.groups.length)continue;
   const sums=q.groups.map(g=>g.points);
   if(q.optional){
    assert(q.groups.length>2,'Alternativas sin suficientes apartados');
    assert(sums.every(n=>n*2===q.parent),file+': opción léxica indebida');
   }else assert.equal(sums.reduce((a,b)=>a+b,0),q.parent,file+': suma por pregunta');
   for(const g of q.groups)if(g.children.length)
    assert.equal(g.children.reduce((a,b)=>a+b.points,0),g.points,file+': suma por términos');
  }
 }
 assert(count>20,file+': cobertura de elementos insuficiente');
 for(const kind of ['decl','forms','sent'])assert(types.has(kind),file+': no se cubre '+kind);
 return {count,types:[...types]};
}
async function openScoringDetail(page,key){
 const selector='#examScoring input[data-subscore-key="'+key+'"]';
 const card=page.locator('#examScoring .exam-subscore-details').filter({
  has:page.locator('input[data-subscore-key="'+key+'"]')
 });
 await card.evaluate(element=>element.open=true);
 return card;
}
async function verifyEditing(page,file){
 await configure(page,'latin1','tablas','UD9–10');
 let info=await page.evaluate(()=>window.ExaminaScoring.details());
 const target=info.find(q=>q.base==='forms'&&q.groups.length>1);
 assert(target,file+': no se encontraron varias formas morfológicas');
 const g=target.groups[0],g2=target.groups[1];
 const beforeWord=await wordXml(page);
 const before=await page.evaluate(({q,g,g2})=>{
  const scoring=window.ExaminaScoring;
  return {total:scoring.total(),parent:scoring.rows().find(x=>x.key===q).points,
   old:scoring.details().find(x=>x.key===q).groups[0].points,
   other:scoring.details().find(x=>x.key===q).groups[1].points};
 },{q:target.key,g:g.key,g2:g2.key});
 const changed=Math.max(0,g.points-25);
 await openScoringDetail(page,g.key);
 await page.locator('#examScoring input[data-subscore-key="'+g.key+'"]').fill(String(changed/100).replace('.',','));
 const mismatch=await page.evaluate(()=>({
  errors:window.ExaminaScoring.detailErrors(),
  parent:window.ExaminaScoring.rows().find(x=>x.key===window.__target)?.points
 }));
 assert(mismatch.errors.some(s=>s.includes(target.key)),file+': no se detectó la discrepancia');
 await page.evaluate(()=>{document.getElementById('examFinalMode').checked=true});
 assert.equal(await page.evaluate(()=>window.ExaminaScoring.preflight().ok),false,file+': definitivo incorrecto permitido');
 const afterWord=await wordXml(page);
 assert.equal(afterWord,beforeWord,file+': un distintivo docente cambió el Word académico');
 const preview=page.locator('#paper [data-exam-subscore="'+g.key+'"]');
 assert.equal(await preview.count(),1,'Falta la puntuación de la forma en vista previa');
 await preview.click();
 const inline=page.locator('#paper .exam-subscore-inline');
 assert.equal(await inline.count(),1,file+': no hay editor inline');
 await inline.fill(String(g.points/100).replace('.',','));
 await inline.press('Enter');
 assert.equal(await page.locator('#examScoring input[data-subscore-key="'+g.key+'"]').inputValue(),
  String(g.points/100).replace('.',','),file+': vista previa no sincroniza menú');
 assert.deepEqual(await page.evaluate(()=>window.ExaminaScoring.detailErrors()),[],
  file+': la edición reversible dejó discrepancias');
 // El reparto de la pregunta no se redistribuye de forma silenciosa.
 const parent=page.locator('#examScoring input[data-scoring-key="'+target.key+'"]').first();
 const parentOriginal=await parent.inputValue();
 await parent.fill(String((before.parent+25)/100).replace('.',','));
 assert((await page.evaluate(()=>window.ExaminaScoring.detailErrors())).length>0);
 const card=page.locator('#examScoring .exam-subscore-details').filter({has:page.locator('[data-subscore-key="'+g.key+'"]')});
 await card.evaluate(el=>el.open=true);
 await card.getByRole('button',{name:'Repartir desglose'}).click();
 assert.deepEqual(await page.evaluate(()=>window.ExaminaScoring.detailErrors()),[],
  file+': repartir explícitamente no cuadró el desglose');
 await parent.fill(parentOriginal);
 assert((await page.evaluate(()=>window.ExaminaScoring.detailErrors())).length>0);
 // La acción de repartir reconstruye el desplegable; reabrirlo antes del segundo reparto.
 await openScoringDetail(page,g.key);
 await card.getByRole('button',{name:'Repartir desglose'}).click();
 assert.deepEqual(await page.evaluate(()=>window.ExaminaScoring.detailErrors()),[]);
 const first=await page.evaluate(({key})=>window.ExaminaScoring.snapshot()[key],{key:g.key});
 await page.evaluate(()=>document.getElementById('saveDraft').click());
 const saved=await page.evaluate(({key})=>JSON.parse(localStorage.getItem('examina_draft_v14')).scores[key],{key:g.key});
 assert.equal(saved,first,file+': el borrador no guarda los puntos internos');
 await openScoringDetail(page,g.key);
 await page.locator('#examScoring input[data-subscore-key="'+g.key+'"]').fill('0');
 await page.evaluate(()=>document.getElementById('restoreDraft').click());
 await page.waitForFunction(({key,first})=>window.ExaminaScoring.snapshot()[key]===first,{key:g.key,first});
 assert.deepEqual(await page.evaluate(()=>window.ExaminaScoring.detailErrors()),[],
  file+': el desglose restaurado no cuadra');
 // La regeneración de una sola forma debe conservar las demás puntuaciones.
 const prior=await page.evaluate(()=>window.ExaminaScoring.snapshot());
 await page.evaluate(()=>{
  try{regenerateExamWord('forms',0)}catch(e){window.__regenerateError=String(e)}
  window.ExaminaScoring.sync();
 });
 const error=await page.evaluate(()=>window.__regenerateError);
 assert.equal(error,undefined,file+': falla la regeneración de una palabra');
 assert.equal(await page.evaluate(({key})=>window.ExaminaScoring.snapshot()[key],{key:g2.key}),
  prior[g2.key],file+': regeneración individual cambió otra puntuación');
 return {formKey:g.key,points:first};
}
async function checkLex(page,file){
 // index.html leído como file:// bloquea la carga fetch de bancos externos.
 // Ese escenario se audita mediante HTTP en test-lex-menu-sync.cjs; la
 // versión autónoma sí incorpora los bancos y comprueba aquí los desgloses.
 if(file==='index.html')return {testedBy:'test-lex-menu-sync.cjs (HTTP)'};
 await page.waitForFunction(()=>typeof latinLexBanks!=='undefined'&&
  latinLexBanks.latin1.preverbs.length>0&&latinLexBanks.latin1.phonetics.length>0);
 await configure(page,'latin1','tablas','UD9–10');
 await page.evaluate(()=>{
  examQuestionChoiceState['latin1/tablas/lex']=true;
  for(const kind of latinLexModules.latin1)
   latinLexPartEnabled['latin1/'+kind]=true;
  examSelectionCache.clear();
  generate();window.ExaminaScoring.sync();
 });
 await page.waitForFunction(()=>document.querySelector('#paper .exam-question[data-exam-kind="lex"]'));
 const initial=await page.evaluate(()=>{
  const scoring=window.ExaminaScoring,lex=scoring.details().find(q=>q.base==='lex');
  const headline=[...document.querySelectorAll('#paper .exam-question')]
   .find(el=>el.dataset.examKind==='lex')?.textContent||'';
  const offered=document.querySelectorAll('#paper .lex-subquestion[data-lex-kind]').length;
  const fields=[...document.querySelectorAll('#examQuestionMenus [data-question="lex"] .lex-word-control')]
   .map(el=>({fields:el.querySelectorAll('input[type="text"]').length,
    buttons:el.querySelectorAll('button').length,
    duplicate:el.querySelectorAll('span[id^="lex-slot-"]').length,
    value:el.querySelector('input')?.value||''}));
  return {lex,headline,offered,fields,total:scoring.total(),
   errors:scoring.detailErrors(),snapshot:scoring.snapshot(),
   previewLabels:document.querySelectorAll('#paper .lex-subquestion [data-exam-subscore]').length,
   scores:[...document.querySelectorAll('#examScoring input[data-subscore-key]')].filter(x=>x.dataset.subscoreKey.startsWith(lex.key+'|')).length};
 });
 assert(initial.lex,file+': falta puntuación del bloque de léxico');
 assert.equal(initial.lex.parent,200,file+': léxico optativo ha perdido sus dos puntos globales');
 assert.equal(initial.lex.optional,true);
 assert.deepEqual(initial.lex.groups,[],file+': las alternativas no pueden llevar desglose');
 assert.equal(initial.previewLabels,0,file+': aparecen puntos por alternativa en el examen');
 assert.equal(initial.scores,0,file+': hay campos de puntuación por alternativa');
 assert(!Object.keys(initial.snapshot).some(x=>x.startsWith(initial.lex.key+'|')),
  file+': quedan subpuntuaciones de léxico guardadas');
 assert.equal(initial.offered,4,file+': deben existir cuatro alternativas');
 assert.match(initial.headline,/elige dos de las cuatro cuestiones siguientes/i);
 assert.equal(initial.fields.length,14,file+': deben mantenerse todos los editores léxicos');
 assert(initial.fields.every(x=>x.fields===1&&x.buttons===1&&x.duplicate===0&&x.value),
  file+': el menú duplica formas o pierde regeneración');
 assert.deepEqual(initial.errors,[],file+': desglose inicialmente inconsistente');
 // Al desactivar una alternativa, mostrar el número en letra sin asignar
 // puntos a los tres apartados restantes.
 const three=await page.evaluate(()=>{
  const key='latin1/latinisms',prior=latinLexPartEnabled[key];
  try{
   latinLexPartEnabled[key]=false;generate();window.ExaminaScoring.sync();
   return {heading:[...document.querySelectorAll('#paper .exam-question')]
     .find(x=>x.dataset.examKind==='lex')?.textContent||'',
    count:document.querySelectorAll('#paper .lex-subquestion').length,
    score:window.ExaminaScoring.details().find(x=>x.base==='lex').parent,
    errors:window.ExaminaScoring.detailErrors()};
  }finally{latinLexPartEnabled[key]=prior;generate();window.ExaminaScoring.sync()}
 });
 assert.equal(three.count,3);
 assert.match(three.heading,/elige dos de las tres cuestiones siguientes/i);
 assert.equal(three.score,200);
 assert.deepEqual(three.errors,[]);
 // La versión valenciana debe utilizar "quatre" y no un numeral en cifras.
 await page.evaluate(()=>{
  const lang=document.getElementById('lang');lang.value='va';
  lang.dispatchEvent(new Event('change',{bubbles:true}));
  generate();window.ExaminaScoring.sync();
 });
 const valencian=await page.evaluate(()=>({
  heading:[...document.querySelectorAll('#paper .exam-question')]
   .find(x=>x.dataset.examKind==='lex')?.textContent||'',
  detail:window.ExaminaScoring.details().find(x=>x.base==='lex'),
  errors:window.ExaminaScoring.detailErrors()
 }));
 assert.match(valencian.heading,/tria dues de les quatre qüestions següents/i);
 assert.deepEqual(valencian.detail.groups,[]);
 assert.equal(valencian.detail.parent,200);
 assert.deepEqual(valencian.errors,[]);
 return {offered:initial.offered,editors:initial.fields.length,optional:true};
}
async function checkGreekMenuWithoutDuplicates(page,file){
 await configure(page,'greek1','complete','UD7');
 const state=await page.evaluate(()=>{
  const items=[...document.querySelectorAll('#examQuestionMenus [data-editor-for] > div')]
   .filter(row=>row.querySelector('input[type="text"]'));
  return {
   editable:items.length,
   duplicated:items.filter(row=>[...row.querySelectorAll('.hint')]
    .some(el=>/^Seleccionadas:\s*(?!ninguna)/i.test(el.textContent))).length,
   regen:items.filter(row=>row.querySelector('.exam-regenerate-word')).length,
   removable:items.filter(row=>[...row.querySelectorAll('button')]
    .some(btn=>/^Quitar forma \d+$/.test(btn.textContent))).length
  };
 });
 assert(state.editable>0,file+': faltan editores de Griego I completo');
 assert.equal(state.duplicated,0,file+': se repiten formas junto al campo editable de Griego I');
 assert(state.regen>0,file+': desapareció la regeneración individual de Griego I');
 assert(state.removable>0,file+': faltan botones para quitar formas de Griego I');
 return state;
}
async function run(browser,file){
 const context=await browser.newContext({viewport:{width:1380,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(file)).href);
 await page.waitForFunction(()=>window.ExaminaScoring?.details);
 const models=await verifyModels(page,file);
 const edit=await verifyEditing(page,file);
 const lex=await checkLex(page,file);
 const greekMenu=await checkGreekMenuWithoutDuplicates(page,file);
 assert.deepEqual(errors,[],file+': excepciones JavaScript');
 await context.close();
 return {file,models,edit,lex,greekMenu};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const file of ['index.html','offline.html'])
   console.log('Subpuntuación',JSON.stringify(await run(browser,file)));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
