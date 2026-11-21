# Auditoría filológica de Griego I · Cinco lemas de tercera declinación
**Fecha:** 21 de noviembre de 2026. **Rama:** audit/greek1-third-decl-gender-20261121 (derivada de la PR #198). **Estado:** sin integración ni publicación autorizadas.

## Hallazgo y decisiones

El repertorio de 46 lemas nominales cotejados mantenía cinco enunciados de sustantivos de tercera declinación sin artículo griego. Los datos docentes no asignaban siempre el mismo grado de información al banco general y al vocabulario exigible.

| Lema normalizado | Antes en índice académico | Después | En el exigible |
|---|---|---|---|
| στρατευμα | στράτευμα, –ατος | στράτευμα, –ατος (τό) | UD9: añadir artículo (τό) |
| αιξ | αἰξ, αἰγός | αἴξ, αἰγός (ἡ) | UD8: conservar el femenino ya indicado |
| δερμα | δέρμα, –ματος | δέρμα, –ματος (τό) | UD8: artículo τὸ ya existente |
| λεων | λέων, λεόντος | λέων, λέοντος (ὁ) | UD8: artículo ὁ ya existente |
| σωμα | σῶμα, –ματος | σῶμα, –ματος (τό) | UD8: artículo τὸ ya existente |

**αἴξ**: el diccionario LSJ recoge tanto masculino como femenino para el lema. El curso exige «(ἡ)», y esta corrección conserva deliberadamente esa variante docente; no elimina ni considera agramatical el uso masculino histórico. La forma ya contrastada «αἰγί» mantiene su única lectura documentada en el corpus fuente 5.

**στράτευμα**: se enseña en el vocabulario exigible de UD9, pero su morfología de tercera declinación está explicada desde UD8. Su ficha de análisis puede estar habilitada por nivel gramatical sin anticipar la condición de exigibilidad léxica.

Los demás lemas conservan exactamente las formas y análisis fuente 5. El género de la ficha es una decisión lexicográfica/curricular explícita, no una inferencia desde terminaciones.

## Trazabilidad y persistencia

La corrección se inscribe en `data/lemmas/verified-overrides.json` como cinco operaciones editoriales `entryCorrections`, cada una con el enunciado de origen, el revisado y la fuente. `scripts/build-lemma-index.mjs` toma la fuente congelada en un commit y vuelve a aplicar estas correcciones sin permitir que datos provisionales entren en el solucionario. El banco general incrustado, las fichas nominales del generador y `offline.html` mantienen los mismos enunciados.

La ficha exigible `στράτευμα, –ατος` de UD9 se actualiza mediante una migración exacta e idempotente al cargarse, **solo si coincide literalmente con la semilla antigua**; no se repuebla vocabulario eliminado ni se modifican entradas editadas o añadidas manualmente.

## Fuentes

- Estrateuma, neutro: https://logeion.uchicago.edu/%CF%83%CF%84%CF%81%CE%AC%CF%84%CE%B5%CF%85%CE%BC%CE%B1
- αἴξ, ambos géneros posibles: https://logeion.uchicago.edu/morpho/%CE%B1%E1%BC%B4%CE%B3%CE%B5%CF%83%CE%B9%CE%BD
- δέρμα: https://logeion.uchicago.edu/%CE%B4%CE%AD%CF%81%CE%BC%CE%B1
- λέων: https://logeion.uchicago.edu/%CE%BB%CE%AD%CF%89%CE%BD
- σῶμα: https://www.logeion.org/%CF%83%E1%BF%B6%CE%BC%CE%B1

## Validación

`node scripts/test-greek-third-decl-gender-five.cjs` comprueba 5 enunciados en índice docente, cada corrección y su referencia, fichas y banco general de web/PWA, exigible de UD9, conservación de 9 superficies fuente 5 (5 + 1 + 1 + 1 + 1), coherencia del artículo y la migración de datos locales. Está integrado en las baterías Phase I y offline-check. La prueba fuente 5 `test-greek-reviewed-nominal-expansion.cjs` debe seguir pasando sin modificaciones.

No se han añadido paradigmas ni cambiado las cuotas morfológicas, puntuaciones, traducciones, sincretismos ni motores de examen. **No fusionar ni publicar** sin permiso posterior del docente y todas las pruebas pertinentes superadas.
