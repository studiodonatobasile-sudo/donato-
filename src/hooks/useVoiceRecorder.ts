import { useCallback, useRef, useState } from 'react'

export interface UseVoiceRecorderResult {
  supported: boolean
  recording: boolean
  seconds: number
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}

/** Registra una nota vocale tramite MediaRecorder. */
export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  const supported = typeof window !== 'undefined' && 'MediaRecorder' in window

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const start = useCallback(async () => {
    if (!supported) {
      setError('La registrazione audio non e’ supportata in questo browser.')
      return
    }
    setError(null)
    setAudioBlob(null)
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
        stopTimer()
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setSeconds(0)
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (err) {
      setError(
        err instanceof Error
          ? `Impossibile accedere al microfono: ${err.message}`
          : 'Impossibile accedere al microfono.'
      )
    }
  }, [supported])

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setSeconds(0)
    setError(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  return { supported, recording, seconds, audioBlob, audioUrl, error, start, stop, reset }
}
