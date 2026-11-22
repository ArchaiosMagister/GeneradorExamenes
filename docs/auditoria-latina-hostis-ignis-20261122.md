# Auditoría morfológica: hostis e ignis (22/11/2026)

## Alcance
Se trabaja sobre la PR #213 después de superar cinco de cinco regresiones, sin fusionar ni publicar. La nueva PR es dependiente de #213. Las formas proceden de los registros de fuente histórica **0** en `data/lemmas/teacher-forms.json`; no se modifica el índice, ni se asciende ningún registro a fuente 5.

## Diagnóstico
*Hostis* figuraba como una excepción singular en la generación de sintagmas aprobados de Latín I (*hostis Romanus*), pero seguía excluido de `mNoun`, limitando la práctica general. *Ignis* también estaba bloqueado pese a sus catorce filas históricas, incluidas las variantes `igni/igne`. Para ambos, quitar solamente la exclusión generaría genitivos plurales *hostum, ignum*, erróneos.

## Casillas seleccionadas
Orden: nominativo, vocativo, acusativo, genitivo, dativo, ablativo.

| Número | hostis | ignis |
| --- | --- | --- |
| Singular | hostis, hostis, hostem, hostis, hosti, hoste | ignis, ignis, ignem, ignis, igni, igni |
| Plural | hostes, hostes, hostes, hostium, hostibus, hostibus | ignes, ignes, ignes, ignium, ignibus, ignibus |

El índice conserva `hostīs` (acusativo plural); `ignīs` (acusativo plural) y `igne` (ablativo singular). Se prefiere `ignī` como ablativo singular en la tabla por su frecuencia clásica, sin negar la variante `igne`.

Fuentes: [Gaffiot, *hostis*](https://www.gaffiot.org/55298); [Lewis & Short, *ignis*](https://alatius.com/ls/index.php?l=ignis); [Logeion, *ignis*](https://logeion.org/ignis); datos históricos de la aplicación.

## Alcance técnico
Se incorporan únicamente dos lemas al mapa de paradigmas cerrados ya existente. Se preserva el sintagma ratificado *hostis Romanus* y se autorizan además *hostis strenuus/improbus/perterritus* e *ignis magnus/parvus*. Inventario acumulado de parejas semánticas: **198 sustantivos / 566 parejas**, frente a 196/561.

La prueba `scripts/test-latin-hostis-ignis-20261122.cjs` coteja **24 casillas** y variantes del índice y, con Playwright, valida web/autónoma, Latín I/4.º, castellano/valenciano, generación de sintagmas, bloqueo curricular y rechazo de géneros y genitivos falsos. La comprobación autónoma ejecuta antes su modo sin navegador; Phase I ejecuta el cotejo completo.

No se modifican los demás temas en -i, los bancos griegos, la puntuación o la lematización histórica. No publicar sin consentimiento y CI satisfactoria en el último commit.
