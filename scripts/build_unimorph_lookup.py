#!/usr/bin/env python3
"""Publish searchable full UniMorph rows, separate from curricular exam filters.

Each language is sharded by the first character of a diacritic-free query.
Both form and lemma indices retain all attested analyses, including ambiguous
ones. No grammatical interpretation or curricular filtering is applied.
"""
import collections
import json
import pathlib
import unicodedata
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "unimorph" / "lookup"
SOURCES = {
    "lat": "https://raw.githubusercontent.com/unimorph/lat/master/lat",
    "grc": "https://raw.githubusercontent.com/unimorph/grc/master/grc",
}

def normalize(value):
    value = unicodedata.normalize("NFD", value.strip().lower())
    return "".join(c for c in value if unicodedata.category(c) != "Mn").replace("ς", "σ")

def shard(value):
    key = normalize(value)
    first = key[:1]
    return f"{ord(first):04x}" if first else "empty"

def build(language, url):
    forms = collections.defaultdict(list)
    lemmas = collections.defaultdict(list)
    seen = set()
    with urllib.request.urlopen(url, timeout=300) as response:
        for raw in response:
            line = raw.decode("utf-8").strip()
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            lemma, form, features = parts[0], parts[1], ";".join(parts[2:])
            if not lemma or not form or not features:
                continue
            record = (lemma, form, features)
            if record in seen:
                continue
            seen.add(record)
            forms[shard(form)].append(record)
            lemmas[shard(lemma)].append(record)
    target = OUT / language
    target.mkdir(parents=True, exist_ok=True)
    # Drop obsolete shards when upstream coverage changes.
    for old in target.glob("*.json"):
        old.unlink()
    for mode, bank in (("form", forms), ("lemma", lemmas)):
        for prefix, records in bank.items():
            path = target / f"{mode}-{prefix}.json"
            path.write_text(json.dumps(records, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    manifest = {
        "source": url, "language": language, "records": len(seen),
        "form_shards": sorted(forms), "lemma_shards": sorted(lemmas),
        "purpose": "Full reference lookup; never used as verified exam data",
    }
    (target / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(language, len(seen), "records", len(forms), "form shards", len(lemmas), "lemma shards")

if __name__ == "__main__":
    for language, url in SOURCES.items():
        build(language, url)
