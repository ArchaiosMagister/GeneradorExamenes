# Cierre técnico acotado de la fase II · 13 de noviembre de 2026

**Estado: pruebas de la implementación conservadora superadas; PR #97 en borrador, sin fusión ni publicación.**

## Criterio de cierre funcional

La fase II garantiza que el generador solo sortea contenidos dentro de su progresión curricular **y** distingue la procedencia real de cada análisis. La autorización docente individual no equivale a comprobación filológica. Se excluyen de las respuestas unívocas las formas ambiguas sin contexto y se preservan los controles de Word, borrador, PWA y puntuación.

Pruebas del commit `3ff31b1227ab2779d3f6ca2f3cf1c075e9912b45`:
- [Índice, currículo, evidencia, verbos, Word y PWA](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43323670807): correcta.
- [Regresiones de fase I, edición y exportación](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43323670894): correcta.

## Exclusiones deliberadas, no consideradas verificadas

Los verbos irregulares, deponentes y semideponentes sin contraste **por forma** siguen pendientes. Esto incluye, según los casos, otros compuestos de *eo*, formas de *fio*, tiempos no contrastados de *loquor*, *sequor*, *proficiscor* y *gaudeo*, así como flexión media y variantes avanzadas del griego. La cola reproducible se obtiene mediante `scripts/audit-verbs-evidence.cjs` y `scripts/audit-verb-coverage.cjs`. Ni la documentación ni este cierre promocionan esas lagunas a verificadas.

Las fuentes híbridas en línea no están activadas sin contratos verificables de licencia y acceso; la PWA continúa funcionando sin red. Las colaciones futuras exigirán documentación individual, actualización de la fuente persistente, reconstrucción del índice, HTML offline y CI integral.

## Condiciones para pasar a fase III

1. Conservar sin modificación la procedencia y las autorizaciones de evidencia de fase II.
2. Cada regeneración deberá alterar únicamente la pregunta o posición solicitada, sin borrar encabezados, oraciones, soluciones y decisiones de vocabulario.
3. Los filtros académicos siguen aplicándose **antes** de cualquier sorteo.
4. Un banco insuficiente nunca ha de producir un número artificial de fichas ni destruir el borrador.
5. La rama principal y la web pública permanecen intactas hasta autorización de publicación.

Este documento **cierra el bloque funcional de la fase II sin declarar terminada la revisión filológica individual de todos los paradigmas**.

## Cierre verificado, 13 de noviembre de 2026

**Fase II funcional terminada en la rama de revisión.** El cierre se fundamenta en los dos workflows correctos para el último commit de código `4c605cf6fbbbd8f2797b16758b107b02d2595fdf`:

- [Auditoría autónoma integral](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43422349318): correcta; comprueba igualdad exacta de `offline.html` regenerado con el archivo guardado, trazabilidad, currículo, Eulexis local, Word y PWA.
- [Regresión sin despliegue](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43422349170): correcta.

La revisión incorporó formas de `eo`, `redeo`, `transeo`, `proficiscor`, `ηγεομαι` y `μαχομαι` con etiquetas individualizadas. El índice persistente y `offline.html` coinciden, incluyendo las candidatas griegas del índice externo; tales candidatas **no se convierten en respuestas verificadas**. Las colas de cobertura continúan documentando los tiempos y variantes todavía excluidos, que son trabajo académico futuro y **no invalidan** los requisitos técnicos y de seguridad de esta fase.

La PR #97 se conserva en borrador, sin fusión ni despliegue. La fase III puede apoyarse en esta rama como base validada. Cualquier cambio posterior en la fase II debe revalidarse antes de propagarse.
