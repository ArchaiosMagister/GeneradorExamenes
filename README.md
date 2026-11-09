# Generador de exámenes de Latín y Griego

Prototipo experimental de un generador de exámenes para **Latín de 4.º de ESO, Latín I y Griego I**.

## Probar la aplicación

1. Descarga el archivo [`index.html`](./index.html) desde GitHub (opción **Download raw file**).
2. Ábrelo en un navegador moderno.
3. Configura el curso, el trimestre, las unidades y el modelo de examen.
4. Genera el examen y prueba la exportación a Word (.docx).

**La aplicación está diseñada para funcionar completamente sin Internet**: el archivo HTML incorpora el código y los datos que necesita el prototipo. Los cambios guardados en el almacenamiento del navegador pueden no trasladarse automáticamente a otros ordenadores o a otro origen web; usa las copias de seguridad JSON.

## Funcionalidad actual (prototipo v20)

- Cursos separados: Latín 4.º ESO, Latín I y Griego I.
- Tres modelos de examen y bloques de preguntas configurables.
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

Se ha incorporado una estructura experimental de escritorio con **Tauri 2 y Rust** para macOS Apple Silicon; todavía no se ha verificado un paquete `.app` compilado.

## Privacidad y funcionamiento local

El prototipo no requiere servidor de aplicaciones ni llamadas a servicios externos para generar los exámenes. Los datos de usuario se almacenan localmente cuando el navegador lo permite. Se recomienda exportar copias de seguridad JSON periódicas.

## Licencias y fuentes

El vocabulario incluido procede de materiales docentes aportados al proyecto. Antes de incorporar diccionarios o bases morfológicas de terceros se revisarán sus condiciones de licencia y redistribución. **No se ha asignado aún una licencia de código abierto al repositorio**.

## Aplicación de macOS (Apple Silicon) — experimental

Se ha añadido un proyecto **Tauri 2 + Rust** para empaquetar la misma interfaz web como aplicación de escritorio. La compilación está configurada para **Apple Silicon (aarch64)**, con nombre **Generador de Exámenes Latín y Griego**.

### Compilar desde GitHub Actions (sin instalar Rust en el Mac)

1. En GitHub, abre la pestaña **Actions** del repositorio.
2. Selecciona **Compilar aplicación para Mac (Apple Silicon)**.
3. Pulsa **Run workflow** y selecciona la rama `main`.
4. Cuando termine correctamente, abre la ejecución y descarga el artefacto **GeneradorExamenes-Mac-AppleSilicon**.
5. Descomprime el ZIP obtenido y mueve el archivo `.app` a **Aplicaciones**.

La compilación solo se ejecuta al pulsar **Run workflow** manualmente. No se compila automáticamente al actualizar el código. Si GitHub Actions está deshabilitado en el repositorio privado, tendrás que habilitarlo en los ajustes del repositorio.

**Advertencia:** la aplicación todavía no está firmada ni notarizada. macOS puede bloquear la primera apertura. Consulta la opción **Abrir igualmente** en Ajustes del Sistema → Privacidad y seguridad si confías en la compilación que has descargado. No desactives Gatekeeper globalmente.

**Estado de las pruebas:** se ha preparado la configuración y el flujo de compilación, pero aún no se ha verificado una compilación correcta en macOS ni la exportación DOCX dentro del WebView de Tauri. Es una versión experimental. Los borradores guardados en el navegador no se migran automáticamente a la aplicación: expórtalos a JSON antes de cambiar.

### Estructura del proyecto

- `index.html`: aplicación web autónoma (se mantiene como fuente única).
- `scripts/prepare-desktop.mjs`: copia la interfaz a `web/index.html` antes de compilar.
- `src-tauri/`: núcleo Rust y configuración de Tauri 2.
- `.github/workflows/mac-app.yml`: compilación automatizada y empaquetado ZIP.

Para compilar localmente, instala Node.js, Rust y las dependencias de Tauri para macOS, y ejecuta `npm install` seguido de `npm run desktop:build`.

### Revisión previa a la primera descarga (v15)

- Corregida la cursiva de las instrucciones en la vista previa y en Word.
- Ajustado el plazo de liberación de los archivos descargables para reducir fallos en WebKit.
- Eliminadas las referencias a iconos de Tauri aún no suministrados; el icono definitivo está pendiente.
- Añadida una comprobación automática de sintaxis JavaScript y controles esenciales antes de compilar.
- Probados en Chromium: carga de modelos, guardado/recuperación/deshacer borradores, exportación JSON y DOCX con y sin soluciones. El DOCX se ha renderizado para inspección visual.
- **Pendiente:** verificar la compilación real de GitHub Actions y las descargas desde el WebView de macOS. No se debe considerar la aplicación lista para distribución hasta superar estas pruebas.

### Revisión de interfaz v16 (sin compilación)

- Diseño más legible y coherente; controles agrupados, botones con foco visible y mejor contraste.
- Acciones rápidas de generar y descargar Word, accesibles al principio de la página.
- Vista previa desplazable en pantallas grandes y diseño adaptativo para móviles.
- Corregidos el texto de versión obsoleto y la descripción del origen del vocabulario en el pie de página.
- Pruebas locales con Chromium: carga sin errores, tres modelos, botones rápidos, guardado/recuperación de borradores con almacenamiento simulado, descargas DOCX válidas y ausencia de desbordamiento horizontal móvil.
- **La compilación macOS queda desactivada automáticamente** y solo se iniciará manualmente cuando se decida probarla.

### Interfaz v17 — colores por asignatura

- **Griego I:** azul griego; **Latín I:** ámbar/naranja; **Latín 4.º ESO:** amarillo dorado.
- El tema se actualiza al cambiar de curso; la impresión y los DOCX mantienen su formato académico sin fondos cromáticos.
- Evitada una generación duplicada al regresar desde el gestor de vocabulario.
- Pruebas locales con Chromium: cambio de tema en los tres cursos, generación de DOCX válido por curso, sin errores JavaScript ni desbordamiento horizontal en móvil.
- La compilación de macOS sigue configurada como **solo manual**; no se ha iniciado en esta revisión.

### Motor inicial de morfología griega (v18)

- Griego I vuelve a permitir seleccionar los bloques **Declinación y concordancia** y **Formas verbales**.
- Se han incorporado tablas áticas explícitas de **10 sustantivos** (casos, singular y plural) y **3 verbos** (presente de indicativo activo, seis personas), con soluciones.
- Solo se generan formas de lemas expresamente cubiertos por las tablas. Si las unidades seleccionadas no contienen entradas cubiertas, se muestra un aviso en lugar de inventar formas.
- **Limitación importante:** esto no constituye un motor morfológico general. Siguen pendientes artículo, adjetivos, tercera declinación, verbos contractos, irregularidades y validación didáctica completa contra los materiales de clase.
- Esta revisión no inicia ninguna compilación de macOS; el flujo permanece manual.

### Revisión v19

- Motor de ejercicios de griego con paradigmas explícitos, normalización de lemas y aviso cuando no hay formas disponibles.
- Mejoras de accesibilidad: foco visible, botones desactivados y preferencia de movimiento reducido.
- Pruebas en Chromium: carga sin errores JavaScript, cambio de curso, generación de ejercicios griegos y exportación de DOCX válido para los tres cursos.
- **Limitaciones:** no se han verificado todos los paradigmas del temario ni se ha probado el WebView de macOS. La compilación sigue siendo manual y no se ha ejecutado.

### Griego I v20 — modalidades y corpus docente

- Selector propio de Griego I: **Examen completo** (predeterminado), **Análisis, traducción y etimología** y **Solo morfología**. Los modelos de los cursos de Latín se conservan.
- Selección independiente de una, dos o varias unidades entre UD0 y UD14. La cabecera muestra las unidades marcadas; la gramática y el vocabulario exigible se acumulan hasta la más avanzada.
- Reserva de ejercicios que representan cada unidad seleccionada cuando existe material verificado para la modalidad. Si es necesario, se amplía el número solicitado. Se muestran las lagunas y la escasez de material; nunca se crean ejercicios para rellenarlas.
- Corpus cerrado de los ejemplos docentes UD3–4 y UD7, combinado con los paradigmas explícitos de v19. Se excluyen formas con anomalías y verbos pendientes de revisión. Las oraciones con tercera declinación requieren UD8.
- Etimología con petición de derivados, tablas nominales y verbales, análisis de formas y concordancia, y tabla de pronombres. Las tablas completas de concordancia esperan paradigmas validados.
- Puntuaciones editables: modelos de referencia sobre 10, 9 y 3,5, respectivamente. Solo suman los apartados que contienen ejercicios; se indica la conversión a 10.
- Vocabulario exigible integrado desde los materiales aportados, con los bloques UDs1–4 y UDs6–7 sin distribución arbitraria entre unidades. Se exigen desde UD4 y UD7. El gestor permite revisarlos y editarlos.
- Exportación DOCX con espacios de respuesta conservados. HTML autónomo, colores por curso y estructura Tauri conservados. **No se ha iniciado ninguna compilación para Mac.**

Detalles de procedencia, exclusiones y límites: [`data/greek1-validation.md`](data/greek1-validation.md). El banco aún no cubre todas las unidades ni todos los paradigmas del curso.

Validación: `node scripts/check-web.mjs` y `node scripts/test-greek-ui.cjs` (requiere Playwright y un navegador instalado; admite `PLAYWRIGHT_PATH` y `BROWSER_PATH`). Se comprueban 300 generaciones aleatorias, modalidades, límites gramaticales, cobertura disponible, puntuaciones, borradores, idiomas, móvil, colores y nueve descargas DOCX. Los documentos se verifican como ZIP/XML y se renderizan para revisar su maquetación. La exportación en el WebView de macOS sigue pendiente.
