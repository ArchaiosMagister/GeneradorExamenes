#!/usr/bin/env python3
"""Extrae pasajes griegos de DOCX sin incorporar instrucciones ni soluciones.
Uso: python scripts/extract-text-corpus.py archivo.docx [...]
La salida contiene textos privados: no guardarla en el repositorio público.
"""
import hashlib
import json
import pathlib
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
result = []
for argument in sys.argv[1:]:
    path = pathlib.Path(argument)
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read('word/document.xml'))
    passages = []
    for paragraph in root.findall('.//w:p', NS):
        line = ''.join(t.text or '' for t in paragraph.findall('.//w:t', NS))
        greek = sum('GREEK' in unicodedata.name(c, '') for c in line)
        latin = sum(c.isascii() and c.isalpha() for c in line)
        if greek > 10 and greek > latin * 3:
            passages.append(re.sub(r'^\[[^\]]*\]\s*', '', line))
    result.append({'document': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                   'passages': passages})
print(json.dumps(result, ensure_ascii=False, indent=2))
