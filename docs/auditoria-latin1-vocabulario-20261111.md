# Vocabulario por unidades de Latín I · revisión del 11-XI-2026

## Material y método

Corpus de **612 apariciones originalmente pendientes**, distribuidas en diez unidades y entregadas por el profesor en el documento Markdown de la exportación Word. Son **546 grafías distintas**, que se agrupan en **533 claves normalizadas** cuando se ignoran mayúsculas y equivalencias ortográficas; no representa todo el vocabulario latinizado ni todos los textos originales. Se conserva como `tests/latin1-revision-forms-20261111.json`.

La auditoría ejecutable es `node scripts/audit-latin1-generated.cjs`. Se lematizan las palabras contra el banco docente actual y el índice offline, separando reconocidas, desconocidas y ambiguas. La comparación se basa en el mismo conjunto de formas, antes y después del parche.

| UD | Pendientes antes | Reconocidas ahora | Aún pendientes |
|---|---:|---:|---:|
| 1 | 11 | 8 | 3 |
| 2 | 14 | 6 | 8 |
| 3 | 31 | 28 | 3 |
| 4 | 30 | 23 | 7 |
| 5 | 80 | 72 | 8 |
| 6 | 56 | 45 | 11 |
| 7 | 47 | 42 | 5 |
| 8 | 68 | 62 | 6 |
| 9 | 88 | 49 | 39 |
| 10 | 187 | 94 | 93 |
| **Total** | **612** | **429** | **183** |

Los 183 restantes incluyen **83 lecturas para revisión** (ambigüedad real o paradigma propuesto no certificado) y **100 formas sin análisis seguro**. Reducir estas cifras indiscriminadamente sería filológicamente contraproducente.

## Cambios funcionales

- En la exportación Word, **solo el enunciado latino está en cursiva**; las etiquetas en paréntesis —género, conjugación, preposición y régimen, restricciones de número— se imprimen en redonda. No se altera la grafía de la ficha.
- Modelos escolares finitos basados en enunciados explícitos: flexiones nominales y de adjetivos transparentes; infinitivos, indicativos y participios regulares; perfectos a partir del tema realmente dado. No se presupone un perfecto para verbos que carecen de él en el banco.
- Pronombres personales y demostrativos frecuentes, irregulares de gran uso y numerales con repertorios de formas explícitos. La distinción entre lemas homógrafos se conserva.
- Reconocimiento de `-que` solo cuando la base está respaldada por una lectura del banco o de los modelos explícitos, y de variantes gráficas `æ/ae`, `œ/oe`, `u/v`.
- Se descartan inferencias inseguras de neutros de tercera y superlativos irregulares; las formas deducidas exclusivamente del supino, sin contraste independiente, se ofrecen como **revisión**, no como verificadas.
- Los lemas complementarios de gramática escolar se usan solo si no está el lema en el banco docente. Se mantienen los enunciados y las glosas docentes existentes.

## Criterios y límites

«Reconocida» es una **clasificación funcional del generador**, y no significa que una flexión haya sido validada individualmente contra Collatinus/LEMLAT3 o incorporada al índice de verificadas. El fichero `data/lemmas/teacher-forms.json` no ha cambiado y no se han añadido aprobaciones externas automáticas.

Los pendientes incluyen nombres propios, posibles erratas (p. ej., `clasis`, `consilo`, `pasuum`, `nonulli`) y homógrafos auténticos (p. ej., `bona`, `bello`). Se requiere contexto o revisión individual, no una sustitución automática.

La auditoría de las diez unidades y las pruebas de formato Word forman parte de GitHub Actions. Actualizar el corpus exige una revisión explícita, para que la mera desaparición de asteriscos no aparente una mejora.
