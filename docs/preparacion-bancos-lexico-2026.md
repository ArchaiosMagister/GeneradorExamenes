# Preparación de bancos de léxico para los exámenes (noviembre de 2026)

Esta webapp se ejecuta **en el navegador**. La generación de exámenes no consulta diccionarios externos ni depende de una aplicación nativa. Los bancos nuevos no deben rellenarse con ejemplos inventados.

## Materiales docentes pendientes

| Curso | Apartado | Material que debe aportar el docente |
| --- | --- | --- |
| Latín I | Modificación preverbial | Lista de palabras y transformaciones o enunciado de modelo |
| Latín I | Evolución fonética | Banco de étimos, resultados castellanos y **anexo de fenómenos fonéticos** |
| Latín I | Prefijos | Prefijos trabajados por unidad, palabras y enunciado de modelo |
| Latín I | Latinismos | **Lista numerada y ordenada**, significado y enunciado de modelo, para poder escoger pares/impares y rangos |
| Latín 4.º ESO | Prefijos | Banco **fijo** y prefijos por unidad; enunciado de modelo |
| Latín 4.º ESO | Evolución fonética | Banco **fijo**, fenómenos fonéticos por unidad y enunciado de modelo |

Formatos de origen aceptables para preparar la importación: Word, PDF, Excel, CSV o texto. Una vez recibidos, hay que conservar la atribución a unidades, los ordinales de latinismos y las grafías exactas, revisar las reglas y **empaquetar el banco dentro de la webapp** para que funcione sin conexión.

## Formato normalizado previsto

Se contempla un objeto JSON por curso y tipo de pregunta. Los **campos obligatorios de cada entrada** son `prompt` (texto del ejercicio) y `answer` (respuesta docente, oculta en la hoja de alumnado). Son opcionales `unit` (p. ej., `UD3`), `prefix`, `phenomenon` o `phenomena` (etiquetas del anexo), y `number` (número original del latinismo, no el índice tras filtrar).

```json
{
  "latin1": {
    "preverbs": [],
    "phonetics": [],
    "prefixes": [],
    "latinisms": []
  },
  "latin4": {
    "prefixes": [],
    "phonetics": []
  }
}
```

Las matrices se dejan vacías hasta recibir el material real. No deducir la respuesta de la grafía sin verificación del profesor. Las etiquetas de fenómenos y prefijos se tomarán de los anexos, no de una lista genérica. Para los latinismos, el selector aplicará *primero* el intervalo y paridad según su número original y *después* la selección de ejemplos.

## Reglas y comportamiento esperado

- **Latín I** completo o traducción: pregunta de léxico activable, con cuatro subpreguntas independientes y filtros; **morfología**: sin léxico.
- **Latín 4.º ESO** completo: dos subpreguntas (prefijos y evolución fonética) con banco fijo, restringible al temario correspondiente.
- Preguntas de morfología: declinaciones, análisis verbal y formas variables siempre presentes; análisis de pronombres **opcional** cuando el banco de las unidades lo permita.
- Análisis morfológico de palabras sueltas: cuotas para sustantivos, adjetivos, verbos y pronombres. No se admiten adverbios, partículas, conjunciones ni otras clases invariables.
- Griego: tipografía normal en toda la hoja, vista previa, impresión y Word, **incluidas las tablas**.
- Las letras de los apartados a., b., c. no van en cursiva en Word.
- El vocabulario de las oraciones se sigue extrayendo de los lemas verificados; no se generan traducciones falsas.
- El banco de léxico **no es** el banco general de vocabulario usado para declinación y conjugación.

## Pendiente antes de fusionar a main

Validar en navegador los controles, actualizar las pruebas automáticas y volver a construir `offline.html` con `npm run offline:build` para que coincida con la interfaz pública. Hasta entonces, estos cambios permanecerán en una rama de preparación.
