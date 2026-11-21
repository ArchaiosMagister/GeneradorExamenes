# Auditoría filológica de Griego I · 21/11/2026 (rama aislada)

## Alcance y criterio
Correcciones de acentuación y paradigmas de UD5 detectadas después de las PR #195–196. No se fusionan ni despliegan sin autorización expresa del docente. No se promueven propuestas de Eulexis/Wiktionary al banco acreditado por simple analogía. Se conservan el programa de 14 unidades, el corpus fuente 5, las lecturas sincréticas, los glosarios y los ejercicios de latín.

## 1. ὀλίγος, ὀλίγη, ὀλίγον

**Defecto:** el vocabulario general y el exigible de UD5 mantenían el enunciado ὀλιγός, –η, –ον, y el generador auxiliar de sintagmas definía un falso paradigma oxítono.

**Corrección:** la entrada es ὀλίγος, –η, –ον, con acento en la penúltima sílaba. Se corrigen exclusivamente las dos entradas de index.html, la fuente persistente data/greek1-materials.json y el descriptor del adjetivo, para el que se introduce el paradigma explícito de las 30 casillas áticas (dos números, cinco casos, tres géneros) sin inferirlo del lema. La matriz semántica de sintagmas no se amplía artificialmente: un adjetivo correcto no convierte en natural toda combinación de sustantivo y adjetivo.

**Persistencia docente:** al cargar la webapp, migrateGreekOligosAccent modifica solamente la ficha exigible antigua literal en Griego I / UD5. La clave normalizada es idéntica antes y después; no se cambia de unidad, traducción, origen ni se vuelve a sembrar una lista que el docente haya borrado. Se preservan las fichas editadas y añadidas manualmente. La operación es idempotente.

Fuentes de referencia (grafía y paradigma):
- Dickinson College Commentaries: https://dcc.dickinson.edu/greek-core/%E1%BD%80%CE%BB%CE%AF%CE%B3%CE%BF%CF%82-%E1%BD%80%CE%BB%CE%AF%CE%B3%CE%B7-%E1%BD%80%CE%BB%CE%AF%CE%B3%CE%BF%CE%BD
- Wikcionario, paradigma ático con forma individual: https://en.wiktionary.org/wiki/%E1%BD%80%CE%BB%CE%AF%CE%B3%CE%BF%CF%82

## 2. Vocativo singular de πολύς, πολλή, πολύ

**Defecto:** la generación explícita reutilizaba πολύς como supuesto vocativo masculino singular; las otras dos casillas de vocativo singular se rellenaban por repetición mecánica, y las tres pasaban al análisis morfológico acreditado.

**Decisión conservadora:** Smyth §311 deja en blanco los tres vocativos singulares del paradigma. Wikcionario clasifica πολύ como vocativo singular masculino, pero no avala la solución previa πολύς. Para la calificación escolar automática se omiten **solo las tres casillas discutidas** en este paradigma, sin declarar que ninguna de ellas exista o no en todos los registros históricos.

Se representa por null la falta de casilla evaluable, y se salta específicamente esa casilla al generar formas aisladas. No se retiran el nominativo πολύς, el acusativo πολύν, las lecturas atestiguadas de πολύ, los plurales ni las formas de μέγας. Las tablas que exijan todas las casillas no seleccionarán πολύς como adjetivo completo por analogía.

Fuentes:
- Smyth, *Greek Grammar*, §311: https://ccel.org/s/smyth/grammar/html/smyth_2k_uni.htm
- Wikcionario, πολύ: https://en.wiktionary.org/wiki/%CF%80%CE%BF%CE%BB%CF%8D

## Validación
Prueba de regresión reproducible: node scripts/test-greek-adjective-accent-vocative.cjs. En ambos HTML comprueba 30 casillas de ὀλίγος, las formas seguras de πολύς, las lecturas explícitas del irregular y ausencia de falsos vocativos, la preservación de μέγας, así como la migración exacta y no destructiva del vocabulario exigible. Se integra en Phase I y offline-check; la reconstrucción de offline.html debe ser idéntica a la copia guardada.

**Puertas de integración:** pruebas completas de morfología, 14 UD, castellano/valenciano, regeneraciones, edición, borradores, Word, PDF, PWA e interfaz móvil/Safari/Android. No se interpreta una CI verde como certificación universal de las candidaturas históricas griegas.

**Estado:** rama de auditoría sin fusión ni publicación; verificar resultados reales de CI antes de solicitar al docente autorización.
