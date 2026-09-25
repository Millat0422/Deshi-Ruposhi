import { useMemo, useState } from 'react';
import { formatDate, formatPrice } from '../../utils/format';

// Chart days are UTC dates ("2026-09-25"), so format them in UTC to avoid off-by-one days.
const dayLabel = (date, options = { month: 'short', day: 'numeric' }) => formatDate(date, { ...options, timeZone: 'UTC' });
const dayFull = (date) => dayLabel(date, { year: 'numeric', month: 'short', day: 'numeric' });

// Lightweight SVG bar chart (no chart library needed). One series: daily revenue.
export default function SalesChart({ data = [] }) {
  const [hover, setHover] = useState(null);
  const width = 720;
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 28, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const { max, ticks } = useMemo(() => {
    const peak = Math.max(...data.map((d) => d.revenue), 0);
    const step = peak <= 0 ? 50 : Math.pow(10, Math.floor(Math.log10(peak))) * (peak / Math.pow(10, Math.floor(Math.log10(peak))) > 5 ? 2 : 1);
    const top = Math.max(step, Math.ceil(peak / step) * step);
    const list = [];
    for (let v = 0; v <= top + 0.001; v += top / 4) list.push(v);
    return { max: top, ticks: list };
  }, [data]);

  if (data.length === 0) return <p className="muted">No sales data yet.</p>;

  const slot = innerW / data.length;
  const barW = Math.max(4, Math.min(28, slot - 4));
  const y = (v) => pad.top + innerH - (v / max) * innerH;
  const labelEvery = Math.ceil(data.length / 7);
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <figure className="chart">
      <div className="chart__wrap">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Daily revenue for the last ${data.length} days, total ${formatPrice(total)}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="chart__grid" />
              <text x={pad.left - 8} y={y(t)} className="chart__axis" textAnchor="end" dominantBaseline="middle">
                {t >= 1000 ? `$${(t / 1000).toFixed(1)}k` : `$${Math.round(t)}`}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = pad.left + i * slot + (slot - barW) / 2;
            const h = Math.max(0, pad.top + innerH - y(d.revenue));
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
                {/* wide invisible hit target */}
                <rect x={pad.left + i * slot} y={pad.top} width={slot} height={innerH} fill="transparent" />
                {h > 0 && (
                  <path
                    className={`chart__bar ${hover === i ? 'is-hover' : ''}`}
                    d={`M${x},${y(0)} V${y(d.revenue) + r} Q${x},${y(d.revenue)} ${x + r},${y(d.revenue)} H${x + barW - r} Q${x + barW},${y(d.revenue)} ${x + barW},${y(d.revenue) + r} V${y(0)} Z`}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={height - 8} className="chart__axis" textAnchor="middle">
                    {dayLabel(d.date)}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} className="chart__baseline" />
        </svg>
        {hover !== null && (
          <div className="chart__tooltip" style={{ left: `${((pad.left + hover * slot + slot / 2) / width) * 100}%` }}>
            <strong>{formatPrice(data[hover].revenue)}</strong>
            <span>
              {dayFull(data[hover].date)} · {data[hover].orders} orders
            </span>
          </div>
        )}
      </div>
      <details className="chart__table">
        <summary>View as table</summary>
        <table className="table table--compact">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Orders</th>
              <th scope="col">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{dayFull(d.date)}</td>
                <td>{d.orders}</td>
                <td>{formatPrice(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
