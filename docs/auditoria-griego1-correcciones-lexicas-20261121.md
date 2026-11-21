# Griego I: correcciones filológicas del vocabulario exigible
**21/11/2026 · rama aislada de auditoría · sin publicación ni fusión.**

## Errores corregidos

| Sección | Semilla anterior | Enunciado válido | Motivo |
| --- | --- | --- | --- |
| Preposiciones | ὐπό + genitivo | ὑπό + genitivo | Espíritu áspero obligatorio en υ inicial |
| UD1–4 | θέα, –ας | θεά, –ας | «diosa», no θέα «vista/espectáculo» |
| UD1–4 | θέος, –ου | θεός, –ου | Acentuación oxítona del sustantivo «dios» |
| UD1–4 | ἀληθεία, –ας | ἀλήθεια, –ας | Acento del nominativo; conservar ἀληθείᾳ en dativo singular |
| UD6–7 | ἀδικός, –ον | ἄδικος, –ον | Adjetivo proparoxítono «injusto» |
| UD6–7 | κεφαλῆ, –ῆς | κεφαλή, –ῆς | Corregir el nominativo; el genitivo en –ῆς ya era correcto |

**Séptima incidencia, semántica:** el exigible daba *διά + acusativo* como «a través de, por, a causa de»; queda «por, a causa de». En el **banco general** el lema está marcado con **genitivo y acusativo**; se explicitan ambos valores: «gen.: a través de, por medio de | ac.: por, a causa de». La traducción valenciana distingue también los casos.

**Nota curricular:** se conserva la abreviación docente de los enunciados en las fichas exigibles; no se sustituye por el formato largo del banco general ni se cambia la selección por unidades. El fichero fuente `data/greek1-materials.json` tenía todavía `κεφαλῆ`, aunque la copia incrustada en `index.html` ya se había corregido; se reconcilia la fuente para impedir regresiones al reconstruir.

## Propagación y persistencia

- Materiales exigibles: `data/greek1-materials.json`; fuentes realmente usadas en la web: `index.html`.
- Banco general y ficha nominal acreditada de **ἀλήθεια**: se actualiza únicamente el **enunciado**, sin cambiar ni promover ninguna forma individual. Se conserva el dativo `ἀληθείᾳ` con sus análisis y procedencia.
- Índice reconstruible: `data/lemmas/verified-overrides.json` contiene una única `entryCorrection` para `αληθεια`, del enunciado antiguo al nuevo, con la referencia editorial. `data/lemmas/teacher-forms.json` refleja la nueva entrada; **sin cambios en `rows`**.
- `lexicon-valenciano.js` añade las nuevas traducciones y conserva la antigua clave por retrocompatibilidad.
- La migración `migrateGreekLexicalFilology20261121` solo sustituye las **seis fichas exigibles literalmente idénticas a su semilla antigua**, dentro de su grupo curricular, y el significado original de `διά + acusativo` **solo si coincide exactamente**. Es idempotente y no repone entradas eliminadas ni modifica entradas o traducciones personalizadas.
- La copia autónoma `offline.html` se reconstruye mediante `npm run offline:build` usando los mismos archivos que la web.

## Referencias y alcance
- Dickinson College Commentaries, listado léxico de griego antiguo: https://dcc.dickinson.edu/greek-core-list (ἀλήθεια, θεός, ἄδικος, κεφαλή).
- Dickinson, índice de *Ancient Greek for Everyone*: https://dcc.dickinson.edu/grammar/age/greek-index (ἄδικος).
- Logeion, ὑπό: https://www.logeion.org/%E1%BD%91%CF%80%CF%8C.
- Smyth, *Greek Grammar*, preposiciones: https://grammars.alpheios.net/smyth/xhtml/body.1_div1.4_div2.19.html.
- Descripción de διά por casos: https://www.azimonti.com/philology/ancient-greek/syntax/uses-of-the-cases/.

Prueba permanente: `node scripts/test-greek-lexical-filology-20261121.cjs`, incluida en **Phase I** y **offline-check**. Abarca el material fuente, el banco general, el índice, el corpus fuente 5, la versión web/autónoma, la traducción valenciana y la migración con fichas editadas.

**Límites:** no se verifican ni incorporan nuevas flexiones de las 559 candidaturas históricas, no se altera el contenido de los catorce temas ni se garantiza el comportamiento de todos los navegadores por inspección estática. La integración, fusión o publicación queda sujeta a autorización posterior del docente y a las comprobaciones generales.
