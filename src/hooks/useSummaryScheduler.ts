import { useEffect, useRef, useState } from 'react'
import type { AppSettings, SummaryKind } from '../types'
import { currentHHMM, isLastDayOfMonth, isSunday, monthKey, todayStr, weekKey } from '../utils/dateUtils'

const CHECK_INTERVAL_MS = 30_000

/**
 * Controlla periodicamente se e' l'ora di mostrare i riepiloghi automatici
 * (giornaliero ogni giorno, settimanale la domenica, mensile l'ultimo giorno
 * del mese, tutti all'orario impostato) e restituisce la coda di riepiloghi
 * da mostrare uno alla volta. Recupera anche i riepiloghi "persi" se l'app
 * viene riaperta più tardi.
 */
export function useSummaryScheduler(
  settings: AppSettings,
  loaded: boolean,
  onShown: (patch: Partial<AppSettings>) => void
) {
  const [queue, setQueue] = useState<SummaryKind[]>([])
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    if (!loaded) return

    const check = () => {
      const s = settingsRef.current
      const today = todayStr()
      if (currentHHMM() < String(s.summaryHour).padStart(2, '0') + ':00') return

      const pending: SummaryKind[] = []
      const patch: Partial<AppSettings> = {}

      if (s.dailySummaryEnabled && s.lastDailyShownDate !== today) {
        pending.push('daily')
        patch.lastDailyShownDate = today
      }
      if (s.weeklySummaryEnabled && isSunday(today)) {
        const wk = weekKey(today)
        if (s.lastWeeklyShownKey !== wk) {
          pending.push('weekly')
          patch.lastWeeklyShownKey = wk
        }
      }
      if (s.monthlySummaryEnabled && isLastDayOfMonth(today)) {
        const mk = monthKey(today)
        if (s.lastMonthlyShownKey !== mk) {
          pending.push('monthly')
          patch.lastMonthlyShownKey = mk
        }
      }

      if (pending.length > 0) {
        setQueue((prev) => [...prev, ...pending])
        onShown(patch)

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const label = pending.includes('monthly') ? 'mensile' : pending.includes('weekly') ? 'settimanale' : 'giornaliero'
            const n = new Notification('Riepilogo spese disponibile', {
              body: `Il riepilogo ${label} delle spese familiari è pronto.`,
              tag: `summary-${pending.join('-')}-${today}`
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
  }, [loaded, onShown])

  const dequeue = () => setQueue((prev) => prev.slice(1))
  const pushManual = (kind: SummaryKind) => setQueue((prev) => [...prev, kind])

  return { current: queue[0] ?? null, queueLength: queue.length, dequeue, pushManual }
}
