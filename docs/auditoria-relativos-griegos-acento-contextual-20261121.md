# Griego I: colación contextual de relativos y regresión CI (21/11/2026)

**Rama aislada de auditoría posterior a PR #207. Sin fusión ni publicación.**

## Alcance filológico

Cotejo de los **471 renglones docentes de las 14 unidades**, centrado en las formas del relativo `ὅς, ἥ, ὅ` que preceden inmediatamente a palabras independientes. Se han registrado y corregido **26 ocurrencias** sin cambiar lemas, glosas, sintaxis, unidades, cuotas, motores de examen, solucionarios ni el índice morfológico.

| Unidad | Ocurrencias corregidas | Ejemplos |
| --- | ---: | --- |
| UD9 | 19 | `ὅς τὸ` → `ὃς τὸ`; `οἵ κακὰ` → `οἳ κακὰ`; `ὅ ὁ` → `ὃ ὁ` |
| UD10 | 1 | `οὕς ἡ` → `οὓς ἡ` |
| UD11 | 2 | `ἅ ὁ` → `ἃ ὁ`; `ὅν εἶχε` → `ὃν εἶχε` |
| UD12 | 3 | `οἵ ἐν` → `οἳ ἐν`; `οἵ τῶν` → `οἳ τῶν` |
| UD13 | 1 | `ὅς Ἀχιλλέα` → `ὃς Ἀχιλλέα` |

Se identifican por **unidad, número de línea, contexto íntegro y secuencia concreta** en `data/vocabulary/greek1-relative-grave-audit-20261121.json`. **No** se aplica una sustitución textual global ni se modifican formas del paradigma descontextualizado. Tampoco se alteran los acentos legítimos ante enclíticos ni el interrogativo `τίς`.

**Fundamento:** Smyth, *Greek Grammar*, [§154](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.1_div2.7.html): las oxítonas cambian el agudo final por grave ante otra palabra de la misma oración, salvo excepciones (enclíticos, interrogativos, etc.). [§338](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.6.html): paradigma de los relativos.

## Cotejo adicional: 15 apariciones ambiguas del analizador

Tras las 26 correcciones diacríticas, la regresión offline ha revelado que el lematizador devuelve tres superficies con doble propuesta: **οἳ (11 veces), ὃν (3) y ἣν (1)**. La lectura de las 15 oraciones es de relativo `ὅς, ἥ, ὅ`, no del artículo ni de `εἰμί`. Las propuestas automáticas se mantienen sin alteración, incluso donde resulten espurias.

Se han documentado en `data/vocabulary/greek1-relative-contextual-attestations-20261121.json` **las quince ocurrencias** con UD y línea, oración exacta, antecedente, función sintáctica, categoría, caso, género y número y las alternativas que ofrece actualmente el analizador. La evidencia se protege con una comparación por posición, recuentos, enunciado y conjunto de candidatos. Si cambia cualquiera de estos datos, el cotejo se invalida y requiere revisión.

| Forma | Número | Interpretación en este corpus |
| --- | ---: | --- |
| `οἳ` | 11 | Nominativo plural masculino; sujeto de la subordinada relativa |
| `ὃν` | 3 | Acusativo singular masculino; objeto directo del verbo subordinado |
| `ἣν` | 1 | Acusativo singular femenino; objeto directo de `γράφει` |

**Precisión metodológica:** `GREEK_FULL_AUDIT` considera estas ocurrencias «documentadas» solo en el **informe de este corpus**, sin modificar el estado interno `review` del lematizador ni añadir filas al índice. No se certifican paradigmas ni se habilitan automáticamente como respuestas evaluables. Se prohíbe su aceptación si aparece una ocurrencia no cotejada.

Referencias: [Smyth §154](https://ccel.org/s/smyth/grammar/html/smyth_1f_uni.htm), [*Cambridge Grammar of Classical Greek*, §50 (relativos)](https://www.cs.toronto.edu/~simon/Athens/Thucydides3/cgcg.pdf).

## Control de regresión

- `scripts/audit-greek-all-units.cjs --require-clean` comprueba las tres superficies ambiguas, sus quince contextos y los candidatos no alterados, sin aprobación automática del lematizador.
- `scripts/test-greek-relative-grave-20261121.cjs` comprueba las **26 líneas exactas del JSON curricular**, su lectura original, la sustitución únicamente diacrítica, 14 UD, 471 renglones y la identidad de las 11 oraciones evaluables entre la web y el HTML autónomo. El corpus curricular no está embebido literalmente en `offline.html` y se comprueba en su fuente persistente; no se afirma una paridad textual inexistente.
- El índice `teacher-forms.json` permanece inalterado: **2817 filas griegas, 478 de fuente 5**. No hay nuevas certificaciones ni aceptación automática.
- Se corrige en las **dos CI** un defecto previo del YAML: `test-greek-systematic-morph-syntax-20261121.cjs` figuraba como continuación plegada del `run:` de perfectos de UD13, por lo que no se ejecutaba como comando independiente. Ahora cuenta con paso propio.
- La nueva prueba se añade a Phase I y a la batería offline. `offline.html` debe reconstruirse mediante un workflow aislado y después verificarse con la CI completa.

**La evidencia es ortográfica contextual; no supone una certificación de todos los paradigmas ni de todas las construcciones sintácticas.**

**Decisión editorial:** mantener la PR en borrador y la versión principal intacta hasta superar las cinco baterías de CI y recibir consentimiento docente para fusionar/publicar.
