# Auditoría filológica latina — deponentes (22 de noviembre de 2026)

**Ámbito:** Latín I, primera revisión individual de los 19 lemas deponentes presentes en el repertorio. La rama es experimental: no fusionar ni publicar sin autorización docente y CI completa. No se ha cambiado la cantidad vocálica, los paradigmas del generador, la puntuación ni los bancos griegos.

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

Los dos enunciados se han actualizado **sin ampliar las formas evaluables** en `index.html`, `required-latin-units.js` y `data/lemmas/teacher-forms.json`. Se documentan ambas transformaciones en `verified-overrides.json` para que el futuro generador reproducible del índice no restablezca las erratas. Los registros antiguos de flexión no cambian.

## Cobertura por unidad

| Primera UD | Lemas | Evidencia en la app |
| --- | --- | --- |
| UD6 | `moror` | Testimonio histórico, sin bloque contrastado; el umbral general de deponentes se conserva desde UD7 |
| UD7 | `complector`, `conor`, `intueor`, `laetor`, `proficiscor`, `vereor` | `conor`: presente docente de seis formas; `proficiscor`: presente, imperfecto, futuro de seis formas; los otros cuatro solo tienen registros históricos |
| UD9–10 | `gratulor`, `loquor`, `miror`, `nascor`, `obliviscor`, `orior`, `patior`, `polliceor`, `revertor`, `sequor`, `utor` | `loquor` y `sequor`: presente de seis formas contrastadas; `miror`: una forma individual contrastada, no seis; otros registros históricos |
| UD11–12 | `elabor` | Solo registros históricos |

La revisión de seis lemas de UD7 confirma su clasificación como deponentes y el perfecto indicado en los enunciados corregidos o conservados: `complector/complexus`, `conor/conatus`, `intueor/intuitus`, `laetor/laetatus`, `proficiscor/profectus` y `vereor/veritus`. Gaffiot y Lewis & Short acreditan `complector`; los verbos en -eor y -or se comprueban además frente a las tablas morfológicas documentadas. No se toma la regularidad de un tema como certificación de todas sus personas y tiempos.

La prioridad siguiente, **si se autoriza una ampliación de paradigmas**, es contrastar individualmente seis casillas del presente de `complector`, `intueor`, `laetor` y `vereor`, considerando las variantes `-ris/-re` en segunda persona singular; solo después evaluar imperfecto y futuro. `orior` requiere atención particular a sus alternancias de presente; no debe tratarse como cuarta regular por analogía. `patior` usa conjugación mixta, no cuarta.

## Restricciones mantenidas

- Fuente **0**: testimonio histórico útil para comparar; no constituye fuente verificada 5. Algunas etiquetas UniMorph históricas de deponentes figuran como voz activa; no se reinterpretan ni promocionan automáticamente.
- Fuente **1**: constancia explícita docente, conservada para `conor`; no justifica tiempos adicionales.
- Fuente **5**: bloques individuales persistentes ya contrastados, sin ampliaciones en esta PR.
- Sincretismos sin contexto: la exclusión de `proficisceris`, `loqueris` y `sequeris` sigue activa.
- El género y el número del participio de perfecto deponente no se suponen sin contexto sintáctico; no se añade una tabla perifrástica automática.
- Regenerar el índice desde sus fuentes con `build-lemma-index.mjs` debe preservar las dos enmiendas editoriales y los contadores de verificaciones morfológicas.
