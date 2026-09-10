-- Encuesta de usabilidad SUS (System Usability Scale, Brooke 1986) — 10 items estandar,
-- traducidos al español sustituyendo solo el nombre del sistema ("FuncionLab"). Estas
-- preguntas ya estan validadas: no se deben reformular ni reordenar (los items impares
-- estan redactados en positivo y los pares en negativo; el calculo del puntaje 0-100 en
-- TeacherAnalytics.jsx depende de esa alternancia exacta).
INSERT INTO survey_questions ("order", text) VALUES
(1, 'Creo que me gustaría usar FuncionLab con frecuencia.'),
(2, 'Encontré FuncionLab innecesariamente complejo.'),
(3, 'Pensé que FuncionLab era fácil de usar.'),
(4, 'Creo que necesitaría el apoyo de una persona con conocimientos técnicos para poder usar FuncionLab.'),
(5, 'Encontré que las diversas funciones de FuncionLab estaban bien integradas.'),
(6, 'Pensé que había demasiada inconsistencia en FuncionLab.'),
(7, 'Me imagino que la mayoría de la gente aprendería a usar FuncionLab muy rápidamente.'),
(8, 'Encontré FuncionLab muy complicado de usar.'),
(9, 'Me sentí muy seguro usando FuncionLab.'),
(10, 'Necesitaba aprender muchas cosas antes de poder empezar a usar FuncionLab.');
