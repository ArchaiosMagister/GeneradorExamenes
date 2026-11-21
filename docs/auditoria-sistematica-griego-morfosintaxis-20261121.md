# Auditoría sistemática de morfología y sintaxis griega — 21/11/2026

**Estado: rama aislada, sin fusionar ni publicar.** Cotejo de 14 unidades del corpus de Griego I (471 renglones, entre formas aisladas y oraciones) y de las 11 oraciones seleccionables del examen. Se corrigen **seis superficies contextualizadas** sin promover formas no acreditadas al índice morfológico.

| Ubicación | Original | Forma docente actual | Justificación |
|---|---|---|---|
| UD10, línea 39 | `τῶν νέων` | `τῶν νεῶν` | El contexto «zarpar del puerto» se interpreta como genitivo plural de *ναῦς*, «las naves», y no de *νέος*, «los jóvenes» |
| UD12, línea 19 | `ἔλειψαν` | `ἔλιπον` | El ático clásico prefiere el aoristo II temático de *λείπω* |
| UD14, línea 16 | `ἠρωτᾶντο` | `ἠρωτῶντο` | Contracción del imperfecto medio-pasivo 3.ª plural de *ἐρωτάω* |
| Oración evaluable 2 | `νεώς πρὸς` | `νεὼς πρὸς` | Grave contextual ante otra palabra |
| Oración evaluable 3 | `ἀδικοί` | `ἄδικοι` | Nominativo plural de *ἄδικος, -ον*, adjetivo de dos terminaciones |
| Oración evaluable 11 | `αὐτοί μέν` | `αὐτοὶ μὲν` | Grave contextual de las dos oxítonas |

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

## Comprobaciones
La regresión `scripts/test-greek-systematic-morph-syntax-20261121.cjs` comprueba seis correcciones, las 14 unidades y 471 renglones, las 11 oraciones evaluables idénticas en web y en la distribución autónoma, las entradas del glosario y la ausencia de promociones al índice de fuente 5. Se incorpora a las dos baterías CI principales.

**Inalterados:** las 172 entradas exigibles, las 2817 filas griegas del índice, los métodos de puntuación, cuotas, criterios de selección y soluciones. El fixture histórico conserva formas anteriores para auditoría; no se equiparan a lecturas acreditadas. No fusionar ni publicar sin consentimiento docente y CI satisfactoria del último commit.

## Siguiente fase
Ampliar la verificación *por forma evaluable* de cada unidad y cotejar construcciones sintácticas del conjunto de oraciones; evitar concluir «corpus completo certificado» por estas seis correcciones. No aplicar transformaciones automáticas de acentos ni equivalencias de lemas fuera de los contextos contrastados.
