import { useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { createEmptyExpense, type Expense } from '../types'
import { parseVoiceExpense } from '../utils/voiceExpenseParser'
import { classifyCategory } from '../utils/categoryClassifier'

interface Props {
  onDraftReady: (draft: Expense, rawTranscript: string) => void
}

export function VoiceExpenseBar({ onDraftReady }: Props) {
  const { supported, listening, transcript, interimTranscript, error, start, stop, reset } = useSpeechRecognition('it-IT')

  useEffect(() => {
    if (!listening && transcript) {
      const { amount, description } = parseVoiceExpense(transcript)
      const draft = createEmptyExpense({
        amount: amount ?? 0,
        description,
        category: classifyCategory(description),
        source: 'voice'
      })
      onDraftReady(draft, transcript)
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, transcript])

  if (!supported) {
    return (
      <div className="voice-bar unsupported">
        <p className="hint">
          Il riconoscimento vocale non è supportato in questo browser: usa il pulsante “+” per aggiungere una spesa.
        </p>
      </div>
    )
  }

  return (
    <div className="voice-bar">
      <button
        type="button"
        className={listening ? 'mic-btn listening' : 'mic-btn'}
        onClick={listening ? stop : start}
        aria-label={listening ? 'Interrompi registrazione' : 'Annota una spesa a voce'}
      >
        🎙️
      </button>
      <div className="voice-bar-text">
        {listening ? (
          <p className="voice-live-transcript">{interimTranscript || 'Ti ascolto… es. “12 euro spesa al supermercato”'}</p>
        ) : (
          <p className="hint">Tocca il microfono e annuncia una spesa, es. “15 euro benzina”.</p>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
}
