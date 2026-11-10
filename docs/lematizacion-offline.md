# Lematizador bilingüe sin conexión

## Objetivo y alcance

El generador de exámenes incorpora una **consulta auxiliar de lemas y análisis**, disponible tanto en la web publicada como en el documento autónomo `offline.html`. Se construye a partir de los **lemas del vocabulario docente** de `ArchaiosMagister/VocabulaLatinaGraecaque`, y de las formas expresas de UniMorph y los paradigmas docentes allí mantenidos.

**No es un lematizador de todo el latín ni de todo el griego**: su cobertura se limita al vocabulario y a las formas efectivamente documentadas. Puede devolver varias lecturas para una misma forma y no selecciona automáticamente la «correcta» en una frase.

El índice sirve para consultar, no para sustituir ni ampliar automáticamente las respuestas o los paradigmas de los exámenes. Una respuesta de examen solo debe proceder de su banco curricular validado.

## Construcción y procedencia

El script `scripts/build-lemma-index.mjs` descarga en tiempo de compilación los fragmentos de `data/unimorph-syllabus/` y los paradigmas explícitos de **una revisión Git fija** del repositorio de Vocabulario. Así es reproducible y no depende del contenido cambiante de `main`.

- Datos UniMorph originales: <https://github.com/unimorph/lat> y <https://github.com/unimorph/grc>.
- Licencia de los derivados de UniMorph: **CC BY-SA 3.0**. Conservar atribución y condiciones de compartir igual al distribuir el índice.
- Paradigmas docentes: se distinguen de las filas UniMorph por el atributo de fuente. No se les atribuye falsamente origen UniMorph.
- El manifiesto del índice guarda el repositorio, SHA y revisiones de los corpus.
- Se respetan las variantes explícitas y la iota suscrita. Solo se eliminan acentos y marcas de cantidad para la **búsqueda**, no para la representación del análisis.
- La segmentación conservadora del lema procede de los enunciados originales. No se adivinan lemas por terminaciones.

El formato JSON `data/lemmas/teacher-forms.json` contiene `vocabulary` (lemas, enunciados y cursos) y `rows` (lema, forma, etiquetas, fuente). El módulo `offline-lemmas.js` normaliza e indexa esos registros en el navegador y muestra **todas** las interpretaciones registradas.

## Uso docente

En **Laboratorio y consulta morfológica**, abre **Lematizador del vocabulario · sin conexión**. Selecciona el curso y consulta una forma (*amābam*, *λύουσι*) o cambia al modo «Ver flexiones de un lema» (*amo*, *λύω*). Se mostrarán las formas y los análisis disponibles, con el enunciado completo del vocabulario y las etiquetas originales.

Los lemas no encontrados se señalan como **sin registro**, no se inventa una respuesta. Las coincidencias ambiguas conservan todas sus lecturas documentadas, incluidas las que difieren únicamente en el análisis.

Además de la consulta manual, el vocabulario final de los exámenes utiliza el índice local como **segunda oportunidad de identificación**: cuando los modelos anteriores no reconocen una forma y el índice devuelve exactamente **un lema**, se busca su ficha en el banco de vocabulario del curso. Solo se añade cuando hay una única ficha coincidente; si hay homonimia, múltiples fichas o falta de datos, continúa la advertencia de revisión. Esta ayuda no elige análisis morfológicos para corregir exámenes ni inventa traducciones.

El funcionamiento offline **no utiliza Internet**: el generador `scripts/build-offline.mjs` incrusta el índice bilingüe y el módulo de consulta en `offline.html`, junto con el banco latino que ya existía.

## Ampliación: modelos regulares y lemas sin paradigmas

El índice distingue ahora **tres niveles de evidencia**, visibles en las fichas:

1. **Forma documentada:** lectura de UniMorph o de un paradigma docente explícito.
2. **Modelo regular (provisional):** forma latina calculada por una regla morfológica explícita en `scripts/regular-latin.mjs`. La ficha la señala como *propuesta sin verificar*, con borde discontinuo. **Nunca se utiliza para el solucionario, la calificación ni la identificación automática de palabras para el glosario final**.
3. **Forma de cita:** el lema que figura literalmente en el vocabulario del profesor, aunque todavía no tengamos ninguna flexión documentada. Esto permite localizar los lemas que antes aparecían como «sin resultados», sin atribuirles un análisis inventado.

La generación provisional latina abarca sustantivos de **primera y segunda declinación** con enunciado compatible y, desde esta fase, **determinados sustantivos masculinos y femeninos de tercera declinación** con nominativo, genitivo singular *completo* en `-is` y género explícito. En la tercera se proponen solamente los casos singulares habituales y los plurales comunes compatibles con los temas consonánticos y mixtos. **No se inventa el genitivo plural** (`-um` frente a `-ium`), ni se infieren los paradigmas de los parisilábicos, los neutros y varias excepciones. Los nombres propios solo reciben candidatos singulares. Estas formas siguen siendo propuestas sin verificar, incluso cuando proceden de reglas regulares. Como referencia de las terminaciones generales se consultaron las tablas de gramática del National Archives y de Allen y Greenough; para distinguir temas consonánticos y temas en *-i* se siguen sus advertencias sobre variantes.

Los verbos activos de conjugación **primera, segunda, tercera, cuarta y mixta**, con clase expresamente indicada, generan provisionalmente presente e imperfecto de indicativo y, cuando se proporciona el perfecto, perfecto activo. Los deponentes, verbos sin conjugación reconocible, adjetivos irregulares y casos como el vocativo de `-ius` quedan fuera.

Las propuestas se contrastan automáticamente **con cada casilla documentada** que ya exista para el mismo lema. Ante una contradicción se descarta entero el modelo y se registra la incidencia en `extensions.rejected_for_conflict`. Las propuestas no sustituyen ninguna forma existente.

Para el griego **no se generan formas flexivas sin contrastar**: la acentuación, el aumento y los temas nominales/verbales requieren un tratamiento más fino. Las entradas griegas sin paradigma quedan localizables mediante su forma de cita.

La cabecera del lematizador muestra ahora, **para cada curso**, cuántos lemas tienen alguna forma documentada, cuántos cuentan con modelos regulares provisionales y cuántos solo conservan su entrada de vocabulario. Estas cifras no significan que el paradigma esté completo.

La búsqueda de una forma sigue devolviendo todos los lemas posibles. Sin embargo, la recuperación del **vocabulario final de un examen** exige al menos una **forma morfológica documentada** (UniMorph o paradigma docente) y **un solo lema posible entre todas las lecturas**. Una forma de cita por sí sola no es prueba de flexión, y una lectura candidata de otro lema bloquea la resolución automática para evitar homonimias. Ninguna propuesta provisional sirve por sí sola para completar el glosario. La fuente de cada lectura se muestra junto a su enunciado completo.

## Cobertura diferenciada por unidades

El lematizador presenta ahora un desplegable **«Cobertura por unidad»**. Las unidades se mantienen tal y como figuran en los vocabularios docentes, incluidas las agrupaciones `UD 9–10` o `UD 1–4`, **sin dividirlas por tema**. Para cada unidad muestra los lemas con alguna forma documentada, los que solo tienen propuestas y los que carecen de flexión (su lema se conserva como forma de cita). Las cifras no certifican paradigmas completos. La consulta y el informe se generan enteramente con la base local, sin depender de servidores.

## Incorporación nominal griega desde Wikcionario

La siguiente ampliación importa **sustantivos y adjetivos griegos de forma provisional** desde [Wiktextract/kaikki.org](https://kaikki.org/dictionary/Ancient%20Greek/index.html), conservando la ortografía, los espíritus y los acentos de la fuente. Los datos provienen de los colaboradores de Wikcionario y requieren atribución **CC BY-SA 4.0**, distinta de la licencia CC BY-SA 3.0 de UniMorph.

El importador `scripts/build-greek-nominal-candidates.mjs` realiza la extracción **solo durante la generación de la base**, no desde el navegador. Su filtro exige:

- Correspondencia exacta del lema con el vocabulario de Griego I y categoría sustantivo o adjetivo.
- Casillas con **caso, número y género (si se trata de adjetivos)** expresamente etiquetados. Se excluyen duales, variantes dialectales y etiquetas desconocidas, romanizaciones y formas sin acentuación.
- Identidad de **nominativo singular** entre el corpus y el vocabulario; para sustantivos, **genitivo singular** compatible con el enunciado docente.
- Mínimo de siete casillas nominales o nueve adjetivales diferentes, y ninguna contradicción con casillas de UniMorph existentes. Se excluyen las variantes alternativas que no puedan identificarse de forma unívoca.

Las formas adicionales figuran **como «Wikcionario · forma griega candidata sin verificar»**, con borde discontinuo, idéntico formato de ficha y búsqueda que el latín. No son generadas por analogía ni se consideran verificadas filológicamente: proceden de una fuente lexicográfica estructurada y deben contrastarse antes de corregir ejercicios. No pasan a los solucionarios ni a la identificación automática del glosario del examen.

Los datos intermedios se conservan en `data/lemmas/greek-nominal-candidates.json`. La compilación los fusiona en el índice bilingüe con código de fuente `4`, manteniendo intactas las casillas verificadas. Todo el conjunto se empaqueta en `offline.html`, que **no consulta Internet durante su uso en clase**.

**Limitación:** esta fase no añade conjugaciones griegas; los verbos irregulares, los temas de aoristo y las variantes históricas requieren fuentes léxicas y modelos específicos.

## Reproducir los datos

```sh
node scripts/test-regular-latin.mjs
node scripts/test-greek-nominal-import.mjs
node scripts/build-greek-nominal-candidates.mjs
node scripts/build-lemma-index.mjs
npm run offline:build
node scripts/test-lemma-index.mjs
npm run offline:test
```

La regeneración necesita Internet solo en el **equipo de preparación**, nunca en el ordenador donde se abre `offline.html`. Los workflows de GitHub Actions ejecutan las pruebas y preparan el documento descargable al publicarlo.

## Relación con VocabulaLatinaGraecaque

La fuente léxica y la mayor parte de las formas se mantienen en `VocabulaLatinaGraecaque`; este generador importa **una instantánea versionada** para poder funcionar sin conexión y ofrecer la misma lista de lemas. Los dos repositorios no comparten actualmente una base de datos con escritura común ni recalifican automáticamente los exámenes. Más adelante podrán utilizar un mismo esquema de publicación de paradigmas verificados.
