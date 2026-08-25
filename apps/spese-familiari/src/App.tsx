import { useCallback, useEffect, useState } from 'react'
import { deleteExpense as dbDeleteExpense, getAllExpenses, getSettings, saveExpense as dbSaveExpense, saveSettings } from './db'
import { createEmptyExpense, DEFAULT_SETTINGS, type AppSettings, type Expense, type SummaryKind } from './types'
import { useSummaryScheduler } from './hooks/useSummaryScheduler'
import { Header } from './components/Header'
import { VoiceExpenseBar } from './components/VoiceExpenseBar'
import { Dashboard } from './components/Dashboard'
import { ExpenseForm } from './components/ExpenseForm'
import { SummaryModal } from './components/SummaryModal'
import { SettingsPanel } from './components/SettingsPanel'

type FormState = { mode: 'closed' } | { mode: 'new'; draft: Expense; transcript?: string } | { mode: 'edit'; draft: Expense }

const SUMMARY_CHOICES: { id: SummaryKind; label: string; emoji: string }[] = [
  { id: 'daily', label: 'Riepilogo di oggi', emoji: '🌙' },
  { id: 'weekly', label: 'Riepilogo della settimana', emoji: '📅' },
  { id: 'monthly', label: 'Riepilogo del mese', emoji: '🗓️' }
]

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' })
  const [showSettings, setShowSettings] = useState(false)
  const [showSummaryChooser, setShowSummaryChooser] = useState(false)
  const [manualSummary, setManualSummary] = useState<SummaryKind | null>(null)

  useEffect(() => {
    Promise.all([getAllExpenses(), getSettings()]).then(([loadedExpenses, loadedSettings]) => {
      setExpenses(loadedExpenses)
      setSettings(loadedSettings)
      setLoaded(true)
    })
  }, [])

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next)
    void saveSettings(next)
  }, [])

  const handleScheduledShown = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch }
        void saveSettings(next)
        return next
      })
    },
    []
  )

  const { current: autoSummary, dequeue } = useSummaryScheduler(settings, loaded, handleScheduledShown)

  const activeSummary = manualSummary ?? autoSummary

  const closeSummary = () => {
    if (manualSummary) {
      setManualSummary(null)
    } else {
      dequeue()
    }
  }

  const handleNewExpense = () => {
    setFormState({ mode: 'new', draft: createEmptyExpense() })
  }

  const handleVoiceDraft = (draft: Expense, rawTranscript: string) => {
    setFormState({ mode: 'new', draft, transcript: rawTranscript })
  }

  const handleEditExpense = (expense: Expense) => {
    setFormState({ mode: 'edit', draft: expense })
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (!window.confirm(`Eliminare la spesa "${expense.description}" di ${expense.amount.toFixed(2)} €?`)) return
    await dbDeleteExpense(expense.id)
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
  }

  const handleResetData = async () => {
    if (!window.confirm('Cancellare definitivamente tutte le spese registrate?')) return
    for (const e of expenses) {
      await dbDeleteExpense(e.id)
    }
    setExpenses([])
  }

  const handleFormSubmit = async (expense: Expense) => {
    await dbSaveExpense(expense)
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id)
      return exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [...prev, expense]
    })
    setFormState({ mode: 'closed' })
  }

  return (
    <div className="app-shell">
      <Header onOpenSettings={() => setShowSettings(true)} onOpenSummary={() => setShowSummaryChooser(true)} />

      <main className="app-main">
        <VoiceExpenseBar onDraftReady={handleVoiceDraft} />

        {loaded ? (
          <Dashboard expenses={expenses} onEdit={handleEditExpense} onDelete={handleDeleteExpense} />
        ) : (
          <p className="hint">Caricamento…</p>
        )}
      </main>

      <button type="button" className="fab" aria-label="Nuova spesa" onClick={handleNewExpense}>
        +
      </button>

      {formState.mode !== 'closed' && (
        <div className="modal-overlay" onClick={() => setFormState({ mode: 'closed' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{formState.mode === 'edit' ? 'Modifica spesa' : 'Nuova spesa'}</h2>
            <ExpenseForm
              initial={formState.draft}
              familyMembers={settings.familyMembers}
              voiceHint={formState.mode === 'new' ? formState.transcript : undefined}
              onCancel={() => setFormState({ mode: 'closed' })}
              onSubmit={handleFormSubmit}
              submitLabel={formState.mode === 'edit' ? 'Salva modifiche' : 'Aggiungi spesa'}
            />
          </div>
        </div>
      )}

      {showSummaryChooser && (
        <div className="modal-overlay" onClick={() => setShowSummaryChooser(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📊 Riepiloghi</h2>
            <div className="summary-choice-list">
              {SUMMARY_CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="btn secondary summary-choice-btn"
                  onClick={() => {
                    setManualSummary(c.id)
                    setShowSummaryChooser(false)
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn primary" onClick={() => setShowSummaryChooser(false)}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSummary && (
        <SummaryModal
          kind={activeSummary}
          expenses={expenses}
          monthlyBudget={settings.monthlyBudget}
          onClose={closeSummary}
          autoSpeak={!manualSummary && settings.speakSummaryAloud}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
          onResetData={handleResetData}
        />
      )}
    </div>
  )
}
