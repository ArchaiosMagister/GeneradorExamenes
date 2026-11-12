# Auditoría del lematizador de oraciones (12 de noviembre de 2026)

## Alcance y criterios

Este control afecta a la generación del **vocabulario de las oraciones de examen** y al generador independiente de vocabulario por unidades. Abarca Latín I, Latín 4.º ESO y Griego I, la versión de GitHub Pages y la PWA/autónoma.

1. **Flexiones.** Se buscan las formas en el índice offline de lemas y en paradigmas escolares expresamente declarados. Se conservan los enunciados docentes; no se reconstruyen perfectos, aoristos ni traducciones sin fuente.
2. **Homografía.** Para una forma como *Galli* o *bona*, se mantienen los lemas distintos, con sus enunciados y glosas. La aceptación es una decisión **de esa aparición**, no una acreditación morfológica para el banco.
3. **Progresión.** Se seleccionan exclusivamente las fichas del curso correspondiente; el banco exigible de las unidades se consulta por separado para decidir qué traducciones se ocultan. Una palabra que aparece en un texto pero aún no se exige puede añadirse con su glosa: el sistema no la convierte por ello en vocabulario exigible.
4. **Word.** Se usan las decisiones vigentes y los datos actuales del banco. Una decisión antigua conserva la identidad del lema, pero nunca debe imponer un significado o un enunciado obsoletos. Las lecturas pendientes siguen identificadas como pendientes.

## Problemas identificados y correcciones

- **Dos oraciones iguales:** la clave de identificación dependía del texto, la grafía y el ordinal *dentro* de la oración. Dos oraciones idénticas quedaban fusionadas. Ahora se conserva la clave antigua para la primera y se distingue cada repetición posterior por el índice de oración. El análisis independiente por unidades se invalida con un incremento de versión, pero se conservan las decisiones que sigan teniendo identidad compatible.
- **Decisiones guardadas en el examen:** se almacenaban también el enunciado y las traducciones, que al reutilizarse podían pisar una corrección posterior del banco. Ahora se revalida la elección frente a los candidatos presentes y se recuperan los datos vigentes. Si el lema ha dejado de ser candidato, vuelve a solicitarse revisión; si ha cambiado el enunciado y el lema sigue siendo unívoco, la elección persiste.
- **Pruebas insuficientes de extremo a extremo:** se añaden controles reproducibles sobre formas flexionadas, los dos homógrafos docentes, unidades/asignaturas, repetición de oraciones, persistencia de decisiones y el contenido real del archivo Word. Se incorporan a la CI junto a las pruebas de previsualización, exportación y PWA existentes.

## Cómo reproducir

En el repositorio, ejecutar `node scripts/audit-sentence-lemmas.cjs`, `node scripts/test-vocabulary.cjs`, `node scripts/test-exam-glossary.cjs` y la suite de `.github/workflows/offline-check.yml` (que construye `offline.html` antes de probar). La auditoría muestra las cantidades reales del banco e índice en cada ejecución.

## Límites filológicos que siguen siendo explícitos

- No es un analizador sintáctico general ni un diccionario exhaustivo. Las candidatas de UniMorph y de otras fuentes, las formas de cita sin flexión contrastada y los paradigmas regulares proceden de fuentes distintas y no se convierten automáticamente en formas *individualmente verificadas*.
- Una grafía ambigua exige selección manual; elegir una lectura para el Word **no** modifica el índice de verificación.
- Una grafía desconocida se señala: no se fuerza un lema por semejanza. Las traducciones a valenciano sin correspondencia revisada siguen requiriendo revisión, no una adaptación inventada.
- Las selecciones anteriores para dos apariciones de la **misma** oración podían estar ligadas. Al diferenciar por primera vez sus identidades, las apariciones repetidas posteriores pueden pedir una decisión nueva; la primera mantiene su elección anterior.

## Publicación

La versión online y la autónoma deben proceder del mismo código. **No integrar** si falla la nueva auditoría o cualquier prueba de la batería existente.