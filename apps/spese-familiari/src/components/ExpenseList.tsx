import type { Expense } from '../types'
import { formatDateLabel } from '../utils/dateUtils'
import { formatCurrency } from '../utils/format'
import { CategoryBadge } from './CategoryBadge'

interface Props {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseList({ expenses, onEdit, onDelete }: Props) {
  if (expenses.length === 0) {
    return <p className="empty-state">Nessuna spesa registrata in questo periodo. 🎉</p>
  }

  const byDate = new Map<string, Expense[]>()
  for (const e of expenses) {
    const list = byDate.get(e.date) ?? []
    list.push(e)
    byDate.set(e.date, list)
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="expense-list">
      {dates.map((date) => {
        const items = [...byDate.get(date)!].sort((a, b) => b.time.localeCompare(a.time))
        const dayTotal = items.reduce((acc, e) => acc + e.amount, 0)
        return (
          <div key={date} className="expense-group">
            <div className="expense-group-header">
              <span className="item-group-label">{formatDateLabel(date)}</span>
              <span className="expense-group-total">{formatCurrency(dayTotal)}</span>
            </div>
            {items.map((e) => (
              <div key={e.id} className="expense-card">
                <div className="expense-card-main">
                  <div className="expense-card-body">
                    <div className="expense-card-title-row">
                      <span className="expense-title">{e.description}</span>
                      {e.source === 'voice' && <span title="Aggiunta a voce">🎙️</span>}
                    </div>
                    <div className="item-meta">
                      <CategoryBadge categoryId={e.category} />
                      <span>{e.time}</span>
                      {e.member && <span>👤 {e.member}</span>}
                    </div>
                  </div>
                  <span className="expense-amount">{formatCurrency(e.amount)}</span>
                </div>
                <div className="expense-card-actions">
                  <button type="button" className="icon-btn" title="Modifica" onClick={() => onEdit(e)}>
                    ✏️
                  </button>
                  <button type="button" className="icon-btn danger" title="Elimina" onClick={() => onDelete(e)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
