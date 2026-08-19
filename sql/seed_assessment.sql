INSERT INTO diagnostic_questions ("order", topic, question, options, correct_index) VALUES
(1, 'funciones', '¿Cuál de las siguientes relaciones es una función?', '["A cada x le corresponde más de un valor de y", "A cada x del dominio le corresponde exactamente un valor de y", "Una relación donde y no depende de x", "Un conjunto de puntos sin ninguna regla"]', 1),
(2, 'funciones', 'Para f(x) = 1/(x-2), ¿cuál es el dominio?', '["Todos los reales", "Todos los reales excepto x=2", "Todos los reales excepto x=0", "Solo x>2"]', 1),
(3, 'funciones', '¿Qué representa el rango (o recorrido) de una función?', '["El conjunto de valores posibles de x", "El conjunto de valores que puede tomar y", "La pendiente de la función", "El punto donde la función cruza el eje x"]', 1),
(4, 'operaciones_funciones', 'Si f(x) = x+3 y g(x) = 2x, ¿cuánto vale (f+g)(x)?', '["3x+3", "2x+3", "x+3", "3x"]', 0),
(5, 'operaciones_funciones', 'Si f(x) = x² y g(x) = x+1, ¿cuánto vale (f∘g)(x)?', '["x²+1", "(x+1)²", "x²+x", "2x+1"]', 1),
(6, 'transformaciones', 'La gráfica de f(x)+3, respecto a f(x), se desplaza:', '["3 unidades a la derecha", "3 unidades a la izquierda", "3 unidades hacia arriba", "3 unidades hacia abajo"]', 2),
(7, 'limites', '¿Qué significa intuitivamente el límite de f(x) cuando x tiende a un valor a?', '["El valor exacto de f(a)", "El valor al que se acerca f(x) cuando x se acerca a a", "La derivada de f en a", "El área bajo la curva hasta a"]', 1),
(8, 'limites', '¿Cuál es el resultado de una indeterminación del tipo 0/0?', '["Siempre es 0", "Siempre es infinito", "No está definido de forma inmediata, requiere más análisis", "Siempre es 1"]', 2),
(9, 'continuidad', 'Para que una función sea continua en x=a, se requiere que:', '["Solo exista f(a)", "Solo exista el límite en a", "El límite en a exista y sea igual a f(a)", "La función sea siempre positiva en a"]', 2),
(10, 'continuidad', '¿Qué tipo de función es siempre continua en todo su dominio?', '["Una función con divisiones por cero", "Un polinomio", "Una función a trozos mal definida", "Ninguna función es continua en todo su dominio"]', 1),
(11, 'derivadas', '¿Qué representa la derivada de una función en un punto?', '["El área bajo la curva", "La pendiente de la recta tangente en ese punto", "El valor máximo de la función", "El dominio de la función"]', 1),
(12, 'derivadas', 'Según la regla de la potencia, ¿cuál es la derivada de f(x) = x³?', '["x²", "3x", "3x²", "x³"]', 2);

INSERT INTO survey_questions ("order", text) VALUES
(1, 'Aprender usando FuncionLab fue más entretenido que una clase tradicional de funciones.'),
(2, 'Las misiones y recompensas (XP, niveles, insignias) me motivaron a seguir practicando.'),
(3, 'La plataforma fue fácil de usar y de navegar.'),
(4, 'Siento que entendí mejor los temas de funciones gracias a la plataforma.'),
(5, 'Me gustaría que otras materias usaran una plataforma gamificada similar.'),
(6, 'El ranking y la posibilidad de personalizar mi avatar aumentaron mi interés por completar misiones.'),
(7, 'Recomendaría FuncionLab a otro estudiante que esté aprendiendo funciones.');
