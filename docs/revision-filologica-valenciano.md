# Auditoría filológica del vocabulario en castellano y valenciano

**Rama:** `feat/integracion-pr29-pr30-valenciano-20261110` · **PR:** #31 · **Estado:** doce decisiones docentes aplicadas; *reduco* sigue pendiente.

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
- `genticilio` → `gentilicio`; **el docente ha elegido conservar «Calo (gentilici)»**.
- `Antifaz` (`antifaç`) movido de `ANTI- (oposición)` a `ANTE-/ANTI- (anterioridad)`: el valor en este caso es espacial, «delante de la cara», no oposicional (Nueva gramática académica, §10.5.2; antecedente histórico de la RAE).

## Decisiones aprobadas por el docente

**12 de 13 decisiones aplicadas** sobre esta PR, sin fusionarla. Se conservan las glosas castellanas originales salvo en `impono`, cuya corrección española y valenciana autorizó expresamente el docente.

| Código | Entrada | Decisión aprobada |
| --- | --- | --- |
| `LAT1-IMPORTO` | importo, importavi, importatum (1ª) | traer → portar |
| `LAT1-IMPONO` | impono, imposui, impositum (3ª) | imponer, colocar encima → imposar, posar damunt |
| `GR1-KALEO` | καλέω | cridar, anomenar |
| `GR1-MALISTA` | μάλιστα (adv.) | moltíssim, especialment |
| `GR1-ATHENAIOS` | Ἀθηναῖος, –α, –ον | atenenc/atenenca |
| `GR1-STRATEGOS` | στρατηγός, –οῦ | estrateg (general) |
| `LAT4-GERMANUS` | Gērmānus, –a, –um | germànic/germànica |
| `LAT1-PAULUS` | Paulus, –i | Paulus |
| `LAT1-CALLUS` | Callus, –i | Calo (gentilici) |
| `LAT1-ORGETORIX` | Orgetorix, –igis | Orgétorix |
| `GR1-HIERAX` | Ἱέραξ, –ακος (ὁ) | Hiérax |
| `PREF-ULTRAPUERTOS` | Ultrapuertos | Eliminar la ficha de ambos bancos |

**Nota de criterio lingüístico:** el usuario ha elegido **valenciano de uso propio** para los ejercicios y glosarios; priorizar formas como `este`, `eixe`, `meua`, `seua`, `tindre`, `vindre` y `xiquet` cuando corresponda. Evitar sustituir esas elecciones por formas de otras variedades. Respetar asimismo las grafías originales latinas y griegas.

Se ha eliminado `Ultrapuertos`/`ultraports` del único banco bilingüe de prefijos: el fichero pasa de 287 a **286** fichas. La progresión de Latín 4.º debe continuar ofreciendo al menos cuatro candidatas por unidad y por idioma.

## Decisiones pendientes

**Permanece pendiente `LAT1-REDUCO`** (*reduco, reduxi, reductum*): se conserva provisionalmente «traer» en castellano y «portar» en valenciano porque el docente no ha seleccionado ninguna de las tres propuestas. No asignar de oficio otra traducción.

La preferencia editorial es por el **valenciano de uso propio**, sin sustituciones por variantes del catalán que el docente no haya escogido.

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

No fusionar con `main` hasta comprobar las pruebas automatizadas y los documentos Word; *reduco* se mantiene expresamente pendiente de decisión.
