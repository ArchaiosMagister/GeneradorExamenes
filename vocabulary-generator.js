/* Independent text-to-vocabulary engine. No inferred paradigms or translations. */
(function(){
'use strict';
const linguistic=()=>window.ExaminaOfflineLemmatizer;
const key=s=>linguistic().normalize(s);
const head=s=>String(s).split(',')[0].replace(/\s*\([^)]*\).*/,'').trim();
function analyze(data,text,course,bank){
 const lang=course==='gr1'?'grc':'lat',index=new Map();
 for(const [lemma,surface,tags,source] of data.rows[lang]){
  if(!data.vocabulary[lang][lemma]?.[course])continue;
  const k=key(surface);if(!index.has(k))index.set(k,new Map());
  const candidates=index.get(k),old=candidates.get(lemma);
  const attested=[0,1,5].includes(source);
  candidates.set(lemma,{lemma,attested:attested||!!old?.attested});
 }
 const tokens=new Map();
 for(const match of text.matchAll(/[\p{L}\p{M}]+(?:[’'][\p{L}\p{M}]+)*/gu)){
  const form=match[0],normal=key(form);
  if(normal&&!tokens.has(normal))tokens.set(normal,form);
 }
 return [...tokens].map(([normal,form])=>{
  const candidates=[...(index.get(normal)?.values()||[])].flatMap(c=>{
   const original=data.vocabulary[lang][c.lemma][course];
   const matches=bank.filter(x=>key(x.entry)===key(original.entry)||key(head(x.entry))===key(c.lemma));
   const variants=matches.length?matches:[{entry:original.entry,meaning:''}];
   return variants.map(x=>({...c,entry:x.entry,meaning:x.meaning||''}));
  }).filter((x,i,a)=>a.findIndex(y=>y.lemma===x.lemma&&y.entry===x.entry&&y.meaning===x.meaning)===i);
  const resolved=candidates.length===1&&candidates[0].attested;
  return {form,candidates,status:resolved?'documented':candidates.length?'review':'unknown',
   lemma:resolved?candidates[0].lemma:'',entry:resolved?candidates[0].entry:form,meaning:resolved?candidates[0].meaning:''};
 });
}
function entries(rows){
 const seen=new Set();return rows.filter(r=>{
  const id=r.status==='manual'||r.status==='documented'?key(r.lemma||head(r.entry))+'|'+r.entry+'|'+r.meaning:'?'+r.form;
  if(seen.has(id))return false;seen.add(id);return true;
 }).sort((a,b)=>key(a.entry).localeCompare(key(b.entry),'el'));
}
function displayEntry(entry,mode){
 if(mode!=='simple')return entry;
 // Only shorten explicitly labelled Latin verbs. Never synthesize missing themes.
 const m=entry.match(/\((?:[1-4]ª|mx\.|irr\.)\)/);
 return m?head(entry)+' '+m[0]:entry;
}
function documentXml(project){
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const p=(s,b=false)=>'<w:p><w:pPr>'+(b?'<w:keepNext/><w:keepLines/><w:spacing w:before="160" w:after="80"/>':'<w:spacing w:after="30"/>')+'</w:pPr><w:r><w:rPr>'+(b?'<w:b/>':'')+'<w:rFonts w:ascii="Palatino Linotype" w:hAnsi="Palatino Linotype" w:cs="Palatino Linotype"/><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">'+escape(s)+'</w:t></w:r></w:p>';
 const line=(r,u)=>p((['manual','documented'].includes(r.status)?'':'* ')+displayEntry(r.entry,u.mode)+(r.meaning?' — '+r.meaning:''));
 // Word balancea las dos columnas al cerrar cada sección continua.
 // Cerramos también la última unidad: sin ese salto final puede quedar toda
 // su lista en la primera columna aunque las anteriores se distribuyan bien.
 const layout=cols=>'<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:bottom="1417" w:left="1417" w:right="1417"/><w:cols w:num="'+cols+'" w:space="500"/>';
 const closeUnit=()=>'<w:p><w:pPr><w:sectPr><w:type w:val="continuous"/>'+layout(2)+'</w:sectPr></w:pPr></w:p>';
 const units=project.units.slice(0,project.count);
 const body=units.map(u=>{
  const all=entries(u.rows||[]),pending=all.filter(r=>!['manual','documented'].includes(r.status));
  return p(u.title,true)+all.filter(r=>['manual','documented'].includes(r.status)).map(r=>line(r,u)).join('')+
    (pending.length?p('Pendientes de revisión (*)',true)+pending.map(r=>line(r,u)).join(''):'')+
    closeUnit();
 }).join('');
 // La sección final, vacía y de una columna, fuerza la distribución equilibrada
 // de la última UD sin añadir texto ni mezclar las unidades en un único bloque.
 return '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+
  body+'<w:sectPr><w:type w:val="continuous"/>'+layout(1)+'</w:sectPr></w:body></w:document>';
}
window.ExaminaVocabulary={analyze,entries,displayEntry,documentXml};
function init(){
 const $=id=>document.getElementById(id),storage='examina_vocabulary_project_v1';
 let project={count:1,course:'lat1',units:[]},selected=0;
 try{const saved=JSON.parse(localStorage.getItem(storage));if(saved?.units&&Number.isInteger(saved.count)&&saved.count>=1&&saved.count<=100&&['lat1','lat4','gr1'].includes(saved.course))project=saved}catch{}
 const unit=()=>{while(project.units.length<project.count)project.units.push({title:'UD'+(project.units.length+1),text:'',mode:'complete',rows:[]});return project.units[selected]};
 const status=s=>{$('vgStatus').textContent=s};
 const save=()=>{try{localStorage.setItem(storage,JSON.stringify(project))}catch{status('No se pudo guardar en este navegador. Exporta una copia JSON.')}};
 function render(){
  unit();$('vgCount').value=project.count;$('vgCourse').value=project.course;
  $('vgUnit').replaceChildren(...project.units.slice(0,project.count).map((u,i)=>new Option(u.title,i,false,i===selected)));
  $('vgTitle').value=unit().title;$('vgText').value=unit().text;$('vgMode').value=unit().mode;
  const target=$('vgResults');target.replaceChildren();
  for(const r of entries(unit().rows)){
   const box=document.createElement('div');box.style.cssText='padding:10px 0;border-bottom:1px solid #ccd7e6';
   const label=document.createElement('p');label.textContent=r.form+' · '+({documented:'Forma documentada',manual:'Revisado manualmente',review:'* Ambigua o candidata sin verificar',unknown:'* Desconocida'}[r.status]);box.append(label);
   if(r.candidates.length&&r.status!=='documented'){
    const select=document.createElement('select');select.append(new Option('Elegir una entrada documentada o candidata…',''));
    r.candidates.forEach((c,i)=>select.append(new Option(c.entry+' — '+c.meaning+(c.attested?'':' [sin verificar]'),i)));
    select.onchange=()=>{if(select.value==='')return;const c=r.candidates[Number(select.value)];Object.assign(r,{lemma:c.lemma,entry:c.entry,meaning:c.meaning,status:'manual'});save();render()};box.append(select);
   }
   for(const [field,name] of [['entry','Enunciado'],['meaning','Traducción']]){
    const lab=document.createElement('label');lab.textContent=name;const input=document.createElement('input');input.value=r[field];input.onchange=()=>{r[field]=input.value;r.lemma=head(r.entry);r.status='manual';save();render()};lab.append(input);box.append(lab);
   }
   const preview=document.createElement('p');preview.textContent='Vista de exportación: '+displayEntry(r.entry,unit().mode);box.append(preview);target.append(box);
  }
 }
 $('vgCount').onchange=()=>{const n=Number($('vgCount').value);if(!Number.isInteger(n)||n<1||n>100){status('Elige entre 1 y 100 unidades.');return}project.count=n;selected=Math.min(selected,n-1);render();save()};
 $('vgUnit').onchange=()=>{selected=Number($('vgUnit').value);render()};
 $('vgCourse').onchange=()=>{project.course=$('vgCourse').value;project.units.forEach(u=>u.rows=[]);save();render();status('Banco cambiado. Vuelve a analizar los textos.')};
 for(const [id,field] of [['vgTitle','title'],['vgText','text'],['vgMode','mode']])$(id).oninput=()=>{unit()[field]=$(id).value;if(field==='text')unit().rows=[];save();if(field==='mode')render()};
 async function analyzeUnits(all){
  const button=$('vgAnalyze'),buttonAll=$('vgAnalyzeAll');
  button.disabled=true;buttonAll.disabled=true;status('Analizando…');
  try{
   const data=await linguistic().load();
   const course={lat1:'latin1',lat4:'latin4',gr1:'greek1'}[project.course];
   const bank=vocab.filter(x=>courseOf(x)===course);
   const targets=all?project.units.slice(0,project.count):[unit()];
   for(const u of targets)u.rows=analyze(data,u.text,project.course,bank);
   save();render();
   const distinct=targets.reduce((n,u)=>n+u.rows.length,0);
   const pending=targets.reduce((n,u)=>n+u.rows.filter(r=>r.status!=='documented').length,0);
   status((all?targets.length+' unidades analizadas. ':'')+distinct+' formas distintas. '+pending+' pendientes. Reanalizar sustituye correcciones, pero conserva los textos.');
  }catch(e){status('No se pudo analizar: '+e.message)}
  finally{button.disabled=false;buttonAll.disabled=false}
 }
 $('vgAnalyze').onclick=()=>analyzeUnits(false);
 $('vgAnalyzeAll').onclick=()=>analyzeUnits(true);
 $('vgBackup').onclick=()=>downloadBlob('vocabulario-unidades.json',new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));
 $('vgWord').onclick=()=>{
  downloadBlob('vocabulario-unidades.docx',zip([
   ['[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
   ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],['word/document.xml',documentXml(project)]
  ]));
 };
 $('vgImport').onchange=async e=>{try{const p=JSON.parse(await e.target.files[0].text());if(!Number.isInteger(p.count)||p.count<1||p.count>100||!['lat1','lat4','gr1'].includes(p.course)||!Array.isArray(p.units)||p.units.length<p.count||!p.units.every(u=>typeof u.title==='string'&&typeof u.text==='string'&&['simple','complete'].includes(u.mode)&&Array.isArray(u.rows)&&u.rows.every(r=>typeof r.entry==='string'&&typeof r.meaning==='string'&&typeof r.form==='string'&&Array.isArray(r.candidates))))throw Error('Formato incorrecto');project=p;selected=0;render();save()}catch(e){status('No se pudo importar: '+e.message)}};
 $('vgShow').onclick=()=>{$('examLayout').style.display='none';$('vocabManager').classList.remove('active');$('vocabularyGenerator').classList.add('active');for(const id of ['vmShowExam','vmShowList'])$(id).classList.remove('active');$('vgShow').classList.add('active');render()};
 for(const id of ['vmShowExam','vmShowList'])$(id).addEventListener('click',()=>{$('vocabularyGenerator').classList.remove('active');$('vgShow').classList.remove('active')});
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
