# Calidad y cobertura del generador de vocabulario por unidades

Esta mejora parte de la PR #31 (sin fusionar `main`) y no sustituye el banco docente ni altera las decisiones filológicas anteriores.

## 1. Auditoría reproducible
- `node scripts/test-vocabulary-quality.cjs` comprueba las 2.046 filas iniciales de Latín I, Latín 4.º ESO y Griego I, y verifica que la clasificación de estados cubre todas las fichas.
- El nuevo módulo `vocabulary-quality.js` clasifica cada ficha y unidad en: **al menos una forma contrastada** (fuentes 0, 1 o 5), solo candidata (2 o 4), solo cita (3) o sin correspondencia segura.
- Distingue las traducciones castellanas y valencianas ausentes, duplicados literales en una misma unidad y conflictos de glosa por lema.
- La presencia de una forma contrastada **no demuestra un paradigma completo ni valida todos los significados**. La cifra «lista para morfología» es un indicador técnico limitado, no una aprobación del conjunto de formas.

## 2. Revisión filológica por lotes
- En «Generador de vocabulario» → «Cobertura del vocabulario y revisión por unidades» se muestra una cola filtrable por UD (primeros 30 registros, con exportación completa a JSON).
- El panel «Revisión filológica y decisiones docentes» permite continuar la revisión morfológica y registrar decisiones para Latín I, **Latín 4.º ESO** y Griego I. Las decisiones locales se exportan; no se promueven automáticamente a fuente contrastada.
- Se conserva íntegro el banco original y la traducción valenciana docente. No se resuelven de oficio homografías, paradigmas incompletos ni acepciones dudosas.
- Una revisión completa requiere comprobación y aprobación individual; la cola pendiente es trabajo editorial, no una prueba fallida que deba eliminarse.

## 3. Conexión con los exámenes
- El vocabulario final de oraciones latinas consulta **primero** `ExaminaOfflineLemmatizer.uniqueEntry`, que solo devuelve una forma de fuente contrastada con lema único, y comprueba que existe exactamente una ficha correspondiente en el banco local.
- Si no hay resultado del índice contrastado, se conserva la lógica preexistente de reconocimiento local y las advertencias. No se inventan lemas ni traducciones.
- Griego I conserva su corpus docente y sus controles de cobertura y glosas.

## 4. Pruebas y modo autónomo
- `npm run vocabulary:test` ejecuta la auditoría y el test del generador.
- La comprobación de la PR reproduce además el índice, las vistas previas, los tres modelos, el Word, la PWA y el uso offline.
- `vocabulary-quality.js` se incorpora al HTML offline, al Service Worker y a la publicación web. La versión `main` no se modifica hasta la eventual fusión aprobada de la PR.

**Precaución editorial:** no deben interpretarse como validadas las filas que solo tengan cita de diccionario, una propuesta flexiva o una decisión local de revisión. El docente sigue resolviendo las ambigüedades.
