import { useEffect, useRef, useState } from 'react'
import type { AppSettings, Expense, SummaryKind } from '../types'
import { getCategory } from '../types'
import { currentHHMM, isLastDayOfMonth, isSunday, monthKey, todayStr, weekKey } from '../utils/dateUtils'
import { byCategory, filterByRange, rangeForDay, rangeForMonth, rangeForWeek, sumAmount } from '../utils/summary'
import { formatCurrency } from '../utils/format'

const CHECK_INTERVAL_MS = 30_000

const KIND_LABEL: Record<SummaryKind, string> = {
  daily: 'giornaliero',
  weekly: 'settimanale',
  monthly: 'mensile'
}

/** Sintesi con i numeri veri del periodo, da mostrare nel corpo della notifica di sistema. */
function buildSummaryText(kind: SummaryKind, expenses: Expense[], today: string): string {
  const range = kind === 'daily' ? rangeForDay(today) : kind === 'weekly' ? rangeForWeek(today) : rangeForMonth(today)
  const rangeExpenses = filterByRange(expenses, range)
  const total = sumAmount(rangeExpenses)
  if (total === 0) return 'Nessuna spesa registrata in questo periodo.'

  const top = byCategory(rangeExpenses)[0]
  const topPhrase = top ? ` Categoria principale: ${getCategory(top.id).label} (${formatCurrency(top.total)}).` : ''
  return `Totale speso: ${formatCurrency(total)}.${topPhrase} Tocca per il dettaglio e l'esportazione in Excel.`
}

/**
 * Controlla periodicamente se e' l'ora di mostrare i riepiloghi automatici
 * (giornaliero ogni giorno, settimanale la domenica, mensile l'ultimo giorno
 * del mese, tutti all'orario impostato) e restituisce la coda di riepiloghi
 * da mostrare uno alla volta. Recupera anche i riepiloghi "persi" se l'app
 * viene riaperta più tardi. La notifica di sistema (quando autorizzata)
 * riporta la sintesi vera del periodo, non solo un avviso generico: funziona
 * mentre l'app è aperta (anche in una scheda non in primo piano) — come ogni
 * PWA senza backend, non può svegliare il browser se è completamente chiuso.
 */
export function useSummaryScheduler(
  settings: AppSettings,
  expenses: Expense[],
  loaded: boolean,
  onShown: (patch: Partial<AppSettings>) => void
) {
  const [queue, setQueue] = useState<SummaryKind[]>([])
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const expensesRef = useRef(expenses)
  expensesRef.current = expenses

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
            // Se più riepiloghi sono pronti insieme (es. domenica di fine mese), la notifica
            // di sistema mostra quello più ampio; gli altri restano comunque in coda nell'app.
            const primary = pending.includes('monthly') ? 'monthly' : pending.includes('weekly') ? 'weekly' : 'daily'
            const n = new Notification(`Riepilogo ${KIND_LABEL[primary]} spese familiari`, {
              body: buildSummaryText(primary, expensesRef.current, today),
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
