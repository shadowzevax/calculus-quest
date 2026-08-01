// Convierte texto plano de los ejercicios (ej. "x^2", "raiz(x-3)", "(x^2-4)/(x-2)")
// en notación matemática real usando KaTeX, sin tocar el resto de la frase en español.
// Solo se convierten las "islas" de matemáticas reconocidas (exponentes, raíces,
// fracciones entre paréntesis); todo lo demás queda como texto normal.
import katex from 'katex'

// Aplica sustituciones simples de texto a LaTeX dentro de un fragmento matemático
// (usado tanto en el texto general como dentro de raíces/fracciones).
function toLatex(fragment) {
  return fragment
    .replace(/\^(\(-?\d+\)|-?\d+)/g, (_, exp) => `^{${exp.replace(/[()]/g, '')}}`)
    .replace(/infinito/gi, '\\infty')
    .replace(/>=/g, '\\geq')
    .replace(/<=/g, '\\leq')
    .replace(/!=/g, '\\neq')
}

// Busca la próxima "isla" matemática (fracción, raíz o exponente) desde `from`.
// Devuelve { start, end, latex } o null si no hay más.
function nextIsland(text, from) {
  const rest = text.slice(from)

  const frac = rest.match(/\(([^()]+)\)\/\(([^()]+)\)/)
  const sqrt = rest.match(/(?:raiz|√)\(([^()]+)\)/i)
  const exp = rest.match(/[A-Za-z0-9)\]]\^(\(-?\d+\)|-?\d+)/)

  const candidates = [
    frac && { index: frac.index, len: frac[0].length, latex: `\\dfrac{${toLatex(frac[1])}}{${toLatex(frac[2])}}` },
    sqrt && { index: sqrt.index, len: sqrt[0].length, latex: `\\sqrt{${toLatex(sqrt[1])}}` },
    exp && { index: exp.index, len: exp[0].length, latex: exp[0][0] + toLatex(exp[0].slice(1)) },
  ].filter(Boolean)

  if (candidates.length === 0) return null
  const best = candidates.reduce((a, b) => (a.index <= b.index ? a : b))
  return { start: from + best.index, end: from + best.index + best.len, latex: best.latex }
}

function renderInline(latex) {
  try {
    return katex.renderToString(latex, { throwOnError: false, output: 'html' })
  } catch {
    return latex
  }
}

// Componente: recibe un string con notación tipo "x^2" y lo muestra con
// superíndices, raíces y fracciones reales donde las reconoce.
export default function MathText({ text, className = '' }) {
  if (!text) return null
  const parts = []
  let cursor = 0
  let guard = 0

  while (guard++ < 50) {
    const island = nextIsland(text, cursor)
    if (!island) break
    if (island.start > cursor) parts.push(text.slice(cursor, island.start))
    parts.push(
      <span
        key={parts.length}
        dangerouslySetInnerHTML={{ __html: renderInline(island.latex) }}
      />
    )
    cursor = island.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))

  return <span className={className}>{parts}</span>
}
