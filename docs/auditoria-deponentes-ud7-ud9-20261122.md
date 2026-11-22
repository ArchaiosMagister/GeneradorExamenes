# Auditoría filológica latina — deponentes (22 de noviembre de 2026)

**Ámbito:** Latín I, primera revisión individual de los 19 lemas deponentes presentes en el repertorio. La rama es experimental: no fusionar ni publicar sin autorización docente y CI completa. No se ha cambiado la cantidad vocálica, la puntuación ni los bancos griegos. Se han incorporado únicamente cuatro bloques de seis formas de presente deponente, contrastados mediante tablas morfológicas explícitas.

## Dos errores editoriales confirmados

| UD | Lema | Antes | Después | Evidencia |
| --- | --- | --- | --- | --- |
| UD7 | `complector` | `complector, complectus sum (3ª)` | `complector, complexus sum (3ª)` | Gaffiot, *Dictionnaire illustré latin-français*, p. 370: `complector, plexus sum, plecti`. Lewis & Short: `complector, plexus`. |
| UD9–10 | `patior` | `patior, passus sum (4ª)` | `patior, passus sum (mx.)` | Odysseum (Éduscol), *Les modèles de conjugaison*, clasificación explícita `3e conjugaison mixte`; presente `patior, pateris, patitur`. |

Fuentes:
- Gaffiot: https://fr.wikisource.org/wiki/Page%3AGaffiot_-_Dictionnaire_illustr%C3%A9_Latin-Fran%C3%A7ais.djvu/370
- Lewis & Short: https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n9614/
- Éduscol: https://odysseum.eduscol.education.fr/les-modeles-de-conjugaison
- Cuadro de la 3.ª mixta deponente: https://www.schule-bw.de/faecher-und-schularten/sprachen-und-literatur/latein/sprache/konjugation-des-verbs/konjugationen/deponentien-gemischte-konjugation.html

Los dos enunciados se han actualizado en `index.html`, `required-latin-units.js` y `data/lemmas/teacher-forms.json`. Se documentan ambas transformaciones en `verified-overrides.json` para que el generador reproducible del índice no restablezca las erratas. Adicionalmente se han acreditado **24 casillas de presente** de otros cuatro paradigmas; los registros históricos (fuente 0) permanecen intactos.

## Cobertura por unidad

| Primera UD | Lemas | Evidencia en la app |
| --- | --- | --- |
| UD6 | `moror` | Testimonio histórico, sin bloque contrastado; el umbral general de deponentes se conserva desde UD7 |
| UD7 | `complector`, `conor`, `intueor`, `laetor`, `proficiscor`, `vereor` | `conor`: presente docente de seis formas; `proficiscor`: presente, imperfecto, futuro de seis formas; `complector`, `intueor`, `laetor` y `vereor`: presente de seis personas contrastadas cada uno (24 formas nuevas) |
| UD9–10 | `gratulor`, `loquor`, `miror`, `nascor`, `obliviscor`, `orior`, `patior`, `polliceor`, `revertor`, `sequor`, `utor` | `loquor` y `sequor`: presente de seis formas contrastadas; `miror`: una forma individual contrastada, no seis; otros registros históricos |
| UD11–12 | `elabor` | Solo registros históricos |

La revisión de seis lemas de UD7 confirma su clasificación como deponentes y el perfecto indicado en los enunciados corregidos o conservados: `complector/complexus`, `conor/conatus`, `intueor/intuitus`, `laetor/laetatus`, `proficiscor/profectus` y `vereor/veritus`. Gaffiot y Lewis & Short acreditan `complector`; los verbos en -eor y -or se comprueban además frente a las tablas morfológicas documentadas. No se toma la regularidad de un tema como certificación de todas sus personas y tiempos.

Los **24 registros de presente** cotejados (6 × 4) se guardan con fuente 5 y etiqueta `V;IND;DEP;PRS`. No se ha deducido por analogía ningún imperfecto, futuro ni perfecto. Las variantes de segunda singular `-re` no se incorporan a la tabla de seis casillas, y `complecteris` permanece excluida del análisis aislado porque puede ser presente o futuro.

**Fuentes de los cuatro presentes:** [complector (Cactus2000)](https://latin.cactus2000.de/showverb.en.php?verb=complecti) y [Oxford/LatinDictionary](https://www.latindictionary.io/entry/complector-complecti-complexus-sum-11768); [intueor (Oxford/LatinDictionary)](https://www.latindictionary.io/entry/intueor-intueri-intuitus-sum) y [Lewis & Short](https://thrax.mpiwg-berlin.mpg.de/mpiwg-mpdl-cms-web/lt/GetDictionaryEntries?language=lat&outputFormat=html&outputType=dictFull&outputType=morphCompact&query=intuenti&queryDisplay=in%C2%ADtuenti); [laetor (Latinando)](https://latinando.it/coniugazione/laetor) y [LatinDictionary](https://www.latindictionary.io/entry/laetor-laetari-laetatus-sum); [vereor (Cactus2000)](https://latin.cactus2000.de/showverb.en.php?verb=vereri) y [LatinDictionary](https://www.latindictionary.io/entry/vereor-vereri-veritus-sum).

La prioridad pendiente pasa a **imperfecto y futuro** de estos cuatro lemas, que no se publican todavía. `orior` exige cautela con sus formas mixtas de tercera y cuarta (por ejemplo, `oreris`/`oriris`, imperfecto de subjuntivo `orerer`/`orirer`); se revisará en UD9–10 sin aplicar una cuarta conjugación indiscriminada.

## Restricciones mantenidas

- Fuente **0**: testimonio histórico útil para comparar; no constituye fuente verificada 5. Algunas etiquetas UniMorph históricas de deponentes figuran como voz activa; no se reinterpretan ni promocionan automáticamente.
- Fuente **1**: constancia explícita docente, conservada para `conor`; no justifica tiempos adicionales.
- Fuente **5**: cuatro bloques de presente incorporados aquí (24 casillas), además de los bloques que ya estaban individualmente contrastados; no se amplían otros tiempos.
- Sincretismos sin contexto: la exclusión de `proficisceris`, `loqueris`, `sequeris` y ahora `complecteris` sigue activa.
- El género y el número del participio de perfecto deponente no se suponen sin contexto sintáctico; no se añade una tabla perifrástica automática.
- Regenerar el índice desde sus fuentes con `build-lemma-index.mjs` debe preservar las dos enmiendas editoriales y sumar exactamente 24 registros a la fuente latina 5 (619 → 643), sin alterar los 570 registros anteriores ni otros lemas.

## Segundo cotejo: UD9–10, `patior` y `orior`

En `patior, passus sum` se conserva la clasificación escolar **tercera mixta** (`mx.`). El indicativo presente `patior, pateris, patitur, patimur, patimini, patiuntur` concuerda con el repertorio de [Wikcionario](https://es.wiktionary.org/wiki/patior) y el [cuadro de la conjugación mixta](https://www.schule-bw.de/faecher-und-schularten/sprachen-und-literatur/latein/sprache/konjugation-des-verbs/konjugationen/deponentien-gemischte-konjugation.html). No se han añadido sus seis casillas a fuente 5: permanecen en la fuente histórica hasta su admisión en una ampliación separada.

`orior, ortus sum` conserva su enunciado escolar de **cuarta conjugación**, pero no se tratará como una cuarta regular en el generador. [Lewis & Short](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n33000/), [Logeion](https://logeion.org/orior) y el [cotejo de variantes](https://es.wiktionary.org/wiki/orior) permiten `oreris` junto a `oriris`, `oritur`, `orimur`, `orimini`, `oriuntur` y alternancias en el imperfecto de subjuntivo (`orerer/orirer`). La presencia de variantes es motivo para **no generar casillas por analogía ni adjudicar una lectura única a formas ambiguas**. Tampoco se han promovido registros del índice histórico.

Las nuevas pruebas comprueban que ni `patior` ni `orior` se incorporan de forma automática a los ejercicios evaluables de UD9–10. El cotejo de los otros nueve lemas inicialmente registrados para esta unidad se mantiene pendiente; no se infiere su paradigma a partir del sufijo `-or`.
