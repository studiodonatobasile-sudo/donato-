import { useState } from 'react'
import type { AppSettings } from '../types'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
  onClose: () => void
  onResetData: () => void
}

export function SettingsPanel({ settings, onChange, onClose, onResetData }: Props) {
  const [membersInput, setMembersInput] = useState(settings.familyMembers.join(', '))
  const [budgetInput, setBudgetInput] = useState(settings.monthlyBudget !== null ? String(settings.monthlyBudget) : '')

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
