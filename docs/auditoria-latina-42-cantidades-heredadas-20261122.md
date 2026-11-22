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


## Segunda revisión de fuentes: evidencia antigua frente a la inferencia moderna

**Prisciano, *Institutiones grammaticae* III, 20, 7–8**, conserva un testimonio directo para `alterĭus`: `semper corripit paenultimam`. La regla enuncia una cantidad breve según Prisciano; no demuestra que toda tradición poética desde época arcaica realizase siempre esa cantidad. [Transcripción de St Gall Priscian Glosses](https://www.stgallpriscian.ie/index.php?kP=20&kV=3). **Allen y Greenough §113** describen la `-īus` original y su abreviación frecuente para *alterius*; el testimonio de Prisciano y la regla escolar no son intercambiables.

**Nullīus**: [Allen y Greenough §603](https://dcc.dickinson.edu/sv/grammar/latin/general-rules-quantity) imprime `nūllīus`, con `ī` larga, y advierte que la secuencia `-īus` puede abreviarse poéticamente. Esta regla general no sustituye un verso concreto cuya escansión demuestre `nūllĭus`. Se conserva el testimonio doble del extracto pero queda **pendiente una atestación primaria individual de la breve**. No se convierte la excepción general en hecho probado para *nullus*.

**Custōs**: [Allen y Greenough §56](https://latindictionary.co/academy/grammar/56) imprime `cūstōs`, con `ū` larga; [Dickinson Latin Core](https://dcc.dickinson.edu/latin-core/cvstos) ofrece `custōs`, sin marcar la primera vocal, mientras que otras fuentes ofrecen transcripciones con `u` breve. La `u` precede al grupo consonántico `st`: **la sílaba resulta larga por posición y la métrica no resuelve la cantidad de la vocal**. [Allen y Greenough §§9–11](https://dcc.dickinson.edu/grammar/latin/quantity-syllables) advierten de esta cantidad oculta. No se localizó una inscripción con marca explícita o una regla de gramático antiguo que autorice decidir entre `cūst-` y `cŭst-`. Quedan en reserva las doce filas.

**Princeps**: [Servio, *Commentarius in Artem Donati*, *De accentibus*, 426.7](https://latin.packhum.org/loc/2349/2/12) ejemplifica `princeps` entre las sílabas largas **por posición**, sin emitir una cantidad de la `i` como tal. El estudio [*Osthoff’s Law in Latin*](https://www.sciencedirect.com/org/science/article/pii/S2212588417000060) cita a Sihler para la variante breve y la comparación con formas romances, frente a la cantidad larga transmitida tradicionalmente. Es un argumento histórico de interés, pero no certifica por sí solo 28 flexiones como nuevas lecturas verificadas.

### Dictamen editorial y alcance

El resultado no cambia respecto a la segunda revisión del índice: **42 filas conservadas, 0 cantidades alteradas, 0 promociones a fuente 5**. Hay evidencia antigua positiva de la abreviación de *alterius*; en *princeps* la declaración antigua disponible es sobre la sílaba; y para la breve concreta de *nullius* y la cantidad de la *u* en *custos* no se ha documentado aún una fuente primaria decisiva. Es preferible preservar la trazabilidad antes que aplicar automáticamente cantidades por analogía, etimología hipotética o escansión que solo prueba duración silábica.

El expediente `latin-legacy-double-quantity-collation-20261122.json` clasifica el nivel probatorio **por lema**, asociado a las 42 filas identificadas, pero sin fingir que una sola cita acredita todos sus análisis de caso, número y género. La regresión ahora también impide perder esa documentación o promover las lecturas sin validación.
