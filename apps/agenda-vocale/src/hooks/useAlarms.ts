import { useEffect, useRef, useState } from 'react'
import type { AgendaItem } from '../types'
import { dateTimeToDate } from '../utils/dateUtils'
import { playAlertLoop } from '../utils/audioAlerts'

const CHECK_INTERVAL_MS = 15_000
/** Oltre questa soglia un avviso mancato viene considerato "perso" e non fatto suonare al rientro. */
const MAX_STALE_MS = 6 * 60 * 60 * 1000

export interface ActiveAlert {
  item: AgendaItem
  stopLoop: () => void
}

/**
 * Controlla periodicamente gli appuntamenti con avviso sonoro attivo e li fa
 * suonare/notificare al momento giusto. Restituisce gli avvisi correntemente
 * attivi (da mostrare/silenziare in UI) e chiama onFired quando un item deve
 * essere marcato come "avviso emesso" nel database.
 */
export function useAlarms(items: AgendaItem[], onFired: (id: string, firedAt: number) => void) {
  const [activeAlerts, setActiveAlerts] = useState<AgendaItem[]>([])
  const loopsRef = useRef<Map<string, () => void>>(new Map())
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    const check = () => {
      const now = Date.now()
      for (const item of itemsRef.current) {
        if (!item.alarmEnabled || !item.date || !item.time) continue
        if (item.alarmFiredAt || item.alarmDismissed || item.done) continue
        const target = dateTimeToDate(item.date, item.time).getTime() - item.alarmMinutesBefore * 60_000
        if (now < target) continue
        if (now - target > MAX_STALE_MS) {
          // Troppo vecchio: lo marchiamo come emesso senza far rumore, resta comunque visibile come "perso".
          onFired(item.id, now)
          continue
        }
        onFired(item.id, now)
        const stopLoop = playAlertLoop(item.alarmSound)
        loopsRef.current.set(item.id, stopLoop)
        setActiveAlerts((prev) => (prev.some((p) => p.id === item.id) ? prev : [...prev, item]))

        if (Notification && Notification.permission === 'granted') {
          try {
            const n = new Notification(item.type === 'nota' ? 'Promemoria' : 'Appuntamento', {
              body: item.title,
              tag: item.id
            })
            n.onclick = () => window.focus()
          } catch {
            // alcuni browser mobile non supportano `new Notification` fuori da un service worker
          }
        }
      }
    }

    check()
    const id = window.setInterval(check, CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFired])

  const dismiss = (id: string) => {
    loopsRef.current.get(id)?.()
    loopsRef.current.delete(id)
    setActiveAlerts((prev) => prev.filter((p) => p.id !== id))
  }

  return { activeAlerts, dismiss }
}
