# Cotejo individual de 42 cantidades vocálicas heredadas (Latín) — 22/11/2026

## Objeto y procedencia

Revisión de **42 registros de fuente 0** del índice de lematización `data/lemmas/teacher-forms.json`, no de formas previamente acreditadas para calificación. El expediente reproducible `data/lemmas/latin-legacy-double-quantity-collation-20261122.json` contiene, **uno por uno**, el lema, la forma de partida, los rasgos morfológicos, la lectura retenida o corregida, la clasificación y la referencia. Se identificaron exclusivamente filas con macrón y breve simultáneos en cuatro lemas.

| Lema | Registros | Decisión | Fundamentación |
| --- | ---: | --- | --- |
| *alter* | 1 | **Reservar** `alterī̆us`: alternancia métrica en el genitivo singular. | [Allen y Greenough, §113](https://dcc.dickinson.edu/grammar/latin/1st-and-2nd-declension-adjectives-genitive-%C4%ABus-dative-%C4%AB); [Lewis y Short, *alter*](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n2015/). |
| *custos* | 12 | **Corregir** `cū̆st-` → `cūst-` sin alterar las terminaciones. | [Georges y Lewis, *custos*](https://www.lateinlex.de/?call=ShowArticle&id=1514&latein=custos); [currículo irlandés de latín, vocabulario oficial](https://www.curriculumonline.ie/getmedia/40a3400a-8ab6-4345-8f01-9d65742c17e9/Latin-Indicative-Vocabulary-List.pdf). Ambos registran *cūstōs, cūstōdis*. |
| *nullus* | 1 | **Reservar** `nūllī̆us`: larga habitual, breve documentada en Lucrecio. | [Lewis y Short, *nullus*](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n31390/); [Allen y Greenough, §113](https://dcc.dickinson.edu/grammar/latin/1st-and-2nd-declension-adjectives-genitive-%C4%ABus-dative-%C4%AB). |
| *princeps* | 28 | **Reservar** `prī̆nc-`: el valor tradicional largo tiene testimonio lexicográfico, pero se documenta también la interpretación breve; no uniformar por conjetura. | [Logeion, *princeps*](https://logeion.org/princeps); W. Sidney Allen, [*Vox Latina*, apartado «Hidden quantity»](https://latim.paginas.ufsc.br/files/2012/06/ALLEN-Vox-Latina-A-Guide-to-Pronunciation-of-Classical-Latin-Cambridge-1978.pdf); [«Osthoff's Law in Latin»](https://www.sciencedirect.com/org/science/article/pii/S2212588417000060). |
| **Total** | **42** | **12 corregidos; 30 en reserva** | No se elevan registros a fuente 5. |

## Decisión sobre cada forma

- **12 registros de *custos***: corrección de la grafía de la vocal inicial en las 12 lecturas presentes. Se conservan todas las etiquetas de caso y número, la fuente 0 y los datos de procedencia del material heredado. No se reconstruye ni acredita el resto del paradigma.
- **1 registro de *alter***: el genitivo singular `alterī̆us` conserva la indicación histórica hasta fijar un tratamiento tipográfico de las variantes sin modificar el sistema de consulta. No se declara que los dos valores sean equivalentes en toda época o género.
- **1 registro de *nullus***: `nūllī̆us` conserva el testimonio con breve excepcional y larga ordinaria. Para exposición escolar puede preferirse `nūllīus`, pero eso no justifica eliminar sin registro la variante poética.
- **28 registros de *princeps***: se mantienen expresamente tanto las lecturas de sustantivo como de adjetivo y sus etiquetas morfológicas heredadas; la eventual alternativa breve afecta a la vocal inicial de todas ellas. El macrón y breve en el mismo grafema no constituye por sí solo una nueva forma flexiva ni una autorización para calificar. Para resolver una grafía escolar uniforme habría que especificar periodo, criterio lexicográfico y uso previsto.

## Implementación reproducible y salvaguardias

El generador `scripts/build-lemma-index.mjs` incorpora una **lista cerrada de 42 claves** procedentes del expediente de revisión. Exige que cada una aparezca una sola vez en el origen; corrige únicamente las doce filas de *custos*, y conserva literalmente las otras treinta. Ante un cambio en el extracto externo se detiene la reconstrucción para exigir nuevo cotejo.

La tabla generada conserva **14.507 filas latinas y 2.817 griegas**; siguen idénticas las características morfológicas, el código de procedencia de las 42 filas (`0`), las referencias de formas contrastadas (`5`), el léxico exigible, los parámetros de calificación y la PWA. No se modifica el motor de exámenes ni las tablas de declinación, donde *nullus* continúa excluido por decisión docente.

La regresión `scripts/test-filologia-latin-legacy-double-quantity-20261122.cjs` coteja las 42 lecturas, las doce sustituciones y las treinta reservas, prohíbe la promoción indebida a fuente 5 y comprueba los recuentos de referencia. Se ejecuta en los workflows de **Phase I** y **versión autónoma**.

**Publicación:** trabajo agregado a la PR #210 en borrador. Sin fusión ni despliegue. El cierre queda condicionado a CI verde sobre el último commit y autorización docente expresa.

## Reconstrucción autónoma controlada

El workflow aislado reconstruyó el índice académico sin diferencias y regeneró `offline.html` desde `scripts/build-offline.mjs`. La reconstrucción quedó en el [commit `4ccf12c`](https://github.com/ArchaiosMagister/GeneradorExamenes/commit/4ccf12ccd609e1382a6737a282a83652afad3dec), que también eliminó su propio workflow temporal. Esta comprobación **no es un despliegue**. La CI regular debe comprobar el último commit posterior del expediente.
