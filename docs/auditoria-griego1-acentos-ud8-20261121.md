# Auditoría filológica de Griego I · Acentos y enunciados de UD8
**Fecha:** 21/11/2026. **Rama:** audit/greek1-ud8-accents-20261121, basada en la PR #199. Sin fusión ni publicación autorizadas.

## Incidencias comprobadas

La comparación del vocabulario exigible de UD8 con las 399 entradas del banco general y los índices académicos señaló cinco entradas incoherentes. La corrección respeta las formas individuales de fuente 5 y el alcance curricular de cada unidad.

| Lema | Antes | Después | Superficie |
|---|---|---|---|
| Ἑλλάς | Ἕλλας, Ἑλλάδος (ἡ) | Ἑλλάς, Ἑλλάδος (ἡ) | Exigible UD8 |
| πατήρ | πάτηρ, −τρός (ὁ) | πατήρ, −τρός (ὁ) | Exigible UD8 |
| ὕδωρ | ὕδωρ, ὑδάτος (τό) | ὕδωρ, ὕδατος (τό) | Banco general / índice |
| ὄνομα | ὄνομα, –ματος | ὄνομα, –ματος (τό) | Banco general / índice |
| ἡγεμών | ἡγεμών, –ονος (ὁ) | ἡγεμών, –όνος (ὁ) | Banco general / índice / ficha verificada |

No se trata de cambiar acentos mecánicamente: la fuente contrastada de ὕδωρ documenta **ὕδατος** y la de ἡγεμών **ἡγεμόνος**. Las formas **πατήρ** y **Ἑλλάς** también están documentadas con acento final. Los artículos quedan como decisiones docentes; no se altera la clasificación ni se generan paradigmas inexistentes.

## Método y trazabilidad

- Cambios exactos en las dos fichas exigibles de UD8; sin reetiquetar otras unidades ni alterar traducciones.
- `entryCorrections` para ὕδωρ y ὄνομα y actualización precisa de la corrección editorial anterior de ἡγεμών: el generador del índice académico parte de una fuente fijada y repite el resultado.
- Reconstrucción de `data/lemmas/teacher-forms.json` y `offline.html` en la rama aislada.
- Migración exacta e idempotente de dos fichas antiguas del exigible local: conserva cambios del docente, entradas eliminadas y unidades distintas.
- Se conserva la forma fuente 5 **ἡγεμόνι — dativo singular**, sin nuevas lecturas ni cambios de género.

Fuentes:
- Logeion: Ἑλλάς, https://logeion.uchicago.edu/%E1%BC%99%CE%BB%CE%BB%CE%AC%CE%B4%CE%B1
- Logeion: πατήρ, https://logeion.uchicago.edu/%CF%80%CE%B1%CF%84%CE%AE%CF%81
- Logeion: ὕδωρ/ὕδατος, https://logeion.uchicago.edu/%CF%85%CC%94%CC%81%CE%B4%CE%B1%CF%84%CE%BF%CF%82
- Logeion: ὄνομα/ὀνόματος, https://logeion.uchicago.edu/%CE%BF%CC%93%CC%81%CE%BD%CE%BF%CE%BC%CE%B1
- ἡγεμών/ἡγεμόνος: https://en.wiktionary.org/wiki/%E1%BC%A1%CE%B3%CE%B5%CE%BC%CF%8E%CE%BD

## Puerta de pruebas y límites

La prueba permanente `scripts/test-greek-ud8-lexical-accents.cjs` verifica en web y PWA las grafías de las dos fichas exigibles de UD8, los cinco enunciados, el índice y las decisiones de origen; confirma además la integridad de ἡγεμόνι y la migración no destructiva. Se ejecuta en Phase I y offline-check, junto a las pruebas previas de tercera declinación y análisis fuente 5.

El corpus externo de propuestas continúa excluido de los exámenes. **No fusionar ni publicar sin autorización posterior del docente.**
