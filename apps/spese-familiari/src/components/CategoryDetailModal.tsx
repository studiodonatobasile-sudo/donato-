import { useMemo } from 'react'
import { getCategory, resolveCategory, type Expense } from '../types'
import { bySubcategory, filterByMacroCategory, sumAmount } from '../utils/summary'
import { formatCurrency, formatPercent } from '../utils/format'
import { ExpenseList } from './ExpenseList'

interface Props {
  categoryId: string
  /** Spese già filtrate per il periodo che si sta guardando (es. la settimana corrente): qui si filtra solo per categoria. */
  expenses: Expense[]
  /** Etichetta del periodo mostrata come sottotitolo, es. "Questa settimana". */
  rangeLabel: string
  onClose: () => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

/** Dettaglio di una macro-categoria: ripartizione per sottocategoria ed elenco dei movimenti. */
export function CategoryDetailModal({ categoryId, expenses, rangeLabel, onClose, onEdit, onDelete }: Props) {
  const category = getCategory(categoryId)
  const categoryExpenses = useMemo(() => filterByMacroCategory(expenses, categoryId), [expenses, categoryId])
  const total = useMemo(() => sumAmount(categoryExpenses), [categoryExpenses])
  const subcategories = useMemo(() => bySubcategory(categoryExpenses), [categoryExpenses])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content summary-modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {category.icon} {category.label}
        </h2>
        <p className="hint">{rangeLabel}</p>

        <div className="summary-total-row">
          <span className="summary-total-value">{formatCurrency(total)}</span>
        </div>

        {subcategories.length > 0 && (
          <section className="chart-card">
            <h3 className="section-title">Per sottocategoria</h3>
            <div className="subcategory-rank">
              {subcategories.map((s) => {
                const { subcategory } = resolveCategory(s.id)
                const fraction = total > 0 ? s.total / total : 0
                return (
                  <div className="subcategory-rank-row" key={s.id}>
                    <div className="subcategory-rank-labels">
                      <span className="subcategory-rank-label">{subcategory ? subcategory.label : category.label}</span>
                      <span className="subcategory-rank-value">
                        {formatCurrency(s.total)} · {formatPercent(fraction)}
                      </span>
                    </div>
                    <div className="subcategory-rank-track">
                      <div
                        className="subcategory-rank-fill"
                        style={{ width: `${Math.max(fraction * 100, 2)}%`, background: `var(${category.colorVar})` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section>
          <h3 className="section-title">Movimenti</h3>
          <ExpenseList expenses={categoryExpenses} onEdit={onEdit} onDelete={onDelete} />
        </section>

        <div className="form-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
