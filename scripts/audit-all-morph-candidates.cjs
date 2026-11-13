'use strict';
/**
 * Auditoría íntegra de las candidaturas de morfología: NO verifica automáticamente.
 * Las fuentes UniMorph, Wiktextract y los paradigmas docentes usan esquemas
 * distintos. Coincidir sin análisis equivalente no constituye prueba filológica.
 * Ejecutar: node scripts/audit-all-morph-candidates.cjs
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const dataset=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
const output=path.join(root,'test-artifacts');
const sourceNames={0:'UniMorph',1:'DOCENTE_EXPLICITO',2:'MODELO_REGULAR',3:'CITA_LEXICA',
 4:'WIKTEXTRACT',5:'CONTRASTE_INDIVIDUAL',6:'COLLATINUS_REFERENCIA',7:'EULEXIS_REFERENCIA'};
const candidateCodes={lat:2,grc:4};
const comparisonCodes=new Set([0,1,5]);

// IMPORTANTÍSIMO: el iota suscrito griego no es mero acento y se conserva.
function canonical(value){
 return String(value||'').normalize('NFD').replace(/\u0345/g,'ι')
  .replace(/\p{M}/gu,'').toLowerCase().replace(/ς/g,'σ')
  .replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
}
function semanticSlot(tags){
 const a=String(tags).split(';');
 // Correspondencias nominales restringidas: N vs PROPN conserva caso/número.
 if(['N','PROPN'].includes(a[0])&&a.length===3&&
  /^(NOM|GEN|DAT|ACC|ABL|VOC)$/.test(a[1])&&/^(SG|PL)$/.test(a[2]))
  return 'NOMINAL;'+a[1]+';'+a[2];
 return tags;
}
const records={};
let total=0;
for(const lang of ['lat','grc']){
 const rows=dataset.rows[lang];
 const candidate=rows.filter(r=>r[3]===candidateCodes[lang]);
 const external=rows.filter(r=>comparisonCodes.has(r[3]));
 const bySurface=new Map();
 for(const row of external){
  const k=row[0]+'\u0000'+canonical(row[1]);
  if(!bySurface.has(k))bySurface.set(k,[]);
  bySurface.get(k).push(row);
 }
 const statuses={};
 const entries=candidate.map((row,i)=>{
  const [lemma,form,tags,source]=row;
  const key=lemma+'\u0000'+canonical(form);
  const same=bySurface.get(key)||[];
  const matching=same.filter(x=>x[2]===tags);
  const equivalent=same.filter(x=>x[2]!==tags&&semanticSlot(x[2])===semanticSlot(tags));
  // La equivalencia N/PROPN puede ser útil, pero no concede verificación.
  const others=same.filter(x=>!matching.includes(x)&&!equivalent.includes(x));
  const state=matching.length?'LECTURA_DOCUMENTADA_MISMO_ANALISIS':
   equivalent.length?'ETIQUETA_NOMBRE_PROPIO_POR_CONCILIAR':
   others.length?'OTRAS_LECTURAS_MISMA_FORMA':'SIN_CORROBORACION_INDIVIDUAL';
  statuses[state]=(statuses[state]||0)+1;
  // Las coincidencias pueden ser homografías. Se conserva toda la polisemia.
  return {id:lang+'-'+String(i+1).padStart(5,'0'),
   language:lang,lemma,form,tags,source:sourceNames[source],state,
   independentMatches:[...matching,...equivalent,...others].slice(0,12)
    .map(x=>({form:x[1],tags:x[2],source:sourceNames[x[3]]})),
   individualVerification:false,eligibleForNewAutomaticGrading:false};
 });
 assert.equal(entries.length,candidate.length);
 records[lang]={summary:{candidateForms:candidate.length,
   candidateLemmas:new Set(candidate.map(r=>r[0])).size,
   individuallyVerifiedByThisAudit:0,states:statuses},entries};
 total+=entries.length;
}
// El auditor no escribe el banco de fuentes, el índice, el motor ni el PWA.
assert.equal(total,dataset.rows.lat.filter(x=>x[3]===2).length+
 dataset.rows.grc.filter(x=>x[3]===4).length);
const report={
 schema:'examina-comprehensive-morph-audit/v1',
 status:'REVIEW_ONLY_NOT_FOR_GRADING',
 policy:'No promover sin referencia individual, identidad de lema y análisis y revisión de homografías.',
 note:'Una ausencia de correspondencia en el índice local NO demuestra que la forma sea incorrecta.',
 totalCandidates:total,
 latin:records.lat,greek:records.grc
};
fs.mkdirSync(output,{recursive:true});
const target=path.join(output,'auditoria-integral-candidatos.json');
fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
const summary={schema:report.schema,totalCandidates:total,
 latin:records.lat.summary,greek:records.grc.summary,
 verifiedPromoted:0,automaticChanges:0};
fs.writeFileSync(path.join(output,'auditoria-integral-resumen.json'),JSON.stringify(summary,null,2)+'\n');
console.log('AUDITORIA_MORFOLOGICA_INTEGRAL '+JSON.stringify(summary));
