# Sintagmas candidatos para GeneradorExamenes · pendiente de aprobación docente

**Estado:** PROPUESTA. Nada de esta lista se incorpora a la generación ni modifica los bancos activos.

## Criterios

- Una ficha debe tener identificador, materia, primera unidad curricular autorizada, lema(s), género, paradigma contrastado, ejercicio(s) admisibles y ejemplo en castellano/valenciano cuando proceda.
- El número, caso, género y concordancia deben proceder de paradigmas verificables, no de concatenaciones automáticas de terminaciones.
- El cuadro de declinación escolar mantiene NOM, VOC, AC, GEN y DAT cuando los sustantivos estén estudiados; los sintagmas preposicionales no se declinan libremente porque la preposición exige un régimen concreto.
- Artículos griegos solo desde **UD3**, preposiciones desde **UD4**, adjetivos desde **UD5**, `αὐτός` de identidad desde **UD7** y sustantivos de tercera desde **UD8**, según la progresión ya empleada en las PR #163–166. La UD1 de Griego I corresponde a la segunda declinación de masculinos; UD2 añade neutros. Las unidades son acumulativas.
- No se asignan automáticamente nuevas unidades latinas: su aprobación exige contrastar el curso y las declinaciones ya estudiadas en cada UD. En particular, ningún sintagma adjetival entrará antes de la introducción de la concordancia.

## A. Latín I — cuadros de declinación

| ID candidato | Sintagma | Rasgo didáctico | Primera unidad propuesta | Condición |
|---|---|---|---|---|
| LI-01 | `puella bona` | Primera declinación y concordancia femenina | UD1 / inicio efectivo del adjetivo | Confirmar UD |
| LI-02 | `servus bonus` | Segunda declinación masculina y concordancia | UD1 / inicio efectivo del adjetivo | Confirmar UD |
| LI-03 | `bellum magnum` | Segunda declinación neutra y concordancia | UD1–2 | Confirmar UD |
| LI-04 | `puer Romanus` | Segunda declinación, base sin -o en nominativo | UD2–3 | Confirmar UD |
| LI-05 | `rex magnus` | Tercera declinación, tema consonántico | Desde UD3 | Contrastar ficha rex y unidad |
| LI-06 | `hostis Romanus` | Tercera declinación, tema en -i | Desde UD3 | Contrastar ficha hostis y unidad |

Los seis son ejemplos filológicamente regulares, pero **su unidad y su presencia en el banco examinable deben ratificarse antes de habilitarlos**. El motor existente de cuadros y los ajustes de espaciado se mantendrán.

## B. Latín de 4.º — cuadros de declinación

| ID candidato | Sintagma | Razón | Activación |
|---|---|---|---|
| L4-01 | `puella Romana` | Primera declinación + adjetivo concordado | En la primera UD que reúna ambos |
| L4-02 | `servus bonus` | Segunda declinación masculina | En la primera UD que reúna ambos |
| L4-03 | `templum magnum` | Neutro de segunda | En la primera UD que reúna ambos |
| L4-04 | `puer bonus` | Masculino en -er y concordancia | Tras introducir los sustantivos en -er |
| L4-05 | `rex bonus` | Tercera declinación y adjetivo | Tras introducir la tercera |
| L4-06 | `nomen Romanum` | Neutro de tercera y concordancia | Tras introducir los neutros de tercera |

**Pendiente de decisión docente:** fijar los números de UD a partir de la programación de 4.º antes de incluirlos. Los candidatos no se evaluarán si el lema no pertenece al banco compatible.

## C. Griego I — progresión de sintagmas

| ID | Desde UD | Sintagma candidato | Usos | Justificación |
|---|---|---|---|---|
| GR-01 | 1 | `λόγος` | Cuadro declinación | 2.ª decl. masc.; sin artículo todavía |
| GR-02 | 1 | `ἄνθρωπος` | Cuadro declinación | 2.ª decl. masc.; sin artículo todavía |
| GR-03 | 2 | `δῶρον` | Cuadro declinación | 2.ª decl. neutra |
| GR-04 | 2 | `ἔργον` | Cuadro declinación | 2.ª decl. neutra |
| GR-05 | 3 | `ὁ λόγος` | Cuadro, cambio de número, retroversión | Artículo desde UD3 |
| GR-06 | 3 | `τὸ δῶρον` | Cuadro, cambio de número, retroversión | Concordancia neutra |
| GR-07 | 3 | `ἡ ἀγορά` | Cuadro, cambio de número, retroversión | Primera declinación y artículo |
| GR-08 | 3 | `ἡ χώρα` | Cuadro, cambio de número, retroversión | Primera declinación, femenino |
| GR-09 | 4 | `ἐν τῇ ἀγορᾷ` | Solo retroversión | `ἐν` + dativo; «en la plaza» |
| GR-10 | 4 | `εἰς τὴν ἀγοράν` | Solo retroversión | `εἰς` + acusativo; «hacia la plaza» |
| GR-11 | 4 | `σὺν τῷ ἀνθρώπῳ` | Solo retroversión | `σύν` + dativo; «con el hombre» |
| GR-12 | 5 | `ὁ ἀγαθὸς ἄνθρωπος` | Cuadro, número, retroversión | Adjetivo atributivo masculino; acento grave ante sustantivo |
| GR-13 | 5 | `ἡ καλὴ χώρα` | Cuadro, número, retroversión | Concordancia femenina; adjetivo de tres terminaciones |
| GR-14 | 5 | `τὸ καλὸν δῶρον` | Cuadro, número, retroversión | Concordancia neutra |
| GR-15 | 7 | `ὁ αὐτὸς ἄνθρωπος` | Cambio de número, cuadro | Valor de identidad; plural `οἱ αὐτοὶ ἄνθρωποι` |
| GR-16 | 7 | `τὰ αὐτὰ δῶρα` | Cambio de número | Pronombre en concordancia neutra plural |
| GR-17 | 8 | `ἡ πόλις` | Cuadro, número | Tercera declinación; **habilitar únicamente si el corpus y la UD acreditan paradigma completo** |

Los sintagmas con adjetivo deberán contrastarse caso por caso con la tabla real de `greekCompleteNominalGroup`: el patrón no presupone que el motor resuelva todos los acentos de manera automática. En particular, mantener las exclusiones vigentes del paradigma incorrecto de `ὀλιγός`. No se activarán nuevos lemas ni sustantivos de tercera por inferencia.

## D. Retroversión / cambio de número (ejemplos de comprobación)

| UD | Castellano | Griego | Nota |
|---|---|---|---|
| 3 | el regalo | `τὸ δῶρον` | Nominativo explícito; dativo no inferido |
| 3 | la plaza | `ἡ ἀγορά` | Nominativo explícito |
| 4 | en la plaza | `ἐν τῇ ἀγορᾷ` | Dativo fijado por régimen |
| 4 | hacia la plaza | `εἰς τὴν ἀγοράν` | Acusativo fijado por régimen |
| 5 | el hombre bueno | `ὁ ἀγαθὸς ἄνθρωπος` | Atributivo; grave ante sustantivo |
| 5 | los regalos hermosos | `τὰ καλὰ δῶρα` | Neutro plural |
| 7 | el mismo hombre | `ὁ αὐτὸς ἄνθρωπος` | Pronombre de identidad |
| 7 | los mismos hombres | `οἱ αὐτοὶ ἄνθρωποι` | Cambio de número, mismo caso |

Las traducciones al valenciano se prepararán **por sintagma y por contexto** (no sustituyendo mecánicamente palabras); se revisarán, por ejemplo, `la mar` y las formas de concordancia femenina. Conservar las cuatro unidades de progresión y las formas de tratamiento escolar existentes.

## Decisiones antes de activar

1. Aprobar o corregir los seis candidatos iniciales de cada curso latino y fijar su unidad mínima.
2. Aprobar los grupos griegos por bloque: **UD1–3**, **UD4**, **UD5**, **UD7**, **UD8**.
3. Confirmar si los cuadros de declinación deben admitir solo sustantivo + adjetivo / artículo o también pronombre de identidad + sustantivo desde UD7.
4. Una vez aprobados, ampliar desde lemas **ya verificados y presentes en el banco**: cada expansión necesita tabla completa, concordancia y pruebas de todas sus casillas. No activar por el mero hecho de compartir terminación.

**No incorporado al motor. Sin publicación.**
