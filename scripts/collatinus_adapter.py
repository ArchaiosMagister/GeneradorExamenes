"""Conservative reader of Collatinus' documented declarative paradigms.

Does not run or reproduce the full lemmatizer. Suffix-replacement models and cross-reference
lemmas are withheld. Source data remain upstream; only requested lemmas exported.
"""
import collections, re, unicodedata

def plain(s):
    return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn')

def interval(s):
    result=[]
    for part in s.split(','):
        bounds=list(map(int,part.split('-')))
        result.extend(range(bounds[0],bounds[-1]+1))
    return result

def read_models(path):
    constants={}; raw={}; name=None
    for line in path.read_text().splitlines():
        line=line.strip()
        if not line or line.startswith('!'): continue
        if line.startswith('$'):
            k,v=line.split('=',1); constants[k]=v;continue
        if line.startswith('modele:'): name=line.split(':')[1];raw[name]=[]
        elif name: raw[name].append(line)
    models={}
    def model(name):
        if name in models:return models[name]
        lines=raw[name]; parent=next((l.split(':')[1] for l in lines if l.startswith('pere:')),None)
        base=model(parent) if parent else dict(roots={},endings={},pos='',unsupported=False)
        roots=base['roots'].copy(); endings={k:v[:] for k,v in base['endings'].items()};absent=set(); own={}; suffixes=[]
        pos=base['pos']; unsupported=base['unsupported']
        for line in lines:
            for const,value in constants.items():
                # Prefix before a variable is repeated for every semicolon member.
                line=re.sub(r'([^:;]*?)'+re.escape(const)+r'\b',lambda m:';'.join(m[1]+x for x in value.split(';')),line)
            fields=line.split(':'); cmd=fields[0]
            if cmd=='R': roots[int(fields[1])]=plain(fields[2])
            elif cmd in ('des','des+'):
                variants=fields[3].split(';')
                for i,n in enumerate(interval(fields[1])):
                    values=[(int(fields[2]),re.sub(r'[1-9]$','',plain(v)).replace('-','')) for v in variants[min(i,len(variants)-1)].split(',')]
                    own.setdefault(n,[]).extend(values)
                    if cmd=='des+':own[n].extend(base['endings'].get(n,[]))
            elif cmd=='abs':absent=set(interval(fields[1]))
            elif cmd=='abs+':absent.update(interval(fields[1]))
            elif cmd=='pos':pos=fields[1]
            elif cmd=='suf':suffixes.append((interval(fields[1]),plain(fields[2])))
            elif cmd=='sufd':unsupported=True
        endings.update(own)
        for n in absent:endings.pop(n,None)
        for ids,suffix in suffixes:
            for n in ids:
                endings.setdefault(n,[]).extend((root,ending+suffix) for root,ending in endings.get(n,[])[:])
        result=dict(roots=roots,endings=endings,pos=pos,unsupported=unsupported)
        models[name]=result;return result
    for name in raw:model(name)
    return models

def features(number,pos):
    # Morphology numbers are defined in morphos.es / modeles.la.
    case=['NOM','VOC','ACC','GEN','DAT','ABL']
    if 1<=number<=120:
        cat={'n':'N','a':'ADJ','p':'PRO','m':'ADJ'}.get(pos)
        if not cat:return None
        index=(number-1)%12
        f=[cat,case[index%6],'SG' if index<6 else 'PL']
        if number>=13:f.append(['MASC','FEM','NEUT'][((number-13)%36)//12])
        if number>=49:f.append('CMPR' if number<85 else 'SPRL')
        return ';'.join(f)
    if 121<=number<=156 or 267<=number<=284:
        passive=number>=267;start=267 if passive else 121;block=(number-start)//6;index=(number-start)%6
        tense=['PRS','PST;IPFV','FUT','PRF','PSTP','FUT;PRF'][block]
        return 'V;IND;'+('PASS' if passive else 'ACT')+';'+tense+';'+str(index%3+1)+';'+('SG' if index<3 else 'PL')
    if number in (187,188,302):return 'V;INF;'+('PASS' if number==302 else 'ACT')+';'+('PRF' if number==188 else 'PRS')
    if 189<=number<=260 or 303<=number<=338:
        start=303 if number>=303 else 225 if number>=225 else 189
        index=(number-start)%12;gender=['MASC','FEM','NEUT'][(number-start)//12]
        return ';'.join(['V','PTCP','PRF' if start==303 else 'FUT' if start==225 else 'PRS','PASS' if start==303 else 'ACT',case[index%6],'SG' if index<6 else 'PL',gender])
    if number in (414,416):return 'INDECL'
    return None

def build(path,requested,key):
    models=read_models(path/'modeles.la'); records=[]; rejected=[]
    irregular=collections.defaultdict(list)
    for line in (path/'irregs.la').read_text().splitlines():
        if not line or line.startswith('!'):continue
        fields=line.split(':')
        if len(fields)!=3:continue
        form,lemma,ids=fields
        irregular[key(lemma)].append((plain(form.rstrip('*')),interval(ids),'*' in form))
    for line in (path/'lemmes.la').read_text().splitlines():
        if not line or line.startswith('!'):continue
        fields=line.split('|')
        if len(fields)<5:continue
        lemma=plain(re.sub(r'\d+$','',fields[0].split('=')[0])); k=key(lemma)
        if k not in requested:continue
        m=models.get(fields[1])
        if not m or m['unsupported'] or 'cf.' in fields[4]:rejected.append(lemma);continue
        canonical=plain(fields[0].split('=')[-1]);canonical=re.sub(r'\d+$','',canonical)
        roots={i:plain(fields[i+1]).split(',') for i in (1,2) if fields[i+1]}
        for i,rule in m['roots'].items():
            if i in roots or rule=='-':continue
            if rule=='K':roots[i]=canonical.split(',');continue
            cut,add=rule.split(',');cut=int(cut)
            roots[i]=[(c[:-cut] if cut else c)+('' if add=='0' else add) for c in canonical.split(',')]
        exclusive={n for _,ids,ex in irregular[k] if ex for n in ids}
        pos=m['pos']
        if 'adj.' in fields[4]:pos='a'
        if 'pron.' in fields[4]:pos='p'
        if re.search(r'adv\.|conj|prép|interj',fields[4]):pos='d'
        for n,endings in m['endings'].items():
            tag=features(n,pos)
            if not tag or n in exclusive:continue
            for root,ending in endings:
                for stem in roots.get(root,[]):records.append((lemma,stem+ending,tag))
        for form,ids,_ in irregular[k]:
            for n in ids:
                tag=features(n,pos)
                if tag:records.append((lemma,form,tag))
    return sorted(set(records)),sorted(set(rejected))
