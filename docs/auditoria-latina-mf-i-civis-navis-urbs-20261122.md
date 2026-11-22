# Auditoría de los temas en -i: civis, navis y urbs · 22/11/2026

## Alcance y precondición
Las cinco comprobaciones principales de las PR #210, #211 y #212 constan como satisfactorias en sus SHA respectivos. Esta PR depende de #212 y permanece en borrador: no fusionar ni publicar sin autorización docente.

Se han examinado los paradigmas morfológicos, no las cantidades vocálicas. Los tres lemas figuran en el índice con fuente histórica 0; no hay promociones a fuente 5.

## Paradigmas principales
Orden: nominativo, vocativo, acusativo, genitivo, dativo, ablativo.

- **civis, civis (m./f.)**: singular `civis, civis, civem, civis, civi, cive`; plural `cives, cives, cives, civium, civibus, civibus`.
- **navis, navis (f.)**: singular `navis, navis, navem, navis, navi, navi`; plural `naves, naves, naves, navium, navibus, navibus`.
- **urbs, urbis (f.)**: singular `urbs, urbs, urbem, urbis, urbi, urbe`; plural `urbes, urbes, urbes, urbium, urbibus, urbibus`.

**Variantes preservadas en fuente 0:** `civi` ablativo singular y `civis` acusativo plural de *civis*; `navim` acusativo singular, `nave` ablativo singular y `navis` acusativo plural de *navis*; `urbis` acusativo plural de *urbs*. Se opta por una forma principal en la tabla sin borrar ni declarar incorrectas las variantes. Gaffiot registra *navem* como acusativo habitual y *navi* como ablativo frecuente, pero también *navim* y *nave*.

El motor imponía un bloqueo preventivo a estos tres lemas. Eliminarlos sin cotejo produciría genitivos plurales erróneos en `-um`. Se incorporan tres matrices cerradas con genitivo completo o abreviado y validación estricta del género. *Civis* se admite en masculino o femenino; los enunciados `(m. o f.)` y `(m. y f.)` admiten ambos géneros, con masculino predeterminado para la concordancia de tablas compuestas.

Las tres nuevas entradas semánticas ofrecen `civis bonus/doctus/fidus`, `navis magna/parva/longa` y `urbs magna/parva/vicina`, en singular y plural. Inventario acumulado: **196 nombres / 561 parejas**, partiendo de 193/552 en la #212. Continúan excluidos *unus* y *nullus*.

## Cotejo y seguridad
La nueva regresión `scripts/test-latin-mf-i-stems-20261122.cjs` comprueba 36 casillas del índice fuente 0, variantes, genero, genitivos erróneos, currículo, generación de formas aisladas y concordancia en ocho contextos (web/autónoma × Latín I/4.º × ES/VA). Se incorpora a Phase I y comprobación autónoma, junto a las pruebas nominales y semánticas existentes.

Autoridades: [Gaffiot, navis](https://www.gaffiot.org/67426), [Azimonti](https://www.azimonti.com/philology/latin/resources/paradigms-nouns/), [Larousse](https://www.larousse.fr/dictionnaires/memo/Les_d%C3%A9clinaisons/73), [Montpellier 3](https://sapn.univ-montp3.fr/public/Latin/Volume%202/unit%C3%A9s/U19/co/Imparisyllabiques_et_parisyllabiques.html).

Se conserva el índice, las fuentes, puntuaciones, repertorios griegos y reglas generales de las demás declinaciones. No se genera por semejanza ninguna otra palabra.

## Sincronización autónoma
El workflow de reconstrucción aislado completó `npm run offline:build` sobre la rama y se eliminó a sí mismo después de versionar `offline.html`. La última validación deberá ejecutarse sobre el commit ordinario posterior y confirmar también `git diff --exit-code -- offline.html`.
