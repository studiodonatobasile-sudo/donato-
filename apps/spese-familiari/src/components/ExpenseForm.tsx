import { useState } from 'react'
import { CATEGORIES, type Expense } from '../types'
import { classifyCategory } from '../utils/categoryClassifier'

interface Props {
  initial: Expense
  familyMembers: string[]
  voiceHint?: string
  onCancel: () => void
  onSubmit: (expense: Expense) => void
  submitLabel: string
}

export function ExpenseForm({ initial, familyMembers, voiceHint, onCancel, onSubmit, submitLabel }: Props) {
  const [amount, setAmount] = useState(initial.amount > 0 ? String(initial.amount).replace('.', ',') : '')
  const [description, setDescription] = useState(initial.description)
  const [category, setCategory] = useState(initial.category)
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [member, setMember] = useState(initial.member ?? familyMembers[0] ?? '')

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    if (!categoryTouched) {
      setCategory(classifyCategory(value))
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategoryTouched(true)
    setCategory(value as Expense['category'])
  }

  const parsedAmount = Number(amount.replace(',', '.'))
  const canSubmit = description.trim().length > 0 && parsedAmount > 0 && date && time

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      ...initial,
      amount: Math.round(parsedAmount * 100) / 100,
      description: description.trim(),
      category,
      date,
      time,
      member: member || null,
      updatedAt: Date.now()
    })
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      {voiceHint && (
        <p className="hint voice-transcript-hint">🎙️ Hai detto: “{voiceHint}” — controlla i campi prima di salvare.</p>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="amount">Importo (€)</label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="date">Data</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="time">Ora</label>
          <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Descrizione</label>
        <input
          id="description"
          type="text"
          placeholder="es. spesa al supermercato"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="category">
          Categoria <span className="hint-inline">(riconosciuta automaticamente, modificabile)</span>
        </label>
        <select id="category" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>

      {familyMembers.length > 0 && (
        <div className="field">
          <label htmlFor="member">Chi ha speso</label>
          <select id="member" value={member} onChange={(e) => setMember(e.target.value)}>
            <option value="">—</option>
            {familyMembers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Annulla
        </button>
        <button type="submit" className="btn primary" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
