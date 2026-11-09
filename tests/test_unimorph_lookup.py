import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("lookup_builder", ROOT / "scripts" / "build_unimorph_lookup.py")
lookup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lookup)


class FullLookupTests(unittest.TestCase):
    def test_normalization_and_shards(self):
        self.assertEqual(lookup.normalize("Λόγος"), "λογοσ")
        self.assertEqual(lookup.normalize("λόγος"), "λογοσ")
        self.assertEqual(lookup.shard("puellam"), "0070-0075")
        self.assertEqual(lookup.shard("puella"), "0070-0075")
        self.assertEqual(lookup.shard("λόγος"), lookup.shard("Λόγος"))

    def test_preserves_ambiguous_readings_and_lemma_index(self):
        sample = ("puella\tpuellae\tN;GEN;SG\n"
                  "puella\tpuellae\tN;DAT;SG\n"
                  "puella\tpuellae\tN;GEN;SG\n"
                  "amo\tamas\tV;IND;PRS;ACT;2;SG\n").encode("utf-8")
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(lookup, "OUT", pathlib.Path(tmp)), patch.object(
                lookup.urllib.request, "urlopen", return_value=io.BytesIO(sample)
            ):
                lookup.build("lat", "https://example.invalid/lat")
            target = pathlib.Path(tmp) / "lat"
            form = json.loads((target / "form-0070-0075.json").read_text())
            lemma = json.loads((target / "lemma-0070-0075.json").read_text())
            self.assertEqual(len(form), 2)
            self.assertEqual(len(lemma), 2)
            self.assertEqual({r[2] for r in form}, {"N;GEN;SG", "N;DAT;SG"})
            self.assertEqual(json.loads((target / "manifest.json").read_text())["records"], 3)


if __name__ == "__main__":
    unittest.main()
