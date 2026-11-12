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
El motor solo genera actualmente tablas para los paradigmas que ya conoce.
Por ejemplo, la introducción del futuro en UD7 no autoriza construir automáticamente
todos los futuros de los lemas del banco. Esos tiempos y voces permanecen pendientes
de ampliar con paradigmas contrastados, sin completar huecos inventando formas.

**Adjetivos -is, -e:** Se admite la flexión regular de dos terminaciones
con genitivo plural -ium, ablativo singular -i y nominativo, vocativo y
acusativo neutro plural -ia. Los tipos -er/-ris/-e, los de una terminación,
comparativos e irregularidades quedan fuera de esta nueva regla.
La concordancia del adjetivo se realiza en género, número y caso,
con el sustantivo en primer lugar en los sintagmas latinos.

**Sustantivos excepcionales:** El motor conserva sus restricciones
sobre temas en -i, nominativos ambiguos y cuarta y quinta declinación
que no cuenten con paradigmas suficientes para una tabla segura.

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

El script `scripts/test-phase-two.cjs` comprueba la matriz por unidades,
el paradigma *brevis*, los filtros griegos de tiempos verbales y los valores
predeterminados en `index.html` y `offline.html`.
Las pruebas existentes de Word, selección aleatoria, léxico y PWA
son obligatorias antes de fusionar esta etapa.

## Contraste externo del paradigma

- The National Archives, [Latin: Lesson 7, Third declension nouns and adjectives](https://www.nationalarchives.gov.uk/latin/stage-1-latin/lessons/lesson-7-third-declension-nouns-and-adjectives/).
- The National Archives, [Latin adjectives](https://www.nationalarchives.gov.uk/latin/stage-1-latin/resources/stage-1-latin-grammar-resource/adjectives/).

Las normas curriculares por unidad siguen siendo los materiales del profesor,
no las fuentes externas.
