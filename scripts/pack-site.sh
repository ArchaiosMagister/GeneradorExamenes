#!/usr/bin/env bash
set -euo pipefail
site=$1
revision=$2
mkdir -- "$site"
for asset in index.html offline.html greek-choice-{number,retroversion,etymology,groups}.js \
  offline-lemmas.js verification-review.js greek-review.js eulexis-local.js culture-lat4.js \
  lexicon-valenciano.js required-latin-units.js vocabulary-{quality,generator}.js exam-scoring.js \
  unified-backup.js exam-selection-summary.js pwa.js pdf-export.js export-workspace.js manifest.webmanifest; do
  cp -- "$asset" "$site/"
done
cp -R icons data vendor THIRD_PARTY_LICENSES "$site/"
mkdir "$site/docs"
cp docs/lematizacion-lectores.md "$site/docs/"
sed "s/__PWA_BUILD_VERSION__/$revision/g" sw.js > "$site/sw.js"
touch "$site/.nojekyll"
