import type { AgendaItem } from '../types'
import { addDays } from './dateUtils'

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
/** Proprieta' privata usata sugli eventi Google per riconoscere quelli creati da questa app. */
const EXT_PROP_KEY = 'agendaVocaleId'

// Le API di Google Identity Services non hanno tipi ufficiali qui: dichiariamo
// solo la porzione minima che usiamo.
interface TokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void
  callback?: (resp: TokenResponse) => void
}
interface GoogleAccountsGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (resp: TokenResponse) => void
      }) => TokenClient
      revoke: (token: string, done: () => void) => void
    }
  }
}

let scriptLoadPromise: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    if ((window as unknown as { google?: GoogleAccountsGlobal }).google?.accounts?.oauth2) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Impossibile caricare lo script di accesso Google.'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

let tokenClient: TokenClient | null = null
let currentAccessToken: string | null = null
let currentClientId: string | null = null

function getGoogleGlobal(): GoogleAccountsGlobal {
  const g = (window as unknown as { google?: GoogleAccountsGlobal }).google
  if (!g?.accounts?.oauth2) throw new Error('Google Identity Services non ancora caricato.')
  return g
}

async function ensureTokenClient(clientId: string): Promise<TokenClient> {
  await loadGisScript()
  if (tokenClient && currentClientId === clientId) return tokenClient
  const google = getGoogleGlobal()
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: () => {
      // sovrascritto ad ogni richiesta in requestToken()
    }
  })
  currentClientId = clientId
  return tokenClient
}

/**
 * Richiede un access token. Con silent=true tenta di ottenerlo senza mostrare
 * popup (funziona se il browser ha ancora una sessione Google attiva);
 * altrimenti apre il popup di consenso.
 */
export async function requestAccessToken(clientId: string, silent: boolean): Promise<string> {
  const client = await ensureTokenClient(clientId)
  return new Promise((resolve, reject) => {
    client.callback = (resp: TokenResponse) => {
      if (resp.error || !resp.access_token) {
        reject(new Error(resp.error_description || resp.error || 'Accesso a Google negato.'))
        return
      }
      currentAccessToken = resp.access_token
      resolve(resp.access_token)
    }
    try {
      client.requestAccessToken({ prompt: silent ? 'none' : 'consent' })
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Errore nella richiesta di accesso a Google.'))
    }
  })
}

export function revokeAccessToken(): void {
  if (!currentAccessToken) return
  try {
    getGoogleGlobal().accounts.oauth2.revoke(currentAccessToken, () => {})
  } catch {
    // ignora: la disconnessione locale procede comunque
  }
  currentAccessToken = null
}

export function hasAccessToken(): boolean {
  return !!currentAccessToken
}

async function apiFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${CALENDAR_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {})
    }
  })
  return res
}

interface GoogleEventDateTime {
  date?: string
  dateTime?: string
  timeZone?: string
}
export interface GoogleEvent {
  id: string
  status?: string
  summary?: string
  description?: string
  location?: string
  start?: GoogleEventDateTime
  end?: GoogleEventDateTime
  updated?: string
  extendedProperties?: { private?: Record<string, string> }
}

function itemToEventResource(item: AgendaItem) {
  if (!item.date) throw new Error('Impossibile sincronizzare un elemento senza data.')
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const start = item.time
    ? { dateTime: `${item.date}T${item.time}:00`, timeZone }
    : { date: item.date }
  const end = item.time
    ? { dateTime: addOneHour(item.date, item.time), timeZone }
    : { date: addDays(item.date, 1) }

  return {
    summary: item.title || (item.type === 'nota' ? 'Nota' : 'Appuntamento'),
    description: item.notes || undefined,
    location: item.location || undefined,
    start,
    end,
    extendedProperties: { private: { [EXT_PROP_KEY]: item.id } }
  }
}

function addOneHour(date: string, time: string): string {
  const [h, m] = time.split(':').map(Number)
  let hh = h + 1
  let d = date
  if (hh >= 24) {
    hh -= 24
    d = addDays(date, 1)
  }
  return `${d}T${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/** Crea o aggiorna l'evento Google collegato all'item; restituisce l'id evento. */
export async function upsertEvent(token: string, item: AgendaItem): Promise<string> {
  const body = JSON.stringify(itemToEventResource(item))
  if (item.googleEventId) {
    const res = await apiFetch(`/calendars/primary/events/${item.googleEventId}`, token, {
      method: 'PATCH',
      body
    })
    if (res.status === 404 || res.status === 410) {
      // L'evento non esiste piu' su Google (cancellato altrove): ricrealo.
      return insertEvent(token, body)
    }
    if (!res.ok) throw new Error(`Google Calendar: errore aggiornamento evento (${res.status})`)
    const data = (await res.json()) as GoogleEvent
    return data.id
  }
  return insertEvent(token, body)
}

async function insertEvent(token: string, body: string): Promise<string> {
  const res = await apiFetch('/calendars/primary/events', token, { method: 'POST', body })
  if (!res.ok) throw new Error(`Google Calendar: errore creazione evento (${res.status})`)
  const data = (await res.json()) as GoogleEvent
  return data.id
}

export async function deleteEvent(token: string, eventId: string): Promise<void> {
  const res = await apiFetch(`/calendars/primary/events/${eventId}`, token, { method: 'DELETE' })
  if (!res.ok && res.status !== 404 && res.status !== 410 && res.status !== 204) {
    throw new Error(`Google Calendar: errore eliminazione evento (${res.status})`)
  }
}

export interface SyncPage {
  events: GoogleEvent[]
  nextSyncToken: string | null
}

/**
 * Recupera gli eventi cambiati dall'ultima sincronizzazione (o tutti i
 * futuri, alla prima sincronizzazione). Se il syncToken e' scaduto/non
 * valido (410), segnala di ripartire da zero restituendo needsFullResync.
 */
export async function fetchChangedEvents(
  token: string,
  syncToken: string | null
): Promise<SyncPage | 'needsFullResync'> {
  const events: GoogleEvent[] = []
  let pageToken: string | undefined
  let nextSyncToken: string | null = null

  do {
    const params = new URLSearchParams()
    if (syncToken) {
      params.set('syncToken', syncToken)
    } else {
      params.set('timeMin', new Date().toISOString())
      params.set('singleEvents', 'true')
    }
    if (pageToken) params.set('pageToken', pageToken)
    params.set('maxResults', '250')

    const res = await apiFetch(`/calendars/primary/events?${params.toString()}`, token)
    if (res.status === 410) return 'needsFullResync'
    if (!res.ok) throw new Error(`Google Calendar: errore lettura eventi (${res.status})`)
    const data = (await res.json()) as {
      items: GoogleEvent[]
      nextPageToken?: string
      nextSyncToken?: string
    }
    events.push(...data.items)
    pageToken = data.nextPageToken
    if (data.nextSyncToken) nextSyncToken = data.nextSyncToken
  } while (pageToken)

  return { events, nextSyncToken }
}

export function getAgendaIdFromEvent(event: GoogleEvent): string | null {
  return event.extendedProperties?.private?.[EXT_PROP_KEY] ?? null
}

export function eventToItemFields(event: GoogleEvent): {
  title: string
  notes: string
  location: string
  date: string | null
  time: string | null
} {
  const date = event.start?.date ?? event.start?.dateTime?.slice(0, 10) ?? null
  const time = event.start?.dateTime ? event.start.dateTime.slice(11, 16) : null
  return {
    title: event.summary ?? 'Senza titolo',
    notes: event.description ?? '',
    location: event.location ?? '',
    date,
    time
  }
}
