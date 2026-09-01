import { useEffect, useMemo, useState } from 'react'
import type { Expense } from '../types'
import { addDays, daysBetweenInclusive, endOfMonth, formatDateLabel, formatMonthLabel, startOfMonth, todayStr } from '../utils/dateUtils'
import {
  byCategory,
  byDay,
  filterByRange,
  percentChange,
  previousRange,
  rangeForDay,
  rangeForMonth,
  rangeForWeek,
  sumAmount,
  type Range
} from '../utils/summary'
import { formatCurrency } from '../utils/format'
import { StatTile } from './StatTile'
import { CategoryDonutChart } from './charts/CategoryDonutChart'
import { TrendBarChart } from './charts/TrendBarChart'
import { ExpenseList } from './ExpenseList'
import { CategoryDetailModal } from './CategoryDetailModal'
import { SummaryModal } from './SummaryModal'

type RangeId = 'day' | 'week' | 'month'

interface Props {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

const TABS: { id: RangeId; label: string }[] = [
  { id: 'day', label: 'Giorno' },
  { id: 'week', label: 'Settimana' },
  { id: 'month', label: 'Mese' }
]

function rangeFor(tab: RangeId, referenceDate: string): Range {
  if (tab === 'day') return rangeForDay(referenceDate)
  if (tab === 'week') return rangeForWeek(referenceDate)
  return rangeForMonth(referenceDate)
}

/** Sposta la data di riferimento di un passo indietro/avanti, della durata giusta per il tab attivo. */
function shiftReferenceDate(tab: RangeId, referenceDate: string, direction: -1 | 1): string {
  if (tab === 'day') return addDays(referenceDate, direction)
  if (tab === 'week') return addDays(referenceDate, direction * 7)
  // Per il mese basta atterrare in un giorno qualsiasi del mese precedente/successivo:
  // rangeForMonth normalizza dalla data al mese di appartenenza.
  return direction === -1 ? addDays(startOfMonth(referenceDate), -1) : addDays(endOfMonth(referenceDate), 1)
}

export function Dashboard({ expenses, onEdit, onDelete }: Props) {
  const [tab, setTab] = useState<RangeId>('day')
  const [referenceDate, setReferenceDate] = useState(todayStr())
  const [categoryDetail, setCategoryDetail] = useState<string | null>(null)
  const [dayDetail, setDayDetail] = useState<string | null>(null)
  const today = todayStr()

  // Cambiare vista (Giorno/Settimana/Mese) riparte sempre dal periodo corrente.
  useEffect(() => {
    setReferenceDate(today)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const range = useMemo(() => rangeFor(tab, referenceDate), [tab, referenceDate])
  const currentRange = useMemo(() => rangeFor(tab, today), [tab, today])
  const isCurrentPeriod = range.start === currentRange.start && range.end === currentRange.end

  const rangeExpenses = useMemo(() => filterByRange(expenses, range), [expenses, range])
  const total = useMemo(() => sumAmount(rangeExpenses), [rangeExpenses])
  const categories = useMemo(() => byCategory(rangeExpenses), [rangeExpenses])

  const prevRange = useMemo(() => previousRange(range), [range])
  const prevTotal = useMemo(() => sumAmount(filterByRange(expenses, prevRange)), [expenses, prevRange])
  const delta = percentChange(total, prevTotal)
  const comparisonLabel = isCurrentPeriod
    ? tab === 'day'
      ? 'vs ieri'
      : tab === 'week'
        ? 'vs sett. scorsa'
        : 'vs mese scorso'
    : 'vs periodo precedente'

  const trendDays = useMemo(() => {
    if (tab === 'day') return daysBetweenInclusive(addDays(referenceDate, -6), referenceDate)
    return range.days
  }, [tab, referenceDate, range])
  const trendData = useMemo(() => byDay(expenses, trendDays), [expenses, trendDays])

  const rangeSubtitle =
    tab === 'day'
      ? formatDateLabel(referenceDate)
      : tab === 'week'
        ? `${formatDateLabel(range.start)} – ${formatDateLabel(range.end)}`
        : formatMonthLabel(referenceDate)

  const statLabel = isCurrentPeriod
    ? tab === 'day'
      ? 'Speso oggi'
      : tab === 'week'
        ? 'Speso questa settimana'
        : 'Speso questo mese'
    : tab === 'day'
      ? `Speso ${rangeSubtitle.toLowerCase()}`
      : `Speso in questo periodo`

  const goToToday = () => setReferenceDate(today)

  return (
    <div className="dashboard">
      <div className="filter-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="period-nav">
        <button
          type="button"
          className="icon-btn"
          aria-label="Periodo precedente"
          onClick={() => setReferenceDate((d) => shiftReferenceDate(tab, d, -1))}
        >
          ‹
        </button>
        <span className="period-nav-label">{rangeSubtitle}</span>
        {isCurrentPeriod ? (
          <span className="icon-btn period-nav-spacer" aria-hidden="true">
            ›
          </span>
        ) : (
          <button
            type="button"
            className="icon-btn"
            aria-label="Periodo successivo"
            onClick={() => setReferenceDate((d) => shiftReferenceDate(tab, d, 1))}
          >
            ›
          </button>
        )}
      </div>

      {!isCurrentPeriod && (
        <button type="button" className="btn secondary today-btn" onClick={goToToday}>
          Torna a oggi
        </button>
      )}

      <StatTile
        label={statLabel}
        value={formatCurrency(total)}
        delta={delta !== null ? { fraction: delta, comparisonLabel } : null}
      />

      <section className="chart-card">
        <h2 className="section-title">Per categoria</h2>
        <CategoryDonutChart data={categories} total={total} onSelect={setCategoryDetail} />
      </section>

      <section className="chart-card">
        <h2 className="section-title">
          {tab === 'day' ? (isCurrentPeriod ? 'Ultimi 7 giorni' : `7 giorni fino al ${formatDateLabel(referenceDate)}`) : 'Andamento giornaliero'}
        </h2>
        <TrendBarChart data={trendData} onSelectDay={setDayDetail} />
      </section>

      <section>
        <h2 className="section-title">Movimenti</h2>
        <ExpenseList expenses={rangeExpenses} onEdit={onEdit} onDelete={onDelete} />
      </section>

      {categoryDetail && (
        <CategoryDetailModal
          categoryId={categoryDetail}
          expenses={rangeExpenses}
          rangeLabel={rangeSubtitle}
          onClose={() => setCategoryDetail(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {dayDetail && (
        <SummaryModal
          kind="daily"
          referenceDate={dayDetail}
          expenses={expenses}
          monthlyBudget={null}
          onClose={() => setDayDetail(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
