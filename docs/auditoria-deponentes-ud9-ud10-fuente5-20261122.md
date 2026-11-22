# Latín I — presentes deponentes de UD9–10: segunda acreditación individual

**Fecha:** 22-11-2026. **Alcance:** PR #220, apilada sobre #218, sin fusión ni publicación.

## Casillas de indicativo presente incorporadas (fuente 5)

Orden: primera, segunda, tercera persona singular; primera, segunda, tercera persona plural.

| Lema | Enunciado de Latín I | Seis formas acreditadas | Fuentes de cotejo |
| --- | --- | --- | --- |
| `gratulor` | gratulor, gratulatus sum (1ª) | gratulor; gratularis; gratulatur; gratulamur; gratulamini; gratulantur | [LatinDictionary](https://www.latindictionary.io/entry/gratulor-gratulari-gratulatus-sum), [Latin is Simple](https://www.latin-is-simple.com/en/vocabulary/verb/4129/) |
| `miror` | miror, miratus sum (1ª) | miror; miraris; miratur; miramur; miramini; mirantur | [LatinDictionary](https://www.latindictionary.io/entry/miror-mirari-miratus-sum-27017), [Latinando](https://latinando.it/coniugazione/miror) |
| `polliceor` | polliceor, pollicitus sum (2ª) | polliceor; polliceris; pollicetur; pollicemur; pollicemini; pollicentur | [LatinDictionary](https://www.latindictionary.io/entry/polliceor-polliceri-pollicitus-sum), [Wikcionario](https://en.wiktionary.org/wiki/polliceor) |
| `patior` | patior, passus sum (mx.) | patior; pateris; patitur; patimur; patimini; patiuntur | [Landesbildungsserver](https://www.schule-bw.de/faecher-und-schularten/sprachen-und-literatur/latein/sprache/konjugation-des-verbs/konjugationen/deponentien-gemischte-konjugation.html), [LatinDictionary](https://www.latindictionary.io/entry/patior-pati-passus-sum) |

### Precauciones filológicas

- Los cuatro presentes han sido cotejados con etiquetas exactas `V;IND;DEP;PRS;1;SG` … `V;IND;DEP;PRS;3;PL`. No se deriva imperfecto, futuro, perfecto, pluscuamperfecto ni subjuntivo por analogía.
- **No se acreditan ni se preguntan como únicas lecturas** `gratulare`, `mirare`, `pollicere` y `patere`: las variantes en `-re` de segunda singular coinciden con imperativos de presente.
- `patior` mantiene su clasificación escolar de tercera mixta y el perfecto `passus sum`. No se extrapolan sus formas a `orior`.
- `miror` ya tenía un registro previo `mirati` de participio perfecto en fuente 5; se preserva **además** de las seis personas de presente. Por tanto, `miror` tiene 7 filas de fuente 5, de las cuales 6 son presentes.
- Siguen excluidos de esta acreditación `nascor`, `obliviscor`, `orior`, `revertor`, `utor` y otros deponentes sin cotejo completo. Los perfectos alternantes de `revertor` continúan pendientes de tratamiento por uso y cronología.

### Control curricular

**Las unidades léxicas UD9–10 no limitan las prácticas morfológicas de Latín I:** por decisión docente previa, la morfología utiliza el banco compartido completo y se limita según la gramática estudiada. Por tanto, las formas deponentes (incluidos `loquor`, `sequor` y los cuatro nuevos lemas) **son elegibles desde UD7**, pero nunca en UD6 ni antes. Se conserva la regla `deponent?7` y se comprueba expresamente tanto en `latinMorphologyVerbPool` como en `latinExamFormCandidates`. La unidad UD9–10 se conserva como procedencia léxica, no como bloqueo de análisis morfológico.

### Reconstrucción y comprobaciones

- Registros latinos de fuente 5: **643 → 667** (24 nuevos; no se modifica la fuente 0).
- Total de filas latinas del índice: **14.531 → 14.555**.
- Casillas verbales explícitas visibles del generador: **594 → 618**.
- `data/lemmas/verified-overrides.json` sigue siendo el origen persistente, y `scripts/build-lemma-index.mjs` reconstruye `data/lemmas/teacher-forms.json`. `npm run offline:build` produce `offline.html` desde los bancos actualizados.
- Los tests verifican la procedencia, las seis personas por lema, la conservación de `mirati`, la ausencia de otros tiempos, los sincretismos, el umbral gramatical UD7 y el banco compartido en web/autónoma ES/VA.

**Estado editorial:** revisión experimental en borrador, sin autorización de fusionar ni publicar; la PR #218 es la dependencia previa y la auditoría #219 continúa independiente.
