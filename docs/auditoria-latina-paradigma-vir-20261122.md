# Auditoría morfológica: `vir, virī` (22/11/2026)

## Prioridad de la revisión

A partir de esta fase, la auditoría filológica se concentra en **paradigmas nominales y verbales**, concordancia y elegibilidad en las preguntas evaluables. Las cantidades vocálicas del repertorio existente se aceptan con carácter general; para discrepancias manifiestas pueden consultarse Gaffiot (gaffiot.fr) y Collatinus, sin realizar una colación sistemática de macrones.

## Incidencia confirmada

El vocabulario latino de Latín I incluye `vir, –i` (UD2). La función `mNoun` de `index.html` admitía el tipo de segunda declinación en `-us`, `-um`, `-er`, pero no el nominativo excepcional en `-ir`. Como consecuencia, `vir` no ingresaba en el grupo de sustantivos que se pueden declinar, a pesar de ser un paradigma escolar completo y regular.

**Solución conservadora:** se admite exclusivamente el lema `vir` con genitivo abreviado `-i`, reutilizando las terminaciones masculinas ya comprobadas del tipo en `-er` con mantenimiento íntegro del tema `vir-`. No se infieren otros lemas en `-ir` ni se añaden flexiones al índice de lematización.

| Caso | Singular | Plural |
| --- | --- | --- |
| Nominativo | vir | viri |
| Vocativo | vir | viri |
| Acusativo | virum | viros |
| Genitivo | viri | virorum |
| Dativo | viro | viris |
| Ablativo | viro | viris |

**Referencia principal:** [Gaffiot, `vĭr, vĭrī, m.`](https://www.gaffiot.org/95624), con la variante de genitivo plural `virum` (Lucr. I 95 y otros) expresamente anotada. Para las tablas escolares se mantiene el genitivo plural regular `virorum`; no se mezcla sin advertencia con la variante literaria.

**Contraste de paradigma:** [Nouns — The National Archives](https://www.nationalarchives.gov.uk/latin/stage-1-latin/resources/stage-1-latin-grammar-resource/nouns/) y [paradigmas nominales latinos de Azimonti](https://www.azimonti.com/philology/latin/resources/paradigms-nouns/).

## Concordancia y selección

Se añaden tres combinaciones semánticas permitidas, sin sorteo indiscriminado: `vir bonus`, `vir doctus`, `vir strenuus`. Se respetan los doce casos y números en ambos componentes. No se permite `unus` ni `nullus` como adjetivos de tablas. La admisión curricular depende de la **segunda declinación**: desde UD1 en Latín I y UD2 en Latín 4.º, sin usar nuevas fuentes gramaticales como claves de corrección automáticas.

## Regresiones

- `scripts/test-latin-vir-paradigm-20261122.cjs`: usa Chromium con la web y la copia autónoma, en Latín I/4.º y castellano/valenciano. Comprueba las doce casillas, género, clase, selección semántica, concordancia y ausencia de `unus/nullus`.
- `scripts/test-latin-nominal-integrity.cjs`: actualiza su inventario explícito de **189 a 190** lemas con combinaciones semánticas y de **540 a 543** parejas autorizadas.
- Ambos workflows de CI exigen la nueva prueba, sin permisos de despliegue.
- `data/lemmas/teacher-forms.json`, `data/lemmas/verified-overrides.json`, bancos griegos y puntuaciones se conservan intactos.

**Estado:** rama separada de `main`; solicitar autorización docente antes de fusionar y publicar.
