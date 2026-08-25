interface Props {
  onOpenSettings: () => void
  onOpenSummary: () => void
}

export function Header({ onOpenSettings, onOpenSummary }: Props) {
  return (
    <header className="app-header">
      <h1>🗓️ Agenda Vocale</h1>
      <div className="header-actions">
        <button type="button" className="btn secondary" onClick={onOpenSummary}>
          ☀️ Riepilogo
        </button>
        <button type="button" className="icon-btn" aria-label="Impostazioni" onClick={onOpenSettings}>
          ⚙️
        </button>
      </div>
    </header>
  )
}
