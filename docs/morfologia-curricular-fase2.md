# Fase II — auditoría curricular y morfología comprobable

## Alcance de esta etapa

La incorporación de un lema al banco no implica que cualquier flexión del lema pueda examinarse.
Las nuevas funciones del generador hacen explícitos los hitos curriculares por **unidad**,
separados de la procedencia y de las verificaciones filológicas de los bancos.

### Latín I

| Contenido | Disponible desde |
| --- | --- |
| Sustantivos de primera y segunda declinación; presente activo documentado | UD1 |
| Adjetivos regulares de primera y segunda clase (tipo -us, -a, -um) | UD2 |
| Pronombres personales; voz pasiva e imperativo en el programa | UD3 |
| Sustantivos de tercera declinación contrastados; perfecto y pluscuamperfecto en el programa | UD4 |
| Adjetivos regulares de tercera declinación, tipo *brevis, -e* | UD5 |
| Pronombres demostrativos y relativos | UD6 |
| Cuarta y quinta declinación, deponentes y futuro en el programa | UD7 |
| Pasiva del *perfectum* | UD9 |
| Participios | UD10 |

**La matriz de enseñanza no sustituye a la verificación morfológica individual.**
En los exámenes se sortean seis personas de los paradigmas que el motor puede
respaldar con las partes principales conocidas y una conjugación compatible.
En **Latín I** se admite presente activo (UD1), imperfecto activo (UD2),
presente e imperfecto pasivos (UD3), perfecto y pluscuamperfecto activos (UD4),
futuro activo/pasivo (UD7) y perfecto pasivo (UD9; ejemplo expresamente
**masculino** con participio de perfecto y `sum`).

Se ha incluido `sum` como irregular mediante **tablas explícitas** y `capio`
como ejemplo de tercera mixta mediante nueve series completas, sin aplicar
la regla regular a otros mixtos. En el perfecto pasivo la concordancia
femenina y neutra no se presupone: la construcción propuesta se identifica
como masculino. Las formas de deponentes, semideponentes, verbos defectivos,
pasivas irregulares y cualquier lema cuyas partes principales no permitan
un paradigma respaldado **siguen excluidas**; no se rellenan por analogía.

Estas ampliaciones llegan tanto a las tablas de conjugación del examen
completo como a la identificación de persona, número, tiempo y voz del modelo
de morfología y a las palabras variables del análisis. Los encabezados
muestran el tiempo y la voz realmente seleccionados. En **Latín de 4.º**
se preserva la selección anterior de presente, ya que su secuenciación
docente no está suficientemente acreditada para añadir otros tiempos.

**Adjetivos -is, -e:** Se propone, previa aceptación docente explícita, la flexión regular de dos terminaciones
con genitivo plural -ium, ablativo singular -i y nominativo, vocativo y
acusativo neutro plural -ia. Los tipos -er/-ris/-e, los de una terminación,
comparativos e irregularidades quedan fuera de esta nueva regla.
La concordancia del adjetivo se realiza en género, número y caso,
con el sustantivo en primer lugar en los sintagmas latinos.

**Revisión docente:** Todas las formas de nuevos adjetivos de tercera declinación
quedan inicialmente excluidas. En el menú «Adjetivos de tercera declinación»
pueden marcarse como aceptadas (pendientes de verificación individual),
excluidas o pendientes. El estado se conserva en el almacenamiento local
para próximos exámenes, puede exportarse como JSON y nunca modifica el
estado filológico original de los bancos. Cambiar una decisión no
regenera ni borra el examen abierto; afecta a los sorteos posteriores.


**Sustantivos de paradigmas particulares:** Se han incorporado únicamente
las tablas completas de `civis`, `hostis`, `urbs`, `pars`, `mare`,
`animal`, `manus`, `exercitus`, `cornu` y `res`, siempre con
su enunciado compatible y con el umbral de enseñanza pertinente. El resto
de temas en *-i*, casos de cuarta/quinta y nominativos irregulares
continúan fuera del generador automático, sin asumir terminaciones.

### Griego I

| Contenido | Disponible desde |
| --- | --- |
| Segunda declinación | UD1 |
| Neutros de segunda; presente | UD2 |
| Primera declinación; artículo | UD3 |
| Adjetivos | UD5 |
| Voz media y pasiva | UD6 |
| Pronombres | UD7 |
| Tercera declinación | UD8 |
| Participios | UD10 |
| Futuro e imperfecto | UD11 |
| Aoristo | UD12 |
| Perfecto | UD13 |

Se conserva el corpus de formas documentadas y su filtro por unidad.
Las etiquetas de análisis, cuando señalen explícitamente un tiempo o
una forma posterior, no permiten anticiparla al sorteo.

**Ampliaciones explícitas:** seis formas personales de `εἰμί` desde UD1;
presente medio/pasivo de `λύω` desde UD6; imperfecto y futuro activos
de `λύω` desde UD11; aoristo sigmático `ἔλυσα` y aoristo temático
`ἔλιπον` desde UD12; perfecto `λέλυκα` desde UD13. Cada una
está transcrita por completo, no inferida a partir del presente de otros
verbos. Se añaden los paradigmas completos de `πόλις` y `σῶμα`
desde UD8 **si el lema está presente en el banco real**.

No se han añadido aoristos temáticos, perfectos ni futuros de cualquier
otro verbo por semejanza: el griego exige temas principales distintos,
con acentuación y alternancias que requieren comprobación.

### Latín 4.º ESO

Se preserva el comportamiento anterior en los apartados que todavía
no tienen una secuenciación docente detallada contrastada.
La incorporación de nuevos adjetivos de tercera declinación queda
reservada a una auditoría posterior para evitar adelantos curriculares.

## Cantidades

Por defecto se proponen **cuatro formas** en el análisis morfológico de
cualquier modelo de examen. El profesor puede cambiar esa cantidad.
La modificación no introduce ninguna forma no documentada para rellenar
cupos.

## Pruebas y edición

Los scripts `scripts/test-phase-two.cjs` y `scripts/test-phase-two-coverage.cjs`
comprueban también todas las unidades y modelos de examen,
las formas concretas de las cuatro conjugaciones escolares,
los paradigmas particulares grecolatinos, los pronombres
progresivos y la ausencia de tiempos anticipados.

El primero comprueba la matriz por unidades,
el paradigma *brevis*, la aceptación docente persistente y reversible,
los filtros griegos de tiempos verbales y los valores
predeterminados en `index.html` y `offline.html`.
Las pruebas existentes de Word, selección aleatoria, léxico y PWA
son obligatorias antes de fusionar esta etapa.

## Contraste externo del paradigma

- The National Archives, [Latin: Lesson 7, Third declension nouns and adjectives](https://www.nationalarchives.gov.uk/latin/stage-1-latin/lessons/lesson-7-third-declension-nouns-and-adjectives/).
- The National Archives, [Latin adjectives](https://www.nationalarchives.gov.uk/latin/stage-1-latin/resources/stage-1-latin-grammar-resource/adjectives/).
- Dickinson College Commentaries, [Latin Stems](https://dcc.dickinson.edu/grammar/latin/stems) (sistemas de presente, perfecto y supino).
- Herbert Weir Smyth, [Greek Grammar: Tense-stems and principal parts](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.9.html).
- Herbert Weir Smyth, [Greek Grammar: Present and Imperfect Active and Middle](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.10.html).

Las normas curriculares por unidad siguen siendo los materiales del profesor,
no las fuentes externas.
