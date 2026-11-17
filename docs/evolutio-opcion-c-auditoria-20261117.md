# Ampliación fonética de Evolutio · decisión C · auditoría 17/11/2026

**Decisión docente:** no rebajar la dificultad de las fichas ni incluir cultismos o nombres propios para alcanzar una cuota. Ampliar primero Evolutio con étimos **nuevos, individualmente verificados y sencillos**, cubriendo las veinte normas, y sólo después activar en GeneradorExamenes el conjunto resultante.

## Línea de base comprobada

- Evolutio integrado de ScholaClassica: 522 fichas de su origen fijado y 100 incorporadas a partir del Excel docente, **622** en total.
- 199 fichas clasificadas como fáciles; **186** fáciles tras excluir nombres propios.
- Cobertura de esas 186: **13 de 20** normas. Ausentes: N02 (aféresis), N04 (asimilación), N08 (disimilación), N09 (epéntesis), N18 (vocalización), N19 (-min- > -mbr-), N20 (-cul- > -j-/-g-).
- El archivo `data/fonetica/evolutio-faciles-por-aprobar.json` sigue **sin conectarse al sorteo**.

## Auditoría de fuentes existentes

1. Excel docente original `banco_evolucion_fonetica_PAU_2026_actualizado.xlsx`, hoja `Banco`, 1055 registros (filas 2–1056), con 594 marcados **PATRIMONIAL**, 179 **EXCLUIDA**, 158 **NO PATRIMONIAL**, 101 **REVISAR** y 23 **SIN CLASIFICAR**. Esas etiquetas **no equivalen a facilidad ni a verificación lexicográfica externa**.
2. `data/fonetica/banco_examenes.json` de GeneradorExamenes: **655** fichas `APTO_PROPUESTO`. Comparación normalizada (acentos, grafías æ/œ y v/u) con los 522+100 de Evolutio: **sólo 3 fichas patrimoniales propuestas inéditas**. Ninguna representa las siete normas pendientes.
3. Esos tres registros todavía **no están incorporados** a Evolutio ni declarados fáciles: `advocatum > abogado` (Excel fila 8, N01/N17), `ampullam > ampolla` (fila 16, N13; precisar además el tratamiento vocálico), `aquam > agua` (fila 23, N17). Requieren verificación de la cadena de cambios y de la deducibilidad docente, además de un formato de anotaciones compatible con Evolutio. No se deben promocionar en bloque por compartir una norma.

## Resultado y condición de desbloqueo

La opción C está **aprobada como criterio de ampliación**, pero el material verificado en los repositorios no aporta actualmente **114 nuevas fáciles** ni representantes sencillos para las siete normas ausentes. No se maquillarán los recuentos, ni se reasignarán las etiquetas de dificultad, ni se publicará un banco parcial de 300 ficticias.

**Siguiente trabajo académico necesario:** aportar o recuperar étimos patrimoniales nuevos para las normas ausentes y revisar cada candidato con fuente, segmentación, resultado castellano, norma y deducibilidad; después generar una nueva versión integrada verificable de Evolutio, correr las pruebas de integridad y actualizar el banco de GeneradorExamenes sin desincronización. Mantener separadas las decisiones sobre las normas difíciles de ejemplificar con palabras transparentes. Si una norma no permite 300 fáciles con ejemplos honestos, comunicar esa excepción en lugar de falsear el banco.

**Implementación condicionada:** no sustituir el banco fonético activo de GeneradorExamenes hasta disponer de una selección contrastada y de pruebas de cobertura, sin alterar interfaz, Word ni `offline.html` manualmente.
