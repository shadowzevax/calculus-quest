// La base guarda la dificultad sin tilde (facil, dificil) porque es un identificador.
// En pantalla se muestra con tilde; con `uppercase` de CSS queda FÁCIL y DIFÍCIL.
const LABELS = {
  facil: 'Fácil',
  intermedio: 'Intermedio',
  dificil: 'Difícil',
  experto: 'Experto',
}

export function difficultyLabel(value) {
  return LABELS[value] || value
}
