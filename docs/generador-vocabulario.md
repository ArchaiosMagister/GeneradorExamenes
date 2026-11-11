# Generador independiente de vocabulario por unidades

Primera entrega incremental. La pestaña «Generador de vocabulario» utiliza unidades propias (1–100), sin seleccionar ni generar exámenes. Cada unidad conserva su texto, título, resultados y modo verbal. Reducir su número oculta las unidades restantes, sin borrarlas. El proyecto se guarda localmente y puede exportarse/importarse en JSON.

## Auditoría del banco docente

Ejecutar `node scripts/audit-vocabulary.cjs` para reproducir el diagnóstico sobre el banco inicial de `index.html` y `data/lemmas/teacher-forms.json`.

| Banco | Filas con enunciado y traducción | Lemas indexados | Con alguna forma documentada |
| --- | ---: | ---: | ---: |
| Latín I | 1106 | 664 | 418 |
| Latín 4.º ESO | 541 | 328 | 241 |
| Griego I | 399 | 349 | 111 |

Todas las filas del banco inicial tienen traducción. Varias filas corresponden al mismo lema en unidades distintas; estos números no representan lemas únicos. El índice morfológico guarda `entry` y `units`, pero no traducciones. Sus filas son `[lema, forma, etiquetas, fuente]`. Se unen al banco editable por enunciado o lema normalizados, respetando íntegramente enunciado y traducción del banco elegido. Las variantes distintas se ofrecen para revisión, sin escoger una arbitrariamente.

Hay desajustes entre ambas instantáneas: no se encuentra correspondencia exacta por estas claves para `ovis`, `soror` en Latín I y 13 claves griegas (`ασια`, `κυνδυνοσ`, `πραττω`, `αμφι`, `δια`, `επι`, `κατα`, `μετα`, `παρα`, `περι`, `προσ`, `υπερ`, `υπο`). No se asignan traducciones por semejanza ni se corrigen erratas silenciosamente. Estas entradas pueden requerir traducción manual. El informe enumera las claves pendientes.

«Con formas documentadas» significa que existe al menos una forma de UniMorph o de un paradigma explícito/revisado; no garantiza paradigma completo ni lematización general de textos. Los candidatos regulares y griegos sin verificar nunca se convierten en identificaciones automáticas. Las citas sin análisis flexivo también requieren revisión. Los homógrafos se mantienen como candidatos, sin desambiguación sintáctica automática.

## Revisión y límites

- Se procesan todas las palabras del texto, sin inventar análisis fuera de los recursos locales. No se segmentan enclíticos ni se resuelven automáticamente elisiones y expresiones de varias palabras.
- Se deduplican entradas dentro de cada unidad, con orden alfabético normalizado. Una palabra reaparece en todas las unidades que la contienen.
- Los pendientes aparecen con asterisco; el Word los reúne bajo «Pendientes de revisión». Se puede seleccionar un candidato o editar enunciado y traducción manualmente.
- Reanalizar sustituye los resultados y correcciones de esa unidad. Cambiar el banco invalida resultados de todas las unidades; editar un texto invalida los de esa unidad.
- El modo completo conserva el enunciado disponible. No añade perfecto, supino ni conjugación ausentes. El simple abrevia únicamente verbos latinos con etiqueta explícita de conjugación o irregularidad; el griego conserva su enunciado.
- El DOCX usa párrafos editables en dos columnas de página, fuente Palatino 10,5 y títulos de UD. El archivo de referencia «Vocabulario por uds lat4.docx» no está disponible en este entorno: queda pendiente comparar visualmente márgenes, títulos y saltos con el original.

## Arquitectura y comprobación

`vocabulary-generator.js` publica `window.ExaminaVocabulary`: análisis, deduplicación, presentación y XML Word. La interfaz es un adaptador del banco editable y del cargador del lematizador existentes. No altera los datos ni la lógica de generación de exámenes. El módulo se incluye tanto en la caché PWA como dentro del HTML autónomo mediante `offline:build`.

Pruebas: `npm run vocabulary:test` (motor y navegador), `npm run offline:test`, `node scripts/test-lemma-index.mjs`, `node scripts/test-exam-models.cjs`, `npm run pwa:test`. Las pruebas de navegador admiten `PLAYWRIGHT_PATH` y `BROWSER_PATH` cuando Playwright o Chromium están instalados fuera del proyecto.
