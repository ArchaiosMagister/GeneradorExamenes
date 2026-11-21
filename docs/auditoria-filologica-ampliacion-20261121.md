# Auditoría filológica ampliada · Latín y Griego I · 21/11/2026

## Léxico exigible (cinco correcciones reproducibles y glosa de ἔτι)

1. **Carthago, −inis (f.)** (Latín I, UD5), género femenino en vez de masculino.
2. **pūgnō (1ª)** (Latín 4.º, UD4), cantidad vocálica larga: la semilla exigible tenía `pŭgno` y el índice `pūgno`.
3. **Myro, –ōnis (m.)** y **stĭlus, –ī** (Latín 4.º, UD10): eliminar la letra cirílica en `Mўrō̆` y `stўlus`, rectificar las claves del índice de lemas y precisar significado «estilo, punzón para escribir» en lugar de «boli».
4. **μικρός, –ά, –όν** (Griego I, UD5), acentuación oxítona.
5. **ἔτι:** «aún, todavía» (UD10 y banco general), no «ya», valor normalmente correspondiente a `ἤδη`.

Las cinco correcciones de enunciado se almacenan en `data/lemmas/verified-overrides.json` para que sean reproducibles al regenerar el índice desde el banco académico fijado. No se promueven formas griegas de fuente 4 a fuente 5 ni se dan por verificados paradigmas completos. La migración de datos del usuario preserva traducciones editadas.

## Oraciones griegas y límites

Se auditan las 14 unidades del fichero docente `data/vocabulary/greek1-units-corrected.json`; se corrigen diez fragmentos de las UD5, UD6, UD7, UD8, UD10, UD11 y UD12: espíritus y acentos, τῶν, τῆς, τοὺς, θεᾷ, ἄδικα, πατὴρ, φιλόσοφος, νέαν πολιτείαν, y un uso erróneo de πράττω con objeto persona (se reemplaza por παιδεύω). Este fichero es distinto del corpus `greekSentenceRows` que el motor sortea; no se mezclan ambos bancos.

**Pendientes de estudio particular:** otros usos semánticamente anómalos de πράττω con personas en UD4, concordancias y acentos tardíos y cotejo más amplio del régimen verbal. No se corrigen en masa ni se inventan nuevos ejercicios.

## Control de integración

La prueba `scripts/test-filologia-latin-griego-20261121.cjs` comprueba el índice, el banco exigible, las fuentes, la versión autónoma y la ausencia de contaminación de claves por cirílico. Se ejecuta junto a las baterías Phase I y offline-check. La fusión y publicación siguen condicionadas a autorización posterior y a CI satisfactoria.

La compilación reproducible del índice y del HTML autónomo se completó en GitHub Actions para esta rama; el flujo temporal se retiró de la PR. Las verificaciones generales son independientes de ese control.

## Coherencia bilingüe

Tras detectar que los dos significados nuevos no tenían correspondencia valenciana, se añaden «aún, todavía» → «encara» y «estilo, punzón para escribir» → «estil, punxó per a escriure». La prueba valenciana es obligatoria en la reconstrucción y en la CI normal.
