# Propuestas de sintagmas para aprobación docente · 17/11/2026

**Estado:** exclusivamente propuestas; **ningún sintagma de este documento se ha incorporado al sorteo ni a los bancos**. Conservar IDs, unidades, paradigma, progresión, borradores y exportaciones. Selección de ejemplos construida sobre `required-latin-units.js`, `data/greek1-materials.json` y los paradigmas explícitos de `index.html`; exige validación de cada forma griega y cada caso antes de activarse.

## Criterios de incorporación propuestos

1. Cada tarjeta tendría `id`, `curso`, `primeraUnidadGramatical`, `primeraUnidadLexica`, `uso`, `enunciado`, `genero`, `fuenteParadigma`, `estadoDocente`. Una ficha solo se sortea si está aprobada **y** se han estudiado tanto sus flexiones como su vocabulario, sin introducir una declinación o un tipo de adjetivo anterior a su UD.
2. Las tablas de declinación deben mostrar sintagmas **concordados** y flexionar todos sus miembros, con singular y plural salvo *pluralia tantum*. Los nombres propios no participan. Antes de iniciar un ejercicio con sintagma se requieren los paradigmas completos de nombre y modificador.
3. En griego se conservarán los acentos politónicos, la regla de paso agudo→grave ante palabra siguiente, la identidad de caso al cambiar el número y el género **gramatical griego**, aunque difiera del castellano/valenciano; la retroversión solo acepta una respuesta inequívoca en cuanto a caso (nominativo libre; acusativo/dativo mediante preposición).
4. En la retroversión nunca se añade un equivalente español artificial (*las educaciones justas*, *el mar justo*). Distinguimos la exigibilidad léxica del conocimiento de un paradigma escolar. Guardar una lista de aprobados por docente; las nuevas fichas estarán fuera hasta su aprobación expresa.

## A. Latín I — declinación en cuadros

| ID | Desde | Enunciado propuesto | Qué se comprueba | Fuente curricular |
|---|---|---|---|---|
| LI-01 | UD2 | *bona puella* | 1.ª declinación femenina + adjetivo 2-1-2 | *bonus*, *puella* UD1; sintagma permitido desde UD2 |
| LI-02 | UD2 | *magnus dominus* | 2.ª masculina + concordancia | *magnus*, *dominus* UD1 |
| LI-03 | UD2 | *magnum templum* | Neutro de 2.ª y concordancia nom./ac./voc. | *magnus*, *templum* UD1 |
| LI-04 | UD2 | *longa via* | 1.ª femenina con adjetivo introducido UD2 | *longus*, *via* UD2 |
| LI-05 | UD3 | *alba stella* | Femenino; controla caso, número y género | *albus*, *stella* UD3 |
| LI-06 | UD3 | *pulcher puer* | Radical del adjetivo *pulchr-*; comprobar paradigmáticamente | *pulcher* UD3; *puer* UD1; requiere motor compatible |
| LI-07 | UD4 | *bonus rex* | Nom. *rex*, gen. *regis*; 3.ª sustantiva con adjetivo 2-1-2 | 3.ª enseñada UD4; *rex* consta en banco antes |
| LI-08 | UD4 | *magnus miles* | *miles, militis*: tema consonántico de 3.ª | *miles* UD4 |
| LI-09 | UD5 | *fortis miles* | Adjetivo 3.ª de dos terminaciones con sustantivo 3.ª | *fortis* UD5; **requiere ampliar la flexión de adjetivos, no activar solo con nominal 2-1-2** |

**Nota:** no permitir `rex` por aparecer como voz de vocabulario en UD2: el ejercicio de tercera declinación empieza en UD4. *Pulcher* y *fortis* no deben entrar en el generador actual basado exclusivamente en adjetivos en -us hasta comprobar su flexión completa.

## B. Latín 4.º ESO — declinación en cuadros

| ID | Desde | Enunciado propuesto | Qué se comprueba | Fuente curricular |
|---|---|---|---|---|
| L4-01 | UD3 | *magna puella* | 1.ª femenina; concordancia después de introducir sintagmas | *magnus*, *puella* UD1 |
| L4-02 | UD3 | *bonus amicus* | 2.ª masculina + adjetivo 2-1-2 | *bonus* UD3, *amicus* UD2 |
| L4-03 | UD3 | *magnum bellum* | Neutro de 2.ª; nom./ac./voc. coincidentes | *bellum* UD3, *magnus* UD1 |
| L4-04 | UD3 | *altus murus* | 2.ª masculina; evitar duplicar siempre los mismos adjetivos | *altus* UD1, *murus* UD2 |
| L4-05 | UD5 | *magnus miles* | 3.ª sustantiva *miles, militis*, sin anticipación | *miles* UD5 |
| L4-06 | UD5 | *bonus dux* | *dux, ducis*: cambio de tema | *dux* UD5, *bonus* UD3 |
| L4-07 | UD6 | *fortis miles* | Flexión 3.ª adjetiva; comprobar paradigma propio | *fortis* UD6, *miles* UD5; **requiere nuevo soporte verificado** |

**Nota:** 4.º no añade ejercicios de este tipo en UD1–2: el generador actual activa sintagmas compuestos desde UD3. Las unidades 9 y 10 reutilizan solo lo que ya se haya estudiado y aprobado, sin inventar contenidos nuevos.

## C. Griego I — declinación en cuadros y cambio de número

Para esta webapp, la numeración gramatical **no coincide con la posición 1-basada del array `syllabus`**: `syllabus[0]` describe la unidad introductoria; el motor introduce 2.ª masculina UD1, neutros UD2, artículo/1.ª UD3, preposiciones UD4, adjetivos UD5, pronombres UD7 y 3.ª UD8.

| ID | Desde | Sintagma en nominativo | Aplicación | Justificación |
|---|---|---|---|---|
| GI-01 | UD1, tabla nominal simple | *ἄνθρωπος* | Tabla **sustantivo**; todavía sin artículo | 2.ª masculina; los sintagmas articulados se reservan |
| GI-02 | UD2, tabla nominal simple | *δῶρον* | Tabla **sustantivo**; sin artículo | 2.ª neutra; **atención**: el lema está en vocabulario exigible UDs6–7, aunque su paradigma escolar tiene UD2 |
| GI-03 | UD3 | *ὁ ἄνθρωπος* | Tabla y sing.↔pl. (*οἱ ἄνθρωποι*) | Artículo + 2.ª masculina |
| GI-04 | UD3 | *τὸ δῶρον* | Tabla y sing.↔pl. (*τὰ δῶρα*) | Artículo + 2.ª neutra, respetando la reserva léxica de GI-02 |
| GI-05 | UD3 | *ἡ ἀγορά* | Tabla y sing.↔pl. (*αἱ ἀγοραί*) | 1.ª femenina + artículo |
| GI-06 | UD3 | *ἡ θάλαττα* | Tabla y sing.↔pl. (*αἱ θάλατται*) | 1.ª femenina -α/-ης, comprobar acentos y tema |
| GI-07 | UD5 | *ὁ ἀγαθὸς ἄνθρωπος* | Tabla + cambio de número (*οἱ ἀγαθοὶ ἄνθρωποι*) | Adjetivo tres terminaciones; grave contextual |
| GI-08 | UD5 | *τὸ καλὸν δῶρον* | Tabla + número (*τὰ καλὰ δῶρα*) | Concordancia neutra completa; nota de exigibilidad del lema |
| GI-09 | UD5 | *ἡ καλὴ θάλαττα* | Tabla + número (*αἱ καλαὶ θάλατται*) | Femenino del adjetivo y sustantivo femenino |
| GI-10 | UD7 | *ὁ αὐτὸς ἄνθρωπος* | Cambio de número (*οἱ αὐτοὶ ἄνθρωποι*) | Identidad con *αὐτός*, no construcción de orden no atributivo |
| GI-11 | UD8 | *ὁ ἀνήρ* | Tabla de 3.ª, cambio número | Tercera declinación; **pendiente de cotejo completo de paradigma** |
| GI-12 | UD8 | *τὸ σῶμα* | Tabla de 3.ª, cambio número | Tema en -ματ-, neutro; **pendiente de cotejo completo de paradigma** |
| GI-13 | UD8 | *ἡ νύξ* | Tabla de 3.ª, cambio número | Cambio *νυκτ-* y acentos; **pendiente de cotejo completo de paradigma** |

Desde UD8 los tres últimos son candidaturas **NO GENERABLES** hasta incorporar o verificar individualmente sus seis o diez casillas pertinentes. No inferir su tercera declinación a partir de desinencias generales sin prueba.

## D. Griego I — retroversión y cambio de número a partir de sintagmas

| ID | Desde | Castellano | Valenciano | Respuesta griega propuesta | Uso/progresión |
|---|---|---|---|---|---|
| GR-01 | UD3 | el hombre | l’home | *ὁ ἄνθρωπος* | Nom. singular 2.ª + artículo |
| GR-02 | UD3 | los hombres | els homes | *οἱ ἄνθρωποι* | Nom. plural; permite cambio a singular |
| GR-03 | UD3 | la plaza | la plaça | *ἡ ἀγορά* | Nom. 1.ª femenina |
| GR-04 | UD3 | el regalo | el regal | *τὸ δῶρον* | Nom. 2.ª neutra; **pendiente de decidir su habilitación léxica antes de UDs6–7** |
| GR-05 | UD4 | en la plaza | en la plaça | *ἐν τῇ ἀγορᾷ* | ἐν + dativo; la preposición fija el caso |
| GR-06 | UD4 | hacia el mar | cap a la mar | *εἰς τὴν θάλατταν* | εἰς + acusativo; progresión de preposiciones |
| GR-07 | UD4 | con el hermano | amb el germà | *σὺν τῷ ἀδελφῷ* | σὺν + dativo; compañía de persona |
| GR-08 | UD5 | el hombre bueno | l’home bo | *ὁ ἀγαθὸς ἄνθρωπος* | Adjetivo: tres palabras concordadas; grave |
| GR-09 | UD5 | el regalo bonito | el regal bonic | *τὸ καλὸν δῶρον* | Adjetivo neutro; pendiente política léxica GI-02 |
| GR-10 | UD5 | la plaza bonita | la plaça bonica | *ἡ καλὴ ἀγορά* | Adjetivo femenino con artículo |
| GR-11 | UD5 | la palabra buena | la paraula bona | *ὁ ἀγαθὸς λόγος* | Género griego **masculino** frente al español **femenino** |
| GR-12 | UD7 | el mismo hombre | el mateix home | *ὁ αὐτὸς ἄνθρωπος* | Identidad; requiere conocimiento de *αὐτός* |
| GR-13 | UD8 | la noche | la nit | *ἡ νύξ* | 3.ª pendiente de contraste (propuesta, NO activa) |

**Criterio de corrección:** algunas traducciones simples del español ofrecen sin contexto nominativo/ acusativo en sentido general. Los prompts libres de esta lista se formulan expresamente como **nominativos** o como sintagmas de sujeto; las preposiciones gobiernan el resto. En las tablas y cambios de número, conservar el caso de partida. Si la etiqueta “la palabra buena” se considera una trampa excesiva, optar por excluirla del ejercicio de retroversión sin eliminar el nominativo griego de la tabla.

## Decisiones docentes solicitadas

- **S1** Aprobar individualmente los ejemplos L1-01…09 y L4-01…07 para *proseguir a la verificación técnica*, manteniendo LI-06, LI-09 y L4-07 apartados hasta verificar adjetivos no regulares con el motor actual.
- **S2** Aprobar individualmente GI-01…13 (tablas y cambio de número), GR-01…13 (retroversión). Confirmar que los ejercicios de cambio de número comienzan con artículo desde UD3 y adjetivo desde UD5.
- **S3 (léxico griego)** Decidir para *δῶρον*: habilitar al aprender su declinación en UD2 o reservarlo a UDs6–7, cuando consta en exigible. Recomendación conservadora: **reservarlo a UDs6–7** en retroversión; el conocimiento morfológico temprano no obliga a exigir el lexema.
- **S4 (género entre lenguas)** Decidir si mantener retroversiones de sustantivos con género diferente del castellano (*ὁ λόγος* por “la palabra”), siempre con comprobación explícita en el glosario.
- **S5 (3.ª griega)** Aprobar el estudio de *ἀνήρ*, *σῶμα*, *νύξ* solo como candidaturas pendientes hasta cotejar el paradigma íntegro (acentuación incluida), sin añadir automáticamente flexiones.

**Ninguna de estas decisiones ha sido aplicada al banco del generador.**
