/**
 * Transparent Latin regular-model candidates for OFFLINE REFERENCE ONLY.
 * Never use as answer keys; teacher entries and grammar classes can be wrong,
 * defective, or irregular. Only attested rows are trusted for exam grading.
 */
export const MODEL_SOURCE=2;
const P=['1','2','3','1','2','3'];
const N=['SG','SG','SG','PL','PL','PL'];
const norm=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
const suffixes={
 '1ª':{head:/^[a-z]+o$/,base:1,
  present:['o','as','at','amus','atis','ant'],
  imperfect:['abam','abas','abat','abamus','abatis','abant']},
 '2ª':{head:/^[a-z]+eo$/,base:2,
  present:['eo','es','et','emus','etis','ent'],
  imperfect:['ebam','ebas','ebat','ebamus','ebatis','ebant']},
 '3ª':{head:/^[a-z]+o$/,base:1,
  present:['o','is','it','imus','itis','unt'],
  imperfect:['ebam','ebas','ebat','ebamus','ebatis','ebant']},
 '4ª':{head:/^[a-z]+io$/,base:2,
  present:['io','is','it','imus','itis','iunt'],
  imperfect:['iebam','iebas','iebat','iebamus','iebatis','iebant']},
 'mx.':{head:/^[a-z]+io$/,base:2,
  present:['io','is','it','imus','itis','iunt'],
  imperfect:['iebam','iebas','iebat','iebamus','iebatis','iebant']}
};
const perfect=['i','isti','it','imus','istis','erunt'];
const CASE=['NOM','GEN','DAT','ACC','VOC','ABL'];
const NUMBER=['SG','PL'];
function noun(lemma,entry){
 const p=String(entry||'').split(',').map(x=>x.trim());
 if(p.length!==2)return []; // Don't guess adjective, compound, or plural-only paradigms.
 const second=norm(p[1].replace(/[−–—-]/gu,'').replace(/\([^)]*\)/g,'').trim());
 const name=norm(lemma),proper=/^[A-ZĀĂĒĔĪĬŌŎŪŬÆŒ]/u.test(String(entry||'').trim());
 if(!/^[a-z]+$/.test(name))return [];
 let singular,plural;
 if(name.endsWith('a')&&(second==='ae'||second==='æ')){
  const root=name.slice(0,-1);
  singular=[name,root+'ae',root+'ae',root+'am',name,name];
  plural=[root+'ae',root+'arum',root+'is',root+'as',root+'ae',root+'is'];
 }else if((name.endsWith('us')||name.endsWith('um'))&&second==='i'){
  if(name.endsWith('ius'))return []; // Second declension -ius vocative/genitive needs lexical guidance.
  const root=name.slice(0,-2),neuter=name.endsWith('um');
  singular=neuter?[name,root+'i',root+'o',name,name,root+'o']:
   [name,root+'i',root+'o',root+'um',root+'e',root+'o'];
  plural=neuter?[root+'a',root+'orum',root+'is',root+'a',root+'a',root+'is']:
   [root+'i',root+'orum',root+'is',root+'os',root+'i',root+'is'];
 }else return [];
 const result=[];
 for(const [i,num]of NUMBER.entries()){
  if(proper&&num==='PL')continue; // Proper names: no automatically inferred plural.
  for(let k=0;k<6;k++){
   const form=(i===0?singular:plural)[k];
   result.push([form,'N;'+CASE[k]+';'+num]);
  }
 }
 return result;
}
function verb(lemma,entry){
 const original=String(entry||'');
 const match=original.match(/\((1ª|2ª|3ª|4ª|mx\.)\)/);
 if(!match)return [];
 const c=match[1],rule=suffixes[c],first=norm(lemma);
 if(!rule||!rule.head.test(first)||first.endsWith('or'))return [];
 const stem=first.slice(0,-rule.base);
 const out=[];
 for(const [tense,ends]of [
  ['PRS',rule.present],['PST;IPFV',rule.imperfect]
 ]){
  for(let i=0;i<6;i++)out.push([stem+ends[i],'V;IND;ACT;'+tense+';'+P[i]+';'+N[i]]);
 }
 // The perfect principal part is supplied by the teacher, not inferred.
 const fields=original.split(',').map(x=>norm(x.replace(/\([^)]*\)/g,'').trim()));
 const perfection=fields.length>=3?fields[1]:null;
 if(perfection&&/^[a-z]+i$/.test(perfection)&&!perfection.includes(' ')){
  const perfectStem=perfection.slice(0,-1);
  for(let i=0;i<6;i++)out.push([perfectStem+perfect[i],
   'V;IND;ACT;PRF;'+P[i]+';'+N[i]]);
 }
 return out;
}
export function proposeRegularLatin(lemma,entry){
 const form=String(entry||'');
 if(!form||form.includes('/'))return [];
 const result=/\((1ª|2ª|3ª|4ª|mx\.)\)/.test(form)?
  verb(lemma,form):noun(lemma,form);
 return [...new Map(result.map(([surface,features])=>[norm(surface)+'|'+features,
  [norm(surface),features]])).values()];
}
