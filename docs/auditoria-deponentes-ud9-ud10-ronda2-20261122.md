# Auditoría nominal de deponentes de Latín I — UD9–10 (segunda ronda, 22-11-2026)

> Revisión independiente de la PR #218. **Solo inventario y regresión de procedencia; NO se habilitan formas nuevas ni se cambia el motor.** Rama desde `main`, que sigue en `ad39d8c3`. Tras fusionar #218, habrá que confirmar la integración de este inventario sin alterar el material acreditado de UD7.

## 1. Estado observado del índice académico (Latín I)

Revisión directa de `data/lemmas/teacher-forms.json` de la rama #218; sus filas de UD9–10 no cambian respecto a `main`. El cuarto elemento de cada fila es el código de fuente: **0 = histórico, no evaluable por sí mismo; 5 = acreditado individualmente**. Los registros históricos de estos deponentes conservan etiquetas `V;IND;ACT`; no deben reinterpretarse como indicación de voz activa ni convertirse masivamente a fuente 5.

| Lema | Enunciado docente | Fuente 0 | Fuente 5 | Observación |
| --- | --- | ---: | ---: | --- |
| `gratulor` | gratulor, gratulatus sum (1ª) | 53 | 0 | Presente regular deponente; aún no acreditado en el motor |
| `loquor` | loquor, locutus sum (3ª) | 53 | 6 | Seis presentes acreditados; `loqueris` coincide formalmente con futuro |
| `miror` | miror, miratus sum (1ª) | 54 | 1 | La única acreditación es `mirati` como participio, no un presente |
| `nascor` | nascor, natus sum (3ª) | 54 | 0 | `nasceris` sincrético presente/futuro |
| `obliviscor` | obliviscor, oblitus sum (3ª) | 54 | 0 | `oblivisceris` sincrético presente/futuro; regímenes nominales requieren contexto |
| `orior` | orior, ortus sum (4ª) | 54 | 0 | Enunciado escolar mantenido; alternancias de 3ª/4ª, `oreris/oriris` |
| `patior` | patior, passus sum (mx.) en #218 | 54 | 0 | Tercera mixta; el cambio editorial pertenece a #218 |
| `polliceor` | polliceor, pollicitus sum (2ª) | 53 | 0 | Presente de segunda deponente; variante `-re` de 2ª sg. |
| `revertor` | revertor, reversus sum (3ª) | 54 | 0 | Ver apartado específico: perfecto activo `reverti` y `reversus sum` documentados en usos diferenciados |
| `sequor` | sequor, secutus sum (3ª) | 53 | 6 | Seis presentes acreditados; `sequeris` sincrético |
| `utor` | utor, usus sum (3ª) | 54 | 0 | `uteris` sincrético; régimen habitual de ablativo |

**Total: once lemas en UD9–10; dos con seis presentes de fuente 5 (`loquor`, `sequor`), uno con una forma participial (`miror`) y ocho sin registros fuente 5.** `gratulor` y `obliviscor` también figuran en UD11–12.

## 2. Paradigmas de presente contrastados en tablas externas: candidatos, no nuevas formas evaluables

Se han comparado las seis personas del presente indicativo con tablas de conjugación y el índice histórico. Orden: 1ª/2ª/3ª sg.; 1ª/2ª/3ª pl. No se concede valor de fuente 5 por este inventario aislado.

- `gratulor`: gratulor, gratularis, gratulatur; gratulamur, gratulamini, gratulantur. [Tabla](https://www.latindictionary.io/entry/gratulor-gratulari-gratulatus-sum) y [Latin is Simple](https://www.latin-is-simple.com/en/vocabulary/verb/4129/).
- `miror`: miror, miraris, miratur; miramur, miramini, mirantur. [Tabla](https://www.latindictionary.io/entry/miror-mirari-miratus-sum) y [Cactus2000](https://latin.cactus2000.de/showverb.en.php?verb=mirari).
- `nascor`: nascor, nasceris, nascitur; nascimur, nascimini, nascuntur. [Tabla](https://www.latindictionary.io/entry/nascor-nasci-natus-sum).
- `obliviscor`: obliviscor, oblivisceris, obliviscitur; obliviscimur, obliviscimini, obliviscuntur. [Oxford/LatinDictionary](https://www.latindictionary.io/entry/obliviscor-oblivisci-oblitus-sum), [Cactus2000](https://latin.cactus2000.de/showverb.en.php?verb=oblivisci).
- `orior`: orior, oreris (también oriris), oritur; orimur, orimini, oriuntur. Exige gestión de variantes y criterio escolar antes de habilitar. [Lewis & Short/Logeion](https://logeion.org/orior), [cotejo](https://www.latindictionary.io/entry/orior-oriri-ortus-sum).
- `patior`: patior, pateris, patitur; patimur, patimini, patiuntur. Tercera mixta. [Tabla](https://www.latindictionary.io/entry/patior-pati-passus-sum), [paradigma completo](https://www.azimonti.com/philology/latin/resources/paradigms-regular-verbs/) y [Éduscol](https://odysseum.eduscol.education.fr/les-modeles-de-conjugaison).
- `polliceor`: polliceor, polliceris, pollicetur; pollicemur, pollicemini, pollicentur. [Tabla](https://www.latindictionary.io/entry/polliceor-polliceri-pollicitus-sum) y [Cactus2000](https://latin.cactus2000.de/showverb.en.php?verb=polliceri).
- `revertor`: revertor, reverteris, revertitur; revertimur, revertimini, revertuntur. **Este bloque de presente no autoriza ningún paradigma de perfecto**. [Tabla](https://www.latindictionary.io/entry/revertor-reverti-reversus-sum), [Lewis & Short](https://atlas.perseus.tufts.edu/dictionaries/entry/urn:cite2:scaife-viewer:dictionary-entries.atlas_v1:lat.ls.perseus-eng2-n41583/).
- `utor`: utor, uteris, utitur; utimur, utimini, utuntur. [Tabla](https://www.latindictionary.io/entry/utor-uti-usus-sum).

### Cotejo complementario de 24 casillas (gratulor, miror, polliceor, patior)

Las **24 formas de presente**, seis por cada uno de estos cuatro lemas, han sido verificadas individualmente contra las tablas externas enlazadas, así como contra los registros históricos del índice académico de Latín I. Coinciden persona y número en las seis posiciones, normalizando únicamente las cantidades vocálicas. La segunda singular principal termina en `-ris` (`gratularis`, `miraris`, `polliceris`, `pateris`).

**Variantes `-re` (no promovidas):** `gratulare`, `mirare`, `pollicere` y `patere` figuran como alternativas de segunda singular en las tablas y pueden coincidir con el imperativo de presente. No deben ofrecerse en análisis morfológico aislado que exija una única respuesta. Las cuatro formas principales en `-ris` no presentan esa ambigüedad con el imperativo.

**Advertencia editorial de fuentes:** el antiguo servidor escolar `schule-bw.de` redirige actualmente y no constituye un enlace permanente operativo. Para `patior` se emplean en esta ronda las tablas enlazadas (especialmente Azimonti y Éduscol), no ese servidor.

**Estado curricular:** no se han añadido filas de fuente 5 por esta verificación; los cuatro bloques siguen siendo candidatos contrastados para la siguiente PR de ampliación. Se comprobará también que ninguna forma aparezca antes de UD9–10, y que se preserven web/PWA y castellano/valenciano.

Los seis presentes ya acreditados de `loquor` y `sequor` **no se duplican**. El participio acreditado de `miror` tampoco es prueba de su conjugación completa.

## 3. Sincretismos que hacen injusta una respuesta única sin contexto

En el índice histórico aparecen coincidencias de 2ª singular presente/futuro, tras prescindir de cantidades vocálicas, para **seis** lemas: `loquor` (`loqueris`), `nascor` (`nasceris`), `obliviscor` (`oblivisceris`), `revertor` (`reverteris`), `sequor` (`sequeris`) y `utor` (`uteris`). El índice histórico confirma que **todos los once deponentes** comparten la segunda singular alternativa en `-re` con su imperativo de presente: `gratulare`, `loquere`, `mirare`, `nascere`, `obliviscere`, `orere`, `patere`, `pollicere`, `revertere`, `sequere`, `utere`. **Seis** de estas variantes (`loquere`, `nascere`, `obliviscere`, `revertere`, `sequere`, `utere`) coinciden además con el futuro. Ninguna debe utilizarse en análisis aislado con respuesta única. En concreto, no crear ejercicios de análisis aislado que pidan **un único tiempo** para estas formas. La 1ª sg. de futuro y subjuntivo de presente también coincide en numerosos verbos de tercera, por lo que toda extensión a futuro/subjuntivo necesita cruce de lecturas.

No tratar como evidencia suficiente el etiquetado histórico `ACT`; tampoco considerar las cantidades vocálicas una solución práctica al sincretismo de los exámenes.

## 4. Revertor: régimen especial de tiempos de perfecto

Lewis & Short distingue `reverto/revertor` y aporta numerosos perfectos **activos** `reverti`, `reverteram`, `revertisse` en autores anteriores a Augusto; documenta además `reversus sum` en otros autores/usos, junto con participio `reversus`. La [bibliografía morfológica de Surrey](https://www.smg.surrey.ac.uk/deponency/Examples/Latin_2.htm) considera `revertor` un caso característico de verbo con morfología deponente en el sistema de presente y perfecto activo en parte del uso latino.

**Decisión de esta ronda:** no fusionar esas lecturas como equivalencias libres ni generar `reversus eram`, `reverti`, etc. de forma automática. El enunciado escolar de la web queda intacto; se estudian las interpretaciones de cada forma y su cronología antes de habilitar perfectos.

## 5. Protección técnica y próximas fases

El nuevo script de auditoría verifica (a) que los 11 lemas siguen en UD9–10; (b) procedencia y recuento exacto por lema; (c) que fuente 5 no aparece indebidamente en los ocho todavía no promovidos; (d) los seis sincretismos presente/futuro en fuente histórica; (e) las 24 formas principales de presente cotejadas para `gratulor`, `miror`, `polliceor` y `patior`, con sus etiquetas de persona y número; (f) las once variantes `-re` de segunda singular coincidentes con imperativo, y las seis que son además futuro. **Es prueba de integridad, no acreditación filológica suficiente de nuevas casillas**.

Orden recomendado para una futura PR de *ampliación*, tras decidir el tratamiento de sincretismos y probar ES/VA, web/PWA y documentos Word:
1. `gratulor`, `miror` y `polliceor` (presentes sin sincretismo presente/futuro de 2ª sg.); luego `patior` con clasificación mixta.
2. `nascor`, `obliviscor`, `utor` (presentes con protección expresa de 2ª sg.); separar el régimen de los complementos de `obliviscor` y `utor` de la flexión.
3. `orior` (variantes) y `revertor` (sistemas de perfecto alternantes), sin extensión automática.

**No publicar, no fusionar y no borrar ramas en esta revisión** sin autorización docente. El índice, los bancos y la web están sin modificar.
