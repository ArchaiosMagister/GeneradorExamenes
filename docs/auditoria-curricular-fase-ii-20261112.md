# Fase II · Auditoría curricular y verbal inicial

**Estado:** rama de trabajo, PR #97 en borrador. No fusionar ni publicar sin autorización del docente.

## Inventario reproducible de formas sorteables

El control `scripts/test-verb-curriculum-browser.cjs` recorre en Chromium **las unidades efectivas** de Latín I, Latín 4.º y Griego I y produce `test-artifacts/fase-ii-inventario-morfologico.json`. Contabiliza, para cada etapa, los lemas, las formas verbales elegibles, los tiempos/voces, las categorías de análisis y las fichas griegas admitidas. Distingue:

- **Formas explícitas:** procedentes del índice persistente, fuente 1 (paradigma docente) o 5 (contraste individual).
- **Formas derivadas por regla:** admisibles según las limitaciones docentes del motor, pero **no verificadas individualmente**.
- **Formas candidatas:** modelos externos sin contraste; quedan fuera del sorteo salvo autorización docente individual bajo el control de evidencia ya implementado.
- **Formas bloqueadas:** casos ambiguos, irregulares no contrastados o contenidos posteriores a la unidad.

Que una forma esté **habilitada por currículo** no constituye prueba de su uso textual ni aval de todas las casillas de su paradigma.

## Correcciones verbales de Latín I realizadas

| Umbral | Contenido comprobado | Salvaguarda |
| --- | --- | --- |
| UD1 | Presente activo; `sum` y los verbos regulares/mixtos con enunciado utilizable | Se mantiene enunciado abreviado antes del perfecto |
| UD2 | Imperfecto activo; presente irregular explícito de `eo` | No se anticipa voz pasiva |
| UD3 | Presente e imperfecto pasivos de verbos transitivos admitidos | No generar pasivas personales por el mero hecho de existir un supino |
| UD4 | Perfecto y pluscuamperfecto activos | El perfecto requiere tema presente en el enunciado |
| UD7 | Futuro activo/pasivo; presente deponente explícito de `conor` | Se etiqueta «deponente», no «activo» por analogía con UniMorph |
| UD9 | Perfecto y pluscuamperfecto pasivos compuestos | Participio y auxiliar en concordancia; no se extiende a intransitivos |

### Cinco conjugaciones escolares

El motor distingue **1.ª, 2.ª, 3.ª, 4.ª y 3.ª mixta**. Para la mixta se comprueban, entre otras, las secuencias de `capio`: `capio, capis, capit, capimus, capitis, capiunt`; `capiebam`; `capiam`; y pasivas `capior, caperis, capitur`. `facio` conserva su infectum activo y no genera `*facior`: su infectum pasivo es `fio` y necesitará tratamiento irregular explícito, sin inferencia.

Los verbos cuyo enunciado no permite la regla conservadora quedan bloqueados hasta un contraste individual, aunque figuren en el vocabulario.

### Paradigmas explícitos: 42 registros, sin nuevos supuestos

Se han conectado a la generación exclusivamente las formas **ya contrastadas** del índice `data/lemmas/teacher-forms.json`:

- **`sum`: 30** formas distribuidas entre presente, imperfecto, futuro, perfecto y pluscuamperfecto (fuente 5).
- **`eo`: seis** formas de presente (fuente 5).
- **`conor`: seis** formas de presente deponente (fuente 1).

`scripts/test-latin-verb-evidence.cjs` comprueba **una por una** estas 42 correspondencias contra sus fichas y etiquetas persistentes. El extracto utilizado por `index.html` no puede divergir silenciosamente. **No se presupone** el resto del paradigma de `eo` ni el resto de los tiempos de `conor`.

Para los exámenes de morfología, la selección reserva una pasiva desde UD3, incorpora el deponente documentado desde UD7 cuando hay espacio suficiente y, desde UD9, reserva perfecto y pluscuamperfecto pasivos cuando el banco y la cantidad de filas lo permiten.

## Griego I y verbos deponentes latinos: primera pasada

El inventario recorre las catorce unidades griegas y sus paradigmas curriculares ya incluidos. No reinterpreta como «verificadas» las formas de fuentes externas ni reconstruye paradigmas medios o irregulares a partir de una sola forma.

`scripts/audit-verbs-evidence.cjs` produce `test-artifacts/fase-ii-revision-irregulares-deponentes.json`: cola razonada de irregulares, deponentes y semideponentes latinos y de verbos griegos de enunciado medio. Cada entrada indica unidades, procedencia, número de registros con evidencia individual y opciones de decisión.

**Pendientes prioritarios:** `possum`, compuestos de `eo`, `fero`/compuestos, deponentes como `loquor`, `sequor`, `proficiscor`, así como semideponentes `audeo` y `gaudeo`. Para varios deponentes, UniMorph conserva etiquetas `ACT` aunque sus desinencias sean formalmente pasivas: se exige un cotejo filológico antes de incorporarlos. No se han convertido estas lecturas en clave de examen automáticamente.

## Garantías de no regresión

La CI ejecuta:

1. Contraste de las 42 fichas y la conjugación mixta.
2. Inventario completo de progresión curricular y bloqueo de pasivas improcedentes.
3. Auditoría de irregulares y deponentes con exportación de pendientes.
4. Regresiones preexistentes de modelos, lematización, edición bidireccional, Word, PWA, valenciano y versión offline.

Los archivos del inventario y de la cola de revisión se adjuntan a la ejecución de GitHub Actions **sin sobrescribir ningún banco académico**.

## Qué queda pendiente antes de cerrar definitivamente la fase II

- Colación individual de paradigmas de `possum`, `fero` y sus compuestos, así como `fio` frente a `facio`.
- Ampliación documental de los tiempos de los deponentes y semideponentes según el programa docente.
- Contraste nominal y verbal griego, con variantes áticas y morfología media, para las unidades avanzadas.
- Incorporación **solo** de decisiones docentes y formas contrastadas a las fuentes persistentes; reconstrucción del índice, versión offline y repetición de la batería completa.
- Ninguna fusión, publicación ni modificación de `main` sin autorización expresa.

## Segunda pasada: irregulares, deponentes y aoristo griego (12 de noviembre)

La revisión posterior amplía las 42 casillas explícitas ya integradas con **84 registros nuevos de fuente 5**: 72 latinos y 12 griegos. El código mantiene las derivaciones regulares claramente separadas de la evidencia por forma y persona.

| Lema | Unidad de primera admisión | Datos incorporados | Límite |
| --- | --- | --- | --- |
| `possum, potui` | Latín I UD8 | 30 casillas: presente, imperfecto, futuro, perfecto y pluscuamperfecto de indicativo activo | No se genera una voz pasiva |
| `confero, contuli, collatum` | Latín I UD5 | 30 casillas, los mismos cinco tiempos, sin aplicar terminaciones regulares de tercera al infectum | No se infieren automáticamente formas pasivas, participios ni otros compuestos de *fero* |
| `loquor, locutus sum` | Latín I UD9 | Seis casillas del presente de indicativo deponente, con desinencias pasivas y significado activo | `loqueris` (presente o futuro) se excluye del análisis aislado; no se acreditan los otros tiempos |
| `sequor, secutus sum` | Latín I UD9 | Seis casillas del presente de indicativo deponente | `sequeris` es temporalmente ambiguo sin contexto; se conserva en tablas de conjugación, no en análisis aislado |
| `βούλομαι` | Griego I UD6 | Seis casillas del presente de indicativo medio/deponente | Se mantiene por separado el criterio de variantes (`βούλει`/`βούλῃ`); no se genera aoristo ni perfecto |
| `ἔρχομαι` | Griego I UD12 (aoristo) | Seis casillas del aoristo segundo activo, además del presente medio ya documentado en UD9 | `ἦλθον` corresponde a primera persona singular **o** tercera persona plural; se muestran ambas en la ficha de análisis y no se fuerza una sola lectura en la tabla sin contexto |

Los registros nuevos aparecen en `data/lemmas/verified-overrides.json` con la fuente filológica, y se han persistido en `data/lemmas/teacher-forms.json`. Los cambios de esquema de `scripts/build-lemma-index.mjs` conservan `V;IND;DEP;PRS` para los deponentes latinos y `V;IND;ACT;PST;PFV` para el aoristo temático griego. Estos códigos **no** autorizan automáticamente otros paradigmas.

Las comprobaciones `scripts/test-latin-verb-evidence.cjs` y `scripts/test-verified-verb-overrides.cjs` contrastan los extractos de la aplicación con el índice y la fuente persistente. La prueba curricular con Chromium comprueba admisión por unidad y que las formas sincréticas no se traten como unívocas. **No se concede aprobación docente colectiva a las demás formas del mismo lema**.

### Fuentes filológicas de la segunda pasada

- *possum*: [The National Archives, gramática latina](https://www.nationalarchives.gov.uk/latin/stage-2-latin/resources/stage-2-latin-grammar-resource/).
- *confero*: [tabla flexiva](https://www.nihilscio.it/Manuali/Lingua%20latina/Verbi/Coniugazione_latino.aspx?lang=ES_&verbo=confero) y [Dickinson College Commentaries, *fero* y sus compuestos](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-fer%C5%8D-and-ed%C5%8D).
- *loquor*: [The Latin Library, deponentes](https://www.thelatinlibrary.com/101/Deponent.pdf).
- *sequor*: [paradigma de referencia](https://elon.io/grammar/latin/verb-reference/sequor), contrastado con [DCC, deponentes](https://dcc.dickinson.edu/grammar/latin/deponent-verbs).
- *βούλομαι*: [Logeion, aparato morfológico](https://logeion.uchicago.edu/morpho/%CE%B2%CE%BF%CF%8D%CE%BB%CE%B5%CE%B9).
- *ἔρχομαι*: [Scaife ATLAS](https://atlas.perseus.tufts.edu/lemma/2201/).

### Pendientes

La cola `scripts/audit-verbs-evidence.cjs` sigue distinguiendo el contraste de un presente de la certificación de todo un paradigma. Permanecen por revisar los demás compuestos de `eo`, el infectum pasivo irregular de `facio` (`fio`), los tiempos compuestos de deponentes y semideponentes, y las variantes del griego avanzado. El infinitivo y los participios no se generan automáticamente a partir de estos registros.

Este avance **no modifica `main` ni despliega la aplicación**.


## Continuación conservadora — integridad del examen definitivo

### Perfecto semideponente de *audeo* (Latín I, desde UD9)

El banco docente ya contenía **seis formas explícitas**, con sujeto masculino, etiquetadas como `DOCENTE;perfecto de indicativo, sujeto masculino`: *ausus sum, ausus es, ausus est, ausi sumus, ausi estis, ausi sunt*. Se conectan a los ejercicios sin modificar la ficha original, como **perfecto de indicativo semideponente**, con `sourceCode: 1`. **No** se deducen a partir de ellas imperfectos, futuros, pluscuamperfectos, ni variantes femeninas/neutras sin contraste propio. Su enunciado conserva *audeo, ausus sum (2ª)*; el ejercicio puede seleccionar estas seis lecturas solo a partir de UD9.

Este agregado aumenta la trazabilidad latina de **114 a 120 formas expresamente documentadas** en el motor. Las dos lecturas sincréticas de deponentes de tercera no se ofrecen en tablas sin contexto, de modo que el inventario de formas aisladas espera **118 lecturas con procedencia individual**, frente a 112 antes de este pase. El número exacto se calcula ahora en la prueba desde el extracto del índice, no de un total histórico.

### Dos modalidades de exportación, sin regresión

La interfaz de puntuación añade una casilla **«Examen definitivo: comprobar la puntuación antes de exportar»**. Está inicialmente **desmarcada** y se reinicia al cambiar de materia o tipo de examen:

- **Borrador (opción predeterminada):** Word e impresión siguen funcionando como hasta ahora, aunque falten preguntas o no se hayan distribuido todavía los 10 puntos.
- **Definitivo, examen general o de traducción:** exige preguntas presentes y **total exacto de 10,00 puntos**. Si no se cumple, Word e impresión se bloquean y se explica la causa, sin borrar el borrador ni cambiar las puntuaciones.
- **Definitivo, examen de morfología:** cada pregunta conserva **1 punto**; las preguntas deben tener puntuación positiva y la nota se normaliza a 10. Se conserva la programación docente anterior.
- El control académico por forma (autorización explícita de propuestas) **sigue funcionando adicionalmente**; ninguno de los dos controles sustituye al otro.

El control se prueba sin conexión con `scripts/test-final-export-preflight.cjs`: Word, impresión, edición de puntuaciones, borrador y valencià/castellano. Su activación no se persiste accidentalmente en otros exámenes.

### Inventario adicional por lema y riesgo

`scripts/audit-verb-coverage.cjs` genera el artefacto `fase-ii-cobertura-verbal-por-lema.json`, una matriz con cada irregular, deponente, semideponente y verbo griego medio que pertenezca al programa. Registra **unidad**, enunciado, fuentes individuales, tiempos realmente respaldados y **lagunas que deben permanecer fuera del sorteo**.

En especial se diferencia el perfecto masculino explícito de *audeo* de sus formas del infectum no contrastadas individualmente. El índice persistente es la autoridad; no se promocionan automáticamente las candidatas de UniMorph, Wikcionario, las reglas regulares ni el corpus auxiliar.

**Cierre de este pase:** todas las actuaciones permanecen en la PR #97 en borrador. No se publica `main`, no se toca el banco original externo y no se presupone que el resto de las fases —como una integración híbrida online/offline o una auditoría individual de toda la flexión griega— estén concluidas. La regeneración de la PWA se realiza en CI para cada revisión y se comprueba antes de cualquier propuesta de publicación.
