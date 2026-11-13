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
