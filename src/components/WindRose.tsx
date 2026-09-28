import { useT } from '@/i18n'
import { compassPoint } from '@/lib/geo'
import type { LegScore } from '@/model/types'

const R = 34
const pointAt = (deg: number, radius: number): [number, number] => {
  const t = ((deg - 90) * Math.PI) / 180
  return [50 + radius * Math.cos(t), 50 + radius * Math.sin(t)]
}

/** Where the wind is pushing you, relative to where you are pointing. */
export function WindRose({ leg, bearing }: { leg: LegScore; bearing: number | null }) {
  const t = useT()
  const to = (leg.rec.windDir + 180) % 360 // the direction the wind blows toward
  const [wx1, wy1] = pointAt(to + 180, R - 2)
  const [wx2, wy2] = pointAt(to, R - 15)
  const [hx, hy] = pointAt(bearing ?? 0, R - 6)

  const colour = leg.wind.head < -2 ? '#34d399' : leg.wind.head > 2 ? '#fb7185' : '#fbbf24'

  return (
    <svg viewBox="0 0 100 108" className="w-full overflow-visible"
         role="img" aria-label={t.windRose.label}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="1.5" />
      <line x1="50" y1={50 - R} x2="50" y2={50 + R} stroke="var(--line-soft)" />
      <line x1={50 - R} y1="50" x2={50 + R} y2="50" stroke="var(--line-soft)" />

      <path d={`M${wx1.toFixed(1)} ${wy1.toFixed(1)} L${wx2.toFixed(1)} ${wy2.toFixed(1)}`}
            stroke={colour} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <circle cx={wx2.toFixed(1)} cy={wy2.toFixed(1)} r="3.4" fill={colour} />

      {bearing == null ? (
        <circle cx="50" cy="50" r={R - 12} fill="none" stroke="var(--color-ink-3)"
                strokeWidth="2" strokeDasharray="3 5" opacity="0.7" />
      ) : (
        <>
          <path d={`M50 50 L${hx.toFixed(1)} ${hy.toFixed(1)}`}
                stroke="var(--color-ink-3)" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx={hx.toFixed(1)} cy={hy.toFixed(1)} r="4" fill="currentColor" />
        </>
      )}

      <text x="50" y="12" textAnchor="middle" fontSize="9" fill="var(--color-ink-3)">{t.cardinals.n}</text>
      <text x="50" y="104" textAnchor="middle" fontSize="9" fill="var(--color-ink-3)"
            letterSpacing="0.06em">
        {bearing == null ? t.windRose.noBearing : t.windRose.riding(compassPoint(bearing, t.compass))}
      </text>
    </svg>
  )
}
