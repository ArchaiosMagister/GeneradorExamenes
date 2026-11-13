# Fase IV · Copia de seguridad unificada (v1)

## Propósito

Protege el **trabajo local del docente**. No exporta los bancos académicos distribuidos ni autoriza flexiones automáticamente. Importar no sustituye los registros del dispositivo.

## Uso

1. En Generación de exámenes, abre **Copia de seguridad unificada · Fase IV**.
2. Selecciona **Exportar copia completa JSON** y conserva el archivo fuera del navegador. Se captura el borrador visible, aunque no esté guardado.
3. En otro navegador, importa el JSON, comprueba el resumen de cambios y confirma.
4. Las discrepancias se conservan en el **archivo de conflictos**: puedes descargar un registro, recuperar los datos todavía ausentes o abrir un borrador importado. Para guardarlo como borrador habitual, pulsa el botón de guardar.
5. Tras importar, guarda el examen actual y recarga la aplicación para que sus menús lean los valores restaurados.

Funciona sin conexión. No se envían datos a un servidor. Conviene mantener varias copias fuera de Safari/iOS.

## Información incluida

- Borrador guardado y generación anterior: examina_draft_v14, examina_previous_v14.
- Vista previa actual sin guardar: liveDraft.
- Decisiones de morfología, discrepancias griegas y desambiguación de glosas: examina-morph-review-v1, examina-greek-discrepancy-v1, examina_exam_gloss_choices_v1.
- Autorizaciones individuales **solo si se hubieran registrado**: examina_teacher_authorizations_v1.
- Oraciones, puntuaciones y vocabulario exigible: examina_exam_sentences_v1, examina_question_points_v1, examina_required_v9.
- Datos docentes adicionales, bancos léxicos personales y proyectos de vocabulario: examina_extra, examina_lexical_banks_v1, examina_vocabulary_project_v1.
- Historial de importaciones conflictivas: examina_unified_archive_v1.

**Límite académico actual:** no se detectó en el código examinado un sistema que
persistiera autorizaciones individuales en examina_teacher_authorizations_v1.
Esta versión admite esa clave, pero **no inventa aprobaciones, ni convierte una
decisión en tarjeta en forma académicamente verificada**. La conexión de futuras
autorizaciones explícitas al motor de generación requerirá su propio desarrollo y pruebas.

Se excluyen los índices descargables UniMorph y Eulexis en IndexedDB: no son decisiones personales y se pueden reinstalar. También se excluyen los bancos del repositorio y las preferencias efímeras.

## Política de recuperación

- Se aceptan exclusivamente JSON con esquema examina-unified-backup/v1 y claves reconocidas.
- Antes de escribir se ofrece una vista previa numérica.
- Se agregan las claves ausentes y se omiten los valores exactamente idénticos.
- En mapas de decisiones se añaden identificadores inexistentes, sin cambiar los antiguos. Las alternativas contradictorias quedan archivadas.
- En vocabulario exigible se agregan fichas nuevas; los mismos identificadores con contenido diferente se archivan.
- Los borradores, proyectos completos y otras estructuras no fusionables se conservan como registros archivados en caso de conflicto.
- El archivo de conflictos se incluye en exportaciones futuras y se deduplica en importaciones repetidas.
- Se comprueban tamaños (máximo 16 MB de archivo, 3 MB por registro y 150 registros archivados).
- Si falla alguna escritura, se intenta revertir toda la operación. localStorage carece de transacciones reales; conservar el JSON externo es esencial.

## Pruebas

La suite scripts/test-unified-backup.cjs cubre exportación, copia del borrador
visible, decisiones y autorizaciones como datos, fusión conservadora,
conflictos, idempotencia, recuperación entre dispositivos, archivos inválidos,
rollback y referencias de empaquetado. Se ejecuta con npm run offline:test,
que forma parte de las comprobaciones de PR y publicación.
