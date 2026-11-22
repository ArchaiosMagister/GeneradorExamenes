# Auditoría de progresión de paradigmas verbales (22/11/2026)

## Incidencia reproducida en código
La tabla general de análisis (`latinExamFormCandidates`) recurría a todos los lemas de los dos bancos latinos en el modelo morfológico y admitía `verb(x)` sin comprobar las unidades de introducción de los paradigmas especiales. Por su parte, la tabla específica de formas verbales (`latinMorphologyVerbPool`) admitía irregulares desde cualquier unidad. La condición para deponentes no protegía la selección general de análisis.

## Corrección mínima
Una sola comprobación (`latinSpecialVerbEligible`) controla las tres entradas a la generación: la selección de las formas individuales de análisis, la tabla verbal morfológica y la incorporación de registros verbales explícitos. No se modifican las reglas de conjugación ni los datos académicos.

### Latín I
- **UD1:** `sum`.
- **UD2:** `eo`.
- **UD4:** `pereo`.
- **UD5:** `confero`, `transeo`.
- **UD7:** deponentes que ya tienen evidencia explícita.
- **UD8:** `possum`, `redeo`.
- **UD9–10:** `absum`, `praesum`; semideponentes con evidencia explícita.
- **UD11–12:** `abeo`, `ineo`, `nolo`.

Las formas regulares no se restringen por su procedencia léxica: la decisión previa de practicar toda la conjugación regular ya estudiada sigue vigente. La existencia de un lema no acredita tiempos que aún no cuenten con formas contrastadas.

### Latín 4.º
No se toman verbos irregulares o deponentes que solo existan en Latín I: cada verbo especial debe figurar en el vocabulario del propio curso y haber alcanzado su unidad. En las tablas de conjugación subsiste la prohibición de irregulares salvo `sum`. Los paradigmas regulares conservan los filtros anteriores.

## Sincretismos
Se conservan las exclusiones para `loqueris`, `sequeris`, `proficisceris` y la deduplicación de análisis que no permiten respuesta única sin contexto. No se hace ninguna promoción de fuentes históricas ni se añade perfecto deponente por analogía.

## Pruebas automáticas
`scripts/test-latin-verbal-curriculum-20261122.cjs` comprueba dos cursos, castellano y valenciano, web y autónoma; analiza ambos caminos de selección de verbos, un conjunto de unidades delimitadoras, regulares, voces y sincretismos. Se integra en CI en `.github/workflows/offline-check.yml`.

## Protección de la versión publicada
Cambio propuesto únicamente en PR en borrador. No fusionar a `main` ni publicar sin confirmar todas las baterías posteriores al último commit y autorización docente.
