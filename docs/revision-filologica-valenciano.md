# Auditoría filológica del vocabulario en castellano y valenciano

**Rama:** `feat/integracion-pr29-pr30-valenciano-20261110` · **PR:** #31 · **Estado:** revisión automática aplicada, elecciones docentes pendientes.

## Criterio editorial

1. Conservación de la forma griega o latina original y de su enunciado docente, salvo errata inequívoca. Las traducciones en castellano se mantienen, salvo correcciones ortográficas seguras y un significado nominal manifiestamente equivocado.
2. Las glosas valencianas se almacenan fuera del banco castellano en `lexicon-valenciano.js`; `meaning_va` introducido por el docente tiene prioridad.
3. Nunca aceptar automáticamente un antropónimo desconocido por el hecho de empezar por mayúscula. Se añadieron correspondencias explícitas de los nombres propios documentados, incluidos Enees, Pèricles, Darios, Xerxes, Anníbal y Sòcrates.
4. En las glosas imprimibles se emplean comillas simples para traducciones de una palabra y dobles para locuciones; una serie de acepciones se puntúa individualmente.
5. El análisis de cobertura automática (2046 registros) confirma que existe una equivalencia valenciana explícita, compuesta o sintagmática para cada ficha inicial, pero **no constituye aprobación filológica de todas las equivalencias**.

## Correcciones seguras aplicadas

- `trær` (tres fichas) → `traer`, `cær` → `caer`, `mæstro` → `maestro`, `aporximadamente` → `aproximadamente`.
- `dux, ducis (m.)` clasificado erróneamente con significado verbal `conducir` → `general`, como las demás fichas del mismo sustantivo.
- `gens, gentis (m.)` → `gens, gentis (f.)`.
- `genticilio` → `gentilicio`; **el carácter de gentilicio o de nombre romano de *Callus* permanece sin decidir**.
- `Antifaz` (`antifaç`) movido de `ANTI- (oposición)` a `ANTE-/ANTI- (anterioridad)`: el valor en este caso es espacial, «delante de la cara», no oposicional (Nueva gramática académica, §10.5.2; antecedente histórico de la RAE).

## Decisiones para el docente

Las siguientes propuestas **no se han aplicado**. El fichero `data/revision-valenciano-pendiente.json` mantiene sus códigos para ejecutarlas de forma inequívoca tras respuesta.

| Código | Lema o expresión | Español actual | Valenciano actual | Motivo |
| --- | --- | --- | --- | --- |
| `LAT1-IMPORTO` | importo, importavi, importatum (1ª) | traer | portar | Importo suele denotar introducir o traer hacia dentro; la glosa genérica puede quedarse corta. |
| `LAT1-REDUCO` | reduco, reduxi, reductum (3ª) | traer | portar | Reduco implica conducción de vuelta o regreso; el enunciado español actual omite re-. |
| `LAT1-IMPONO` | impono, imposui, impositum (3ª) | traer | portar | La glosa original no corresponde al significado ordinario del compuesto impono. |
| `GR1-KALEO` | καλέω | llamar | cridar | Puede significar llamar, convocar o denominar, según el contexto. |
| `GR1-MALISTA` | μάλιστα (adv.) | muy | molt | Grado superlativo de μάλα; 'molt' no expresa claramente el matiz de 'sobre todo' o 'en grado máximo'. |
| `GR1-ATHENAIOS` | Ἀθηναῖος, –α, –ον | ateniense | atenés | La ficha es un adjetivo de tres géneros y el masculino aislado no refleja la flexión. |
| `GR1-STRATEGOS` | στρατηγός, –οῦ | estratego | estrateg | Estrateg es el cargo griego; general es una equivalencia funcional menos técnica. |
| `LAT4-GERMANUS` | Gērmānus, –a, –um | germano/a | germànic/germànica | Puede tratarse como gentilicio histórico o como adjetivo cultural. |
| `LAT1-PAULUS` | Paulus, –i | Paulo | Pau | El nombre romano puede adaptarse o conservarse con forma latinizante. |
| `LAT1-CALLUS` | Callus, –i | Calo (gentilicio) | Calo (gentilici) | La indicación '(gentilicio)' resulta dudosa sin contexto onomástico; puede ser cognomen. |
| `LAT1-ORGETORIX` | Orgetorix, –igis | Orgétorix | Orgétorix | No se ha fijado una adaptación valenciana del antropónimo en las fuentes consultadas. |
| `GR1-HIERAX` | Ἱέραξ, –ακος (ὁ) | Hiérax | Hiérax | Transcripción rara sin suficiente evidencia para normalizar la acentuación. |
| `PREF-ULTRAPUERTOS` | Ultrapuertos | ultrapuertos | ultraports | Término poco habitual y equivalencia valenciana no suficientemente documentada para un examen. |

**No normalizar** formas dudosas por analogía ni cambiar significados castellanos por una decisión meramente ortográfica valenciana. En los tres verbos latinos con `traer` se deberá decidir si actualizar también la glosa castellana original.

## Referencias consultadas

- Enciclopèdia Catalana: [Enees](https://www.enciclopedia.cat/gran-enciclopedia-catalana/leneida), [Anníbal](https://www.enciclopedia.cat/gran-enciclopedia-catalana/annibal), [Pèricles](https://www.enciclopedia.cat/gran-enciclopedia-catalana/pericles), [Darios (en Xerxes I)](https://www.enciclopedia.cat/gran-enciclopedia-catalana/xerxes-i-de-persia), [Protàgores](https://www.enciclopedia.cat/gran-enciclopedia-catalana/protagores).
- [IEC, diccionario de sinónimos: atenès/atenenc](https://sinonims.iec.cat/sinonims_cerca_sin.asp?pclau2=atenes).
- [RAE, Nueva gramática, prefijos de sentido espacial](https://web.seducoahuila.gob.mx/biblioweb/upload/gramatica_raenueva.pdf) y [estudio académico histórico de ante- / anti-](https://webfrl.rae.es/BRAE_DB_PDF/TOMO_VI/XXVIII/Alemany_421_440.pdf).

## Control

- `node scripts/test-valenciano.cjs`
- `node scripts/test-valenciano-browser.cjs`
- `node scripts/test-lat4-lexico.cjs`
- `node scripts/test-vocabulary.cjs`
- `npm run offline:build`

No fusionar con `main` hasta aplicar las decisiones solicitadas y validar de nuevo los documentos Word.
