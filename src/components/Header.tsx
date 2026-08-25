interface Props {
  onOpenSettings: () => void
  onOpenSummary: () => void
}

export function Header({ onOpenSettings, onOpenSummary }: Props) {
  return (
    <header className="app-header">
      <h1>💶 Spese Familiari</h1>
      <div className="header-actions">
        <button type="button" className="icon-btn" title="Riepiloghi" onClick={onOpenSummary}>
          📊
        </button>
        <button type="button" className="icon-btn" title="Impostazioni" onClick={onOpenSettings}>
          ⚙️
        </button>
      </div>
    </header>
  )
}
