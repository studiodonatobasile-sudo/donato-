import { getCategory } from '../../types'
import type { CategoryTotal } from '../../utils/summary'
import { formatCurrency, formatPercent } from '../../utils/format'

interface Props {
  data: CategoryTotal[]
  total: number
}

const SIZE = 168
const STROKE = 26
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R
const GAP = 3 // spazio in unità SVG tra i segmenti, per non farli sembrare un unico blocco

/** Grafico a ciambella per la ripartizione delle spese per categoria, con legenda accessibile. */
export function CategoryDonutChart({ data, total }: Props) {
  if (total <= 0 || data.length === 0) {
    return <p className="hint">Nessuna spesa registrata in questo periodo.</p>
  }

  let cumulative = 0
  const segments = data.map((c) => {
    const fraction = c.total / total
    const length = Math.max(fraction * CIRC - GAP, 0)
    const offset = -cumulative
    cumulative += fraction * CIRC
    return { id: c.id, length, offset }
  })

  return (
    <div className="donut-chart">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Ripartizione spese per categoria, totale ${formatCurrency(total)}`}
      >
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--chart-track)" strokeWidth={STROKE} />
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {segments.map((s) => {
            const cat = getCategory(s.id)
            return (
              <circle
                key={s.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={`var(${cat.colorVar})`}
                strokeWidth={STROKE}
                strokeDasharray={`${s.length} ${Math.max(CIRC - s.length, 0)}`}
                strokeDashoffset={s.offset}
              />
            )
          })}
        </g>
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" className="donut-center-value">
          {formatCurrency(total)}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 16} textAnchor="middle" className="donut-center-label">
          totale
        </text>
      </svg>

      <ul className="chart-legend">
        {data.map((c) => {
          const cat = getCategory(c.id)
          const fraction = c.total / total
          return (
            <li key={c.id}>
              <span className="legend-swatch" style={{ background: `var(${cat.colorVar})` }} />
              <span className="legend-label">
                {cat.icon} {cat.label}
              </span>
              <span className="legend-value">{formatCurrency(c.total)}</span>
              <span className="legend-percent">{formatPercent(fraction)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
