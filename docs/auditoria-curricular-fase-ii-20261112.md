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
