# Optimización 5/6 — instalación y actualización PWA

## Hallazgo

El service worker descargaba de nuevo todos los archivos precargados en cada actualización mediante `Request({cache:'reload'})`, aunque algunos bancos académicos de gran tamaño fueran idénticos a los de la versión anterior. Además, la petición `cache.addAll` iniciaba simultáneamente los 32 recursos principales.

## Cambio conservador

- Solicitar los archivos con `cache:'no-cache'`, que obliga a revalidar ante el servidor y permite respuestas HTTP condicionales para recursos sin cambios. No utiliza `force-cache`, que podría admitir bancos obsoletos.
- Distribuir los 32 recursos en lotes de seis peticiones, con una sola caché versionada. Se mantiene la instalación **atómica**: si falla un recurso, se borra el nuevo caché parcial y no se activa un SW incompleto.
- Conservar explícitamente `offline.html`, `index.html`, los bancos, las imágenes y el motor PDF, garantizando la misma disponibilidad sin conexión y actualización solo con confirmación del docente.
- La prueba PWA verifica la revalidación y el tamaño de lote, además de todas las comprobaciones previas de precache offline, Word/PDF, instalación, borradores y actualización voluntaria.

**Límite:** no se reduce de forma demostrada la ocupación total de CacheStorage (aprox. 8,76 MiB en archivos del repositorio). Para preservarla no se retira el HTML autónomo ni se asume que Safari pueda descomprimir formatos no garantizados. El ahorro esperado es en **transferencia de recursos sin cambios durante actualizaciones** y en picos de concurrencia, sujeto a que el servidor publique validadores HTTP.

Sin fusión ni publicación.
