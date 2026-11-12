# Revisión priorizada de 50 incidencias del lematizador · 12-XI-2026

## Alcance

Se examinaron las formas **todavía problemáticas** del corpus docente `tests/latin1-revision-forms-20261111.json`, contra el vocabulario real y el índice morfológico. Se contrastaron además las 14 unidades de Griego I de `data/vocabulary/greek1-units-corrected.json`. En el último corpus todas las 1035 grafías distintas reciben una identificación funcional, de modo que esta primera tanda procede de Latín I: **no se han fabricado incidencias griegas para llenar la cuota**.

La ponderación del orden de revisión fue: frecuencia de apariciones 30 %, primer contacto curricular 25 %, número de formas documentadas que se beneficiarían de una revisión del lema 20 %, calidad de la evidencia 15 % y gravedad de la incidencia 10 %. Los puntos sirven **para elegir qué revisar primero**; no prueban que una forma sea filológicamente correcta.

**Resultado:** 50 incidencias examinadas. 12 formas añadidas como contrastadas individualmente, 24 homografías a resolver con contexto, 9 grafías/duplicados/abreviaturas que necesitan revisión contextual y 5 hipótesis flexivas sin fuente individual suficiente. La selección exacta, las puntuaciones, las fuentes y cada decisión se conservan en `docs/lematizador-top-50-incidencias.json`.

## 12 formas acreditadas individualmente

| Forma | Lema | Lectura acreditada | Fuente |
|---|---|---|---|
| arate | aro | `V;IMP;ACT;PRS;2;PL` | [Referencia](https://en.wiktionary.org/wiki/arate) |
| capta | capio | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Referencia](https://en.wiktionary.org/wiki/captus) |
| conati | conor | `V;PTCP;ACT;PRF;NOM;PL;MASC` | [Referencia](https://en.wiktionary.org/wiki/conatus) |
| mirati | miror | `V;PTCP;ACT;PRF;NOM;PL;MASC` | [Referencia](https://en.wiktionary.org/wiki/miratus) |
| profectæ | proficiscor | `V;PTCP;ACT;PRF;NOM;PL;FEM` | [Referencia](https://en.wiktionary.org/wiki/proficiscor) |
| profectos | proficiscor | `V;PTCP;ACT;PRF;ACC;PL;MASC` | [Referencia](https://en.wiktionary.org/wiki/profectus) |
| factus | facio | `V;PTCP;PASS;PRF;NOM;SG;MASC` | [Referencia](https://dcc.dickinson.edu/it/grammar/latin/irregular-verbs-f%C4%AB%C5%8D) |
| ædificata | aedifico | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Referencia](https://en.wiktionary.org/wiki/aedificatus) |
| creatus | creo | `V;PTCP;PASS;PRF;NOM;SG;MASC` | [Referencia](https://en.wiktionary.org/wiki/creatus) |
| cremata | cremo | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Referencia](https://en.wiktionary.org/wiki/crematus) |
| deleta | deleo | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Referencia](https://en.wiktionary.org/wiki/deletus) |
| expugnata | expugno | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Referencia](https://en.wiktionary.org/wiki/expugnata) |

**Precisión:** cada registro acredita **esa superficie con esa interpretación**, no el paradigma entero ni la ausencia de otras interpretaciones morfológicas. Para los participios deponentes se conserva la interpretación *activa*, aunque sus desinencias procedan formalmente de la voz pasiva. En la base docente no se cambian las traducciones ni la grafía original de las oraciones. El índice incluye la forma normalizada, por lo que `ædificata` se reconoce aunque la fuente registre `aedificata`.

Las comprobaciones se escriben en `data/lemmas/verified-overrides.json`, se reconstruyen con `scripts/build-lemma-index.mjs` y se guardan también en `data/lemmas/teacher-forms.json`. Son recuperables tanto online como en el archivo autónomo. El lematizador de exámenes puede usar esas lecturas con la glosa del curso, pero esto **no añade soluciones morfológicas** a los ejercicios ni elimina avisos de homografía.

## Cola completa: 50 incidencias

| Nº | Forma | Primera UD | Apariciones en el corpus | Resultado | Lemas o candidatas |
|---:|---|---:|---:|---|---|
| 1 | bona | 1 | 2 | Elección docente | bonus / bona |
| 2 | bello | 2 | 3 | Elección docente | bellum / bello |
| 3 | Nocte | 2 | 1 | Elección docente | nocte / nox |
| 4 | vere | 6 | 2 | Elección docente | ver / verus |
| 5 | vera | 4 | 1 | Elección docente | ver / verus |
| 6 | Paulo | 7 | 2 | Elección docente | paulo / paulus |
| 7 | pares | 5 | 1 | Elección docente | par / pareo |
| 8 | ortus | 9 | 1 | Elección docente | orior / ortus |
| 9 | pugna | 2 | 1 | Elección docente | pugno / pugna |
| 10 | regno | 6 | 1 | Elección docente | regnum / regno |
| 11 | solis | 7 | 1 | Grafía/contexto | sol / solis |
| 12 | passus | 10 | 1 | Elección docente | passus / patior |
| 13 | longe | 9 | 1 | Elección docente | longe / longus |
| 14 | Nostri | 3 | 3 | Elección docente | ego / noster |
| 15 | filiis | 9 | 1 | Elección docente | filia / filius |
| 16 | canis | 9 | 1 | Elección docente | canis / cano |
| 17 | arate | 3 | 1 | Verificada (una lectura) | aro |
| 18 | commiserunt | 4 | 2 | Grafía/contexto | commito / committo |
| 19 | bonaque | 5 | 1 | Elección docente | bonus / bona |
| 20 | ludo | 10 | 1 | Elección docente | ludus / ludo |
| 21 | capta | 9 | 2 | Verificada (una lectura) | capio |
| 22 | conati | 9 | 1 | Verificada (una lectura) | conor |
| 23 | mirati | 9 | 1 | Verificada (una lectura) | miror |
| 24 | profectæ | 9 | 1 | Verificada (una lectura) | proficiscor |
| 25 | profectos | 9 | 1 | Verificada (una lectura) | proficiscor |
| 26 | templos | 2 | 1 | Grafía/contexto | — |
| 27 | teneros | 2 | 1 | Grafía/contexto | tener |
| 28 | modo | 2 | 1 | Elección docente | modo / modus |
| 29 | Nostrum | 2 | 1 | Elección docente | ego / noster |
| 30 | gratulati | 10 | 1 | Falta fuente | gratulor |
| 31 | dedit | 4 | 1 | Elección docente | dedo / do |
| 32 | factus | 9 | 2 | Verificada (una lectura) | facio |
| 33 | ii | 7 | 1 | Elección docente | is / eo |
| 34 | commiserat | 4 | 1 | Grafía/contexto | commito / committo |
| 35 | propinquiis | 4 | 1 | Grafía/contexto | — |
| 36 | uulnerati | 10 | 1 | Elección docente | vulneratus / uulnero |
| 37 | uulneratum | 10 | 1 | Elección docente | vulneratus / uulnero |
| 38 | habitis | 10 | 1 | Falta fuente | habeo |
| 39 | pugnatum | 9 | 1 | Falta fuente | pugno |
| 40 | ædificata | 8 | 2 | Verificada (una lectura) | aedifico |
| 41 | opertam | 7 | 1 | Falta fuente | operio |
| 42 | commisit | 10 | 1 | Grafía/contexto | commito / committo |
| 43 | postulata | 10 | 1 | Elección docente | postulatum / postulo |
| 44 | Avarus | 9 | 1 | Grafía/contexto | — |
| 45 | T | 9 | 1 | Grafía/contexto | — |
| 46 | creatus | 9 | 1 | Verificada (una lectura) | creo |
| 47 | cremata | 9 | 1 | Verificada (una lectura) | cremo |
| 48 | dato | 9 | 1 | Falta fuente | do |
| 49 | deleta | 9 | 1 | Verificada (una lectura) | deleo |
| 50 | expugnata | 9 | 1 | Verificada (una lectura) | expugno |

## Decisiones que requieren las oraciones originales

- **Homógrafos (24):** no se escogerá entre dos o más lemas sin poder ver la oración íntegra. Ejemplos: `bona` (bonus/bona), `bello` (bellum/bello), `Nocte` (nocte/nox), `Nostri` (ego/noster). En algunos casos el sistema puede ofrecer una lectura como fuente más fiable, pero no debe descartar la alternativa correcta sin pruebas.
- **Grafía y contexto (9):** formas como `templos`, `propinquiis`, `teneros`, `commiserat` y `T`. No se hace ninguna sustitución textual silenciosa.
- **Hipótesis flexivas (5):** una candidata única no es una forma individualmente comprobada; conservar la advertencia hasta disponer de la documentación pertinente.

El usuario puede resolver las elecciones de **cada aparición** desde las tarjetas de revisión del generador. Estas elecciones tienen efectos en el glosario/Word, pero no acreditan nuevas flexiones por sí solas.

## Controles y reproducibilidad

`node scripts/audit-top-50-lemmas.cjs --check` comprueba que siguen siendo 50 registros únicos, que las 12 superficies de fuente explícita se reconocen con el mismo lema y que las 38 pendientes siguen sin resolverse por suposición. Además, `scripts/test-lemma-index.mjs` exige la presencia de las 12 evidencias con sus referencias y las pruebas preexistentes cubren los tres cursos, Word, regeneración individual, PWA y offline. La auditoría original `docs/revision-latin1-183-formas.json` se mantiene inmutable y las pruebas permiten solo mejoras demostradas respecto de esa línea de base.

**No prometer exhaustividad:** el conjunto original se limita a las 612 formas de una revisión docente histórica; un corpus de frases más amplio podría alterar las prioridades.
