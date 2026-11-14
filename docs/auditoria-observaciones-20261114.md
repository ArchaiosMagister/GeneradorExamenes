# Auditoría docente · conciliación de 112 observaciones
**Fecha:** 14 de noviembre de 2026  
**Repositorio:** `ArchaiosMagister/GeneradorExamenes`  
**Rama:** `audit/examenes-reales-20261114` · [PR #114](https://github.com/ArchaiosMagister/GeneradorExamenes/pull/114)  
**Estado:** informe y correcciones en borrador, sin publicación.

## Evidencia y metodología
El informe inicial contenía **112 registros** en 328 combinaciones de curso, modelo, UD, idioma y versión (web/autónoma). No equivalen a 112 defectos independientes. Incluye **28 exportaciones DOCX** y **14 pruebas** de sincronización bidireccional.

El informe primitivo probaba `index.html` como `file://` y carecía de acceso a ciertos bancos externos por las restricciones de origen. La verificación corregida utiliza un servidor HTTP local para la versión web y compara los mismos modelos con `offline.html`. Este ajuste reveló ocho avisos curriculares adicionales (116 en total), **sin que existiera una regresión real en la web publicada**.

La modificación preverbial no empieza hasta **UD2**, como acredita `data/modificacion-preverbial-unidades-lat1.json`. Los avisos en **UD1** eran esperables y se han eliminado sin incorporar contenido prematuro; al faltar esa alternativa, las subpreguntas disponibles se identifican con letras consecutivas a), b), c), tanto en web como en offline. La nueva prueba obliga a mantener el orden. Después de la corrección se registran **108 observaciones** sin incidencias técnicas bloqueantes.

## Clasificación normalizada de los 108 registros pendientes

| Situación | Registros | Casos pedagógicos | Dictamen |
| --- | ---: | --- | --- |
| Morfología de Latín I | 40 | UD1–2: 3 preguntas; restantes: 4 preguntas. ES/VA × web/offline | **Decisión docente pendiente**. Cada pregunta aporta 1 p.; el total inicial es 3 o 4 p. y el modo definitivo exige 10 p. |
| Morfología de Griego I | 56 | UD1–6: 3 preguntas; UD7–14: 4 preguntas. ES/VA × web/offline | **Misma decisión docente**. No redistribuir ni multiplicar puntos automáticamente. |
| Latín 4.º, puntuación UD9 y UD10 | 8 | 2 UD × 2 idiomas × 2 versiones | **Decisión curricular pendiente**. El examen sin pregunta cultural queda en 9,25 p. |
| Latín 4.º, aviso de cultura UD9 y UD10 | 4 | Avisos textuales en castellano en las dos versiones | **Mismo origen que los 8 registros anteriores**. La ausencia de cultura afecta a ambos idiomas; el filtro textual de avisos solo registró la formulación castellana. |
| **Total** | **108** | **Dos decisiones de fondo** | Sin atribuirles errores filológicos inexistentes |

### 1. Morfología: conflicto entre dos criterios legítimos
Criterios docentes ya aprobados: **1 p. por pregunta** y **10 p. obligatorios para un examen definitivo**. Con tres o cuatro preguntas no pueden cumplirse simultáneamente sin modificar el número de ejercicios o su valoración. El sistema actual conserva cada pregunta en 1 p., permite exportar el borrador y **bloquea correctamente el definitivo** mientras no sume 10. No se ha alterado esa política.

**Opciones para decisión docente:**
- **A.** Mantener los exámenes de morfología de 3–4 p. como pruebas parciales o borradores y reservar el requisito de 10 p. para exámenes completos. Conserva el criterio de 1 p. por pregunta, pero requiere ajustar formalmente la política de definitivos para este modelo.
- **B.** Mantener el requisito universal de 10 p. y permitir que los exámenes de morfología tengan pesos de pregunta distintos de 1 p., **solo con aprobación docente explícita**. No redistribuirlos en silencio.
- **C.** Diseñar diez preguntas o tareas puntuables independientes de 1 p. por examen morfológico. Respetaría ambos criterios, pero alteraría sustancialmente el modelo de evaluación y requeriría validación pedagógica.

### 2. Cultura de Latín de 4.º en UD9–10
El banco de cultura actual contiene preguntas con adscripción propia para **UD1–8**. El selector del curso incluye también **UD9 y UD10** por sus materiales generales; el programa no introduce automáticamente cultura de una unidad anterior, tal como exigió el docente. De ahí que el bloque no se imprima y el total inicial de estas dos unidades sea 9,25 p. Mantener bloqueada la validación definitiva es correcto.

**Opciones para decisión docente:**
- **A.** Incorporar preguntas genuinas, verificadas y bilingües de cultura a UD9–10 **solo cuando se disponga de su temario correspondiente**; conservar la puntuación.
- **B.** Admitir que UD9–10 carezcan de cultura y **aprobar explícitamente** una distribución alternativa de los 10 p. para esas dos unidades.
- **C.** Restringir el selector de cultura a UD1–8 y mantener UD9–10 para los demás bloques, con un aviso docente de puntuación pendiente; no proporciona por sí sola los puntos que faltan.

## Preparación real para clase: huecos de oraciones
La auditoría distingue **integridad del generador** de **examen completo para entregar**. El informe final muestra **232 de 328 combinaciones** con cinco o siete casillas de oraciones vacías, según modalidad. Son huecos deliberadamente editables, no una pérdida de contenido durante el DOCX. No se deben certificar como exámenes listos para entregar hasta rellenar las frases y verificar el glosario. Los 96 casos restantes corresponden a modelos exclusivamente morfológicos.

Se inspeccionó además el render de muestras Word en Latín I, Griego I y Latín de 4.º valenciano. La exportación produce documentos de dos páginas en esas configuraciones, con tablas y espacio para las respuestas; el control académico del contenido concreto sigue requiriendo revisión docente.

## Correcciones ya introducidas en la rama
1. Selector griego: retirar UD0 de las dos rutas que reconstruían las unidades, conservando las correspondencias del temario.
2. Test transversal: servir la versión online por HTTP local en vez de `file://`; verificar ambos formatos y diferenciar avisos de bloqueos.
3. Léxico de Latín I UD1: no tratar como fallo la ausencia de modificación preverbial anterior a UD2; numeración a), b), c) consecutiva y controles automatizados para evitar regresiones.
4. Registrar en el JSON de cada caso los datos de preguntas, puntuación, alternativas léxicas, editor y casillas de oraciones sin completar.

## Regresión y publicación
- [Auditoría curricular y DOCX después de corregir léxico](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43598542574): **correcta**, 328 combinaciones, 28 DOCX, 14 ediciones, 0 bloqueantes, 108 observaciones.
- [Fase I](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43598542565): **correcta**.
- [WebKit y Android](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43598542560): **correcta**.
- [Batería general](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/43598542573): **correcta**.

**No publicar ni fusionar** sin cierre de pruebas y autorización docente. Las correcciones no certifican la corrección filológica individual de todas las soluciones ni sustituyen las comprobaciones físicas en Safari de iPhone/iPad.
