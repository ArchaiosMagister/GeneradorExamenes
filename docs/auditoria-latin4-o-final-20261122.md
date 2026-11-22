# Auditoría filológica de la cantidad final -ō · Latín 4.º
**22 de noviembre de 2026.** Nueva ronda tras la publicación de la PR #209.

Se han examinado las 1647 entradas exigibles (1106 Latín I y 541 Latín 4.º). Se detectan **siete** marcas incompatibles en **cuatro lemas**: la -ō del nominativo aparece a la vez larga y breve (`ō̆`).

| Lema | Unidades | Antes | Ahora | Fuente |
| --- | --- | --- | --- | --- |
| homō | 6, 7, 9 | `hŏmō̆` | `hŏmō` | [Dickinson College Commentaries](https://dcc.dickinson.edu/latin-core/homo) |
| oppugnātiō | 6 | `ŏppūgnātĭō̆` | `ŏppūgnātĭō` | [Lewis, *Elementary Latin Dictionary*](https://www.set-u.org/library/perseus-lewis-elementary/pages/57) |
| Cicerō | 7 | `Cĭcĕrō̆` | `Cĭcĕrō` | [Cicerō, Cicerōnis](https://es.wiktionary.org/wiki/Cicero) |
| legiō | 7, 10 | `lĕgĭō̆` | `lĕgĭō` | [Lewis, *Elementary Latin Dictionary*](https://www.lateinlex.de/?call=ShowArticle&id=2112&latein=legio) |

Se conserva la cantidad de las demás vocales tal y como figura en las fuentes docentes, así como el género, la traducción y las unidades. El cambio es **editorial**, no acredita flexiones nuevas. Solo se sustituye el enunciado `Cĭcĕrō̆` del índice de lematización; sus registros de formas y sus referencias permanecen inalterados.

El banco de `index.html` y las listas de `required-latin-units.js` contienen las siete correcciones. La migración del exigible cargado de sesiones anteriores conserva las glosas docentes y no toca entradas manuales. La PWA se reconstruye desde el código original, sin modificarla mediante sustituciones textuales aisladas.

La auditoría también encontró registros históricos del índice con marcas combinantes `ī̆` y `ū̆` (por ejemplo, `prī̆nceps` y `cū̆stōs`). Son filas heredadas que precisan cotejo individual; **no se modifican**, no se declaran verificadas y quedan en una cola filológica posterior.

La regresión `scripts/test-filologia-latin4-final-o-20261122.cjs` verifica las siete apariciones, los 1647 exigibles, el banco, la migración y la paridad del índice en el archivo autónomo. La validación final exige el resultado success de Phase I y de la CI offline, y consentimiento docente para fusionar o publicar.
