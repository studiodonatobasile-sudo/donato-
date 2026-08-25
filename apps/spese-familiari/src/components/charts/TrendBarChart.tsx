import { useState } from 'react'
import type { DayPoint } from '../../utils/summary'
import { formatCurrency } from '../../utils/format'
import { formatDayShort, toDate } from '../../utils/dateUtils'

interface Props {
  data: DayPoint[]
}

const HEIGHT = 110

/** Grafico a barre per l'andamento delle spese giorno per giorno, con tooltip al passaggio del mouse. */
export function TrendBarChart({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.total), 0.01)
  const barWidth = 100 / data.length
  const compact = data.length > 9

  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        preserveAspectRatio="none"
        className="trend-chart-svg"
        role="img"
        aria-label="Andamento delle spese giorno per giorno"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={100} y1={HEIGHT * (1 - f)} y2={HEIGHT * (1 - f)} className="trend-gridline" />
        ))}
        {data.map((d, i) => {
          const h = max > 0 ? (d.total / max) * (HEIGHT - 4) : 0
          const x = i * barWidth
          return (
            <rect
              key={d.date}
              x={x + barWidth * 0.18}
              y={HEIGHT - h}
              width={Math.max(barWidth * 0.64, 0.6)}
              height={h}
              className={hover === i ? 'trend-bar hovered' : 'trend-bar'}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((v) => (v === i ? null : v))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((v) => (v === i ? null : v))}
              tabIndex={0}
            >
              <title>
                {formatDayShort(d.date)}: {formatCurrency(d.total)}
              </title>
            </rect>
          )
        })}
      </svg>
      {!compact && (
        <div className="trend-labels">
          {data.map((d, i) => (
            <span key={d.date} className={hover === i ? 'trend-label active' : 'trend-label'}>
              {formatDayShort(d.date).split(' ')[0]}
            </span>
          ))}
        </div>
      )}
      {compact && (
        <div className="trend-labels">
          {data.map((d, i) => (
            <span key={d.date} className={hover === i ? 'trend-label active' : 'trend-label'}>
              {i % 5 === 0 ? toDate(d.date).getDate() : ''}
            </span>
          ))}
        </div>
      )}
      <div className="trend-tooltip" aria-live="polite">
        {hover !== null ? (
          <>
            <strong>{formatDayShort(data[hover].date)}</strong> — {formatCurrency(data[hover].total)}
          </>
        ) : (
          <span className="hint">Passa il mouse sulle barre per i dettagli</span>
        )}
      </div>
    </div>
  )
}
