import importlib.util, json, pathlib, sys, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_teacher_lexicon import parse, key
from collatinus_adapter import features, interval

class TeacherLexiconTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'data/teacher/lexicon.json').read_text())
    def test_source_blocks_and_glued_header(self):
        es=parse("Vocabulario para examen GR1\nUD5\nφιλέω: ‘amar’UDs 6–7\nλόγος, –ου: ‘palabra’\nVocabulario completo del curso\nἄγω: ‘llevar’\nVocabulario por unidades – Latín I\nUD9–10\namo: ‘amar’")
        self.assertEqual([(e['language'],e['unit']) for e in es],[('grc',5),('grc',7),('grc',None),('lat',10)])
    def test_export_contains_only_attached_lemmas(self):
        for lang,bank in self.data['banks'].items():
            source={key(e['lemma']) for e in self.data['entries'] if e['language']==lang}
            self.assertTrue(all(key(r[0]) in source for r in bank['lookup']))
    def test_curriculum_and_proper_nouns(self):
        for lang,bank in self.data['banks'].items():
            source=self.data['entries']
            bykey={}
            for e in source:
                if e['language']==lang and e['unit'] is not None:bykey.setdefault(key(e['lemma']),[]).append(e['unit'])
            proper={key(e['lemma']) for e in source if e['language']==lang and e['proper']}
            for category in ('n','adj','pro','v'):
                for lemma,form,tags,unit,subtype,origin in bank[category]:
                    f=set(tags.split(';'))
                    self.assertFalse(f&{'ADV','CONJ','DU','SBJV','OPT'})
                    self.assertFalse(key(lemma) in proper and 'PL' in f)
                    assigned=bykey.get(key(lemma),[])
                    self.assertTrue(assigned)
                    self.assertGreaterEqual(unit,min(assigned))
                    if 'PTCP' in f:self.assertGreaterEqual(unit,10)
                    self.assertFalse(any(c.isdigit() for c in form))
    def test_collatinus_reference_forms(self):
        rows=self.data['banks']['lat']['lookup']
        self.assertTrue(any(r[:3]==['amo','amamus','V;IND;ACT;PRS;1;PL'] for r in rows))
        self.assertTrue(any(r[:3]==['amo','amabam','V;IND;ACT;PST;IPFV;1;SG'] for r in rows))
        self.assertTrue(any(r[:3]==['sum','sum','V;IND;ACT;PRS;1;SG'] for r in rows))
        self.assertTrue(any(r[:3]==['puella','puellarum','N;GEN;PL'] for r in rows))
    def test_ambiguous_readings_survive(self):
        rows=[r for r in self.data['banks']['lat']['lookup'] if key(r[0])=='puella' and key(r[1])=='puellae']
        self.assertTrue({'N;GEN;SG','N;DAT;SG','N;NOM;PL'} <= {r[2] for r in rows})
    def test_packaged_script_matches_audit_json(self):
        script=(ROOT/'data/teacher/lexicon.js').read_text().split('window.TEACHER_LEXICON=',1)[1].rstrip(';\n')
        self.assertEqual(json.loads(script),self.data)
    def test_adapter_morphology_ids(self):
        self.assertEqual(interval('1-3,7'),[1,2,3,7])
        self.assertEqual(features(139,'v'),'V;IND;ACT;PRF;1;SG')
        self.assertIn('PTCP',features(303,'v'))
        self.assertIsNone(features(157,'v')) # No subjunctive in this exam bank.
