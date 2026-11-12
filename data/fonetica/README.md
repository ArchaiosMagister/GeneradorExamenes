# Banco de evolución fonética: latín a castellano

## Programación específica de Latín I (UD0–UD10)

El fichero [lat1-programacion.json](./lat1-programacion.json) contiene las 73 palabras docentes en el orden original: tres en UD0 y siete en cada unidad UD1–UD10. Cada entrada conserva el resultado castellano, los códigos de normas N01–N20, su unidad y, cuando procede, una observación. Las normas son **acumulativas**: la selección de una unidad permite utilizar las palabras y los fenómenos de todas las unidades precedentes, aunque el selector global de vocabulario no esté en modo «acumulativo».

En Latín I la programación de 73 étimos determina **qué normas están explicadas por unidad**, pero no limita qué palabras pueden aparecer: el sorteo utiliza todo el banco general apto que respete esas normas, más las fichas propias del programa no duplicadas. Se seleccionan cuatro étimos distintos, sin respuestas y evitando las últimas tandas cuando existen alternativas. Las fichas `REVISAR` quedan fuera. La agrupación UD9–10 se interpreta como UD10. En Latín 4.º también se utiliza el banco general con sus filtros curriculares.

Las leyes se activan por unidad y se pueden desmarcar dentro de las ya impartidas. Las normas que todavía no han sido explicadas no se pueden activar. Pruebas: `node scripts/test-lat1-fonetica.mjs`.


El fichero [banco_examenes.json](./banco_examenes.json) contiene 533 candidatas para ejercicios: 330 iniciales, 100 de la primera ampliación, 30 de la segunda, 50 de la tercera, 3 de la revisión del Excel final, 1 aceptación editorial, 7 del lote 13, 2 del lote 14, 3 del lote 15, 4 del lote 16 y 3 del lote 17, sin duplicación de identificadores.

Esquema: evoluciones-latin-castellano/v1. Campos por ficha: id, latin, castellano, normas (N01–N20), observacion, fila_origen, fuente y estado.

Las fichas tienen estado APTO_PROPUESTO: es una preselección didáctica, no una certificación lexicográfica definitiva.

El módulo [seleccionar_evoluciones.mjs](./seleccionar_evoluciones.mjs) exporta seleccionarEvoluciones(banco, {normasSeleccionadas, semilla?, excluidos?}). Solo elige fichas cuyas normas estén incluidas en las seleccionadas; devuelve exactamente cuatro palabras o ninguna. La respuesta castellana queda separada en controlDocente y no debe copiarse al examen del alumno. No repite étimos.

Pruebas: ejecutar node scripts/test-fonetica.mjs desde la raíz del repositorio.

El banco canónico está conectado a los ejercicios de evolución fonética de Latín I y Latín 4.º y se incluye en la PWA y en el HTML autónomo. En Latín I se seleccionan las normas impartidas manualmente; en Latín 4.º se sigue el repertorio acumulativo de fenómenos por unidad (correspondencia todavía provisional). La salida del alumno presenta cuatro étimos sin soluciones. El archivo `banco_examenes.tsv` contiene solo las primeras 330 fichas a efectos de trazabilidad; no es el origen activo de selección. Antes de usar fichas en pruebas calificables conviene validar los étimos y reglas seleccionados.

## Segunda ampliación (30 voces habituales para preparación PAU)

La segunda ampliación incluye palabras de uso común como autumnum > otoño, cepullam > cebolla, pauperem > pobre y strictum > estrecho. Se han priorizado cambios fonéticos que aparecen en los ejercicios de Latín II. Los resultados y algunas variantes latinas han sido contrastados con el Diccionario de la lengua española (https://dle.rae.es/). Este criterio es didáctico y no constituye una predicción de probabilidad real de aparición en selectividad. Las 30 entradas nuevas conservan `fila_origen`, notas y la referencia lexicográfica para revisión.

## Tercera ampliación (50 voces, 510 entradas en total)

Se han incorporado 50 fichas nuevas basadas en el Excel docente, seleccionando voces frecuentes o reconocibles para Latín II (por ejemplo: `dicere` → `decir`, `piscare` → `pescar`, `operare` → `obrar`, `temperare` → `templar` y `dominicum` → `domingo`). No existe garantía de que aparezcan en la PAU. Se mantiene el estado `APTO_PROPUESTO`, por lo que se recomienda validar la cadena etimológica antes de usar el material en evaluaciones. El étimo erróneo `plannum` del Excel se ha corregido a `plānum` para «llano», anotándolo expresamente.

La ampliación 3 queda identificada con el campo `lote: 3` y mantiene `fila_origen`, `normas` y observaciones. El selector sigue exigiendo exactamente cuatro palabras. La interfaz del generador todavía no ofrece el selector fonético; este cambio amplía el fichero de datos del repositorio.

## Auditoría individual de 100 fichas (lote 15)

El archivo [auditoria-excel-lote-100-20261112.json](./auditoria-excel-lote-100-20261112.json) registra **exactamente 100 entradas nuevas** del Excel original, con su fila, correspondencia, normas marcadas, observación y decisión editorial: 3 incorporadas, 6 para decisión docente, 62 pendientes de contraste, 26 apartadas por transmisión culta y 3 variantes o duplicados. Las 97 no incorporadas **no son elegibles para el sorteo**. Las formas inicialmente presentes en el programa propio de Latín I no se han contabilizado como candidatas nuevas. La revisión de las pendientes debe continuar con pruebas individuales; la marca de una norma en el Excel no basta para considerarla verificada.

## Decisiones docentes y adaptaciones cultas (lote 16)

Las decisiones aprobadas se conservan en [decisiones-docentes.json](./decisiones-docentes.json) y se aplican individualmente al [registro de auditoría de 100 fichas](./auditoria-excel-lote-100-20261112.json). `scrinium` y `quinionem` se excluyen por decisión expresa. `contum` → `cuento²` se admite **solo** como «contera / extremo de bastón o lanza», y no como «relato». La antigua `sŏcrum` se corrige a `sŏcram` → `suegra`, pero **permanece fuera del sorteo** porque `-cr- > -gr-` no coincide sin matices con N17 (sonorización intervocálica); la ficha antigua `socerum` → `suegro` no se modifica. `stylum` se corrige a `stilum` y se incorpora solo como adaptación culta de e- protética.

La elección `inclusion_condicionada` **no importa los cultismos en bloque**. Los seis verificados por ahora (`stilum` → `estilo`, `athletam` → `atleta` y `blasphemiam` → `blasfemia`) llevan `tipoTransmision: ADAPTACION_CULTA` y se distinguen con la etiqueta **«adaptación culta»** (o «adaptació culta») en la vista previa y el Word. Se limita el análisis a las reglas de grafía / prótesis indicadas en cada ficha, sin atribuir una evolución patrimonial completa. Otras 21 candidatas cultas del lote de 100 permanecen pendientes de comprobación y **no participan en el sorteo**. La edición y regeneración de una forma deben actualizar su etiqueta sin alterar las demás.

### Continuación del cotejo cultista (lote 17)

Se han cotejado tres nuevas candidatas del mismo Excel: `architectum` → `arquitecto` (ch > qu), `asphaltum` → `asfalto` (ph > f) y `Chimæram` → `quimera` (ch > qu, ae > e). Todas conservan referencia lexicográfica y tipo `ADAPTACION_CULTA`, sin reconstruir una transmisión popular inexistente. Las 21 cultas restantes del lote previo no son elegibles.
