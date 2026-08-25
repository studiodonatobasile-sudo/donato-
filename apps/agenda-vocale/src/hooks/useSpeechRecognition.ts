import { useCallback, useEffect, useRef, useState } from 'react'

// Le API SpeechRecognition non sono ancora standardizzate nei tipi DOM di TS.
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: Event & { error?: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface UseSpeechRecognitionResult {
  supported: boolean
  listening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

/** Wrapper sulla Web Speech API per il riconoscimento vocale in italiano. */
export function useSpeechRecognition(lang = 'it-IT'): UseSpeechRecognitionResult {
  const Ctor = getSpeechRecognitionCtor()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const start = useCallback(() => {
    if (!Ctor) {
      setError('Il riconoscimento vocale non e’ supportato in questo browser.')
      return
    }
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (ev) => {
      let finalText = ''
      let interimText = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }
      if (finalText) setTranscript((prev) => (prev + ' ' + finalText).trim())
      setInterimTranscript(interimText)
    }
    recognition.onerror = (ev) => {
      setError(ev.error ?? 'Errore sconosciuto nel riconoscimento vocale')
      setListening(false)
    }
    recognition.onend = () => {
      setListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [Ctor, lang])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return { supported: !!Ctor, listening, transcript, interimTranscript, error, start, stop, reset }
}
