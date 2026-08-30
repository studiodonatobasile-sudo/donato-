import { useEffect, useMemo, useState } from 'react'
import type { CategoryTotal } from '../utils/summary'
import { byCategory, byDay, filterByRange, percentChange, previousRange, rangeForDay, rangeForMonth, rangeForWeek, sumAmount } from '../utils/summary'
import type { Expense, SummaryKind } from '../types'
import { getCategory } from '../types'
import { formatMonthLabel, formatDateLabel, todayStr } from '../utils/dateUtils'
import { formatCurrency, formatPercent } from '../utils/format'
import { CategoryDonutChart } from './charts/CategoryDonutChart'
import { TrendBarChart } from './charts/TrendBarChart'
import { ExpenseList } from './ExpenseList'
import { CategoryDetailModal } from './CategoryDetailModal'

interface Props {
  kind: SummaryKind
  expenses: Expense[]
  monthlyBudget: number | null
  onClose: () => void
  autoSpeak?: boolean
  hasMore?: boolean
  /** Giorno di riferimento per calcolare il periodo (default: oggi). Usato per mostrare il
   * riepilogo di un giorno specifico, es. cliccando una barra nel grafico dell'andamento. */
  referenceDate?: string
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

const TITLES: Record<SummaryKind, { emoji: string; title: string }> = {
  daily: { emoji: '🌙', title: 'Riepilogo giornaliero' },
  weekly: { emoji: '📅', title: 'Riepilogo settimanale' },
  monthly: { emoji: '🗓️', title: 'Riepilogo mensile' }
}

function topCategoryPhrase(categories: CategoryTotal[]): string {
  if (categories.length === 0) return ''
  const top = categories[0]
  const cat = getCategory(top.id)
  return `La categoria con più spesa è ${cat.label}, con ${formatCurrency(top.total)}.`
}

function buildSpeechText(kind: SummaryKind, total: number, categories: CategoryTotal[], delta: number | null, comparisonLabel: string): string {
  const parts: string[] = []
  const periodLabel = kind === 'daily' ? 'oggi' : kind === 'weekly' ? 'questa settimana' : 'questo mese'
  if (total === 0) {
    parts.push(`Non hai registrato spese ${periodLabel}.`)
    return parts.join(' ')
  }
  parts.push(`Hai speso ${formatCurrency(total)} ${periodLabel}.`)
  if (delta !== null && Math.abs(delta) > 0.01) {
    parts.push(`${delta > 0 ? 'In aumento' : 'In diminuzione'} del ${Math.abs(Math.round(delta * 100))}% ${comparisonLabel}.`)
  }
  parts.push(topCategoryPhrase(categories))
  return parts.join(' ')
}

export function SummaryModal({ kind, expenses, monthlyBudget, onClose, autoSpeak = false, hasMore = false, referenceDate, onEdit, onDelete }: Props) {
  const referenceDay = referenceDate ?? todayStr()
  const [dayDetail, setDayDetail] = useState<string | null>(null)
  const [categoryDetail, setCategoryDetail] = useState<string | null>(null)

  const range = useMemo(() => {
    if (kind === 'daily') return rangeForDay(referenceDay)
    if (kind === 'weekly') return rangeForWeek(referenceDay)
    return rangeForMonth(referenceDay)
  }, [kind, referenceDay])

  const rangeExpenses = useMemo(() => filterByRange(expenses, range), [expenses, range])
  const total = useMemo(() => sumAmount(rangeExpenses), [rangeExpenses])
  const categories = useMemo(() => byCategory(rangeExpenses), [rangeExpenses])
  const trendData = useMemo(() => byDay(expenses, range.days), [expenses, range])

  const prevRange = useMemo(() => previousRange(range), [range])
  const prevTotal = useMemo(() => sumAmount(filterByRange(expenses, prevRange)), [expenses, prevRange])
  const delta = percentChange(total, prevTotal)
  const comparisonLabel = kind === 'daily' ? 'rispetto a ieri' : kind === 'weekly' ? 'rispetto alla settimana scorsa' : 'rispetto al mese scorso'

  const { emoji, title } = TITLES[kind]
  const subtitle =
    kind === 'daily'
      ? formatDateLabel(referenceDay)
      : kind === 'weekly'
        ? `${formatDateLabel(range.start)} – ${formatDateLabel(range.end)}`
        : formatMonthLabel(referenceDay)

  const budgetFraction = kind === 'monthly' && monthlyBudget ? total / monthlyBudget : null
  const budgetStatus = budgetFraction === null ? null : budgetFraction >= 1 ? 'critical' : budgetFraction >= 0.8 ? 'warning' : 'good'

  const speak = () => {
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(buildSpeechText(kind, total, categories, delta, comparisonLabel))
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
        <h2>
          {emoji} {title}
        </h2>
        <p className="hint">{subtitle}</p>

        <div className="summary-total-row">
          <span className="summary-total-value">{formatCurrency(total)}</span>
          {delta !== null && Math.abs(delta) > 0.005 && (
            <span className={delta > 0 ? 'stat-delta up' : 'stat-delta down'}>
              {delta > 0 ? '▲' : '▼'} {Math.abs(Math.round(delta * 100))}% {comparisonLabel}
            </span>
          )}
        </div>

        {budgetStatus && monthlyBudget && (
          <div className={`budget-banner ${budgetStatus}`}>
            {budgetStatus === 'critical' && '🔴'}
            {budgetStatus === 'warning' && '🟡'}
            {budgetStatus === 'good' && '🟢'}{' '}
            {formatPercent(Math.min(budgetFraction ?? 0, 9.99))} del budget mensile di {formatCurrency(monthlyBudget)}
            {budgetStatus === 'critical' ? ' — budget superato' : budgetStatus === 'warning' ? ' — quasi al limite' : ' — sotto controllo'}
          </div>
        )}

        {total > 0 ? (
          <>
            <section className="chart-card">
              <h3 className="section-title">Per categoria</h3>
              <CategoryDonutChart data={categories} total={total} onSelect={setCategoryDetail} />
            </section>

            {kind !== 'daily' && (
              <section className="chart-card">
                <h3 className="section-title">Andamento giornaliero</h3>
                <TrendBarChart data={trendData} onSelectDay={setDayDetail} />
              </section>
            )}

            {kind === 'daily' && (
              <section>
                <h3 className="section-title">Movimenti</h3>
                <ExpenseList expenses={rangeExpenses} onEdit={onEdit} onDelete={onDelete} />
              </section>
            )}
          </>
        ) : (
          <p>Nessuna spesa registrata. 🎉</p>
        )}

        {hasMore && <p className="hint">C'è ancora un altro riepilogo da vedere dopo questo.</p>}

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

      {dayDetail && (
        <div onClick={(e) => e.stopPropagation()}>
          <SummaryModal
            kind="daily"
            referenceDate={dayDetail}
            expenses={expenses}
            monthlyBudget={monthlyBudget}
            onClose={() => setDayDetail(null)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}

      {categoryDetail && (
        <div onClick={(e) => e.stopPropagation()}>
          <CategoryDetailModal
            categoryId={categoryDetail}
            expenses={rangeExpenses}
            rangeLabel={subtitle}
            onClose={() => setCategoryDetail(null)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  )
}
