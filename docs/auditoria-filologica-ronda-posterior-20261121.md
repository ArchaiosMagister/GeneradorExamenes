# Auditoría filológica posterior a la PR #205

**Base estable:** `50a017d1f2299583224a85bfef688ad5e12a2baa`. **Estado:** rama independiente, sin fusión ni publicación.

## Latín 4.º: 14 lemas, 16 apariciones corregidas

Se contrasta la cantidad de cada vocal con repertorios de pronunciación clásica, distinguiendo vocal breve de sílaba larga por posición. Todas las sustituciones son editoriales: no crean paradigmas nuevos.

| Lema | Lectura antigua | Lectura corregida | UD | Casos |
| --- | --- | --- | --- | ---: |
| silva | `sīlva, –æ` | `sĭlva, –æ` | UD6, UD7 | 2 |
| umbra | `ūmbra, –æ` | `ŭmbra, –æ` | UD3 | 1 |
| semper | `sēmpĕr (adv.)` | `sĕmpĕr (adv.)` | UD3, UD4 | 2 |
| barbarus | `bārbărus, –ī` | `bărbărus, –ī` | UD8 | 1 |
| fessus | `fēssus, –a, –um` | `fĕssus, –a, –um` | UD3 | 1 |
| hispania | `Hīspānĭa, –æ` | `Hĭspānĭa, –æ` | UD3 | 1 |
| gallus | `Gāllus, –a, um` | `Găllus, –a, –um` | UD9 | 1 |
| germanus | `Gērmānus, –a, –um` | `Gĕrmānus, –a, –um` | UD9 | 1 |
| immensus | `īmmēnsus, –a, –um` | `ĭmmēnsus, –a, –um` | UD9 | 1 |
| imperium | `īmpĕrĭŭm, –ī (n.)` | `ĭmpĕrĭŭm, –ī (n.)` | UD9 | 1 |
| invenio | `īnvĕnĭo (4ª)` | `ĭnvĕnĭo (4ª)` | UD3 | 1 |
| argentum | `ārgēntŭm, –ī` | `ărgĕntŭm, –ī` | UD3 | 1 |
| sacerdos | `săcērdōs, –dotis (m.)` | `săcĕrdōs, –dotis (m.)` | UD7 | 1 |
| patria | `pā̆trĭa, æ` | `pătrĭa, æ` | UD7 | 1 |

Referencias individuales dentro de `data/lemmas/verified-overrides.json`, principalmente diccionarios con transcripción latina clásica y https://cld.bbaw.de/lemma/lat/argentum para `argentum`. **No se cambia `māgnus`**. Se corrige además la combinación contradictoria de macrón y breve en `patria` y el guion de `Gallus`.

## Griego I: unidades 10–14

Se han examinado concordancias, regímenes, participios y genitivos absolutos, sin introducir nuevas formas ni reescribir construcciones solo por conjetura. Se han hallado cuatro líneas de UD13 (7, 9, 22 y 24) con **caracteres diacríticos combinantes**. Únicamente esas secuencias se normalizan a NFC; las grafías precompuestas de las demás 467 líneas quedan intactas. La concordancia y el significado no se alteran.

## Conservación y tests

- 1106 exigibles Latín I, 541 de Latín 4.º y 471 líneas griegas en 14 UD.
- 619 formas latinas previamente contrastadas, sin promover flexiones por analogía.
- Exigibles, banco, migración de semillas, catorce overrides persistentes e índice académico sincronizados.
- Dos pruebas existentes extendidas (cantidades latinas y acentos/regímenes griegos), con cobertura web/offline y protección de ediciones docentes manuales.
- Reconstrucción aislada de índice y `offline.html` en GitHub Actions, sin desplegar. CI general y revisión de la PR antes de fusión/publicación autorizadas.
