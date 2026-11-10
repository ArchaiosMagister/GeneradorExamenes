#!/usr/bin/env node
/**
 * Import fully spelled/accented Greek nominal candidates from Wiktextract.
 * Strict POS, slot, lexical-entry and cross-index checks.
 * Candidate-only: never used as exam solutions or definitive lemmatization.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SOURCE='https://kaikki.org/dictionary/Ancient%20Greek/kaikki.org-dictionary-AncientGreek.jsonl';
const target=path.join(root,'data/lemmas/greek-nominal-candidates.json');
const fixture=process.argv[2];
const norm=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/ς/g,'σ').trim();
// Keep rough/smooth breathings when deciding whether the headword matches.
// Accent and length marks vary between source spellings, breathing does not.
const lexicalNorm=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/[\u0300\u0301\u0342\u0304\u0306]/gu,'').replace(/\u0345/g,'ι')
 .replace(/ς/g,'σ').trim();
const vocabulary=JSON.parse(fs.readFileSync(path.join(root,'data/lemmas/teacher-forms.json'),'utf8'));
if(vocabulary.schema!==1||!vocabulary.vocabulary?.grc||!Array.isArray(vocabulary.rows?.grc))
 throw Error('Falta el inventario docente offline');
const lexicon=vocabulary.vocabulary.grc;
const attested=new Map();
for(const [lemma,form,tags,source]of vocabulary.rows.grc){
 if(![0,1].includes(source)||!/^N;|^ADJ;/.test(tags))continue;
 if(/;DU(?:;|$)/.test(tags))continue;
 const id=lemma+'|'+tags;
 if(!attested.has(id))attested.set(id,new Set());
 attested.get(id).add(norm(form));
}
const cas={nominative:'NOM',genitive:'GEN',dative:'DAT',accusative:'ACC',vocative:'VOC'};
const num={singular:'SG',plural:'PL'};
const sex={masculine:'MASC',feminine:'FEM',neuter:'NEUT'};
const allowed=new Set([...Object.keys(cas),...Object.keys(num),...Object.keys(sex)]);
function slot(form,kind){
 const tags=form.tags;
 if(!Array.isArray(tags)||tags.some(t=>!allowed.has(t)))return null;
 const hits=record=>Object.keys(record).filter(k=>tags.includes(k));
 const cs=hits(cas),ns=hits(num),ss=hits(sex);
 if(cs.length!==1||ns.length!==1||ss.length>(kind==='N'?1:1))return null;
 if(kind==='ADJ'&&ss.length!==1)return null;
 const surface=String(form.form||'').trim();
 if(!/^[\u0370-\u03ff\u1f00-\u1fff\p{M}]+$/u.test(surface)||surface.length>40)return null;
 // Preserve source orthography, but exclude accentless forms (not acceptable Greek display).
 if(!/[\u0300\u0301\u0342]/u.test(surface.normalize('NFD')))return null;
 return {tag:[kind,cas[cs[0]],num[ns[0]],...(kind==='ADJ'?[sex[ss[0]]]:[])].join(';'),surface};
}
function matchesTeacher(lemma,kind,cells){
 const lex=lexicon[lemma]?.gr1?.entry;
 if(!lex||!lex.includes(','))return false;
 const parts=lex.split(',').map(x=>x.trim());
 const nom=kind==='ADJ'?'ADJ;NOM;SG;MASC':'N;NOM;SG';
 if(!cells.has(nom)||!cells.get(nom).has(lemma))return false;
 if(kind==='ADJ'){
  if(parts.length<2||/\b(?:num|indecl|pron)\b/i.test(lex))return false;
  // Exclude nouns in -ος, -ου incorrectly listed with adjective homonyms.
  const second=norm(parts[1].replace(/^[\s−–—-]+/u,'').replace(/\([^)]*\)/g,'').trim());
  return parts.length>=3? /^(?:η|α|ον)$/.test(second):/^(?:ον|εσ)$/.test(second);
 }
 if(parts.length!==2)return false;
 const suffix=norm(parts[1].replace(/\([^)]*\)/g,'').replace(/^[\s−–—-]+/u,'').trim());
 if(!suffix||suffix.length<2||suffix.length>20)return false;
 const gen=cells.get('N;GEN;SG');
 return !!gen&&[...gen.keys()].some(g=>g.endsWith(suffix));
}
async function openSource(){
 if(fixture){
  const file=path.resolve(root,fixture);
  if(!file.startsWith(root+path.sep))throw Error('La muestra debe estar dentro del repositorio');
  return {stream:fs.createReadStream(file,{encoding:'utf8'}),origin:'fixture:'+fixture};
 }
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),180000);
 try{
  const res=await fetch(SOURCE,{signal:controller.signal,headers:{'User-Agent':'ClassicsVocabularyOffline/1.0'}});
  if(!res.ok||!res.body)throw Error('Wiktextract respondió HTTP '+res.status);
  return {stream:Readable.fromWeb(res.body),origin:SOURCE,cancel:()=>clearTimeout(timer)};
 }catch(e){clearTimeout(timer);throw e}
}
const grouped=new Map(),stats={read:0,matched:0,unsafeForms:0,unmatchedEntries:0};
const {stream,origin,cancel}=await openSource();
try{
 const reader=readline.createInterface({input:stream,crlfDelay:Infinity});
 for await(const line of reader){
  stats.read++;
  if(!line.trim())continue;
  let r;
  try{r=JSON.parse(line)}catch{continue}
  if(r.lang_code!=='grc'||!['noun','adj'].includes(r.pos)||!Array.isArray(r.forms))continue;
  const lemma=norm(r.word);
  if(!lexicon[lemma]?.gr1){stats.unmatchedEntries++;continue}
  const teacherHead=lexicon[lemma].gr1.entry.split(',')[0].trim();
  if(lexicalNorm(r.word)!==lexicalNorm(teacherHead)){stats.unmatchedEntries++;continue}
  const kind=r.pos='noun'?'N':'ADJ',id=lemma+'|'+kind;
  if(!grouped.has(id))grouped.set(id,{lemma,word:r.word,kind,cells:new Map()});
  stats.matched++;
  const group=grouped.get(id);
  for(const f of r.forms){
   const q=slot(f,kind);
   if(!q){stats.unsafeForms++;continue}
   if(!group.cells.has(q.tag))group.cells.set(q.tag,new Map());
   const vals=group.cells.get(q.tag);
   vals.set(norm(q.surface),q.surface);
  }
 }
}finally{cancel?.()}
const output={
 schema:1,status:'WIKTIONARY_CANDIDATES_NOT_FOR_GRADING',
 source:origin,
 attribution:'Wiktionary contributors, extracted by Wiktextract/kaikki.org',
 license:'CC BY-SA 4.0',license_url:'https://creativecommons.org/licenses/by-sa/4.0/',
 warning:'Forms retain source accents but are provisional; NEVER use for answer keys or automatic glossary resolution.',
 stats:{...stats,acceptedLemmas:0,additionalRows:0,consistentSlots:0,
  conflicts:0,lexicalMismatch:0,insufficient:0,ambiguousCells:0},
 entries:[]
};
for(const g of grouped.values()){
 const cells=new Map();
 for(const [tag,vals]of g.cells){
  if(vals.size!==1){output.stats.ambiguousCells++;continue}
  cells.set(tag,vals);
 }
 if(!matchesTeacher(g.lemma,g.kind,cells)){if(fixture)console.log('RECHAZO FICHA',g.lemma,g.kind,lexicon[g.lemma]?.gr1?.entry,[...cells.keys()].slice(0,5));output.stats.lexicalMismatch++;continue}
 const min=g.kind==='N'?7:9;
 if(cells.size<min){output.stats.insufficient++;continue}
 let conflicts=0,matched=0;
 const news=[];
 for(const [tag,vals]of cells){
  const [normalized,surface]=vals.entries().next().value;
  const prior=attested.get(g.lemma+'|'+tag);
  if(prior?.size){
   if(prior.has(normalized))matched++;
   else conflicts++;
  }else news.push([surface,tag]);
 }
 if(conflicts){output.stats.conflicts++;continue}
 if(!news.length)continue;
 output.entries.push({
  lemma:g.lemma,kind:g.kind,word:g.word,
  source_page:'https://en.wiktionary.org/wiki/'+encodeURIComponent(g.word),
  matchingSlots:matched,
  forms:news.sort((a,b)=>a[1].localeCompare(b[1]))
 });
 output.stats.consistentSlots+=matched;
 output.stats.additionalRows+=news.length;
 output.stats.acceptedLemmas++;
}
output.entries.sort((a,b)=>a.lemma.localeCompare(b.lemma,'el'));
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log('Nominales griegos candidatos: '+JSON.stringify(output.stats)+
 '; no se generan respuestas evaluables.');
