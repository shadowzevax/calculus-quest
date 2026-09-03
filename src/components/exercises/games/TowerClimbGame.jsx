import { useEffect, useState } from 'react'
import { Skull } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, Prompt } from './GameBits'

const MAX_WRONG = 6
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('')

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')
function stripAccents(s) {
  return String(s).normalize('NFD').replace(DIACRITICS, '').toUpperCase()
}

// Misión 13 — Ahorcado: la respuesta correcta se esconde letra por letra; cada letra
// equivocada dibuja una parte de la figura, hasta MAX_WRONG errores (pierde) o hasta
// completar la palabra (gana).
export default function TowerClimbGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-ink/70">
          <Skull className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Adivina emparejando cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const target = items.kind === 'choice' ? String(current.options[current.correctIndex]) : String(current.answer || '')

  return (
    <HangmanBody
      key={index}
      target={target}
      current={current}
      index={index}
      total={total}
      feedback={feedback}
      onWin={() => (items.kind === 'choice' ? checkChoice(current.correctIndex) : checkText(target))}
      onLose={() => (items.kind === 'choice' ? checkChoice(-1) : checkText('__ahorcado_perdio__'))}
      onNext={next}
    />
  )
}

function HangmanFigure({ wrong }) {
  const parts = [
    <circle key="head" cx="60" cy="35" r="9" stroke="#1B3A5C" strokeWidth="2.5" fill="none" />,
    <line key="body" x1="60" y1="44" x2="60" y2="72" stroke="#1B3A5C" strokeWidth="2.5" />,
    <line key="armL" x1="60" y1="52" x2="46" y2="65" stroke="#1B3A5C" strokeWidth="2.5" />,
    <line key="armR" x1="60" y1="52" x2="74" y2="65" stroke="#1B3A5C" strokeWidth="2.5" />,
    <line key="legL" x1="60" y1="72" x2="48" y2="90" stroke="#1B3A5C" strokeWidth="2.5" />,
    <line key="legR" x1="60" y1="72" x2="72" y2="90" stroke="#1B3A5C" strokeWidth="2.5" />,
  ]
  return (
    <svg viewBox="0 0 120 100" className="w-32 h-28 mx-auto">
      <line x1="10" y1="95" x2="90" y2="95" stroke="#1B3A5C" strokeWidth="3" />
      <line x1="30" y1="95" x2="30" y2="8" stroke="#1B3A5C" strokeWidth="3" />
      <line x1="30" y1="8" x2="60" y2="8" stroke="#1B3A5C" strokeWidth="3" />
      <line x1="60" y1="8" x2="60" y2="26" stroke="#1B3A5C" strokeWidth="2" />
      {parts.slice(0, wrong)}
    </svg>
  )
}

function HangmanBody({ target, current, index, total, feedback, onWin, onLose, onNext }) {
  const [guessed, setGuessed] = useState([])
  const [done, setDone] = useState(false)

  const normTarget = stripAccents(target)
  const letterPositions = normTarget.split('').map((ch) => /[A-ZÑ]/.test(ch))
  const wrong = guessed.filter((l) => !normTarget.includes(l))
  const wrongCount = wrong.length
  const solved = letterPositions.every((isLetter, i) => !isLetter || guessed.includes(normTarget[i]))

  useEffect(() => {
    if (done) return
    if (solved) { setDone(true); onWin() }
    else if (wrongCount >= MAX_WRONG) { setDone(true); onLose() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, wrongCount])

  const guess = (letter) => {
    if (feedback || guessed.includes(letter) || wrongCount >= MAX_WRONG) return
    setGuessed((g) => [...g, letter])
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="PALABRA" />
      <Prompt text={current.prompt} />

      <HangmanFigure wrong={Math.min(wrongCount, MAX_WRONG)} />
      <p className="text-center text-xs font-mono-lab text-ink/40 mb-4">Errores: {wrongCount} / {MAX_WRONG}</p>

      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {target.split('').map((ch, i) => {
          const isLetter = letterPositions[i]
          const revealed = !isLetter || guessed.includes(normTarget[i]) || !!feedback
          return (
            <span
              key={i}
              className={`min-w-[1.4rem] text-center text-lg font-mono-lab font-semibold pb-1 ${isLetter ? 'border-b-2 border-ink/40' : ''}`}
            >
              {revealed ? ch : ' '}
            </span>
          )
        })}
      </div>

      {!feedback && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {ALPHABET.map((letter) => {
            const used = guessed.includes(letter)
            const wasWrong = used && !normTarget.includes(letter)
            return (
              <button
                key={letter}
                onClick={() => guess(letter)}
                disabled={used || wrongCount >= MAX_WRONG}
                className={`w-8 h-8 rounded-md border text-xs font-mono-lab font-semibold transition-colors ${
                  used
                    ? wasWrong ? 'bg-red-100 border-red-300 text-red-400' : 'bg-teal/10 border-teal/30 text-teal'
                    : 'border-ink/15 hover:bg-ink/5 text-ink/70'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={onNext} />
    </div>
  )
}
