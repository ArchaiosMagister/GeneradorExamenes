# Continuación de la auditoría filológica · Griego I · 21/11/2026

## Alcance
Continuación posterior a la fusión de la PR #203. Revisión contextual del corpus docente `data/vocabulary/greek1-units-corrected.json`, separado de las once oraciones seleccionables de `greekSentenceRows`. Se conservan catorce unidades y 471 renglones no vacíos. La auditoría no acredita formas nuevas de evaluación ni altera lemas, traducciones, índices, calificaciones o datos de usuarios.

## Ocho sustituciones puntuales comprobadas (seis casos de acento/espíritu y dos plurales)
| Unidad | Antes | Después | Justificación |
| --- | --- | --- | --- |
| UD5 | `ἀγαθήν ψυχὴν` | `ἀγαθὴν ψυχὴν` | En secuencia continua, la oxítona cambia agudo por grave antes de palabra no enclítica. |
| UD7 | `ὑμεῖς δ’ ἑμοῦ οὐκ ἀκούετε` | `ὑμεῖς δ’ ἐμοῦ οὐκ ἀκούετε` | Primera persona singular, genitivo enfático `ἐμοῦ`, espíritu suave; régimen `ἀκούω` + genitivo conservado. |
| UD10 | `οἱ δε μένοντες` | `οἱ δὲ μένοντες` | La partícula postpositiva exige acento grave en este contexto. |
| UD10 | `τών πτερῶν` | `τῶν πτερῶν` | Artículo genitivo plural `τῶν`, con circunflejo. |
| UD13 | `θνητῆς δε μητρὸς` | `θνητῆς δὲ μητρὸς` | Partícula `δὲ`, acento grave. Se respetan los demás signos de la fuente (incluida su normalización Unicode variable). |
| UD13 | `τῶν ἑχθρῶν κώμας` | `τῶν ἐχθρῶν κώμας` | Genitivo plural de `ἐχθρός` con espíritu suave. |
| UD13 (2 apariciones) | `ζῶα` | `ζῷα` | Nominativo/acusativo plural de `ζῷον`, conservando la iota suscrita. Una forma aislada y una oración. |

## Referencias de contraste
- H. W. Smyth, *Greek Grammar*, reglas de acentuación de las oxítonas: https://grammars.alpheios.net/smyth/xhtml/body.1_div1.1_div2.7.html
- H. W. Smyth, *Greek Grammar*, paradigma de pronombres personales (`ἐμοῦ`): https://ccel.org/s/smyth/grammar/html/smyth_2l_uni.htm
- Paideia Institute, tabla del artículo (`τῶν`): https://online.paideiainstitute.org/morphology-ancientgreek-articles/
- Diccionario LSJ, `ἐχθρός` y su familia: https://logeion.uchicago.edu/%E1%BC%90%CF%87%CE%B8%CF%81%CF%8C%CF%82
- Yale University Press, *Learn to Read Greek*, paradigma de `ζῷον`: https://drupal.yalebooks.yale.edu/sites/default/files/files/Media/9780300115895_Keller_Learn%20to%20Read%20Greek_Txt%201/9780300115895_excerpt.pdf

## Regresiones
Las ocho sustituciones se incorporan a `scripts/test-filologia-regimen-acento-20261121.cjs`, ya conectado a la CI Phase I y a la de versión autónoma. El test comprueba por unidad la aparición de la grafía correcta y la desaparición de la incorrecta, incluyendo las dos apariciones de `ζῷα` en UD13, además de los invariantes previos de 14 unidades, 471 renglones y 11 oraciones seleccionables.

## Pendientes no modificados por prudencia
1. Atestación contextual de `βασιλεύονται ὑπὸ τοῦ Κύρου` (UD6); no sustituir por `ἄρχονται` por mera intuición.
2. Valorar la naturalidad de `τὰς ἀρετὰς πράττουσιν` (UD5) y de `ἐπιστολὴν εἰς τὸν φίλον ἔγραφεν` (UD11) antes de corregir estilo y régimen.
3. Continuar con morfología latina de tercera declinación, regímenes y cantidades vocálicas de enunciados exigibles, sin promover análisis por analogía.

**Sin publicación:** esta revisión se deja en PR independiente, sin fusión ni despliegue hasta la CI satisfactoria y decisión docente.

## Ronda siguiente: regímenes griegos, acentuación contextual y negación

**Regímenes conservados con respaldo léxico:**
- UD6, `οἱ Πέρσαι βασιλεύονται ὑπὸ τοῦ Κύρου`: el pasivo de `βασιλεύω` puede significar «ser gobernado por un rey». Véase https://greekdoc.github.io/lexicon/bas.html. La construcción tiene sentido y no se sustituye por `ἄρχονται`.
- UD11, `ἐπιστολὴν εἰς τὸν φίλον ἔγραφεν`: el léxico documenta la construcción `γράφω` con `εἰς τινα` además del dativo y otras fórmulas de destinatario; no se fuerza el reemplazo por `πρός`. Véase LSJ https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n22825/.
- UD5, `τὰς ἀρετὰς πράττουσιν`: puede resultar poco natural como modelo de prosa clásica; conservar por ahora y revisar antes de cambiar una construcción de contenido didáctico.

**Ocho correcciones nuevas sobre el corpus docente (14 UD y 471 renglones):**

| Unidad | Antes | Después | Fundamento |
| --- | --- | --- | --- |
| UD3 | `φωνή τῆς` | `φωνὴ τῆς` | Oxítona seguida de palabra no enclítica. |
| UD5 | `ἀεί δικαιός` | `ἀεὶ δικαιός` | Agudo final → grave en continuidad prosódica. |
| UD5 | `οὐ ἀεί οἱ` | `οὐκ ἀεὶ οἱ` | Negación ante vocal con espíritu suave y grave contextual. |
| UD9 | `θεοί γιγνώσκουσι` | `θεοὶ γιγνώσκουσι` | Grave contextual. |
| UD10 | `ἀγαθοί οὐκ εἰσίν` | `ἀγαθοὶ οὐκ εἰσίν` | Grave contextual. |
| UD11 | `τῷ παιδί τὸν` | `τῷ παιδὶ τὸν` | Grave contextual. |
| UD14 | `χρή τὰς` | `χρὴ τὰς` | Grave contextual. |
| UD14 | `πολλοί ἄνθρωποι` | `πολλοὶ ἄνθρωποι` | Grave contextual. |

**No automatizar globalmente**: las interrogativas `τί` y los grupos con enclíticos como `σοφοί εἰσιν`, `ἄνθρωποί τινες` o `ἀνδρεῖοί ἐστε` requieren tratamiento específico; no son equivalentes a una oxítona ante palabra independiente. Véase Smyth: https://grammars.alpheios.net/smyth/xhtml/body.1_div1.1_div2.7.html.

## Latín 4.º: once apariciones sincronizadas en fuentes, índice y HTML autónomo

Se inspeccionan las **541 entradas exigibles de diez unidades** y se corrigen **11 apariciones** de cinco tipos. El listado exigible, el banco del examen, los overrides editoriales persistentes, el índice de lemas y `offline.html` se han reconstruido y cotejado en una única ejecución aislada de GitHub Actions (sin publicación).

| Grafía actual | Unidades (apariciones) | Criterio de corrección | Evidencia |
| --- | --- | --- | --- |
| `hōstĭs` | UD5, UD7, UD8, UD10 (4) | La primera **o** es breve (`hŏstĭs`), aunque la sílaba sea larga por posición ante `st`. | https://en.wiktionary.org/wiki/hostis; https://dcc.dickinson.edu/sv/grammar/latin/quantity-syllables |
| `īmpĕrātŏr` | UD5, UD6, UD7 (3) | La **i** inicial es breve; preferir `ĭmpĕrātŏr` si se conserva la marcación exhaustiva. | https://logeion.uchicago.edu/imperator; https://en.wiktionary.org/wiki/impero |
| `cōllĭs` | UD5 (1) | La **o** es breve (`cŏllĭs`); la sílaba es larga por `ll`. | https://en.wiktionary.org/wiki/Viminalis_collis; https://dcc.dickinson.edu/sv/grammar/latin/quantity-syllables |
| `ōppūgnātĭō` / `ōppūgnātĭō̆` | UD5, UD6 (2) | La **o** inicial es breve; **no** se cambia todavía la `ū`, por divergencia lexicográfica sobre su cantidad, ni la marca doble final sin criterio editorial. | https://en.wiktionary.org/wiki/oppugnatio; https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n32826/ |
| `mŭlĭĕr, –ris` | UD8 (1) | La abreviación `–ris` no es en sí incorrecta; se armoniza editorialmente como `mŭlĭĕr, –eris (f.)`, equivalente a `mulieris`. | https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n29835/ |

**Control de alcance:** los doble signos en `hŏmō̆`, `Cĭcĕrō̆`, `lĕgĭō̆` y `pā̆trĭa` se mantienen como casos de cantidad variable o política editorial pendiente, sin borrado indiscriminado. Tampoco se reescriben los genitivos abreviados de tercera declinación por analogía: las anteriores incidencias de `nix/sol` permanecen resueltas en la PR #203.

**Aplicación final:** `scripts/apply-latin4-quantities-20261121.cjs` aplica de forma idempotente las once modificaciones y añade cuatro overrides específicos. `scripts/build-lemma-index.mjs` y `npm run offline:build` regeneran conjuntamente los dos índices. La regresión `scripts/test-filologia-latin4-cantidades-ronda2-20261121.cjs`, integrada en Phase I y offline-check, asegura las once fichas por unidad, la migración local sin alterar entradas manuales, la conservación de 1106/541 exigibles y la paridad del índice embebido. La prueba aislada ha pasado y el commit 8cd73ebba27a0412514c91aafc67bf265e0c72e0 incluye los artefactos sincronizados. **Ningún paradigma nuevo se marca como verificado.** La CI general del commit final se valida aparte.

## Barrido adicional de negación οὐ / οὐκ / οὐχ

Se han buscado en todas las oraciones de las catorce unidades las apariciones de la negación delante de la siguiente palabra, distinguiendo vocal con espíritu suave, vocal con espíritu áspero y consonante. Dos apariciones no respetaban la elisión condicionada por la aspiración:

- UD10: `μάχεσθαι οὐ ἐβούλοντο` → **`μάχεσθαι οὐκ ἐβούλοντο`**.
- UD12: `οἱ Λακεδαιμόνιοι οὐ ἔσωσαν` → **`οἱ Λακεδαιμόνιοι οὐκ ἔσωσαν`**.

Se conserva `οὐχ ὁ` (UD10) porque `ὁ` lleva espíritu áspero; también los `οὐ` ante consonante y `οὐκ` ante vocal suave correctos. Se añaden estas dos aserciones a la prueba filológica. **Total de la presente PR: 18 sustituciones griegas localizadas (no 18 paradigmas ni 18 respuestas nuevas)**. Se conserva exactamente el inventario de 14 unidades y 471 registros.

Referencia sobre negación: https://ccel.org/ccel/smyth/grammar/html/smyth_1e_uni.htm (Smyth §137, οὐκ ante espíritu suave y οὐχ ante áspero); https://dcc.dickinson.edu/grammar/age/no-and-not.

## Ronda posterior: imperō y oppidum (cinco apariciones de Latín 4.º)

La lectura de las **541 entradas latinas exigibles de 4.º** detectó `īmpĕro (1ª)` en UD5 y `ōppĭdŭm, –ī` en UD2, UD5, UD7 y UD8. La primera vocal de ambos lemas es breve, sin perjuicio de que las sílabas iniciales sean largas por posición (`im-` ante `mp`, `op-` ante `pp`).

- Corrección localizada: `īmpĕro` → **`ĭmpĕro`** (UD5). El genitivo latino no interviene: es la primera persona de indicativo, primera conjugación. Evidencia de pronunciación clásica: https://en.wiktionary.org/wiki/impero y Lewis–Short: https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n21886/.
- Corrección localizada: `ōppĭdŭm` → **`ŏppĭdŭm`** (cuatro UD). Lewis–Short: https://alatius.com/ls/index.php?l=oppidorum y https://logeion.uchicago.edu/oppidum.
- No se modifica el `impero` ni el `oppidum` de Latín I, cuyos enunciados no contienen ese macrón.
- Se dispone un script delimitado `scripts/apply-latin4-quantities-followup-20261121.cjs`, que solo actualiza los exigibles de 4.º, su banco de examen, la migración de semillas (sin tocar glosas manuales) y dos correcciones persistentes. El índice y `offline.html` se reconstruyen juntos desde el origen académico fijado, sin crear flexiones certificadas.
- La prueba `scripts/test-filologia-latin4-quantity-followup-20261121.cjs` comprueba cinco grafías, 1106/541 exigibles, dos overrides, migración idempotente y paridad offline. Se añade a Phase I y offline-check.

### Riesgo sistemático detectado, sin corrección automática

El barrido por macrón delante de grupos consonánticos de Latín 4.º devuelve numerosos candidatos, pero **no es un detector de errores**: una vocal larga puede preceder dos consonantes y una breve también. Se exige contraste individual y distinción entre cantidad de vocal y sílaba. Por ejemplo, `līttĕra` merece cotejo adicional con Lewis–Short, que recoge `littĕra` y califica `lītĕra` de grafía menos recomendable (https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n26829/). También deben estudiarse `āltus`, `gēmma`, `māgnus`, `lōngus` y `pūlchĕr` antes de modificar el listado. La reconstrucción de estas cinco apariciones de `impero/oppidum` se hará de forma aislada y sin despliegue.

## Ronda de grupos consonánticos: cuatro lemas y nueve apariciones

Se han contrastado individualmente las cantidades vocálicas de las entradas exigibles de Latín de 4.º. Las siguientes **nueve apariciones** corresponden a cuatro lemas cuya vocal inicial es breve, aunque la sílaba sea larga por posición:

| Lema de 4.º | Lectura corregida | UD | Apariciones | Fuente |
| --- | --- | --- | ---: | --- |
| `āltus` | `ăltus` | 1, 3, 4, 7 | 4 | https://en.wiktionary.org/wiki/altus |
| `lōngus` | `lŏngus` | 1, 2 | 2 | https://en.wiktionary.org/wiki/longus |
| `gēmma` | `gĕmma` | 1 | 1 | https://en.wiktionary.org/wiki/gemma |
| `līttĕra` | `lĭttĕra` | 2, 3 | 2 | https://en.wiktionary.org/wiki/littera |

La aplicación conserva los **1106 registros de Latín I y 541 de Latín de 4.º**, mediante `scripts/apply-latin4-quantity-clusters-20261121.cjs`. Los cuatro overrides acreditados preservan las correcciones al reconstruir el índice desde la fuente académica fijada; las migraciones se limitan al vocabulario exigible sembrado y no alteran las glosas añadidas por el profesor. `scripts/test-filologia-latin4-quantity-clusters-20261121.cjs` exige las nueve coincidencias por UD, cuatro overrides, paridad web/offline y que ninguna de las 619 formas contrastadas previamente se promocione por estos cambios.

### Caso expresamente suspendido: `māgnus`

Una primera propuesta confundió la cantidad de la sílaba con una cantidad vocálica inequívoca y sustituyó `māgnus` por `măgnus`. **Se revierte esa sustitución** y se conserva la lectura curricular original `māgnus` en las siete apariciones de Latín de 4.º hasta resolver la discrepancia lexicográfica. No consta prueba suficiente para imponer una `ă` breve.

- Allen y Greenough, *New Latin Grammar*, §10.d, presentan `māgnus` como ejemplo de vocal larga ante `-gn-`, con una advertencia explícita de que no siempre se conoce la cantidad: https://dcc.dickinson.edu/sv/grammar/latin/quantity-syllables.
- Wiktionary, `magnus`, «Usage notes», documenta la disparidad entre las gramáticas y diccionarios que omiten el macrón y los que lo mantienen: https://en.wiktionary.org/wiki/magnus.
- Las discusiones filológicas son reales y no meramente tipográficas: Carl Darling Buck, «The Quantity of Vowels Before gn», *The Classical Review* 15 (1901), 311–314, https://doi.org/10.1017/S0009840X00030808.

En consecuencia, `magnus` queda **excluido de automatismos de cantidad** hasta que se adopte un criterio editorial. El índice no debe incorporar un `entryCorrection` que sustituya `māgnus` por `măgnus`. La prueba comprueba expresamente su conservación. La cantidad vocálica y el peso silábico se mantienen como categorías distintas.

### Paridad autónoma verificada después de la rectificación de `magnus`

El workflow aislado **44926622832** ha finalizado con éxito y ha regenerado `offline.html` en el commit `7391d4ab2615685babb07bdd2ee2691e2d143482`. Un cotejo posterior por lectura directa del blob de GitHub confirma igualdad estructural del índice `data/lemmas/teacher-forms.json` y su copia embebida, presencia de `māgnus` y ausencia de `măgnus`, sin modificar las 541 fichas exigibles de Latín de 4.º. Los fallos de CI inmediatamente anteriores correspondían a la copia autónoma desfasada, no a nuevos errores morfológicos.

La integración completa de Phase I, formato Word, pruebas de exámenes reales y versión autónoma **debe repetirse sobre el commit final**. Los eventos `pull_request` iniciados por el bot de Actions después de reconstruir el archivo pueden aparecer como `action_required`: la comprobación definitiva requiere un commit normal del colaborador o autorización de GitHub Actions; no equivale a un fallo de la lógica de exámenes.

## Ronda adicional: siete nominativos griegos y 25 cantidades latinas

**Correcciones añadidas a la PR #205:** 32 apariciones (7 griegas, 25 latinas) mediante cambios acotados, no reemplazos masivos.

### Griego I: nominativo plural de πολέμιος

Los siete errores `πολεμίοι` / `πολεμίοι` se han corregido como `πολέμιοι` / `πολέμιοι`: UD6 (2), UD7 (2), UD11 (2) y UD12 (1). El acusativo `πολεμίους` y el genitivo `πολεμίων` se mantienen, por pertenecer a casos distintos y ser válidos. Se preservan 14 UD y 471 renglones; las 11 oraciones seleccionables no se modifican. Contraste: https://greekdoc.github.io/lexicon/pol.html y https://en.wiktionary.org/wiki/%CF%80%CE%BF%CE%BB%CE%AD%CE%BC%CE%B9%CE%BF%CF%82.

### Latín de 4.º: vocal breve frente a sílaba larga por posición

| Lema | Antes | Después | Apariciones curriculares |
|---|---|---|---:|
| pulcher | `pūlchĕr, –chra, –chrum` | `pŭlchĕr, –chra, –chrum` | 2 (UD1, 3) |
| puella | `pŭēlla, –æ` | `pŭĕlla, –æ` | 4 (UD1, 2, 3, 8) |
| albus | `ālbus, –a, –um` | `ălbus, –a, –um` | 1 (UD2) |
| multus | `mūltus, –a, –um` | `mŭltus, –a, –um` | 4 (UD2, 4, 8, 9) |
| bellum | `bēllŭm, –ī` | `bĕllŭm, –ī` | 4 (UD3, 4, 5, 7) |
| noster | `nōstĕr, –tra, –trum` | `nŏstĕr, –tra, –trum` | 5 (UD3, 5, 6, 7, 8) |
| vinco | `vīnco (3ª)` | `vĭnco (3ª)` | 1 (UD4) |
| omnis | `ōmnĭs, –e` | `ŏmnĭs, –e` | 4 (UD7, 8, 9, 10) |

Referencias individualizadas en `data/lemmas/verified-overrides.json`. Se conservan las 1106 entradas exigibles de Latín I y las 541 de 4.º, así como sus UD y glosas docentes. Se mantienen las decisiones sobre `māgnus` y otras cantidades dudosas. Las migraciones solo afectan las entradas con origen `listado docente exigible`; no sobrescriben ediciones manuales.

### Pruebas y reconstrucción

- Extendida `scripts/test-filologia-regimen-acento-20261121.cjs`: los siete nominativos válidos aparecen por UD y desaparecen los falsos.
- Extendida `scripts/test-filologia-latin4-quantity-clusters-20261121.cjs`: comprueba 25 entradas del exigible y del banco, ocho overrides, índice y copia offline, migraciones idempotentes y conservación de las 619 lecturas latinas contrastadas.
- GitHub Actions, ejecución aislada https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/44928173882: **success**. Reconstruye `data/lemmas/teacher-forms.json` desde la fuente fijada, regenera `offline.html`, ejecuta las dos pruebas actualizadas y comprueba que solo cambian los artefactos reconstruidos. La rama incorpora el commit generado `53c9ff6fa9cca598767a12a1f11c6f65f8023979`.
- El flujo temporal de reconstrucción se ha retirado tras finalizar. Las baterías generales deben evaluarse sobre el último commit de la PR.

**Sin fusión ni publicación.** Ninguna de estas modificaciones otorga acreditación nueva de formas flexivas.
