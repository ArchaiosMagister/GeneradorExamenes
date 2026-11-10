# Optimización inicial y mejoras docentes (10 de noviembre de 2026)

## Alcance

Esta rama se basa en `main` y **no incorpora ni fusiona** la PR #29 (`codex/vocabulario-unidades`). Los cambios se integrarán por etapas, sin reescritura general ni adopción aún de Collatinus/Eulexis.

## Implementado

- Cultura LAT4: `culture-lat4.js` contiene **73 preguntas** distribuidas en UD1–UD8; banco de preguntas cortas, de desarrollo, verdadero/falso y opción múltiple. Cada entrada conserva la unidad y una pregunta/respuesta en castellano y valenciano; las opciones de elección múltiple también tienen traducción valenciana. Fuente: ocho temas de Cultura de Latín 4.º proporcionados por el docente.
- Prefijos: las **287 palabras** del banco tienen `prompt_va`; seis equivalencias que pierden el prefijo estudiado quedan fuera de sorteos en valenciano (`valencianPrefixEligible=false`), pero se conservan para castellano. No se modifica el prefijo ni la ficha castellana.
- Progresión LAT4: `data/lat4-progresion-lexico.json` ya delimitaba familias de prefijos y normas fonéticas acumulativas de UD1–UD8. Se añade prueba que comprueba en cada unidad al menos cuatro palabras disponibles tanto para prefijos (ES y VA) como para evolución fonética, todas dentro de la normativa cursada.
- Interfaz: navegación a paneles desde accesos rápidos, disposición escritorio tipo editor a la izquierda y vista previa a la derecha (inspirada en Examinator2), configuración del panel traducible a valenciano.
- Encabezados: `1.er / 2.º / 3.er trimestre` en castellano y `1r / 2n / 3r trimestre` en valenciano, en los exámenes de latín y griego.
- Se elimina el apartado final de `Nota` de los modelos latinos y griegos sin alterar las preguntas.
- `Vocabulario final` se sustituye por `Vocabulario`; `quoteGloss` diferencia las traducciones simples y compuestas mediante comillas tipográficas.
- Oraciones: el banco del curso acepta textos sin traducción (una oración por línea) o el formato anterior separado por punto y coma; vincula las unidades elegidas y no inventa traducciones. En exámenes latinos el glosario recupera lemas del banco docente y del índice local; en Griego I los textos añadidos entran en el conjunto elegible y se intenta recuperar la ficha mediante el índice existente. Las correspondencias dudosas y la revisión pendiente se advierten.
- Optimización limitada: índice de formas reutilizado dentro de una generación del glosario; se evitan búsquedas de paradigma por cada palabra.
- PWA: el banco de cultura se incluye en la lista de precarga, en el despliegue GitHub Pages y embebido en `offline.html`.
- CI: nuevas pruebas `scripts/test-cultura-lat4.cjs` y `scripts/test-lat4-lexico.cjs`, además de la batería de regresión existente.

## Deliberadamente pendiente

- No se han incorporado los motores Collatinus/Eulexis, ni se ha sustituido el validador de formas del examen.
- Las traducciones del **léxico clásico docente completo** siguen en castellano, salvo datos expresamente bilingües; no deben traducirse automáticamente sin revisión.
- Las oraciones aportadas por el docente **no se certifican** automáticamente como filológicamente verificadas. Las traducciones y correspondencias dudosas permanecen bajo revisión; el motor griego aún no resuelve todas las formas del repertorio.
- No se ha migrado todo el banco léxico incrustado de `index.html` a módulos ni se ha completado el índice morfológico compartido con persistencia de correcciones de la PR #29. Su integración requerirá reconciliar ambas ramas.
- La implementación mantiene `offline.html` como archivo autónomo existente; los repertorios masivos futuros necesitarán carga fragmentada para no saturar memoria móvil.
- No modificar `main` ni publicar como estable hasta aprobar todas las pruebas y revisar visualmente los exámenes Word.

## Verificaciones

```sh
node scripts/test-cultura-lat4.cjs
node scripts/test-lat4-lexico.cjs
node scripts/test-exam-models.cjs
npm run offline:build
npm run offline:test
npm run preview:test
npm run pwa:test
```
