# Auditoría de homógrafos y acepciones latinas — 15/11/2026

## Problema y evidencia del banco docente

Se revisan las listas compartidas de Latín I y Latín de 4.º y el índice `teacher-forms.json`. Se identifica una reducción excesiva de lecturas: `ExaminaVocabulary.analyze` agrupaba los candidatos latinos únicamente por **lema normalizado** y `buildFinalLexicon` volvía a agrupar por **encabezamiento normalizado**. De ese modo dos fichas con igual forma de cita, pero diferente categoría léxica, podían quedar representadas por una sola.

Casos reales cotejados en ambas asignaturas:

| Lema | Lectura A | Lectura B | Evidencia |
|---|---|---|---|
| `latus` | Sustantivo *latus, lateris* (n.) «costado, flanco» | Adjetivo *latus, -a, -um* «ancho» | Ambas fichas en el banco y etiquetas N/ADJ en la referencia morfológica |
| `adversus` | Preposición «contra» | Adjetivo *adversus, -a, -um* «adverso» | Ambas fichas en el banco; la lectura preposicional es invariable |
| `iuvenis` | Sustantivo *iuvenis, -is* «joven» | Adjetivo *iuvenis, -e* «joven» | Ambas fichas en el banco y etiquetas N/ADJ en el índice |

## Criterio aplicado

1. **No** considerar homógrafos independientes dos traducciones o grafías de **la misma ficha y categoría**: `via` «camino/calle», `civitas` «ciudad/estado» o `miser` con sus variantes de notación siguen siendo una entrada por categoría.
2. Solo cuando el banco real contiene categorías léxicas distintas para un mismo lema, conservar ambos candidatos en el análisis. En las flexiones nominales, usar las etiquetas de fuente N/ADJ para rechazar lecturas formalmente incompatibles: `lata` corresponde al adjetivo y `lateris` al sustantivo.
3. Conservar las dos fichas si el profesor resuelve dos apariciones de la misma forma de modo diferente. No modificar el texto original de las oraciones ni inferir contexto sintáctico automáticamente.
4. Ampliar la lectura de encabezamientos adjetivales con terminaciones explícitas completas (`miser, misera, miserum`; `noster, nostra, nostrum`) para evitar falsas diferencias frente a las versiones abreviadas por rayas.
5. Mantener las decisiones guardadas por **ocurrencia**, el vocabulario exigible y los bancos de morfología separados y sin cambios. No alterar formas ni certificados documentales.

## Regresiones añadidas

`scripts/test-exam-glossary.cjs` verifica `latus`, `adversus` e `iuvenis` en ambos cursos; `lata`, `lateris` e `iuvenem`; la no multiplicación de `miser` y `via`; y dos apariciones de `latus` elegidas como sustantivo y adjetivo en la previsualización y el Word.

El HTML autónomo se genera exclusivamente a partir de los archivos fuente; deben aprobarse las baterías CI de PWA, Word, exámenes reales y navegadores antes de fusionar.

## Límites

Las discrepancias de **significado** dentro de una única categoría se conservan en las fuentes, pero no se convierten automáticamente en fichas duplicadas o en selección de polisemia sin una distinción lexicográfica contrastada. La edición se limita a reconocimiento y presentación; no se introducen lemas, unidades, glosas ni cambios en el contenido exigible.
