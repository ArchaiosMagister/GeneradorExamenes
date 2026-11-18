import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location(
    "classifier", pathlib.Path(__file__).resolve().parents[1] / "scripts" / "build_unimorph.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def classify(lang, lemma, tags, paradigms):
    return module.classify(lang, lemma, tags.split(";"), paradigms)


class CurriculumTests(unittest.TestCase):
    def test_latin_nouns(self):
        p = {("puella", "N"): [("puellae", {"N", "GEN", "SG"})],
             ("servus", "N"): [("servi", {"N", "GEN", "SG"})],
             ("rex", "N"): [("regis", {"N", "GEN", "SG"})],
             ("dies", "N"): [("diei", {"N", "GEN", "SG"})]}
        self.assertEqual(classify("lat", "puella", "N;NOM;SG", p)[2], 1)
        self.assertEqual(classify("lat", "servus", "N;NOM;SG", p)[2], 1)
        self.assertEqual(classify("lat", "rex", "N;NOM;SG", p)[2], 4)
        self.assertEqual(classify("lat", "dies", "N;NOM;SG", p)[2], 7)

    def test_greek_nouns(self):
        p = {("δῶρον", "N"): [("δώρου", {"N", "GEN", "SG"})],
             ("λόγος", "N"): [("λόγου", {"N", "GEN", "SG"})],
             ("θάλασσα", "N"): [("θαλάσσης", {"N", "GEN", "SG"})]}
        self.assertEqual(classify("grc", "δῶρον", "N;NOM;SG", p)[2], 2)
        self.assertEqual(classify("grc", "λόγος", "N;NOM;SG", p)[2], 1)
        self.assertEqual(classify("grc", "θάλασσα", "N;NOM;SG", p)[2], 3)

    def test_adjective_paradigms(self):
        p = {("bonus", "ADJ"): [
            ("bonus", {"ADJ", "NOM", "SG", "MASC"}),
            ("bona", {"ADJ", "NOM", "SG", "FEM"}),
            ("bonum", {"ADJ", "NOM", "SG", "NEUT"}),
            ("boni", {"ADJ", "GEN", "SG", "MASC"})],
             ("δίκαιος", "ADJ"): [
            ("δίκαιος", {"ADJ", "NOM", "SG", "MASC"}),
            ("δικαία", {"ADJ", "NOM", "SG", "FEM"}),
            ("δίκαιον", {"ADJ", "NOM", "SG", "NEUT"}),
            ("δικαίου", {"ADJ", "GEN", "SG", "MASC"})]}
        self.assertEqual(classify("lat", "bonus", "ADJ;NOM;SG;MASC", p), ("adj", "first-class", 2))
        self.assertEqual(classify("grc", "δίκαιος", "ADJ;NOM;SG;MASC", p), ("adj", "2-1-2", 5))
        self.assertIsNone(classify("lat", "incertus", "ADJ;NOM;SG;MASC", {}))

    def test_pronoun_lexicon(self):
        self.assertEqual(classify("lat", "hic", "PRO;NOM;SG", {}), ("pro", "demonstrative", 6))
        self.assertEqual(classify("lat", "ipse", "PRO;NOM;SG", {}), ("pro", "emphatic", 8))
        self.assertEqual(classify("grc", "ἐκεῖνος", "PRO;NOM;SG", {}), ("pro", "demonstrative", 7))
        self.assertIsNone(classify("grc", "αὐτή", "PRO;NOM;SG", {}))
        self.assertIsNone(classify("lat", "ignotus", "PRO;NOM;SG", {}))

    def test_verbs_and_unknown(self):
        self.assertEqual(classify("lat", "amo", "V;IND;PRS;ACT;1;SG", {})[2], 1)
        self.assertEqual(classify("lat", "amo", "V;IND;FUT;ACT;1;SG", {})[2], 7)
        self.assertEqual(classify("grc", "λύω", "V;IND;PFV;ACT;1;SG", {})[2], 12)
        self.assertEqual(classify("grc", "εἰμί", "V;IND;PRS;ACT;1;SG", {})[2], 1)
        self.assertIsNone(classify("grc", "λύω", "V;OPT;PRS;ACT;1;SG", {}))
        self.assertIsNone(classify("lat", "ignotus", "PRO;NOM;SG", {}))

if __name__ == "__main__":
    unittest.main()
