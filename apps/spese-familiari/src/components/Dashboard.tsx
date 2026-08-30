import { useMemo, useState } from 'react'
import type { Expense } from '../types'
import { addDays, daysBetweenInclusive, formatDateLabel, formatMonthLabel, todayStr } from '../utils/dateUtils'
import {
  byCategory,
  byDay,
  filterByRange,
  percentChange,
  previousRange,
  rangeForDay,
  rangeForMonth,
  rangeForWeek,
  sumAmount
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
  { id: 'day', label: 'Oggi' },
  { id: 'week', label: 'Settimana' },
  { id: 'month', label: 'Mese' }
]

export function Dashboard({ expenses, onEdit, onDelete }: Props) {
  const [tab, setTab] = useState<RangeId>('day')
  const [categoryDetail, setCategoryDetail] = useState<string | null>(null)
  const [dayDetail, setDayDetail] = useState<string | null>(null)
  const today = todayStr()

  const range = useMemo(() => {
    if (tab === 'day') return rangeForDay(today)
    if (tab === 'week') return rangeForWeek(today)
    return rangeForMonth(today)
  }, [tab, today])

  const rangeExpenses = useMemo(() => filterByRange(expenses, range), [expenses, range])
  const total = useMemo(() => sumAmount(rangeExpenses), [rangeExpenses])
  const categories = useMemo(() => byCategory(rangeExpenses), [rangeExpenses])

  const prevRange = useMemo(() => previousRange(range), [range])
  const prevTotal = useMemo(() => sumAmount(filterByRange(expenses, prevRange)), [expenses, prevRange])
  const delta = percentChange(total, prevTotal)
  const comparisonLabel = tab === 'day' ? 'vs ieri' : tab === 'week' ? 'vs sett. scorsa' : 'vs mese scorso'

  const trendDays = useMemo(() => {
    if (tab === 'day') return daysBetweenInclusive(addDays(today, -6), today)
    return range.days
  }, [tab, today, range])
  const trendData = useMemo(() => byDay(expenses, trendDays), [expenses, trendDays])

  const rangeLabel = tab === 'month' ? formatMonthLabel(today) : null
  const rangeSubtitle =
    tab === 'day'
      ? formatDateLabel(today)
      : tab === 'week'
        ? `${formatDateLabel(range.start)} – ${formatDateLabel(range.end)}`
        : formatMonthLabel(today)

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

      {rangeLabel && <p className="hint range-label">{rangeLabel}</p>}

      <StatTile
        label={tab === 'day' ? 'Speso oggi' : tab === 'week' ? 'Speso questa settimana' : 'Speso questo mese'}
        value={formatCurrency(total)}
        delta={delta !== null ? { fraction: delta, comparisonLabel } : null}
      />

      <section className="chart-card">
        <h2 className="section-title">Per categoria</h2>
        <CategoryDonutChart data={categories} total={total} onSelect={setCategoryDetail} />
      </section>

      <section className="chart-card">
        <h2 className="section-title">{tab === 'day' ? 'Ultimi 7 giorni' : 'Andamento giornaliero'}</h2>
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
