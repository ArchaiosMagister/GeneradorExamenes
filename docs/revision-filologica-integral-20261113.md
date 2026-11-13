# Revisión filológica integral — inicio del contraste de todas las fichas

**13 de noviembre de 2026 · rama separada de la fase III · sin publicar**

## Alcance y salvaguardas

- El inventario exhaustivo comprende **3434 propuestas latinas** de modelo regular
  y **969 propuestas nominales griegas** de Wiktextract, en total **4403 fichas**.
- El script `scripts/audit-all-morph-candidates.cjs` analiza cada ficha por
  lema, forma, análisis y fuente. Escribe un informe detallado JSON y resumen
  en `test-artifacts/`, descargables como artefactos de CI.
- La comparación de grafías conserva la iota suscrita griega, aunque elimine
  acentos y cantidades en una comparación *provisional*. No equipara sin control
  un nombre común con un nombre propio.
- Una coincidencia con UniMorph documenta una lectura externa; **no** la
  convierte por sí sola en ficha individualmente verificada. Las lecturas
  simultáneas, variantes y diferencias de categoría siguen visibles.
- Ninguna de las 4403 fichas se promociona por mera coincidencia. Las propuestas
  sin respaldo suficiente continúan fuera de las nuevas claves automáticas.

## Primera colación documentada, incorporada en la rama

Se añadieron **180 casillas individuales** (cinco tiempos de indicativo activo,
seis personas por tiempo) de seis verbos presentes en el vocabulario docente:

| Lema | Fuente que contiene el paradigma | Casillas |
| --- | --- | ---: |
| `nolo` | https://www.nationalarchives.gov.uk/latin/stage-2-latin/resources/stage-2-latin-grammar-resource/ | 30 |
| `abeo` | https://www.nihilscio.it/Manuali/Lingua%20latina/Verbi/Coniugazione_latino.aspx?lang=EN_&verbo=abeo | 30 |
| `ineo` | https://www.nihilscio.it/Manuali/Lingua%20latina/Verbi/Coniugazione_latino.aspx?lang=EN_&verbo=ineo | 30 |
| `pereo` | https://www.nihilscio.it/Manuali/Lingua%20latina/Verbi/Coniugazione_latino.aspx?lang=ES_&verbo=pereo | 30 |

Las formas se escribieron en `data/lemmas/verified-overrides.json` y
`teacher-forms.json`; los modelos visibles y `offline.html` se actualizaron
simultáneamente. Cada persona tiene su análisis propio. No se deducen voces ni
otros modos a partir de esos paradigmas.

## Cinco decisiones docentes aprobadas — 13/11/2026

La fuente persistente `data/lemmas/filological-variant-decisions.json` contiene
las decisiones con análisis y referencias. La reconstrucción del índice
traslada sus metadatos a `extensions.filological_variants`; la consulta
morfológica muestra variantes de una palabra con su advertencia, pero **no**
las utiliza como certificaciones individuales ni claves unívocas del examen.

- **βούλομαι:** forma escolar principal **βούλει**. Se reconoce **βούλῃ**
  como variante de indicativo, y se advierte expresamente su posible lectura
  de subjuntivo; también se registra βούλεαι como variante documentada.
- **ἔρχομαι:** forma principal **ἔρχῃ**. Se registran ἔρχει y ἔρχεαι.
- **absum:** se conserva el enunciado **absum, abfui**; **afui** es variante
  consultable del perfecto singular, sin extrapolarla a otras personas.
- **nolo:** **nonvis** sigue en el paradigma y en las preguntas; **non vis**
  se documenta como grafía separada de dos palabras y no se analiza como token.
- **ἀφικνέομαι, ὁρμάομαι, προσέρχομαι:** se conservan sin unidad.
  Su consulta léxica sigue disponible y no participan en el sorteo.

La prueba `scripts/test-filological-variant-decisions.cjs` comprueba modelo,
variantes, homografía, bloqueo curricular, persistencia y HTML autónomo.

## Decisiones futuras (no resueltas por estas cinco elecciones)

- La segunda singular de `βούλομαι` documenta `βούλει` y `βούλῃ`:
  https://logeion.uchicago.edu/morpho/%CE%B2%CE%BF%CF%8D%CE%BB%CE%BF%CE%BC%CE%B1%CE%B9.
  Por ahora el modelo docente sigue con `βούλει` y no se borra la variante.
- Determinar en qué unidad, si procede, se usarán formas de `ἀφικνέομαι`,
  `ὁρμάομαι` y `προσέρχομαι`, ya que sus fichas de vocabulario no tienen
  unidad curricular asignada en el índice.
- Pendientes el resto de los irregulares, deponentes, paradigmas compuestos,
  nominales y adjetivales latinos, y la colación nominal griega por fuentes
  y variantes, sin aprobación por analogía.

Este documento **no afirma completada** la verificación exhaustiva. Cada
siguiente incorporación requiere contraste, fuente persistente y CI correcta.

## Segunda colación conservadora: 31 lecturas (13/11/2026)

Archivo persistente de trabajo: `data/lemmas/revision-individual-lote-20261113.json`.
Esta revisión **no modifica** `teacher-forms.json`, `verified-overrides.json`,
el motor de examen ni el paquete `offline.html`.

- **Griego — 1 lectura:** `λόγῳ` de `λόγος`, dativo singular,
  corroborado con la tabla de la Open University. Ya existe tanto en la fuente
  docente nominal como en la candidatura Wiktextract. **Se concilia sin
  duplicar la forma** ni atribuir al resto de las formas la misma procedencia.
  Referencia: https://www.open.edu/openlearn/history-the-arts/discovering-ancient-greek-and-latin/content-section-10.6
- **Latín — 18 formas sintéticas de `gaudeo`:** presente, imperfecto
  y futuro de indicativo activo, cotejados con un paradigma publicado.
  En el índice ya figuran las 18 superficies como registros UniMorph; el
  nuevo documento añade una referencia filológica, no una certificación
  indiscriminada del resto del corpus.
- **Latín — 12 formas compuestas de `gaudeo`:** perfecto y
  pluscuamperfecto de indicativo semideponente, **solo con sujeto masculino**.
  Contrastadas documentalmente, aún no están como superficies del lema en
  el índice local. Antes de hacerlas sorteables se debe añadir su etiquetado
  semideponente al motor y reconstruir juntos fuente, índice y PWA.
  Referencias: https://www.cultus.hk/Latin_vocab/verb2/gaudere.html
  y https://grammatik.woxikon.de/grammatik-latein/deponentien

**Resultado de conciliación:** 31 lecturas registradas, 19 superficies ya
presentes y 12 compuestas ausentes; **0 promociones a fuente 5 y 0 claves
nuevas de examen**. La existencia de 19 superficies no es, por sí sola,
confirmación de equivalencia exacta de análisis (p. ej. etiquetas
semideponentes). Se conservan homografías y variantes.

La CI ejecuta `scripts/test-individual-evidence-ledger.cjs` y detecta
una incorporación accidental o cambio de estado no documentado. Este
lote no necesita una decisión docente nueva: la elección conservadora
es no sortear las 12 formas compuestas antes de incorporar la semideponencia
de manera coherente. Continúa pendiente el grueso de las 4403 candidaturas.

## Nuevo lote de 100 candidaturas resueltas académicamente (13/11/2026)

**90 latinas:** se cotejan exactamente las seis personas del presente, imperfecto y
perfecto activos de cinco verbos que representan los principales modelos escolares:
`amo`, `moneo`, `rego`, `capio`, `audio`. No se confunden
perfecto, futuro ni subjuntivo. Fuentes: [paradigmas completos de Azimonti](https://www.azimonti.com/philology/latin/resources/paradigms-regular-verbs/)
y [gramática de Dickinson College](https://dcc.dickinson.edu/grammar/latin/four-conjugations).

**10 griegas:** se cotejan las lecturas de singular y plural de `βασίλειον`,
neutro de segunda declinación, incluyendo las tres etiquetas coincidentes
(nominativo, acusativo y vocativo) para cada número. El parentesco morfológico
con el neutro del adjetivo `βασίλειος` permite comprobar las terminaciones,
sin identificar los lemas ni eliminar acepciones. Fuentes:
[tabla flexiva con cuantidades](https://en.wiktionary.org/wiki/%CE%B2%CE%B1%CF%83%CE%AF%CE%BB%CE%B5%CE%B9%CE%BF%CF%82)
y [Logeion, lectura de dativo plural](https://logeion.org/morpho/%CE%B2%CE%B1%CF%83%CE%B9%CE%BB%CE%B5%CE%AF%CE%BF%CE%B9%CF%82).

Cada una de las cien candidaturas queda consignada en
`data/lemmas/revision-candidaturas-lote100-20261113.json`
con lema, forma exacta, análisis, fuente y decisión.
`scripts/test-candidaturas-lote100.cjs` comprueba la identidad de las
100 filas, los 90 tiempos/personas latinos, el sincretismo nominal griego
y que ninguna fila se haya certificado sin reconstrucción controlada.

**Alcance:** 100 candidaturas sometidas a cotejo académico favorable.
**No equivale a 100 nuevas respuestas disponibles en exámenes:** la fuente
original sigue con códigos de *propuesta* hasta que se coordinen
`verified-overrides.json`, el índice, la aplicación y `offline.html`.
Quedan pendientes la auditoría del resto y una CI completa del mismo commit.
No se altera `main` ni se despliega.

## Incorporación persistente del lote de cien

Se han trasladado 90 análisis latinos y 10 griegos como fuente 5 al índice, modelos y archivo autónomo. Los cinco modelos verbales mantienen sus umbrales curriculares. El neutro βασίλειον no tiene UD y sigue excluido del sorteo; se conservan las lecturas NOM/ACC/VOC. Fuentes: https://www.azimonti.com/philology/latin/resources/paradigms-regular-verbs/ y https://greekdoc.github.io/lexicon/bas.html.

Restan 3344 candidaturas latinas y 959 griegas. Ni el auditor ni esta migración autorizan formas adicionales por analogía. No se fusiona ni se publica.

## Lote de 200 candidaturas latinas y griegas · 13/11/2026

Se incorporan 100 análisis latinos (accipio 18, facio 18, duco 18, careo 12, disco 12, dux 11 y obses 11) y 100 griegos (ἀγαθός 30, δίκαιος 30, θάλαττα 10, ξύλον 10, πενία 10 y πόλεμος 10). Todas sus unidades provienen de las entradas docentes existentes; no se inventan unidades ni se amplían paradigmas por analogía. Cada lectura posee su ficha individual en data/lemmas/revision-candidaturas-lote200-20261113.json, con enlace al paradigma de referencia.

Las coincidencias entre casos y géneros de sustantivos y adjetivos siguen registradas como análisis distintos. No constituyen respuestas unívocas de un ejercicio aislado sin contexto. El indicativo latino incorpora sólo los tiempos contrastados. El infectum pasivo de facio continúa excluido por corresponder a fio. Se mantienen el banco externo, el requisito de pruebas y la ausencia de despliegue.

El índice conserva ahora **3244 candidaturas latinas y 859 griegas** sin contraste individual. El total en fuente 5 aumenta en 200 análisis. La version offline debe actualizarse junto al índice y superar el control de igualdad antes de guardar el commit.

## Lote griego de 300 lecturas en 42 lemas (13/11/2026)

Se trasladan 300 casillas de fuente 4 (candidata) a fuente 5 (contrastada). Cada casilla conserva lema, caso, número, género, fuente y unidades del programa docente. Las grafías escolares eliminan solamente las marcas editorialmente añadidas de cantidad vocálica (macron y breve); acentos, espíritus e iota suscrita se mantienen. En los ejercicios de análisis aislado no se fuerza ninguna lectura unívoca sin contexto. Se sincronizan fuente persistente, índice y versión autónoma. El banco externo no cambia.

Cuarentena filológica: no se promueven las candidaturas de πρῶτος por discrepancias acentuales (πρωτά frente a πρῶτα); se excluyen las formas femeninas del extracto de ἀθάνατος y ἐχθρός cuando el enunciado docente es de dos terminaciones; αἰσχρός conserva pendiente la política de variantes y κεφαλῆ requiere corregir el lema. Las incidencias se documentan en el registro del lote, sin incorporarlas como soluciones.

Balance: Latín 619 verificadas / 3244 candidaturas; Griego 464 verificadas / 559 candidaturas. Rama de revisión únicamente; no publicar ni modificar main.
