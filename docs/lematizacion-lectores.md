# Ampliación de lematización mediante Collatinus y Eulexis

## Objetivo

El generador de vocabulario mantiene como fuente **preferente** el banco docente
(forma de cita, enunciado, traducción castellana y valenciana). Para reconocer
flexiones que ese banco no registra, existe una **ampliación experimental**
con sistemas utilizados en `lector-latino` y `lector-griego`.
**La compilación y publicación estables no ejecutan esa ampliación**, a la
espera de comprobar las condiciones de redistribución de cada fuente.
Los motores originales **no se incluyen en el cliente**: `offline.html` y
la webapp PWA consultan únicamente `data/lemmas/teacher-forms.json`.

### Procedencia reproducible

| Idioma | Motor de consulta en compilación | Revisión fijada | Código de fuente |
| --- | --- | --- | --- |
| Latín | Collatinus 11 mediante `genuensis/lector-latino` | `6e3a05c55dfd0514d1bd507a246172f103b49e92` | 6 |
| Griego | Eulexis (datos Diogenes/Perseus), mediante `genuensis/lector-griego` | `e3ca505b0e028af68a800673f5dc4565b0b05104` | 7 |

Los ficheros de los lectores se obtienen exclusivamente en la construcción,
por HTTPS mediante `git fetch` de la revisión indicada.
No se utilizan APIs de lematización de terceros cuando el profesor pega un texto.

El índice resultante es un extracto de **formas de los lemas del temario**.
No pretende ser un léxico exhaustivo de cualquier obra latina o griega.
Los formatos propios de los lectores no se trasladan a la salida del usuario:
el Word y los proyectos JSON siguen teniendo los enunciados y las glosas
del banco docente, con ortografía filológica, cursivas, comillas e idioma
elegido por el profesor.

## Verificación y ambigüedades

- Fuentes 0, 1 y 5: UniMorph, paradigmas docentes y contraste individual previo.
- Fuente 6: formas generadas a partir de modelos del léxico de Collatinus.
- Fuente 7: formas explícitas del índice morfológico de Eulexis.
- Fuentes 2 y 4: **candidaturas sin verificar** de modelos anteriores.
- Fuente 3: solo forma de cita del banco docente.

Tener una forma de Collatinus o Eulexis indica que la fuente propone ese
análisis; **no constituye revisión filológica del paradigma completo**.
Las homografías entre lemas distintos no se resuelven por frecuencia, sino que
se muestran al profesor. Las invariables como `ab` y `et` tienen un léxico
nuclear explícito de gramática escolar cuando faltan en el banco docente;
los significados no se inventan a partir de las formas flexionadas.

No debe utilizarse el resultado de este índice como solucionario de
un examen: la selección y calificación morfológica siguen sujetas a las
restricciones y comprobaciones particulares del generador de exámenes.

## Licencias y publicación

- **Collatinus 11**: autores Yves Ouvrard y Philippe Verkerk, GNU GPL v3.
  Repositorio de referencia: https://github.com/biblissima/collatinus
- **Eulexis**: Philippe Verkerk, con datos de Diogenes/Perseus. La versión
  de escritorio actual declara GPL v3; la antigua implementación web indica
  CC BY-NC 4.0. El repositorio `genuensis/lector-griego` **no contiene una
  licencia de repositorio explícita que acredite la redistribución exacta
  de sus fragmentos**. Ver https://github.com/genuensis/lector-griego
  y https://github.com/biblissima/eulexis.
- Texto completo de la GNU GPL v3: `THIRD_PARTY_LICENSES/GPL-3.0.txt`.

### Contraste de licencias (11-11-2026)

La documentación oficial vigente de Biblissima declara **GNU GPL v3**
para Collatinus y la versión actual de Eulexis:
- https://outils.biblissima.fr/en/collatinus/
- https://outils.biblissima.fr/en/eulexis/
- https://outils.biblissima.fr/fr/eulexis/aide/licence.html

**Advertencia**: la versión histórica de Eulexis-web, hoy archivada,
indicaba **CC BY-NC 4.0**:
https://github.com/biblissima/eulexis

Este dato no autoriza a asumir que todos los archivos y versiones,
incluidos los corpus morfológicos de Diogenes/Perseus redistribuidos
por terceros, se hayan relicenciado. Antes de distribuir una copia
derivada, debe verificarse la procedencia exacta de los ficheros
`data/f` y `data/l` del lector, o pedirse confirmación a sus titulares.
Las glosas de diccionarios con licencias distintas no se importan.

### Separación de componentes y atribución

El fichero de índice almacena para **cada análisis** un código de
procedencia (0–7); es una agregación de registros identificables, no una
tabla de paradigmas mezclados ni un cambio unilateral de sus licencias.
Los registros UniMorph se identifican como CC BY-SA 3.0; los extractos
de Wikcionario como CC BY-SA 4.0; los derivados de Collatinus/Eulexis
como sujetos a la licencia aplicable a su fuente exacta. No se declara
una licencia única sobre materiales de terceros.

Creative Commons distingue expresamente las colecciones de las
adaptaciones; la compatibilidad GPLv3 / CC BY-SA 4.0 es unidireccional y
no se extiende sin más a CC BY-SA 3.0:
https://creativecommons.org/compatible-licenses/
https://creativecommons.org/faq/

Los textos de las dos licencias CC BY-SA están disponibles en
`THIRD_PARTY_LICENSES`, junto a la GPL. Este análisis es una advertencia
de cumplimiento, **no una autorización jurídica**. Si persiste la duda
sobre Eulexis, se debe distribuir únicamente el índice de origen claro
hasta recibir confirmación.

El uso de datos generados a partir de recursos sujetos a GPL requiere
conservar atribución, información de licencia y acceso a la fuente
correspondiente. La relación exacta con el banco UniMorph (CC BY-SA) y
el extracto de Wikcionario (CC BY-SA 4.0) debe revisarse **antes de
fusionar y redistribuir** el nuevo conjunto. Este cambio permanece en PR
como propuesta técnica pendiente de ese control jurídico/editorial.

## Decisión de integración (11 de noviembre de 2026)

**Collatinus: técnicamente viable, pero solo con publicación conforme a la GPL v3.**
La fuente `biblissima/collatinus` incluye licencia GPL-3.0 y la documentación
oficial la confirma: https://github.com/biblissima/collatinus
Se puede usar el motor para contrastar lemas sin alterar las glosas docentes.
Si se distribuye código adaptado, debe acompañarse del código fuente
correspondiente, avisos de autoría, licencia e indicación de cambios.
Si se distribuyen índices transformados de sus bases, hay que documentar de
qué archivos proceden, sus titulares y sus condiciones, manteniendo los
datos separados del corpus UniMorph y Wikcionario para no afirmar una
licencia única. Es preferible un recurso independiente y acreditado a
incorporarlos sin identificación de origen en `data/lemmas/teacher-forms.json`.

**Eulexis: no redistribuir por ahora los fragmentos del lector griego.**
Aunque el programa actual aparece bajo GPL v3,
https://github.com/biblissima/eulexis publica el antiguo Eulexis-web
bajo CC BY-NC 4.0 y el origen de las tablas de formas incluye Diogenes y
Perseus. El comentario en `greek.js` no es autorización explícita para
redistribuir la base de datos completa ni sus transformaciones. Hace falta
una declaración verificable sobre el conjunto concreto de ficheros y
su licencia; si no está disponible, solicitar aclaración a sus titulares.
No basta la autorización del profesor, que no es titular de esos datos.

Ambas evaluaciones afectan a la **redistribución pública**, no al
estudio de salidas de los programas para corregir manualmente el vocabulario.
Ningún cambio de licencia permite aprobar automáticamente un homógrafo.
## Reproducir la integración y probarla

Con acceso a Internet **solo en compilación**:

```bash
node scripts/build-greek-nominal-candidates.mjs
node scripts/build-lemma-index.mjs
node scripts/enrich-from-readers.mjs
node scripts/test-latin-vocabulary-corpus.cjs
npm run offline:build
npm run vocabulary:test
```

Para uso ordinario sin Internet bastan los activos ya construidos. Se incluye
una batería de diez frases originales en
`tests/latin-vocabulary-sentences.json` y una prueba de navegador que
introduce las frases en el generador real.


## Revisión interactiva de Griego I (tarjetas)

La webapp incorpora el módulo `greek-review.js` para resolver análisis incompatibles
de una misma forma. Detecta las **ambigüedades internas** del índice docente publicado
(sin elegir automáticamente ninguna) y, cuando se le facilita un índice Eulexis
local, antepone las discrepancias que involucran esa fuente.

El docente puede escoger un análisis, conservar todas las interpretaciones
(ambiguas), excluir la forma o saltar a la tarjeta siguiente. La tarjeta
desaparece inmediatamente después de elegir. Cuando una forma aparece en
alguna oración de Griego I, se muestra el contexto con la palabra destacada.
Las decisiones se guardan en `localStorage` y pueden exportarse/importarse
como JSON, útil para pasar del ordenador al iPad.

**Límite deliberado de seguridad:** estas decisiones NO modifican el corpus
compartido, las claves ni las preguntas de examen. «Excluir» expresa una
preferencia de revisión y no bloquea todavía los modelos de generación.
El componente distingue las propuestas documentadas de las candidatas;
ninguna selección convierte automáticamente una forma en «verificada».

### Preparar Eulexis de forma local y optativa

Para preparar un extracto legible **sin añadir datos a GitHub**:

```bash
node scripts/export-eulexis-review.mjs
```

Requiere `git`, Node.js e Internet **solo durante esa preparación**. El
script consulta una revisión fija de `genuensis/lector-griego`, filtra las
formas cuyos lemas figuran en el banco docente y produce
`private/eulexis-review.json`. Este archivo está excluido por `.gitignore`.
No incluye glosas procedentes de LSJ/Bailly/Pape; conserva la referencia del
origen. No redistribuir el fichero sin comprobar los derechos aplicables
a las tablas de Diogenes/Perseus.

En la PWA, abre «Griego I · Resolver discrepancias por tarjetas» → «Índice
Eulexis local (opcional)» → «Cargar índice Eulexis» y selecciona el JSON.
El análisis se realiza en el propio navegador, sin subida a servidores.
El corpus importado se mantiene solamente durante la sesión; por su tamaño
**no se guarda** en almacenamiento local. Las decisiones, separadas del corpus,
sí se pueden conservar y exportar.

Formato abierto de intercambio (de elaboración local):

```json
{
  "schema": "examina-eulexis-review/v1",
  "rows": [
    {"form": "λόγος", "lemma": "λόγος", "analysis": "masculino nominativo singular"}
  ]
}
```

El ejemplo ilustra el esquema, **no es una importación de la base Eulexis**.
Se rechazan archivos mal formados, demasiado grandes o con formas no griegas.
Las voces fuera del vocabulario de Griego I no se incorporan al generador.

### Pruebas automáticas

- `scripts/test-greek-review.mjs`: normalización Unicode, deduplicación,
  filtros curriculares, fuentes, validación de ficheros y conflictos sintéticos.
- `scripts/test-greek-review-browser.cjs`: Chromium sin conexión; elección
  que avanza, omisión, deshacer, almacenamiento local, contexto disponible e
  importación sin llamadas de red.
- `scripts/build-offline.mjs` incrusta el módulo en `offline.html`; el
  service worker cachea `greek-review.js`. El workflow de publicación
  distribuye el módulo a la webapp estable.

La publicación de la interfaz **no autoriza** publicar el índice Eulexis.
La incertidumbre jurídica sobre los datos originales permanece y se
documenta arriba.


## Instalación personal de Eulexis en la PWA (sin redistribuir corpus)

La PWA de Griego I ofrece ahora **«Activar Eulexis en este dispositivo»**.
No hace falta instalar una aplicación de escritorio, importar a mano un JSON ni
ejecutar código con permisos del profesor. El primer uso requiere Internet y
descarga unos **30 MB** de fragmentos **directamente** del repositorio
\`genuensis/lector-griego\` (revisión
\`e3ca505b0e028af68a800673f5dc4565b0b05104\`). El código local procesa
los lemas y las formas en el navegador: solo los análisis que corresponden a
lemas del temario de Griego I se almacenan en IndexedDB bajo el origen de la
PWA. Las fichas externas completas y las glosas de Bailly, LSJ y Pape nunca
son replicadas ni incluidas en la publicación de GitHub Pages. El profesor
puede eliminar los datos instalados; **las decisiones docentes se conservan
aparte**.

Conexión requerida: **solo para la instalación inicial o una reinstalación**.
La revisión posterior funciona sin conexión, incluido el archivo autónomo
\`offline.html\` en navegadores que permitan almacenamiento local. El espacio
específico de la PWA instalada puede diferir del usado en Safari/Chrome:
cada origen o instalación puede necesitar su propia activación. La política
del navegador puede eliminar datos locales si hay poco almacenamiento.

Este acceso directo al origen no resuelve la ambigüedad de licencias de los
fragmentos redistribuidos por terceros: por eso **no se guardan en GitHub ni
en los assets del sitio**. No constituye una aprobación de todas sus formas.
Las propuestas se distinguen de las verificaciones docentes y las homografías
siguen sujetas a revisión por tarjetas. Para la forma \`θεά\`, el adaptador
excluye el lema distinto \`θέα\` ('vista'). El adaptador emplea código propio
de conversión Beta Code y una extracción mínima, sin ejecutar scripts
descargados del origen. Las peticiones CORS se envían solo cuando el docente
pulsa instalar. La instalación puede fallar si GitHub está inaccesible o el
navegador impide el almacenamiento.

Tests:
- \`node scripts/test-eulexis-local.cjs\`: conversión, homografía,
  filtrado por programa, invalidación de caché, sin necesidad de corpus real
- \`node scripts/test-eulexis-browser.cjs\`: origen remoto interceptado con
  fragmentos de prueba, instalación con un clic y caché IndexedDB sin red
- \`node scripts/test-greek-review-browser.cjs\`: el importador JSON manual
  preexistente sigue disponible y no exige Internet

**Límite funcional**: la instalación amplía la revisión filológica; **no
convierte las formas de Eulexis en formas verificadas para exámenes**,
ni modifica automáticamente las 399 fichas o sus glosas.

## Consultar ambos lectores para un proyecto de vocabulario

El generador por unidades admite propuestas personales de los lectores de
latín y griego. La consulta se hace para todas las formas de una copia del
proyecto, con los motores de las revisiones indicadas arriba y sus léxicos
completos. Los motores y sus datos se usan localmente. El archivo resultante
contiene forma, lema y análisis, sin glosas de los lectores.

Con Node.js y un checkout local del lector en la revisión fijada:

```sh
node scripts/prepare-reader-proposals.mjs proyecto.json carpeta-del-lector propuestas.json
```

En «Propuestas de los lectores de latín y griego», carga `propuestas.json`.
La aplicación busca una ficha en el banco del curso seleccionado para cada
lema que propuso el lector. Si la encuentra, toma de ahí el enunciado y las
glosas. Si falta la ficha, la lectura aparece con el lema externo y sin
traducción. Las propuestas se conservan en el proyecto y en sus copias JSON.
Pueden quitarse sin borrar decisiones ya aceptadas. Si añades formas nuevas
que no figuran en el archivo, vuelve a prepararlo con el proyecto actualizado.

Las propuestas aparecen en las tarjetas y en el bloque de pendientes de Word
al activar la casilla de lecturas posibles. La consulta de los lectores no
acredita una flexión ni modifica los ejercicios, los solucionarios o el banco
exigible. La instalación opcional anterior de Eulexis sigue disponible para
sus consultas habituales y conserva su alcance curricular.

En los materiales de prueba, el lector latino encontró propuestas para
1.372 de 1.379 formas escritas distintas del JSON de Latín I, incluidas
*amica* y *Helvetios*, y para las 28 del examen de Latín 4.º. El lector griego
encontró propuestas para 33 de 34 formas distintas del examen de Griego I.
Estas cifras miden si el lector devolvió alguna lectura.


## Salvaguardas de la revisión del generador (11-11-2026)

- **Latín y griego:** cada asignatura conserva sus propios textos, unidades,
  decisiones, formato verbal y progreso; las copias JSON incluyen los tres
  espacios de trabajo y pueden importar proyectos antiguos.
- **Participios latinos:** los supinos docentes permiten identificar de forma
  automática participios regulares y algunas alternancias léxicas contrastadas
  sin certificar un paradigma completo. Los supinos incongruentes se muestran
  como hipótesis. Cuando un adjetivo homógrafo sin ficha ni glosa compite con
  un participio inequívoco del verbo docente, se prefiere el verbo; las
  ambigüedades con ficha propia continúan pendientes.
- **Edición del texto:** una decisión cuyo contexto cambió no se aplica a
  ciegas. Si la oración mantiene suficiente coincidencia, se ofrece como
  opción de revisión para evitar repetir toda la corrección.
- **Contradicciones entre lectores:** si una fuente externa propone otro
  lema que también existe en el banco docente, la aparición se marca para
  revisión, incluso cuando antes figuraba como documentada. Aceptar una
  interpretación no valida todas sus flexiones.
- **Almacenamiento:** las propuestas importadas se guardan preferentemente
  en IndexedDB, sin duplicarlas en localStorage. Las copias JSON siguen
  incorporando esos datos y permiten recuperar el proyecto. Si IndexedDB
  no está disponible, el navegador avisa de la limitación.
- **Glosario del examen:** la desambiguación emplea también el criterio
  contextual del generador por unidades para evitar que las dos vistas
  atribuyan niveles diferentes de certeza a una misma forma.

### Conexión a Internet

No se exige que el generador funcione siempre sin conexión. Para el
contraste filológico, la interfaz enlaza las aplicaciones oficiales
[Collatinus-web](https://outils.biblissima.fr/fr/collatinus-web/) y
[Eulexis-web](https://outils.biblissima.fr/fr/eulexis-web/).

No se han configurado peticiones programáticas a esos portales: ofrecen
aplicaciones web, pero esta integración aún no dispone de una API pública
documentada y verificada (incluidas las restricciones CORS). Las lecturas
personales preparadas por el procedimiento reproducible anterior sí pueden
importarse a las tarjetas. Los textos del profesor no se envían
automáticamente a terceros.

La rama no debe fusionarse mientras sus comprobaciones automáticas o la
revisión de licencias/atribuciones estén pendientes.
