# Auditoría filológica ampliada · Latín y Griego I · 21/11/2026

## Léxico exigible (cinco correcciones reproducibles y glosa de ἔτι)

1. **Carthago, −inis (f.)** (Latín I, UD5), género femenino en vez de masculino.
2. **pūgnō (1ª)** (Latín 4.º, UD4), cantidad vocálica larga: la semilla exigible tenía `pŭgno` y el índice `pūgno`.
3. **Myro, –ōnis (m.)** y **stĭlus, –ī** (Latín 4.º, UD10): eliminar la letra cirílica en `Mўrō̆` y `stўlus`, rectificar las claves del índice de lemas y precisar significado «estilo, punzón para escribir» en lugar de «boli».
4. **μικρός, –ά, –όν** (Griego I, UD5), acentuación oxítona.
5. **ἔτι:** «aún, todavía» (UD10 y banco general), no «ya», valor normalmente correspondiente a `ἤδη`.

Las cinco correcciones de enunciado se almacenan en `data/lemmas/verified-overrides.json` para que sean reproducibles al regenerar el índice desde el banco académico fijado. No se promueven formas griegas de fuente 4 a fuente 5 ni se dan por verificados paradigmas completos. La migración de datos del usuario preserva traducciones editadas.

## Oraciones griegas y límites

Se auditan las 14 unidades del fichero docente `data/vocabulary/greek1-units-corrected.json`; se corrigen diez fragmentos de las UD5, UD6, UD7, UD8, UD10, UD11 y UD12: espíritus y acentos, τῶν, τῆς, τοὺς, θεᾷ, ἄδικα, πατὴρ, φιλόσοφος, νέαν πολιτείαν, y un uso erróneo de πράττω con objeto persona (se reemplaza por παιδεύω). Este fichero es distinto del corpus `greekSentenceRows` que el motor sortea; no se mezclan ambos bancos.

**Pendientes de estudio particular:** otros usos semánticamente anómalos de πράττω con personas en UD4, concordancias y acentos tardíos y cotejo más amplio del régimen verbal. No se corrigen en masa ni se inventan nuevos ejercicios.

## Control de integración

La prueba `scripts/test-filologia-latin-griego-20261121.cjs` comprueba el índice, el banco exigible, las fuentes, la versión autónoma y la ausencia de contaminación de claves por cirílico. Se ejecuta junto a las baterías Phase I y offline-check. La fusión y publicación siguen condicionadas a autorización posterior y a CI satisfactoria.

La compilación reproducible del índice y del HTML autónomo se completó en GitHub Actions para esta rama; el flujo temporal se retiró de la PR. Las verificaciones generales son independientes de ese control.

## Coherencia bilingüe

Tras detectar que los dos significados nuevos no tenían correspondencia valenciana, se añaden «aún, todavía» → «encara» y «estilo, punzón para escribir» → «estil, punxó per a escriure». La prueba valenciana es obligatoria en la reconstrucción y en la CI normal.

## Comprobación de las oraciones realmente evaluables

Además de los diez fragmentos del repertorio docente, se examina `greekSentenceRows` y su filtro de exclusiones. Se corrigen localmente cinco filas seleccionables: nominativo plural `πολῖται`, dirección `πρὸς τὴν γῆν`, concordancia del sintagma `αἱ γυναῖκες αὐταὶ τὸν πόλεμον`, acusativo `τὴν αὐτῶν πόλιν` y acento grave en `οἱ σοφοὶ`. Se mantienen las traducciones, análisis, lemas y restricciones por UD. Las filas que estaban en cuarentena siguen sin evaluarse.

La reconstrucción final que incluye las correcciones del corpus seleccionable también ha terminado satisfactoriamente, sin fusionar ni desplegar ninguna versión.

## Segunda revisión: régimen, aoristos y acentuación

Se revisan los **471 renglones** de las catorce unidades del repertorio docente: se aplican 27 sustituciones localizadas (28 apariciones, porque `ἐσῴσαν` figuraba dos veces). Se corrigen acentos de `νίκη`, `φιλόσοφος`, `παῖδές τινες` y `ἀγγελλόντων`, concordancia de `θεά` con Atenea, genitivo femenino de `Αἴγυπτος`, regímenes con `παρέχω` y el complemento `τῆς μάχης`, y formas de dativo y artículo.

El núcleo de UD12 se coteja con los paradigmas de aoristo: `ἔσωσαν` (dos veces), `ἐθαύμασε`, `ἐφύλαξαν`, `ἔρριψαν`, `ἔγραψαν`, `ἐδίωξε`, `ἔγραψε` y `εἰσέβαλον`. Se adopta el aoristo ático habitual de `ῥίπτω`, sin negar otras variantes documentadas. UD14: `ᾤκουν`, `ἐτιμᾶτο`, `τίνα`, `τὴν`.

En **el motor realmente evaluable**, se regularizan dos oraciones: `τόδε τὸ ζῷον φίλον ἡμῖν ἐστίν` (con actualización del análisis de sujeto y dativo) y `εἰς ... ἀγρὸν σὺν ἵπποις`. La nota filológica del repertorio original de 471 renglones no implica que este archivo sea fuente de las once oraciones elegibles: los dos corpus siguen aislados.

Prueba de regresión reproducible: `scripts/test-greek-sentence-philology-20261121.cjs` en Phase I y offline-check (ES/VA y paquete autónomo). Se conservan número de filas, unidades, etiquetas y exclusiones curriculares, sin incorporar por analogía nuevos paradigmas.

Referencias: [Smyth, acentos](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.1_div2.7.html); [Smyth, aoristos](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.9.html); [Smyth, enclíticos](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.1_div2.7.html); [Logeion σῴζω](https://www.logeion.org/%CF%83%E1%BF%B4%CE%B6%CF%89); [Open University, ῥίπτω](https://fass.open.ac.uk/sites/fass.open.ac.uk/files/files/classical-studies/Reading_Greek_Language_Reference_Book_May_2022.pdf); [Smyth, demostrativos](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.6.html); [pronombre ἡμῖν](https://pressbooks.pub/ancientgreek/chapter/25/).

Se deja pendiente una oración de UD12 con `αὐλητρίς`, `εὐφραίνω` y `ἀκρόαμα` cuyo régimen exige una solución textual, sin reescribirla de manera automática.

La reconstrucción de `offline.html` y del índice desde las fuentes originales se completó en Actions y eliminó el flujo temporal. Queda condicionada la publicación a la CI completa y a autorización expresa.

## Conciliación de la auditoría total sin certificar respuestas nuevas

La prueba `audit-greek-all-units.cjs --require-clean` detectó tres **superficies griegas corregidas y todavía desconocidas para el indexador**: `ἔσωσαν` (2 apariciones), `ἔρριψαν` y `εἰσέβαλον`. Se cotejan individualmente con fuentes externas, en `data/vocabulary/greek1-aorist-audit-evidence-20261121.json`, registrando lema, lectura contextual, UD, frecuencia y referencia. Para `εἰσέβαλον` se señala explícitamente el sincretismo de 1.ª singular y 3.ª plural; el sujeto plural decide su lectura en la oración.

La prueba de corpus reconoce ahora **únicamente** esas tres formas individualmente documentadas como `documented` en su informe. No cambia la API del analizador, `teacher-forms.json`, las fichas docentes, las formas candidatas ni las respuestas automáticamente evaluables. Queda bloqueado el uso de este reconocimiento si surge una lectura `review`, el contexto de UD cambia o no aparece la evidencia exacta. La regresión nueva `scripts/test-greek-aorist-attestation-20261121.cjs` exige `pending=0` y verifica que el índice morfológico no haya promovido ninguna forma.

Fuentes individuales: [ἔσωσαν (3.ª plural)](https://www.greekdoc.com/lexicon/sw.html), [ἔρριψαν (3.ª plural)](https://greekdoc.com/lexicon/ri.html) y [εἰσέβαλον (1.ª singular / 3.ª plural)](https://en.wiktionary.org/wiki/%CE%B5%E1%BC%B0%CF%83%CE%B2%CE%AC%CE%BB%CE%BB%CF%89).

## Tercera ronda: dativos, demostrativos, flexión y frase de UD12

En la revisión del régimen, concordancia y flexión se resuelven nueve incidencias localizadas del **repertorio docente, de 471 renglones**, conservando sus 14 unidades.

- UD4: `ἐν ταῖς Ἀθήναις`, dativo plural topónimo normalizado con ejemplos literarios (Ateneo, *Deipnosophistae* 4.12 y concordancias).
- UD5: `τοῖς φίλοις` (dativo plural de `φίλος`), evitando el adjetivo distinto `φίλιος` en un contexto cuyo significado es «los amigos».
- UD8: demostrativo `οὗτος ὁ σοφὸς ἄνθρωπος` con artículo atributivo; interrogación `;`; dativo plural `Ἕλλησι` de `Ἕλλην`; acusativo plural `θῆρας` de `θήρ`.
- UD12: `ἡ αὐλητρὶς` (y no `αὑλητρίς`). En la oración de la música se conserva el valor «los oyentes parecían alegrarse mucho con la actuación», pero `εὐφραίνειν τοῦ ἀκροάματος` se sustituye por `εὐφραίνεσθαι ἐπὶ τῷ ἀκροάματι`: voz media/pasiva con sentido intransitivo de alegría y régimen preposicional atestiguado, en lugar de un activo transitivo sin objeto y de un genitivo no justificado.
- UD14: `μᾶλλον ἢ` con acento grave al seguir palabra.

En la **pregunta realmente seleccionable** de Atenas se corrige tanto el texto `Ἀθήναις` como el análisis. En la oración de `τόδε τὸ ζῷον φίλον ἡμῖν ἐστίν`, el dativo se etiqueta específicamente como **complemento adjetival** de `φίλον` (no como dativo genérico de relación). También se concilia `ἀγρὸν` en el análisis de la oración del esclavo con la forma del enunciado.

Se añade `scripts/test-filologia-regimen-acento-20261121.cjs` a las dos CI y a la versión autónoma. No se autorizan nuevas formas seleccionables, no se reetiquetan automáticamente formas ambiguas y no se altera el número de ejercicios.

Fuentes: [dativo Ἀθήναις, ejemplo clásico](https://www.digitalathenaeus.org/tools/KaibelText/cts_urn_retriever.php?URN=urn%3Acts%3AgreekLit%3Atlg0008.tlg001.perseus-grc2%3A4.12%40%E1%BC%80%CE%BD%CF%84%CE%B9%CF%86%CE%AC%CE%BD%CE%B7%CF%82%5B1%5D); [Smyth sobre artículo y demostrativos](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.4_div2.16.html); [University of Texas, Ἕλλησι](https://lrc.la.utexas.edu/eieol_master_gloss/grkol/2); [Smyth sobre θήρ](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.4.html); [LSJ αὐλητρίς](https://en.wiktionary.org/wiki/%CE%B1%E1%BD%90%CE%BB%CE%B7%CF%84%CF%81%CE%AF%CF%82); [Xenophon, régimen de εὐφραίνομαι con ἐν / ἐπί + dativo](https://www.blueletterbible.org/lexicon/g2165/lxx/lxx/).

### Latín: revisión de cantidad vocálica

Se ratifica provisionalmente `pūgnō`: el léxico Navigium presenta `pūgnāre, pūgnō, pūgnāvī, pūgnātum`. El comportamiento histórico de la vocal ante `gn` exige distinguir la duración vocálica de la *posición silábica*, de modo que no se presenta el mero grupo consonántico como prueba aislada de `ū`. Véanse [Navigium](https://www.navigium.de/latein-woerterbuch/details?form=pugnantem&formen=PartizipialForm%28PPA%2CAdjektivForm%28AKK%2CSG%2Cm%2CPOS%29%29XPartizipialForm%28PPA%2CAdjektivForm%28AKK%2CSG%2Cf%2CPOS%29%29&vokid=RRLX-EYK&wb=null) y W. Sidney Allen, *Vox Latina*, capítulo 6.

### Resolución de una única forma pendiente en UD12

Después de la tercera ronda, el auditor de las 14 UD encontró un solo **caso de revisión**, `ἀκροάματι`. El lematizador ofrece exactamente un candidato —`ἀκρόαμα, –ματος (τό)`—, pero lo declara no atestiguado por el índice. Se ha cotejado externamente el **dativo singular**, documentado en el testimonio gramatical antiguo recogido por [Atticism.eu](https://atticism.eu/corpus/item/view?id=dd0c1758-f5f3-4c07-8631-ee895cbfcee8), y contrastado con el [paradigma del neutro -μα](https://en.wiktionary.org/wiki/%E1%BC%80%CE%BA%CF%81%CF%8C%CE%B1%CE%BC%CE%B1). No hay conflicto de lemas: el contexto es «complacerse con la actuación», con `ἐπὶ τῷ ἀκροάματι`.

El expediente `data/vocabulary/greek1-noun-case-attestation-20261121.json` acredita **solo esta superficie, con esta interpretación y en UD12**, para que la auditoría docente pueda concluir. Se exige explícitamente que el analizador continúe mostrando exactamente un candidato no atestiguado y estado `review`; si cambia, la prueba falla para forzar nuevo examen. No se promueve `ἀκροάματι` a formas de respuesta, no se lo marca como fuente 5 ni se modifican otros paradigmas.

## Cuarta ronda: cantidad latina y distinción entre macrón/breve y variantes métricas

Un control exhaustivo de las **1647 entradas exigibles de Latín I y Latín de 4.º** (1106 + 541, sin alterar las unidades) encontró diez apariciones con macrón y breve sobre la misma vocal, correspondientes a nueve enunciados distintos. **No se borran esas marcas indiscriminadamente:** algunas obras las usan precisamente para indicar cantidad variable. Por ejemplo, `pā̆trĭa` tiene documentadas `pātrĭa` y `pătrĭa` según la tradición poética; se conserva pendiente de criterio editorial.

Se rectifican únicamente dos casos cuyo valor vocálico está respaldado por diccionarios:
1. Latín 4.º UD1: `ā̆grĭcŏla, –æ` → **`ăgrĭcŏla, –æ`**, con vocal inicial breve, conforme al [Diccionario Olivetti](https://www.online-latin-dictionary.com/latin-english-dictionary.php?lemma=AGRICOLA100).
2. Latín 4.º UD3: `Ā̆frĭca, –æ` → **`Āfrĭca, –æ`**, con vocal inicial larga, conforme al [diccionario PONS](https://es.pons.com/traducci%C3%B3n/lat%C3%ADn-alem%C3%A1n/Africa) y [Āfer de Lewis-Short](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n1436/).

El macrón/breve doble de `homō̆`, `Cicerō̆`, `legiō̆`, `oppūgnātiō̆` y `pā̆tria` no se interpreta automáticamente como corrupción del dato: la final `-ō` admite acortamientos en tradiciones métricas; el caso `pā̆tria` presenta variantes. La revisión filológica posterior deberá distinguir cuidadosamente *cantidad vocálica usual, variación cuantitativa atestiguada y cantidad silábica por posición*, y decidir la política de presentación docente antes de normalizarla.

La prueba `scripts/test-filologia-cantidad-latina-20261121.cjs` coteja las dos formas corregidas contra el listado exigible, el índice de lemas, la web y el paquete autónomo, verificando asimismo que no se modifiquen los 1647 registros ni aparezcan letras cirílicas nuevas.

### Persistencia ante el índice externo fijo

El constructor `scripts/build-lemma-index.mjs` lee un inventario de `VocabulaLatinaGraecaque` fijado a un commit inmutable. Por ello no basta con corregir `required-latin-units.js` e `index.html`: al reconstruir el índice docente reaparecían las grafías anteriores. Se documentan ahora las dos transformaciones `agricola` y `africa` en `data/lemmas/verified-overrides.json` como `entryCorrections`, de forma que el mismo generador produce el enunciado correcto en cada compilación. Este mecanismo modifica únicamente la descripción del lema, no su conjunto de formas ni su estatus de verificación.

Reconstrucción persistente completada con las dos correcciones incorporadas al registro editorial. El índice `data/lemmas/teacher-forms.json` y `offline.html` se han recompilado, el flujo temporal de mantenimiento se ha eliminado y las pruebas específicas de cantidades, régimen griego y dativos individuales han concluido correctamente. La batería integral se repite sobre el commit definitivo sin publicar.

## Quinta ronda: acentuación léxica del corpus docente

Revisión puntual de las catorce unidades, sin modificar el inventario de oraciones ni el corpus seleccionable por el motor:

- **UD2 (dos apariciones):** `ζῳόν` → `ζῷον`. Se trata del nominativo/acusativo singular del sustantivo neutro `ζῷον, ζῴου`: la acentuación correcta lleva circunflejo en la penúltima, no agudo en la última. Cotejo: *Learn to Read Greek*, Yale University Press, y LSJ/Logeion, https://logeion.uchicago.edu/%CE%B6%CF%89%CE%BF%CE%BD.
- **UD5 (una aparición):** `Ἁσίας` → `Ἀσίας`. El topónimo `Ἀσία, –ας (ἡ)` lleva espíritu suave; el genitivo singular es `Ἀσίας`. Cotejo: LSJ, https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n16188/.

Se fijan estas tres sustituciones con aserciones en `scripts/test-greek-sentence-philology-20261121.cjs`, sin promocionar formas al índice, sin cambiar las unidades ni reescribir traducciones. **Pendiente:** comprobar la CI correspondiente al commit de esta quinta ronda. La PR permanece en borrador; sin autorización de fusión ni publicación.
