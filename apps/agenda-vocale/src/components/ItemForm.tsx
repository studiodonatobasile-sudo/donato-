import { useState } from 'react'
import { ALARM_SOUNDS, type AgendaItem, type AlarmSoundId, type AttachmentMeta, type ItemType } from '../types'
import { getAttachmentBlob } from '../db'
import { AttachmentInput } from './AttachmentInput'
import { VoiceNoteRecorder } from './VoiceNoteRecorder'
import { playAlertSound } from '../utils/audioAlerts'

export interface ItemFormSubmitPayload {
  item: AgendaItem
  newAttachments: { meta: AttachmentMeta; file: File }[]
  removedAttachmentIds: string[]
  voiceNoteChange: Blob | null | undefined
  voiceNoteDuration: number | null
}

interface Props {
  initial: AgendaItem
  onCancel: () => void
  onSubmit: (payload: ItemFormSubmitPayload) => void
  submitLabel?: string
}

export function ItemForm({ initial, onCancel, onSubmit, submitLabel = 'Salva' }: Props) {
  const [type, setType] = useState<ItemType>(initial.type)
  const [title, setTitle] = useState(initial.title)
  const [notes, setNotes] = useState(initial.notes)
  const [date, setDate] = useState(initial.date ?? '')
  const [time, setTime] = useState(initial.time ?? '')
  const [location, setLocation] = useState(initial.location)
  const [alarmEnabled, setAlarmEnabled] = useState(initial.alarmEnabled)
  const [alarmSound, setAlarmSound] = useState<AlarmSoundId>(initial.alarmSound)
  const [alarmMinutesBefore, setAlarmMinutesBefore] = useState(initial.alarmMinutesBefore)

  const [existingAttachments, setExistingAttachments] = useState<AttachmentMeta[]>(initial.attachments)
  const [pendingAttachments, setPendingAttachments] = useState<{ meta: AttachmentMeta; file: File }[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([])
  const attachments: AttachmentMeta[] = [...existingAttachments, ...pendingAttachments.map((p) => p.meta)]

  const [voiceNoteChange, setVoiceNoteChange] = useState<Blob | null | undefined>(undefined)
  const [voiceNoteDuration, setVoiceNoteDuration] = useState<number | null>(initial.voiceNoteDuration)

  const [formError, setFormError] = useState<string | null>(null)

  const handleAddFiles = (files: FileList) => {
    const list = Array.from(files).map((file) => ({
      meta: {
        id: `pending-${crypto.randomUUID()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: Date.now()
      },
      file
    }))
    setPendingAttachments((prev) => [...prev, ...list])
  }

  const handleRemoveAttachment = (id: string) => {
    if (id.startsWith('pending-')) {
      setPendingAttachments((prev) => prev.filter((p) => p.meta.id !== id))
    } else {
      setExistingAttachments((prev) => prev.filter((a) => a.id !== id))
      setRemovedAttachmentIds((prev) => [...prev, id])
    }
  }

  const handleDownloadAttachment = async (meta: AttachmentMeta) => {
    if (meta.id.startsWith('pending-')) {
      const pending = pendingAttachments.find((p) => p.meta.id === meta.id)
      if (pending) {
        const url = URL.createObjectURL(pending.file)
        window.open(url, '_blank', 'noopener')
        setTimeout(() => URL.revokeObjectURL(url), 30_000)
      }
      return
    }
    const blob = await getAttachmentBlob(meta.id)
    if (blob) {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Inserisci un titolo.')
      return
    }
    if (alarmEnabled && (!date || !time)) {
      setFormError('Per impostare un avviso sonoro serve una data e un orario.')
      return
    }
    setFormError(null)

    const finalizedNewAttachments = pendingAttachments.map(({ meta, file }) => ({
      meta: { ...meta, id: meta.id.replace(/^pending-/, '') },
      file
    }))

    const item: AgendaItem = {
      ...initial,
      type,
      title: title.trim(),
      notes: notes.trim(),
      date: date || null,
      time: time || null,
      location: location.trim(),
      alarmEnabled,
      alarmSound,
      alarmMinutesBefore,
      attachments: [...existingAttachments, ...finalizedNewAttachments.map((a) => a.meta)],
      updatedAt: Date.now(),
      alarmFiredAt:
        alarmEnabled && (date !== initial.date || time !== initial.time) ? null : initial.alarmFiredAt,
      alarmDismissed: false
    }

    onSubmit({
      item,
      newAttachments: finalizedNewAttachments,
      removedAttachmentIds,
      voiceNoteChange,
      voiceNoteDuration
    })
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="type-toggle">
        <button
          type="button"
          className={type === 'appuntamento' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setType('appuntamento')}
        >
          📅 Appuntamento
        </button>
        <button
          type="button"
          className={type === 'nota' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setType('nota')}
        >
          📝 Nota
        </button>
      </div>

      <div className="field">
        <label htmlFor="title">Titolo</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'appuntamento' ? 'Es. Visita dal dentista' : 'Es. Comprare il regalo'}
          autoFocus
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="date">Data {type === 'nota' && '(opzionale)'}</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="time">Ora {type === 'nota' && '(opzionale)'}</label>
          <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      {type === 'appuntamento' && (
        <div className="field">
          <label htmlFor="location">Luogo</label>
          <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Es. Studio medico, Via Roma 1" />
        </div>
      )}

      <div className="field">
        <label htmlFor="notes">Note</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="field alarm-field">
        <label className="checkbox-label">
          <input type="checkbox" checked={alarmEnabled} onChange={(e) => setAlarmEnabled(e.target.checked)} />
          🔔 Avviso sonoro
        </label>
        {alarmEnabled && (
          <div className="alarm-options">
            <select value={alarmSound} onChange={(e) => setAlarmSound(e.target.value as AlarmSoundId)}>
              {ALARM_SOUNDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn secondary small" onClick={() => playAlertSound(alarmSound)}>
              ▶️ Prova
            </button>
            <label className="minutes-before">
              Anticipo (min)
              <input
                type="number"
                min={0}
                max={1440}
                value={alarmMinutesBefore}
                onChange={(e) => setAlarmMinutesBefore(Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </label>
          </div>
        )}
      </div>

      <VoiceNoteRecorder
        existingVoiceNoteId={initial.voiceNoteId}
        existingDuration={initial.voiceNoteDuration}
        onChange={(blob, duration) => {
          setVoiceNoteChange(blob)
          setVoiceNoteDuration(duration)
        }}
      />

      <AttachmentInput
        attachments={attachments}
        onAdd={handleAddFiles}
        onRemove={handleRemoveAttachment}
        onDownload={handleDownloadAttachment}
      />

      {formError && <p className="error-text">{formError}</p>}

      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Annulla
        </button>
        <button type="submit" className="btn primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
