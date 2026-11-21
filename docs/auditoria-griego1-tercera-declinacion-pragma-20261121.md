# Auditoría filológica de Griego I · Tercera declinación UD8 · 21/11/2026

## Incidencia comprobada
En el banco general se encontraba la entrada «πράγμα, πραγμάτος (N)», que contiene tres errores editoriales para griego clásico: el nominativo debe acentuarse «πρᾶγμα», el genitivo «πράγματος» y el género neutro se expresa con el artículo griego (τό), no con la abreviatura latina N. El vocabulario exigible de UD8 conservaba el nominativo «πράγμα» con acento agudo.

Fuentes:
- Logeion (LSJ), πρᾶγμα, πράγματος, τό: https://logeion.uchicago.edu/%CF%80%CF%81%CE%B1%CD%82%CE%B3%CE%BC%CE%B1
- Gramática de acentuación griega: https://www.azimonti.com/philology/ancient-greek/foundations/accent/

## Correcciones aisladas
1. Banco general y ficha de análisis verificado: «πρᾶγμα, πράγματος (τό)».
2. Vocabulario exigible de UD8: «πρᾶγμα, −ματος (τὸ)», respetando la abreviación docente y su significado.
3. Ficha auxiliar de ἡγεμών: usar artículo griego (ὁ) y no (M) para el género masculino de tercera declinación.
4. Índice académico desde origen inmutable: una corrección editorial precisa en verified-overrides; no se aprueba por analogía ninguna forma adicional.
5. Migración local exacta únicamente de la antigua ficha exigible de Griego I / UD8; no sobrescribir añadidos o cambios personales.
6. Conservación de la única forma ya contrastada de πρᾶγμα (dativo singular πράγματι), sin alterar su análisis o procedencia.

## Pruebas
script: scripts/test-greek-pragma-third-decl.cjs
El test compara la fuente de materiales, el índice académico persistente, el banco general y las fichas verificadas en web y PWA, así como la idempotencia y alcance de la migración. También siguen ejecutándose las regresiones comunes sobre los modelos de examen, las 14 unidades, Word/PDF y navegadores.

**Sin fusión ni despliegue:** estos cambios se preparan encima de la rama de la PR #197 y no se integrarán en main sin autorización del docente.
