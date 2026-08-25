interface Props {
  label: string
  value: string
  delta?: { fraction: number; comparisonLabel: string } | null
}

/** Riquadro con un numero grande in evidenza (totale periodo) ed eventuale variazione. */
export function StatTile({ label, value, delta }: Props) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(delta.fraction)
  const increased = hasDelta && delta!.fraction > 0.005
  const decreased = hasDelta && delta!.fraction < -0.005

  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hasDelta && (increased || decreased) && (
        <span className={increased ? 'stat-delta up' : 'stat-delta down'}>
          {increased ? '▲' : '▼'} {Math.abs(Math.round(delta!.fraction * 100))}% {delta!.comparisonLabel}
        </span>
      )}
      {hasDelta && !increased && !decreased && <span className="stat-delta neutral">= {delta!.comparisonLabel}</span>}
    </div>
  )
}
