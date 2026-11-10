/* Revisión docente offline de los bancos morfológicos.
 * Lectura únicamente: ninguna decisión altera el índice ni las soluciones de los exámenes.
 * La categoría "documentada" significa que existe una fuente; no valida todo el paradigma.
 */
(function () {
'use strict';
const STORE='examina-morph-review-v1';
const NAMES={lat1:'Latín I',gr1:'Griego I'};
const CURATED=[
 {course:'lat1',lemma:'moveo',kind:'correccion',priority:0,form:'moveo, movi, movitum (2ª)',
  detail:'El supino documentado es motum, no movitum. Propuesta: moveo, movi, motum (2.ª).',
  source:'Lewis y Short · https://thrax.mpiwg-berlin.mpg.de/mpiwg-mpdl-cms-web/lt/GetDictionaryEntries?dictionary=ls&inputType=lemma&language=lat&outputFormat=html&outputType=dictFull&query=moveo'},
 {course:'lat1',lemma:'eripio',kind:'correccion',priority:0,form:'eripio, eripui, eripitum (4ª)',
  detail:'La forma de supino es ereptum y pertenece a la tercera conjugación mixta (3.ª en Lewis y Short). Propuesta: eripio, eripui, ereptum (mixta).',
  source:'Lewis y Short · https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n16146/'},
 {course:'lat1',lemma:'sum',kind:'ampliacion',priority:1,form:'sum, es, est; sumus, estis, sunt',
  detail:'El lema solo aparece como cita en el índice, pese a ser básico. Incorporar su paradigma documentado sin derivarlo de una regla regular.',
  source:'Inventario docente · pendiente de añadir al índice de referencia'},
 {course:'gr1',lemma:'γιγνομαι',kind:'ampliacion',priority:0,form:'γίγνομαι, γίγνῃ, γίγνεται, γιγνόμεθα, γίγνεσθε, γίγνονται',
  detail:'Presente medio de verbo deponente sin paradigma flexivo en el índice. Fuente contrastada. Decisión docente: admitir también γίνομαι y la variante de 2.ª persona γίγνει.',
  source:'Logeion · https://logeion.uchicago.edu/morpho/%CE%B3%CE%AF%CE%BD%CE%BF%CE%BC%CE%B1%CE%B9'},
 {course:'gr1',lemma:'παισ',kind:'variantes',priority:1,form:'παῖδα / παῖν',
  detail:'El índice atribuye dos acusativos singulares a παῖς. Hay que delimitar las variantes admitidas en clase y distinguir formas literarias de las escolares.',
  source:'UniMorph · revisión de variante dialectal/lexicográfica pendiente'}
];
// Un adverbio, conjunción, preposición o numeral expresamente indeclinable
// no necesita paradigma: no se le presenta como incidencia por ausencia de flexión.
function isDeclaredInvariable(entry){
 return /\((?:adv\.?|conj\.?|prep\.?\s*\+\s*(?:ac|acc|abl)\.?|preposición|adverbio|conjunción|interj\.?|num\.?\s*indecl\.?)\)/i.test(String(entry||''));
}
const norm=x=>String(x||'').toLowerCase().normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ').replace(/æ/g,'ae').replace(/œ/g,'oe');
function buildCases(data,course){
 if(!NAMES[course])throw Error('Curso desconocido');
 const lang=course==='gr1'?'grc':'lat',vocabulary=data.vocabulary[lang];
 const eligible=new Map(Object.entries(vocabulary).filter(([,v])=>v[course]));
 const lemmaRows=new Map(),byForm=new Map(),slots=new Map();
 for(const row of data.rows[lang]){
  const [lemma,surface,tags,source]=row;
  if(!eligible.has(lemma))continue;
  if(!lemmaRows.has(lemma))lemmaRows.set(lemma,[]);
  lemmaRows.get(lemma).push(row);
  if(source!==3){
   const f=norm(surface);
   if(!byForm.has(f))byForm.set(f,new Set());
   byForm.get(f).add(lemma);
  }
  if(source===0||source===1||source===5){
   const id=lemma+'|'+tags;
   if(!slots.has(id))slots.set(id,new Set());
   slots.get(id).add(norm(surface));
  }
 }
 const cases=[],seen=new Set();
 function add(x){
  const id=[course,x.kind,x.lemma,x.form||''].join('|');
  if(seen.has(id))return;
  seen.add(id);
  cases.push({id,course,priority:3,...x,entry:eligible.get(x.lemma)?.[course]?.entry||x.lemma,
   units:eligible.get(x.lemma)?.[course]?.units||[]});
 }
 for(const x of CURATED.filter(x=>x.course===course)){
  if(x.kind==='correccion'&&eligible.get(x.lemma)?.[course]?.entry!==x.form)continue;
  if(x.kind==='ampliacion'&&(lemmaRows.get(x.lemma)||[]).some(r=>r[3]===5))continue;
  add(x);
 }
 for(const [lemma] of eligible){
  const rows=lemmaRows.get(lemma)||[];
  const sources=new Set(rows.map(r=>r[3]));
  if(!sources.has(0)&&!sources.has(1)&&!sources.has(5)){
   if(sources.has(2)||sources.has(4)){
    const candidates=rows.filter(r=>r[3]===2||r[3]===4);
    add({lemma,kind:'candidatas',priority:2,form:candidates.slice(0,4).map(x=>x[1]).join(' · '),
     detail:candidates.length+' propuestas de flexión, sin análisis morfológico contrastado en el índice. Revisar antes de habilitarlas para exámenes.',
     source:sources.has(4)?'Wikcionario/Wiktextract · candidatas':'Modelo regular · propuestas sin comprobar'});
   }else if(!isDeclaredInvariable(eligible.get(lemma)?.[course]?.entry)){
    add({lemma,kind:'sin-flexion',priority:2,form:'',
     detail:'Consta la entrada léxica, pero no hay formas flexivas documentadas en el índice. Las palabras invariables pueden no necesitar paradigma.',
     source:'Vocabulario docente · registro de cita'});
   }
  }
  if(course==='lat1'&&/,\s*[^,]+sum\b/i.test(eligible.get(lemma)?.[course]?.entry||'')&&
      rows.some(r=>r[3]===0&&/^V;/.test(r[2])&&r[2].includes(';ACT;'))){
    add({lemma,kind:'etiquetas',priority:1,form:rows.filter(r=>r[3]===0&&r[2].includes(';ACT;')).slice(0,2).map(x=>x[1]).join(' · '),
     detail:'Un verbo con enunciado deponente tiene análisis de voz ACT en el material de origen. La voz morfológica y el significado activo deben tratarse por separado; comprobar los rasgos antes de usarlos.',
     source:'UniMorph · etiquetas originales, no equivalencia escolar automática'});
  }
 }
 const variantByLemma=new Map();
 for(const [id,forms]of slots){
  if(forms.size<2)continue;
  const sep=id.indexOf('|'),lemma=id.slice(0,sep),tag=id.slice(sep+1);
  if(!variantByLemma.has(lemma))variantByLemma.set(lemma,[]);
  variantByLemma.get(lemma).push(tag+': '+[...forms].slice(0,4).join(' / '));
 }
 for(const [lemma,variants]of variantByLemma){
  add({lemma,kind:'variantes',priority:3,form:variants.slice(0,3).join(' · '),
   detail:variants.length+' casillas morfológicas con más de una forma documentada. No necesariamente son errores; decidir qué variantes se enseñan o admiten en el examen.',
   source:'Divergencias internas entre registros de fuentes documentadas'});
 }
 for(const [form,lemmas]of byForm){
  if(lemmas.size<2)continue;
  const ls=[...lemmas].sort();
  add({lemma:ls[0],kind:'homografia',priority:3,form,
   detail:'La forma coincide con los lemas '+ls.join(', ')+'. No lematizar automáticamente sin contexto.',
   source:'Comparación de lemas coincidentes en el mismo vocabulario'});
 }
 return cases.sort((a,b)=>a.priority-b.priority||a.kind.localeCompare(b.kind,'es')||
  a.lemma.localeCompare(b.lemma,'es')||a.form.localeCompare(b.form,'es'));
}
function decisions(){
 try{const data=JSON.parse(localStorage.getItem(STORE)||'{}');return data&&typeof data==='object'?data:{}}
 catch{return {}}
}
function save(all){
 try{localStorage.setItem(STORE,JSON.stringify(all));return true}catch{return false}
}
function download(name,data){
 const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function init(){
 if(document.getElementById('morphTeacherReview'))return;
 const parent=document.getElementById('offlineLemmaPanel');
 if(!parent)return;
 const section=document.createElement('section');section.id='morphTeacherReview';section.className='field';
 section.innerHTML='<details><summary><strong>Revisión filológica y decisiones docentes</strong></summary>'+
  '<p class="hint">Primero Latín I; después Griego I. Clasificación conservadora: ninguna marca convierte una propuesta en forma verificada ni altera las soluciones del generador. Las decisiones se guardan únicamente en este navegador; exporta una copia.</p>'+
  '<div class="review-controls"><label for="reviewCourse">Curso<select id="reviewCourse"><option value="lat1">Latín I</option><option value="gr1">Griego I</option></select></label>'+
  '<label for="reviewKind">Tipo de incidencia<select id="reviewKind"><option value="">Todas</option><option value="correccion">Corrección contrastada</option><option value="etiquetas">Etiquetas dudosas</option><option value="ampliacion">Ampliación contrastada</option><option value="candidatas">Solo candidatas</option><option value="sin-flexion">Sin flexión</option><option value="variantes">Variantes</option><option value="homografia">Homografía</option></select></label>'+
  '<label for="reviewUnit">Unidad<select id="reviewUnit"><option value="">Todas las unidades</option></select></label>'+
  '<label for="reviewQuery">Buscar lema o forma<input type="text" id="reviewQuery" placeholder="sum / γίγνομαι" autocomplete="off"></label></div>'+
  '<label class="check"><input id="reviewPending" type="checkbox" checked> Mostrar solo las incidencias pendientes</label>'+
  '<p id="reviewSummary" class="hint" role="status" aria-live="polite">Cargando índice local…</p>'+
  '<div class="review-actions"><button type="button" id="reviewExport" class="secondary">Exportar decisiones</button> <button type="button" id="reviewExportAll" class="secondary">Exportar incidencias</button></div>'+
  '<div id="reviewItems"></div>'+
  '<div class="review-actions"><button type="button" id="reviewMore" class="secondary" hidden>Mostrar 40 más</button></div>'+
  '<p class="hint">Estados posibles: pendiente, aceptar variante, solicitar corrección o excluir de los ejercicios. Ninguno modifica el banco compartido. Las fuentes documentan la observación; las decisiones siguen siendo tuyas.</p></details>';
 parent.after(section);
 const style=document.createElement('style');
 style.textContent='#morphTeacherReview{margin:10px 0}#morphTeacherReview>details>summary{padding:12px;border:1px solid #bdcde1;border-radius:8px;cursor:pointer;background:#eef3f9;color:#203a59}'+
  '#morphTeacherReview .review-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}'+
  '#morphTeacherReview .review-controls label{font-weight:600;font-size:12px}#morphTeacherReview .review-controls :is(select,input){display:block;width:100%;min-width:0;margin-top:5px}'+
  '#morphTeacherReview .review-item{padding:11px;border:1px solid #dce4ee;border-radius:8px;margin:9px 0;background:white}'+
  '#morphTeacherReview .review-item h3{margin:0 0 4px;font-size:15px;overflow-wrap:anywhere}'+
  '#morphTeacherReview .review-item p{margin:5px 0;overflow-wrap:anywhere;font-size:13px}'+
  '#morphTeacherReview .review-item .review-meta{color:#50657b;font-size:12px}'+
  '#morphTeacherReview .review-item select,#morphTeacherReview .review-item textarea{width:100%;margin-top:6px}'+
  '#morphTeacherReview .review-item textarea{min-height:46px;resize:vertical}'+
  '#morphTeacherReview .review-actions{margin:9px 0;display:flex;gap:8px;flex-wrap:wrap}'+
  '@media(max-width:570px){#morphTeacherReview .review-controls{grid-template-columns:1fr}}@media print{#morphTeacherReview{display:none!important}}';
 document.head.append(style);
 const byId=id=>document.getElementById(id);
 const state={cases:[],filtered:[],limit:40,notes:decisions(),ready:false};
 const dictionary={correccion:'Corrección contrastada',etiquetas:'Etiquetas dudosas',ampliacion:'Ampliación contrastada',
  candidatas:'Flexión candidata', 'sin-flexion':'Sin flexión contrastada',variantes:'Variantes morfológicas',homografia:'Homografía'};
 function show(){
  if(!state.ready)return;
  const kind=byId('reviewKind').value,unit=byId('reviewUnit').value,
   word=norm(byId('reviewQuery').value),pending=byId('reviewPending').checked;
  state.filtered=state.cases.filter(x=>(!kind||x.kind===kind)&&(!unit||x.units.includes(unit))&&
   (!word||norm(x.entry+' '+x.lemma+' '+x.form+' '+x.detail).includes(word))&&
   (!pending||!state.notes[x.id]?.decision));
  const resolved=state.cases.filter(x=>!!state.notes[x.id]?.decision).length;
  byId('reviewSummary').textContent=state.cases.length+' incidencias detectadas · '+
   resolved+' con decisión guardada · '+state.filtered.length+' coinciden con el filtro. Se muestran '+Math.min(state.limit,state.filtered.length)+'.';
  const holder=byId('reviewItems');holder.replaceChildren();
  for(const x of state.filtered.slice(0,state.limit)){
   const article=document.createElement('article');article.className='review-item';
   const title=document.createElement('h3');title.textContent=x.entry;
   const label=document.createElement('p');label.className='review-meta';
   label.textContent=dictionary[x.kind]+' · '+(x.units.join(', ')||'sin unidad curricular');
   const sample=document.createElement('p');sample.textContent=x.form?'Forma(s): '+x.form:'';
   const desc=document.createElement('p');desc.textContent=x.detail;
   const origin=document.createElement('p');origin.className='review-meta';origin.textContent='Evidencia: '+x.source;
   const select=document.createElement('select');select.setAttribute('aria-label','Decisión para '+x.lemma);
   for(const [v,t]of [['','Pendiente'],['aceptar','Aceptar variante o criterio'],['corregir','Corregir / completar entrada'],['excluir','No usar en ejercicios']]){
    const option=document.createElement('option');option.value=v;option.textContent=t;select.append(option);
   }
   select.value=state.notes[x.id]?.decision||'';
   const note=document.createElement('textarea');note.placeholder='Nota o decisión docente (opcional)';
   note.setAttribute('aria-label','Observaciones para '+x.lemma);
   note.value=state.notes[x.id]?.note||'';
   function store(){
    if(!select.value&&!note.value.trim())delete state.notes[x.id];
    else state.notes[x.id]={decision:select.value,note:note.value.trim(),entry:x.entry,updated:new Date().toISOString()};
    if(!save(state.notes))byId('reviewSummary').textContent='No se pudo guardar: exporta las decisiones para no perderlas.';
   }
   select.addEventListener('change',()=>{store();show()});
   note.addEventListener('change',store);
   article.append(title,label,sample,desc,origin,select,note);holder.append(article);
  }
  byId('reviewMore').hidden=state.limit>=state.filtered.length;
 }
 async function reload(){
  try{
   const c=byId('reviewCourse').value, data=await window.ExaminaOfflineLemmatizer.load();
   state.cases=buildCases(data,c);state.limit=40;state.ready=true;
   const select=byId('reviewUnit');select.replaceChildren();
   const opt=document.createElement('option');opt.value='';opt.textContent='Todas las unidades';select.append(opt);
   const units=[...new Set(state.cases.flatMap(x=>x.units))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
   for(const u of units){const o=document.createElement('option');o.value=u;o.textContent=u;select.append(o)}
   show();
  }catch(error){byId('reviewSummary').textContent='No se pudo consultar el índice: '+error.message}
 }
 for(const id of ['reviewKind','reviewUnit','reviewQuery','reviewPending'])byId(id).addEventListener(id==='reviewQuery'?'input':'change',()=>{state.limit=40;show()});
 byId('reviewCourse').addEventListener('change',reload);
 byId('reviewMore').addEventListener('click',()=>{state.limit+=40;show()});
 byId('reviewExport').addEventListener('click',()=>download('decisiones-revision-morfologica.json',
  {schema:1,description:'Decisiones docentes: no son formas verificadas',exported:new Date().toISOString(),decisions:state.notes}));
 byId('reviewExportAll').addEventListener('click',()=>download('incidencias-'+byId('reviewCourse').value+'.json',
  {schema:1,course:byId('reviewCourse').value,description:'Incidencias automáticas; propuestas sin aprobación',cases:state.cases}));
 reload();
}
window.ExaminaTeacherReview={buildCases};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();