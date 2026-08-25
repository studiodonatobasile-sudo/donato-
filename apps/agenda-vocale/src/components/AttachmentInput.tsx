import { useRef } from 'react'
import type { AttachmentMeta } from '../types'
import { formatFileSize } from '../utils/dateUtils'

interface Props {
  attachments: AttachmentMeta[]
  onAdd: (files: FileList) => void
  onRemove: (id: string) => void
  onDownload: (meta: AttachmentMeta) => void
}

export function AttachmentInput({ attachments, onAdd, onRemove, onDownload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="field">
      <label>Documenti allegati</label>
      <div className="attachment-list">
        {attachments.length === 0 && <p className="hint">Nessun documento allegato.</p>}
        {attachments.map((att) => (
          <div className="attachment-row" key={att.id}>
            <button type="button" className="attachment-name" onClick={() => onDownload(att)}>
              📎 {att.name}
            </button>
            <span className="attachment-size">{formatFileSize(att.size)}</span>
            <button
              type="button"
              className="icon-btn danger"
              aria-label={`Rimuovi ${att.name}`}
              onClick={() => onRemove(att.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAdd(e.target.files)
            e.target.value = ''
          }
        }}
      />
      <button type="button" className="btn secondary" onClick={() => inputRef.current?.click()}>
        + Aggiungi documento
      </button>
    </div>
  )
}
