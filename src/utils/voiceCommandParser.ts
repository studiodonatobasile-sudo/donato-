import { ALARM_SOUNDS, type AlarmSoundId, type ItemType } from '../types'
import { addDays, todayStr } from './dateUtils'

export interface ParsedCommand {
  type: ItemType
  title: string
  date: string | null
  time: string | null
  alarmEnabled: boolean
  alarmSound: AlarmSoundId | null
  alarmMinutesBefore: number | null
  /** testo originale riconosciuto, per trasparenza verso l'utente */
  rawTranscript: string
}

const WEEKDAYS: Record<string, number> = {
  domenica: 0,
  lunedì: 1,
  lunedi: 1,
  martedì: 2,
  martedi: 2,
  mercoledì: 3,
  mercoledi: 3,
  giovedì: 4,
  giovedi: 4,
  venerdì: 5,
  venerdi: 5,
  sabato: 6
}

const NUMBER_WORDS: Record<string, number> = {
  una: 1,
  uno: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  undici: 11,
  dodici: 12,
  tredici: 13,
  quattordici: 14,
  quindici: 15,
  sedici: 16,
  diciassette: 17,
  diciotto: 18,
  diciannove: 19,
  venti: 20,
  trenta: 30,
  quaranta: 40,
  cinquanta: 50
}

function nextWeekday(target: number): string {
  const now = new Date()
  const diff = (target - now.getDay() + 7) % 7 || 7
  return addDays(todayStr(), diff)
}

function stripMatches(text: string, matches: RegExpMatchArray[]): string {
  let result = text
  for (const m of matches) {
    if (m[0]) result = result.replace(m[0], ' ')
  }
  return result.replace(/\s+/g, ' ').trim()
}

function extractDate(text: string): { date: string | null; remainder: string } {
  const removed: RegExpMatchArray[] = []
  let date: string | null = null

  const dopodomani = text.match(/dopodomani/i)
  const domani = text.match(/\bdomani\b/i)
  const oggi = text.match(/\boggi\b/i)
  const traGiorni = text.match(/tra\s+(\w+)\s+giorni/i)
  const numeric = text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/)
  const weekdayMatch = text.match(
    /\b(luned[ìi]|marted[ìi]|mercoled[ìi]|gioved[ìi]|venerd[ìi]|sabato|domenica)\b/i
  )
  const ilGiorno = text.match(/\bil\s+(\d{1,2})\b(?!\s*[:.]\d)/i)

  if (dopodomani) {
    date = addDays(todayStr(), 2)
    removed.push(dopodomani)
  } else if (domani) {
    date = addDays(todayStr(), 1)
    removed.push(domani)
  } else if (oggi) {
    date = todayStr()
    removed.push(oggi)
  } else if (traGiorni) {
    const n = NUMBER_WORDS[traGiorni[1].toLowerCase()] ?? parseInt(traGiorni[1], 10)
    if (!Number.isNaN(n)) {
      date = addDays(todayStr(), n)
      removed.push(traGiorni)
    }
  } else if (numeric) {
    const day = parseInt(numeric[1], 10)
    const month = parseInt(numeric[2], 10)
    const now = new Date()
    let year = numeric[3] ? parseInt(numeric[3], 10) : now.getFullYear()
    if (year < 100) year += 2000
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const y = String(year)
      const m = String(month).padStart(2, '0')
      const d = String(day).padStart(2, '0')
      date = `${y}-${m}-${d}`
      removed.push(numeric)
    }
  } else if (weekdayMatch) {
    const key = weekdayMatch[1].toLowerCase().normalize('NFC')
    const target = WEEKDAYS[key] ?? WEEKDAYS[key.replace('ì', 'i')]
    if (target !== undefined) {
      date = nextWeekday(target)
      removed.push(weekdayMatch)
    }
  } else if (ilGiorno) {
    const day = parseInt(ilGiorno[1], 10)
    const now = new Date()
    if (day >= 1 && day <= 31) {
      let month = now.getMonth() + 1
      let year = now.getFullYear()
      if (day < now.getDate()) {
        month += 1
        if (month > 12) {
          month = 1
          year += 1
        }
      }
      date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      removed.push(ilGiorno)
    }
  }

  return { date, remainder: stripMatches(text, removed) }
}

function extractTime(text: string): { time: string | null; remainder: string } {
  const removed: RegExpMatchArray[] = []
  let time: string | null = null

  const numericTime = text.match(/\balle\s+(\d{1,2})[:.](\d{2})\b/i)
  const oraSecca = text.match(/\balle\s+(\d{1,2})\b(?!\s*[:.]\d)/i)
  const eMezza = text.match(/\balle\s+(\d{1,2})\s+e\s+mezz[ao]\b/i)
  const eUnQuarto = text.match(/\balle\s+(\d{1,2})\s+e\s+un\s+quarto\b/i)
  const wordTime = text.match(
    /\balle\s+(una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici)\b(?!\s*e\s+mezz)/i
  )
  const pomeriggio = /pomeriggio|sera/i.test(text)

  const applyPeriod = (h: number): number => {
    if (h <= 12 && pomeriggio && h !== 12) return h + 12
    return h
  }

  if (numericTime) {
    const h = applyPeriod(parseInt(numericTime[1], 10))
    time = `${String(h).padStart(2, '0')}:${numericTime[2]}`
    removed.push(numericTime)
  } else if (eMezza) {
    const h = applyPeriod(parseInt(eMezza[1], 10))
    time = `${String(h).padStart(2, '0')}:30`
    removed.push(eMezza)
  } else if (eUnQuarto) {
    const h = applyPeriod(parseInt(eUnQuarto[1], 10))
    time = `${String(h).padStart(2, '0')}:15`
    removed.push(eUnQuarto)
  } else if (wordTime) {
    const h = applyPeriod(NUMBER_WORDS[wordTime[1].toLowerCase()] ?? 0)
    time = `${String(h).padStart(2, '0')}:00`
    removed.push(wordTime)
  } else if (oraSecca) {
    const h = applyPeriod(parseInt(oraSecca[1], 10))
    if (h >= 0 && h <= 23) {
      time = `${String(h).padStart(2, '0')}:00`
      removed.push(oraSecca)
    }
  }

  let remainder = stripMatches(text, removed)
  remainder = remainder.replace(/\b(pomeriggio|sera|mattina|mattino)\b/gi, '').trim()
  return { time, remainder }
}

function extractAlarm(text: string): {
  alarmEnabled: boolean
  alarmSound: AlarmSoundId | null
  alarmMinutesBefore: number | null
  remainder: string
} {
  const removed: RegExpMatchArray[] = []
  let alarmEnabled = false
  let alarmSound: AlarmSoundId | null = null
  let alarmMinutesBefore: number | null = null

  const positive = text.match(
    /\b(con\s+(un\s+)?(avviso|allarme)\s+sonoro|con\s+avviso|con\s+allarme|avvisami|suoneria|suona|con\s+sveglia)\b/i
  )
  const negative = text.match(/\bsenza\s+(avviso|allarme)\b/i)

  if (negative) {
    alarmEnabled = false
    removed.push(negative)
  } else if (positive) {
    alarmEnabled = true
    removed.push(positive)
  }

  for (const sound of ALARM_SOUNDS) {
    const re = new RegExp(`\\b${sound.label.toLowerCase()}\\b`, 'i')
    const m = text.match(re)
    if (m) {
      alarmSound = sound.id
      alarmEnabled = true
      removed.push(m)
      break
    }
  }

  const minutesBefore = text.match(/(\d{1,3})\s+minuti?\s+prima/i)
  if (minutesBefore) {
    alarmMinutesBefore = parseInt(minutesBefore[1], 10)
    alarmEnabled = true
    removed.push(minutesBefore)
  }

  return { alarmEnabled, alarmSound, alarmMinutesBefore, remainder: stripMatches(text, removed) }
}

function extractType(text: string): { type: ItemType; remainder: string } {
  const removed: RegExpMatchArray[] = []
  let type: ItemType = 'appuntamento'

  const notaMatch = text.match(/\b(nota|appunto|promemoria|ricordami)\b/i)
  const appMatch = text.match(/\b(appuntamento|visita|riunione|incontro)\b/i)

  if (notaMatch && !appMatch) {
    type = 'nota'
    removed.push(notaMatch)
  } else if (appMatch) {
    type = 'appuntamento'
    removed.push(appMatch)
  }

  return { type, remainder: stripMatches(text, removed) }
}

const FILLER_WORDS =
  /\b(crea|aggiungi|nuovo|nuova|imposta|per il|per|il|la|alle|con|di|un|una|dal|del)\b/gi

/**
 * Interpreta un comando vocale in italiano e ne estrae i campi strutturati.
 * Il risultato va sempre mostrato all'utente per conferma prima di salvare,
 * perche' il riconoscimento e' euristico e puo' sbagliare.
 */
export function parseVoiceCommand(transcript: string): ParsedCommand {
  const original = transcript.trim()
  let text = original.toLowerCase()

  const typeResult = extractType(text)
  text = typeResult.remainder

  const dateResult = extractDate(text)
  text = dateResult.remainder

  const timeResult = extractTime(text)
  text = timeResult.remainder

  const alarmResult = extractAlarm(text)
  text = alarmResult.remainder

  let title = text.replace(FILLER_WORDS, ' ').replace(/\s+/g, ' ').trim()
  if (title.length === 0) {
    title = original
  }
  title = title.charAt(0).toUpperCase() + title.slice(1)

  return {
    type: typeResult.type,
    title,
    date: dateResult.date,
    time: timeResult.time,
    alarmEnabled: alarmResult.alarmEnabled,
    alarmSound: alarmResult.alarmSound,
    alarmMinutesBefore: alarmResult.alarmMinutesBefore,
    rawTranscript: original
  }
}
