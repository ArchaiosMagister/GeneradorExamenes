# Auditoría integral de la PR #234 (27 de noviembre de 2026)

## Alcance y resultados

Se probaron Latín 4.º, Latín I y Griego I en los modelos disponibles, castellano y valenciano, unidades aisladas y acumuladas, web y `offline.html`. La auditoría de exámenes reales recorrió **592 combinaciones**, generó **72 DOCX**, probó **12 ediciones bidireccionales** y encontró **0 bloqueantes**. El informe detallado reproducible se genera en `test-artifacts/auditoria-examenes-reales-20261114.json` con `scripts/test-real-exam-audit.cjs`.

| Banco morfológico (web, por unidad y modelo) | Términos distintos mínimo–máximo | Casillas solicitadas como máximo |
| --- | ---: | ---: |
| Latín I, tablas: declinación / conjugación / análisis | 126–198 / 14–182 / 199–3446 | 2 / 2 / 4 |
| Latín I, morfología: sintagmas / verbos / formas | 126–198 / 954–7701 / 1899–3854 | 3 / 10 / 4 |
| Latín I, morfología: pronombres | 6–13 | 10, con repetición admitida |
| Latín 4.º: declinación / conjugación / análisis | 65–198 / 3–59 / 108–1463 | 2 / 2 / 4 |
| Latín 4.º: declinación y género / temas de tercera / tabla | 10–20 / 12 / 54 | 6 / 6 / 6 |
| Griego I, completo: declinación / conjugación / análisis | 3–13 / 1–22 / 48–457 | 2 / 4 / 4 |
| Griego I, morfología: declinación / verbos / formas / pronombres | 3–109 / 8–149 / 56–540 / 15–40 | 3 / 10 / 4 / 10 |

El inventario léxico verificó los repertorios en ambos idiomas y en ambos HTML: Latín 4.º tiene 28–132 prefijos y 97–373 términos de fonética; Latín I, 285 prefijos, 488–667 términos de fonética, 87 latinismos y 4–28 casos de modificación preverbial. Los filtros por prefijo, fenómeno y unidad se comprueban en `scripts/test-lexical-bank-capacity.cjs`. Se conservaron los 87 latinismos y los ejemplos aprobados.

## Cambios corregidos en esta fase

- Las regeneraciones individuales ya no recurren a un sorteo global ante un fallo. Las pruebas conservan otros nodos, ediciones, filtros, glosarios, caché y borrador, y verifican el agotamiento de alternativas.
- Los datos académicos necesarios para regenerar se mantienen en un contenedor interno inerte fuera de `#paper`. La vista previa, el PDF y el Word solo incluyen el documento del alumnado. Se retiraron los botones, acciones rápidas, rótulos y estilos del antiguo solucionario.
- La tabla de tercera declinación de Latín I conserva y actualiza los análisis internos de sus diez filas al cambiar o regenerar una fila.
- En Latín I se completan las diez filas de pronombres con repeticiones cuando el repertorio de las primeras unidades tiene menos de diez formas distintas, según el criterio docente confirmado.
- Los paradigmas de presente activo regular ya verificados pueden sortearse en Griego I desde UD2 aunque el lema aparezca más tarde en el vocabulario. Se mantiene la verificación explícita de formas y no se infieren acentos ni flexiones sin contraste.
- La exportación Word evita el recorte del comienzo de las cabeceras largas observado en LibreOffice. Se verificaron visualmente muestras DOCX convertidas a PDF de los tres cursos, más PDF generados en Chromium y WebKit. Las tablas conservan filas, celdas, bordes y espacio de escritura en esas muestras.
- Se reconstruyó `offline.html` con el generador oficial y se comprobó su equivalencia con la web.

## Límites justificados y pruebas

Quedan **24 observaciones de revisión**, todas concentradas en Griego I UD1 y repetidas entre idioma, HTML y selección acumulada o aislada: solo hay un paradigma de conjugación (`εἰμί`) para cuatro plazas configurables, ocho formas verbales distintas para diez plazas del modelo morfológico y tres propuestas de declinación para tres plazas, sin alternativa adicional. UD1 aún no introduce el presente activo regular. Al agotarse un banco, la regeneración conserva lo existente e informa del límite. Desde UD2 se ofrecen los paradigmas regulares verificados aunque el lema no sea vocabulario exigible. No se cambiaron cuotas ni se inventaron formas para ocultar esta restricción curricular.

Pasaron `python3 -m unittest discover -s tests`, la batería `sources`, las cuatro particiones de Chromium y `compatibility` con WebKit; además, las pruebas dirigidas de inventario, regeneración, exportación, PWA y las cuotas griegas. La CI de los **siete trabajos obligatorios para el commit final** debe comprobarse en GitHub antes de fusionar y publicar; los resultados locales no la sustituyen. La inspección visual de Word y PDF fue representativa, no una certificación de cada página de las 72 muestras. WebKit cubrió perfiles de Safari; queda fuera del entorno la comprobación en iPhone o iPad físicos.

## Decisiones docentes

Quedaron aplicados los dos criterios confirmados: repetición de pronombres y admisión de verbos regulares fuera del vocabulario en tiempos ya explicados. Las limitaciones de UD1 se documentan sin cambiar las cantidades preestablecidas. No se identifica otra decisión docente imprescindible para esta publicación.
