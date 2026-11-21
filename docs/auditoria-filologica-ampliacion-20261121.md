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
