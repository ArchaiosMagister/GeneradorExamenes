import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location(
    "classifier", pathlib.Path(__file__).resolve().parents[1] / "scripts" / "build_unimorph.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CurriculumTests(unittest.TestCase):
    def test_latin_nouns(self):
        p = {("puella", "N"): [("puellae", {"N", "GEN", "SG"})],
             ("servus", "N"): [("servi", {"N", "GEN", "SG"})],
             ("rex", "N"): [("regis", {"N", "GEN", "SG"})],
             ("dies", "N"): [("diei", {"N", "GEN", "SG"})]}
        self.assertEqual(module.classify("lat", "puella", "N;NOM;SG", p)[2], 1)
        self.assertEqual(module.classify("lat", "servus", "N;NOM;SG", p)[2], 1)
        self.assertEqual(module.classify("lat", "rex", "N;NOM;SG", p)[2], 4)
        self.assertEqual(module.classify("lat", "dies", "N;NOM;SG", p)[2], 7)

    def test_greek_nouns(self):
        p = {("δῶρον", "N"): [("δώρου", {"N", "GEN", "SG"})],
             ("λόγος", "N"): [("λόγου", {"N", "GEN", "SG"})],
             ("θάλασσα", "N"): [("θαλάσσης", {"N", "GEN", "SG"})]}
        self.assertEqual(module.classify("grc", "δῶρον", "N;NOM;SG", p)[2], 2)
        self.assertEqual(module.classify("grc", "λόγος", "N;NOM;SG", p)[2], 1)
        self.assertEqual(module.classify("grc", "θάλασσα", "N;NOM;SG", p)[2], 3)

    def test_verbs_and_unknown(self):
        self.assertEqual(module.classify("lat", "amo", "V;IND;PRS;ACT;1;SG", {})[2], 1)
        self.assertEqual(module.classify("lat", "amo", "V;IND;FUT;ACT;1;SG", {})[2], 7)
        self.assertEqual(module.classify("grc", "λύω", "V;IND;PFV;ACT;1;SG", {})[2], 12)
        self.assertEqual(module.classify("grc", "εἰμί", "V;IND;PRS;ACT;1;SG", {})[2], 1)
        self.assertIsNone(module.classify("grc", "λύω", "V;OPT;PRS;ACT;1;SG", {}))
        self.assertIsNone(module.classify("lat", "hic", "PRO;NOM;SG", {}))

if __name__ == "__main__":
    unittest.main()
