#!/usr/bin/env python3
"""Build a bounded, reproducible offline lexicon; upstream clones are build inputs only."""
import argparse, collections, hashlib, json, pathlib, re, subprocess, unicodedata
from build_unimorph import classify, normalized
from collatinus_adapter import build as collatinus_build
ROOT = pathlib.Path(__file__).resolve().parents[1]

def key(s):
    return normalized(s).replace('æ','ae').replace('œ','oe').replace('j','i').replace('v','u')

def parse(text):
    language='grc'; unit=None; full=False; entries=[]
    for number,raw in enumerate(text.splitlines(),1):
        line=raw.strip()
        trailing=re.search(r'UDs?\s*\d+\s*[–-]\s*\d+$',line)
        next_unit=None
        if trailing and trailing.start()>0:
            next_unit=int(re.findall(r'\d+',trailing[0])[-1]);line=line[:trailing.start()]
        if line.startswith('Vocabulario completo'): full=True; unit=None
        if line.startswith('Vocabulario por unidades'): language='lat'; full=False; unit=None
        if re.match(r'^UD\d+:',line): continue
        m=re.match(r'^UDs?\s*(\d+)(?:\s*[–−-]\s*(\d+))?$',line)
        if m: unit=int(m[2] or m[1]); continue
        if ':' not in line or not re.search(r'[‘\'“]',line): continue
        entry,meaning=line.split(':',1)
        if not re.match(r'^[A-Za-zÀ-žͰ-Ͽἀ-῾]',entry): continue
        lemma=re.split(r'[,\s(+]',entry)[0].strip()
        entries.append(dict(language=language,entry=entry.strip(),lemma=lemma,meaning=meaning.strip(),unit=None if full else unit,line=number,proper=lemma[0].isupper()))
        if next_unit is not None:unit=next_unit
    # Retain all source occurrences; unassigned full-course entries are lookup-only.
    return entries

def revision(path):
    return subprocess.check_output(['git','-C',str(path),'rev-parse','HEAD'],text=True).strip()

def build(args):
    out=ROOT/'data'/'teacher'; out.mkdir(exist_ok=True)
    source=ROOT/'data/source/vocabulario-docente.txt'; entries=parse(source.read_text())
    paths={name:pathlib.Path(getattr(args,name)) for name in ('lat','grc','lemlat','collatinus','biblissima')}
    coll=set()
    for line in (paths['collatinus']/'bin/data/lemmes.la').read_text().splitlines():
        if not line or line.startswith('!'): continue
        for lemma in re.split(r'[=,]',line.split('|')[0]): coll.add(key(re.sub(r'\d+$','',lemma)))
    lem=set()
    for line in (paths['lemlat']/'lemlat_db.sql').open():
        if line.startswith('INSERT INTO `lemmario` VALUES'):
            lem.update(key(x) for x in re.findall(r"(?:VALUES |,\()\d+,'([^']+)'",line))
    banks={}; reports={}
    for lang in ('lat','grc'):
        selected=[e for e in entries if e['language']==lang]
        bykey=collections.defaultdict(list)
        for e in selected: bykey[key(e['lemma'])].append(e)
        records=[]; provenance={}; paradigms=collections.defaultdict(list)
        for line in (paths[lang]/lang).read_text().splitlines():
            parts=line.split('\t')
            if len(parts)!=3 or key(parts[0]) not in bykey: continue
            lemma,form,tags=parts; f=frozenset(tags.split(';'))
            pos=next((p for p in ('N','ADJ','PRO','V') if p in f),None)
            records.append((lemma,form,tags,pos));provenance[(lemma,form,tags)]='UniMorph'
            if pos in ('N','ADJ'): paradigms[(lemma,pos)].append((form,f))
        # Retain the app's explicitly reviewed Greek present paradigms as a
        # separately attributed supplement; never attribute these to UniMorph.
        if lang=='grc':
            html=(ROOT/'index.html').read_text()
            tables=json.loads(re.search(r'const greekVerbData=(\{.*?\});',html)[1])
            for forms in tables.values():
                lemma=forms[0]
                if key(lemma) not in bykey:continue
                for i,form in enumerate(forms):
                    tags='V;IND;ACT;PRS;'+str(i%3+1)+';'+('SG' if i<3 else 'PL')
                    records.append((lemma,form,tags,'V'));provenance[(lemma,form,tags)]='App:reviewed-present'
        adapter_rejected=[]
        if lang=='lat':
            adapted,adapter_rejected=collatinus_build(paths['collatinus']/'bin/data',bykey,key)
            for lemma,form,tags in adapted:
                f=frozenset(tags.split(';'));pos=next((p for p in ('N','ADJ','PRO','V') if p in f),None)
                records.append((lemma,form,tags,pos));provenance[(lemma,form,tags)]='Collatinus:declarative-adapter'
                if pos in ('N','ADJ'):paradigms[(lemma,pos)].append((form,f))
        lookup=sorted(set((a,b,c) for a,b,c,_ in records)); groups={k:[] for k in ('n','adj','pro','v')}
        for lemma,form,tags,pos in records:
            category=classify(lang,lemma,tags.split(';'),paradigms)
            assigned=[e['unit'] for e in bykey[key(lemma)] if e['unit'] is not None]
            if not category or not assigned: continue
            cat,subtype,grammar=category
            # Contract verbs are only introduced in Greek UD14.
            if lang=='grc' and key(lemma).endswith(('αω','εω','οω')): grammar=max(grammar,14)
            # No proper noun plurals (Greek capitals included).
            if any(e['proper'] for e in bykey[key(lemma)]) and 'PL' in tags.split(';'): continue
            groups[cat].append([lemma,form,tags,max(grammar,min(assigned)),subtype,provenance[(lemma,form,tags)]])
        banks[lang]=dict(lookup=[list(r)+[provenance[r]] for r in lookup],**groups)
        for e in selected:
            e['attestations']=[]
            if lang=='lat':
                if key(e['lemma']) in coll: e['attestations'].append('Collatinus:lemma')
                if key(e['lemma']) in lem: e['attestations'].append('LEMLAT3:lemma')
        covered={key(r[0]) for r in lookup}
        counts=collections.defaultdict(set)
        for r in lookup:counts[key(r[1])].add((key(r[0]),r[2]))
        reports[lang]=dict(entries=len(selected),distinct_lemmas=len(bykey),covered_lemmas=len(covered),forms=len(lookup),adapter_withheld=adapter_rejected,exam_forms=sum(map(len,groups.values())),ambiguous_surfaces=sum(len(v)>1 for v in counts.values()),missing=[es[0]['lemma'] for k,es in sorted(bykey.items()) if k not in covered],lookup_only=[es[0]['lemma'] for es in bykey.values() if not any(e['unit'] is not None for e in es)],lemma_attestations={s:sum(s in e['attestations'] for e in selected) for s in ('Collatinus:lemma','LEMLAT3:lemma')})
    payload=dict(entries=entries,banks=banks)
    serialized=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
    (out/'lexicon.json').write_text(serialized)
    (out/'lexicon.js').write_text('/* Generated by build_teacher_lexicon.py. UniMorph: CC BY-SA 3.0; Collatinus derived forms: GPL-2.0-or-later. See ATTRIBUTION.md. */\nwindow.TEACHER_LEXICON='+serialized.replace('<','\\u003c')+';\n')
    report=dict(source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),revisions={k:revision(p) for k,p in paths.items()},coverage=reports,biblissima='Inspected eulexis.php; required data/greek-analyses.txt and greek-lemmata.txt are absent from repository. No analyses attributed.',validation='LEMLAT3/Collatinus attest lemma spellings only; their engines were not executed. Collatinus paradigms are interpreted by a conservative declarative adapter, withholding suffix-replacement and cross-reference models. UniMorph analyses retain all ambiguity, not independently validated.')
    (out/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(reports,ensure_ascii=False,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser()
    for name in ('lat','grc','lemlat','collatinus','biblissima'): p.add_argument('--'+name,required=True)
    build(p.parse_args())
