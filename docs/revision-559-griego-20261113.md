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
