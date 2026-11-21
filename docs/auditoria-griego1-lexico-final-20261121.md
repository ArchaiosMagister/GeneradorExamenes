# Griego I · regularización filológica posterior a PR #201 (21/11/2026)

Se corrigen cuatro fichas del banco general y del índice académico. No se alteran las 14 unidades exigibles, no se crean paradigmas por analogía y no se fusiona ni publica sin autorización.

| Lema | Enunciado corregido | Justificación |
| --- | --- | --- |
| Σωκράτης | **Σωκράτης, Σωκράτους (ὁ)** | Genitivo ático escolar: –έος representa otra variante documentada, no el enunciado ordinario |
| ἀκρόαμα | **ἀκρόαμα, –ματος (τό)** | Es un sustantivo neutro «audición, recitación o espectáculo para escuchar»; la glosa «placentero al oído» era incorrecta |
| αἰθήρ | **αἰθήρ, αἰθέρος (ὁ/ἡ)** | Géneros masculino y femenino documentados, con predominio del masculino en usos escolares |
| αἷμα | **αἷμα, αἵματος (τό)** | Artículo neutro explícito |

**Persistencia:** las cuatro correcciones de origen permanecen registradas en `data/lemmas/verified-overrides.json`; su resultado se incorpora a `data/lemmas/teacher-forms.json`, al banco integrado de `index.html` y a la versión autónoma reconstruida. El significado de ἀκρόαμα dispone también de equivalencia valenciana, conservando la equivalencia histórica para datos antiguos. Se mantienen sin alterar las formas morfológicas acreditadas y los datos personales editados.

**πρῶτος:** las 24 formas de `data/lemmas/greek-nominal-candidates.json` procedían de un candidato provisional sin una sola coincidencia de casilla (`matchingSlots: 0`) y contienen numerosas acentuaciones incorrectas. Se retiran de la exportación activa, se incorpora una exclusión reproducible en `scripts/build-greek-nominal-candidates.mjs` y se conservan los 559 expedientes históricos para auditoría. Se mantiene el lema `πρῶτος, –η, –ον` del vocabulario exigible. No se convierte en forma de examen ninguna candidatura.

**πολίτῃ / ὕδατι:** contrastadas como dativo singular de `πολίτης` y `ὕδωρ`. No se incorporan automáticamente como nuevas respuestas evaluables ni se confunde el cotejo de una forma con el aval de un paradigma completo.

Fuentes: [Dickinson, Σωκράτης](https://dcc.dickinson.edu/grammar/age/stems-ending-%CE%B5%CF%83); [Atticism.eu, ἀκρόαμα](https://atticism.eu/corpus/item/view?id=dd0c1758-f5f3-4c07-8631-ee895cbfcee8); [Slater, αἰθήρ](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.atlas_v1%3Apindar-slater-n192/); [LSJ, αἷμα](https://www.greek-language.gr/digitalResources/ancient_greek/tools/liddell-scott/search.html?lq=%CE%B1%E1%BC%B7%CE%BC%CE%B1); [Schola Graeca, πολίτῃ](https://correll.github.io/greek-classroom-rome/grammar-04-first-declension.html); [Dickinson, ὕδατι](https://dcc.dickinson.edu/grammar/monro/final-%CE%B9-dative-singular).

Publicación condicionada a CI y autorización expresa.
