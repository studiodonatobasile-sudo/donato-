import type { AgendaItem } from '../types'

interface Props {
  alerts: AgendaItem[]
  onDismiss: (id: string) => void
}

export function ActiveAlertsBanner({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null
  return (
    <div className="active-alerts">
      {alerts.map((item) => (
        <div key={item.id} className="active-alert-row">
          <span>
            🔔 {item.type === 'appuntamento' ? 'Appuntamento' : 'Nota'}: <strong>{item.title}</strong>
            {item.time && ` — ${item.time}`}
          </span>
          <button type="button" className="btn primary small" onClick={() => onDismiss(item.id)}>
            Ho capito, silenzia
          </button>
        </div>
      ))}
    </div>
  )
}
