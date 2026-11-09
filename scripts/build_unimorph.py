#!/usr/bin/env python3
"""Classify UniMorph paradigms by the teacher's Latin I / Greek I curriculum.

Only unambiguous inflection classes and supported UniMorph features enter exams.
Other rows are counted as withheld; original sources remain upstream.
"""
import collections
import json
import pathlib
import unicodedata
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "unimorph"
OUT.mkdir(parents=True, exist_ok=True)
SOURCES = {
    "lat": "https://raw.githubusercontent.com/unimorph/lat/master/lat",
    "grc": "https://raw.githubusercontent.com/unimorph/grc/master/grc",
}
CASES = {"NOM", "GEN", "DAT", "ACC", "VOC", "ABL"}
KNOWN = CASES | {"SG", "PL", "DU", "MASC", "FEM", "NEUT", "N", "V", "ADJ", "PRO",
    "PRS", "PST", "FUT", "PRF", "IPFV", "PFV", "PSTP", "IND", "IMP", "INF",
    "PTCP", "ACT", "PASS", "MID", "1", "2", "3", "POS", "CMPR", "SPRL"}
UNSUPPORTED = {"SBJV", "OPT", "COND", "DU", "POT", "NEC", "FREQ", "CAUS"}
def normalized(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower())
                   if unicodedata.category(c) != "Mn").replace("ς", "σ")


# Explicit lemma taxonomy: UniMorph PRO does not encode school-grammar subtypes.
# Normalize accents and final sigma, but never guess a subtype from inflection.
PRONOUNS = {
 "lat": {
  "personal": (3, "ego", "tu", "nos", "vos"),
  "reflexive": (3, "sui", "se"),
  "phoric": (5, "is", "ea", "id"),
  "demonstrative": (6, "hic", "haec", "hoc", "ille", "illa", "illud",
                      "iste", "ista", "istud"),
  "relative": (6, "qui", "quae", "quod"),
  "identity": (8, "idem", "eadem", "idem"),
  "emphatic": (8, "ipse", "ipsa", "ipsum"),
 },
 "grc": {
  "personal": (7, "εγω", "συ", "ημεισ", "υμεισ"),
  "demonstrative": (7, "ουτοσ", "αυτη", "τουτο", "οδε", "ηδε", "τοδε",
                      "εκεινοσ", "εκεινη", "εκεινο"),
  "anaphoric": (7, "αυτοσ", "αυτη", "αυτο"),
  "interrogative": (8, "τισ"),
  "relative": (9, "οσ", "η", "ο"),
 },
}
# Some lemmas (e.g. Greek τις, αὐτή) are homographs across categories.
# Ambiguous lemma spellings are withheld rather than silently assigned.
def pronoun_class(lang, lemma):
    key = normalized(lemma)
    matches = [(subtype, unit) for subtype, (unit, *lemmas) in PRONOUNS[lang].items()
               if key in {normalized(x) for x in lemmas}]
    if len(matches) != 1:
        return None
    subtype, unit = matches[0]
    return ("pro", subtype, unit)

def adjective_class(lang, lemma, paradigm, tags):
    """Infer adjective paradigm only from attested gender-specific NOM/GEN forms."""
    f = set(tags)
    if "CMPR" in f or "SPRL" in f:
        if lang != "lat":
            return None
        degree = "comparative" if "CMPR" in f else "superlative"
        return ("adj", degree, 9)
    if "POS" not in f and ("CMPR" in f or "SPRL" in f):
        return None
    nom = collections.defaultdict(set)
    gen = collections.defaultdict(set)
    for form, features in paradigm:
        if "SG" not in features:
            continue
        gender = next((g for g in ("MASC", "FEM", "NEUT") if g in features), None)
        if gender is None:
            continue
        if "NOM" in features:
            nom[gender].add(normalized(form))
        if "GEN" in features:
            gen[gender].add(normalized(form))
    if not nom["MASC"] or not nom["NEUT"] or not gen["MASC"]:
        return None
    if lang == "lat":
        first = (any(x.endswith(("us", "er")) for x in nom["MASC"]) and
                 any(x.endswith("um") for x in nom["NEUT"]) and
                 any(x.endswith("i") for x in gen["MASC"]) and
                 any(x.endswith("a") for x in nom["FEM"]))
        third = (any(x.endswith(("e", "ns")) for x in nom["NEUT"]) and
                 any(x.endswith("is") for x in gen["MASC"]))
        if first and not third:
            return ("adj", "first-class", 2)
        if third and not first:
            return ("adj", "third-class", 5)
    else:
        two_one_two = (any(x.endswith("οσ") for x in nom["MASC"]) and
                       any(x.endswith("ον") for x in nom["NEUT"]) and
                       any(x.endswith(("η", "α")) for x in nom["FEM"]) and
                       any(x.endswith("ου") for x in gen["MASC"]))
        two_two = (any(x.endswith("οσ") for x in nom["MASC"]) and
                   any(x.endswith("ον") for x in nom["NEUT"]) and
                   not nom["FEM"] and any(x.endswith("ου") for x in gen["MASC"]))
        # UniMorph often marks two-ending adjectives' shared M/F form as MASC.
        if two_one_two:
            return ("adj", "2-1-2", 5)
        if two_two:
            return ("adj", "2-2", 5)
    return None

def declension(lang, lemma, paradigm):
    """Require a nominative lemma and an attested singular genitive; fail closed."""
    gen = {normalized(form) for form, tags in paradigm
           if "GEN" in tags and "SG" in tags}
    nom = normalized(lemma)
    if not gen:
        return None
    if lang == "lat":
        # A genitive suffix alone is not enough for 3rd/4th/5th declensions.
        if nom.endswith("a") and any(x.endswith("ae") for x in gen):
            return ("first", 1)
        if (nom.endswith(("us", "um", "er", "ir")) and
                any(x.endswith("i") for x in gen)):
            return ("second", 1)
        if any(x.endswith("ei") for x in gen) and nom.endswith(("es", "ies")):
            return ("fifth", 7)
        if any(x.endswith("us") for x in gen) and nom.endswith(("us", "u")):
            return ("fourth", 7)
        # Third declension: exclude nouns with potential second/fourth/fifth endings.
        if (any(x.endswith("is") for x in gen) and
                not nom.endswith(("a", "um", "us"))):
            return ("third", 4)
    else:
        if nom.endswith("ον") and any(x.endswith("ου") for x in gen):
            return ("second-neuter", 2)
        if nom.endswith("οσ") and any(x.endswith("ου") for x in gen):
            return ("second-masculine", 1)
        if nom.endswith(("α", "η", "ασ", "ησ")) and any(
                x.endswith(("ασ", "ησ", "ου")) for x in gen):
            # -ου genitives of first-declension masculines require nominative -ας/-ης.
            if nom.endswith(("ασ", "ησ")) or any(x.endswith(("ασ", "ησ")) for x in gen):
                return ("first", 3)
        if any(x.endswith(("οσ", "ωσ", "ουσ", "εωσ")) for x in gen):
            # -ου is common in 2nd declension; never infer 3rd from -ου alone.
            if all(not x.endswith("ου") for x in gen):
                return ("third", 8)
    return None

def verb_unit(lang, tags):
    f = set(tags)
    if f & UNSUPPORTED:
        return None
    if "V" not in f:
        return None
    if "PTCP" in f:
        if lang == "lat":
            return 10
        if "FUT" in f or "PRF" in f or "PST" in f:
            return None
        return 10
    if "IMP" in f:
        return 3 if lang == "lat" else None
    if "INF" in f:
        if lang == "lat":
            if "PRF" in f or "PST" in f or "FUT" in f:
                return 8
            return 1 if "PASS" not in f else 3
        if "PRF" in f or "PST" in f or "FUT" in f:
            return None
        return 6
    if "IND" not in f:
        return None
    if lang == "lat":
        if "FUT" in f:
            unit = 7
        elif "PRF" in f or "PSTP" in f:
            unit = 4
        elif "PST" in f and "IPFV" not in f:
            unit = 4
        elif "PST" in f or "IPFV" in f:
            unit = 2
        elif "PRS" in f:
            unit = 1
        else:
            return None
        if "PASS" in f:
            unit = max(unit, 9 if "PRF" in f or "PSTP" in f else 3)
        return unit
    if "PRF" in f or "PSTP" in f:
        unit = 13
    elif "PFV" in f:
        unit = 12
    elif "FUT" in f:
        unit = 11
    elif "PST" in f:
        unit = 11
    elif "PRS" in f:
        unit = 2
    else:
        return None
    if "MID" in f or "PASS" in f:
        unit = max(unit, 6)
    return unit

def classify(lang, lemma, tags, paradigms):
    f = set(tags)
    if f & UNSUPPORTED:
        return None
    pos = next((p for p in ("N", "ADJ", "PRO", "V") if p in f), None)
    if pos == "V":
        u = verb_unit(lang, f)
        if lang == "grc" and normalized(lemma) in {"ειμι", "ειμί"} and u == 2 and "PRS" in f and "ACT" in f:
            u = 1
        return ("v", "verb", u) if u is not None else None
    if pos == "N":
        if not (f & CASES):
            return None
        result = declension(lang, lemma, paradigms.get((lemma, pos), []))
        return ("n", result[0], result[1]) if result else None
    if pos == "ADJ":
        return adjective_class(lang, lemma, paradigms.get((lemma, pos), []), f)
    if pos == "PRO":
        return pronoun_class(lang, lemma)
    return None

def build(lang, url):
    records = []
    paradigms = collections.defaultdict(list)
    total = 0
    with urllib.request.urlopen(url, timeout=240) as response:
        for raw in response:
            try:
                lemma, form, tags = raw.decode("utf-8").strip().split("\t")[:3]
            except (UnicodeDecodeError, ValueError):
                continue
            total += 1
            if not lemma or not form or len(form) > 70:
                continue
            features = frozenset(tags.split(";"))
            pos = next((p for p in ("N", "ADJ", "PRO", "V") if p in features), None)
            if pos is None:
                continue
            records.append((lemma, form, tags, pos))
            if pos in ("N", "ADJ"):
                paradigms[(lemma, pos)].append((form, features))
    groups = collections.defaultdict(list)
    rejected = collections.Counter()
    for lemma, form, tags, pos in records:
        category = classify(lang, lemma, tags.split(";"), paradigms)
        if category is None:
            rejected[pos] += 1
            continue
        filename, subtype, unit = category
        groups[filename].append([lemma, form, tags, unit, subtype])
    files = {}
    for category, rows in groups.items():
        rows.sort(key=lambda r: (r[3], r[0], r[1], r[2]))
        filename = f"{lang}-{category}.json"
        (OUT / filename).write_text(json.dumps({
            "source": url, "language": lang, "category": category,
            "rows": rows}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        files[category] = {"path": filename, "records": len(rows)}
    manifest = {
        "language": lang, "source": url, "source_records": total,
        "classified_records": sum(len(rows) for rows in groups.values()),
        "excluded_by_pos": dict(rejected), "files": files,
        "policy": "Conservative: adjectives require attested paradigms; pronouns require an unambiguous lemma taxonomy; unsupported forms are withheld.",
    }
    (OUT / f"{lang}-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(lang, json.dumps(manifest, ensure_ascii=False))

if __name__ == "__main__":
    for language, source in SOURCES.items():
        build(language, source)
