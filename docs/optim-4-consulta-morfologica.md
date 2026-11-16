# Optimización 4/6 — consulta morfológica indexada

Ámbito: buscador de formas y lemas UniMorph de la interfaz, no generador curricular de preguntas.

## Antes
Cada consulta al shard `data/unimorph/lookup/{lang}/{modo}-*.json` filtraba todas sus filas en memoria. También se construía el array combinado de formas por idioma para buscar una sola y la deduplicación final utilizaba un `findIndex` repetido (coste cuadrático en el número de coincidencias).

## Después
- Cada shard se convierte una sola vez en un mapa de forma/lema normalizado a filas originales. Los análisis y su orden de fuente se conservan.
- Se mantiene una caché LRU de **12 shards** como límite, para no retener indefinidamente grandes corpus en memoria de Safari/iPad.
- Los conjuntos UniMorph integrados se indexan una sola vez por referencia de banco, en ambas direcciones (forma y lema), con `WeakMap`.
- La deduplicación por `headword`, `surface` y `features` utiliza `Set`, preservando la primera coincidencia.
- La consulta IndexedDB y el comportamiento de respaldo offline mantienen su lógica anterior.

## Regresiones
La prueba de navegador consulta forma latina `puella` y lema griego `λόγος`, contrasta resultados idénticos entre consultas repetidas, ausencia de duplicados y presencia de casos flexivos documentados. Las cinco baterías generales deben aprobarse antes de integrar.

No se modifica ningún corpus, fuente filológica, evidencia ni exigibilidad.
