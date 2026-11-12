# Segundo lote de revisión morfológica: 100 fichas reales

**Fecha:** 12 de noviembre de 2026. **Repositorio:** GeneradorExamenes. **Estado:** revisión de fuentes y pruebas automatizadas.

## Criterio y alcance

Se consultaron de nuevo los 612 ejemplos inicialmente problemáticos del banco docente de Latín I y las 14 unidades de Griego I. Las 50 fichas del lote anterior quedan expresamente excluidas por su forma normalizada. El corpus persistente de Griego I no mantiene incidencias funcionales, por lo que este lote corresponde a Latín I. Se tomó primero cada incidencia aún no reconocida, y se completó hasta cien con formas ya reconocidas cuya documentación individual podía mejorar.

Orden de prioridad: frecuencia 30 %, progresión de unidades 25 %, rendimiento morfológico 20 %, calidad de las fuentes 15 % e impacto de la incidencia 10 %. **La puntuación solo establece un orden editorial; no confiere validez filológica.**

## Balance de las cien fichas

| Resultado | Total |
|---|---:|
| Acreditadas individualmente en esta tanda | 21 |
| Reconocidas anteriormente sin verificación individual nueva | 59 |
| Hipótesis de flexión aún sin contraste | 11 |
| Casos de grafía o contexto a revisar | 7 |
| Homografías que requieren elección contextual | 2 |
| **Total** | **100** |

## Acreditaciones nuevas

Cada fila acredita **una superficie y uno de sus análisis posibles**, no el paradigma ni la exclusividad de ese análisis. Se conserva la traducción docente y no se cambian los textos de los exámenes.

| Forma | Lema | Rasgos contrastados | Fuente consultada |
|---|---|---|---|
| creati | creo | `V;PTCP;PASS;PRF;NOM;PL;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/creatus) |
| deletam | deleo | `V;PTCP;PASS;PRF;ACC;SG;FEM` | [Ficha morfológica](https://en.wiktionary.org/wiki/deletus) |
| deletum | deleo | `V;PTCP;PASS;PRF;ACC;SG;NEUT` | [Ficha morfológica](https://en.wiktionary.org/wiki/deletus) |
| laudati | laudo | `V;PTCP;PASS;PRF;NOM;PL;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/laudatus) |
| narratæ | narro | `V;PTCP;PASS;PRF;NOM;PL;FEM` | [Ficha morfológica](https://en.wiktionary.org/wiki/narratus) |
| occisus | occido | `V;PTCP;PASS;PRF;NOM;SG;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/occisus) |
| punitus | punio | `V;PTCP;PASS;PRF;NOM;SG;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/punitus) |
| sepultus | sepelio | `V;PTCP;PASS;PRF;NOM;SG;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/sepultus) |
| vastata | vasto | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Ficha morfológica](https://en.wiktionary.org/wiki/vastatus) |
| victi | vinco | `V;PTCP;PASS;PRF;NOM;PL;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/victus) |
| vocatus | voco | `V;PTCP;PASS;PRF;NOM;SG;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/vocatus) |
| Acceptis | accipio | `V;PTCP;PASS;PRF;ABL;PL` | [Ficha morfológica](https://en.wiktionary.org/wiki/acceptus) |
| deliberata | delibero | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Ficha morfológica](https://en.wiktionary.org/wiki/deliberatus) |
| Fœderatæ | foedero | `V;PTCP;PASS;PRF;NOM;PL;FEM` | [Ficha morfológica](https://en.wiktionary.org/wiki/foederatus) |
| missos | mitto | `V;PTCP;PASS;PRF;ACC;PL;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/missus) |
| Occiso | occido | `V;PTCP;PASS;PRF;ABL;SG;MASC` | [Ficha morfológica](https://en.wiktionary.org/wiki/occisus) |
| oppugnata | oppugno | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Ficha morfológica](https://en.wiktionary.org/wiki/oppugnatus) |
| relictis | relinquo | `V;PTCP;PASS;PRF;ABL;PL` | [Ficha morfológica](https://en.wiktionary.org/wiki/relictus) |
| uictis | vinco | `V;PTCP;PASS;PRF;ABL;PL` | [Ficha morfológica](https://en.wiktionary.org/wiki/victus) |
| victa | vinco | `V;PTCP;PASS;PRF;NOM;SG;FEM` | [Ficha morfológica](https://en.wiktionary.org/wiki/victus) |
| servæ | serva | `N;GEN;SG` | [Ficha morfológica](https://en.wiktionary.org/wiki/servae) |

La evidencia se conserva en la fuente persistente `data/lemmas/verified-overrides.json`, se incorpora en cada reconstrucción mediante `scripts/build-lemma-index.mjs` y figura en `data/lemmas/teacher-forms.json`. El código 5 se reserva a esta evidencia individual. Ni las correcciones en Word ni las propuestas generadas por paradigmas regulares pueden usarlo por sí solas.

## Fichas pendientes o reconocidas previamente

### Lecturas pendientes de evidencia, grafía o contexto

| N.º | Forma | UD | Estado | Propuesta / advertencia |
|---:|---|---:|---|---|
| 1 | rapta | 10 | unverified-proposal | rapio |
| 6 | missus | 9 | unverified-proposal | mitto |
| 10 | scripta | 9 | unverified-proposal | scribo |
| 15 | C | 10 | teacher-orthography-needed | Revisión de grafía o abreviatura: inicial o abreviatura, no lema autónomo; consultar la oración |
| 16 | clasis | 10 | teacher-orthography-needed | Revisión de grafía o abreviatura: comprobar classis, –is (f.), si se refiere a «flota» o «clase» |
| 17 | consilo | 10 | teacher-orthography-needed | Revisión de grafía o abreviatura: comprobar consilio (de consilium, –i), según el contexto |
| 18 | M | 10 | teacher-orthography-needed | Revisión de grafía o abreviatura: inicial, cifra o abreviatura, no lema autónomo; consultar la oración |
| 19 | medicum | 10 | teacher-orthography-needed | Necesita contexto: puede ser medicus, –i (m., «médico») o medicus, –a, –um (adjetivo); consultar la oración |
| 20 | nonulli | 10 | teacher-orthography-needed | Revisión de grafía o abreviatura: comprobar nonnulli (de nonnullus, –a, –um) |
| 21 | pasuum | 10 | teacher-orthography-needed | Revisión de grafía o abreviatura: comprobar passuum (genitivo plural de passus, –us) |
| 22 | milia | 10 | teacher-context-needed | milia / mille |
| 23 | parentibus | 10 | teacher-context-needed | pareo / parens |
| 25 | amissa | 10 | unverified-proposal | amitto |
| 26 | condita | 10 | unverified-proposal | condo |
| 28 | Egressi | 10 | unverified-proposal | egredior |
| 29 | expulsos | 10 | unverified-proposal | expello |
| 32 | necaturos | 10 | unverified-proposal | neco |
| 35 | pronuntiata | 10 | unverified-proposal | pronuntio |
| 36 | regressi | 10 | unverified-proposal | regredior |
| 38 | transgressi | 10 | unverified-proposal | transgredior |

En particular, **milia** (mille / milia) y **parentibus** (parens / pareo) siguen con lecturas alternativas. Las abreviaturas **C** y **M**, las grafías **clasis**, **consilo**, **nonulli** y **pasuum**, así como **medicum**, exigen contexto. No se corrige automáticamente el original. Las propuestas participiales todavía pendientes tampoco se convierten en verificadas mediante deducción del supino.

### Reconocimientos previos no convertidos en nuevas acreditaciones

admirabantur (UD3) · Nullo (UD10) · horas (UD9) · Peditatus (UD9) · piratis (UD10) · stylum (UD1) · Græcia (UD10) · visimus (UD2) · morante (UD10) · sapientissimus (UD9) · ausus (UD9) · Campo (UD5) · certant (UD5) · collocaverat (UD5) · indicavit (UD5) · servavit (UD5) · curaque (UD10) · aperuerunt (UD6) · Atuatucos (UD6) · dedicaverunt (UD6) · fugerant (UD6) · gemit (UD6) · reverterunt (UD6) · teste (UD6) · turtur (UD6) · vivunt (UD6) · egregias (UD8) · Neapolis (UD8) · postrema (UD8) · volebat (UD8) · Belgæ (UD9) · confisus (UD9) · ferarum (UD9) · multitudine (UD9) · pretiosius (UD9) · Solitus (UD9) · aberat (UD10) · aderant (UD10) · affirmauerunt (UD10) · Allobroges (UD10) · amore (UD10) · Boudicca (UD10) · Britanni (UD10) · Cannas (UD10) · Comitiis (UD10) · comparatis (UD10) · condiciones (UD10) · constantia (UD10) · consulatum (UD10) · decrevit (UD10) · didici (UD10) · Duos (UD10) · elephantos (UD10) · grammaticam (UD10) · hasta (UD10) · hortatus (UD10) · incolumem (UD10) · intrauit (UD10) · latrauerunt (UD10).

En estas fichas el motor ya ofrece un lema, pero ello **no implica revisión individual adicional**. Las formas nominales o conjugadas de fuentes ya incluidas mantienen su procedencia, sin falsear su estado.

## Comprobaciones de integridad

- `node scripts/audit-top-50-lemmas.cjs --check`: conserva las 50 decisiones previas.
- `node scripts/audit-next-100-lemmas.cjs --check`: conserva estas 100 fichas en orden fijo, exige cada evidencia y verifica que no se borran avisos pendientes.
- `node scripts/test-lemma-index.mjs`: verifica los contadores y todas las referencias individuales nuevas.
- `node scripts/audit-latin1-rest-183.cjs`: compara con la línea histórica de base sin reescribirla.
- Las pruebas completas de GitHub Actions incluyen Word, corrección de ediciones, las tres asignaturas, PWA y funcionamiento desconectado.

**Limitación:** el corpus latino de referencia consiste en formas de ejercicios previamente exportados; la oración original de cada incidencia no siempre está preservada. No debe asignarse un lema por contexto sin recuperar esa oración.
