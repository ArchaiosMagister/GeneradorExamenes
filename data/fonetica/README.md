# Banco de evolución fonética: latín a castellano

El fichero [banco_examenes.json](./banco_examenes.json) contiene 460 candidatas para ejercicios: 330 iniciales, 100 de la primera ampliación y 30 voces comunes para preparación PAU, sin duplicación de identificadores.

Esquema: evoluciones-latin-castellano/v1. Campos por ficha: id, latin, castellano, normas (N01–N20), observacion, fila_origen, fuente y estado.

Las fichas tienen estado APTO_PROPUESTO: es una preselección didáctica, no una certificación lexicográfica definitiva.

El módulo [seleccionar_evoluciones.mjs](./seleccionar_evoluciones.mjs) exporta seleccionarEvoluciones(banco, {normasSeleccionadas, semilla?, excluidos?}). Solo elige fichas cuyas normas estén incluidas en las seleccionadas; devuelve exactamente cuatro palabras o ninguna. La respuesta castellana queda separada en controlDocente y no debe copiarse al examen del alumno. No repite étimos.

Pruebas: ejecutar node scripts/test-fonetica.mjs desde la raíz del repositorio.

IMPORTANTE: este primer cambio incorpora los datos y el selector al repositorio; la elección de normas y la generación desde la interfaz de exámenes de la PWA aún no están conectadas. Tampoco está incluido en el paquete autónomo offline.html. Antes de usar fichas en pruebas calificables conviene validar los étimos y reglas seleccionados.

## Segunda ampliación (30 voces habituales para preparación PAU)

La segunda ampliación incluye palabras de uso común como autumnum > otoño, cepullam > cebolla, pauperem > pobre y strictum > estrecho. Se han priorizado cambios fonéticos que aparecen en los ejercicios de Latín II. Los resultados y algunas variantes latinas han sido contrastados con el Diccionario de la lengua española (https://dle.rae.es/). Este criterio es didáctico y no constituye una predicción de probabilidad real de aparición en selectividad. Las 30 entradas nuevas conservan `fila_origen`, notas y la referencia lexicográfica para revisión.
