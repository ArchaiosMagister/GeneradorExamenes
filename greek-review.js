/* Cola de revisión filológica griega (datos locales, sin solicitudes externas).
 * Las decisiones son docentes y NO se aplican automáticamente a exámenes.
 * La incorporación de corpus Eulexis de terceros requiere verificar sus licencias.
 */
(function(){
'use strict';
const STORE='examina-greek-discrepancy-v1';
const SCHEMA='examina-eulexis-review/v1';
const VALID_SOURCES={0:'UniMorph',1:'Paradigma docente',2:'Modelo provisional',3:'Cita léxica',4:'Wikcionario candidato',5:'Contraste docente',6:'Collatinus',7:'Eulexis'};
function norm(s){
 return String(s||'').trim().toLocaleLowerCase('el').normalize('NFD')
  .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ').replace(/\s+/g,' ');
}
function readable(tag,morphologies){
 if(tag.startsWith('EULEXIS;')){
  const id=tag.split(';')[1];
  return morphologies&&morphologies[id]||'Índice de Eulexis '+id+' (faltan etiquetas descriptivas)';
 }
 return window.ExaminaOfflineLemmatizer?.describe?.(tag)||tag.split(';').join(' · ');
}
function parseImport(input){
 if(!input||input.schema!==SCHEMA||!Array.isArray(input.rows)||input.rows.length>200000)
  throw Error('El fichero no tiene el formato examina-eulexis-review/v1');
 const rows=[];
 for(const item of input.rows){
  if(!item||typeof item!=='object'||typeof item.form!=='string'||
     typeof item.lemma!=='string'||typeof item.analysis!=='string')
   throw Error('Cada fila debe contener form, lemma y analysis');
  const form=item.form.trim().normalize('NFC');
  const lemma=item.lemma.trim().normalize('NFC');
  const analysis=item.analysis.trim();
  if(!form||!lemma||!analysis||form.length>80||lemma.length>80||analysis.length>250)
   throw Error('Fila incompleta o excesivamente larga');
  if(!/^[\p{Script=Greek}\p{M}]+$/u.test(form.replace(/[᾽’']/g,'')))
   throw Error('El fichero contiene una forma que no es griega');
  rows.push({form,lemma,analysis,source:'Eulexis · índice importado'});
 }
 return rows;
}
function buildCases(data,imported=[],morphologies={}){
 if(data?.schema!==1||!Array.isArray(data.rows?.grc)||!data.vocabulary?.grc)
  throw Error('Índice griego local no disponible');
 const vocab=data.vocabulary.grc,groups=new Map();
 function add(form,lemma,tags,origin,source,provisional){
  const key=norm(form),lk=norm(lemma),entry=vocab[lk]?.gr1;
  if(!key||!entry)return; // No introducir palabras ajenas al temario.
  if(!groups.has(key))groups.set(key,{key,form,byAnalysis:new Map(),units:new Set()});
  const group=groups.get(key),signature=lk+'|'+norm(tags);
  if(!group.byAnalysis.has(signature)){
   group.byAnalysis.set(signature,{id:signature,lemma,form,analysis:tags,
    labels:new Set(),sources:new Set(),provisional:!!provisional,entry:entry.entry||lemma});
  }
  const option=group.byAnalysis.get(signature);
  option.sources.add(source);
  option.labels.add(origin);
  option.provisional=option.provisional&&!!provisional;
  for(const unit of entry.units||[])group.units.add(unit);
 }
 for(const row of data.rows.grc){
  if(!Array.isArray(row)||row.length!==4)continue;
  const [lemma,form,tags,src]=row;
  if(src===3||src===2||typeof tags!=='string')continue;
  add(form,lemma,readable(tags,morphologies),VALID_SOURCES[src]||'Fuente local',src,src===4||src===7);
 }
 for(const row of imported)add(row.form,row.lemma,row.analysis,row.source,'imported',true);
 const out=[];
 for(const group of groups.values()){
  const options=[...group.byAnalysis.values()].map(x=>({
   ...x,sources:[...x.sources],labels:[...x.labels]
  }));
  // Una discrepancia exige análisis distintos. Si hay un único análisis Eulexis
  // de una forma de cita aún sin contraste docente, también ofrecer una tarjeta:
  // es una propuesta, NO un paradigma verificado. No mostrar las miles de flexiones
  // individuales de un lema no validado: limitar esta modalidad al lema de cita.
  const withExternal=options.some(o=>o.sources.includes(7)||o.sources.includes('imported'));
  const verifiedSource=options.some(o=>o.sources.some(x=>[0,1,5].includes(x)));
  const citation=options.some(o=>norm(o.form)===norm(o.entry.split(',')[0]));
  const onlyProposal=options.length===1&&withExternal&&!verifiedSource&&citation;
  if(options.length<2&&!onlyProposal)continue;
  options.sort((a,b)=>a.provisional-b.provisional||a.lemma.localeCompare(b.lemma,'el')||
   a.analysis.localeCompare(b.analysis,'es'));
  const withEulexis=options.some(x=>x.sources.includes(7)||x.sources.includes('imported'));
  const units=[...group.units].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  out.push({id:'gr1|'+group.key,form:group.form,units,options,withEulexis,
   kind:onlyProposal?'eulexis-proposal':'discrepancy'});
 }
 // Priorizar discrepancias Eulexis, sin eliminar las homografías preexistentes.
 return out.sort((a,b)=>Number(b.withEulexis)-Number(a.withEulexis)||
  a.units.join(',').localeCompare(b.units.join(','),'es',{numeric:true})||
  a.form.localeCompare(b.form,'el'));
}
function readDecisions(){
 try{
  const x=JSON.parse(localStorage.getItem(STORE)||'{}');
  return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
 }catch{return {}}
}
function saveDecisions(data){
 try{localStorage.setItem(STORE,JSON.stringify(data));return true}
 catch{return false}
}
function exportJson(name,data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],
  {type:'application/json;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function contextParts(sentence,form){
 const bits=String(sentence).split(/([\p{Script=Greek}\p{M}]+)/u);
 return bits.map(bit=>({text:bit,match:norm(bit)===norm(form)}));
}
async function init(){
 if(document.getElementById('greekDiscrepancyReview'))return;
 const anchor=document.getElementById('morphTeacherReview')||document.getElementById('offlineLemmaPanel');
 if(!anchor)return;
 const section=document.createElement('section');
 section.id='greekDiscrepancyReview';section.className='field';
 section.innerHTML='<details><summary><strong>Griego I · Resolver discrepancias por tarjetas</strong></summary>'+
  '<p class="hint">Una forma cada vez: elige un análisis y aparecerá la siguiente tarjeta. Ninguna elección modifica por sí sola las preguntas ni certifica paradigmas.</p>'+
  '<div class="greek-review-tools"><label>Unidad<select id="grReviewUnit"><option value="">Todas</option></select></label>'+
  '<label>Filtrar forma<input id="grReviewSearch" type="search" placeholder="λόγος, λύω…"></label></div>'+
  '<p id="grReviewStatus" role="status" aria-live="polite">Cargando índice griego…</p>'+
  '<div id="grReviewCard" aria-live="polite"></div>'+
  '<div class="greek-review-tools"><button type="button" id="grReviewSkip" class="secondary">Pasar a la siguiente</button>'+
  '<button type="button" id="grReviewUndo" class="secondary">Deshacer última decisión</button></div>'+
  '<div class="greek-review-tools"><button type="button" id="grReviewExport" class="secondary">Exportar decisiones</button>'+
  '<label class="greek-file-label">Importar decisiones<input type="file" id="grReviewDecisionsFile" accept=".json,application/json"></label></div>'+
  '<details><summary>Activar Eulexis en este dispositivo</summary>'+
  '<p class="hint">Una única descarga aproximada de 30 MB desde el repositorio original de lector-griego. Solo se guardan los análisis correspondientes a Griego I. Una vez instalado funcionará sin red, también en la PWA. Es una fuente externa de propuestas, no un solucionario.</p>'+
  '<div class="greek-review-tools"><button type="button" id="grReviewInstallEulexis">Instalar Eulexis (un clic)</button>'+
  '<button type="button" id="grReviewRemoveEulexis" class="secondary">Borrar datos de Eulexis</button></div>'+
  '<p id="grReviewInstallStatus" class="hint" role="status" aria-live="polite">Sin instalación local detectada.</p>'+
  '<p class="hint">Descarga directamente de genuensis/lector-griego (revisión fijada). La app no republica sus tablas; se muestran <a href="https://github.com/genuensis/lector-griego" target="_blank" rel="noopener noreferrer">procedencia y atribución</a>. Las decisiones docentes se guardan aparte.</p>'+
  '</details>'+
  '<details><summary>Importar manualmente un índice JSON (alternativa)</summary>'+
  '<p class="hint">Los análisis de Eulexis no se descargan de servidores externos. Puedes cargar un JSON local con esquema examina-eulexis-review/v1 y filas form, lemma, analysis. No se almacena el corpus: las decisiones sí quedan en este navegador. La procedencia y la licencia del corpus deben ser comprobadas antes de redistribuirlo.</p>'+
  '<label class="greek-file-label">Cargar índice Eulexis<input id="grReviewEulexisFile" type="file" accept=".json,application/json"></label>'+
  '<p id="grReviewImportStatus" class="hint"></p></details>'+
  '<p class="hint">Las formas sin opciones contradictorias no necesitan tarjeta. La omisión no se guarda; las decisiones pueden exportarse para trasladarlas a otro dispositivo.</p>'+
  '</details>';
 anchor.after(section);
 const style=document.createElement('style');
 style.textContent='#greekDiscrepancyReview{margin:12px 0}#greekDiscrepancyReview>details>summary{padding:12px;border:1px solid var(--soft-border,#b7cee4);background:var(--soft,#eaf5ff);color:var(--soft-ink,#183c5d);border-radius:8px;cursor:pointer}'+
  '#greekDiscrepancyReview .greek-review-tools{display:flex;align-items:end;flex-wrap:wrap;gap:10px;margin:12px 0}'+
  '#greekDiscrepancyReview .greek-review-tools label{font-size:13px;font-weight:600;flex:1;min-width:145px}'+
  '#greekDiscrepancyReview .greek-review-tools :is(select,input[type=search]){width:100%;margin-top:5px}'+
  '#greekDiscrepancyReview .greek-review-card{border:1px solid var(--soft-border,#c1d0dd);border-radius:12px;padding:14px;background:var(--secondary-bg,#fff);color:inherit}'+
  '#greekDiscrepancyReview .greek-review-card h3{font-size:23px;margin:0 0 8px;font-weight:700}'+
  '#greekDiscrepancyReview .greek-review-option{display:block;text-align:left;width:100%;white-space:normal;height:auto;padding:12px;margin:8px 0;border:1px solid #90a8bf;border-radius:9px;background:var(--soft,#f3f7fb);color:var(--soft-ink,#183c5d)}'+
  '#greekDiscrepancyReview .greek-review-option strong{display:block;font-size:15px}'+
  '#greekDiscrepancyReview .greek-review-option small{display:block;font-size:12px;margin-top:3px}'+
  '#greekDiscrepancyReview .greek-review-option:hover{border-color:var(--accent,#185e9c)}'+
  '#greekDiscrepancyReview .greek-review-context{margin:8px 0;padding:8px;border-left:3px solid var(--accent,#185e9c)}'+
  '#greekDiscrepancyReview mark{background:#ffdd88;color:#222}'+
  '#greekDiscrepancyReview .greek-review-meta{font-size:12px;opacity:.85}'+
  '#greekDiscrepancyReview .greek-file-label input{display:block;max-width:100%;font-size:12px}'+
  '@media print{#greekDiscrepancyReview{display:none!important}}';
 document.head.append(style);
 const byId=id=>document.getElementById(id);
 const state={data:null,external:[],cases:[],decisions:readDecisions(),skipped:new Set(),last:null,current:null};
 const installed=byId('grReviewInstallStatus');
 const status=byId('grReviewStatus'),card=byId('grReviewCard');
 function validDecision(x,d){
  if(!d||!['choose','all','exclude'].includes(d.action))return false;
  return d.action!=='choose'||x.options.some(o=>o.id===d.selected);
 }
 function visible(){
  const unit=byId('grReviewUnit').value,word=norm(byId('grReviewSearch').value);
  return state.cases.filter(x=>(!unit||x.units.includes(unit))&&
   (!word||norm(x.form+' '+x.options.map(y=>y.lemma+' '+y.entry).join(' ')).includes(word)));
 }
 function record(action,selected=''){
  const x=state.current;if(!x)return;
  const previous=state.decisions[x.id]||null;
  state.last={id:x.id,previous};
  state.decisions[x.id]={action,selected,updated:new Date().toISOString(),form:x.form};
  if(!saveDecisions(state.decisions)){
   status.textContent='No se pudieron guardar las decisiones en este navegador: expórtalas.';
  }
  render();
 }
 function render(){
  if(!state.data)return;
  const found=visible(),remaining=found.filter(x=>!validDecision(x,state.decisions[x.id])&&!state.skipped.has(x.id));
  const decided=found.filter(x=>validDecision(x,state.decisions[x.id])).length;
  state.current=remaining[0]||null;
  status.textContent=found.length+' formas con discrepancias o propuestas · '+decided+' decididas · '+
   remaining.length+' pendientes en esta sesión'+(state.external.length?' · '+state.external.length+' análisis Eulexis importados':'');
  card.replaceChildren();
  byId('grReviewSkip').disabled=!state.current;
  byId('grReviewUndo').disabled=!state.last;
  if(!state.current){
   const p=document.createElement('p');p.textContent=found.length?'No quedan tarjetas pendientes con estos filtros.':'No se encontraron discrepancias con los filtros actuales.';
   card.append(p);return;
  }
  const x=state.current,article=document.createElement('article');
  article.className='greek-review-card';
  const title=document.createElement('h3');title.textContent=x.form;article.append(title);
  const label=document.createElement('p');label.className='greek-review-meta';
  label.textContent=(x.units.join(', ')||'Banco general')+' · '+
   (x.kind==='eulexis-proposal'?'Propuesta única de Eulexis pendiente de contraste':
    x.options.length+' análisis alternativos')+(x.withEulexis?' · con datos Eulexis':'');
  article.append(label);
  const contexts=typeof window.ExaminaGreekSentenceContexts==='function'
   ?window.ExaminaGreekSentenceContexts(x.form).slice(0,2):[];
  for(const sentence of contexts){
   const p=document.createElement('p');p.className='greek-review-context';
   const lead=document.createElement('strong');lead.textContent='En su oración: ';p.append(lead);
   for(const part of contextParts(sentence,x.form)){
    if(!part.match)p.append(document.createTextNode(part.text));
    else{const mark=document.createElement('mark');mark.textContent=part.text;p.append(mark)}
   }
   article.append(p);
  }
  for(const opt of x.options){
   const b=document.createElement('button');b.type='button';b.className='greek-review-option';
   const t=document.createElement('strong');t.textContent=opt.lemma+' — '+opt.analysis;
   const sub=document.createElement('small');sub.textContent=opt.labels.join(', ')+
    (opt.provisional?' · CANDIDATA NO VERIFICADA':'');
   b.append(t,sub);b.addEventListener('click',()=>record('choose',opt.id));article.append(b);
  }
  for(const [action,titleText] of [['all','Conservar todas las interpretaciones (ambigua)'],
   ['exclude','Descartar esta forma de la revisión']]){
   const b=document.createElement('button');b.type='button';b.className='secondary';
   b.style.margin='4px 8px 4px 0';b.textContent=titleText;b.addEventListener('click',()=>record(action));article.append(b);
  }
  card.append(article);
 }
 function resetUnits(){
  const selected=byId('grReviewUnit').value,select=byId('grReviewUnit');
  select.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Todas';select.append(empty);
  const units=[...new Set(state.cases.flatMap(x=>x.units))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  for(const unit of units){const o=document.createElement('option');o.value=unit;o.textContent=unit;select.append(o)}
  if(units.includes(selected))select.value=selected;
 }
 function refresh(){state.cases=buildCases(state.data,state.external);state.skipped.clear();resetUnits();render()}
 byId('grReviewSkip').addEventListener('click',()=>{if(state.current)state.skipped.add(state.current.id);render()});
 byId('grReviewUndo').addEventListener('click',()=>{
  if(!state.last)return;
  const {id,previous}=state.last;state.last=null;
  if(previous)state.decisions[id]=previous;else delete state.decisions[id];
  state.skipped.delete(id);saveDecisions(state.decisions);render();
 });
 for(const id of ['grReviewUnit','grReviewSearch'])byId(id).addEventListener(id==='grReviewSearch'?'input':'change',()=>{
  state.skipped.clear();render();
 });
 byId('grReviewExport').addEventListener('click',()=>exportJson('decisiones-griego-discrepancias.json',
  {schema:'examina-greek-decisions/v1',decisions:state.decisions,exported:new Date().toISOString()}));
 byId('grReviewDecisionsFile').addEventListener('change',async e=>{
  try{
   const file=e.target.files?.[0];if(!file)return;
   if(file.size>2000000)throw Error('El archivo supera 2 MB');
   const data=JSON.parse(await file.text());
   if(data.schema!=='examina-greek-decisions/v1'||!data.decisions||Array.isArray(data.decisions)||
      typeof data.decisions!=='object')throw Error('Formato de decisiones no reconocido');
   const imported=Object.entries(data.decisions).filter(([id,x])=>id.startsWith('gr1|')&&x&&
    ['choose','all','exclude'].includes(x.action));
   if(imported.length>200000)throw Error('Demasiadas decisiones');
   state.decisions={...state.decisions,...Object.fromEntries(imported)};
   if(!saveDecisions(state.decisions))throw Error('No se pudieron guardar las decisiones');
   render();
  }catch(error){status.textContent='No se pudo importar: '+error.message}
  e.target.value='';
 });
 const eulexis=window.ExaminaEulexisLocal;
 byId('grReviewInstallEulexis').addEventListener('click',async()=>{
  const button=byId('grReviewInstallEulexis');button.disabled=true;
  try{
   if(!eulexis)throw Error('No se ha cargado el adaptador de Eulexis');
   const result=await eulexis.install(state.data,msg=>{installed.textContent=msg;});
   state.external=result.rows;
   installed.textContent='Eulexis instalado: '+result.count+
    ' análisis del vocabulario de Griego I, disponibles sin conexión en este navegador.';
   refresh();
  }catch(e){installed.textContent='No se ha instalado Eulexis: '+e.message+
   '. Comprueba la conexión y el almacenamiento del navegador.'}
  finally{button.disabled=false}
 });
 byId('grReviewRemoveEulexis').addEventListener('click',async()=>{
  try{
   if(!eulexis)throw Error('No está disponible el adaptador');
   await eulexis.clear();
   state.external=[];refresh();
   installed.textContent='Datos personales de Eulexis borrados. Las decisiones docentes se han conservado.';
  }catch(e){installed.textContent='No se pudieron borrar los datos: '+e.message}
 });
 byId('grReviewEulexisFile').addEventListener('change',async e=>{
  try{
   const file=e.target.files?.[0];if(!file)return;
   if(file.size>16000000)throw Error('El índice supera 16 MB');
   const raw=JSON.parse(await file.text());
   state.external=parseImport(raw);
   byId('grReviewImportStatus').textContent='Índice local cargado: '+state.external.length+' análisis. No se ha enviado ni guardado en servidores.';
   refresh();
  }catch(error){byId('grReviewImportStatus').textContent='No se pudo cargar: '+error.message}
  e.target.value='';
 });
 try{
  state.data=await window.ExaminaOfflineLemmatizer.load();
  if(eulexis){
   try{
    const cached=await eulexis.load(state.data);
    if(cached){
     state.external=cached.rows;
     installed.textContent='Eulexis preparado: '+cached.count+
      ' análisis del temario disponibles sin conexión.';
    }
   }catch(e){installed.textContent='El índice Eulexis no está disponible: '+e.message}
  }
  refresh();
 }catch(error){status.textContent='No se pudo abrir el índice local: '+error.message}
}
window.ExaminaGreekReview={norm,buildCases,parseImport,contextParts};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();