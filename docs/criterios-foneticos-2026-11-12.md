# Criterios docentes de evolución fonética — 12 de noviembre de 2026

## Decisiones aprobadas en los dos repositorios

| Étimo | Resultado | Normas seleccionables en GeneradorExamenes |
|---|---|---|
| *seniorem* | señor | N03 (apócope de -e) y N13 (palatalización de -ni-) |
| *sensum* | seso | N01 (abertura u → o) y N15 (simplificación -ns- → -s-) |
| *sponsam* | esposa | N14 (prótesis e-) y N15 (simplificación -ns- → -s-) |
| *sponsum* | esposo | N01 (abertura), N14 (prótesis) y N15 (simplificación) |

Para las cuatro se registra además `normasFijas:["FIX_M"]`, fuera del conjunto N01–N20. No se interpreta la pérdida de -m como apócope N03. La i de -ni- en *seniorem* ya participa en la palatalización N13 y no se evalúa de nuevo como síncopa N16.

## Regla general para el banco presente y futuro

1. Las fichas que terminan en -m reciben FIX_M, norma fija **no seleccionable**. Las fichas sin -m final no deben contenerla.
2. Si una palabra latina termina en -um y el resultado castellano termina en -o, N01 debe constar junto a FIX_M; no son el mismo cambio. Si la correspondencia de una nueva ficha no es esa, pasa a revisión antes del sorteo.
3. El grupo -ns- reducido a -s- se registra con N15. N16 solo cabe adicionalmente cuando haya una **síncopa independiente y documentada**, como en *insŭlam → isla*.
4. Una apócope N03 genuina (por ejemplo, pérdida de -e tras la desaparición de la -m del acusativo) se mantiene; la mera pérdida fija de -m no da lugar a N03. Por ello se corrige *iam → ya* a N06 + FIX_M, sin N03.
5. Los datos de transmisión (patrimonial, culta, regional) y las decisiones de exclusión anteriores **no se modifican**. Que una combinación de letras sea mecánicamente plausible no prueba una etimología.

## Alcance exacto

- `data/fonetica/banco_examenes.json`: 655 fichas; 531 con -m final y 249 con -um final. Se completa N01 en 202 fichas que carecían de ella y se guardan FIX_M y las cuatro resoluciones. Se conserva el estado `APTO_PROPUESTO` como propuesta didáctica, no como certificación histórica.
- `data/fonetica/lat1-programacion.json`: 73 fichas, 67 aptas y 6 en revisión. Se completa N01 en 27 fichas aptas y se documenta FIX_M. Las seis pendientes no se vuelven elegibles.
- `data/fonetica/banco_examenes.tsv`: se sincronizan las anotaciones del listado histórico de 330 filas; no es el banco activo.
- `data/fonetica/decisiones-docentes.json`: cuatro resoluciones expresas individuales y política general persistente.
- El filtro estricto sigue activo. Como N01 ya debe seleccionarse para -um > -o, en UD0 de Latín I las candidatas compatibles pasan de 175 a 103, con suficientes alternativas para un examen de cuatro palabras.

## Protección de futuras incorporaciones

`data/fonetica/criterios-docentes.mjs` proporciona `normalizarFichaFonetica`, `prepararAltaFonetica`, `erroresCriteriosFoneticos`, `erroresBancoFonetico` y `erroresProgramacionFonetica`. Las nuevas fichas se normalizan antes del alta; el validador impide la publicación si persisten reglas faltantes, la -m fija se confunde con N03, o una síncopa N16 en un grupo -ns- carece de evidencia independiente.

La validación se aplica en el selector de exámenes y en `scripts/build-offline.mjs`; el workflow de GitHub Pages comprueba los criterios antes de generar o publicar. Los nuevos tests negativos simulan etiquetas antiguas para garantizar que no regresen. La versión offline reconstruida incorpora el mismo JSON canónico.

La homologación **no modifica** `ArchaiosMagister/EvolucionFonetica`; allí las mismas decisiones estaban ya registradas. Cualquier discrepancia histórica distinta debe abrirse a revisión docente.
