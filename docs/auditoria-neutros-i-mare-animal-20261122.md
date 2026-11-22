# Auditoría morfológica: neutros latinos de tema en -i (22/11/2026)

## Alcance

La revisión prioriza **paradigmas y concordancias evaluables**, no las cantidades vocálicas. El diccionario Gaffiot (<https://gaffiot.fr/>) y Collatinus son referencias prioritarias para los lemas; las **doce formas concretas** de estos dos paradigmas se han cotejado además con [Azimonti, *Latin Noun Paradigms*](https://www.azimonti.com/philology/latin/resources/paradigms-nouns/), [National Archives, *Nouns*](https://www.nationalarchives.gov.uk/latin/stage-1-latin/resources/stage-1-latin-grammar-resource/nouns/) y [manual de la Universidad Paul-Valéry Montpellier 3](https://sapn.univ-montp3.fr/public/Latin/Volume%202/unit%C3%A9s/U19/co/Imparisyllabiques_et_parisyllabiques.html).

Esta PR es **dependiente de la #211**: parte de su rama para no alterar ni reiniciar esa auditoría mientras se valida. El diff se compara exclusivamente con `fix/latin-paradigm-vir-20261122`; ninguna PR se publica automáticamente.

## Hallazgo morfológico

El motor `mNoun` descartaba los neutros terminados en `-e`, `-al` o `-ar`, para no producir erróneamente un paradigma consonántico (`mara`, `marum`, etc.). El bloqueo era prudente, pero dejaba sin tablas dos nombres del vocabulario escolar con **paradigmas explícitos bien documentados**:

- **`mare, maris`**: Latín I y Latín 4.º. En este último el enunciado es abreviado (`mare, –is`). En el índice de la aplicación únicamente había una entrada léxica (`LEX;ENTRY`, fuente 3), no doce flexiones individualmente acreditadas.
- **`animal, animalis`**: Latín I. El enunciado `animal, –alis` usa fragmento de genitivo. El índice ya conserva doce testimonios de fuente 0 que confirman la matriz indicada abajo; no se recalifican como fuente 5.

## Paradigmas admitidos

Orden de casillas interno: nominativo, vocativo, acusativo, genitivo, dativo, ablativo.

| Caso | mare sg. | mare pl. | animal sg. | animal pl. |
| --- | --- | --- | --- | --- |
| Nominativo | mare | maria | animal | animalia |
| Vocativo | mare | maria | animal | animalia |
| Acusativo | mare | maria | animal | animalia |
| Genitivo | maris | marium | animalis | animalium |
| Dativo | mari | maribus | animali | animalibus |
| Ablativo | mari | maribus | animali | animalibus |

En `mare` se selecciona **`marī` como ablativo singular escolar**, aunque `mare` también está documentado como alternativa. No se elimina esa variante de otros materiales ni se cambia el análisis en contexto.

Las formas de ambos lemas están codificadas como **matrices cerradas** con lectura permitida del genitivo completo o abreviado y género neutro obligatorio. La clase se mantiene `3n` para respetar los umbrales curriculares actuales de tercera declinación. No se habilita por similitud `rete` u otro nombre terminado en `-e`, `-al` o `-ar`.

## Sintagmas y seguridad

Combinaciones semánticas autorizadas: `mare magnum / altum / serenum` y `animal magnum / parvum / formosum`. Sus adjetivos figuran ya en los bancos docentes, no se añaden lemas nuevos. Se comprueba la concordancia en las doce posiciones de singular y plural.

El repertorio **acumulado de la rama apilada** queda en 193 sustantivos con pares naturales y 552 parejas; sobre la #211, esta PR añade exactamente **dos nombres y seis parejas**, manteniendo la prohibición de `unus` y `nullus`.

La regresión `scripts/test-latin-neuter-i-stems-20261122.cjs` valida 24 casillas nominales, ocho contextos (web/autónoma × Latín I/4.º × español/valenciano), vocabulario de entrada, progresión por UD, concordancia, formas no admitidas y no promoción del índice. Se incorpora a las CI de Phase I y versión autónoma.

**No se modifica** `data/lemmas/teacher-forms.json`, `verified-overrides.json`, el banco griego ni la lógica de corrección. Nada se fusiona ni publica sin consentimiento docente y CI satisfactoria en el último commit.
