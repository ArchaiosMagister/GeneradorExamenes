# Continuación de la auditoría filológica · Griego I · 21/11/2026

## Alcance
Continuación posterior a la fusión de la PR #203. Revisión contextual del corpus docente `data/vocabulary/greek1-units-corrected.json`, separado de las once oraciones seleccionables de `greekSentenceRows`. Se conservan catorce unidades y 471 renglones no vacíos. La auditoría no acredita formas nuevas de evaluación ni altera lemas, traducciones, índices, calificaciones o datos de usuarios.

## Ocho sustituciones puntuales comprobadas (seis casos de acento/espíritu y dos plurales)
| Unidad | Antes | Después | Justificación |
| --- | --- | --- | --- |
| UD5 | `ἀγαθήν ψυχὴν` | `ἀγαθὴν ψυχὴν` | En secuencia continua, la oxítona cambia agudo por grave antes de palabra no enclítica. |
| UD7 | `ὑμεῖς δ’ ἑμοῦ οὐκ ἀκούετε` | `ὑμεῖς δ’ ἐμοῦ οὐκ ἀκούετε` | Primera persona singular, genitivo enfático `ἐμοῦ`, espíritu suave; régimen `ἀκούω` + genitivo conservado. |
| UD10 | `οἱ δε μένοντες` | `οἱ δὲ μένοντες` | La partícula postpositiva exige acento grave en este contexto. |
| UD10 | `τών πτερῶν` | `τῶν πτερῶν` | Artículo genitivo plural `τῶν`, con circunflejo. |
| UD13 | `θνητῆς δε μητρὸς` | `θνητῆς δὲ μητρὸς` | Partícula `δὲ`, acento grave. Se respetan los demás signos de la fuente (incluida su normalización Unicode variable). |
| UD13 | `τῶν ἑχθρῶν κώμας` | `τῶν ἐχθρῶν κώμας` | Genitivo plural de `ἐχθρός` con espíritu suave. |
| UD13 (2 apariciones) | `ζῶα` | `ζῷα` | Nominativo/acusativo plural de `ζῷον`, conservando la iota suscrita. Una forma aislada y una oración. |

## Referencias de contraste
- H. W. Smyth, *Greek Grammar*, reglas de acentuación de las oxítonas: https://grammars.alpheios.net/smyth/xhtml/body.1_div1.1_div2.7.html
- H. W. Smyth, *Greek Grammar*, paradigma de pronombres personales (`ἐμοῦ`): https://ccel.org/s/smyth/grammar/html/smyth_2l_uni.htm
- Paideia Institute, tabla del artículo (`τῶν`): https://online.paideiainstitute.org/morphology-ancientgreek-articles/
- Diccionario LSJ, `ἐχθρός` y su familia: https://logeion.uchicago.edu/%E1%BC%90%CF%87%CE%B8%CF%81%CF%8C%CF%82
- Yale University Press, *Learn to Read Greek*, paradigma de `ζῷον`: https://drupal.yalebooks.yale.edu/sites/default/files/files/Media/9780300115895_Keller_Learn%20to%20Read%20Greek_Txt%201/9780300115895_excerpt.pdf

## Regresiones
Las ocho sustituciones se incorporan a `scripts/test-filologia-regimen-acento-20261121.cjs`, ya conectado a la CI Phase I y a la de versión autónoma. El test comprueba por unidad la aparición de la grafía correcta y la desaparición de la incorrecta, incluyendo las dos apariciones de `ζῷα` en UD13, además de los invariantes previos de 14 unidades, 471 renglones y 11 oraciones seleccionables.

## Pendientes no modificados por prudencia
1. Atestación contextual de `βασιλεύονται ὑπὸ τοῦ Κύρου` (UD6); no sustituir por `ἄρχονται` por mera intuición.
2. Valorar la naturalidad de `τὰς ἀρετὰς πράττουσιν` (UD5) y de `ἐπιστολὴν εἰς τὸν φίλον ἔγραφεν` (UD11) antes de corregir estilo y régimen.
3. Continuar con morfología latina de tercera declinación, regímenes y cantidades vocálicas de enunciados exigibles, sin promover análisis por analogía.

**Sin publicación:** esta revisión se deja en PR independiente, sin fusión ni despliegue hasta la CI satisfactoria y decisión docente.
