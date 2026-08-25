const WEEKDAY_LABELS = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato'
]

const MONTH_LABELS = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre'
]

/** Restituisce la data locale corrente in formato YYYY-MM-DD */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return todayStr(dt)
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  return dateStr === todayStr()
}

export function isPast(dateStr: string, timeStr: string | null): boolean {
  const target = dateTimeToDate(dateStr, timeStr)
  return target.getTime() < Date.now()
}

export function dateTimeToDate(dateStr: string, timeStr: string | null): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (timeStr) {
    const [hh, mm] = timeStr.split(':').map(Number)
    return new Date(y, m - 1, d, hh, mm, 0, 0)
  }
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function formatDateLabel(dateStr: string): string {
  const today = todayStr()
  const tomorrow = addDays(today, 1)
  const yesterday = addDays(today, -1)
  if (dateStr === today) return 'Oggi'
  if (dateStr === tomorrow) return 'Domani'
  if (dateStr === yesterday) return 'Ieri'
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${WEEKDAY_LABELS[dt.getDay()]} ${d} ${MONTH_LABELS[m - 1]}`
}

export function formatTimeLabel(timeStr: string | null): string {
  if (!timeStr) return ''
  return timeStr
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
