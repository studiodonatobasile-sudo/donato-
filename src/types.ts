export type ItemType = 'appuntamento' | 'nota'

export const ALARM_SOUNDS = [
  { id: 'campanello', label: 'Campanello' },
  { id: 'sirena', label: 'Sirena' },
  { id: 'ding', label: 'Ding' },
  { id: 'allegro', label: 'Allegro' }
] as const

export type AlarmSoundId = (typeof ALARM_SOUNDS)[number]['id']

export interface AttachmentMeta {
  id: string
  name: string
  type: string
  size: number
  createdAt: number
}

export interface AgendaItem {
  id: string
  type: ItemType
  title: string
  notes: string
  /** Data in formato YYYY-MM-DD, opzionale per le note senza scadenza */
  date: string | null
  /** Ora in formato HH:MM, opzionale */
  time: string | null
  location: string
  alarmEnabled: boolean
  alarmSound: AlarmSoundId
  alarmMinutesBefore: number
  attachments: AttachmentMeta[]
  voiceNoteId: string | null
  voiceNoteDuration: number | null
  done: boolean
  createdAt: number
  updatedAt: number
  /** Timestamp in cui l'avviso e' stato emesso, per evitare di ripeterlo */
  alarmFiredAt: number | null
  /** L'utente ha chiuso/riconosciuto manualmente l'avviso */
  alarmDismissed: boolean
  /** ID dell'evento su Google Calendar corrispondente, se sincronizzato */
  googleEventId: string | null
}

export interface AppSettings {
  key: 'settings'
  morningSummaryTime: string
  morningSummaryEnabled: boolean
  defaultAlarmSound: AlarmSoundId
  defaultAlarmMinutesBefore: number
  notificationsRequested: boolean
  lastSummaryShownDate: string | null
  speakSummaryAloud: boolean
  /** Client ID OAuth di Google (creato dall'utente su Google Cloud Console) */
  googleClientId: string
  /** L'utente ha completato almeno una volta la connessione a Google Calendar */
  googleConnected: boolean
  /** Token di sincronizzazione incrementale restituito da Google Calendar */
  googleSyncToken: string | null
  /** Timestamp dell'ultima sincronizzazione riuscita con Google Calendar */
  googleLastSyncAt: number | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  key: 'settings',
  morningSummaryTime: '08:00',
  morningSummaryEnabled: true,
  defaultAlarmSound: 'campanello',
  defaultAlarmMinutesBefore: 0,
  notificationsRequested: false,
  lastSummaryShownDate: null,
  speakSummaryAloud: false,
  googleClientId: '',
  googleConnected: false,
  googleSyncToken: null,
  googleLastSyncAt: null
}

export function createEmptyItem(overrides: Partial<AgendaItem> = {}): AgendaItem {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    type: 'appuntamento',
    title: '',
    notes: '',
    date: null,
    time: null,
    location: '',
    alarmEnabled: false,
    alarmSound: 'campanello',
    alarmMinutesBefore: 0,
    attachments: [],
    voiceNoteId: null,
    voiceNoteDuration: null,
    done: false,
    createdAt: now,
    updatedAt: now,
    alarmFiredAt: null,
    alarmDismissed: false,
    googleEventId: null,
    ...overrides
  }
}
