# Fase II — Control de evidencia académica por forma

## Principio de integridad

La **unidad de decisión** es `curso + lema + forma + análisis + fuente`, no el lema ni el paradigma completo. Una autorización docente nunca sustituye al contraste filológico y jamás modifica `data/lemmas/teacher-forms.json` ni sus fuentes persistentes.

El panel «Evidencia académica por forma» está en **Herramientas morfológicas** y funciona sin conexión. Separa:

| Estado | Fuente del índice | Significado académico |
| --- | --- | --- |
| Verificada individualmente | `1` (paradigma docente explícito) y `5` (contraste externo de una forma) | La ficha individual tiene respaldo explícito. No certifica otras casillas. |
| Documentada externamente | `0` (UniMorph) | Lectura registrada; no equivale a validación curricular o docente automática. |
| Propuesta sin verificar | `2` (modelo regular) y `4` (Wikcionario/Wiktextract) | No participa en el sorteo sin autorización docente individual. |
| No disponible para análisis | `3` (solo cita léxica) y `6–7` (referencias léxicas) o ausencia de registro | No se inventa un análisis morfológico. |

Los enunciados del banco no son automáticamente evidencia de sus flexiones. Las reglas curriculares conservadoras del generador existente se mantienen diferenciadas de estas nuevas fuentes candidatas: una forma derivada de una regla **no adquiere la etiqueta de verificación individual** por ese motivo.

## Autorización docente individual

1. Seleccionar curso y unidad, buscar un lema o una forma.
2. Consultar los análisis y procedencias, incluidas lecturas documentadas y casos sin registro.
3. Para una propuesta **curricular y de lectura unívoca**, marcar «He revisado esta forma, su análisis y su procedencia» y pulsar «Autorizar esta propuesta».
4. A partir de una generación o regeneración posterior, la forma puede participar en el análisis morfológico. Queda identificada como «propuesta autorizada, no verificada».
5. Revocar la autorización impide exportar cualquier examen que todavía contenga esa ficha. También se bloquea la exportación si su texto fue editado después sin volver a contrastar la lectura.

No se autoriza una clase completa ni se utilizan las marcas por lema de `verification-review.js` como aprobación de una flexión. Se exige una decisión separada y explícita para cada análisis y fuente. Los registros ambiguos no entran en preguntas de análisis con una única respuesta.

Las autorizaciones se guardan en el navegador bajo `examina-academic-evidence-v1`, pueden exportarse e importarse como JSON con esquema `examina-academic-evidence/v1`, y **no se incorporan al banco verificado**. Para importar se requiere confirmación docente. Una copia del borrador conserva los identificadores de evidencia en sus ítems, pero no concede permisos en otro dispositivo: faltando la autorización local, Word y la impresión quedan bloqueados para las propuestas afectadas.

## Filtro curricular adicional

- **Latín I:** nominales de primera y segunda, adjetivos desde UD2, pronombres desde UD3; presente activo, imperfecto activo desde UD2, pasiva desde UD3, perfecto activo desde UD4 y futuro desde UD7. El perfectum pasivo compuesto tiene su tratamiento específico desde UD9 y no se admite mediante el índice de propuestas simples.
- **Griego I:** adjetivos desde UD5, pronombres desde UD7; presentes activos y medios solo después de su introducción; los nominales griegos candidatos sin clase de declinación individual contrastada quedan excluidos hasta UD8.
- **Latín 4.º:** no se amplía el sorteo con propuestas externas sin una matriz curricular contrastada para ese curso; el banco preexistente no se altera.

La admisión requiere además un curso y una unidad registrados, una lectura no ambigua, una clase permitida y autorización docente de esa forma. Una aprobación no elimina los demás filtros.

## Barreras técnicas

- Las fichas fuente `2` y `4` se mantienen como propuestas tras ser utilizadas.
- En el HTML del examen, los elementos que proceden de propuestas autorizadas portan identificadores técnicos de forma exacta, ausentes de los estilos impresos.
- Los métodos de exportación DOCX e impresión rechazan cualquier ficha autorizada previamente que haya cambiado de texto, de curso o de permiso.
- La recuperación de borradores conserva estos vínculos; no se editan las fuentes maestras ni se altera el resto del examen al autorizar o revocar.
- La generación sigue pudiendo utilizar sus paradigmas docentes y las reglas conservadoras ya existentes. **Este control no equivale a una auditoría individual de todas las casillas de esos paradigmas**; una revisión completa de irregularidades y deponentes continúa como trabajo filológico separado.

## Comprobaciones

- `node scripts/test-academic-evidence.cjs`: estados por fuente, autorización individual, aislamiento entre cursos y formas, filtro por tiempo/voz/unidad, homografía, revocación y bloqueo tras editar.
- `node scripts/test-academic-evidence-browser.cjs`: funcionamiento offline en Chromium, casilla de confirmación, persistencia, revocación y bloqueo de la descarga Word.
- `npm run offline:build` y pruebas existentes de previsualización, DOCX, PWA y edición bidireccional.

**Publicación:** estas modificaciones se mantienen en un PR de borrador. No fusionar ni desplegar sin autorización docente y sin la batería obligatoria en verde.
