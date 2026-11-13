# Cierre de inventario griego: 559 candidaturas individuales

**13/11/2026 · rama académica sin despliegue · no constituye 559 certificaciones nuevas.**

## Resultado reproducible

Se ha identificado y clasificado **cada una de las 559 lecturas de fuente 4** que siguen en `data/lemmas/teacher-forms.json`, correspondientes a **68 lemas**. Cada ficha del registro `data/lemmas/revision-559-griego-20261113.json` conserva identificador, lema, enunciado docente, unidades, forma original con politonía, forma escolar sin marcas de cantidad, análisis gramatical, referencia del extracto cuando existe, incidencia, justificación y política de calificación. La prueba `node scripts/test-revision-559-griego.cjs` contrasta los 559 identificadores con ambas fuentes persistentes, verifica las cifras y prohíbe atribuir a la revisión promociones o claves automáticas.

| Clasificación | Análisis | Política |
| --- | ---: | --- |
| Lemas sin unidad y sin reproducción en el extracto nominal actual | 49 | No promocionar; recuperar la procedencia y asignación por separado |
| Lemas sin unidad, con extracto reproducible | 442 | Conservar consulta, no sorteo curricular |
| `πρῶτος`, acentuación incompatible con el paradigma documentado | 24 | Guardar correcciones exactas por forma; no aprobar las grafías defectuosas |
| Formas femeninas de `ἀθάνατος`, `ἐχθρός` y `αἰσχρός` | 21 | Consultar criterio docente sobre enunciados de dos/tres terminaciones |
| `κεφαλῇ`, dativo correcto con enunciado `κεφαλῆ, –ῆς` erróneo | 1 | Corregir primero el enunciado a `κεφαλή, –ῆς` |
| Otras lecturas con unidad curricular | 22 | Priorizar cotejo documental exacto; no verificar por analogía |
| **Total** | **559** | **0 promociones automáticas** |

Entre las 491 candidaturas sin unidad hay cinco lemas, **49 lecturas**, cuyo par forma/análisis ya no está presente en `greek-nominal-candidates.json`: `δεῖπνον` (10), `ἐκκλησία` (10), `νεκρός` (10), `πένης` (9), `πρόβατον` (10). Esto **no demuestra que sus formas sean falsas**: significa que no se debe alegar trazabilidad con el extracto actual. Requieren localizar la procedencia original o realizar cotejo nuevo.

## Decisiones docentes necesarias

- **ἀθάνατος, –ον**: ocho candidaturas de femenino por primera declinación. La tabla escolar clásica de dos terminaciones conserva masculino/femenino en segunda declinación; no incorporar `ἀθανάτη` como femenino del lema docente sin decisión.
- **ἐχθρός, –ον**: diez candidaturas femeninas `ἐχθρά` y relacionadas; hay tratamiento lexicográfico de tres terminaciones que no concuerda con la entrada escolar actual. Decidir si conservar el enunciado restrictivo o ampliarlo.
- **αἰσχρός, –ον**: tres candidaturas femeninas de tres terminaciones; las otras dieciséis de la cola son masculinas/neutras y siguen pendientes de cotejo formal y migración. Conservar el enunciado docente hasta decisión.

Estas tres elecciones no deben forzar cambios masivos a otras unidades ni certificar por sí mismas cualquier flexión.

## Correcciones detectadas que no requieren elegir paradigma

- **πρῶτος, πρώτη, πρῶτον**: la fuente 4 conserva 24 grafías con acento alterado (p. ej. `πρωτά` por `πρῶτα` y `πρωτός` por `πρῶτος`). Se registran las 24 sustituciones conservando caso, género, número, espíritus e iota suscrita. Paradigma consultado: https://greekdoc.github.io/lexicon/prw.html .
- **κεφαλή, –ῆς**: el dativo `κεφαλῇ` es compatible con el paradigma correcto; el enunciado original `κεφαλῆ, –ῆς` requiere una modificación **editorial persistente** antes de una promoción. Fuente: https://es.wiktionary.org/wiki/%CE%BA%CE%B5%CF%86%CE%B1%CE%BB%CE%AE .
- **ἀθάνατος** como adjetivo de dos terminaciones: paradigma escolar de referencia: https://iespedrosoto.es/departamentos/latin/morfosintaxis/griego/primera_segunda_decl.html .

## Próximo paso recomendado

**Finalizar la migración condicionada de las 22 lecturas curriculares compatibles y las 25 correcciones editoriales** solo tras prueba individual y aplicación coherente a fuente persistente, índice, PWA, programa y Word. Pedir las tres elecciones docentes. No agotar las **3244** candidaturas latinas mediante promociones indiscriminadas: priorizar cobertura de verbos irregulares/deponentes, anomalías del examen y vocabulario realmente impartido; avanzar en la **fase IV de persistencia y trazabilidad** en paralelo.

El cierre funcional de la fase III figura en `docs/fase-iii-20261113.md` y los workflows de su rama están en verde, pero **no está fusionado en `main` ni publicado**. La auditoría de las 559 propuestas es un cierre de clasificación; **quedan lecturas sin certificación individual**, y no se declara terminado el proceso filológico.

## Cierre docente de los tres paradigmas (13/11/2026)

**Estas decisiones se incorporan después de la auditoría histórica de 559 candidaturas.** La tabla anterior y sus 21 registros «pendientes de decisión» se conservan como evidencia de lo detectado antes de la aprobación; su estado histórico y las 559 fichas no se reescriben ni se declaran verificadas. La situación académica actual está en `data/lemmas/greek-adjective-decisions.json`.

- **ἀθάνατος, –ον (UD8):** dos terminaciones; las ocho propuestas de femenino por primera declinación se excluyen del repertorio examinable. Los registros originales y decisiones previas siguen consultables.
- **ἐχθρός, –ά, –όν (UD5):** se corrige el enunciado del vocabulario desde `ἐχθρός, –ον` y se admite el paradigma con femenino en –ά. **Sus diez candidaturas femeninas siguen en fuente 4, bloqueadas**, hasta comprobación documental *individual* de forma y análisis. La aprobación del paradigma no constituye autorización ni prueba morfológica. Temporalmente se excluye el lema del sorteo automático de sintagmas, para no generar femeninos sin verificar.
- **αἰσχρός, –ον (UD5):** enunciado escolar de dos terminaciones. Las tres propuestas femeninas de primera declinación se conservan en el historial y no se incluyen en el sorteo ni en el repertorio exigible.

Se conservan los femeninos ya contrastados de otros lemas y los análisis masculino/neutro documentados; no se rebaja ninguna fuente ni se promueve ninguna candidata a fuente 5. La cuarentena de acentuaciones de πρῶτος y la variante épica παῖδι permanece intacta. La función de autorizaciones bloquea las 21 candidaturas incluso si se intenta importar un permiso antiguo.

La fuente persistente que reproduce el enunciado de `ἐχθρός` al reconstruir la base es `data/lemmas/verified-overrides.json` (entrada `entryCorrections`). El índice `teacher-forms.json`, la interfaz y `offline.html` se regeneran sincronizados. Prueba dedicada: `scripts/test-greek-adjective-decisions.cjs`; la CI comprueba que no desaparezca ninguna de las 21 identidades históricas ni se active una autorización.


## Cotejo individual de ἐχθρός — diez lecturas femeninas

Cotejo posterior al cierre del inventario y **limitado a diez candidaturas**: `grc-pending-159` a `grc-pending-168`. La tabla ática de [Wikcionario](https://en.wiktionary.org/wiki/%E1%BC%90%CF%87%CE%B8%CF%81%CF%8C%CF%82) y el [paradigma comparativo de Hellas Alive](https://hellas.bab2min.pe.kr/hk/exqros?l=en) contienen las diez combinaciones de forma y análisis (Hellas Alive advierte expresamente que parte de su conjugación/declinación está generada y puede contener errores; se toma como contraste, no como única prueba).

**Resultado: 10/10 combinaciones coinciden con la flexión ática de `ἐχθρός, –ά, –όν`**, sin grafías incompatibles ni errores de caso o número. Se comprueba especialmente la diferencia de acentuación entre `ἐχθρᾶς` (genitivo singular) y `ἐχθράς` (acusativo plural), así como la iota suscrita de `ἐχθρᾷ`. Hay ocho grafías distintas y cinco lecturas con sincretismo: los dos análisis femeninos de `ἐχθρά` comparten forma entre sí y con el neutro plural; los dos de `ἐχθραί` comparten forma entre sí; `ἐχθρῶν` es también genitivo plural masculino y neutro.

Se incorpora el expediente reproducible `data/lemmas/cotejo-10-echthros-20261113.json` y la regresión `scripts/test-echthros-ten-collation.cjs`, que cotejan *cada ficha con su identidad histórica exacta*. **El cotejo documental no equivale a conceder una autorización de examen**: se conservan los registros originales de fuente 4, la cuarentena de permisos antiguos, y el bloqueo de sorteo mientras se decide una incorporación segura que preserve los análisis alternativos. No se alteran otras fichas ni se publica.

## Incorporación definitiva de las diez lecturas contrastadas (PR 105)

El expediente `data/lemmas/cotejo-10-echthros-20261113.json` acredita **10 análisis femeninos** de `ἐχθρός, –ά, –όν`, conservando las ocho grafías distintas, la acentuación, la iota suscrita y **cinco lecturas sincréticas**. Las diez fichas fuente 4 se han migrado a fuente 5 mediante `data/lemmas/verified-overrides.json` y `scripts/build-lemma-index.mjs`. Se mantienen sus identificadores, formas originales y referencias en el expediente histórico de las **559** candidaturas, que no se reescribe: el índice vigente presenta **549 pendientes y 10 incorporadas individualmente**. Otras once propuestas femeninas de primera declinación siguen expresamente excluidas.

El motor de sintagmas admite nuevamente el adjetivo desde **UD5**, con concordancia y flexión de primera declinación femenina. Las formas `ἐχθρά`, `ἐχθραί` y `ἐχθρῶν` conservan sus lecturas alternativas en el lematizador; la documentación de una forma no supone autorizar una solución única fuera de contexto. El índice y `offline.html` se reconstruyen y verifican mediante CI. Las recomendaciones históricas anteriores se conservan como **fotografía de la revisión en aquel momento**, no como estado actual.
