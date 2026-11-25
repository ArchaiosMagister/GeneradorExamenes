#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync,execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const [suite,shardArg]=process.argv.slice(2);
const browserTests=[
 'test-academic-evidence-browser.cjs',
 'test-auditoria-ui.cjs',
 'test-bidirectional-editors.cjs',
 'test-compact-exam-sidebar.cjs',
 'test-correcciones-latin.cjs',
 'test-eulexis-browser.cjs',
 'test-exam-external-gloss.cjs',
 'test-exam-glossary.cjs',
 'test-exam-indent-consistency.cjs',
 'test-exam-ui-redesign.cjs',
 'test-export-workspace.cjs',
 'test-final-export-preflight.cjs',
 'test-greek-academic-expansion.cjs',
 'test-greek-all-unit-form-quotas.cjs',
 'test-greek-choice-audit.cjs',
 'test-greek-choice-bullets-spacing.cjs',
 'test-greek-choice-groups.cjs',
 'test-greek-choice-number-glossary.cjs',
 'test-greek-choice-semantics-and-isolation.cjs',
 'test-greek-complete-ud5-regressions.cjs',
 'test-greek-etymology-distinct-roots.cjs',
 'test-greek-morph-regeneration.cjs',
 'test-greek-movable-nu-browser.cjs',
 'test-greek-question-regeneration.cjs',
 'test-greek-review-browser.cjs',
 'test-greek-two-ending-adjectives.cjs',
 'test-greek-two-modes-legacy-drafts.cjs',
 'test-greek-ud5-quota-indent.cjs',
 'test-greek-ui.cjs',
 'test-latin-deponents-ud7-ud9-20261122.cjs',
 'test-latin-deponents-ud9-ud10-present-20261122.cjs',
 'test-latin-hostis-ignis-20261122.cjs',
 'test-latin-mf-i-stems-20261122.cjs',
 'test-latin-neuter-i-stems-20261122.cjs',
 'test-latin-nominal-integrity.cjs',
 'test-latin-passive-phrases.cjs',
 'test-latin-semantic-syntagms.cjs',
 'test-latin-third-declension-forms.cjs',
 'test-latin-third-declension-table.cjs',
 'test-latin-verbal-curriculum-20261122.cjs',
 'test-latin-vir-paradigm-20261122.cjs',
 'test-latin4-conjugation-isolated-forms.cjs',
 'test-lemma-browser.cjs',
 'test-lemma-review-theme.cjs',
 'test-lex-menu-sync.cjs',
 'test-lex-part-regeneration.cjs',
 'test-morph-question-isolation.cjs',
 'test-morph-quotas-curriculum-regeneration.cjs',
 'test-nominal-agreement.cjs',
 'test-per-question-visual-format.cjs',
 'test-phase-five.cjs',
 'test-phase-four-review-browser.cjs',
 'test-phase-one.cjs',
 'test-phase-six.cjs',
 'test-phase-three-integration.cjs',
 'test-phonetic-filter-isolation.cjs',
 'test-preview.cjs',
 'test-question-part-regeneration.cjs',
 'test-question-visual-layout.cjs',
 'test-real-exam-audit.cjs',
 'test-sentence-points-and-drafts.cjs',
 'test-single-word-regeneration.cjs',
 'test-sintagmas-aprobados-169.cjs',
 'test-subquestion-scoring.cjs',
 'test-syntagm-variation.cjs',
 'test-toolbar-button-sizes.cjs',
 'test-ui-refinement.cjs',
 'test-valencian-imperative.cjs',
 'test-valenciano-browser.cjs',
 'test-verb-curriculum-browser.cjs',
 'test-vg-unit-controls.cjs',
 'test-vocabulary.cjs',
 'test-word-gloss-columns.cjs',
 'test-word-palatino.cjs',
];
const offlineFlags=new Set([
 'test-filologia-cantidad-latina-20261121.cjs',
 'test-filologia-latin-griego-20261121.cjs',
 'test-filologia-latin4-final-o-20261122.cjs',
 'test-filologia-regimen-acento-20261121.cjs',
 'test-greek-absolute-genitives-20261121.cjs',
 'test-greek-relative-grave-20261121.cjs',
 'test-greek-sentence-philology-20261121.cjs',
]);
const audits=[
 ['check-web.mjs'],
 ['audit-verbs-evidence.cjs'],
 ['audit-verb-coverage.cjs'],
 ['audit-sentence-lemmas.cjs'],
 ['audit-top-50-lemmas.cjs','--check'],
 ['audit-next-100-lemmas.cjs','--check'],
 ['audit-latin1-generated.cjs','--minimum=429'],
 ['audit-latin1-rest-183.cjs'],
 ['audit-greek-frequent-100.cjs']
];
const groups=4;
const shard=Number(shardArg);
let checks;
switch(suite){
 case 'sources': {
  const skip=new Set([...browserTests,'test-device-compat.cjs','test-pwa.cjs']);
  checks=fs.readdirSync(__dirname).filter(name=>/^test-.*\.[cm]js$/.test(name)&&!skip.has(name))
   .sort().map(name=>[name,...(offlineFlags.has(name)?['--offline']:[])]);
  checks.push(...audits);
  break;
 }
 case 'chromium':
  if(!Number.isInteger(shard)||shard<1||shard>groups)throw Error('Shard Chromium inválido');
  checks=browserTests.filter((_,index)=>index%groups===shard-1).map(name=>[name]);
  break;
 case 'compatibility':
  checks=[['test-pwa.cjs'],['test-device-compat.cjs'],['test-export-workspace.cjs'],
   ['test-exam-external-gloss.cjs'],['test-latin-third-declension-table.cjs']];
  break;
 default:
  throw Error('Uso: node scripts/check-release.cjs sources | chromium <1–4> | compatibility');
}

const directory=path.join(root,'test-artifacts','ci',shardArg?suite+'-'+shard:suite);
fs.mkdirSync(directory,{recursive:true});
// GitHub monta el checkout con el propietario del runner dentro del contenedor.
const commit=execFileSync('git',['-c','safe.directory='+root,'rev-parse','HEAD'],{
 cwd:root,encoding:'utf8'
}).trim();
if(process.env.GITHUB_SHA&&process.env.GITHUB_SHA!==commit)
 throw Error('El checkout de CI no coincide con GITHUB_SHA');
const results=[];
for(const [name,...args] of checks){
 const file=fs.openSync(path.join(directory,name+'.log'),'w');
 let run;
 try{
  const env=suite==='compatibility'?
   {...process.env,PDF_TEST_BROWSER:'webkit',EXAM_TEST_BROWSER:'webkit'}:process.env;
  run=spawnSync(process.execPath,[path.join(__dirname,name),...args],{
   cwd:root,env,stdio:['ignore',file,file],timeout:660_000
  });
 }finally{fs.closeSync(file)}
 const ok=run.status===0;
 results.push({name,args,ok,exit:run.status,signal:run.signal,error:run.error?.message});
 console.log((ok?'OK   ':'FALLO')+' '+[name,...args].join(' '));
 if(!ok)console.error(fs.readFileSync(path.join(directory,name+'.log'),'utf8').slice(-5000));
}
fs.writeFileSync(path.join(directory,'summary.json'),JSON.stringify({commit,suite,shard:shardArg,results},null,2)+'\n');
process.exitCode=results.some(result=>!result.ok)?1:0;
