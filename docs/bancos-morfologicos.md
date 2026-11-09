# Bancos morfológicos y validación externa

## Estado de esta versión

La webapp carga automáticamente los índices `data/unimorph/{lat,grc}-{v,n,adj,pro}.json`
si están publicados. No requiere importar archivos. Si falta un índice, sigue
funcionando con su corpus anterior. La morfología de Latín I usa los índices
de verbos y formas nominales cuando están disponibles; la generación de
Griego I conserva su corpus verificado anterior.

## Reproducir la clasificación

```sh
python -m unittest discover -s tests -p 'test_*.py'
python scripts/build_unimorph.py
```

El workflow `.github/workflows/update-unimorph.yml` ejecuta las pruebas y
publica los índices mensualmente o mediante ejecución manual. El código
del workflow por sí solo no significa que los bancos se hayan generado.

## Validación mediante lematizadores externos

- LEMLAT3 (latín): https://github.com/CIRCSE/LEMLAT3
- Collatinus (latín): https://github.com/biblissima/collatinus
- Eulexis-web (griego): https://github.com/biblissima/outils.biblissima.fr/tree/master/eulexis-web

**Todavía no se ejecuta ninguno de esos tres analizadores en el pipeline.**
Eulexis-web necesita datos lingüísticos externos y PHP para su versión web.
No debe confundirse una coincidencia de lema con la validación del análisis
morfológico completo. Antes de distribuir datos derivados de estas fuentes,
hay que revisar licencias y condiciones de reutilización. Las formas que no
se puedan clasificar de manera segura permanecen excluidas.

## Pendiente

1. Ejecutar el workflow y auditar recuentos, clases y formas ambiguas.
2. Validar contra Eulexis/Collatinus/LEMLAT3 mediante una interfaz reproducible
   y respetuosa con sus licencias.
3. Conectar los índices griegos a las preguntas de Griego I y completar
   la selección curricular del resto de los modelos.
4. Revisar el control de clases de verbos y adjetivos irregulares.

## Registro de integración y criterios de admisión

| Corpus | Lengua | Estado | Uso permitido |
| --- | --- | --- | --- |
| UniMorph | Latín y griego antiguo | Índices curriculares incluidos; índice de consulta completa preparado, pendiente de publicación y verificación | Consulta de formas y lemas; ejercicios solo con filtro curricular |
| LEMLAT3 | Latín | Pendiente de adaptación y revisión de licencia/datos | Ningún análisis se atribuye todavía a LEMLAT3 |
| Collatinus | Latín | Pendiente de adaptación y revisión de licencia/datos | Ningún paradigma se atribuye todavía a Collatinus |
| Eulexis | Griego antiguo | Pendiente de adaptación de datos y revisión de licencia | Ningún análisis se atribuye todavía a Eulexis |

### Reglas para nuevos adaptadores

1. Los datos de cada fuente se conservarán en un directorio separado y con metadatos de procedencia, versión y licencia; no se mezclarán silenciosamente con UniMorph.
2. La consulta admitirá varias lecturas para una misma forma y distinguirá explícitamente **forma**, **lema** y **análisis**.
3. Las formas usadas en exámenes deberán superar la verificación del paradigma, la clasificación por unidad y las restricciones docentes (por ejemplo, no preguntar plurales de nombres propios).
4. Los adaptadores se ejecutarán durante la preparación de los bancos; la webapp publicada no dependerá de PHP, Python, Qt ni de una conexión de red durante la consulta de los índices locales.
5. Una coincidencia entre lemas de dos corpus no basta para validar un análisis; las discrepancias se registrarán para revisión.

**Nota operativa:** el archivo `scripts/build_unimorph_lookup.py` y su paso de GitHub Actions están preparados, pero hasta que se ejecute y se publique `data/unimorph/lookup/`, la consulta completa seguirá indicando cobertura parcial. No se debe anunciar como completada antes de verificar los archivos y los recuentos.
