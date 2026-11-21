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

## Control de regresión

- `scripts/test-greek-relative-grave-20261121.cjs` comprueba las **26 líneas exactas**, su lectura original, la sustitución únicamente diacrítica, 14 UD, 471 renglones, 11 oraciones evaluables y sincronización offline.
- El índice `teacher-forms.json` permanece inalterado: **2817 filas griegas, 478 de fuente 5**. No hay nuevas certificaciones ni aceptación automática.
- Se corrige en las **dos CI** un defecto previo del YAML: `test-greek-systematic-morph-syntax-20261121.cjs` figuraba como continuación plegada del `run:` de perfectos de UD13, por lo que no se ejecutaba como comando independiente. Ahora cuenta con paso propio.
- La nueva prueba se añade a Phase I y a la batería offline. `offline.html` debe reconstruirse mediante un workflow aislado y después verificarse con la CI completa.

**La evidencia es ortográfica contextual; no supone una certificación de todos los paradigmas ni de todas las construcciones sintácticas.**

**Decisión editorial:** mantener la PR en borrador y la versión principal intacta hasta superar las cinco baterías de CI y recibir consentimiento docente para fusionar/publicar.
