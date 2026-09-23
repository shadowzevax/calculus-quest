import { HelpCircle, Target, Gamepad2, Lightbulb, Clock, Zap, ListChecks } from 'lucide-react'
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog'

// Gustó el prototipo de la Misión 1 (2026-09-23) — replicado a las 14. El contenido vive aquí,
// por misión (order), en vez de ser un campo nuevo en la base de datos: más fácil de ajustar
// todo de una vez si se decide cambiar el formato más adelante.
//
// El contenido es deliberadamente conservador: nada de afirmaciones pedagógicas nuevas que no
// estén ya respaldadas en el proyecto. El tema/RAC de cada misión viene tal cual de la matriz de
// trazabilidad real (`claude-workspace/revision-final/E1-PLAN-REBALANCEO.md`), y "cómo se
// juega"/"consejo" describen la mecánica tal como está implementada en cada juego, no una
// intención aspiracional — cada una se redactó revisando el componente real de esa misión.
const MISSION_INFO = {
  1: {
    tema: 'Tema 1 — Funciones (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Cada pregunta te da una lista de opciones. Arrastra (o toca y luego toca el canasto) cada una hacia "Correcto" o "Incorrecto" según si crees que responde bien el enunciado. Cuando todas estén ubicadas, envía tus respuestas.',
    consejo: 'No hace falta ir en orden: clasifica primero las opciones de las que estés más seguro y deja las dudosas para el final.',
  },
  2: {
    tema: 'Tema 1 — Funciones (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Tienes varias cajas cerradas, una por opción. Puedes abrir hasta 2 para ver su contenido antes de decidir — las demás quedan como apuesta a ciegas. Elige la caja que creas correcta y confirma tu respuesta.',
    consejo: 'Usa tus 2 inspecciones en las opciones que más dudas te generen; las que ya puedas descartar de memoria no hace falta abrirlas.',
  },
  3: {
    tema: 'Tema 1 — Funciones (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Antes de poder responder, arma la cadena de máquinas en el orden en que se aplican las funciones — por ejemplo, en (f∘g)(x) primero actúa g y después f. Si las tocas en el orden equivocado, la cadena se atasca y te avisa.',
    consejo: 'Fíjate en cuál función va "por fuera" en la notación: esa es la que actúa de último, no la primera que se lee.',
  },
  4: {
    tema: 'Tema 2 — Límites (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Compites contra un fantasma que avanza al ritmo del cronómetro del bono de velocidad. Si te alcanza, los letreros de las opciones se desenfocan y se reordenan — puedes repintarlos para seguir viéndolos, pero pierdes el bono de esa pregunta (el XP por acertar nunca se pierde).',
    consejo: 'No te apures a costa de calcular bien: perder el bono no te cuesta el XP normal, así que prioriza acertar sobre ser el más rápido.',
  },
  5: {
    tema: 'Tema 1 — Funciones (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Un deslizador recorre las opciones de la pregunta: en cada posición ves, en tiempo real, cómo se transforma la gráfica naranja (después de la transformación) frente a la gráfica punteada de f(x) original.',
    consejo: 'Fíjate si el cambio ocurre DENTRO del paréntesis (afecta a x, mueve horizontal) o FUERA de él (afecta a y, mueve vertical) — es el error más común en este tema.',
  },
  6: {
    tema: 'Tema 2 — Límites (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Resuelves preguntas de opción múltiple y de completar espacios sobre formas indeterminadas (0/0) en el cálculo de límites, factorizando o simplificando antes de responder.',
    consejo: 'Factoriza en tu hoja de papel antes de elegir una opción — la mayoría de las formas indeterminadas de este tema se resuelven cancelando un factor común.',
  },
  7: {
    tema: 'Tema 1 — Funciones (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Respondes desde una terminal: puedes tocar los botones numerados [1]-[4] o escribir el comando real (por ejemplo "sel 2" o el valor pedido) y presionar Enter.',
    consejo: 'Si el ejercicio es de completar, escribe directamente el valor en la terminal — no hace falta usar los botones numerados.',
  },
  8: {
    tema: 'Tema 2 — Límites (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'El enunciado aparece borroso, como un expediente. Arrastra la lupa (o desliza) para revelarlo poco a poco, o toca "revelar" para verlo completo de una vez.',
    consejo: 'No hace falta revelar todo el expediente para responder — en cuanto reconozcas el tipo de discontinuidad, puedes intentar tu respuesta.',
  },
  9: {
    tema: 'Tema 3 — Definición de derivada y técnicas (RAC2: Derivadas, Unidad 2), con una pregunta del Tema 4',
    comoSeJuega: 'Cada pregunta tiene 4 globos. Debes pinchar los que consideres incorrectos — el que quede sin pinchar es tu respuesta.',
    consejo: 'Pincha primero los globos de los que estés más seguro que son incorrectos; así reduces las opciones antes de decidir el más difícil.',
  },
  10: {
    tema: 'Tema 2 — Límites (RAC1: Funciones y límites, Unidad 1)',
    comoSeJuega: 'Gira la ruleta: cada gajo es una pregunta distinta. Si aciertas, ese gajo desaparece; si fallas, se queda para que lo vuelvas a intentar en otro giro. La misión termina cuando la ruleta queda vacía.',
    consejo: 'No hay penalización por fallar un giro — puedes intentarlo cuantas veces necesites, así que no dudes en girar de nuevo si no estás seguro.',
  },
  11: {
    tema: 'Temas 5 y 6 — Máximos/mínimos con la primera derivada, y concavidad con la segunda derivada (RAC3: Optimización y análisis marginal, Unidad 3)',
    comoSeJuega: 'Cada opción tiene una gráfica oculta. Tócala para previsualizar su forma real, y cuando estés seguro, confirma tu elección con el botón "Confirmar esta forma" — puedes cambiar de opción las veces que quieras antes de confirmar.',
    consejo: 'Piensa primero en el signo de la derivada que menciona el enunciado (positiva/negativa) antes de tocar las opciones — te ayuda a descartar la mitad de entrada.',
  },
  12: {
    tema: 'Temas 3 y 4 — Técnicas de derivación y derivadas de orden superior (RAC2: Derivadas, Unidad 2)',
    comoSeJuega: 'Primero ves las 4 opciones con la respuesta correcta visible durante una cuenta regresiva. Cuando el texto desaparece, tienes que elegir de memoria la posición correcta — un solo intento, sin poder corregir.',
    consejo: 'Fíjate en la POSICIÓN de la opción correcta (arriba/abajo, izquierda/derecha), no en el texto — el texto desaparece antes de que puedas responder.',
  },
  13: {
    tema: 'Temas 3, 5 y 6 — Regla de la cadena, máximos/mínimos y concavidad (RAC2 y RAC3, Unidades 2 y 3)',
    comoSeJuega: 'La respuesta se esconde letra por letra, como en el ahorcado. Deletréala tocando el teclado en pantalla — tienes 8 errores permitidos antes de que la torre se complete.',
    consejo: 'Los símbolos fijos (paréntesis, signos) ya vienen revelados — concéntrate en las letras y números que faltan.',
  },
  14: {
    tema: 'Misión integradora — repasa temas de las tres unidades del curso',
    comoSeJuega: 'Se juega en equipo, por turnos: cada compañero responde un acertijo distinto de los 5 totales, y necesitan resolverlos todos para completar la misión. Al final hay un desafío extra de memoria (Sistema 6) que solo desempata el ranking.',
    consejo: 'Pueden crear una sala nueva o unirse con el código de un compañero — coordínense antes de empezar sobre quién la crea.',
  },
}

export default function MissionInfoButton({ mission }) {
  const info = MISSION_INFO[mission.order]
  if (!info) return null

  return (
    <Dialog>
      <DialogTrigger
        className="shrink-0 w-6 h-6 rounded-full border border-ink/15 text-ink/40 hover:border-coral hover:text-coral transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
        aria-label={`Más información sobre ${mission.title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-center gap-2 text-coral mb-1">
          <span className="text-[11px] font-mono-lab tracking-widest uppercase">Sobre esta misión</span>
        </div>
        <DialogTitle className="text-xl font-display font-bold text-ink mb-4">{mission.title}</DialogTitle>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Target className="w-5 h-5 text-blueprint shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">Qué vas a practicar</p>
              <p className="text-sm text-ink/60 mt-0.5">{mission.description}</p>
              <p className="text-xs font-mono-lab text-ink/40 mt-1">{info.tema}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Gamepad2 className="w-5 h-5 text-coral shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">Cómo se juega</p>
              <p className="text-sm text-ink/60 mt-0.5">{info.comoSeJuega}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">Consejo</p>
              <p className="text-sm text-ink/60 mt-0.5">{info.consejo}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-ink/10 text-xs font-mono-lab text-ink/50">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> ~{mission.estimated_time} min</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {mission.xp_reward} XP</span>
            <span className="flex items-center gap-1.5 capitalize"><ListChecks className="w-3.5 h-3.5" /> {mission.difficulty}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
