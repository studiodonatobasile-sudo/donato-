import { useEffect, useState } from 'react'
import type { AgendaItem, AttachmentMeta } from '../types'
import { getAttachmentBlob, getVoiceNoteBlob } from '../db'
import { formatDuration, formatFileSize, formatTimeLabel } from '../utils/dateUtils'

interface Props {
  item: AgendaItem
  onEdit: (item: AgendaItem) => void
  onDelete: (item: AgendaItem) => void
  onToggleDone: (item: AgendaItem) => void
}

async function openBlob(getBlob: () => Promise<Blob | undefined>) {
  const blob = await getBlob()
  if (!blob) return
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function ItemCard({ item, onEdit, onDelete, onToggleDone }: Props) {
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null)

  useEffect(() => {
    let revoke: string | null = null
    if (item.voiceNoteId) {
      getVoiceNoteBlob(item.voiceNoteId).then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          revoke = url
          setVoiceUrl(url)
        }
      })
    }
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [item.voiceNoteId])

  const overdue =
    !item.done && !!item.date && !!item.time && new Date(`${item.date}T${item.time}`).getTime() < Date.now()

  return (
    <div className={`item-card ${item.done ? 'done' : ''}`}>
      <div className="item-card-main">
        <button
          type="button"
          className="checkbox-circle"
          aria-label={item.done ? 'Segna come da fare' : 'Segna come completato'}
          onClick={() => onToggleDone(item)}
        >
          {item.done ? '✓' : ''}
        </button>
        <div className="item-card-body">
          <div className="item-card-title-row">
            <span className="item-type-badge">{item.type === 'appuntamento' ? '📅' : '📝'}</span>
            <span className="item-title">{item.title}</span>
            {item.alarmEnabled && <span title="Avviso sonoro attivo">🔔</span>}
            {overdue && <span className="overdue-badge">scaduto</span>}
          </div>
          <div className="item-meta">
            {item.time && <span>🕒 {formatTimeLabel(item.time)}</span>}
            {item.location && <span>📍 {item.location}</span>}
          </div>
          {item.notes && <p className="item-notes">{item.notes}</p>}

          {voiceUrl && (
            <div className="voice-note-row">
              <audio controls src={voiceUrl} />
              {item.voiceNoteDuration && <span className="hint">{formatDuration(item.voiceNoteDuration)}</span>}
            </div>
          )}

          {item.attachments.length > 0 && (
            <div className="attachment-chips">
              {item.attachments.map((att: AttachmentMeta) => (
                <button
                  type="button"
                  key={att.id}
                  className="attachment-chip"
                  onClick={() => openBlob(() => getAttachmentBlob(att.id))}
                  title={`${att.name} (${formatFileSize(att.size)})`}
                >
                  📎 {att.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="item-card-actions">
        <button type="button" className="icon-btn" aria-label="Modifica" onClick={() => onEdit(item)}>
          ✏️
        </button>
        <button type="button" className="icon-btn danger" aria-label="Elimina" onClick={() => onDelete(item)}>
          🗑️
        </button>
      </div>
    </div>
  )
}
