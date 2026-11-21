'use strict';
// Resume un contraste REAL ya generado, sin tomar decisiones docentes ni escribir
// datos académicos. El informe detallado original queda disponible como JSON.
const fs=require('node:fs');
const assert=require('node:assert/strict');

const pathname=process.argv[2];
if(!pathname){
 console.error('Uso: node scripts/summarize-schola-morphology.cjs INFORME.json');
 process.exit(2);
}
const report=JSON.parse(fs.readFileSync(pathname,'utf8'));
assert.equal(report.schema,'examina-schola-conciliation/v1');
assert.equal(report.policy?.readOnly,true);
assert.equal(report.policy?.automaticPromotions,0);
assert.equal(report.policy?.noAutomaticCurricularChanges,true);
assert.equal(report.policy?.latin2Excluded,true);
assert(Array.isArray(report.cells));
assert(Array.isArray(report.greekCurricularCandidates));
assert(report.cells.every(x=>x.automaticPromotion===false));
assert(report.greekCurricularCandidates.every(x=>x.automaticPromotion===false));
assert(report.cells.every(x=>['latin','latin4','griego'].includes(x.course)));
assert.equal(report.summary.comparedCells,report.cells.length);
assert.equal(report.summary.greekProvisionalCurricular,report.greekCurricularCandidates.length);
const courseName={latin:'Latín I',latin4:'Latín de 4.º',griego:'Griego I'};
const courses=Object.keys(courseName);
const statuses=[
 'ya_documentada_en_generador','coincide_con_fuente_externa_o_candidata',
 'rasgos_discordantes','grafia_igual_analisis_no_comparable',
 'forma_ausente_del_indice','lema_no_presente_en_curso',
 'terminacion_no_forma_completa','variante_sin_desglosar'
];
const statusName={
 ya_documentada_en_generador:'Coincidencia con fuente docente / contraste individual',
 coincide_con_fuente_externa_o_candidata:'Coincidencia solo con fuente externa / candidata',
 rasgos_discordantes:'Rasgos discordantes',
 grafia_igual_analisis_no_comparable:'Grafía compartida, análisis no comparable',
 forma_ausente_del_indice:'Forma ausente del índice',
 lema_no_presente_en_curso:'Lema ajeno al vocabulario de ese curso',
 terminacion_no_forma_completa:'Desinencia, no forma completa',
 variante_sin_desglosar:'Grafía alternativa sin desglosar'
};
function safe(x){return String(x??'—').replace(/[\r\n\t]+/g,' ').replace(/\|/g,'\\|').replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0,160);}
const lines=[
 '# Conciliación ScholaClassica → GeneradorExamenes',
 '',
 '**Estado:** contraste de solo lectura, no importación, no verificación individual y no publicación.',
 '',
 '## Versiones fijadas',
 '',
 '- ScholaClassica: '+safe(report.source.scholaCommit),
 '- Appendix: '+safe(report.source.scholaAppendixSha),
 '- Vocabula: '+safe(report.source.scholaVocabulaSha),
 '- GeneradorExamenes: '+safe(report.source.generadorCommit),
 '',
 '## Resultado por materia y nivel de evidencia',
 '',
 '| Clasificación | Latín I | Latín de 4.º | Griego I |',
 '| --- | ---: | ---: | ---: |'
];
for(const status of statuses){
 const row=report.summary.byCourseAndStatus||{};
 lines.push('| '+safe(statusName[status])+' | '+courses.map(c=>row[c]?.[status]||0).join(' | ')+' |');
}
const other=[...new Set(report.cells.map(x=>x.status))].filter(x=>!statuses.includes(x));
assert.equal(other.length,0,'El adaptador ha generado una categoría nueva: '+other.join(','));
lines.push('','**Casillas cotejadas:** '+report.cells.length+
 '; **fichas Schola en alcance:** '+report.summary.scholaRecordsInScope+'.','');
const warnings=report.cells.filter(x=>x.curricularWarning);
lines.push('**Avisos de secuenciación curricular:** '+warnings.length+
 ' (no se modifica ninguna unidad ni se adelanta ninguna forma).','');
lines.push('## Candidaturas griegas en revisión','');
lines.push('**Total de candidaturas curriculares de fuente 4:** '+
 report.greekCurricularCandidates.length+'. **Promociones automáticas:** 0.','');
lines.push('| Situación | Número |','| --- | ---: |');
for(const [key,value] of Object.entries(report.summary.greekPriorityCategories||{}))
 lines.push('| '+safe(key)+' | '+value+' |');
lines.push('','La coincidencia de grafía y rasgos **no** equivale a validación lexicográfica de una forma ni permite cambiar su fuente a 5.','');
const priority=['rasgos_discordantes','grafia_igual_analisis_no_comparable','forma_ausente_del_indice'];
lines.push('## Muestra para análisis filológico posterior','');
for(const course of courses){
 lines.push('### '+courseName[course],'');
 for(const status of priority){
  const eligible=report.cells.filter(x=>x.course===course&&x.status===status);
  lines.push('**'+statusName[status]+': '+eligible.length+'.**');
  if(!eligible.length){lines.push('');continue;}
  lines.push('','| Ficha Schola | Forma | Unidad Schola | Primera UD exigible en Generador |','| --- | --- | ---: | ---: |');
  for(const x of eligible.slice(0,8))
   lines.push('| '+safe(x.recordId)+' | '+safe(x.form)+' | '+safe(x.scholaUnit)+' | '+safe(x.availableFromExamUnit)+' |');
  lines.push('');
 }
}
lines.push('## Condiciones no negociables','',
 '- Los lemas homógrafos y análisis múltiples se conservan en el informe completo.',
 '- Las grafías griegas retienen acentos, espíritus e iota suscrita; macrones/breves editoriales se omiten solo para cotejar.',
 '- Las cuarentenas y exclusiones docentes vigentes siguen bloqueadas; ni estos informes ni la coincidencia con un paradigma las levantan.',
 '- No se mezclan los materiales de Latín II ni los bancos de ScholaClassica y GeneradorExamenes.',
 '- Antes de proponer cualquier incorporación, revisar cada candidatura, su procedencia, la forma individual y su unidad exigible.',
 '');
process.stdout.write(lines.join('\n')+'\n');
