# Auditoría de lematización y vocabulario de oraciones — 15/11/2026

## Alcance

Revisión selectiva de `vocabulary-generator.js`, `offline-lemmas.js`, `index.html`, `offline.html` y las regresiones de lematización latina, glosario y pasivas compuestas. Se priorizaron la consulta conjunta de bancos Latín I/4.º, la separación entre reconocimiento y exigibilidad, los controles docentes y la presentación final.

## Incidencia confirmada: filtro de preposiciones

**Prioridad alta, reproducción estática inequívoca.** `classifyVocabularyEntry` y `glossAccept` reconocían `ad (prep. + ac.)` y hacían depender su inclusión de `glossPrepositions`. Sin embargo, `buildFinalLexicon` aplicaba después una expresión regular que descartaba siempre las entradas etiquetadas como preposiciones, incluso con la casilla activada. El error afectaba al glosario presentado y, por extensión, a su exportación Word. Las pruebas existentes solo comprobaban `glossAccept`, no las entradas finalmente renderizadas.

**Corrección:** se retira la exclusión incondicional y queda un único filtro por `glossAccept`, respetando tanto `glossPrepositions` como `glossOther`. No se modifican lemas, paradigmas, traducciones, fuentes ni requisitos curriculares. La versión autónoma se reconstruye desde la misma fuente.

**Regresión:** frase con `ad`, `et` y `bene`, verificando la presencia real en el glosario y el efecto independiente de ambas casillas.

## Comprobaciones de diseño y pruebas existentes

- `latinSentenceGlossaryBank` combina las fuentes de los dos cursos y preserva la selección curricular de preguntas. `isRequired` aplica por separado la exigibilidad del vocabulario.
- `analyze` conserva alternativas de lemas cuando la lectura requiere decisión del profesor, y las pruebas cubren la persistencia de numerosas decisiones por oración.
- `passivePhrases` ofrece interpretación conjunta o independiente por aparición de participio + auxiliar, incluidos `pugnatum est`, `occisus est` y `aedificata erant`. Las inferencias a partir de supino no se convierten en formas documentalmente acreditadas.
- Las regresiones existentes abarcan Word, valenciano, PWA, aislamiento de preguntas y HTML autónomo, sin que esta auditoría equivalga a una verificación filológica exhaustiva de todo el corpus.

## Riesgos por investigar, sin intervención

1. **Grafías abreviadas de temas verbales en Latín 4.º:** determinar en un conjunto de oraciones reales cuáles carecen de enunciado completo de respaldo y aún pueden quedarse sin propuesta.
2. **Homografías entre acepciones con un mismo lema escrito:** documentar casos curriculares antes de modificar la deduplicación que actualmente agrupa por lema.
3. **Rendimiento:** medir el coste de la lematización repetida al editar oraciones largas antes de variar cachés.

## Límites de esta PR

No se alteran los bancos docentes, los IDs, las unidades, el vocabulario exigible, las decisiones guardadas ni la generación de preguntas. La intervención se limita al filtrado final de categorías y su prueba específica. Sin fusión ni publicación hasta nueva autorización del docente.
