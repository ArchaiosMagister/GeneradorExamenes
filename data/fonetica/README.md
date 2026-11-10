# Banco de evolución fonética: latín a castellano

El fichero [banco_examenes.json](./banco_examenes.json) contiene 510 candidatas para ejercicios: 330 iniciales, 100 de la primera ampliación, 30 de la segunda y 50 de la tercera, sin duplicación de identificadores.

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
