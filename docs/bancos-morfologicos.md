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
