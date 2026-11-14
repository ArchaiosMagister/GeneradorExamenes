# Vocabulario de textos de Bachillerato II

La pestaña **Generador de vocabulario** incorpora dos bancos de lectura:
**Latín II · PAU y cuaderno** y **Griego II · Lisias, Platón y Apolodoro**.
No incorporan cursos nuevos al generador de preguntas ni modifican sus claves.

## Griego II

El suplemento contiene 530 fichas léxicas y 737 grafías tomadas de los tres
repasos aportados por el docente. Incluye lemas ya presentes que necesitaban
más formas, nombres propios, elisiones y crasis explícitas. Las glosas nuevas
son propuestas castellanas; las fichas y traducciones docentes coincidentes
se mantienen como primera opción. No se inventan temas verbales ausentes.

Las correspondencias del TSV son propuestas de lectura preparadas para este
corpus, no una certificación independiente de cada análisis morfológico. Las
nuevas fichas no habilitan paradigmas productivos. Las formas ya documentadas
pueden seguir resolviéndose con la evidencia previa; las nuevas propuestas se
presentan para aceptación o edición. Se conservan alternativas como
πείσεσθαι (πείθω / πάσχω) y las diferencias de espíritu, acentuación e iota
suscrita. La aceptación para Word no altera el índice curricular.

El fixture público conserva únicamente inventarios de grafías y las huellas
SHA-256 de los DOCX: no contiene los documentos, los pasajes completos, las
instrucciones ni soluciones. Los 61 pasajes se entregan al docente en un
proyecto JSON privado, importable en la pestaña. La extracción es reproducible:

```sh
python scripts/extract-text-corpus.py documento.docx otro.docx > private/corpus.json
```

## Latín II

Se ha reutilizado el artefacto de ScholaClassica que reúne **500 paradigmas y
22.050 casillas**, procedentes del Appendix y del Vocabulario docentes, los
inventarios PAU 2006–2026 y el cuaderno 2026–2027. El extracto agrupa esos
paradigmas en 327 enunciados distintos y elimina repeticiones de registros.
Las glosas castellanas complementarias están en `latin-glosses.tsv`.

Fuente reproducible: `ArchaiosMagister/ScholaClassica`, revisión
`34b4b19d15fe6712e99f0161bac868b06f495f8c`, artefacto de
`scripts/build-morphology.mjs`. Sus dependencias fijadas y la procedencia de
los registros constan en `latin-paradigms.json`.
Los datos derivados de UniMorph conservan atribución y licencia **CC BY-SA
3.0**, cuyo texto está en `THIRD_PARTY_LICENSES/CC-BY-SA-3.0.txt`. Las demás
fuentes se identifican sin atribuirles falsamente origen UniMorph.

Los originales del PDF del cuaderno y de los exámenes no están disponibles
en esta conversación. El alcance comprobado en latín es el de sus
**inventarios de formas morfológicas ya extraídos**, no todo el léxico de sus
textos de traducción. Una cobertura del inventario no demuestra cobertura
exhaustiva de los PDF.

Los participios que solo constan dentro de una perífrasis ofrecen una propuesta
léxica pendiente de revisión, no un análisis automático de la construcción.
Las grafías impresas `comsumpserat` y `sensitur` se conservan y se señalan como
posibles erratas por `consumpserat` y `sentitur`. No se corrigen silenciosamente.

## Cobertura y uso

`docs/cobertura-bachillerato-ii.json` recoge el contraste reproducible. Todas
las grafías de los tres inventarios griegos y los tokens de los dos
inventarios latinos reciben al menos una candidata. **Esto no equivale a
acierto contextual, paradigma completo ni aceptación docente**. Las nuevas
traducciones valencianas no se generan: donde no exista equivalencia revisada,
se mantiene la revisión pendiente del formateador vigente.

Los cursos nuevos reutilizan la misma exportación DOCX: cursivas latinas,
notas parentéticas en redonda, griego en redonda y las reglas vigentes de
comillas de las glosas. El Word actual del repositorio usa una columna de
página, A4, márgenes de 2,5 cm y Palatino Linotype de 10,5 puntos.

El suplemento se distribuye en `bachillerato-ii.js`, incluido en la caché PWA
y embebido en `offline.html`. No realiza consultas a APIs, no envía textos ni
requiere instalar Eulexis. Funciona sin conexión una vez descargada la versión
autónoma o instalada la PWA. No se incluyen tablas extraídas de Eulexis ni
sus glosas en la publicación.

## Construcción y pruebas

```sh
node scripts/build-bachillerato-ii.mjs
node scripts/build-offline.mjs
node scripts/test-bachillerato-ii.cjs --report
node scripts/test-bachillerato-ii-browser.cjs
```

Para actualizar el extracto latino desde otro artefacto auditado:

```sh
SCHOLA_REVISION=<sha> node scripts/import-latin-ii.mjs /ruta/paradigmas.json
```

Las pruebas comprueban cobertura candidata, desconocidas reales, homografía,
conservación del banco docente, aislamiento de los cursos I, glosas y XML
Word. La prueba de navegador abre el HTML autónomo por HTTP local para ser
compatible con entornos que bloquean `file://`, impide todos los recursos
adicionales y verifica persistencia, importación, ambos cursos y un DOCX real.

## Suplemento de 40 invariables comunes

Se añaden 20 lemas latinos y 20 griegos que no estaban en el índice docente,
los suplementos de Bachillerato II ni el reconocimiento del generador. Son
adverbios, conectores y partículas: la identificación es léxica, sin generar
paradigmas flexivos. Las glosas editoriales incluyen castellano y valenciano;
una ficha docente posterior tiene prioridad sobre ellas.

- Latín: igitur, quidem, ergo, deinde, quoniam, quamquam, quamvis, subito,
  paene, satis, simul, frustra, fortasse, interim, nusquam, cotidie, quondam,
  fere, praeterea, praesertim.
- Griego: ἐξαίφνης, ἐνίοτε, ἴσως, σχεδόν, ἔξω, πόρρω, ἐκεῖθεν, αὖ, αὖθις,
  αὔριον, χθές, σήμερον, πέρυσι, πάλαι, ὅμως, οὐδαμῶς, ἄρτι, πρίν, ὅταν,
  μέντοι.

Fuente editable: `data/bachillerato-ii/common-invariables.tsv`. La variante
latina *quotidie* pertenece al mismo lema *cotidie*: no se cuenta como una
palabra adicional. La grave contextual griega se admite sin borrar espíritus
o sustituir acentos arbitrariamente.

Las palabras se reconocen en el generador de vocabulario de todos los cursos
y en la consulta auxiliar offline. Esta capa suplementaria no se añade al
banco exigible y no autoriza recuperación automática de respuestas de examen.
Los indicadores de cobertura curricular conservan su alcance anterior.

`node scripts/test-common-invariables.cjs` comprueba la ausencia previa de
los 40 lemas, las dos lenguas de las glosas, las variantes, el reconocimiento,
la prioridad docente y el aislamiento del índice curricular. La prueba de
navegador comprueba también los 40 registros dentro del HTML autónomo.
