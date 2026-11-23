# Validación y publicación de GeneradorExamenes 1.0

La candidatura incluye Latín de 4.º de ESO, Latín I y Griego I en castellano y valenciano. El cambio de versión en `package.json` forma parte de la rama de estabilización. La etiqueta prevista es `v1.0.0` y queda pendiente de autorización y de fijar el commit final de `main`.

## Notas de lanzamiento preparadas

- Generación de los modelos de los tres cursos con selección de unidades, edición y baremos por modelo. El banco de Cultura de Latín de 4.º incluye 73 preguntas en ocho unidades y dos idiomas.
- Glosarios consultables con el índice del temario y con Collatinus o Eulexis a petición. Los relativos de Griego I distinguen el grave contextual de las grafías del artículo y de `εἰμί`. El completado automático conserva las decisiones manuales y deja las ambigüedades abiertas.
- Descargas Word y PDF, nombres de casos y rótulos verbales en valenciano, control de los baremos, guardado de borradores, copia unificada JSON y funcionamiento desde la PWA o desde `offline.html`.
- Publicación manual del paquete comprobado por la CI obligatoria para el SHA autorizado.

## Comprobación reproducible

La CI obligatoria (`.github/workflows/offline-check.yml`) corre en cada PR y en cada cambio de `main`. Primero coteja binariamente el índice y el archivo autónomo, y empaqueta una sola vez el sitio. La prueba PWA abre ese paquete en Chromium. Los demás trabajos verifican la filología, el currículo, las exportaciones, la persistencia y el editor. El trabajo de compatibilidad ejecuta también WebKit en perfiles de Safari y Chromium en perfiles de Android. Los informes guardan el SHA, el resultado por prueba y las muestras disponibles.

Con Node 22 y Playwright 1.56.1:

```sh
node scripts/build-lemma-index.mjs
node scripts/build-offline.mjs
git diff --exit-code -- data/lemmas/teacher-forms.json offline.html
python3 -m unittest discover -s tests
npm install --no-save --ignore-scripts playwright@1.56.1
npx playwright install chromium webkit
node scripts/check-release.cjs sources
for shard in 1 2 3 4; do node scripts/check-release.cjs chromium "$shard"; done
node scripts/check-release.cjs compatibility
```

El índice se reconstruye contra un commit externo fijado. Una vez disponible el índice versionado, `offline.html` se construye sin red. El contraste directo de los lectores y el extractor personal se ejecutan mediante **Comprobaciones complementarias (sin despliegue)**. La consulta y persistencia sin red se prueban en la CI obligatoria con fuentes de prueba. El trabajo programado de UniMorph deja los índices candidatos como artefacto para revisión. Los cambios de banco siguen el circuito de PR.

## Publicación autorizada

1. Tras aprobar y fusionar la PR, anota el SHA de `main` y el ID de la ejecución de **CI obligatoria** de ese SHA. Revisa los informes y las comprobaciones que requieren dispositivos físicos.
2. Conserva el SHA del despliegue anterior y el artefacto validado. Usa **Publicar artefacto validado** desde `main` con el SHA completo autorizado y el ID de CI. El flujo verifica la conclusión, el repositorio, la rama y el SHA, y coteja el paquete mediante SHA-256. El despliegue comprueba de nuevo la punta de `main`. Las ejecuciones se serializan en el grupo `github-pages`.
3. Confirma en el historial de Pages el SHA desplegado. Comprueba apertura, descarga de `offline.html` y actualización voluntaria de la PWA.
4. Tras autorización expresa, crea la etiqueta anotada `v1.0.0` en el SHA validado y publica las notas aprobadas.

Configura en GitHub el entorno `github-pages` para admitir únicamente `main`, con revisión del titular si el repositorio ofrece esa protección. Las reglas de rama pueden exigir los trabajos de **CI obligatoria** antes de fusionar. Su configuración corresponde al titular del repositorio.

## Reversión

Antes de esta candidatura, `571102025cb85284b1a910c209a1cf1e74fc9e08` fue el último SHA con [CI autónoma verde](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/45073101663) anterior a las tres regresiones consecutivas. El último despliegue observado correspondía a `94d441d06b6cb0cf7abf60cbd8a8a82463b3cfb2`, con la CI autónoma fallida. Registra ambas referencias por separado.

Para revertir tras un futuro lanzamiento, abre una PR que revierta los cambios de aplicación necesarios y reconstruya `offline.html` manteniendo el flujo de publicación protegido. Valida el nuevo SHA después de integrar la reversión. Publícalo con el mismo procedimiento manual. El service worker usa el nuevo SHA de despliegue y la actualización conserva el almacenamiento local del docente. Incluye el guardado del borrador en la comprobación de la recarga.
