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


## Vocabulario automático de las oraciones: revisión del 10 de noviembre de 2026

Se ha contrastado el comportamiento con los exámenes facilitados por el docente, en particular los glosarios de Latín I de UD2 y UD6. El criterio básico es **incluir todas las palabras reconocidas de las oraciones**: si pertenecen al vocabulario exigible se muestra únicamente su enunciado; si no son exigibles, se muestran enunciado y traducción documentada. Por ello, el filtro por defecto del vocabulario final es «Todo el vocabulario», no «Solo palabras que no entran en el examen». Los filtros manuales siguen estando disponibles.

- Los lemas se deduplican; una homografía entre dos lemas distintos se marca para revisión y no se resuelve escogiendo arbitrariamente el primero.
- Las formas con enclítica latina `-que`, `-ve` o `-ne` solo se separan cuando su base tiene un análisis único verificado. La partícula se añade por separado únicamente si existe en el vocabulario docente.
- Si falta una traducción, se conserva el **enunciado sin inventar significado** y se muestra una advertencia de revisión al profesor (oculta en impresión y Word).
- Las palabras no reconocidas se listan como advertencia, **no se les asigna lema ni traducción por conjetura**.
- Desactivar la pregunta de oraciones impide que palabras de oraciones no impresas aparezcan en el glosario.
- Los exámenes completos **y de traducción** de Griego I incluyen vocabulario de las oraciones. La escritura griega permanece en redonda en pantalla, impresión y Word.
- En la PWA, el índice lematizador offline puede terminar de cargarse después del primer examen. Al quedar listo, se actualiza el vocabulario sin sustituir los ejercicios ni sobreescribir ediciones manuales de la vista previa.

Las pruebas de regresión del navegador verifican vocabulario exigible sin traducción, reconocimiento conservador de enclíticas, advertencias ante formas desconocidas, ausencia de vocabulario de preguntas desactivadas, vocabulario en la modalidad de traducción griega, exportación Word y funcionamiento autónomo. Estas pruebas **no significan que todos los lemas del banco sean reconocibles**: faltan completar y validar paradigmas, léxico y algunas ambigüedades docentes. La aplicación advierte de lo no reconocido para revisión antes de usar un examen real.

## Integración de bancos docentes de léxico (10 de noviembre de 2026)

**Incorporados en la rama de desarrollo:** `data/latinismos-docente.json` (87 latinismos con numeración original y acepciones principales resumidas), `data/prefijos-docente.json` (25 grupos de prefijos, 287 grafías originales) y `data/modificacion-preverbial-docente.json` (120 fichas de verbos simples, 882 formas derivadas). Estas bases se empaquetan en la PWA y se incrustan en `offline.html` al reconstruirlo. No se trasladan a los bancos de declinación/conjugación.

Los *significados generales* de cada prefijo, incorporados como ayuda a partir de su sentido habitual, **requieren revisión según la etimología de cada palabra**. Los significados de los latinismos son versiones abreviadas de las definiciones docentes, no la reproducción íntegra de todas sus acepciones y sinónimos. No se hace ninguna clasificación por unidad porque los materiales entregados todavía no especifican unidades para estas tres listas.

En Latín I se generan cuatro subapartados con letras de posición fija: **a)** dos verbos simples con consignas de tres y dos derivados (se imprime solo la primera persona del presente); **b)** cuatro étimos para evolución fonética cuando llegue el banco (de momento no se inventa); **c)** cuatro palabras para señalar prefijo y sentido; **d)** cuatro latinismos para definir y contextualizar en una oración. Solo los estímulos aparecen en cursiva, incluso en Word. Se evitan para selección automática las primeras personas homógrafas `sero` y `volo`, que figuran desambiguadas en la fuente completa. Los ejemplos sin derivados documentados se pueden incorporar en el futuro, pero el algoritmo automático no presume que todos los verbos tengan cinco derivados acreditados.

Los filtros de **intervalo y paridad** de latinismos conservan los ordinales 1–87 antes de la selección aleatoria; el de prefijos conserva los 25 grupos docentes. El banco de evolución fonética queda deliberadamente sin entradas.

El profesor puede fijar en la configuración los **verbos A y B** escribiendo cualquier primera persona del presente. Si introduce un enunciado largo, solo se imprime su primera forma, separada por coma. Cuando una forma no figura con un análisis único en el banco de derivados, se muestra una advertencia docente y no se inventa una solución. Si deja los campos vacíos, se generan automáticamente dos verbos con suficientes derivados documentados.

## Paquete de evolución fonética y regeneración individual (10 de noviembre de 2026)

Del ZIP docente se ha incorporado `data/fonetica/banco_examenes.tsv`, extracto de **330 fichas `APTO_PROPUESTO`** con identificador original `EVF-xxxx`, grafía latina, evolución castellana y normas `N01`–`N20`. Se han excluido las entradas `REVISAR` y los dobletes; el paquete ZIP sigue siendo la fuente para observaciones extensas y auditoría (1055 registros). Cada ejercicio selecciona **cuatro étimos**, exige que todas sus normas figuren entre las explicadas y avisa si no existen cuatro compatibles; no se rellenan huecos con ejemplos inventados.

**Todos los apartados de léxico contienen cuatro estímulos en cursiva**; cada uno dispone de un botón para regenerarlo sin cambiar los otros tres y de otro botón que regenera la subpregunta entera. Para mantener cinco derivados en modificación preverbial, se usan cuatro verbos con reparto 2 + 1 + 1 + 1. Los significados de prefijos y latinismos no se generan como soluciones: el profesor realizará la corrección. El banco es utilizable por la PWA y se incrusta en `offline.html` durante la construcción.

## Verbos de modificación preverbial por unidad de Latín I (10 de noviembre de 2026)

Se ha incorporado `data/modificacion-preverbial-unidades-lat1.json`, con **28 introducciones**:
- UD2: `mitto`, `pono`, `duco`, `fero`.
- UD3: `capio`, `clamo`, `facio`, `tendo`.
- UD4: `porto`, `habeo`, `iacio`, `cado`.
- UD5: `curro`, `dico`, `gero`, `peto`.
- UD6: `pugno`, `sedeo`, `sentio`, `specio`.
- UD7: `gradior`, `sequor`, `verto`, `video`.
- UD8: sin verbos nuevos.
- UD9: `cerno`, `do`, `eo`, `fligo`.
- UD10: sin verbos nuevos.

**Regla docente:** para un examen de una o varias unidades, entran los verbos explicados hasta la unidad más avanzada seleccionada; se mantiene este criterio incluso si el usuario no activa la opción «Acumulativo». La UD1 no ofrece modificación preverbial. En UD8 y UD10 se conserva todo el repertorio anterior. Los botones de regeneración, tanto por palabra como por subpregunta, respetan el mismo catálogo. La selección manual continúa disponible como excepción deliberada del profesor.

De los 28 verbos, **27 tienen derivados documentados** en el banco previo. `fligo`, suministrado para UD9, no figura allí: es elegible pero aparece con aviso de revisión, sin proponer derivados ni soluciones inventadas. En el examen se imprime exclusivamente la primera persona del presente.

## Latín 4.º: ejemplos de clase ≠ banco de examen (10/11/2026)

**Aclaración del docente:** las listas de seis palabras para prefijos y seis étimos para evolución fonética de cada una de las UD1–UD8 son **ejemplos de ejercicios realizados en clase**. No constituyen un banco cerrado. Las preguntas de examen **deben tomar cualesquiera cuatro palabras del banco general** que correspondan a los prefijos o normas ya explicados, con acumulación hasta la última UD seleccionada.

Se ha incorporado `data/lat4-progresion-lexico.json` **sin copiar esos ejemplos como fichas de examen**. La selección reutiliza el banco general de 287 palabras con prefijos y las 330 evoluciones fonéticas `APTO_PROPUESTO`. Prefijos introducidos:
- UD1: RE-/RED-, PRE-;
- UD2: IN-/IL-/IM-, SUB-/SU-/SO-;
- UD3: ANTE- (anterioridad), POS-/POST-;
- UD4: CONTRA-, ANTI- (oposición);
- UD5: CON-/COL-/COM-/COR-/CO-;
- UD6: EX-;
- UD7: INTER-;
- UD8: repaso de las familias anteriores, sin una nueva.

Los grupos fonéticos inferidos de los ejemplos de aula son: UD1 sonorización intervocálica (`N17`); UD2 simplificación de geminadas (`N15`); UD3 diptongación (`N07`); UD4 F- inicial > h- (`N05`); UD5 monoptongación (`N12`); UD6 palatalización de -ct- (`N13`); UD7 palatalización de -gn- (`N13`); UD8 palatalización por yod, especialmente -li- ante vocal (`N13`). La codificación de estos subtipos procede de una **interpretación inicial** de los ejercicios; el docente puede corregirla si hubiera otra progresión curricular. El filtro requiere que la ficha no incluya ninguna norma ajena al repertorio acumulado, contando también las transformaciones básicas `N01` y `N17`. No añade nuevas evoluciones al banco: solo clasifica y elige entre fichas existentes.

El número de estímulos del examen sigue siendo **cuatro por subpregunta**, con regeneración individual y de las cuatro juntas, y cursiva solo para los estímulos. Las explicaciones y significados quedan para corrección manual. La programación viaja incrustada en el HTML autónomo y precargada por la PWA.

## Integración de la ampliación de 460 fichas y publicación

El banco canónico pasa a ser `data/fonetica/banco_examenes.json`, con **460 evoluciones**, incluyendo **las 330 primeras sin modificaciones** y 130 ampliaciones conservadas del trabajo paralelo publicado en `main`. La PWA, el HTML autónomo y los ejercicios de Latín I y Latín 4.º usan el mismo banco canónico. El antiguo `data/fonetica/banco_examenes.tsv` de 330 entradas se conserva únicamente como extracto de trazabilidad y no participa en la selección de exámenes. Los sentidos y soluciones de los ejercicios no se publican como solucionarios. Las 460 fichas están marcadas `APTO_PROPUESTO`: requieren supervisión filológica habitual, especialmente al asignar fenómenos. Se ha incorporado la prueba original `scripts/test-fonetica.mjs` a las comprobaciones de la webapp.
