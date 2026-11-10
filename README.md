# Generador de exámenes de Latín y Griego

Prototipo experimental de un generador de exámenes para **Latín de 4.º de ESO, Latín I y Griego I**.

## Probar la versión online

La aplicación web utiliza `index.html` de la rama `main`. El enlace de GitHub Pages es
[abrir el generador online](https://archaiosmagister.github.io/GeneradorExamenes/).
Los cambios se publican mediante GitHub Pages; comprueba que el último despliegue
haya terminado correctamente en **Actions → pages build and deployment**.
La versión `offline.html` es una descarga alternativa, no la interfaz predeterminada.

## Webapp instalable y uso sin conexión (PWA)

La versión web **puede funcionar sin Internet después de una primera visita con conexión**. No es una aplicación de escritorio ni requiere descargar un instalador:

1. Abre [el generador online](https://archaiosmagister.github.io/GeneradorExamenes/) con Internet y mantén la página abierta hasta que aparezca **«Preparada para funcionar sin conexión»**.
2. A partir de ese momento puedes volver a abrir la misma dirección sin conexión desde ese navegador y dispositivo. La caché incluye la interfaz, el banco latino UniMorph, el índice del lematizador de latín y griego y la versión alternativa `offline.html`.
3. Si el navegador lo permite, pulsa **Instalar** o utiliza el menú de instalación / «Añadir a pantalla de inicio» (Safari en iPhone o iPad: **Compartir → Añadir a pantalla de inicio**). La instalación es opcional.
4. Cuando se publique una actualización, aparecerá **«Preparar actualización»**. Puedes mantener el examen abierto sin perder las modificaciones. Para cargar el código nuevo, guarda o exporta primero el borrador y pulsa **«Recargar versión nueva»**.
5. Usa **Copia de datos** y **Exportar examen** para guardar archivos JSON separados. La caché PWA **no sustituye a una copia de seguridad**: si borras los datos del sitio o cambias de dispositivo/navegador, podrías perder borradores y contenido añadido. Puedes solicitar **Proteger almacenamiento** cuando el navegador ofrezca esa función, sin garantía de concesión.

**Nota:** la primera carga necesita conexión y que el navegador admita service workers (habitualmente HTTPS, o localhost durante desarrollo). Al abrir `offline.html` desde el disco mediante `file://` no se instala ningún service worker, porque ese archivo continúa siendo completamente autónomo por sí solo. Si el navegador bloquea el almacenamiento del sitio, utiliza `offline.html` y exporta tus datos regularmente.

La actualización del service worker se versiona con el SHA del despliegue en GitHub Pages; los recursos se guardan de forma conjunta para evitar versiones mezcladas. No se envían borradores ni vocabulario del usuario a un servidor: permanecen en el almacenamiento local del navegador.

## Estructura académica de los exámenes (versión actual)

El **nombre del modelo** (completo, morfología o traducción) no sustituye el título académico de la cabecera: `Examen de Latín I – UDs 2–3`, por ejemplo.

| Curso y modelo | Apartados |
| --- | --- |
| Latín 4.º ESO · completo | Tablas de declinación; tabla para conjugar; análisis de formas variables; **2** apartados de léxico (a, b); **4** preguntas de cultura (a–d), cuando existan en el banco; **4** oraciones por defecto; vocabulario de las oraciones |
| Latín I · completo | Declinación, conjugación, análisis de formas variables, **3** apartados de léxico (a–c), **5** oraciones por defecto (ajustables de 4 a 6) y vocabulario de oraciones |
| Latín I · morfología | Tablas de declinación, tabla de análisis verbal, tabla de pronombres a partir de la unidad correspondiente y análisis de palabras variables |
| Latín I · traducción | Análisis de formas variables, **3** apartados de léxico, **7** oraciones por defecto y vocabulario de oraciones |
| Griego I · completo | Declinación, conjugación, análisis morfológico, etimología, **5** oraciones por defecto (ajustables de 4 a 6) y vocabulario de oraciones |
| Griego I · morfología | Declinación, análisis verbal, pronombres desde UD7 y palabras variables, excluidas las invariables |
| Griego I · traducción | Análisis de formas, derivación etimológica y **7** oraciones como objetivo |

### Plantillas de Latín I según los ejemplos docentes

Cuando se marca **una sola unidad**, la webapp aplica estas cuatro estructuras de referencia; para otras unidades o combinaciones mantiene el modelo general y sus controles:

| Selección | Estructura |
| --- | --- |
| Completo · UD2 | Dos tablas para declinar sintagmas; cuatro formas para analizar; tabla doble de conjugación (*do* imperfecto y *facio* presente); hasta seis oraciones para analizar y traducir; vocabulario final |
| Morfología · UD3 | Elegir dos de tres sintagmas; dos tablas de declinación en blanco; tabla de diez verbos para analizar; diez palabras para analizar |
| Morfología · UD6 | Elegir uno de tres sintagmas; una tabla de declinación en blanco; quince pronombres en tabla con caso, género, número y tipo; diez palabras para analizar |
| Traducción · UD6 | Seis formas para analizar; derivación preverbial con tres derivados de *pugno* y dos de *curro*; hasta siete oraciones; vocabulario final |

Los sintagmas de ejemplo, las formas de la tabla verbal de UD3 y los dos verbos de derivación de UD6 proceden de los modelos aportados. **Las oraciones y los demás análisis variables se seleccionan del banco ya existente**: si no hay material suficiente se informa, sin inventarlo.

El vocabulario final se genera a partir de los lemas identificados en las oraciones y utiliza el **enunciado más completo documentado** en el banco del curso. Los términos marcados como vocabulario exigible aparecen **sin traducción**; los demás la llevan cuando está documentada. La aplicación indica las formas ambiguas o sin identificar para revisión docente, no inventa traducciones ni paradigmas. En los documentos Word, las letras `a.`, `b.`, etc. se imprimen en redonda y las palabras y oraciones en cursiva. La interfaz prioriza la exportación del **examen del alumnado, sin solucionario**.

**Vocabulario de las oraciones:** por defecto se incluyen los enunciados de los lemas identificados, con traducción únicamente cuando el lema no pertenece al vocabulario exigible para esa unidad. El profesor puede revisar los términos no identificados, importar su vocabulario y modificar el glosario. No se asignan lemas o traducciones ficticios.

**Bancos pendientes:** no existe todavía un corpus cerrado de preguntas de cultura de Latín 4.º ESO. En su lugar se presenta una advertencia, sin inventar preguntas. Las cifras de oraciones son objetivos: si el banco verificado contiene menos, el examen muestra las disponibles y señala la carencia. Los pronombres de Latín I usan una selección de formas explícitas, limitada al temario de cada unidad. Los bancos Morpheus y AGLDT todavía no están integrados.

## Lematización offline latina y griega

La edición autónoma incorpora un **lematizador de consulta** para los lemas del vocabulario docente, alimentado por UniMorph y modelos explícitos de las dos lenguas. En «Laboratorio y consulta morfológica» permite buscar una forma o ver las flexiones registradas de un lema, incluso sin Internet. Conserva **todos los análisis posibles** en las coincidencias ambiguas y muestra las etiquetas originales.

El índice se genera desde una instantánea fijada de `VocabulaLatinaGraecaque` y se incluye dentro de `offline.html`; no afecta automáticamente a la selección de respuestas de los exámenes.

La consulta diferencia ahora las **formas documentadas**, las **propuestas de flexión regular latina aún sin verificar** y las **formas de cita del vocabulario** que no disponen de paradigma. Las propuestas nunca alimentan los solucionarios ni la identificación del vocabulario final. Consulta [las fuentes, licencias y limitaciones](docs/lematizacion-offline.md).

## Versión autónoma para usar sin Internet

**Alternativa de archivo único:** [`offline.html`](./offline.html). En GitHub, abre ese enlace y pulsa **Download raw file**. Guarda el archivo en el ordenador y ábrelo con doble clic en un navegador. No necesitas instalar programas, iniciar un servidor ni conectarte a Internet.

1. Descarga `offline.html` cuando tengas conexión. Guárdalo, por ejemplo, en Documentos.
2. Desconecta Internet y abre ese mismo archivo.
3. Selecciona el curso, las unidades y el modelo; genera e imprime o descarga el examen en Word.
4. Utiliza las opciones de **exportar datos/borradores a JSON** para guardar copias de seguridad: el almacenamiento del navegador en páginas `file://` puede variar según navegador, carpeta u ordenador.

`offline.html` incluye toda la interfaz, el vocabulario y los paradigmas escolares de los tres cursos. Incluye también **16.988 formas latinas de UniMorph para consulta morfológica**, procedentes del archivo local `data/unimorph/lat-v.json`. Esas formas no se incorporan automáticamente a preguntas con soluciones sin la validación necesaria. El banco griego sigue siendo el ya incorporado en la webapp: **Morpheus y AGLDT aún no están integrados**.

`index.html` continúa siendo la interfaz de la web publicada. Puede utilizar archivos locales adicionales si el servidor los ofrece; `offline.html` es la versión empaquetada en un solo archivo y sin consultas de red al abrirse desde el disco.

### Mantenimiento y comprobación

Para recrear `offline.html` desde el código del proyecto, ejecuta `npm run offline:build`. Para comprobar que el archivo distribuido corresponde al código y a los datos locales, ejecuta `npm run offline:test` (requiere Node.js; **el usuario final no necesita Node.js**); las pruebas se ejecutan también en Chromium desde GitHub Actions.

## Funcionalidad actual (prototipo v21)

- Cursos separados: Latín 4.º ESO, Latín I y Griego I.
- Tres modelos para Latín I y Griego I (completo, morfología, traducción); Latín 4.º de ESO solo presenta el modelo completo.
- Selección de trimestre, unidades y vocabulario acumulativo.
- Interfaz en castellano y valenciano.
- Bancos de vocabulario y oraciones; edición e importación.
- Gestor del vocabulario exigible por curso y unidad.
- Regla para el vocabulario final: enunciado de cada lema utilizado, traducción solo si no pertenece al vocabulario exigible acumulado.
- Cultura restringida a Latín 4.º ESO (pendiente de recibir los temas cerrados).
- Guardado y recuperación local de borradores, deshacer la última generación y exportación/importación de borradores JSON.
- Exportación experimental a Word (.docx), con plantilla de Palatino Linotype 10,5 pt, enunciados en cursiva y vocabulario final en dos columnas.

## Limitaciones y trabajo pendiente

**No se debe considerar una herramienta de evaluación validada todavía.** El motor morfológico es parcial; no están integrados Collatinus, Morpheus ni Eulexis, y la generación de formas del griego ático politónico sigue pendiente. Hay que comprobar manualmente las formas, el vocabulario final y la maquetación de los documentos Word.

## Privacidad y funcionamiento local

El prototipo no requiere servidor de aplicaciones ni llamadas a servicios externos para generar los exámenes. Los datos de usuario se almacenan localmente cuando el navegador lo permite. Se recomienda exportar copias de seguridad JSON periódicas.

## Licencias y fuentes

El vocabulario incluido procede de materiales docentes aportados al proyecto. Antes de incorporar diccionarios o bases morfológicas de terceros se revisarán sus condiciones de licencia y redistribución. **No se ha asignado aún una licencia de código abierto al repositorio**.

## Arquitectura y comprobaciones de la webapp

- `index.html`: única fuente de la interfaz pública de GitHub Pages. No precisa servidor de aplicaciones para generar exámenes.
- `offline.html`: versión de un solo archivo para abrir desde el navegador sin conexión, generada a partir de `index.html` y los bancos locales; no es un programa nativo.
- `data/`: corpus y recursos del generador; `scripts/`: construcción del HTML autónomo y pruebas. No se usan Tauri, Rust ni un empaquetador nativo.
- `npm run offline:build`: reconstruye el archivo autónomo; `npm run offline:test`: verifica su reproducibilidad, integridad y sintaxis; `node scripts/test-exam-models.cjs`: comprueba las siete modalidades; `npm run preview:test`: comprueba en Chromium ambos HTML, formato, impresión y DOCX (requiere Playwright y Chromium).
- GitHub Actions ejecuta las comprobaciones automáticas en las solicitudes de cambios y después de actualizar `main`. La publicación se efectúa mediante el flujo de GitHub Pages.

La compatibilidad con Safari/WebKit, las descargas DOCX, la impresión, los borradores y `file://` son **funciones necesarias de la webapp**; se mantienen aunque inicialmente se probaran en un contexto de escritorio.

## Historial de mejoras de la interfaz

### Revisión previa a la primera descarga (v15)

- Corregida la cursiva de las instrucciones en la vista previa y en Word.
- Ajustado el plazo de liberación de los archivos descargables para reducir fallos en WebKit.
- Añadida una comprobación automática de sintaxis JavaScript y controles esenciales para detectar errores en la webapp.
- Probados en Chromium: carga de modelos, guardado/recuperación/deshacer borradores, exportación JSON y DOCX con y sin soluciones. El DOCX se ha renderizado para inspección visual.

### Revisión de interfaz v16

- Diseño más legible y coherente; controles agrupados, botones con foco visible y mejor contraste.
- Acciones rápidas de generar y descargar Word, accesibles al principio de la página.
- Vista previa desplazable en pantallas grandes y diseño adaptativo para móviles.
- Corregidos el texto de versión obsoleto y la descripción del origen del vocabulario en el pie de página.
- Pruebas locales con Chromium: carga sin errores, tres modelos, botones rápidos, guardado/recuperación de borradores con almacenamiento simulado, descargas DOCX válidas y ausencia de desbordamiento horizontal móvil.

### Interfaz v17 — colores por asignatura

- **Griego I:** azul griego; **Latín I:** ámbar/naranja; **Latín 4.º ESO:** amarillo dorado.
- El tema se actualiza al cambiar de curso; la impresión y los DOCX mantienen su formato académico sin fondos cromáticos.
- Evitada una generación duplicada al regresar desde el gestor de vocabulario.
- Pruebas locales con Chromium: cambio de tema en los tres cursos, generación de DOCX válido por curso, sin errores JavaScript ni desbordamiento horizontal en móvil.

### Motor inicial de morfología griega (v18)

- Griego I vuelve a permitir seleccionar los bloques **Declinación y concordancia** y **Formas verbales**.
- Se han incorporado tablas áticas explícitas de **10 sustantivos** (casos, singular y plural) y **3 verbos** (presente de indicativo activo, seis personas), con soluciones.
- Solo se generan formas de lemas expresamente cubiertos por las tablas. Si las unidades seleccionadas no contienen entradas cubiertas, se muestra un aviso en lugar de inventar formas.
- **Limitación importante:** esto no constituye un motor morfológico general. Siguen pendientes artículo, adjetivos, tercera declinación, verbos contractos, irregularidades y validación didáctica completa contra los materiales de clase.

### Revisión v19

- Motor de ejercicios de griego con paradigmas explícitos, normalización de lemas y aviso cuando no hay formas disponibles.
- Mejoras de accesibilidad: foco visible, botones desactivados y preferencia de movimiento reducido.
- Pruebas en Chromium: carga sin errores JavaScript, cambio de curso, generación de ejercicios griegos y exportación de DOCX válido para los tres cursos.

### Griego I v20 — modalidades y corpus docente

- Selector propio de Griego I: **Examen completo** (predeterminado), **Análisis, traducción y etimología** y **Solo morfología**. Los modelos de los cursos de Latín se conservan.
- Selección independiente de una, dos o varias unidades entre UD0 y UD14. La cabecera muestra las unidades marcadas; la gramática y el vocabulario exigible se acumulan hasta la más avanzada.
- Reserva de ejercicios que representan cada unidad seleccionada cuando existe material verificado para la modalidad. Si es necesario, se amplía el número solicitado. Se muestran las lagunas y la escasez de material; nunca se crean ejercicios para rellenarlas.
- Corpus cerrado de los ejemplos docentes UD3–4 y UD7, combinado con los paradigmas explícitos de v19. Se excluyen formas con anomalías y verbos pendientes de revisión. Las oraciones con tercera declinación requieren UD8.
- Etimología con petición de derivados, tablas nominales y verbales, análisis de formas y concordancia, y tabla de pronombres. Las tablas completas de concordancia esperan paradigmas validados.
- Puntuaciones editables: modelos de referencia sobre 10, 9 y 3,5, respectivamente. Solo suman los apartados que contienen ejercicios; se indica la conversión a 10.
- Vocabulario exigible integrado desde los materiales aportados, con los bloques UDs1–4 y UDs6–7 sin distribución arbitraria entre unidades. Se exigen desde UD4 y UD7. El gestor permite revisarlos y editarlos.
- Exportación DOCX con espacios de respuesta conservados, interfaz HTML autónoma y colores por curso.

Detalles de procedencia, exclusiones y límites: [`data/greek1-validation.md`](data/greek1-validation.md). El banco aún no cubre todas las unidades ni todos los paradigmas del curso.



### Maquetación de Griego I v21 — referencia UD3–4

Se reproduce el diseño académico del PDF aportado: Palatino 10,5 pt, cabecera editable en dos párrafos con bordes (sin tabla ni imagen), título y evaluación en la primera línea y nombre y fecha en la segunda.

Las tablas de declinación incorporan el artículo y el lema en una fila superior combinada, con la esquina superior izquierda abierta, casos a la derecha y casillas sin sombreado. Los verbos comparten tabla, cada uno con sus columnas de singular y plural. Los apartados conservan numeración y letras; se deja espacio en blanco para responder, sin líneas añadidas. En el examen completo, etimología y traducción comienzan en una página nueva. El vocabulario mantiene dos columnas y el pie incluye página y total.

El formato se aplica a la vista previa, impresión/PDF y exportación DOCX de Griego I. Los documentos siguen siendo editables; el corpus y los criterios de selección de v20 se conservan. La extensión aumenta cuando se solicitan más ejercicios o unidades. La referencia UD3–4 se ha comprobado en dos páginas tanto desde el navegador como desde Word renderizado.


Ajuste actual de márgenes: 3 cm a la derecha y 2,5 cm arriba, izquierda y abajo, en impresión y Word. Más espacio superior en la cabecera; tablas ajustadas al ancho disponible.
