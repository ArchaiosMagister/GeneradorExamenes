# Optimización 2/6 — gestor del vocabulario exigible

PR encadenada a #140, sin modificar fuentes, glosas ni criterios de exigibilidad.

## Cuello de botella identificado
El gestor recalculaba `vmUnits(course)` para cada fila, y cada invocación volvía a recorrer el vocabulario docente y las entradas exigibles. Una tabla con 80 resultados creaba 80 colecciones de unidades y añadía las filas directamente al DOM de forma repetida.

## Cambio
`render()` efectúa una sola pasada para filtrar y contar, obtiene la lista de unidades **una vez por actualización** y clona una única plantilla de selector de unidad. Construye todas las filas en un `DocumentFragment` y sustituye el contenido visible con una sola operación. Mantiene en cada elemento los índices originales para edición, movimiento de unidad, búsqueda, traducción y eliminación.

## Verificación
Las regresiones del glosario ejecutan un caso temporal con 80 filas, búsqueda en vivo, corrección de traducción, cambio de unidad y restauración de la lista original, verificando que no se alteren los exigibles almacenados. Las baterías generales cubren Word/PDF, tres asignaturas y PWA.

No se ha aplicado paginación ni debounce al buscador, evitando cambios de semántica de teclado y accesibilidad.
