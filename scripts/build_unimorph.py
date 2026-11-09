#!/usr/bin/env python3
"""Build compact UniMorph indexes for GitHub Pages; source data is never loaded by browsers."""
import json, pathlib, urllib.request, collections, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'unimorph'
OUT.mkdir(parents=True,exist_ok=True)
SOURCES={'lat':'https://raw.githubusercontent.com/unimorph/lat/master/lat','grc':'https://raw.githubusercontent.com/unimorph/grc/master/grc'}
# Conservative curriculum: categories/inflections appear only when explicitly taught.
LAT={'N':1,'V':1,'ADJ':2,'PRO':3}
GRC={'N':1,'V':2,'ADJ':5,'PRO':7}
def min_unit(lang,features):
 f=set(features.split(';')); pos=next((x for x in ('N','V','ADJ','PRO') if x in f),None)
 if not pos:return None
 u=(LAT if lang=='lat' else GRC)[pos]
 if lang=='lat':
  if 'N' in f:
   if 'NOM' not in f and 'GEN' not in f and not (f&{'ACC','DAT','ABL','VOC'}):return None
   # UniMorph does not encode declension reliably. The complete noun pool must be
   # classified separately before it can be used as an exam source.
   return None
  if 'ADJ' in f:return None # adjective class not encoded reliably
  if 'PRO' in f:return None # pronoun subclass not encoded reliably
  if 'V' in f:
   if 'PST' in f or 'PRF' in f or 'PSTP' in f:return None
   if 'FUT' in f or 'SBJV' in f or 'COND' in f:return None
   if 'PASS' in f:u=max(u,3)
   if 'IMP' in f:u=max(u,3)
   if 'IPFV' in f:u=max(u,2)
   if 'PTCP' in f:return None
 else:
  if 'N' in f:return None # Greek declension must be validated by class
  if 'ADJ' in f:return None
  if 'PRO' in f:return None
  if 'V' in f:
   if 'FUT' in f:u=max(u,11)
   if 'PST' in f:u=max(u,11)
   if 'PFV' in f:u=max(u,12)
   if 'PRF' in f:u=max(u,13)
   if 'MID' in f or 'PASS' in f:u=max(u,6)
   if 'PTCP' in f:u=max(u,10)
   if 'SBJV' in f or 'OPT' in f:return None
 return u
def build(lang,url):
 groups=collections.defaultdict(list);total=0
 with urllib.request.urlopen(url,timeout=240) as resp:
  for raw in resp:
   try:lemma,form,tags=raw.decode('utf-8').strip().split('\t')[:3]
   except ValueError:continue
   total+=1
   if not lemma or not form or len(form)>70:continue
   u=min_unit(lang,tags)
   if u is None:continue
   # Preserve analyses; do not assert that an isolated form has one reading.
   pos=next((p for p in ('V','N','ADJ','PRO') if p in tags.split(';')),None)
   if not pos:continue
   groups[pos].append([lemma,form,tags,u])
 for pos,rows in groups.items():
  path=OUT/f'{lang}-{pos.lower()}.json'
  path.write_text(json.dumps({'source':url,'language':lang,'pos':pos,'rows':rows},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 manifest={'source':url,'language':lang,'records':total,'files':{pos.lower():{'path':f'{lang}-{pos.lower()}.json','records':len(rows)} for pos,rows in groups.items()},'notice':'Only conservatively classified forms are eligible; remaining UniMorph records are excluded from exam selection.'}
 (OUT/f'{lang}-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
 print(lang,total,{k:len(v) for k,v in groups.items()})
for lang,url in SOURCES.items():build(lang,url)
