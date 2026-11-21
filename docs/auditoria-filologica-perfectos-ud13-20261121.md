# Auditoría filológica UD13: perfectos y pluscuamperfectos (21/11/2026)

**PR #206**, continuación no publicada. Cotejadas las treinta líneas de la UD13 y las formas que utiliza el glosario auxiliar; **ninguna promoción a fuente 5 ni ampliación automática de formas evaluables**.

| Lema | Forma anterior | Forma curricular normalizada | Línea de UD13 | Lectura |
|---|---|---|---|---|
| κινδυνεύω | `κεκινδυμεύκαμεν` | `κεκινδυνεύκαμεν` | 25 | Perfecto activo de indicativo, 1.ª plural |
| λύω | `ἐλελύκειμεν` | `ἐλελύκεμεν` | 20 | Pluscuamperfecto activo de indicativo, 1.ª plural |
| πυρεύω | `ἐπεπυρεύκεισαν` | `ἐπεπυρεύκεσαν` | 7 y 22 | Pluscuamperfecto activo de indicativo, 3.ª plural |

**Criterio:** la primera sustitución corrige el tema verbal (`κινδυν-ευ-`, no `κινδυμ-`); las demás adoptan las desinencias clásicas **-εμεν** y **-εσαν**. Smyth §§467 y 701 documenta que **-ειμεν** y **-εισαν** son desarrollos posteriores (la segunda especialmente tardía): por tanto no se consideran grafías universalmente imposibles. La forma `ἐπεπυρεύκεσαν` ya aparece en la línea 29 de la fuente original, y `ἐλελύκεμεν` consta previamente como paradigma docente explícito (fuente 1) del índice. Las nuevas formas de los otros verbos se apoyan en reglas y lemas documentados, **no en un testimonio textual individual de fuente 5**.

Se conservan sin cambios las formas correctas `ἐλελύκεσαν`, `ἐπεπαιδεύκει`, `ἐπεφύκει`, `πεπαύκαμεν` y `ἐπεπρεσβεύκεσάν`; la última mantiene la acentuación contextual ante el enclítico `τινες`.

## Fuentes

- **Smyth, Greek Grammar** §467: https://www.ccel.org/s/smyth/grammar/html/smyth_2Vq_uni.htm, y §701: https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.10.html
- **Universidad de Maguncia, Graecum-Compendium**, tabla del pluscuamperfecto y nota sobre desinencias posteriores: https://www.klassphil.uni-mainz.de/files/2025/01/Graecum-Compendium-2019.pdf
- **LSJ, κινδυνεύω**: https://www.greek-language.gr/digitalResources/ancient_greek/tools/liddell-scott/search.html?lq=%CE%BA%CE%B9%CE%BD%CE%B4%CF%85%CE%BD%CE%B5%CF%8D%CF%89
- **Paradigma antiguo de κινδυνεύω**: https://el.wiktionary.org/wiki/%CE%BA%CE%B9%CE%BD%CE%B4%CF%85%CE%BD%CE%B5%CF%8D%CF%89

## Sincronización y pruebas

Se han actualizado exactamente cuatro apariciones del corpus (30 líneas de UD13 dentro de las 471 de Griego I) y tres entradas del lematizador contextual, sin modificar preguntas evaluables, traducciones, banco exigible ni datos persistentes de verificación. Las variantes posteriores no siguen presentándose como formas por defecto del glosario, pero el informe documenta su posible carácter histórico.

`scripts/test-greek-perfect-pluperfect-ud13-20261121.cjs` comprueba las frecuencias exactas, las posiciones, la conservación de formas válidas, la ausencia de promociones a fuente 5 y la paridad del glosario con `offline.html`. Se ejecuta en CI Phase I y CI offline. La prueba previa `scripts/test-filologia-regimen-acento-20261121.cjs` exige ahora `ἐπεπυρεύκεσαν` en vez de la variante posterior.

**No fusionar ni publicar sin autorización docente expresa, y no hacerlo si no se valida toda la CI del último commit.**
