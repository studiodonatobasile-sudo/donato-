import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgendaItem, AppSettings } from '../types'
import {
  deleteEvent,
  fetchChangedEvents,
  requestAccessToken,
  revokeAccessToken,
  upsertEvent,
  type GoogleEvent
} from '../utils/googleCalendar'

const PULL_INTERVAL_MS = 4 * 60 * 1000

export interface UseGoogleCalendarResult {
  connected: boolean
  connecting: boolean
  syncing: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  syncNow: () => Promise<void>
  /** Invia su Google Calendar l'item passato; restituisce l'item con googleEventId aggiornato. */
  pushItem: (item: AgendaItem) => Promise<AgendaItem>
  pushDelete: (item: AgendaItem) => Promise<void>
}

export function useGoogleCalendar(
  settings: AppSettings,
  updateSettings: (next: AppSettings) => void,
  onRemoteEvents: (events: GoogleEvent[]) => void
): UseGoogleCalendarResult {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const pull = useCallback(
    async (forceFull: boolean) => {
      const token = tokenRef.current
      if (!token) return
      setSyncing(true)
      setError(null)
      try {
        const syncToken = forceFull ? null : settingsRef.current.googleSyncToken
        const result = await fetchChangedEvents(token, syncToken)
        if (result === 'needsFullResync') {
          setSyncing(false)
          await pull(true)
          return
        }
        onRemoteEvents(result.events)
        updateSettings({
          ...settingsRef.current,
          googleSyncToken: result.nextSyncToken ?? settingsRef.current.googleSyncToken,
          googleLastSyncAt: Date.now()
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nella sincronizzazione con Google Calendar.')
      } finally {
        setSyncing(false)
      }
    },
    [onRemoteEvents, updateSettings]
  )

  // Tenta un accesso silenzioso all'avvio se l'utente si era gia' connesso in passato.
  useEffect(() => {
    if (!settings.googleConnected || !settings.googleClientId) return
    let cancelled = false
    requestAccessToken(settings.googleClientId, true)
      .then((token) => {
        if (cancelled) return
        tokenRef.current = token
        setConnected(true)
        void pull(false)
      })
      .catch(() => {
        // La sessione Google non e' piu' valida: serve riconnettersi manualmente.
        if (!cancelled) setConnected(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.googleConnected, settings.googleClientId])

  // Sincronizzazione periodica finche' l'app resta aperta.
  useEffect(() => {
    if (!connected) return
    const id = window.setInterval(() => void pull(false), PULL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [connected, pull])

  const connect = useCallback(async () => {
    if (!settings.googleClientId.trim()) {
      setError('Inserisci prima il Client ID di Google.')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const token = await requestAccessToken(settings.googleClientId.trim(), false)
      tokenRef.current = token
      setConnected(true)
      updateSettings({ ...settingsRef.current, googleConnected: true })
      await pull(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connessione a Google Calendar non riuscita.')
    } finally {
      setConnecting(false)
    }
  }, [settings.googleClientId, updateSettings, pull])

  const disconnect = useCallback(() => {
    revokeAccessToken()
    tokenRef.current = null
    setConnected(false)
    updateSettings({ ...settingsRef.current, googleConnected: false, googleSyncToken: null })
  }, [updateSettings])

  const pushItem = useCallback(async (item: AgendaItem): Promise<AgendaItem> => {
    const token = tokenRef.current
    if (!token || !item.date) return item
    try {
      const googleEventId = await upsertEvent(token, item)
      return { ...item, googleEventId }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invio a Google Calendar non riuscito.')
      return item
    }
  }, [])

  const pushDelete = useCallback(async (item: AgendaItem): Promise<void> => {
    const token = tokenRef.current
    if (!token || !item.googleEventId) return
    try {
      await deleteEvent(token, item.googleEventId)
    } catch {
      // best-effort: se la cancellazione remota fallisce non blocchiamo quella locale
    }
  }, [])

  return {
    connected,
    connecting,
    syncing,
    error,
    connect,
    disconnect,
    syncNow: () => pull(false),
    pushItem,
    pushDelete
  }
}
