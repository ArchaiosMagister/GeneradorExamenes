'use strict';
/* Combinaciones de participio perfecto pasivo y sum: no resolver sin docente. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const noQuantities=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').replace(/æ/gi,'ae').replace(/œ/gi,'oe');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(read('offline-lemmas.js'),sandbox,{filename:'offline-lemmas.js'});
vm.runInNewContext(read('vocabulary-generator.js'),sandbox,{filename:'vocabulary-generator.js'});
const engine=sandbox.window.ExaminaVocabulary;
const data=JSON.parse(read('data/lemmas/teacher-forms.json'));
const bank=[
 {course:'latin1',unit:'UD9',entry:'occido, occidi, occisum (3ª)',meaning:'matar',meaning_va:'matar'},
 {course:'latin1',unit:'UD9',entry:'ædifico, ædificavi, ædificatum (1ª)',meaning:'edificar',meaning_va:'edificar'},
 {course:'latin1',unit:'UD9',entry:'doceo, docui, doctum (2ª)',meaning:'enseñar'},
 {course:'latin1',unit:'UD9',entry:'pugno, pugnavi, pugnatum (1ª)',meaning:'luchar',meaning_va:'lluitar'},
 {course:'latin1',unit:'UD9',entry:'sum, fui, – (irr.)',meaning:'ser, estar'},
 {course:'latin1',unit:'UD9',entry:'pastor, pastoris',meaning:'pastor'},
 {course:'latin1',unit:'UD9',entry:'ovis, ovis',meaning:'oveja'}
];
function phrases(sentence,course='lat1'){
 const rows=engine.analyze(data,sentence,course,bank,{contextual:true});
 return engine.passivePhrases(data,rows,course,bank);
}
for(const [sentence,lemma,tense,number] of [
 ['Pastor ab ovibus occisus est.','occido','perfecto','singular'],
 ['Ædificata erant.','aedifico','pluscuamperfecto','plural'],
 ['Occisi sunt.','occido','perfecto','plural'],
 ['Occisa est.','occido','perfecto','singular'],
 ['Occisus erat.','occido','pluscuamperfecto','singular'],
 ['Occisus erit.','occido','futuro perfecto','singular'],
 ['Doctus est.','doceo','perfecto','singular'],
 ['Pugnatum est.','pugno','perfecto','singular'],
 ['Pugnatum erat.','pugno','pluscuamperfecto','singular'],
 ['Pugnatum erit.','pugno','futuro perfecto','singular']
]){
 const found=phrases(sentence);
 assert.equal(found.length,1,sentence+' no detectó grupo posible');
 assert(found[0].candidates.some(x=>x.lemma===lemma),sentence+' perdió lema');
 assert(found[0].tense.includes(tense),sentence+' tiempo incorrecto');
 assert.equal(found[0].number,number,sentence+' no concuerda el número');
 assert.equal(found[0].partIdentity!==found[0].auxIdentity,true);
}
for(const sentence of [
 'Occisus erant.', // desajuste de número
 'Occisi est.',
 'Pastor est.',
 'Est pastor occisus.', // no unir palabras distantes
 'Occisus, est.', // no unir a través de coma
 'Ædificata ovibus erant.'
])assert.equal(phrases(sentence).length,0,sentence+' falsa perífrasis');
assert.equal(phrases('Pugnatum sunt.').length,0,'impersonal: número incompatible con sunt');
assert.equal(phrases('Pugnatum, est.').length,0,'la coma impide la combinación');
assert.equal(phrases('Pugnatum est.')[0].candidates.find(c=>c.lemma==='pugno').verifiedParticiple,false,
 'no certificar pugnatum por el supino, solo ofrecer elección');
const pugnoShortBank=bank.filter(x=>!x.entry.startsWith('pugno,')).concat([
 {course:'latin1',unit:'UD5',entry:'pugno (1ª)',meaning:'luchar'}]);
const shortenedRows=engine.analyze(data,'Pugnatum est.','lat1',pugnoShortBank,{contextual:true});
assert.equal(engine.passivePhrases(data,shortenedRows,'lat1',pugnoShortBank).length,0,
 'no proponer la perífrasis sin tema de participio en fuentes disponibles');
assert.equal(phrases('Ὁ θεός ἐστιν.','gr1').length,0,'griego sin cambios');
const repeated=phrases('Occisus est. Occisus est.');
assert.equal(repeated.length,2,'las ocurrencias repetidas se han fusionado');
assert.notEqual(repeated[0].identity,repeated[1].identity,'decisiones por ocurrencia no aisladas');
assert(phrases('Aedificata erant.')[0].candidates[0].verifiedParticiple===false,
 'el nominativo neutro plural inferido no debe declararse contrastado');
assert(phrases('Occisus est.')[0].candidates[0].verifiedParticiple===true,
 'la forma exacta occisus debería estar individualmente contrastada');

const server=http.createServer((req,res)=>{
 const filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';
 const filepath=path.resolve(root,filename);
 if(!filepath.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(filepath,(error,buffer)=>{
  if(error){res.writeHead(404).end();return}
  res.setHeader('Content-Type',path.extname(filepath)==='.js'?'text/javascript':
   path.extname(filepath)==='.json'?'application/json':'text/html; charset=utf-8');
  res.end(buffer);
 });
});
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const filename of ['index.html','offline.html']){
   const page=await browser.newPage({acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+filename,{waitUntil:'load'});
   await page.waitForFunction(()=>!!window.ExaminaOfflineLemmatizer?.currentData?.(),null,{timeout:45000});
   const initial=await page.evaluate(()=>{
    document.getElementById('course').value='latin1';
    document.getElementById('lang').value='es';
    document.querySelectorAll('.unit-choice').forEach(x=>x.checked=units[Number(x.value)]==='UD9');
    const paper=document.getElementById('paper');
    paper.innerHTML='<div class="exam-sheet"><i data-sentence-slot="0" contenteditable="plaintext-only">Pastor ab ovibus occisus est.</i>'+
     '<i data-sentence-slot="1" contenteditable="plaintext-only">Ædificata erant.</i>'+
     '<div id="examSentenceGlossary"></div></div>';
    refreshSentenceGlossary();
    return {
     selects:[...paper.querySelectorAll('.exam-passive-choice')].map(x=>({
      options:[...x.options].map(o=>o.textContent),value:x.value
     })),
     html:paper.querySelector('#examSentenceGlossary').innerHTML,
     sentence:paper.querySelector('[data-sentence-slot="0"]').textContent
    };
   });
   assert.equal(initial.selects.length,2,filename+': no aparecen dos desplegables independientes');
   assert(initial.selects[0].options.some(v=>v.includes('perfecto de indicativo pasivo')));
   assert(initial.selects[1].options.some(v=>v.includes('pluscuamperfecto')));
   assert(initial.selects.every(s=>s.value===''),'el profesor debe decidir cada lectura');
   const before=await page.locator('[data-sentence-slot="0"]').textContent();
   await page.locator('.exam-passive-choice').nth(0).selectOption('compound:0');
   let state=await page.evaluate(()=>({
    selected:[...document.querySelectorAll('.exam-passive-choice')].map(x=>x.value),
    text:document.querySelector('#examSentenceGlossary').textContent,
    stored:JSON.parse(localStorage.getItem('examina_exam_passive_choices_v1')||'{}')
   }));
   assert.equal(state.selected[0],'compound:0');
   assert.equal(state.selected[1],'');
   assert(state.text.includes('occido, occidi, occisum'),filename+': no se agrupó el perfecto pasivo: '+JSON.stringify(state));
   // La segunda frase aún sin elegir conserva su auxiliar independiente.
   assert(state.text.includes('sum, fui'),filename+': se alteró una frase aún no resuelta');
   assert.equal(Object.keys(state.stored).length,1,'la elección no se guarda individualmente');
   assert.equal(await page.locator('[data-sentence-slot="0"]').textContent(),before,
    'la elección modificó el texto de la oración');
   await page.locator('.exam-passive-choice').nth(1).selectOption('compound:0');
   state=await page.evaluate(()=>({
    text:document.querySelector('#examSentenceGlossary').textContent,
    selected:[...document.querySelectorAll('.exam-passive-choice')].map(x=>x.value)
   }));
   assert(state.text.includes('ædifico')||state.text.includes('aedifico'),
    filename+': no se reconoció aedificata erant');
   assert(state.selected.every(x=>x==='compound:0'),'las decisiones no se acumulan');
   assert(!state.text.includes('sum, fui'),filename+': siguen apareciendo auxiliares pese a agrupar ambas frases');
   const word=await page.evaluate(async()=>{
    const original=downloadBlob,review=window.ExaminaTeacherReview,score=window.ExaminaScoring;
    const oldReview=review?.evidenceMayExport,oldScore=score?.canExport;
    let result=null;
    try{
     document.getElementById('sheetType').value='review';
     if(review)review.evidenceMayExport=()=>true;
     if(score)score.canExport=()=>true;
     downloadBlob=(name,blob)=>{result={name,blob}};
     exportWord(false);
     if(!result)return null;
     const bytes=new Uint8Array(await result.blob.arrayBuffer());
     const xml=new TextDecoder().decode(bytes);
     return {name:result.name,size:bytes.length,
      hasOccido:xml.includes('occido'),hasAedifico:xml.includes('ædifico')||xml.includes('aedifico'),
      hasSum:xml.includes('sum, fui'),hasOption:xml.includes('Dos palabras independientes')};
    }finally{
     downloadBlob=original;
     if(review)review.evidenceMayExport=oldReview;
     if(score)score.canExport=oldScore;
    }
   });
   assert(word&&word.size>3000&&word.name.endsWith('.docx'),filename+': exportación Word rota');
   assert(word.hasOccido&&word.hasAedifico,filename+': Word no conserva la elección verbal '+JSON.stringify(word));
   assert(!word.hasSum,filename+': Word añade sum pese a las dos decisiones compuestas');
   assert(!word.hasOption,filename+': Word contiene controles del profesor');
   const valencian=await page.evaluate(()=>{
    document.getElementById('lang').value='va';
    refreshSentenceGlossary();
    const result={text:document.querySelector('#examSentenceGlossary').textContent,
     options:[...document.querySelectorAll('.exam-passive-choice')].flatMap(x=>[...x.options].map(o=>o.textContent))};
    document.getElementById('lang').value='es';refreshSentenceGlossary();
    return result;
   });
   assert(valencian.text.includes('Vocabulari'),filename+': falta título valenciano');
   assert(valencian.options.some(x=>x.includes('plusquamperfet d’indicatiu passiu')),
    filename+': falta traducir el tiempo en el selector valenciano');
   await page.locator('.exam-passive-choice').nth(0).selectOption('separate');
   assert.equal(await page.locator('.exam-passive-choice').nth(1).inputValue(),'compound:0',
    'cambiar la primera frase alteró la segunda');
   await page.reload({waitUntil:'load'});
   await page.waitForFunction(()=>!!window.ExaminaOfflineLemmatizer?.currentData?.(),null,{timeout:45000});
   const persisted=await page.evaluate(()=>{
    document.getElementById('course').value='latin1';
    document.getElementById('paper').innerHTML='<div class="exam-sheet">'+
     '<i data-sentence-slot="0">Pastor ab ovibus occisus est.</i>'+
     '<i data-sentence-slot="1">Ædificata erant.</i>'+
     '<div id="examSentenceGlossary"></div></div>';
    refreshSentenceGlossary();
    return [...document.querySelectorAll('.exam-passive-choice')].map(x=>x.value);
   });
   assert.deepEqual(persisted,['separate','compound:0'],filename+': no persistieron las elecciones');
   // Cambiar el texto de una oración no debe transferir automáticamente la lectura.
   const changed=await page.evaluate(()=>{
    document.querySelector('[data-sentence-slot="0"]').textContent='Pastor occisus erat.';
    refreshSentenceGlossary();
    return [...document.querySelectorAll('.exam-passive-choice')].map(x=>x.value);
   });
   assert.deepEqual(changed,['','compound:0'],filename+': se heredó una decisión de otra oración');
   // El banco integrado aporta el supino que el índice de lemas abrevia.
   // Comprobar el desplegable real y la edición sin regenerar otras preguntas.
   for(const course of ['latin1','latin4']){
    const impersonal=await page.evaluate(course=>{
     document.getElementById('course').value=course;
     const paper=document.getElementById('paper');
     paper.innerHTML='<div class="exam-sheet">'+
      '<i data-sentence-slot="0" contenteditable="plaintext-only">Pugnatum est.</i>'+
      '<div id="examSentenceGlossary"></div></div>';
     refreshSentenceGlossary();
     const select=paper.querySelector('.exam-passive-choice');
     return {count:paper.querySelectorAll('.exam-passive-choice').length,
      options:select?[...select.options].map(x=>x.textContent):[],
      selected:select?.value,
      before:paper.querySelector('[data-sentence-slot="0"]').textContent};
    },course);
    assert.equal(impersonal.count,1,filename+' '+course+': falta selector para pugnatum est');
    assert(impersonal.options.some(x=>noQuantities(x).includes('pugno')&&x.includes('perfecto')),
     filename+' '+course+': falta lema pugno en lectura compuesta '+JSON.stringify(impersonal));
    assert(impersonal.options.some(x=>x.includes('paradigma deducido')),
     filename+' '+course+': se omitió aviso de forma inferida');
    assert.equal(impersonal.selected,'',filename+' '+course+': selección automática indebida');
    await page.locator('.exam-passive-choice').selectOption('compound:0');
    const combined=await page.locator('#examSentenceGlossary').innerText();
    assert(noQuantities(combined).includes('pugno'),filename+' '+course+': no se sustituyó por lema pugno');
    assert(!combined.includes('sum, fui'),filename+' '+course+': auxiliar duplicado');
    assert.equal(await page.locator('[data-sentence-slot="0"]').textContent(),
     impersonal.before,'la selección alteró el texto original');
    await page.locator('.exam-passive-choice').selectOption('separate');
    assert.equal(await page.locator('.exam-passive-choice').inputValue(),'separate',
     filename+' '+course+': no se puede mantener la lectura separada');
   }
   assert.deepEqual(errors,[],filename+': errores en navegador');
   await page.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 console.log('Perífrasis pasivas: lectura contextual, concordancia, dos opciones, persistencia, ES/VA, aislamiento y HTML autónomo: OK');
}
main().catch(error=>{console.error(error);process.exitCode=1});
