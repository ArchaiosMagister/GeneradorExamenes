# Optimización 6/6 — primer módulo de interfaz desacoplado

La página principal `index.html` conserva la lógica académica, pero también alojaba widgets independientes. Se ha extraído el IIFE completo `setupExamVisualSummary` a `exam-selection-summary.js`, conservando literalmente su código y sus escuchadores.

## Integración sin divergencias

- `index.html` carga el módulo externo con `defer`; no se cambia el comportamiento, la configuración ni la estructura de preguntas.
- `scripts/build-offline.mjs` inserta el mismo código en el HTML autónomo como script local, sin depender de red.
- `sw.js` precarga el módulo, y `publish-online.yml` lo incluye explícitamente en el artefacto de GitHub Pages.
- Las pruebas de PWA exigen la presencia del widget y del archivo en la caché. También verifican que el empaquetado de publicación incluya el módulo, evitando páginas en blanco por assets omitidos.

Esta es una **extracción gradual** de una pieza independiente, no una reescritura del archivo principal de aproximadamente 667 KiB. Se podrían migrar otros componentes más adelante, cada uno con pruebas propias. No se trasladan bancos filológicos, datos ni generadores de examen.

## Publicación

La PR es apilada sobre las anteriores y está pendiente de autorización. No se ha fusionado ninguna rama a `main`.
