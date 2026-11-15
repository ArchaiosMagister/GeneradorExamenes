# Auditoría de enunciados verbales abreviados de Latín 4.º — 15/11/2026

## Criterio y fuentes

Se cotejan los registros del vocabulario integrado de Latín 4.º con sus equivalentes de Latín I y el índice `data/lemmas/teacher-forms.json`. El objetivo no es completar indiscriminadamente paradigmas, sino detectar cuándo una notación **explícitamente docente** no se aprovecha para lematizar.

De los **cuatro** enunciados de la UD6 con el patrón abreviado `–āvī, –ātum (1ª)`:

| Lema | Fuente de supino completo en los bancos | Resolución |
|---|---|---|
| `libero` | `libero, liberavi, liberatum` en Latín I | Ya aprovechada |
| `navigo` | `navigo, navigavi, navigatum` en Latín I | Ya aprovechada |
| `nomino` | `nomino, nominavi, nominatum` en Latín I | Ya aprovechada |
| **`transporto`** | No consta enunciado completo en los bancos consultados | **Laguna reproducible** |

**Caso reproducible:** `trānsportō, –āvī, –ātum (1ª)` expresa la raíz y ambos temas mediante abreviaturas regulares; el motor anterior exigía cadenas completas para el perfecto y el supino. Como consecuencia no incorporaba por esta vía `transportaverat`, `transportatus est` o `transportatae erant`.

## Solución

`latinPrincipalParts` interpreta **exclusivamente** la pareja de terminaciones `–āvī` y `–ātum` con la marca `(1ª)` y primera persona acabada en `-o`. Restituye internamente el tema a partir de la forma de cita (p. ej., `transport-o` → `transport-avi` / `transport-atum`). Su utilización es compartida por la expansión de las flexiones simples y la detección de participio perfecto pasivo + `sum`.

No se modifica el texto del enunciado original, su traducción, la unidad, los IDs, la exigibilidad, el índice documental ni las lecturas ya decididas. El participio calculado **no pasa a verificarse automáticamente**: la interpretación compuesta se ofrece al profesor con aviso de «paradigma deducido», y nunca se selecciona de oficio.

## Casos negativos expresos

- `porto (1ª)`: no consta perfecto ni supino; no producir `portatus est` por mero parecido formal.
- `resisto, restiti, – (3ª)`: ausencia de supino; no generar una pasiva perfecta supuesta.
- Concordancia, puntuación y separación por palabras: seguir impidiendo `transportatus erant` y `transportatus, est`.
- No aplicar la expansión a abreviaturas de otras conjugaciones o irregulares.

## Cobertura de las pruebas

El test `scripts/test-latin-passive-phrases.cjs` comprueba los tres tiempos compuestos, singular/plural, el perfecto simple `transportaverat`, la advertencia de inferencia, la decisión manual por aparición y la preservación del texto en `index.html` y `offline.html`. La batería de regresión existente mantiene comprobaciones de Word, PWA, morfología y glosas castellano/valenciano.

## Trabajo pendiente, separado de esta corrección

Los verbos que aparecen **solo con presente**, o con guion de supino inexistente, siguen sin aportar legítimamente temas de perfecto pasivo. Antes de completar esas fichas, obtener y contrastar una fuente lexicográfica o una decisión docente por lema; no confundir una laguna de los datos con un fallo del lematizador.
