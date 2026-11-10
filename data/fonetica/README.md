# Banco de evolución fonética: latín a castellano

El fichero [banco_examenes.json](./banco_examenes.json) contiene 430 candidatas para ejercicios: 330 iniciales y 100 añadidas, sin duplicación de identificadores.

Esquema: evoluciones-latin-castellano/v1. Campos por ficha: id, latin, castellano, normas (N01–N20), observacion, fila_origen, fuente y estado.

Las fichas tienen estado APTO_PROPUESTO: es una preselección didáctica, no una certificación lexicográfica definitiva.

El módulo [seleccionar_evoluciones.mjs](./seleccionar_evoluciones.mjs) exporta seleccionarEvoluciones(banco, {normasSeleccionadas, semilla?, excluidos?}). Solo elige fichas cuyas normas estén incluidas en las seleccionadas; devuelve exactamente cuatro palabras o ninguna. La respuesta castellana queda separada en controlDocente y no debe copiarse al examen del alumno. No repite étimos.

Pruebas: ejecutar node scripts/test-fonetica.mjs desde la raíz del repositorio.

IMPORTANTE: este primer cambio incorpora los datos y el selector al repositorio; la elección de normas y la generación desde la interfaz de exámenes de la PWA aún no están conectadas. Tampoco está incluido en el paquete autónomo offline.html. Antes de usar fichas en pruebas calificables conviene validar los étimos y reglas seleccionados.
