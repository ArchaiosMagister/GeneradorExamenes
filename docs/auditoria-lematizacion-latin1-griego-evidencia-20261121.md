# Auditoría de lematización de Latín I y evidencia griega (21-XI-2026)

**Rama:** PR #206 (borrador; no fusionar ni publicar).

## Latín I: dos fichas de UD5 sin paradigma en el índice académico

- **certo − (1ª), «combatir».** El banco del examen y la lista exigible conservan el enunciado abreviado, mientras el modelo auxiliar `certo, certavi, certatum (1ª)` lleva la glosa genérica «competir, luchar». La búsqueda anterior no reconocía el lema de la ficha porque retenía el signo «−». Se modifica únicamente el glosario para aprovechar los temas del suplemento, sin sustituir la glosa docente. Regresiones: `certant`, `certaverunt`.
- **aufugio − (mx.), «huir».** El suplemento propone `aufugio, aufugi, – (mx.)`; la búsqueda de la ficha abreviada se repara de la misma manera. Regresiones: `aufugit`, `aufugerunt`, `aufugerat`. `aufugit` admite presente o perfecto; identificar el lema no determina el tiempo.
- **Límite de evidencia:** ni `certo` ni `aufugio` constan actualmente como lemas del índice `data/lemmas/teacher-forms.json`. No se acreditan por analogía nuevas casillas ni se añade la fuente 5; no se altera la exigibilidad ni el banco docente.

Referencias: [certo — Lewis & Short](https://cld.bbaw.de/lemma/lat/certo), [aufugio — Lewis & Short](https://cld.bbaw.de/lemma/lat/aufugio).

## Expresiones de varias palabras

- `non vis` es una variante gráfica separada de `nonvis`. Se conserva como `multiword: true` en `data/lemmas/filological-variant-decisions.json`. El analizador de palabras no debe reconocerla como un único token: el test consulta el índice y comprueba el análisis en dos palabras.
- Participio perfecto pasivo + `sum`: el generador ya dispone de `passivePhrases` y `scripts/test-latin-passive-phrases.cjs`. Las concordancias de número y propuestas procedentes del supino deben permanecer pendientes si carecen de contraste individual; no se fabrican formas certificadas.

## Griego I: cotejos del corpus real

- **UD14, oración 34:** `τίσιν ... ἡγεῖσθε; δούλοις τισιν ... ἡγούμεθα.` El dativo de persona con `ἡγέομαι` en el sentido «guiar» es clásico: *Cambridge Grammar of Classical Greek*, §30, y LSJ. Se conserva la construcción.
- **UD12, ἀκροάματι:** dativo singular documentado de `ἀκρόαμα`. El cotejo sigue siendo específico de esa ocurrencia; el analizador continúa clasificándolo como candidato para revisión.
- **UD12, ὀνόματα:** acusativo plural neutro de `ὄνομα` en `τὰ τῶν στρατιωτῶν ὀνόματα`. La corrupción de once entradas de UniMorph para este lema sigue en cuarentena; no se restaura todo el paradigma a partir de una forma.
- Las 471 líneas de 14 UD no se modifican en esta ronda; las construcciones no apoyadas por evidencia suficiente siguen pendientes, sin corrección conjetural.

Referencias: [LSJ: ἡγέομαι](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n46613/); [Cambridge Grammar of Classical Greek](https://www.cs.toronto.edu/~simon/Athens/Thucydides3/cgcg.pdf), §30; `data/vocabulary/greek1-noun-case-attestation-20261121.json`.

## Pruebas y alcance

`scripts/audit-sentence-lemmas.cjs` incorpora cinco aserciones latinas y una pluriverbal. El archivo autónomo debe reconstruirse desde el generador actualizado y pasar la CI completa del commit final. Los cambios no amplían las 619 lecturas latinas contrastadas. No se han cambiado solucionarios, preguntas, asignaciones de UD ni la lógica de exportación. **Prohibida la fusión/publicación sin autorización.**

## Reconstrucción aislada y CI

El flujo temporal de GitHub Actions [44938216838](https://github.com/ArchaiosMagister/GeneradorExamenes/actions/runs/44938216838) terminó en **success**. Reconstruyó `offline.html` con el motor corregido, ejecutó las pruebas de lematización antes y después y se retiró de la rama en el mismo commit de reconstrucción. **No hubo publicación ni fusión.** La CI general del último commit debe confirmarse separadamente.
