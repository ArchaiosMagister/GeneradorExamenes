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

La generación provisional latina se limita a sustantivos de **primera/segunda declinación**, con nominativo y genitivo compatibles, y verbos activos de conjugación **primera, segunda, tercera, cuarta y mixta** cuando la clase está expresamente identificada. Solo se generan presente e imperfecto de indicativo y, cuando el profesor proporciona la forma de perfecto, perfecto activo. Las formas deponentes, verbos sin conjugación reconocible, sustantivos de tercera, adjetivos irregulares y casos como el vocativo de `-ius` quedan fuera. Tampoco se inventan plurales de nombres propios.

Las propuestas se contrastan automáticamente **con cada casilla documentada** que ya exista para el mismo lema. Ante una contradicción se descarta entero el modelo y se registra la incidencia en `extensions.rejected_for_conflict`. Las propuestas no sustituyen ninguna forma existente.

Para el griego **no se generan formas flexivas sin contrastar**: la acentuación, el aumento y los temas nominales/verbales requieren un tratamiento más fino. Las entradas griegas sin paradigma quedan localizables mediante su forma de cita.

La cabecera del lematizador muestra ahora, **para cada curso**, cuántos lemas tienen alguna forma documentada, cuántos cuentan con modelos regulares provisionales y cuántos solo conservan su entrada de vocabulario. Estas cifras no significan que el paradigma esté completo.

La búsqueda de una forma sigue devolviendo todos los lemas posibles. Sin embargo, la recuperación del **vocabulario final de un examen** solo usa formas documentadas o la propia cita léxica; jamás formas de un modelo provisional. La fuente de cada lectura se muestra junto a su enunciado completo.

## Reproducir los datos

```sh
node scripts/test-regular-latin.mjs
node scripts/build-lemma-index.mjs
npm run offline:build
node scripts/test-lemma-index.mjs
npm run offline:test
```

La regeneración necesita Internet solo en el **equipo de preparación**, nunca en el ordenador donde se abre `offline.html`. Los workflows de GitHub Actions ejecutan las pruebas y preparan el documento descargable al publicarlo.

## Relación con VocabulaLatinaGraecaque

La fuente léxica y la mayor parte de las formas se mantienen en `VocabulaLatinaGraecaque`; este generador importa **una instantánea versionada** para poder funcionar sin conexión y ofrecer la misma lista de lemas. Los dos repositorios no comparten actualmente una base de datos con escritura común ni recalifican automáticamente los exámenes. Más adelante podrán utilizar un mismo esquema de publicación de paradigmas verificados.
