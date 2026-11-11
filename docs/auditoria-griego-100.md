# Auditoría de 100 formas frecuentes de Griego I

Fecha: 11 de noviembre de 2026. Ámbito: corpus de regresión `tests/greek-priority-forms.json`, 14 unidades. No es una certificación externa de cada análisis.

## Método

`node scripts/audit-greek-frequent-100.cjs` extrae tokens del corpus con las mismas reglas que utiliza el generador, normaliza Unicode a NFC (sin borrar acentos para distinguir homógrafos), ordena por recurrencia y analiza las primeras 100 formas. Además, clasifica todo el corpus y emite los primeros 100 pendientes con unidades, motivo y alternativas.

La auditoría inicial contabilizó **783 formas distintas**: **768 reconocidas**, **14 señaladas para revisión ortográfica** y **1 desconocida**. Las **100 más frecuentes** estaban ya reconocidas. Por tanto, no hay fundamento para inventar 100 correcciones morfológicas.

## Corrección segura de clasificación

La grafía `Δημοσθήνης` (UD12) pasa de «desconocida» a «posible errata» con la sugerencia `Δημοσθένης`. No se modifica el texto de la unidad ni se da por verificada otra forma del nombre. Referencias: *Greek Grammar* de Smyth, §233; corpus de nombres griegos [LGPN/Θετίμα](https://ancdialects.greek-language.gr/propernames/dimosthenis).

## Restantes pendientes: conservar avisos, no autocorregir textos

Las 14 grafías previamente identificadas como posibles erratas son: `στρατεγὸς`, `oἱ`, `ἄνρωπος`, `εἴς`, `εἷχεν`, `ἐφεύξεν`, `θάλάττῃ`, `οἰκῦσιν`, `Περίκλους`, `στρατεγοὶ`, `στρατεγός`, `σωτερίας`, `ὠρᾶ` y `Aἰσχύλος`.

La prioridad docente es decidir si deben corregirse en los textos originales correspondientes. El generador no debe normalizarlas silenciosamente: varias requerirían revisar el contexto (p. ej., `ὠρᾶ`, `ἐφεύξεν`).

## Regla general para otras formas parecidas

- Pronombres interrogativos e indefinidos, adverbios enclíticos, artículos y relativos: conservar los diacríticos antes de decidir la identidad léxica.
- Variantes ortográficas legítimas (acento grave, énclisis y `ν` efelcística): incorporar solo los paradigmas respaldados por gramáticas y limitar la extensión al lema correspondiente.
- No convertir coincidencia textual, propuesta de un analizador o inferencia regular en flexión verificada. Las 100 formas «reconocidas» son un indicador de cobertura del generador, no de revisión filológica individual.
- Eulexis puede sugerir análisis, pero la adopción docente de homografías seguirá requiriendo contexto.

Fuente para enclíticas: [Smyth, *Greek Grammar*, §§181 y 334](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.6.html).

Repetir auditoría: `node scripts/audit-greek-frequent-100.cjs` y consultar los registros `GREEK_FREQUENCY_AUDIT`, `GREEK_TOP_100` y `GREEK_PENDING_100` de GitHub Actions.
