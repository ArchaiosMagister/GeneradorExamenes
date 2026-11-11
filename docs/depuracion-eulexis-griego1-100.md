# Depuración conservadora de discrepancias Eulexis — Griego I

**Revisión:** 11 de noviembre de 2026. **Fuente:** `genuensis/lector-griego` (revisión Eulexis fijada en la PWA; extracción temporal en CI, sin redistribución del corpus).

## Alcance y resultado reproducible

Con el extracto griego filtrado por curso y formas válidas (29518 lecturas), la auditoría determinó **6950 tarjetas antes** y **6619 después** de agrupar análisis gramaticales idénticos que únicamente se distinguen por etiquetas dialectales: **331 falsas discrepancias resueltas**. La prueba comprueba en cada ejecución que se resuelven al menos 100.

Esta depuración afecta exclusivamente al **menú de revisión**, no modifica los modelos de examen, ni añade flexiones al banco, ni certifica una interpretación. Si una forma tiene análisis diferentes de caso, número, género, persona, tiempo, modo o voz, la tarjeta permanece. Si una forma tiene una única propuesta Eulexis sin contraste docente, su ficha se conserva para revisión aunque dos registros fueran regionales.

En tarjetas con ambigüedades reales, los dialectos del mismo análisis se muestran agrupados y los testimonios originales se conservan; las decisiones previas por navegador siguen admitiendo sus identificadores antiguos.

## 100 ejemplos concretos de tarjetas retiradas por redundancia dialectal

1. ἀδίκησα
2. ἀποκτιννύωμεν
3. ἀποκτιννύωσιν
4. ἀποπλέεις
5. ἀποπλεῖς
6. ἀποπλέοι
7. ἀποπλέοιεν
8. ἀποπλέοντας
9. ἀποπλέοντες
10. ἀποπλέοντος
11. ἀποπλέουσα
12. ἀποπλέουσαν
13. ἀποπλεούσης
14. ἀποπλευσοῦμαι
15. ἀποπλευσούμεθα
16. ἀποπλευσούμενος
17. ἀποπλευσοῦνται
18. ἀποπλέων
19. ἁρπάγη
20. ἁρπάγης
21. ἅρπαξε
22. ἅρπαξεν
23. ἁρπαξούσῃ
24. ἅρπασα
25. ἅρπασε
26. ἅρπασεν
27. αὔλησε
28. αὔλησεν
29. ἀφικέσθην
30. ἀφίκετο
31. ἀφικνέεται
32. ἀφικνέετο
33. ἀφικνεῖ
34. ἀφικνεῖται
35. ἀφικνεῦνται
36. ἀφικνοῦμαι
37. ἀφικνούμην
38. ἀφικνοῦνται
39. ἀφικνοῦντο
40. ἀφικόμεθα
41. ἀφικόμεσθα
42. ἀφικόμην
43. ἀφίκοντο
44. βάληις
45. βάλῃσθα
46. βάλῃσι
47. βάλῃσιν
48. βάλητε
49. βάλωμεν
50. βάλωσι
51. βάλωσιν
52. βασιλεῖ
53. ἔβαλε
54. ἔβαλεν
55. εἰκόσι
56. εἰκόσιν
57. εἰσβάλητε
58. εἰσβάλωμεν
59. εἰσβάλωσι
60. εἰσβάλωσιν
61. εἰσέβαλε
62. εἰσέβαλεν
63. ἐνίκη
64. ἐνίκης
65. ἐσβάλωμεν
66. ἐσβάλωσι
67. ἐσβάλωσιν
68. ἐσέβαλε
69. ἐσέβαλεν
70. εὖ
71. εὑράμεθα
72. εὕραμεν
73. εὑράμην
74. εὕραντο
75. εὕρατο
76. εὗρες
77. εὑρέτην
78. εὕρετο
79. εὑρησεῖς
80. εὕρισκεν
81. εὕρισκες
82. εὑρίσκετο
83. εὑρισκόμην
84. εὑρίσκοντο
85. εὑρόμην
86. εὕροντο
87. εὔφραινεν
88. εὔφραινες
89. εὐφραίνετο
90. εὐφραινόμην
91. εὐφραίνοντο
92. εὐφράνθη
93. εὐφράνθημεν
94. εὐφράνθης
95. εὐφράνθησαν
96. εὐφρήνῃς
97. ἱδρύετο
98. ἱδρύθη
99. ἱδρύθησαν
100. ἱδρύνθη

## Reproducción y control

Durante la PR, el workflow `offline-check.yml` ejecuta `scripts/export-eulexis-review.mjs` únicamente en el runner, luego `node scripts/audit-greek-eulexis-queue.mjs`, y finalmente elimina el corpus privado. Se comparan ambas colas con el mismo origen: `buildCases(...,{mergeDialects:false})` y `buildCases(...)`. Las pruebas de `scripts/test-greek-review.mjs` exigen que se conserven las ambigüedades gramaticales reales y que no se eleven a verificadas las propuestas Eulexis.
