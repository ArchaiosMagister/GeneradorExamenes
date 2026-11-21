# Auditoría filológica: concordancia de doce genitivos absolutos griegos (UD10)

**21 de noviembre de 2026.** Corrección conservadora en rama aislada posterior a las PR #207 y #208. No fusionar ni publicar sin decisión docente.

## Incidencia detectada

La PR #207 había desambiguado `τῶν νεῶν` como genitivo plural de **ναῦς, «nave»**, en lugar de `τῶν νέων` «de los jóvenes». Sin embargo, había conservado `ἀποπλευσάντων`, participio de aoristo activo **masculino genitivo plural**; el resultado era un genitivo absoluto **sin concordancia de género**.

- **Antes:** `ἀποπλευσάντων τῶν νεῶν ἐκ τοῦ λιμένος`.
- **Ahora:** `ἀποπλευσασῶν τῶν νεῶν ἐκ τοῦ λιμένος`.
- **Análisis:** `ἀποπλευσασῶν`, participio de aoristo activo, genitivo plural femenino de `ἀποπλέω`; `νεῶν`, genitivo plural femenino de `ναῦς`. «Después de que las naves hubieran zarpado del puerto…».

La desambiguación editorial de la PR #207 se **mantiene**; no se restituye `νέων` (jóvenes) ni se crea una flexión automática en el índice de lemas.

## Cotejo de toda la serie de UD10

Se han cotejado individualmente los **doce genitivos absolutos** de UD10, líneas 29–40. El expediente `data/vocabulary/greek1-absolute-genitive-agreement-20261121.json` contiene, para cada oración, el participio, su sujeto, género, caso, número, aspecto y voz. Los otros once casos mantienen concordancia de masculino, singular o plural, y **no requieren cambios**. La frase de las naves es el único desacuerdo detectado en esa serie. La revisión no se extiende automáticamente a todos los participios del griego.

## Evidencias académicas

- *Cambridge Grammar of Classical Greek*, §52.32: genitivo absoluto y concordancia entre sujeto y participio. https://www.cs.toronto.edu/~simon/Athens/Thucydides3/cgcg.pdf
- *Reading Greek: Language Reference Book* (Open University), tabla de participios de primer aoristo activo: femenino genitivo plural `-σασῶν`. https://fass.open.ac.uk/sites/fass.open.ac.uk/files/files/classical-studies/Reading_Greek_Language_Reference_Book_May_2022.pdf
- Logeion/Morpho, `ναῦς`: género femenino y genitivo plural `νεῶν`. https://logeion.org/morpho/%CE%BD%CE%B1%E1%BF%A6%CF%82

## Protección de regresión

`scripts/test-greek-absolute-genitives-20261121.cjs` examina las doce líneas de UD10, la forma corregida, el texto original ausente, el género y número de cada sujeto y participio, 14 UD y 471 renglones, y el inventario de 11 oraciones evaluables con paridad web/offline. Se ejecuta como paso independiente en Phase I y en la CI offline.

**Inalterados:** lematizador, 2817 registros griegos del índice, 478 registros de fuente 5, once oraciones evaluables, tipos de preguntas, puntuación, glosas, métodos de exportación y solucionarios.

**Pendiente metodológico:** continuar el cotejo de concordancias griegas y flexiones latinas en rondas posteriores; esta revisión no equivale a certificar toda la morfosintaxis del corpus.
