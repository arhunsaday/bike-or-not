import { clamp, scoreColor } from '@/lib/units'
import type { LegScore } from '@/model/types'
import { useT } from '@/i18n'
import { Tooltip } from './ui/Tooltip'

function Bar({ label, pct, colour, value, note }: {
  label: string; pct: number; colour?: string; value: string; note?: string
}) {
  const row = (
    <div className="grid grid-cols-[4.6rem_minmax(0,1fr)_auto] items-center gap-2 text-[0.79rem]">
      <span className="truncate text-ink-2">{label}</span>
      <span className="h-[5px] overflow-hidden rounded-full bg-line">
        {/* Width is set outright and the fill grows via a CSS transform, so the
            bar is never stuck at zero when frames are not being delivered. */}
        <i
          className="bar-grow block h-full rounded-full"
          style={{ width: `${pct}%`, background: colour ?? '#34d399' }}
        />
      </span>
      <span className="text-[0.73rem] text-ink-3">{value}</span>
    </div>
  )
  return note ? <Tooltip label={note}>{row}</Tooltip> : row
}

export function FactorBars({ leg }: { leg: LegScore }) {
  const t = useT()
  const against = leg.factors.filter((f) => f.points > 0).slice(0, 3)
  const bonus = leg.factors.find((f) => f.points < 0)

  return (
    <div className="flex flex-col gap-1.5">
      {against.length === 0 && <Bar label={t.factors.clear} pct={100} value={t.factors.nothingAgainst} />}
      {against.map((f) => (
        <Bar
          key={f.key}
          label={f.label}
          pct={clamp((f.points / 45) * 100, 6, 100)}
          colour={scoreColor(clamp(100 - f.points * 2.1, 0, 100))}
          value={`−${Math.round(f.points)}`}
          note={f.note}
        />
      ))}
      {bonus && (
        <Bar label={bonus.label} pct={100} value={`+${Math.round(-bonus.points)}`} note={bonus.note} />
      )}
    </div>
  )
}
