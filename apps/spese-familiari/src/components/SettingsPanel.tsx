import { useState } from 'react'
import { CATEGORIES, createCustomCategory, getCategory, type AppSettings, type Expense } from '../types'

interface Props {
  settings: AppSettings
  expenses: Expense[]
  onChange: (settings: AppSettings) => void
  onClose: () => void
  onResetData: () => void
}

export function SettingsPanel({ settings, expenses, onChange, onClose, onResetData }: Props) {
  const [membersInput, setMembersInput] = useState(settings.familyMembers.join(', '))
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget !== null ? String(settings.monthlyBudget) : '')
  const [newLabel, setNewLabel] = useState('')
  const [newMacro, setNewMacro] = useState(CATEGORIES[CATEGORIES.length - 1].id)
  const [newKeywords, setNewKeywords] = useState('')

  const notificationsSupported = 'Notification' in window

  const handleEnableNotifications = async () => {
    if (!notificationsSupported) return
    const permission = await Notification.requestPermission()
    onChange({ ...settings, notificationsRequested: permission === 'granted' })
  }

  const commitMembers = () => {
    const members = membersInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
    onChange({ ...settings, familyMembers: members })
  }

  const commitBudget = () => {
    const value = budgetInput.trim() === '' ? null : Number(budgetInput.replace(',', '.'))
    onChange({ ...settings, monthlyBudget: value !== null && value > 0 ? value : null })
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    const keywords = newKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    const category = createCustomCategory(newLabel, newMacro, keywords)
    onChange({ ...settings, customCategories: [...settings.customCategories, category] })
    setNewLabel('')
    setNewKeywords('')
  }

  const handleDeleteCategory = (id: string, label: string) => {
    const inUse = expenses.filter((e) => e.category === id).length
    const warning =
      inUse > 0
        ? `"${label}" è usata in ${inUse} ${inUse === 1 ? 'spesa' : 'spese'}: dopo l'eliminazione appariranno come "Altro". Eliminare comunque la categoria?`
        : `Eliminare la categoria "${label}"?`
    if (!window.confirm(warning)) return
    onChange({ ...settings, customCategories: settings.customCategories.filter((c) => c.id !== id) })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ Impostazioni</h2>

        <div className="settings-section">
          <h3 className="section-title">Riepiloghi automatici</h3>
          <div className="field">
            <label htmlFor="summary-hour">Orario dei riepiloghi</label>
            <select
              id="summary-hour"
              value={settings.summaryHour}
              onChange={(e) => onChange({ ...settings, summaryHour: Number(e.target.value) })}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.dailySummaryEnabled}
              onChange={(e) => onChange({ ...settings, dailySummaryEnabled: e.target.checked })}
            />
            Riepilogo giornaliero (ogni giorno)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.weeklySummaryEnabled}
              onChange={(e) => onChange({ ...settings, weeklySummaryEnabled: e.target.checked })}
            />
            Riepilogo settimanale (la domenica)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.monthlySummaryEnabled}
              onChange={(e) => onChange({ ...settings, monthlySummaryEnabled: e.target.checked })}
            />
            Riepilogo mensile (l'ultimo giorno del mese)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.speakSummaryAloud}
              onChange={(e) => onChange({ ...settings, speakSummaryAloud: e.target.checked })}
            />
            Leggi il riepilogo ad alta voce quando compare
          </label>

          {notificationsSupported && (
            <button type="button" className="btn secondary" onClick={handleEnableNotifications}>
              {settings.notificationsRequested ? '🔔 Notifiche attive' : '🔕 Abilita notifiche'}
            </button>
          )}
          <p className="hint">
            I riepiloghi compaiono quando l'app è aperta all'orario impostato (o alla prima apertura successiva). Come
            ogni app senza server, se l'app è chiusa il riepilogo si vede al rientro.
          </p>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Budget mensile</h3>
          <div className="field">
            <label htmlFor="budget">Obiettivo di spesa mensile (€, opzionale)</label>
            <input
              id="budget"
              type="text"
              inputMode="decimal"
              placeholder="es. 1500"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onBlur={commitBudget}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Membri della famiglia</h3>
          <div className="field">
            <label htmlFor="members">Nomi separati da virgola</label>
            <input
              id="members"
              type="text"
              placeholder="es. Mamma, Papà, Luca"
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
              onBlur={commitMembers}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Categorie personalizzate</h3>
          <p className="hint">
            Aggiungi le tue categorie di spesa, oltre a quelle già presenti. Ognuna appartiene a una delle 8
            macro-categorie (determina il colore nei grafici) e può avere parole chiave per il riconoscimento
            automatico dalla descrizione.
          </p>

          {settings.customCategories.length > 0 && (
            <ul className="custom-category-list">
              {settings.customCategories.map((c) => {
                const macro = getCategory(c.macro)
                return (
                  <li key={c.id} className="custom-category-row">
                    <span className="legend-swatch" style={{ background: `var(${macro.colorVar})` }} />
                    <span className="custom-category-label">
                      {c.label} <span className="hint-inline">— {macro.icon} {macro.label}</span>
                    </span>
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="Elimina categoria"
                      onClick={() => handleDeleteCategory(c.id, c.label)}
                    >
                      🗑️
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <form className="custom-category-form" onSubmit={handleAddCategory}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="new-category-label">Nome categoria</label>
                <input
                  id="new-category-label"
                  type="text"
                  placeholder="es. Paghetta ragazzi"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="new-category-macro">Macro-categoria</label>
                <select id="new-category-macro" value={newMacro} onChange={(e) => setNewMacro(e.target.value as typeof newMacro)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="new-category-keywords">
                Parole chiave <span className="hint-inline">(opzionali, separate da virgola, per il riscontro automatico)</span>
              </label>
              <input
                id="new-category-keywords"
                type="text"
                placeholder="es. paghetta"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn secondary" disabled={!newLabel.trim()}>
                ➕ Aggiungi categoria
              </button>
            </div>
          </form>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Dati</h3>
          <button type="button" className="btn danger" onClick={onResetData}>
            🗑️ Cancella tutte le spese
          </button>
        </div>

        <div className="form-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
