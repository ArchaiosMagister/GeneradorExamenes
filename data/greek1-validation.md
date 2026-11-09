# Griego I — corpus de la versión 20

Fuentes docentes recuperadas de la conversación «Crear app de exámenes clásicos»:

- `temas y vocabulario griego 1.txt`: temario UD0–14, vocabulario exigible y banco general. `greek1-materials.json` conserva los bloques y sus grafías; elimina solo la repetición literal de UD10 y separa el encabezado UDs6–7 pegado a la última palabra de UD5.
- `Examen UDs 3y4 gr1.pdf`: estructura del examen completo, formas de análisis, etimología y oraciones.
- `ex ud7 gr1.docx`: estructura independiente de análisis/traducción/etimología, pronombres y oraciones.
- `ex morf ud7 gr1 (revisar vbos).docx`: tabla de pronombres y formas nominales/adjetivales. Sus formas verbales no se incorporan, salvo βούλονται, también presente en el documento sin marca de revisión.
- Paradigmas nominales y de presente activo explícitos ya incorporados en v19: se mantienen; no se añade flexión por terminaciones ni un motor morfológico general.

## Criterios aplicados

Cada ejercicio tiene identificador, tipo, unidad gramatical mínima y unidades cuyo contenido representa. La cobertura usa estas etiquetas de contenido, no la unidad del vocabulario. La selección reserva representantes de todas las unidades marcadas cuando el corpus habilitado por la modalidad lo permite; puede superar el número solicitado. Las lagunas y los apartados con menos ejercicios de los solicitados se notifican en la configuración. Los apartados vacíos no suman puntos.

La gramática es siempre acumulativa. El banco general de palabras no habilita ejercicios ni determina unidades gramaticales. Las importaciones genéricas tampoco entran automáticamente en el corpus cerrado de Griego I.

Los bloques léxicos UDs1–4 y UDs6–7 se conservan como bloques indivisibles. Se consideran exigibles al terminar el bloque, UD4 y UD7 respectivamente; antes se proporciona traducción. Palabras básicas: desde UD0; preposiciones: desde UD4. Es una decisión conservadora explícita y editable en el gestor del vocabulario.

Los ejercicios de etimología piden derivados, no la traducción del lema. Las respuestas y los análisis sintácticos son soluciones orientativas revisadas durante esta implementación; no se presentan como solucionarios originales del docente.

## Material retenido para revisión

- Oraciones 3 y 4 del ejemplo UD3–4: anomalías de acentuación, entre ellas ἀνθρώποι; no se corrigen silenciosamente.
- Oraciones 2, 4 y 5 de UD7: anomalías como ἐκείνοι, τὸδε y οικίαν, y construcción posesiva pendiente de revisión.
- Forma pronominal ἐκείνα: acentuación pendiente de revisión. Se conserva en la referencia de procedencia, pero se excluye del corpus seleccionable.
- Las oraciones con νεώς, γυναίκες y πόλιν se habilitan desde UD8, porque exigen tercera declinación según el temario, aunque aparezcan en ejemplos anteriores como vocabulario de apoyo.
- Las tablas completas de concordancia de UD7 esperan paradigmas validados. Se ofrece concordancia por análisis de la secuencia atestiguada οἵδε οἱ ἵπποι. No se fabrican tablas para los sintagmas originales.
- No hay ejercicios específicos verificados para todas las UD0–14. Seleccionarlas permite detectar las lagunas, no rellena el corpus con ejercicios inventados.

## Pruebas reproducibles

`node scripts/check-web.mjs` verifica sintaxis y controles principales. `node scripts/test-greek-ui.cjs`, con Playwright y un navegador instalado, comprueba 300 generaciones aleatorias para las tres modalidades, combinaciones de dos y varias unidades, límites gramaticales, cobertura disponible, puntuaciones, borradores, cambio de idioma, diseño móvil, colores por curso y nueve descargas DOCX. Permite configurar `PLAYWRIGHT_PATH`, `BROWSER_PATH` y `TEST_OUTPUT_DIR` sin instalar dependencias en la aplicación.

Las exportaciones se comprueban además como ZIP y XML WordprocessingML, con separación de alumnado y soluciones. Las páginas renderizadas sirven para revisar tablas, politónico, espacio de respuesta y paginación. Tauri mantiene la fuente única `index.html`; el flujo de Mac sigue siendo exclusivamente manual y no se ha iniciado.
