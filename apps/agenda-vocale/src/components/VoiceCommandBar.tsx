import { useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { parseVoiceCommand } from '../utils/voiceCommandParser'
import { createEmptyItem, type AgendaItem, type AppSettings } from '../types'
import { unlockAudio } from '../utils/audioAlerts'

interface Props {
  settings: AppSettings
  onDraftReady: (draft: AgendaItem, rawTranscript: string) => void
}

export function VoiceCommandBar({ settings, onDraftReady }: Props) {
  const { supported, listening, transcript, interimTranscript, error, start, stop } = useSpeechRecognition('it-IT')

  useEffect(() => {
    if (!listening && transcript.trim().length > 0) {
      const parsed = parseVoiceCommand(transcript)
      const draft = createEmptyItem({
        type: parsed.type,
        title: parsed.title,
        date: parsed.date,
        time: parsed.time,
        alarmEnabled: parsed.alarmEnabled,
        alarmSound: parsed.alarmSound ?? settings.defaultAlarmSound,
        alarmMinutesBefore: parsed.alarmMinutesBefore ?? settings.defaultAlarmMinutesBefore
      })
      onDraftReady(draft, parsed.rawTranscript)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening])

  if (!supported) {
    return (
      <div className="voice-bar unsupported">
        <p className="hint">
          Il riconoscimento vocale non e’ supportato in questo browser. Prova con Chrome o Edge su desktop o
          Android.
        </p>
      </div>
    )
  }

  return (
    <div className="voice-bar">
      <button
        type="button"
        className={listening ? 'mic-btn listening' : 'mic-btn'}
        onClick={() => {
          unlockAudio()
          listening ? stop() : start()
        }}
        aria-label={listening ? 'Ferma registrazione comando vocale' : 'Avvia comando vocale'}
      >
        {listening ? '⏹️' : '🎙️'}
      </button>
      <div className="voice-bar-text">
        {listening ? (
          <p className="voice-live-transcript">
            In ascolto… <em>{interimTranscript || 'dì un appuntamento o una nota'}</em>
          </p>
        ) : (
          <p className="hint">
            Tocca il microfono e di’ ad es. <em>“Appuntamento dal dentista domani alle 15 con avviso sonoro”</em>
          </p>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
}
