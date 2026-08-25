const WEEKDAY_LABELS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTH_LABELS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
]

/** Restituisce la data locale corrente in formato YYYY-MM-DD */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function currentHHMM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function toDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(dateStr: string, days: number): string {
  const dt = toDate(dateStr)
  dt.setDate(dt.getDate() + days)
  return todayStr(dt)
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr()
}

export function isSunday(dateStr: string): boolean {
  return toDate(dateStr).getDay() === 0
}

export function formatDateLabel(dateStr: string): string {
  const today = todayStr()
  const tomorrow = addDays(today, 1)
  const yesterday = addDays(today, -1)
  if (dateStr === today) return 'Oggi'
  if (dateStr === tomorrow) return 'Domani'
  if (dateStr === yesterday) return 'Ieri'
  const dt = toDate(dateStr)
  return `${WEEKDAY_LABELS[dt.getDay()]} ${dt.getDate()} ${MONTH_LABELS[dt.getMonth()]}`
}

export function formatDayShort(dateStr: string): string {
  const dt = toDate(dateStr)
  return `${WEEKDAY_SHORT[dt.getDay()]} ${dt.getDate()}`
}

export function formatMonthLabel(dateStr: string): string {
  const dt = toDate(dateStr)
  return `${MONTH_LABELS[dt.getMonth()]} ${dt.getFullYear()}`
}

/** Lunedì della settimana che contiene dateStr (settimana italiana, Lun-Dom). */
export function startOfWeek(dateStr: string): string {
  const dt = toDate(dateStr)
  const dow = dt.getDay() // 0 Dom .. 6 Sab
  const diff = dow === 0 ? -6 : 1 - dow
  dt.setDate(dt.getDate() + diff)
  return todayStr(dt)
}

export function endOfWeek(dateStr: string): string {
  return addDays(startOfWeek(dateStr), 6)
}

function isoWeekInfo(dateStr: string): { isoYear: number; week: number } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayNum = (date.getUTCDay() + 6) % 7 // Lun=0 .. Dom=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
  return { isoYear: date.getUTCFullYear(), week }
}

export function weekKey(dateStr: string): string {
  const { isoYear, week } = isoWeekInfo(dateStr)
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export function startOfMonth(dateStr: string): string {
  return `${monthKey(dateStr)}-01`
}

export function endOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${monthKey(dateStr)}-${String(lastDay).padStart(2, '0')}`
}

export function isLastDayOfMonth(dateStr: string): boolean {
  return dateStr === endOfMonth(dateStr)
}

export function daysBetweenInclusive(startStr: string, endStr: string): string[] {
  const days: string[] = []
  let cur = startStr
  let guard = 0
  while (cur <= endStr && guard < 400) {
    days.push(cur)
    cur = addDays(cur, 1)
    guard++
  }
  return days
}
