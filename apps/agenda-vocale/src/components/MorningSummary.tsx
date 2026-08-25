import { useEffect, useMemo } from 'react'
import type { AgendaItem } from '../types'
import { todayStr } from '../utils/dateUtils'

interface Props {
  items: AgendaItem[]
  onClose: () => void
  autoSpeak?: boolean
}

function buildSpeechText(todayItems: AgendaItem[], overdueItems: AgendaItem[]): string {
  const parts: string[] = []
  if (todayItems.length === 0) {
    parts.push('Non hai appuntamenti o note in programma per oggi.')
  } else {
    parts.push(`Per oggi hai ${todayItems.length} ${todayItems.length === 1 ? 'cosa' : 'cose'} in programma.`)
    for (const item of todayItems) {
      const time = item.time ? `alle ${item.time.replace(':', ' e ')}` : ''
      parts.push(`${item.type === 'appuntamento' ? 'Appuntamento' : 'Nota'}: ${item.title} ${time}.`)
    }
  }
  if (overdueItems.length > 0) {
    parts.push(`Hai anche ${overdueItems.length} ${overdueItems.length === 1 ? 'elemento scaduto' : 'elementi scaduti'} da controllare.`)
  }
  return parts.join(' ')
}

export function MorningSummary({ items, onClose, autoSpeak = false }: Props) {
  const today = todayStr()

  const todayItems = useMemo(
    () => items.filter((i) => i.date === today && !i.done).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    [items, today]
  )
  const overdueItems = useMemo(
    () =>
      items.filter(
        (i) => !i.done && i.date && i.date < today
      ),
    [items, today]
  )
  const undatedNotes = useMemo(() => items.filter((i) => i.type === 'nota' && !i.date && !i.done), [items])

  const speak = () => {
    if (!('speechSynthesis' in window)) return
    const text = buildSpeechText(todayItems, overdueItems)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'it-IT'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (autoSpeak) speak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content summary-modal" onClick={(e) => e.stopPropagation()}>
        <h2>☀️ Buongiorno!</h2>
        <p className="hint">Ecco il riepilogo di oggi, {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>

        {todayItems.length === 0 ? (
          <p>Nessun appuntamento o nota in programma per oggi. 🎉</p>
        ) : (
          <ul className="summary-list">
            {todayItems.map((item) => (
              <li key={item.id}>
                <span className="item-type-badge">{item.type === 'appuntamento' ? '📅' : '📝'}</span>
                {item.time && <strong>{item.time}</strong>} {item.title}
                {item.alarmEnabled && <span title="Avviso sonoro attivo"> 🔔</span>}
              </li>
            ))}
          </ul>
        )}

        {overdueItems.length > 0 && (
          <div className="summary-section">
            <h3>⚠️ Scaduti da controllare</h3>
            <ul className="summary-list">
              {overdueItems.map((item) => (
                <li key={item.id}>
                  {item.title} <span className="hint">({item.date})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {undatedNotes.length > 0 && (
          <div className="summary-section">
            <h3>📝 Note senza data</h3>
            <ul className="summary-list">
              {undatedNotes.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-actions">
          {'speechSynthesis' in window && (
            <button type="button" className="btn secondary" onClick={speak}>
              🔊 Ascolta il riepilogo
            </button>
          )}
          <button type="button" className="btn primary" onClick={onClose}>
            Ho capito
          </button>
        </div>
      </div>
    </div>
  )
}
