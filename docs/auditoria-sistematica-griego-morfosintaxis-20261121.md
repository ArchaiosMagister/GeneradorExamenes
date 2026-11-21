# Auditoría sistemática de morfología y sintaxis griega — 21/11/2026

**Estado: rama aislada, sin fusionar ni publicar.** Cotejo de 14 unidades del corpus de Griego I (471 renglones, entre formas aisladas y oraciones) y de las 11 oraciones seleccionables del examen. Se corrigen **seis superficies contextualizadas y tres análisis docentes** sin promover formas no acreditadas al índice morfológico.

| Ubicación | Original | Forma docente actual | Justificación |
|---|---|---|---|
| UD10, línea 39 | `τῶν νέων` | `τῶν νεῶν` | El contexto «zarpar del puerto» se interpreta como genitivo plural de *ναῦς*, «las naves», y no de *νέος*, «los jóvenes» |
| UD12, línea 19 | `ἔλειψαν` | `ἔλιπον` | El ático clásico prefiere el aoristo II temático de *λείπω* |
| UD14, línea 16 | `ἠρωτᾶντο` | `ἠρωτῶντο` | Contracción del imperfecto medio-pasivo 3.ª plural de *ἐρωτάω* |
| Oración evaluable 2 | `νεώς πρὸς` | `νεὼς πρὸς` | Grave contextual ante otra palabra |
| Oración evaluable 3 | `ἀδικοί` | `ἄδικοι` | Nominativo plural de *ἄδικος, -ον*, adjetivo de dos terminaciones |
| Oración evaluable 11 | `αὐτοί μέν` | `αὐτοὶ μὲν` | Grave contextual de las dos oxítonas |
| Análisis evaluable 2 | `ἀπὸ τῆς νεώς: procedencia` | `ἀπὸ τῆς νεὼς: procedencia` | Concordancia con el enunciado (Smyth §154) |
| Análisis evaluable 5 | `οἱ σοφοὶ: sujeto (sustantivo en el vocabulario aportado)` | `οἱ σοφοὶ: sujeto (adjetivo sustantivado)` | Artículo sustantivador (Smyth §1153) |
| Análisis evaluable 11 | `αὐτοί y ἡμεῖς: sujetos` | `αὐτοὶ y ἡμεῖς: sujetos` | Concordancia con el enunciado (Smyth §154) |

El aoristo sigmático `ἔλειψαν` **no es universalmente imposible**: es una variante histórica especialmente frecuente con posterioridad al período clásico. Continúa reconocible en el glosario auxiliar, después del aoristo preferente `ἔλιπον`. La lectura `τῶν νεῶν` es una **decisión interpretativa explícita**: si el material docente pretendía referirse a los jóvenes que partían del puerto, debe revisarse, no propagar automáticamente la sustitución por otras apariciones de `νέων`.

## Fuentes utilizadas
- [LSJ, *ναῦς*](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n69863/): genitivo plural `νεῶν`.
- [LSJ, *λείπω*](https://logeion.org/%CE%BB%CE%B5%CE%AF%CF%80%CF%89) y [Atticism/PURA, oposición de aoristos](https://atticism.eu/corpus/item/view?id=535d329c-9c02-48d2-8bda-18dcd318e65e).
- [Paradigma de *ἐρωτάω*](https://en.wiktionary.org/wiki/%E1%BC%90%CF%81%CF%89%CF%84%CE%AC%CF%89), imperfecto contracto `ἠρωτῶντο`.
- [*Ancient Greek for Everyone*, adjetivos de dos terminaciones](https://pressbooks.pub/ancientgreek/chapter/30/): `ἄδικοι`.
- [Smyth, *Greek Grammar*, §154](https://ccel.org/s/smyth/grammar/html/smyth_1f_uni.htm): grave en contexto.

## Desambiguación contextual: νέων frente a νεῶν

La revisión ha descubierto **una ambigüedad real del lematizador** al ampliar la entrada de **ναῦς**. El sistema normaliza la acentuación para recuperar candidatos y, por ello, ofrece dos posibles lemas para `νέων` en la UD11:

- `πονηροὶ ἄνθρωποι τὰς τῶν νέων ψυχὰς διέφθειρον.`: **νέων**, genitivo plural de *νέος*, «de los jóvenes», por contexto de las almas;
- `ἀποπλευσάντων τῶν νεῶν ἐκ τοῦ λιμένος`: **νεῶν**, genitivo plural de *ναῦς*, «de las naves», por contexto náutico.

Esta es una **desambiguación editorial puntual**, registrada con contexto, unidad, número de apariciones y ambos candidatos en el expediente JSON. El analizador conserva la ambigüedad fuera del contexto; **no** se cambia el índice ni se habilita un resultado automático. `scripts/audit-greek-all-units.cjs --require-clean` solo excluye del listado de pendientes esa ocurrencia contextual explícitamente cotejada, como los otros testimonios del informe, y obliga a volver a revisarla si cambia el texto, los candidatos o la frecuencia.

## Cotejo individual de siete testimonios evaluables

El expediente registra **siete lecturas contextualizadas, sin promoción morfológica**: `Ἀθήναις` (dativo plural de *Ἀθῆναι*), `μετέχουσι τῆς ἀρχῆς` (régimen genitivo; Smyth §1343), `νεὼς` (genitivo singular de *ναῦς*), `ἄδικοι` (adjetivo de dos terminaciones en función de atributo), `οἱ σοφοὶ` (adjetivo sustantivado; Smyth §1153), `φίλον ἡμῖν` (dativo adjetival; Smyth §1499) y `αὐτοὶ μὲν` (grave contextual; Smyth §154). Los enlaces bibliográficos se individualizan en `gradedAttestations`.

Estos siete cotejos no certifican las restantes flexiones de sus lemas ni toda la gramática de las once oraciones. Las formas con acento adicional ante enclítico (Smyth §183c) no deben someterse a sustituciones generalizadas.

## Comprobaciones
La regresión `scripts/test-greek-systematic-morph-syntax-20261121.cjs` comprueba nueve correcciones, siete lecturas morfosintácticas contextuales, las 14 unidades y 471 renglones, las 11 oraciones evaluables idénticas en web y en la distribución autónoma, las entradas del glosario y la ausencia de promociones al índice de fuente 5. Se incorpora a las dos baterías CI principales.

**Inalterados:** las 172 entradas exigibles, las 2817 filas griegas del índice, los métodos de puntuación, cuotas, criterios de selección y soluciones. El fixture histórico conserva formas anteriores para auditoría; no se equiparan a lecturas acreditadas. No fusionar ni publicar sin consentimiento docente y CI satisfactoria del último commit.

## Reconstrucción controlada de la distribución offline

El workflow temporal de rama [#44947657465](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/44947657465) reconstruyó `offline.html` desde las fuentes, ejecutó la regresión de once oraciones y retiró su propio YAML al confirmar el resultado. El commit de reconstrucción `7cf51926` no promociona datos, ni fusiona ni publica. Se exige además la ejecución de la CI completa en el último commit de la PR.

## Siguiente fase
Ampliar la verificación *por forma evaluable* de cada unidad y cotejar construcciones sintácticas del conjunto de oraciones; evitar concluir «corpus completo certificado» por estas seis correcciones. No aplicar transformaciones automáticas de acentos ni equivalencias de lemas fuera de los contextos contrastados.

## Nota de rectificación posterior (21/11/2026)

La sustitución anterior `τῶν νέων` → `τῶν νεῶν`, justificada por el contexto náutico, dejó sin revisar el género del participio `ἀποπλευσάντων`. La auditoría siguiente corrigió exclusivamente su concordancia a **`ἀποπλευσασῶν τῶν νεῶν`** (femenino genitivo plural); véase `docs/auditoria-concordancia-genitivo-absoluto-griego1-20261121.md`. El pasaje antiguo de este informe se conserva como antecedente histórico de la decisión editorial, no como enunciado actualmente vigente.
