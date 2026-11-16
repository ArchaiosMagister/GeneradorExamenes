# Optimización 3/6 — redimensionar el análisis sin regenerar un examen latino completo

En un examen latino estándar (modelo completo o de traducción), cambiar el número de formas para analizar reconstruía internamente todas las preguntas, volvía a elegir temporalmente materiales y restauraba el resto de la vista. El resultado visible se conservaba, pero el cálculo afectaba a preguntas ajenas.

Se ha añadido un trayecto directo para estos exámenes: reutilizar la selección por cuotas, construir **solo la nueva lista de formas** y sustituir su sección y sus respuestas en el DOM existente. Los encabezamientos y nodos de las demás preguntas, las decisiones filológicas y sus ediciones permanecen intactos. Se mantiene el mecanismo anterior para morfología latina y modelos griegos más complejos, evitando un refactor arriesgado de sus reglas específicas.

La prueba de navegador cambia cuatro formas a seis y verifica que no se invoca `generate()`, que otras preguntas permanecen conectadas y que sus respuestas siguen sincronizadas.

No se modifican bancos académicos, ids, puntuaciones, Word ni PDF. Esta optimización es **incremental y de alcance declarado**, no una sustitución de todas las regeneraciones conservadoras de la aplicación.
