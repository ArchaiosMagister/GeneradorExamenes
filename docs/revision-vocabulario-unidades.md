# Revisión del vocabulario por unidades

El flujo se aplica a Latín 4.º ESO, Latín I y Griego I. «Analizar y revisar vocabulario» actualiza las unidades cuyo texto, curso o banco haya cambiado. Las propuestas de cita docente admiten revisión por lotes. Cada tarjeta muestra el pasaje y resalta la aparición que se está revisando. Las lecturas pendientes de otras unidades se pueden abrir desde el mismo panel.

Aceptar, editar u omitir guarda una decisión por curso, unidad, forma y contexto. Las decisiones persisten en el navegador y en la copia JSON. «Restablecer análisis» devuelve la aparición a la lectura automática. Si se modifica el pasaje, el contexto modificado se vuelve a evaluar. Una copia antigua con decisiones por forma se interpreta según el alcance que tenía al guardarse. Las frases idénticas repetidas en una unidad comparten las decisiones de las apariciones correspondientes.

La ficha del curso seleccionado determina el enunciado y la glosa cuando hay correspondencia con el banco docente. Una ficha sin glosa se conserva así. En Latín 4.º, la lectura sustantiva de *bona* se ofrece como alternativa léxica sin trasladar la traducción de Latín I. *Servae* se vincula con *serva* en ambos cursos. La lectura adjetival de UniMorph asociada a *servus* es incompatible con la ficha nominal del docente, incluso cuando el enunciado lleva marcas de cantidad.

Las reglas escolares y las fuentes morfológicas existentes aportan evidencia para identificar entradas. La aprobación léxica solo controla el vocabulario de Word. Las propuestas opcionales de Eulexis mantienen su procedencia y carecen de acreditación morfológica automática. El diagnóstico conserva los criterios de cobertura del banco. Las dudas de grafía, los homógrafos y las formas sin lectura siguen disponibles para revisión. Las fichas aprobadas aparecen sin asterisco y las omisiones se excluyen. Las pendientes llevan asterisco y contexto en un bloque propio de cada unidad.

## Regresión con el JSON docente de Latín I

Se importaron las 10 unidades en Chromium desde la versión autónoma y se conservaron sus textos íntegros. El recuento nuevo usa forma y contexto, por lo que sus cifras no representan el mismo conjunto que los recuentos históricos por forma y unidad.

| Resultado por forma y contexto | Casos |
| --- | ---: |
| Identificación automática | 2.111 |
| Pendientes con revisión | 154 |
| Sin lectura | 2 |
| Total | 2.267 |

La copia original marcaba *esse*, *dare* y *potest* como desconocidas. La base reciente del repositorio ya reconoce estas formas en Latín I y la prueba protege ese comportamiento. *Bona* conserva las dos lecturas. La grafía *servæ* del corpus se identifica como *serva*. También se comprobó *servae* con una prueba explícita en los dos cursos de latín. El JSON adjunto se utiliza localmente y queda fuera del repositorio.

Para reproducir el análisis completo, con Playwright y Chromium instalados:

```sh
LATIN1_VOCABULARY_CORPUS='/ruta/vocabulario-unidades(1).json' npm run vocabulary:test
npm run offline:test
npm run pwa:test
```

Las pruebas comprueban decisiones contextuales, edición, omisión, revisión por lotes, recarga, importación de copias, exportación DOCX y los tres cursos con la PWA sin red. El DOCX conserva una columna, título en versalita a 14 pt y bordes de 0,5 pt. Las pruebas inspeccionan el archivo descargado y su XML. La validación local se realizó en Chromium.

## Validación con los exámenes de Latín 4.º UD5 y Griego I UD6

Se probaron las cuatro oraciones de traducción del examen de Latín 4.º y las seis del de Griego I en Chromium, con el texto original y su glosario como referencia.

| Examen | Identificaciones automáticas | En revisión | Sin lectura |
| --- | ---: | ---: | ---: |
| Latín 4.º UD5 | 27 | 1 | 0 |
| Griego I UD6 | 34 | 5 | 0 |

En Latín 4.º se añadieron las lecturas de *terra*, *timebant* y *fortitudinem*. Se verificó la separación de *marique* en *mare* y *–que*. *Fortissime* se enviaba al Word como *fortis*. Ahora se ofrece también la lectura adverbial del glosario docente. Se seleccionó esa lectura en la tarjeta y se comprobó el Word descargado.

En Griego I se reconocieron *σώζονται* y *παιδεύεται*. Se mantuvieron en revisión cinco grafías del texto original con propuestas concretas de corrección. Las lecturas de *γίγνεται* y *χρημάτων* ya se identificaban. El banco activo prevalece si su enunciado o su glosa difieren del glosario impreso. El Word descargado conserva los pendientes en un bloque separado.

La prueba completa del JSON de Latín I mantuvo los recuentos anteriores. Se añadieron pruebas con las formas puntuales que descubrieron los exámenes. Los documentos completos se utilizaron localmente.

## Cobertura por paradigma y revisión de apariciones repetidas

El generador puede usar una flexión documentada en el índice de otro curso de latín si el lema existe en el banco activo. El enunciado y el significado provienen del banco activo. En Griego I, el presente medio-pasivo regular de los verbos temáticos en -ω se reconoce junto al activo. Los contractos siguen sus reglas específicas. Estas reglas sirven para identificar lemas para Word.

La grafía *est* sin indicación de cantidad ofrece *sum* y *edō*. La grafía *ēst* permite identificar *edō*. Véase [Allen y Greenough, §201](https://dcc.dickinson.edu/grammar/latin/irregular-verbs-fer%C5%8D-and-ed%C5%8D). Al elegir una lectura, la tarjeta muestra las demás apariciones pendientes compatibles con esa ficha. Los pasajes distintos se seleccionan de forma explícita. La decisión sigue guardándose para cada aparición seleccionada.

En el JSON de Latín I, el nuevo recuento es 2.047 identificaciones, 218 casos para revisión y 2 formas sin lectura. El cambio se debe a 64 apariciones de *est* que ahora ofrecen las dos lecturas. Hay 23 conjuntos de apariciones con las mismas opciones y advertencias, que permiten evitar hasta 102 confirmaciones separadas si el docente selecciona la misma lectura para todas las apariciones de cada conjunto. Los recuentos de las oraciones de Latín 4.º y Griego I se mantuvieron. Se comprobaron nuevamente el Word y el funcionamiento sin conexión.

## Lecturas posibles en Word

La casilla «Incluir las lecturas posibles en Word, marcadas para revisión» está desactivada de entrada y se guarda con el proyecto. Al activarla, el Word enumera las fichas candidatas de cada aparición pendiente con asterisco, forma original y contexto. Se incluyen las propuestas de Eulexis cuando el índice está disponible localmente. Una aparición sin propuestas conserva la forma original. Las decisiones aceptadas u omitidas prevalecen.
