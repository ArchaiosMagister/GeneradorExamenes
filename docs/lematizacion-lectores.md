# Ampliación de lematización mediante Collatinus y Eulexis

## Objetivo

El generador de vocabulario mantiene como fuente **preferente** el banco docente
(forma de cita, enunciado, traducción castellana y valenciana). Para reconocer
flexiones que ese banco no registra, el índice se amplía **durante la compilación**
mediante los sistemas utilizados en `lector-latino` y `lector-griego`.
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
- **Eulexis**: adaptación e inventario de Philippe Verkerk y fuentes de
  Diogenes/Perseus; el repositorio del lector declara GPL v3 para el
  conjunto de datos usado. Ver https://github.com/genuensis/lector-griego
  y https://github.com/genuensis/lector-latino.
- Texto completo de la GNU GPL v3: `THIRD_PARTY_LICENSES/GPL-3.0.txt`.

El uso de datos generados a partir de recursos sujetos a GPL requiere
conservar atribución, información de licencia y acceso a la fuente
correspondiente. La relación exacta con el banco UniMorph (CC BY-SA) y
el extracto de Wikcionario (CC BY-SA 4.0) debe revisarse **antes de
fusionar y redistribuir** el nuevo conjunto. Este cambio permanece en PR
como propuesta técnica pendiente de ese control jurídico/editorial.

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
