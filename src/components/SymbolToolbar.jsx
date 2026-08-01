// Fila de botones con símbolos matemáticos que no están en un teclado normal.
// Al hacer clic, inserta el símbolo en el input en la posición del cursor
// (no simplemente al final), usando la referencia del input.
const SYMBOLS = ['√', '∞', '≤', '≥', '≠', 'π', '×', '÷', '(', ')', '²', '³']

export default function SymbolToolbar({ inputRef, value, onChange }) {
  const insert = (symbol) => {
    const el = inputRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + symbol + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el?.focus()
      const pos = start + symbol.length
      el?.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {SYMBOLS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => insert(s)}
          className="w-8 h-8 rounded-md border border-ink/15 text-sm font-mono-lab text-ink/60 hover:border-coral hover:text-coral transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  )
}
