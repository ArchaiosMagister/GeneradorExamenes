# Optimización 1 — edición de oraciones y glosario

PR encadenada a #139, sin desplegar. No cambia las fuentes filológicas ni los identificadores.

- La sincronización del editor de oraciones evita escribir texto de DOM idéntico y evita reserializar borradores cuando el contenido no cambia.
- En textos de 400 caracteres o más, la vista del enunciado y el almacenamiento se actualizan de forma inmediata; el análisis del glosario se agrupa durante 110 ms, evitando analizar por separado cada tecla de una ráfaga.
- Los textos breves y los cambios de filtros, decisiones sobre homógrafos o pasivas conservan la actualización inmediata.
- Las exportaciones Word/PDF y las instantáneas JSON vacían de forma síncrona cualquier actualización pendiente antes de tomar el examen.
- Los controles existentes de revisión filológica siguen activos, y no se regenera ninguna pregunta que no sea el glosario.
- Se amplían las pruebas de navegador para comprobar el comportamiento con una oración larga, su persistencia inmediata y la exportación sin demora.

La cifra de 110 ms es una ventana de agrupación, **no** un requisito de red y no afecta al funcionamiento offline.

## Condiciones de integración

Comprobar cinco baterías CI, incluida la versión autónoma, el PDF y el Word, y no fusionar hasta autorización del docente.
