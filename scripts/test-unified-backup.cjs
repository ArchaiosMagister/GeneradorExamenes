/* Regresión Fase IV: importación local no destructiva y recuperación. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../unified-backup.js'),'utf8');
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
 vm.runInNewContext(code,{window:win,Blob,URL,setTimeout,Date,console},{filename:'unified-backup.js'});
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
