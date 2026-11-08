# Generador de exámenes de Latín y Griego

Prototipo experimental de un generador de exámenes para **Latín de 4.º de ESO, Latín I y Griego I**.

## Probar la aplicación

1. Descarga el archivo [`index.html`](./index.html) desde GitHub (opción **Download raw file**).
2. Ábrelo en un navegador moderno.
3. Configura el curso, el trimestre, las unidades y el modelo de examen.
4. Genera el examen y prueba la exportación a Word (.docx).

**La aplicación está diseñada para funcionar completamente sin Internet**: el archivo HTML incorpora el código y los datos que necesita el prototipo. Los cambios guardados en el almacenamiento del navegador pueden no trasladarse automáticamente a otros ordenadores o a otro origen web; usa las copias de seguridad JSON.

## Funcionalidad actual (prototipo v13)

- Cursos separados: Latín 4.º ESO, Latín I y Griego I.
- Tres modelos de examen y bloques de preguntas configurables.
- Selección de trimestre, unidades y vocabulario acumulativo.
- Interfaz en castellano y valenciano.
- Bancos de vocabulario y oraciones; edición e importación.
- Gestor del vocabulario exigible por curso y unidad.
- Regla para el vocabulario final: enunciado de cada lema utilizado, traducción solo si no pertenece al vocabulario exigible acumulado.
- Cultura restringida a Latín 4.º ESO (pendiente de recibir los temas cerrados).
- Exportación experimental a Word (.docx), con plantilla de Palatino Linotype 10,5 pt, enunciados en cursiva y vocabulario final en dos columnas.

## Limitaciones y trabajo pendiente

**No se debe considerar una herramienta de evaluación validada todavía.** El motor morfológico es parcial; no están integrados Collatinus, Morpheus ni Eulexis, y la generación de formas del griego ático politónico sigue pendiente. Hay que comprobar manualmente las formas, el vocabulario final y la maquetación de los documentos Word.

La futura versión de escritorio para macOS, Windows y Linux se estudiará con **Tauri y Rust**. Todavía no existe un paquete `.app` compilado en este repositorio.

## Privacidad y funcionamiento local

El prototipo no requiere servidor de aplicaciones ni llamadas a servicios externos para generar los exámenes. Los datos de usuario se almacenan localmente cuando el navegador lo permite. Se recomienda exportar copias de seguridad JSON periódicas.

## Licencias y fuentes

El vocabulario incluido procede de materiales docentes aportados al proyecto. Antes de incorporar diccionarios o bases morfológicas de terceros se revisarán sus condiciones de licencia y redistribución. **No se ha asignado aún una licencia de código abierto al repositorio**.
