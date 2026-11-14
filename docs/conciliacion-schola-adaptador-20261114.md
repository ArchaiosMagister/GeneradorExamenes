# Conciliación ScholaClassica → GeneradorExamenes · adaptador de solo lectura
Fecha: 14 de noviembre de 2026. **Estado: PR de preparación; ninguna forma académica importada ni publicada.**

## Contrato y ámbito
- No se fusionan aplicaciones ni repositorios: GeneradorExamenes sigue siendo una PWA independiente.
- El adaptador `scripts/reconcile-schola-morphology.cjs` **solo lee** la exportación `apps/morfologia/data/paradigmas.json` de ScholaClassica y `data/lemmas/teacher-forms.json` de GeneradorExamenes. No solicita red, no toca `verified-overrides.json`, no modifica `index.html`, `offline.html` ni autoriza candidaturas.
- Fuente Schola revisada: `ArchaiosMagister/ScholaClassica` commit `bcb8ccf9d75e174593c95a72b0c8db48b62f108e`, artefacto de la ejecución satisfactoria `43637434394`, paquete `scholaclassica-integracion-fase2` (14130796337). Contiene `paradigmas.json`; sus cabeceras señalan los SHA fijados de Appendix y Vocabula.
- Base del Generador: commit `260ad7201cc4e1a9b2e990ce3a11ee3b591ba270`; los cambios posteriores se comparan siempre con los SHA suministrados en cada ejecución.
- Materias: `latin` (Latín I), `latin4` (4.º) y `griego` (Griego I). Latín II no se mezcla ni se habilita.

## Ejecución explícita, offline y reproducible
Exportar o descargar el `paradigmas.json` generado por ScholaClassica y, desde el directorio de GeneradorExamenes, ejecutar:

```sh
node scripts/reconcile-schola-morphology.cjs \
  --schola /ruta/local/paradigmas.json \
  --schola-commit bcb8ccf9d75e174593c95a72b0c8db48b62f108e \
  --generador-commit 260ad7201cc4e1a9b2e990ce3a11ee3b591ba270 \
  --report test-artifacts/conciliacion-schola-20261114.json
node scripts/test-schola-morphology-reconciliation.cjs
```

Sin `--report`, solo se muestra el resumen y no se escribe fichero alguno.
Con `--report`, únicamente se crea el informe solicitado: está prohibido sobreescribir las dos fuentes de entrada. Las fuentes se leen antes y después y se exige identidad binaria.

## Reglas de clasificación
1. **Coincidencia completa:** lema, grafía escolar y al menos dos rasgos morfológicos comunes sin contradicción. Se conservan todos los análisis homógrafos. La fuente 1 (paradigma docente) y la 5 (contraste individual) se distinguen explícitamente de 0 (UniMorph), 2 (modelo regular), 3 (cita) y 4 (candidato griego).
2. **Contraste adicional:** una coincidencia con fuente 0, 2 o 4 **no verifica** ninguna forma y nunca permite saltar a fuente 5 ni usarla como clave automática.
3. **Discrepancia:** grafía igual con rasgos incompatibles se conserva para cotejo; los deponentes con etiquetas no comparables se reservan como indeterminados, no como error demostrado.
4. **Normalización:** en latín se equiparan ligaduras `æ/ae`, `œ/oe` y se omiten macrones/breves. En griego se omiten **solo** macrones/breves de edición; se mantienen acentos, espíritus e iota suscrita.
5. **Currículo:** la primera unidad de exigibilidad de un bloque `UD 1–4` es UD4, no UD1; no se importa automáticamente la unidad de Schola a GeneradorExamenes. Cultura de 4.º no se acumula y conjugación solo admite regulares y `sum`, reglas que este adaptador no modifica.
6. **Decisiones docentes:** primero se aplican las cuarentenas de `πρῶτος`, las ocho propuestas femeninas de `ἀθάνατος` y las tres propuestas femeninas de `αἰσχρός`. `ἐχθρός` ya conserva diez lecturas femeninas contrastadas fuera del inventario pendiente. Las 58 candidaturas griegas curriculares de fuente 4 permanecen candidatas.

El informe incluye todas las casillas cotejadas, rasgos comparados, discrepancias, identificadores de ficha, unidad, documento fuente y estado. **No genera automáticamente registros para incorporar**; una fase posterior deberá separar las candidaturas de las formas que el motor de exámenes ya puede construir y contrastarlas documentalmente una a una.

## Ajuste de tablas de conjugación
En la vista previa web y en el DOCX, la primera columna contiene únicamente la persona: 1.ª, 2.ª y 3.ª, con **aproximadamente un 6 % de anchura**, texto alineado a la derecha y el mismo reparto geométrico en Word. Se aplica a Latín I, Latín 4.º y Griego I. El enunciado latino queda en cursiva, pero las marcas metalingüísticas de conjugación (`1ª`–`4ª`, `mx.`, `irr.`) están en redonda, sin alterar las formas verbales.

Las pruebas `scripts/test-latin4-conjugation-isolated-forms.cjs` y `scripts/test-schola-morphology-reconciliation.cjs` verifican HTML, Word, fidelidad Unicode y ausencia de promociones. La batería general reconstruye y compara `offline.html` antes de la publicación. **No fusionar ni publicar sin aprobación del docente.**
