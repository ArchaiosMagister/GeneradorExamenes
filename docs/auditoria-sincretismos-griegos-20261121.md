# Auditoría de morfología verbal griega — 21/11/2026

## Ámbito
Se revisan las diez series verbales explícitas de `greekExplicitVerbEvidence`, la selección inicial y la regeneración de formas en el examen morfológico de Griego I, así como su paridad con `offline.html`. Los controles generales de 14 unidades, cuatro cuotas gramaticales y los dos modelos de examen permanecen en las baterías de regresión del repositorio.

## Incidencia confirmada
El examen morfológico utilizaba una ruta distinta de la ficha individual que ya representaba correctamente las lecturas sincréticas.

- **ἔλυον** (UD11): imperfecto de indicativo activo, **1.ª persona singular o 3.ª persona plural**. La ruta de verbos ofrecía antes dos apariciones de la misma grafía, cada una con una lectura distinta.
- **ἦλθον** (UD12): aoristo segundo de indicativo activo, **1.ª persona singular o 3.ª persona plural**. La ruta de verbos lo excluía en lugar de mostrar ambas lecturas.

## Corrección
Se centraliza la creación de candidatos de análisis verbal para la generación y la regeneración individual. Cada forma escrita se presenta una sola vez **por paradigma** y lleva todas las personas respaldadas por sus casillas. Las convenciones editoriales con paréntesis, como `λύσουσι(ν)`, continúan disponibles en las tablas de conjugación, pero no se consideran palabras individuales en esta ruta.

La prueba `scripts/test-greek-verb-syncretism.cjs` ha revisado **52 candidatos únicos** de diez series explícitas en la rama aislada, incluidos ambos sincretismos, sin inventar ninguna forma nueva. También comprueba la igualdad de la lógica entre web y versión autónoma y su uso tanto al generar como al regenerar.

## Garantías
No se alteran los paradigmas documentados, las unidades de introducción, los enunciados exigibles, la procedencia de las fichas, las traducciones, la puntuación ni la estructura de Word/PDF. Las candidaturas externas no son ascendidas a datos contrastados. La fusión queda condicionada a los workflows generales, en particular las pruebas de las 14 unidades, Safari/Android y exportaciones.

Referencia filológica: [paradigmas de λύω](https://www.azimonti.com/philology/ancient-greek/resources/paradigms-regular-verbs/) y [análisis de ἦλθον](https://en.wiktionary.org/wiki/%E1%BC%A6%CE%BB%CE%B8%CE%BF%CE%BD).
