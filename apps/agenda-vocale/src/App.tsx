import { useCallback, useEffect, useState } from 'react'
import {
  deleteAttachmentBlob,
  deleteItem as dbDeleteItem,
  deleteVoiceNoteBlob,
  getAllItems,
  getSettings,
  saveAttachmentBlob,
  saveItem as dbSaveItem,
  saveSettings,
  saveVoiceNoteBlob
} from './db'
import { createEmptyItem, DEFAULT_SETTINGS, type AgendaItem, type AppSettings } from './types'
import { todayStr } from './utils/dateUtils'
import { useAlarms } from './hooks/useAlarms'
import { Header } from './components/Header'
import { VoiceCommandBar } from './components/VoiceCommandBar'
import { ItemList, type ListFilter } from './components/ItemList'
import { ItemForm, type ItemFormSubmitPayload } from './components/ItemForm'
import { MorningSummary } from './components/MorningSummary'
import { SettingsPanel } from './components/SettingsPanel'
import { ActiveAlertsBanner } from './components/ActiveAlertsBanner'

type FormState =
  | { mode: 'closed' }
  | { mode: 'new'; draft: AgendaItem; transcript?: string }
  | { mode: 'edit'; draft: AgendaItem }

function currentHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function App() {
  const [items, setItems] = useState<AgendaItem[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<ListFilter>('prossimi')
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' })
  const [showSettings, setShowSettings] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryAutoSpeak, setSummaryAutoSpeak] = useState(false)

  useEffect(() => {
    Promise.all([getAllItems(), getSettings()]).then(([loadedItems, loadedSettings]) => {
      setItems(loadedItems)
      setSettings(loadedSettings)
      setLoaded(true)
    })
  }, [])

  // Riepilogo mattutino automatico: controlla al caricamento e ogni minuto se e' il momento di mostrarlo.
  useEffect(() => {
    if (!loaded) return
    const checkMorningSummary = () => {
      if (!settings.morningSummaryEnabled) return
      const today = todayStr()
      if (settings.lastSummaryShownDate === today) return
      if (currentHHMM() < settings.morningSummaryTime) return
      setSummaryAutoSpeak(settings.speakSummaryAloud)
      setShowSummary(true)
      const updated = { ...settings, lastSummaryShownDate: today }
      setSettings(updated)
      void saveSettings(updated)
    }
    checkMorningSummary()
    const id = window.setInterval(checkMorningSummary, 60_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, settings.morningSummaryEnabled, settings.morningSummaryTime, settings.lastSummaryShownDate])

  const handleAlarmFired = useCallback((id: string, firedAt: number) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, alarmFiredAt: firedAt } : i))
      const item = next.find((i) => i.id === id)
      if (item) void dbSaveItem(item)
      return next
    })
  }, [])

  const { activeAlerts, dismiss } = useAlarms(items, handleAlarmFired)

  const updateSettings = (next: AppSettings) => {
    setSettings(next)
    void saveSettings(next)
  }

  const handleNewItem = () => {
    setFormState({
      mode: 'new',
      draft: createEmptyItem({
        alarmSound: settings.defaultAlarmSound,
        alarmMinutesBefore: settings.defaultAlarmMinutesBefore
      })
    })
  }

  const handleVoiceDraft = (draft: AgendaItem, rawTranscript: string) => {
    setFormState({ mode: 'new', draft, transcript: rawTranscript })
  }

  const handleEditItem = (item: AgendaItem) => {
    setFormState({ mode: 'edit', draft: item })
  }

  const handleDeleteItem = async (item: AgendaItem) => {
    if (!window.confirm(`Eliminare "${item.title}"?`)) return
    await dbDeleteItem(item.id)
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  const handleToggleDone = async (item: AgendaItem) => {
    const updated = { ...item, done: !item.done, updatedAt: Date.now() }
    await dbSaveItem(updated)
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
  }

  const handleFormSubmit = async (payload: ItemFormSubmitPayload) => {
    const { item, newAttachments, removedAttachmentIds, voiceNoteChange, voiceNoteDuration } = payload

    for (const { meta, file } of newAttachments) {
      await saveAttachmentBlob(meta.id, file)
    }
    for (const id of removedAttachmentIds) {
      await deleteAttachmentBlob(id)
    }

    let voiceNoteId = item.voiceNoteId
    let voiceDuration = item.voiceNoteDuration
    if (voiceNoteChange === null) {
      if (item.voiceNoteId) await deleteVoiceNoteBlob(item.voiceNoteId)
      voiceNoteId = null
      voiceDuration = null
    } else if (voiceNoteChange instanceof Blob) {
      const id = voiceNoteId ?? crypto.randomUUID()
      await saveVoiceNoteBlob(id, voiceNoteChange)
      voiceNoteId = id
      voiceDuration = voiceNoteDuration
    }

    const finalItem: AgendaItem = { ...item, voiceNoteId, voiceNoteDuration: voiceDuration }
    await dbSaveItem(finalItem)
    setItems((prev) => {
      const exists = prev.some((i) => i.id === finalItem.id)
      return exists ? prev.map((i) => (i.id === finalItem.id ? finalItem : i)) : [...prev, finalItem]
    })
    setFormState({ mode: 'closed' })
  }

  const filters: { id: ListFilter; label: string }[] = [
    { id: 'prossimi', label: 'Prossimi' },
    { id: 'oggi', label: 'Oggi' },
    { id: 'note', label: 'Note' },
    { id: 'completati', label: 'Completati' },
    { id: 'tutti', label: 'Tutti' }
  ]

  return (
    <div className="app-shell">
      <Header onOpenSettings={() => setShowSettings(true)} onOpenSummary={() => { setSummaryAutoSpeak(false); setShowSummary(true) }} />

      <ActiveAlertsBanner alerts={activeAlerts} onDismiss={dismiss} />

      <main className="app-main">
        <VoiceCommandBar settings={settings} onDraftReady={handleVoiceDraft} />

        <div className="filter-tabs">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'filter-tab active' : 'filter-tab'}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loaded ? (
          <ItemList items={items} filter={filter} onEdit={handleEditItem} onDelete={handleDeleteItem} onToggleDone={handleToggleDone} />
        ) : (
          <p className="hint">Caricamento…</p>
        )}
      </main>

      <button type="button" className="fab" aria-label="Nuovo appuntamento o nota" onClick={handleNewItem}>
        +
      </button>

      {formState.mode !== 'closed' && (
        <div className="modal-overlay" onClick={() => setFormState({ mode: 'closed' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{formState.mode === 'edit' ? 'Modifica' : 'Nuovo elemento'}</h2>
            {formState.mode === 'new' && formState.transcript && (
              <p className="hint voice-transcript-hint">🎙️ Hai detto: “{formState.transcript}” — controlla i campi qui sotto prima di salvare.</p>
            )}
            <ItemForm
              initial={formState.draft}
              onCancel={() => setFormState({ mode: 'closed' })}
              onSubmit={handleFormSubmit}
              submitLabel={formState.mode === 'edit' ? 'Salva modifiche' : 'Aggiungi'}
            />
          </div>
        </div>
      )}

      {showSummary && (
        <MorningSummary items={items} onClose={() => setShowSummary(false)} autoSpeak={summaryAutoSpeak} />
      )}

      {showSettings && <SettingsPanel settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />}
    </div>
  )
}
