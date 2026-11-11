# Auditoría integral del vocabulario de Griego I · 14 unidades

Fecha: 11-11-2026. Ámbito: los **textos persistentes** de `data/vocabulary/greek1-units-corrected.json`, no solo la muestra `tests/greek-priority-forms.json`.

## Método
Ejecutar `node scripts/audit-greek-all-units.cjs --require-clean` después de reconstruir el índice local. Se tokenizan los textos de las 14 unidades según las mismas reglas Unicode y elisión que el generador, se conservan los acentos y se lematizan las formas con `ExaminaVocabulary.analyze`. El informe diferencia `documented`, `review` y `unknown`, indica ocurrencias y fragmentos de contexto y muestra explícitamente los casos de una sola aparición.

**Advertencia:** «documented» es el estado de reconocimiento de este generador; **no equivale a certificación filológica individual de cada flexión**. No se añaden registros a `data/lemmas/teacher-forms.json` ni se aprueban automáticamente propuestas de Eulexis.

## Situación previa y posterior

| Indicador | Antes | Después |
|---|---:|---:|
| Unidades | 14 | 14 |
| Tokens | 3021 | 3021 |
| Formas distintas | 1037 | 1035 |
| Reconocidas | 1025 | 1035 |
| Pendientes por ambigüedad | 7 | 0 |
| Desconocidas | 5 | 0 |
| Formas distintas con una aparición | 630 | 628 |
| De una aparición pendientes | 10 | 0 |

La disminución de dos formas distintas se debe a correcciones puntuales de **τὶ → τί** (interrogativo en UD8) y **ἠ → ἡ** (artículo en UD10), no a eliminación de material.

## Incidencias resueltas

- `τὶ`, en «περὶ τὶ λέγει…»: se corrige a **τί** por su valor interrogativo. **Solo ese contexto**, no toda aparición del enclítico `τὶ`.
- `ἠ`, en «… ἠ ψυχὴ…»: se corrige a **ἡ** por su función de artículo.
- `τινας`, `τινι`, `τινος`, `τισὶ`: se importa el tratamiento de las variantes del indefinido `τις, τι` ya aprobado en la PR #49 de `main`. Se mantiene la distinción gráfica con `τίς, τί`.
- `νίκαι`: nominativo plural de **νίκη** en «αἱ τῶν στρατιωτῶν νίκαι»; el contexto resuelve la aparente competencia con `νικάω`.
- `Δημοσθένης`: nombre propio en nominativo, con glosa «Demóstenes» sin extrapolar flexiones.
- `εἶχεν` (ἔχω), `ἔφυγεν` (φεύγω), `σωτηρίας` (σωτηρία) y `ἑώρα` (ὁράω): incorporación de las formas concretas ya contrastadas en la revisión anterior, sin extrapolar paradigmas.

## Decisiones de conservación

- Se mantienen los **textos de las 14 unidades** salvo las dos correcciones contextualizadas.
- Se preservan todas las glosas docentes existentes; solo se proporcionan glosas de referencia a nuevas formas que carecían de enunciado local.
- La corrección se añade a la fuente persistente de la rama de la PR #29. La versión publicada de `main` y la vista previa de esa PR son superficies distintas hasta la fusión definitiva.
- El script de auditoría **no altera datos** y permite revisar futuras adiciones de textos poco frecuentes sin aprobarlas automáticamente.

La nueva auditoría pasa en GitHub Actions; se recomienda conservarla en CI para evitar regresiones.
