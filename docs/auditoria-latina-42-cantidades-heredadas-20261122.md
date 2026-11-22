# Auditoría filológica de 42 cantidades heredadas (22/11/2026)

**Objeto:** 42 registros de fuente 0 del índice `data/lemmas/teacher-forms.json`, con macrón y breve combinados sobre una sola vocal. **Resultado de revisión cruzada:** 42 testimonios inventariados y reservados, **0 correcciones de cantidad confirmadas**, **0 promociones a fuente 5**. Se conservan rasgos morfológicos y trazabilidad de la fuente. La referencia `data/lemmas/latin-legacy-double-quantity-collation-20261122.json` enumera individualmente las 42 filas y sus etiquetas.

| Lema | Registros | Lectura heredada | Dictamen |
| --- | ---: | --- | --- |
| `alter` | 1 | `alterī̆us` | La breve del genitivo está documentada poéticamente; la larga es regular. Reservar como fenómeno métrico. |
| `custos` | 12 | `cū̆st-` | Evidencia **discordante** en fuentes secundarias para la `u` inicial. **No** reducir a `cūst-` ni a `cŭst-` hasta nueva comprobación de fuente primaria. |
| `nullus` | 1 | `nūllī̆us` | Genitivo en `-īus` con cantidad susceptible de abreviación poética; no uniformar en el índice histórico. |
| `princeps` | 28 | `prī̆nc-` | Las fuentes reflejan tanto la cantidad larga tradicional como indicios antiguos de breve; reservar las lecturas nominales y adjetivales. |
| **Total** | **42** | | **42 reservados, sin cambio** |

## Referencias y criterio

- *alter, nullus*: [Allen y Greenough §113](https://dcc.dickinson.edu/grammar/latin/1st-and-2nd-declension-adjectives-genitive-%C4%ABus-dative-%C4%AB), sobre la larga del genitivo y sus abreviaciones en verso; [Lewis y Short, *alter*](https://www.alatius.com/ls/index.php?met=up&ord=alteras), con ejemplos de métrica.
- *custōs*: [Wiktionary inglés](https://en.wiktionary.org/wiki/custos) representa el latín clásico `[ˈkʊs.toːs]`, que indica vocal inicial breve; [Wikcionario español](https://es.wiktionary.org/wiki/custos) da `/ˈku.stoːs/` (u no larga). En cambio, el [Wiktionary alemán](https://de.wiktionary.org/wiki/custos) ofrece sistemáticamente `cūstōs, cūstōdis`. [Dickinson College Commentaries](https://dcc.dickinson.edu/latin-core/cvstos) escribe `custōs` sin marcar larga la `u`. **Dadas estas discrepancias, la normalización a `cūst-` que se ensayó inicialmente en esta PR fue retirada**. Una entrada sin macrón no demuestra por sí sola brevedad, por lo que tampoco se impone `cŭst-` desde ese dato aislado. Se buscará una autoridad prosódica o evidencia contextual primaria antes de corregir.
- *princeps*: [Dickinson College Commentaries](https://dcc.dickinson.edu/sv/grammar/latin/3rd-declension-mute-stems-m-f) presenta `prīnceps`; el estudio [*Osthoff’s Law in Latin*](https://www.sciencedirect.com/org/science/article/pii/S2212588417000060) explica el testimonio de gramáticos romanos para la breve y la grafía italiana arcaica `prence`; [Wiktionary](https://en.wiktionary.org/wiki/princeps) resume el debate de cantidad vocálica.

## Criterio metodológico

Los 42 registros son testimonios heredados de fuente 0, **no formas individualmente autorizadas para corregir exámenes**. El macrón más breve combinados no son una forma escolar recomendable de exhibir la cantidad, pero el registro de origen debe separarse de una futura representación docente. La evaluación automática no se modifica.

Se mantiene la misma fuente y la misma información morfológica en 14.507 filas latinas y 2.817 griegas. La reconstrucción de `scripts/build-lemma-index.mjs` consulta las 42 claves del expediente y falla si falta o sobra alguna, sin cambiar las superficies mientras exista discusión. `scripts/test-filologia-latin-legacy-double-quantity-20261122.cjs` verifica los 42 registros, la ausencia de promociones a fuente 5 y la cobertura exacta de cuatro lemas. La batería está integrada en las CI de Phase I y versión autónoma.

## Historial de la rectificación

Se había propuesto cambiar doce registros de `cū̆st-` a `cūst-` con una fuente que trataba la `u` como larga, pero el nuevo cotejo cruzado reveló fuentes que describen pronunciación breve. **La corrección fue revertida en la rama de trabajo antes de publicar**. El expediente sigue siendo útil: identifica exactamente los 42 testimonios y la evidencia que falta para emitir un dictamen definitivo. No se eliminan registros ni se atribuye una certificación inexistente.

**Estado:** PR #210 en borrador, sin fusión y sin publicación, sujeta a reconstrucción y CI completa en el SHA definitivo.

## Reproducción autónoma tras la rectificación

La reconstrucción aislada volvió a generar el índice desde el extracto fijado sin diferencias y creó la nueva copia `offline.html`. El [commit de sincronización `cc05dc2`](https://github.com/ArchaiosMagister/GeneradorExamenes/commit/cc05dc2685ded29b23c40209d29087446ce678af) elimina también el workflow temporal. No fusiona la PR ni despliega en producción. Se requiere CI completa del commit final posterior al expediente.
