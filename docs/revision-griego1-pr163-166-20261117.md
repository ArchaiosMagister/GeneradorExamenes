# Revisión de Griego I en las PR 163 a 166

El docente ha autorizado el 17 de noviembre de 2026 incorporar estas correcciones a la rama de la PR #166, manteniéndola en borrador. No se autoriza fusionar ni desplegar. La revisión se ha realizado en una copia aislada y la copia de trabajo anterior del usuario no se ha modificado.

La revisión parte de `e1ca0f2c2d2438cf77564619d27a693e02941551`, extremo de la cadena #163 → #164 → #165 → #166. Las correcciones se pueden incorporar en #166 sin reescribir las ramas anteriores. El contraste de regresión usa `89f79124f881a8281045439ebb8c2cd25dd55ee9`, base de #163.

## Correcciones

- Regeneración reproducible de `offline.html`; se conserva la identidad griega de la pregunta de oraciones y sus ajustes individuales de espaciado.
- Cambio de cantidad de análisis dentro de la nueva alternativa sin regenerar las otras preguntas ni perder sus modificaciones manuales.
- Cambio de cantidad y regeneración individual de los nuevos sintagmas conservando cabecera, otras alternativas y soluciones ajenas.
- Regeneración de una alternativa completa que elimina los retoques anteriores de esa alternativa, evitando presentar texto antiguo con respuestas nuevas.
- Soluciones de cambio de número, retroversión y reconocimiento de étimos incorporadas a la vista y al Word del profesor. El Word del alumnado no contiene esas respuestas.
- Recuperación de cantidades, selección de elementos y alternativas nuevas desde un borrador. Los borradores anteriores siguen siendo compatibles.
- Sincronización de controles al cambiar entre completo y traducción; se conservan sus cantidades independientes.
- Conservación del subrayado de las palabras reconocibles al recuperar o editar la oración de étimos.
- Enunciados de alternativas unidos al ejercicio siguiente en Word y protegidos frente a saltos en la preparación del PDF.
- Inclusión de los cuatro motores griegos en la preparación del paquete publicable. Se ha corregido el empaquetado, sin ejecutar ninguna publicación.
- Nuevos módulos incluidos en los filtros que activan las comprobaciones de integración; auditoría curricular añadida a la batería de regresión.

Tres pruebas conservaban supuestos de la organización anterior. Se han actualizado las expectativas del modelo de traducción, la ausencia de una sexta alternativa independiente de pronombres y la comparación de las alternativas ajenas al análisis. Se mantienen las comprobaciones de conservación del contenido y de las ediciones manuales.

## Auditoría filológica y curricular

El cambio de número utiliza nominativo, acusativo, genitivo y dativo, sin combinaciones de artículo y vocativo. Conserva caso y género al cambiar el número. Los paradigmas testigo incluyen el neutro y la acentuación del adjetivo ante sustantivo, además de las construcciones de identidad con αὐτός.

La progresión utilizada es acumulativa y sigue el programa real: artículo y sustantivo desde UD3, preposiciones desde UD4, adjetivos desde UD5 y αὐτός desde UD7. No se anticipan estas estructuras en UD1–2. La retroversión libre pide expresamente nominativo; las preposiciones fijan su régimen. Se comprueban ἐν y σύν con dativo y εἰς con acusativo.

Se ha corregido la concordancia valenciana de «la mar» cuando lleva adjetivo. La acentuación de θεός se ha corregido en las dos alternativas de etimología. Para los compuestos en -grafía se ofrece γράφω y se acepta también γράμμα por pertenencia a la familia estudiada.

La entrada heredada `ὀλιγός` estaba configurada como oxítona. El lema es ὀλίγος. Se ha excluido su paradigma de los modelos completo y traducción para no propagar esas formas. La exclusión es dinámica y se limita a esos dos modelos: no modifica el modelo de morfología, su banco ni sus resultados.

### Criterio docente confirmado

El docente ha confirmado en esta revisión que se aceptan las familias etimológicas: οἰκία/οἶκος y νόμος/νέμω. Se mantiene «economía» desde que están estudiados οἰκία y νόμος; no se exige haber estudiado por separado οἶκος o νέμω. La clave ofrece ambas variantes. No se ha eliminado la ficha curricular ni ampliado el temario.

No queda ninguna decisión docente imprescindible pendiente.

### Referencias de contraste

La etimología histórica estricta y la aceptación escolar por familia se distinguen expresamente. El criterio de evaluación aplicado es el confirmado por el docente.

- [DLE, economía](https://dle.rae.es/econom%C3%ADa): οἶκος y νέμειν como componentes históricos.
- [DLE, -grafía](https://dle.rae.es/-graf%C3%ADa): relación con γράφειν.
- [DLE, teo-](https://dle.rae.es/teo-): θεός.
- [DLE, filo-](https://dle.rae.es/filo-): φιλο-/‑φιλος, compatibles con la familia escolar de φίλος.
- [Dickinson College, ὀλίγος](https://dcc.dickinson.edu/greek-core/%E1%BD%80%CE%BB%CE%AF%CE%B3%CE%BF%CF%82-%E1%BD%80%CE%BB%CE%AF%CE%B3%CE%B7-%E1%BD%80%CE%BB%CE%AF%CE%B3%CE%BF%CE%BD): acentuación del paradigma de referencia.

## Validación

Los registros y documentos de muestra se conservan en `test-artifacts/greek1-qa/`. El resumen consolidado es `final-results.json`: 43 comprobaciones locales distintas, todas satisfactorias. Contiene el último resultado disponible de cada prueba, incluido el reintento satisfactorio de las pruebas cuyo supuesto antiguo se ha actualizado.

- Auditoría curricular nueva: 112 contextos, correspondientes a catorce unidades, dos modelos, dos idiomas y dos distribuciones. Comprueba disponibilidad, paradigmas testigo, respuestas, edición, borradores, regeneración y exportación sin red.
- Auditoría general de exámenes reales: 656 casos, 84 comprobaciones de palabras, 14 de editores y cero incidencias registradas.
- Contraste con la base anterior a #163: 30 combinaciones con el HTML del examen idéntico, usando el mismo sorteo. Incluye todos los modelos de Latín I, el completo de Latín 4.º y Morfología de Griego I, en ambos idiomas y tres unidades representativas por curso.
- Word: exportaciones reales de los siete modelos, comprobación del contenido XML, puntuación, tablas, sangrías, subrayados y exclusión/inclusión de soluciones. La auditoría nueva conserva dieciséis DOCX de Griego I: dos modelos, dos idiomas, dos distribuciones y versiones de alumnado/profesorado.
- PDF: ocho muestras de los modelos griegos y comprobaciones de descarga y paginación multipágina en Chromium y WebKit. Se ha revisado visualmente la representación de muestras Word y PDF.
- Interfaz: catorce combinaciones de orientación y distribución en perfiles simulados de Safari iPhone, iPad, escritorio y Android. Estas pruebas no sustituyen una inspección en un dispositivo físico.
- Offline: reconstrucción binariamente idéntica y PWA instalada con red cortada; también se verifican las nuevas actividades, sus soluciones y la regeneración desde la caché.
- Regresión: puntuación 3+1+6 editable, cambio de cantidades, regeneración de preguntas y palabras, editores bidireccionales, modelos, glosarios, léxico latino, corpus de vocabulario y autorización de evidencias.

Las comprobaciones documentadas en este informe son locales. Los resultados remotos que se inicien al actualizar la PR deberán consultarse por separado; no se presentan aquí como superados anticipadamente. La auditoría automática verifica los bancos y construcciones cubiertos; no constituye una certificación universal de todo el corpus histórico de la aplicación.

## Reproducción principal

Con Node y Playwright disponibles:

```sh
node scripts/build-offline.mjs
node scripts/test-greek-choice-groups.cjs
node scripts/test-greek-choice-audit.cjs
node scripts/test-greek-question-regeneration.cjs
node scripts/test-question-part-regeneration.cjs
node scripts/test-single-word-regeneration.cjs
node scripts/test-latin4-conjugation-isolated-forms.cjs
node scripts/test-bidirectional-editors.cjs
node scripts/test-preview.cjs
node scripts/test-exam-models.cjs
node scripts/test-export-workspace.cjs
PDF_TEST_BROWSER=webkit node scripts/test-export-workspace.cjs
node scripts/test-device-compat.cjs
node scripts/test-real-exam-audit.cjs
npm run offline:test
npm run pwa:test
npm run vocabulary:test
```

El resto de registros individuales conserva el nombre del script ejecutado. El informe consolidado enumera todas las pruebas y su resultado.

## Seguimiento de las comprobaciones remotas

La primera ejecución remota del cambio `bae61a8` superó cuatro baterías y se detuvo en la quinta por una expectativa histórica: `test-sentence-points-and-drafts.cjs` exigía un punto por oración también en los dos modelos griegos, incompatible con el bloque editable de seis puntos aprobado. La reconstrucción offline y todas las comprobaciones anteriores de esa batería habían pasado.

Se ha actualizado esa prueba manteniendo intactas las exigencias latinas. Para Griego se comprueban los seis puntos con cinco y siete huecos, la conservación del bloque al cambiar su cantidad, la edición manual a siete puntos sin redistribución y la recuperación de la cantidad y de la puntuación docente desde un borrador. También se han actualizado los selectores de alternativas de la prueba combinada de fase III, manteniendo sus garantías de identidad de nodos y conservación de ediciones.

Las cuatro pruebas específicas de oraciones y borradores, integración de fase III, aislamiento fonético y aislamiento morfológico han pasado localmente en web y offline. Esta corrección modifica pruebas y documentación; no cambia la aplicación ni los modelos. Los resultados remotos del nuevo cambio deben consultarse en GitHub.
