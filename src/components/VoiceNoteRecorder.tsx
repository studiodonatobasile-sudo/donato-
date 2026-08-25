import { useEffect, useState } from 'react'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { getVoiceNoteBlob } from '../db'
import { formatDuration } from '../utils/dateUtils'

interface Props {
  existingVoiceNoteId: string | null
  existingDuration: number | null
  /** Chiamato quando la nota vocale cambia: blob nuovo, null se rimossa, undefined se invariata. */
  onChange: (blob: Blob | null | undefined, duration: number | null) => void
}

export function VoiceNoteRecorder({ existingVoiceNoteId, existingDuration, onChange }: Props) {
  const recorder = useVoiceRecorder()
  const [existingUrl, setExistingUrl] = useState<string | null>(null)
  const [removedExisting, setRemovedExisting] = useState(false)

  useEffect(() => {
    let revoke: string | null = null
    if (existingVoiceNoteId && !recorder.audioBlob) {
      getVoiceNoteBlob(existingVoiceNoteId).then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          revoke = url
          setExistingUrl(url)
        }
      })
    }
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingVoiceNoteId])

  useEffect(() => {
    if (recorder.audioBlob) {
      onChange(recorder.audioBlob, recorder.seconds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.audioBlob])

  const hasExisting = !!existingVoiceNoteId && !removedExisting && !recorder.audioBlob
  const hasNew = !!recorder.audioBlob

  return (
    <div className="field">
      <label>Nota vocale</label>
      {!recorder.supported && <p className="hint">Registrazione audio non supportata da questo browser.</p>}
      {recorder.error && <p className="error-text">{recorder.error}</p>}

      {hasExisting && existingUrl && (
        <div className="voice-note-row">
          <audio controls src={existingUrl} />
          <span className="hint">{existingDuration ? formatDuration(existingDuration) : ''}</span>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => {
              setRemovedExisting(true)
              onChange(null, null)
            }}
          >
            ✕
          </button>
        </div>
      )}

      {hasNew && recorder.audioUrl && (
        <div className="voice-note-row">
          <audio controls src={recorder.audioUrl} />
          <span className="hint">{formatDuration(recorder.seconds)}</span>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => {
              recorder.reset()
              onChange(existingVoiceNoteId ? undefined : null, null)
            }}
          >
            ✕
          </button>
        </div>
      )}

      {!hasNew && recorder.supported && (
        <div className="voice-note-controls">
          {!recorder.recording ? (
            <button type="button" className="btn secondary" onClick={recorder.start}>
              🎙️ {hasExisting ? 'Sostituisci registrazione' : 'Registra nota vocale'}
            </button>
          ) : (
            <button type="button" className="btn danger" onClick={recorder.stop}>
              ⏺️ Sto registrando… {formatDuration(recorder.seconds)} (tocca per fermare)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
