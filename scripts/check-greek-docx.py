"""Inspect exported Word structure without Word, network or third-party packages.

Usage: python3 scripts/check-greek-docx.py /path/to/greek.docx [...]
"""
import sys
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
def attr(node, name):
    return node.get('{'+NS['w']+'}'+name)

for filename in sys.argv[1:]:
    with ZipFile(filename) as archive:
        assert archive.testzip() is None, filename
        for part in archive.namelist():
            if part.endswith(('.xml', '.rels')):
                ET.fromstring(archive.read(part))
        doc = ET.fromstring(archive.read('word/document.xml'))
        body = doc.find('w:body', NS)
        paragraphs = body.findall('w:p', NS)
        # The two header rows must be real paragraphs with identical borders.
        for p in paragraphs[:2]:
            assert p.find('w:pPr/w:pBdr', NS) is not None, 'Header is not bordered text'
            assert p.find('w:tbl', NS) is None, 'Table used for header'
            assert p.find('w:r/w:tab', NS) is not None, 'Header columns lost their tab stop'
        first = body.find('w:tbl', NS)
        first_cell = first.find('w:tr/w:tc', NS) if first is not None else None
        if first_cell is not None and first_cell.find('w:tcPr/w:gridSpan', NS) is not None:
            raise AssertionError('Missing open upper-left corner')
        # Full paradigms carry a Greek lemma in a merged cell in the first row.
        for table in body.findall('w:tbl', NS):
            grid = table.findall('w:tblGrid/w:gridCol', NS)
            if grid:
                assert sum(int(attr(c, 'w')) for c in grid) == 8788, 'Table exceeds text area'
            spans = table.findall('w:tr/w:tc/w:tcPr/w:gridSpan', NS)
            if spans:
                row = table.find('w:tr', NS)
                assert any('\u0370' <= c <= '\u1fff' for c in ''.join(row.itertext())), 'Missing Greek lemma'
                assert not table.findall('.//w:shd', NS), 'Paradigm has unwanted shading'
        footer = ET.fromstring(archive.read('word/footer1.xml'))
        fields = ''.join(footer.itertext())
        assert 'PAGE' in fields and 'NUMPAGES' in fields, 'Page fields missing'
        margins = doc.find('.//w:pgMar', NS)
        for side, value in {'left':'1701', 'top':'1417', 'right':'1417', 'bottom':'1417'}.items():
            assert attr(margins, side) == value, 'Incorrect '+side+' margin'
    print('PASS:', Path(filename).name, 'bordered paragraphs, merged titles, widths, XML and page fields')
