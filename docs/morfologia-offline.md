# Morfología fija y cobertura offline

Estado: menús implementados; cobertura lingüística parcial y explícita. No se declara validado todo el vocabulario.

| Lengua | Lemas distintos del adjunto | Lemas con formas | Análisis empaquetados | Formas admitidas por currículo | Superficies ambiguas |
| --- | ---: | ---: | ---: | ---: | ---: |
| Latín | 665 | 649 | 59156 | 54082 | 9696 |
| Griego | 397 | 120 | 1950 | 657 | 341 |

## Comportamiento

- Exactamente tres preguntas, independientemente de los antiguos selectores de bloques. P1: opciones y respuestas, limitadas a respuestas ≤ opciones; se generan tantas tablas como respuestas. P2: cantidad de formas verbales. P3: cantidad y categorías de palabras.
- Sustantivos y verbos; adjetivos desde UD2 latina / UD5 griega; pronombres desde UD3 latina / UD7 griega; participios desde UD10 en ambas lenguas. Las restricciones del paradigma pueden retrasar más una forma concreta.
- Adverbios, conjunciones y categorías no reconocidas quedan fuera de las preguntas. No se añade vocabulario final. El acumulado hasta la última unidad es obligatorio en morfología.
- Nombres propios identificados por mayúscula Unicode y lista explícita: nunca plural en ejercicios. Se excluyen de P1 porque su tabla exige singular y plural.
- La posible cuarta pregunta griega queda anunciada desde UD7 como pendiente del modelo. No hay enunciado ni pregunta añadida.
- Las cantidades insuficientes se anuncian; no se duplican formas para llenar huecos. Se agrupan lecturas de una misma forma y lema; se conservan los análisis admitidos por unidad en el solucionario.
- El paquete local carga directamente `lexicon.js`, también al abrir con file://; no exige primera conexión, importación ni caché. La preparación de Tauri copia datos y atribuciones a web/data.

## Límites y ambigüedades que requieren revisión

- Eulexis: `eulexis-web/eulexis.php` requiere archivos de análisis que no están en el repositorio. La documentación francesa de Biblissima indica que esos datos se solicitan a sus responsables. La integración completa griega está pendiente de disponer de esos datos; no se ha enviado ninguna solicitud.
- LEMLAT3 se usa para atestación de lemas, no se ha ejecutado el analizador sobre cada forma. Collatinus se interpreta mediante un adaptador de sus paradigmas declarativos, no mediante el motor Qt completo; quedan excluidos referencias y modelos sufd.
- El adjunto no enumera los pronombres por lema en los bloques de vocabulario. Las categorías se habilitan por temario, pero actualmente no hay formas pronominales adjuntas admitidas: no se añaden lemas externos para rellenarlas.
- Griego: vocabulario UDs1–4 y UDs6–7 en bloques, sin reparto individual. Se habilitan al terminar el bloque (UD4/UD7), conservando el criterio anterior. Es necesaria una asignación docente más precisa para examinarlos antes.
- El encabezado UDs6–7 aparece pegado a la última entrada de UD5; el importador separa ambos sin asignar el bloque siguiente a UD5. UD10 está duplicada en el adjunto; se retienen ocurrencias y se deduplican formas.
- El vocabulario general griego sin unidad se ofrece solo para consulta. Latín tiene vocabulario UD11–12, pero el temario entregado termina en UD10: no se inventa gramática nueva.
- Ἀθῆναι aparece como nombre de plural obligatorio. Se excluye de los ejercicios, sin fabricar singular. Las mayúsculas de gentilicios pueden excluir conservadoramente sus plurales.
- Normalizar acentos, cantidades, ligaduras, i/j y u/v puede unir lemas homógrafos. El banco conserva todas las lecturas; no resuelve el contexto. La pertenencia léxica es coincidencia normalizada, no validación lingüística independiente.
- Las formas griegas de UniMorph pueden incluir artículo. Se conservan como figuran en la fuente; se necesitan más paradigmas y revisión del profesorado para cobertura completa.
- El solucionario de P1 latino conserva la advertencia de revisión manual del paradigma/concordancia; no se declara resuelto automáticamente.

## Reproducción

Los clones de entrada deben estar en las revisiones fijadas por `data/teacher/coverage.json`:

```sh
python3 scripts/build_teacher_lexicon.py --lat /ruta/unimorph-lat --grc /ruta/unimorph-grc --lemlat /ruta/LEMLAT3 --collatinus /ruta/collatinus --biblissima /ruta/outils.biblissima.fr
python3 -m unittest discover -s tests -p "test_*.py"
node scripts/check-web.mjs
node scripts/prepare-desktop.mjs
node scripts/test-morphology.cjs
```

Para el navegador de pruebas se requiere Playwright y Chromium; opcionalmente `PLAYWRIGHT_PATH` y `BROWSER_PATH`. CI instala ambos. Las pruebas Python no necesitan red ni los clones.

## Verificación realizada

- 14 pruebas Python: parser, clasificación, pertenencia al adjunto, plurales propios, participios, paradigmas de referencia, ambigüedades y coherencia del paquete.
- Navegador Chromium/Brave: ambos idiomas, UDs1/4/7/8/10 y UD14 griega, tres configuraciones de cantidades, recuentos reales, desactivación por unidad, categorías vacías, tres preguntas y consulta ambigua local.
- Paquete web/index.html probado con las peticiones de red bloqueadas; descarga Word de examen y soluciones comprobada para ambos idiomas.
- Comprobación sintáctica de JavaScript y preparación de paquete Tauri completadas. No se ha compilado el binario Rust: cargo no está instalado en este entorno.
- El antiguo script test-greek-ui.cjs contiene expectativas anteriores incompatibles con el modelo fijo (3,5 puntos y greekLastExam); no se presenta como superado. La nueva suite prueba el contrato vigente.

## Lemas sin formas: lat

Atalanta, Atuatuci, bona, Callus, cœpi, commito, expulso, fœdero, libentissime, Marathonius, milia, nivis, respondo, solis, Tarentus, tenerus

## Modelos omitidos por el adaptador: lat

(ninguno)

## Lemas sin formas: grc

ἀγαθός, ἄγαλμα, Ἀγαμέμνων, ἀγαπάω, ἀγγέλλω, ἄγω, ἀδελφός, ἀδικέω, ἀδικός, ἀδίκως, ἀεί, ἀθάνατος, Ἀθηνᾶ, Ἀθῆναι, Ἀθηναῖος, Αἰγίνα, αἰσχρός, αἰτέω, ἀκούω, Ἀκροπόλις, Ἀλκιβιάδης, ἀλλά, ἄλλος, ἀμφί, ἀνά, ἀναγιγνώσκω, ἀνακράζω, ἄνευ, ἀνήρ, ἀντί, ἀπό, ἀποθνῄσκω, ἀποκτείνω, ἀποπλέω, ἆρα, ἁρπάζω, ἄρχω, ἄρχων, ἀσκέπτως, ἀσκέω, Ἀττική, αὐλέω, αὐτόνομος, ἀφικνέομαι, Ἀχαῖος, βάλλω, βάρβαρος, βασιλείος, βασιλεύς, βασιλεύω, βούλομαι, γάρ, γένος, γίγνομαι, γιγνώσκω, γράφω, Δαρεῖος, δεῖ, δεῖπνος, Δημοσθήνης, διά, διάγω, διαφέρω, διαφθείρω, διδάσκω, δίκαιος, διώκω, δοκέω, δουλεύω, δοῦλος, δύναμαι, δώδεκα, ἐθέλω, εἰμί, εἰς, εἰσβάλλω, εἰσφέρω, ἐκ/ἐξ, ἐκκλεσία, Ἕλλας, Ἕλλην, ἐν, ἔνδοξος, ἐπεί, ἐπί, ἐπιθυμέω, ἐπιμελέομαι, ἔρχομαι, ἐρωτάω, ἔτι, εὖ, εὐδαιμονέω, εὐδαιμονία, εὑρίσκω, Εὐρώπη, εὐφραίνω, ἐχθρός, ἔχω, ζάω, Ζεὺς, ζητέω, ἤ, ἡγέομαι, ἥκω, ἥλιος, ἡμέρα, ἡμετέρος, θάλαττα, θάνατος, θαυμάζω, θέα, θέος, θεραπεύω, Θηβαῖος, θνητός, θύω, ἱδρύω, ἱερεύς, Ἴκαρος, Ἴλιον, ἱππεύς, καί, κακός, καλέω, καλός, κατά, καταλείπω, καταφρονέω, κατέχω, κελεύω, κηρός, κιθαρίζω, κιθαριστής, κοινός, κομίζω, Κρήτη, κυβερνάω, κύριος, λαμβάνω, λέγω, λείπω, Λύσανδρος, μαθητής, μᾶλα, μάλιστα, μᾶλλον, μανθάνω, Μαραθών, μάχομαι, Μέγαρα, μέγας, Μενέλαος, μένω, μέν…, μετά, μετέχω, μή, μήν, μίκρος, μόνον, μόνος, μῦθος, ναῦς, νεκρóς, νέος, νικάω, νομίζω, νῦν, ξένος, ξύλον, ὄγκος, ὁδός, οἰκέω, ὀλιγός, ὅλος, Ὅμηρος, ὁράω, ὀργίλος, ὁρμάομαι, οὐ, οὐδέ, οὐδεῖς, οὖν, οὔποτε, οὔτε…, οὕτω, Πανταλέων, παρά, παραλαμβάνω, παρέχω, πᾶς, πάσχω, πεδίον, πείθω, πέλαγος, πένης, πενία, περί, Περικλῆς, Περσαί, πιστεύω, πλέω, πλουτέω, πλοῦτος, ποῖ, ποιέω, πολεμίος, πόλεμος, πόλις, πολιτικός, πολλάκις, πολύς, πονηρός, ποῦ, πράττω, πρό, πρός, προσβάλλω, προσέρχομαι, Προταγόρας, πρόϐατον, πρῶτον, πρῶτος, Πυθαγορείος, πῶς, ῥίπτω, σάρξ, σκοπέω, Σόλων, σοφία, σοφός, Σπάρτη, στέργω, στράτευμα, στρατεύω, στρατόπεδον, σύν, σῴζω, Σωκράτης, ταχέως, τείχος, τελευτάω, τέμνω, τέρπω, τήκω, τιμάω, τόπος, τότε, τρέχω, τριήρες, τυραννίς, τύραννος, τύχη, ὑιός, ὐπέρ, ὐπό, φαίνω, φέρω, φεύγω, φθείρω, φιλέω, Φίλιππος, φίλος, φιλόσοφος, φοβέω, φονεύω, φρονέω, φρόνησις, φρόνιμος, φυλάσσω, φύσις, φύω, χρή, χρόνος, χρύσος, ψυχή, ὤνιος

## Modelos omitidos por el adaptador: grc

(ninguno)
