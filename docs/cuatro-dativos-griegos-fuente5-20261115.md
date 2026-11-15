# Incorporación individual de cuatro dativos griegos · 15-XI-2026

## Ámbito y decisiones aprobadas

Se incorporan **exactamente cuatro** lecturas nominales de Griego I con procedencia documentada individualmente a **fuente 5** de GeneradorExamenes. No se importan paradigmas completos de ScholaClassica, no se modifica ScholaClassica y no se vinculan las aplicaciones ni los repositorios.

| Identificador histórico | Lema | Grafía candidata original | Forma escolar contrastada | Rasgos | Unidad exigible |
|---|---|---|---|---|---|
| `grc-pending-201` | `κεφαλή` | `κεφᾰλῇ` | **κεφαλῇ** | `N;DAT;SG` | UD 6–7 |
| `grc-pending-450` | `ῥήτωρ` | `ῥήτορῐ` | **ῥήτορι** | `N;DAT;SG` | UD8 |
| `grc-pending-451` | `ῥίς` | `ῥῑνῐ́` | **ῥινί** | `N;DAT;SG` | UD8 |
| `grc-pending-462` | `στρατηγός` | `στρᾰτηγῷ` | **στρατηγῷ** | `N;DAT;SG` | UD5 |

La transición cambia la procedencia exacta de cada casilla de **fuente 4** a **fuente 5**, sin alterar su etiqueta morfológica. El macrón y la breve son anotaciones editoriales que no se usan en la grafía escolar; se conservan los espíritus, los acentos y la iota suscrita.

## Evidencia y trazabilidad persistente

Se contrastaron la morfología y la grafía individual con los paradigmas de [Wikcionario](https://en.wiktionary.org) y con [Smyth, *Greek Grammar*](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.4.html), especialmente §259, donde figuran expresamente los dativos de ῥήτωρ y ῥίς.

- `data/lemmas/cotejo-4-dativos-fuente5-20261115.json` es el expediente inmutable de las cuatro decisiones con sus referencias, unidad e ID históricos.
- `data/lemmas/verified-overrides.json` añade **solo cuatro** `singleForms` individualizadas, con `sourceForm`, `historicalId` y la ruta al expediente.
- `data/lemmas/teacher-forms.json` reemplaza **solo cuatro filas** de fuente 4 por sus formas escolares de fuente 5; incorpora cuatro referencias externas. El total de filas griegas no cambia.
- `offline.html` se reconstruye desde el mismo índice para que la PWA autónoma funcione exactamente igual, sin importar archivos externos.
- El historial `revision-559-griego-20261113.json` sigue **sin modificaciones**: `originalSource:4`, `verifiedIndividual:false` y `gradeEligible:false` describen la situación histórica y no deben falsificarse.

### Invariantes posteriores

Las 559 candidaturas originales quedan registradas; 10 lecturas femeninas de ἐχθρός + 4 dativos pasan a fuente 5, mientras 545 permanecen en fuente 4. El índice cuenta 479 registros de `singleForms` persistentes y 478 filas griegas de fuente 5. El catálogo nominal provisional de Wikcionario, las 11 exclusiones de adjetivos, la cuarentena de 24 grafías de πρῶτος y las cinco decisiones de variantes se conservan.

**Verificación filológica no es autorización de examen:** no se crean permisos para preguntas ni se activa corrección automática de lecturas por el mero cambio de fuente; se conservan los controles de ambigüedad y currículo existentes. Las unidades no se adelantan.

## Reproducibilidad y regresión

La reconstrucción de `teacher-forms.json` está defendida por `scripts/build-lemma-index.mjs`, que comprueba el expediente individual antes de aceptar las cuatro promociones. Los controles `scripts/test-revision-559-griego.cjs` y `scripts/test-cuatro-dativos-fuente5.cjs` exigen igualdad de ID, forma, categoría, unidad, procedencia, persistencia y contenido offline, además de conservar ἐχθρός y las exclusiones. Se actualizan únicamente las expectativas de recuentos de las pruebas anteriores; la semántica de las decisiones históricas no cambia.

**Esta PR es independiente de la PR #121 de conciliación ScholaClassica** y puede revisarse sobre `main` actual sin fusionar ni publicar nada. Si se integra después de la PR #121 habrá que conciliar las expectativas del número de candidaturas restantes (54) y volver a ejecutar toda la batería.
