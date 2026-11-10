# Auditoría morfológica inicial: Latín I → Griego I
Fecha: 10 de noviembre de 2026

## Alcance

Se examina el índice offline `data/lemmas/teacher-forms.json` con **664 lemas de Latín I** y **349 lemas de Griego I**. El panel `verification-review.js` obtiene las incidencias de la versión efectiva del índice y las distingue por tipo. No cambia claves de examen, ni asigna automáticamente la categoría «verificado». El detalle se exporta a JSON desde el panel.

La cobertura publicada se calcula **por lema**, no por casilla del paradigma. Tener una forma documentada en UniMorph no implica que todo el paradigma sea seguro. El índice mezcla UniMorph (fuente 0), paradigmas docentes (1), candidatos regulares latinos (2), citas léxicas sin análisis (3) y candidatos nominales griegos de Wikcionario (4). Los registros fuente 2 y 4 nunca pueden usarse como soluciones sin contraste independiente.

## Latín I: primera pasada

- **664** lemas; **416** con al menos una forma documentada (UniMorph/paradigma docente); **152** solo con candidatos y **96** con mera cita léxica.
- El panel calcula **416 incidencias**: **2 correcciones contrastadas**, **1 ampliación prioritaria**, **20 advertencias sobre etiquetas de verbos deponentes**, **152 lemas con formas candidatas**, **96 sin flexión**, **104 grupos de variantes** y **41 casos de homografía con evidencia flexiva**.
- **Corrección segura:** `moveo, movi, movitum (2ª)` → `moveo, movi, motum (2.ª)`. [Lewis y Short](https://thrax.mpiwg-berlin.mpg.de/mpiwg-mpdl-cms-web/lt/GetDictionaryEntries?dictionary=ls&inputType=lemma&language=lat&outputFormat=html&outputType=dictFull&query=moveo).
- **Corrección segura:** `eripio, eripui, eripitum (4ª)` → `eripio, eripui, ereptum (mixta)`. Lewis y Short lo clasifica en la conjugación tercera. [Ficha lexicográfica](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionary-entries.atlas_v1%3Alat.ls.perseus-eng2-n16146/).
- **Laguna:** `sum, fui, – (irr.)` solo está representado por `LEX;ENTRY` en el índice consultable, pese a existir tratamiento específico de `sum` en partes del generador.
- **Atención a deponentes:** se han detectado lemas con enunciado deponente que aparecen con `ACT` en etiquetas verbales UniMorph. No se debe traducir esta etiqueta automáticamente a la oposición escolar activa/pasiva; revisar la morfología de las terminaciones, el valor semántico y las excepciones.
- **Ambigüedades genuinas:** por ejemplo, `ducis` puede corresponder a `duco` y `dux`. Exigir contexto o excluir la forma de ejercicios que presuponen un análisis único.

## Griego I: segunda pasada

- **349** lemas; **107** con alguna forma documentada; **52** solo con candidatos; **190** con cita léxica sin flexión en el índice.
- El panel calcula **251 incidencias**: **1 ampliación prioritaria**, **52 casos con candidatos**, **190 lemas sin flexión**, **7 grupos de variantes** y **1 caso de homografía con evidencia flexiva**.
- **Prioridad:** incorporar el paradigma de presente medio del deponente `γίγνομαι` (γίγνομαι, γίγνῃ, γίγνεται, γιγνόμεθα, γίγνεσθε, γίγνονται), manteniendo la variante `γίνομαι` y `γίγνει` como cuestión curricular. [Logeion](https://logeion.uchicago.edu/morpho/%CE%B3%CE%AF%CE%BD%CE%BF%CE%BC%CE%B1%CE%B9).
- **Variantes:** la entrada de `παῖς` tiene diferentes propuestas para acusativo singular y dativo plural; decidir cuáles deben enseñarse o aceptarse en un examen, sin descartar formas literarias o dialectales automáticamente.
- **Precaución:** en los 190 casos de mera cita pueden existir adverbios, conjunciones u otras palabras invariables que **no requieren declinación**. Deben filtrarse antes de pedir paradigmas.

## Decisiones docentes

El panel permite marcar cada caso como **aceptar variante**, **corregir/completar** o **no usar en ejercicios**, con observaciones y exportación JSON; el estado se conserva en el navegador. Las marcas no editan los bancos ni alteran la generación. La corrección de fuentes maestras y la promoción de formas requieren una fase separada con evidencias, pruebas y, si procede, actualización del vocabulario en `VocabulaLatinaGraecaque`.

## Incidencia preexistente detectada por CI

El banco de evolución fonética tiene actualmente **510** fichas distintas, mientras que el constructor offline y una prueba PWA aún esperaban **460**. Se ha actualizado la validación para admitir al menos 510 y seguir rechazando IDs duplicados. No se alteraron las fichas.

## Límites de esta primera pasada

Es una **auditoría reproducible del índice existente y contraste externo de incidencias concretas**, no una colación filológica individual de las 16.829 filas ni una certificación de todos los paradigmas. Una segunda pasada deberá revisar por separado las irregularidades y las casillas elegibles por unidad. No se debe convertir «origen UniMorph» en «morfología garantizada» ni «decisión docente guardada» en «forma verificada».

## Fuentes del repositorio

- `data/lemmas/teacher-forms.json`
- `data/lemmas/greek-nominal-candidates.json`
- `scripts/build-lemma-index.mjs`
- `scripts/regular-latin.mjs`
- `offline-lemmas.js`
- `verification-review.js`
