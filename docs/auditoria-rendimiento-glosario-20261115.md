# Auditoría de rendimiento del glosario latino — 15/11/2026

## Alcance y problema reproducido

Se ha examinado la lematización contextual de oraciones de Latín I y Latín de 4.º, sin alterar los bancos académicos ni el generador de preguntas. La función `buildFinalLexicon` llamaba a `latinSentenceGlossaryBank` cada vez que se actualizaba el glosario. Aunque sus entradas no hubieran cambiado, esta función devolvía **un array nuevo**. Los índices de presente y paradigmas latinos de `vocabulary-generator.js` se guardan por referencia del banco en `WeakMap`; una referencia nueva provocaba reconstruir miles de formas al editar una oración.

La lematización en sí, las lecturas ambiguas, el reconocimiento de compuestos y la exigibilidad curricular ya estaban separados correctamente, por lo que no hacía falta reescribirlos.

## Medición anterior a la optimización

Se añadió `scripts/benchmark-latin-glossary.cjs`, una prueba reproducible con el banco real integrado, el índice persistente y un texto de 12 pasajes. GitHub Actions (Node.js 22, entorno Ubuntu, ejecución del 15/11/2026) obtuvo:

| Indicador | Medición |
|---|---:|
| Fichas latinas incluidas | 1647 |
| Formas del texto analizadas | 50 |
| Grupos pasivos candidatos | 3 |
| Mediana de cinco consultas con banco nuevo | 501,55 ms |
| Mediana de cinco consultas con el mismo banco | 33,64 ms |
| Relación aproximada | 14,91 veces |

**Interpretación:** se compara el coste del **motor de análisis** con índices recreados o reutilizados, no la latencia completa de la interfaz ni la experiencia en un iPad. Los tiempos exactos son sensibles al dispositivo, al navegador y al texto. La prueba verifica que ambas consultas devuelven las mismas entradas, candidatos y estados. No impone un umbral fijo que pueda producir fallos en equipos más lentos.

Registro de la medición inicial: GitHub Actions, ejecución `43763194615`.

## Optimización limitada

`latinSentenceGlossaryBank` conserva ahora un array canónico por curso **solo si la serialización completa de todas sus fichas es idéntica** a la del cálculo anterior. Se sigue componiendo y cotejando el banco desde las fuentes actuales en cada llamada. Si cambia una ficha, traducción castellana/valenciana, entrada exigible, curso, unidad o metadatos, la firma deja de coincidir y la función devuelve un nuevo array, invalidando con ello automáticamente los `WeakMap` del motor de paradigmas.

No se retienen versiones previas ilimitadamente: como máximo se conservan dos vistas activas (una por curso latino), que se sustituyen tras cualquier actualización real. No se emplean temporizadores, índices de unidades nuevos ni persistencia adicional. El curso de Griego conserva su funcionamiento.

## Pruebas funcionales

Se amplió `scripts/test-exam-glossary.cjs` para comprobar en navegador la identidad estable de arrays repetidos, su independencia entre cursos, la igualdad del HTML generado, y la invalidación al:

- Corregir en el **mismo objeto** la glosa docente sin cambiar el tamaño del banco, y restaurarla.
- Añadir y quitar una ficha de vocabulario.
- Añadir y quitar una ficha solo en el vocabulario exigible.

El programa de referencia también contrasta los resultados de bancos idénticos con nueva referencia y referencia estable, incluidos los grupos pasivos y sus alternativas. Las pruebas generales siguen comprobando la separación de decisiones por aparición, el Word, los modos claro/oscuro/OLED, los tres cursos, la versión autónoma y el manejo incremental de preguntas.

## Exclusiones y seguridad

No se alteran paradigmas, traducciones originales, IDs, fuentes morfológicas, etiquetas curriculares, unidades, claves de decisiones previas, bancos persistentes ni formatos Word/PDF. Tampoco se memoiza todo el HTML ni una oración antigua: **solo se reutiliza la lista académica inalterada**. La comprobación exhaustiva de contenido favorece la corrección ante ediciones docentes sobre una invalidación menos costosa pero frágil.

La PR queda separada y sin publicación hasta autorización expresa.
