# Generador de exámenes de Latín y Griego

Generador de exámenes para **Latín de 4.º de ESO, Latín I y Griego I**, con edición, solucionarios, exportación y trabajo sin conexión.

## Probar la versión online

La aplicación está disponible en [GitHub Pages](https://archaiosmagister.github.io/GeneradorExamenes/).
La publicación requiere una ejecución satisfactoria de la CI obligatoria para el commit autorizado de `main`.
El archivo `offline.html` ofrece una distribución de un solo fichero.

## Webapp instalable y uso sin conexión (PWA)

La versión web **puede funcionar sin Internet después de una primera visita con conexión**. No es una aplicación de escritorio ni requiere descargar un instalador:

1. Abre [el generador online](https://archaiosmagister.github.io/GeneradorExamenes/) con Internet y mantén la página abierta hasta que aparezca **«Preparada para funcionar sin conexión»**.
2. A partir de ese momento puedes volver a abrir la misma dirección sin conexión desde ese navegador y dispositivo. La caché incluye la interfaz, el banco latino UniMorph, el índice del lematizador de latín y griego y la versión alternativa `offline.html`.
3. Si el navegador lo permite, pulsa **Instalar** o utiliza el menú de instalación / «Añadir a pantalla de inicio» (Safari en iPhone o iPad: **Compartir → Añadir a pantalla de inicio**). La instalación es opcional.
4. Cuando se publique una actualización, aparecerá **«Preparar actualización»**. Puedes mantener el examen abierto sin perder las modificaciones. Para cargar el código nuevo, guarda o exporta primero el borrador y pulsa **«Recargar versión nueva»**.
5. Usa **Copia de datos** y **Exportar examen** para guardar archivos JSON separados. La caché PWA **no sustituye a una copia de seguridad**: si borras los datos del sitio o cambias de dispositivo/navegador, podrías perder borradores y contenido añadido. Puedes solicitar **Proteger almacenamiento** cuando el navegador ofrezca esa función, sin garantía de concesión.

**Nota:** la primera carga necesita conexión y que el navegador admita service workers (habitualmente HTTPS, o localhost durante desarrollo). Al abrir `offline.html` desde el disco mediante `file://` se cargan los recursos integrados en el archivo. La gestión de caché mediante service worker pertenece a la PWA. Si el navegador bloquea el almacenamiento del sitio, utiliza `offline.html` y exporta tus datos regularmente.

La actualización del service worker se versiona con el SHA del despliegue en GitHub Pages; los recursos se guardan de forma conjunta para evitar versiones mezcladas. No se envían borradores ni vocabulario del usuario a un servidor: permanecen en el almacenamiento local del navegador.

## Copia de seguridad unificada · Fase IV

En la sección **Generación de exámenes**, abre **Copia de seguridad unificada · Fase IV** para exportar un solo JSON con el borrador visible, las decisiones filológicas y los demás datos locales del docente. Al importar se añaden únicamente registros ausentes y se conservan los conflictos. Consulta la [guía de recuperación](docs/copia-unificada-fase-iv.md).

## Estructura académica de los exámenes (versión actual)

El **nombre del modelo** (completo, morfología o traducción) no sustituye el título académico de la cabecera: `Examen de Latín I – UDs 2–3`, por ejemplo.

| Curso y modelo | Apartados |
| --- | --- |
| Latín 4.º ESO · completo | Tablas de declinación; tabla para conjugar; análisis de formas variables; **2** apartados de léxico (a, b); **4** preguntas de cultura (a–d), cuando existan en el banco; **5** huecos por defecto; vocabulario de las oraciones |
| Latín I · completo | Declinación, conjugación, análisis de formas variables, **3** apartados de léxico (a–c), **5** huecos para oraciones por defecto y vocabulario de oraciones |
| Latín I · morfología | Tablas de declinación, tabla de análisis verbal, tabla de pronombres a partir de la unidad correspondiente y análisis de palabras variables |
| Latín I · traducción | Análisis de formas variables, **3** apartados de léxico, **7** oraciones por defecto y vocabulario de oraciones |
| Griego I · completo | **1. Comprensión morfosintáctica:** elegir tres de hasta cinco alternativas (declinación, análisis morfológico, cambio de número, retroversión, conjugación); **2. Plurilingüismo:** elegir una de dos (derivados o étimos de palabras subrayadas); **3. Oraciones** (5 huecos por defecto) y vocabulario |
| Griego I · morfología | Declinación, análisis verbal, pronombres desde UD7 y palabras variables, excluidas las invariables |

**Preguntas optativas de Griego I:** el modelo completo agrupa las actividades en tres preguntas puntuables, con reparto inicial **3 + 1 + 6 = 10 puntos**, editable desde el editor. En Comprensión morfosintáctica, el enunciado adapta automáticamente el número de respuestas exigidas cuando se desactivan alternativas (máximo tres); en Plurilingüismo se elige una de dos. Cambio de número y retroversión incluyen cuatro sintagmas por defecto, cantidades ajustables, edición y sustitución individual. Las oraciones con étimos utilizan exclusivamente raíces ya incluidas en las unidades estudiadas y se exportan con subrayados en Word. La gramática es acumulativa: artículo desde UD3, preposiciones desde UD4, adjetivos desde UD5 y pronombres desde UD7. El modelo de morfología se conserva como prueba parcial independiente. En el modelo completo, el apartado Oraciones permite escoger el enunciado «Analiza y traduce» o «Traduce». Los borradores del antiguo modelo de traducción se abren en el modelo completo con «Traduce» seleccionado.

**Vocabulario de las oraciones:** el glosario se actualiza al escribir una oración en la vista previa o en el campo del apartado Oraciones. Por defecto incluye los enunciados de los lemas identificados, excepto las preposiciones, con traducción únicamente para el vocabulario ajeno a la lista exigible acumulada. El profesor puede revisar los términos no identificados, importar su vocabulario y modificar el glosario. No se asignan lemas o traducciones ficticios.

En **Revisión del vocabulario**, pulsa **Proponer lecturas con Collatinus** en latín o **Proponer lecturas con Eulexis** en griego. Collatinus usa su etiquetador contextual y la forma de cada aparición. Eulexis contrasta forma y diacríticos. Ambos proponen fichas del glosario para confirmar individualmente o en lote. Seleccionar **Dejar pendiente** conserva la duda. Tras confirmar se aplican las glosas docentes y las reglas de vocabulario exigible que correspondan.

Cuando termines de editar las oraciones, **Completar glosario con Collatinus / Eulexis** aplica las lecturas que puede identificar para cada aparición pendiente, incluidas palabras ajenas al banco. Collatinus propone una lectura única o respaldada por el contexto. Eulexis requiere una coincidencia gráfica inequívoca. Las ambigüedades restantes se pueden revisar individualmente. Las elecciones automáticas se pueden revisar con **Cambiar**. Se mantienen las decisiones manuales y el texto original de las oraciones.

La consulta reutiliza los análisis durante la sesión. Los lectores se ejecutan en el navegador. Collatinus descarga el léxico y sus tablas de etiquetas al solicitarlos por primera vez. En griego se usa el índice personal de Eulexis si está instalado. En su ausencia, se cargan los fragmentos léxicos pertinentes del lector. El texto completo de las oraciones permanece en el navegador.

**Cultura de Latín 4.º de ESO:** 73 preguntas docentes en ocho unidades, con enunciados en castellano y valenciano. El sorteo respeta las unidades elegidas y el modelo completo adapta la puntuación cuando no corresponde incluir Cultura. El apartado de oraciones empieza con huecos numerados. Escribe una oración por línea en el campo de texto o edita su hueco en la vista previa. Los pronombres de Latín I usan una selección de formas explícitas, limitada al temario de cada unidad. Los bancos Morpheus y AGLDT todavía no están integrados.

**En Latín 4.º de ESO**, el menú «Preguntas y cantidades» permite incluir «Declinación y género» desde UD1 y «Temas de tercera declinación» y «Tabla de tercera declinación» desde UD5. En la tabla se pueden incluir adjetivos desde UD6, de acuerdo con las fichas de cada unidad. Las tres preguntas se activan por separado y tienen puntuación inicial de 0 puntos, editable en el menú de puntuación.

## Lematización offline latina y griega

La edición autónoma incorpora un **lematizador de consulta** para los lemas del vocabulario docente, alimentado por UniMorph y modelos explícitos de las dos lenguas. En «Laboratorio y consulta morfológica» permite buscar una forma o ver las flexiones registradas de un lema, incluso sin Internet. Conserva todos los análisis registrados para la clave de búsqueda y muestra sus etiquetas originales. En griego muestra primero las coincidencias con los diacríticos escritos.

El índice se genera desde una instantánea fijada de `VocabulaLatinaGraecaque` y se incluye dentro de `offline.html`; no afecta automáticamente a la selección de respuestas de los exámenes.

La **consulta** muestra las formas de cita, los registros documentados y las candidaturas. La
**generación evaluable** utiliza los bancos y reglas curriculares del curso. Las propuestas que
admiten autorización docente requieren una decisión explícita para cada análisis y conservan
su procedencia. Una lectura contextual del glosario tampoco habilita formas para el sorteo.
Consulta [el control de evidencia](docs/control-evidencia-academica.md) y
[las fuentes del índice](docs/lematizacion-offline.md).

## Versión autónoma para usar sin Internet

**Alternativa de archivo único:** [`offline.html`](./offline.html). En GitHub, abre ese enlace y pulsa **Download raw file**. Guarda el archivo en el ordenador y ábrelo con doble clic en un navegador. No necesitas instalar programas, iniciar un servidor ni conectarte a Internet.

1. Descarga `offline.html` cuando tengas conexión. Guárdalo, por ejemplo, en Documentos.
2. Desconecta Internet y abre ese mismo archivo.
3. Selecciona el curso, las unidades y el modelo; genera e imprime o descarga el examen en Word o PDF.
4. Utiliza las opciones de **exportar datos/borradores a JSON** para guardar copias de seguridad: el almacenamiento del navegador en páginas `file://` puede variar según navegador, carpeta u ordenador.

`offline.html` incluye toda la interfaz, el vocabulario y los paradigmas escolares de los tres cursos. Incluye también **16.988 formas latinas de UniMorph para consulta morfológica**, procedentes del archivo local `data/unimorph/lat-v.json`. Esas formas no se incorporan automáticamente a preguntas con soluciones sin la validación necesaria. El banco griego sigue siendo el ya incorporado en la webapp: **Morpheus y AGLDT aún no están integrados**.

`index.html` continúa siendo la interfaz de la web publicada. Puede utilizar archivos locales adicionales si el servidor los ofrece; `offline.html` es la versión empaquetada en un solo archivo y arranca desde el disco sin conexiones externas. Las consultas opcionales solicitadas a los lectores pueden necesitar Internet.

### Mantenimiento y comprobación

Para recrear `offline.html` desde el código del proyecto, ejecuta `npm run offline:build`. Para comprobar que el archivo distribuido corresponde al código y a los datos locales, ejecuta `npm run offline:test` (requiere Node.js; **el usuario final no necesita Node.js**); las pruebas se ejecutan también en Chromium desde GitHub Actions.

## Edición, puntuación y exportación

- Se pueden elegir unidades aisladas o combinadas, de forma acumulativa o por selección explícita.
- La vista previa y los controles permiten editar enunciados, oraciones y otros elementos. Guarda un borrador antes de regenerar un examen completo.
- El control de exportación definitiva comprueba el total de 10 puntos en los exámenes completos. Las pruebas parciales de morfología conservan su baremo independiente.
- Word (.docx) permite descargar la hoja del alumnado y un documento con soluciones. La opción PDF exporta la hoja del alumnado. Los nombres se forman a partir del curso, las unidades elegidas, el tipo de documento y el idioma.
- Las decisiones y los exámenes se guardan localmente. Usa la copia unificada JSON para trasladarlos entre navegadores o dispositivos.

## Límites de cobertura

La cantidad de formas disponibles depende de la unidad, las cuotas y las exclusiones docentes.
Una combinación con un banco insuficiente puede generar un aviso. Los modelos de examen
incluyen huecos para que el docente añada sus propias oraciones.

La consulta local se basa en el temario y puede dejar formas sin identificar. Las glosas
externas pueden requerir revisión y traducción. Los lectores descargan recursos léxicos
cuando se solicita su uso. El análisis del texto se realiza en el navegador.
Consulta [cómo funcionan los lectores](docs/lematizacion-lectores.md).

## Licencias y fuentes

El vocabulario incluido procede de materiales docentes aportados al proyecto. Antes de incorporar diccionarios o bases morfológicas de terceros se revisarán sus condiciones de licencia y redistribución. **No se ha asignado aún una licencia de código abierto al repositorio**.

## Arquitectura y comprobaciones de la webapp

- `index.html`: única fuente de la interfaz pública de GitHub Pages. No precisa servidor de aplicaciones para generar exámenes.
- `offline.html`: versión de un solo archivo para abrir desde el navegador sin conexión, generada a partir de `index.html` y los bancos locales; no es un programa nativo.
- `data/`: corpus y recursos del generador; `scripts/`: construcción del HTML autónomo y pruebas. No se usan Tauri, Rust ni un empaquetador nativo.
- `npm run offline:build`: reconstruye el archivo autónomo; `npm run offline:test`: verifica su reproducibilidad, integridad y sintaxis; `node scripts/test-exam-models.cjs`: comprueba los modelos vigentes y las rutas de migración; `npm run preview:test`: comprueba en Chromium ambos HTML, formato, impresión y DOCX (requiere Playwright y Chromium).
- [Validación y publicación](docs/lanzamiento-1.0.md). GitHub Actions ejecuta las comprobaciones obligatorias en las PR y en `main`. La publicación manual utiliza el artefacto de esa misma ejecución.

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

## Integración experimental de las dos mejoras

La rama de integración incluye el **generador de vocabulario por unidades** de la PR 29 y las mejoras de configuración, Cultura de Latín 4.º, prefijos y fonética de la PR 30. El trabajo continúa en una PR de borrador independiente. El modo valenciano utiliza una capa de traducciones propia; no sustituye los significados castellanos del banco docente.

Lee [la guía del generador por unidades](docs/generador-vocabulario.md) y [el informe de optimización](docs/optimizacion-inicial-2026-11-10.md). Se revisarán los resultados en navegador, Word y PWA antes de fusionar.


## Criterios fonéticos homologados (12-11-2026)

Las cuatro decisiones sobre `seniorem`, `sensum`, `sponsam` y `sponsum` se han aplicado también a GeneradorExamenes, además de las reglas generales para *-ns- → -s-* (N15), *-um → -o* (N01) y la pérdida fija de *-m* (FIX_M, **no seleccionable** y distinta de N03). El banco de 655 palabras y las 73 fichas del programa de Latín I conservan sus étimos, resultados y estados. Se han incorporado validaciones automáticas para las fichas futuras, incluidas en el flujo de publicación. Véase `data/fonetica/criterios-docentes.mjs` y [el informe docente](docs/criterios-foneticos-2026-11-12.md).

Decisiones filológicas de Griego I: los paradigmas de ἀθάνατος, ἐχθρός y αἰσχρός se rigen por `data/lemmas/greek-adjective-decisions.json`. La aprobación docente del enunciado **no verifica automáticamente formas candidatas**. Véase `docs/revision-559-griego-20261113.md`.

**Actualización académica (13/11/2026, PR 105 sin publicar):** diez formas femeninas de `ἐχθρός, –ά, –όν` acreditadas individualmente en fuente 5; sincretismos conservados, sintagmas reactivados desde UD5, historial de 559 fichas preservado. Cierre funcional de fase IV documentado en `docs/fase-iv-20261113.md` (sin certificación masiva de formas pendientes).
