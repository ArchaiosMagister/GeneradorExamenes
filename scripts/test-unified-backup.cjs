/* Regresión Fase IV: importación local no destructiva y recuperación. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const validDraft=(html='<div>Examen editado</div>')=>({
 schema:'examina-exam-draft',version:1,course:'latin1',model:'morf',html,created:'2026-11-13T00:00:00.000Z'
});
const schema='examina-unified-backup/v1';
function create(initial={}){
 const values=new Map(Object.entries(initial).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v)]));
 let failAt=null;
 const localStorage={
  getItem:k=>values.has(k)?values.get(k):null,
  setItem(k,v){if(k===failAt){failAt=null;throw Error('QuotaExceededError')}values.set(k,String(v))},
  removeItem:k=>values.delete(k)
 };
 const win={localStorage,ExaminaUnifiedCurrentExam:()=>validDraft('<p>Trabajo todavía no guardado</p>'),
  document:{readyState:'loading',addEventListener(){}}
 };
 const context=vm.createContext({window:win,document:win.document,Blob,URL,setTimeout,Date,console});
 for(const filename of ['culture-lat4.js','offline-lemmas.js','vocabulary-generator.js','unified-backup.js']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',filename),'utf8'),context,{filename});
 }
 return {api:win.ExaminaUnifiedBackup,values,storage:localStorage,fail:key=>{failAt=key}};
}
const bundle=(entries,extra={})=>({schema,version:1,created:'2026-11-13T00:00:00Z',
 entries,liveDraft:null,archive:[],...extra});
{
 const local=create({
  'examina_draft_v14':validDraft('<p>Mi examen actual</p>'),
  'examina-morph-review-v1':{a:{decision:'excluir',note:'contrastado'}},
  'examina-greek-discrepancy-v1':{'gr1|λόγος':{action:'all'}},
  'examina-academic-evidence-v1':{'lat1|amo':{approved:true,source:'docente'}},
  'examina_required_v9':[{course:'latin1',unit:'UD1',entry:'puella, -ae'}]
 });
 const backup=local.api.makeBackup();
 assert.equal(backup.schema,schema);
 assert.equal(backup.entries['examina_draft_v14'].html,'<p>Mi examen actual</p>');
 assert.equal(backup.liveDraft.html,'<p>Trabajo todavía no guardado</p>');
 assert.equal(backup.entries['examina-academic-evidence-v1']['lat1|amo'].approved,true);
 assert.equal(backup.entries['examina_required_v9'].length,1);
 const importFile=bundle({
  'examina_draft_v14':validDraft('<p>Borrador en otro iPad</p>'),
  'examina-morph-review-v1':{a:{decision:'aceptar'},b:{decision:'corregir'}},
  'examina-greek-discrepancy-v1':{'gr1|λόγος':{action:'exclude'},'gr1|δῶρον':{action:'all'}},
  'examina-academic-evidence-v1':{'lat1|amo':{approved:false},'lat1|sum':{approved:true}},
  'examina_required_v9':[
   {course:'latin1',unit:'UD1',entry:'puella, -ae',meaning:'alterada'},
   {course:'latin1',unit:'UD2',entry:'rosa, -ae'}
  ],
  'examina_exam_sentences_v1':{'latin1/morf':['Roma in Italia est.']}
 },{liveDraft:validDraft('<p>Sin guardar del otro equipo</p>')});
 const plan=local.api.prepareImport(importFile);
 assert.equal(plan.stats.newKeys,1);
 assert.equal(plan.stats.newItems,3);
 assert.ok(plan.stats.conflicts>=4);
 assert.deepEqual(Object.keys(plan.changes).sort(),
  ['examina-morph-review-v1','examina-greek-discrepancy-v1','examina_required_v9','examina_exam_sentences_v1','examina_unified_archive_v1'].sort());
 const result=local.api.applyImport(importFile);
 assert.equal(result.newItems,3);
 assert.equal(JSON.parse(local.storage.getItem('examina_draft_v14')).html,'<p>Mi examen actual</p>');
 assert.equal(JSON.parse(local.storage.getItem('examina-morph-review-v1')).a.decision,'excluir');
 assert.equal(JSON.parse(local.storage.getItem('examina-morph-review-v1')).b.decision,'corregir');
 assert.equal(JSON.parse(local.storage.getItem('examina-greek-discrepancy-v1'))['gr1|λόγος'].action,'all');
 assert.equal(JSON.parse(local.storage.getItem('examina-greek-discrepancy-v1'))['gr1|δῶρον'].action,'all');
 assert.equal(JSON.parse(local.storage.getItem('examina-academic-evidence-v1'))['lat1|amo'].approved,true);
 assert.equal(JSON.parse(local.storage.getItem('examina-academic-evidence-v1'))['lat1|sum'],undefined,'Sin validación no se activan autorizaciones');
 assert.equal(JSON.parse(local.storage.getItem('examina_required_v9')).length,2);
 let archive=local.api.readArchive();
 assert.ok(archive.find(x=>x.key==='examina_draft_v14'&&x.value.html.includes('otro iPad')));
 assert.ok(archive.find(x=>x.key==='liveDraft'&&x.value.html.includes('Sin guardar')));
 assert.ok(archive.find(x=>x.key==='examina_required_v9'&&Array.isArray(x.value)&&x.value[0].meaning==='alterada'));
 assert.ok(archive.find(x=>x.key==='examina-academic-evidence-v1'&&x.value['lat1|amo'].approved===false));
 const same=local.api.applyImport(importFile);
 assert.equal(same.newItems,0,'La segunda importación debe ser idempotente');
 assert.equal(local.api.readArchive().length,archive.length,'No duplicar conflictos archivados');
 const portable=local.api.makeBackup();
 assert.equal(portable.archive.length,archive.length,'La exportación debe incluir el archivo de conflictos');
 const empty=create();
 empty.api.applyImport(portable);
 assert.equal(JSON.parse(empty.storage.getItem('examina_draft_v14')).html,'<p>Mi examen actual</p>');
 assert.ok(empty.api.readArchive().length>=archive.length,'Las autorizaciones deben seguir archivadas hasta su validación');
 const draftIndex=archive.findIndex(x=>x.key==='examina_draft_v14');
 assert.equal(local.api.restoreFromArchive(draftIndex).archived,0,'No duplicar un conflicto existente');
 assert.equal(JSON.parse(local.storage.getItem('examina_draft_v14')).html,'<p>Mi examen actual</p>');
 const blank=create();
 blank.api.applyImport(bundle({}));
 blank.storage.setItem('examina_unified_archive_v1',JSON.stringify(archive));
 assert.equal(blank.api.restoreFromArchive(draftIndex).newKeys,1);
 assert.equal(JSON.parse(blank.storage.getItem('examina_draft_v14')).html,'<p>Borrador en otro iPad</p>');
}
{
 const bad=create();
 const malformed=[
  {},bundle({'unknown-local-key':{secret:'abc'}}),
  bundle({'examina_draft_v14':{schema:'examina-exam-draft',version:1,course:'latin1',html:5}}),
  bundle({'examina-morph-review-v1':{'__proto__':null}}, {archive:[{key:'evil',value:{}}]})
 ];
 for(const value of malformed)assert.throws(()=>bad.api.prepareImport(value));
 assert.equal(bad.values.size,0,'La validación no debe tocar el almacenamiento');
}
{
 const key='examina_vocabulary_project_v1';
 const valid={count:1,course:'lat1',units:[{title:'UD1',text:'Rosa.',mode:'complete',rows:[]}]};
 const state=create({[key]:valid});
 for(const unit of [null,{...valid.units[0],rows:[null]},{...valid.units[0],decisions:{lat1:[null]}}]){
  assert.throws(()=>state.api.applyImport(bundle({[key]:{...valid,units:[unit]}})),/Proyecto de vocabulario/);
 }
 assert.deepEqual(JSON.parse(state.storage.getItem(key)),valid);
 const culture={course:'latin4',units:['UD1'],type:'mc',question:'Pregunta',answer:'D',options:['Una','Dos']};
 assert.throws(()=>state.api.applyImport(bundle({examina_extra:{culture:[culture]}})),/la letra/);
 assert.equal(state.storage.getItem('examina_extra'),null);
}
{
 const scores='examina_question_points_v1',auto='examina_question_points_auto_v1';
 const passive='examina_exam_passive_choices_v1',format='examina_exam_visual_format_v1';
 const original={ [scores]:{existing:100,incoming:200},[auto]:['existing','incoming'],
  [passive]:{choice:{mode:'separate'}},[format]:{questionBeforePt:16} };
 const backup=create(original).api.makeBackup();
 const fresh=create();
 fresh.api.applyImport(backup);
 for(const key of Object.keys(original))assert.deepEqual(JSON.parse(fresh.storage.getItem(key)),original[key]);
 const local=create({[scores]:{existing:100,local:300},[auto]:['local']});
 local.api.applyImport(backup);
 local.api.applyImport(backup);
 assert.deepEqual(JSON.parse(local.storage.getItem(auto)),['local','incoming'],
  'Una puntuación ya existente conserva su origen manual');
}
{
 const state=create({'examina-morph-review-v1':{a:{decision:'excluir'}}});
 const original=state.storage.getItem('examina-morph-review-v1');
 const toImport=bundle({
  'examina_exam_sentences_v1':{'latin1/morf':['Oración nueva']},
  'examina-morph-review-v1':{a:{decision:'aceptar'},b:{decision:'corregir'}}
 });
 state.fail('examina_unified_archive_v1');
 assert.throws(()=>state.api.applyImport(toImport),/revertir/);
 assert.equal(state.storage.getItem('examina-morph-review-v1'),original);
 assert.equal(state.storage.getItem('examina_exam_sentences_v1'),null);
 assert.equal(state.storage.getItem('examina_unified_archive_v1'),null);
}
{
 // Una copia descargada tiene que superar los mismos límites que su importación.
 const local=create({'examina-morph-review-v1':{ok:{decision:'excluir'}}});
 const exported=local.api.makeBackup();
 assert.equal(local.api.validateBackup(exported),exported,'La copia preparada debe ser reimportable');
 assert.equal(create().api.prepareImport(exported).stats.newKeys,1);

 // Cada registro individual cabe, pero su suma no cabe en el paquete portable.
 const huge='x'.repeat(2900000);
 const full=create({
  'examina_exam_sentences_v1':{payload:huge},
  'examina_exam_gloss_choices_v1':{payload:huge},
  'examina-morph-review-v1':{payload:huge},
  'examina-greek-discrepancy-v1':{payload:huge},
  'examina_question_points_v1':{payload:huge},
  'examina_extra':{payload:huge}
 });
 assert.throws(()=>full.api.makeBackup(),/16 MB/,'No descargar copias que no puedan importarse');
 assert.equal(full.values.size,6,'El rechazo de la exportación nunca modifica los datos locales');
}
{
 // Un archivo local dañado no se puede transformar silenciosamente en una copia incompleta.
 const corrupt=create({
  'examina_draft_v14':validDraft('<p>Borrador valioso</p>'),
  'examina_unified_archive_v1':'{invalid-json'
 });
 assert.throws(()=>corrupt.api.makeBackup(),/historial local está dañado/);
 assert.throws(()=>corrupt.api.applyImport(bundle({
  'examina_exam_sentences_v1':{new:['Nueva oración']}
 })),/historial local está dañado/);
 assert.equal(corrupt.storage.getItem('examina_unified_archive_v1'),'{invalid-json');
 assert.equal(corrupt.storage.getItem('examina_exam_sentences_v1'),null);
 assert.equal(JSON.parse(corrupt.storage.getItem('examina_draft_v14')).html,'<p>Borrador valioso</p>');

 // El límite de 150 registros no debe truncar automáticamente lo que ya está guardado.
 const archive=Array.from({length:151},(_,i)=>({key:'liveDraft',value:validDraft('<p>'+i+'</p>')}));
 const excess=create({'examina_unified_archive_v1':archive});
 assert.throws(()=>excess.api.makeBackup(),/historial local está dañado/);
 assert.throws(()=>excess.api.applyImport(bundle({})),/historial local está dañado/);
 assert.equal(JSON.parse(excess.storage.getItem('examina_unified_archive_v1')).length,151);
}
{
 // Las letras griegas suelen ocupar más de un byte: el archivo debe respetar
 // el límite real de 16 MiB incluso cuando cuenta menos caracteres JS.
 const greek='α'.repeat(2200000);
 const unicode=create({
  'examina_exam_sentences_v1':{payload:greek},
  'examina_exam_gloss_choices_v1':{payload:greek},
  'examina-morph-review-v1':{payload:greek},
  'examina-greek-discrepancy-v1':{payload:greek}
 });
 assert.throws(()=>unicode.api.makeBackup(),/16 MB/);
 assert.equal(unicode.values.size,4,'No modificar bancos si la copia es demasiado grande');
}
{
 // Las copias NO activan acreditación morfológica. Solo transportan valores.
 const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 assert.ok(source.includes('window.ExaminaUnifiedCurrentExam='));
 assert.ok(source.includes('window.ExaminaUnifiedRestoreDraft=restoreDraft;'));
 assert.ok(source.includes('<script src="unified-backup.js" defer></script>'));
 const offline=fs.readFileSync(require('node:path').join(__dirname,'build-offline.mjs'),'utf8');
 assert.ok(offline.includes("const unifiedExternal='<script src=\"unified-backup.js\" defer></script>'"));
 const sw=fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
 assert.ok(sw.includes("'./unified-backup.js'"));
}
console.log('Fase IV: respaldo, conflictos, autorizaciones, recuperación, rollback e idempotencia correctos.');
