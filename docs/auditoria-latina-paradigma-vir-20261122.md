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
- `scripts/test-latin-nominal-integrity.cjs`: actualiza su inventario explícito de **189 a 191** lemas con combinaciones semánticas y de **540 a 546** parejas autorizadas.
- Ambos workflows de CI exigen la nueva prueba, sin permisos de despliegue.
- `data/lemmas/teacher-forms.json`, `data/lemmas/verified-overrides.json`, bancos griegos y puntuaciones se conservan intactos.

**Estado:** rama separada de `main`; solicitar autorización docente antes de fusionar y publicar.


## Segunda incidencia confirmada: `mors, mortis`

El sustantivo femenino de tercera `mors, mortis` (Latín I UD5) se aceptaba en `mNoun`, pero la generación indiferenciada de genitivo plural de los temas consonánticos producía por defecto `mortum`. El índice de lematización persistente registra `mortium` como `N;GEN;PL` (fuente 0), coincidente con la flexión escolar más extendida del tema mixto.

Se fija únicamente la casilla `mors` + genitivo plural en `mortium`, conservando el resto de su matriz:

| Caso | Singular | Plural |
| --- | --- | --- |
| Nominativo | mors | mortes |
| Vocativo | mors | mortes |
| Acusativo | mortem | mortes |
| Genitivo | mortis | **mortium** |
| Dativo | morti | mortibus |
| Ablativo | morte | mortibus |

El cotejo se apoya en [*The Latin Library*, tercera declinación, temas mixtos](https://www.thelatinlibrary.com/101/Declension3.pdf), [Dicolatin, tabla de *mors*](https://www.dicolatin.com/dico/table/0/MORS--TIS--f) y [morfología nominal de la Junta de Andalucía](https://edea.juntadeandalucia.es/bancorecursos/file/03b783f0-3665-4a8e-a52d-ae7e248fdd33/1/es-an_2018062412_9130532.zip/21_morfologa_nominal_la_3_declinacin.html?temp.hb=true&temp.hn=true). La forma `mortum` aparece en algunos repertorios como alternativa; no es preciso negarla para escoger la variante escolar regularizada que la propia fuente del proyecto ya contiene.

La regresión también comprueba las doce formas de `mors` en web y autónoma, con las dos lenguas y los dos cursos. La excepción se aplica **solo a `mors`**: no se amplía por semejanza a otros temas de tercera sin cotejo.

## Tercera incidencia confirmada: `iter, itineris`

El vocabulario de Latín I (UD5) y Latín de 4.º (UD5) incluye `iter, itineris (n.)`. El motor `mNoun` lo **bloqueaba expresamente**, aunque dispone del genitivo completo y el patrón `3n` reproduce correctamente todas las casillas sobre el tema `itiner-`. Se elimina exclusivamente `iter` de esa lista de bloqueos, sin admitir otros temas irregulares de forma automática.

**Fuentes:** [Gaffiot, `iter, itineris n.`](https://www.gaffiot.org/60231) y [Logeion / Lewis & Short](https://logeion.uchicago.edu/iter) documentan el lema y el tema; [manual italiano de Hoepli](https://www.hoeplieditore.it/storage/app/uploads/public/allegati/88/874/9788820388874%20-%20A9788820387525.pdf) expone explícitamente las formas plurales `itinera, itinerum, itineribus`.

| Caso | Singular | Plural |
| --- | --- | --- |
| Nominativo | iter | itinera |
| Vocativo | iter | itinera |
| Acusativo | iter | itinera |
| Genitivo | itineris | itinerum |
| Dativo | itineri | itineribus |
| Ablativo | itinere | itineribus |

Combinaciones semánticas añadidas: `iter longum`, `iter magnum`, `iter durum`. La prueba `test-latin-vir-paradigm-20261122.cjs` abarca ahora **36 casillas nominales** de `vir`, `mors` e `iter`, además de concordancia y controles diferenciales `serpentium / patrum`, en web y PWA, Latín I y 4.º, ES/VA.

Los inventarios de sintagmas quedan en **191 sustantivos / 546 parejas**, con sus tres pruebas actualizadas. No se modifica el índice de lematización, los rasgos fuente 0, ni la acreditación automática de formas.


## Reconciliación de la PWA y CI tras la ampliación

La versión autónoma `offline.html` fue reconstruida de nuevo desde `index.html` mediante el workflow temporal aislado, con commit [`8cbeb12`](https://github.com/ArchaiosMagister/GeneradorExamenes/commit/8cbeb12e33dadcd8e490056b6dc3cbc8aa6db3be). El flujo temporal se eliminó en el mismo commit. La batería de regresión de sintagmas detectó un contador histórico de 189/540 al incorporar `vir`, corregido a 191/546 con `iter`. No se rebaja ningún criterio morfológico: siguen vigentes los vetos a `unus` y `nullus`, los pares aprobados y la concordancia de todas las casillas. La CI debe verificarse en el SHA final de esta PR.

No se propone fusionar ni publicar con controles pendientes.


## Incidencia de integración detectada por CI: protección de monosílabos

Al añadir el contraste de *mors* la prueba de Chromium señaló que `mNoun('mors, mortis (f.)')` todavía devolvía `null`. La causa era una exclusión preventiva para lemas de cuatro letras o menos terminados en `-rs/-ns/-nt`, añadida para no declinar automáticamente temas en `-i` cuyo genitivo plural no se hubiese cotejado.

Se ha introducido **solo** la excepción `mors` en ese filtro: los demás lemas siguen protegidos. La casilla `mortium` es ahora alcanzable desde el generador real y queda contrastada por `scripts/test-latin-vir-paradigm-20261122.cjs` en web/PWA y ES/VA.

La copia autónoma se regeneró sobre esta corrección y el workflow temporal se eliminó en el mismo commit [`7bf4cc3`](https://github.com/ArchaiosMagister/GeneradorExamenes/commit/7bf4cc3237d6b14d96b70e93bfa576463cfc60d1). Las ejecuciones de bot en GitHub Actions pueden marcarse como `action_required`; **no equivalen a `success`**, de modo que el expediente actualizado activa una nueva CI normal sobre el commit definitivo.

El siguiente lote, `mare`/`animal`, está en la **PR #212 dependiente**, no se integra ni despliega mientras #211 no haya superado sus controles.
