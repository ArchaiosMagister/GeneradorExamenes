# Fase IV — Cola docente persistente y conciliación de decisiones

**13 de noviembre de 2026 · segundo bloque funcional · sin publicación.**

## Qué se ha implementado

- Las **68 candidaturas griegas con una unidad docente** figuran individualmente en «Revisión filológica y decisiones docentes», con forma, análisis, estado de auditoría y fuente. Las 491 sin adscripción curricular no se incorporan al sorteo; la cola no verifica automáticamente ninguna forma. Las formas sincréticas tienen tarjetas distintas por análisis.
- La cola conserva el almacenamiento local existente (`examina-morph-review-v1`) y añade a cada decisión nueva una firma de **curso, tipo, lema, enunciado, forma, fuente y unidades**. Si los datos académicos cambian, la decisión antigua sigue en el archivo pero deja de considerarse vigente.
- **Exportación e importación `examina-morph-teacher-review/v2`**: copia completa de decisiones e historial, validación previa de estructura y tamaños, compatibilidad con las exportaciones antiguas de esquema 1. No requiere red.
- **Conciliación sin sobreescrituras**: ante coincidencias, prevalece la decisión local. Las versiones entrantes distintas se guardan como alternativas, no se destruyen. La tarjeta muestra la historia y ofrece adoptar individualmente una alternativa previa confirmación. Las decisiones antiguas o sin ficha vigente se conservan archivadas y no se aplican a otra entrada.
- **Guardado atómico**: la importación se valida íntegramente antes de escribir un único valor local. Si el archivo no es válido o el almacenamiento falla, las decisiones existentes se mantienen. No se mezclan estas notas editoriales con `examina-academic-evidence-v1`, que es el mecanismo separado de autorización por forma.

## Protección académica

Marcar «aceptar variante» en esta cola constituye una **nota editorial**, no habilita una propuesta en los exámenes ni la convierte en ficha de fuente 5. Las 46 exclusiones académicas siguen operativas, y también la comprobación de autorización exacta antes de exportar el Word. Los casos con homografía conservan lecturas distintas.

## Tests

`scripts/test-phase-four-review-queue.cjs` comprueba 68 tarjetas curriculares griegas, estabilidad de identidades, historial de ediciones, dos copias contradictorias, prevalencia local, elección explícita, importación idempotente, decisiones obsoletas, migración desde el esquema previo y ausencia de promoción a forma verificada. Se incorpora a `scripts/test-teacher-review.mjs`, incluido en la CI habitual de PWA/Word.

## Pendientes

Integrar la copia unificada de borradores y decisiones de varios módulos con resolución de conflictos; adaptar una interfaz de auditoría de versiones/fuentes online; terminar cotejo de 21 fichas curriculares pendientes. Esta rama se revisa sin fusionar ni publicar.
