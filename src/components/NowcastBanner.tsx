import { CloudRain, Umbrella } from 'lucide-react'
import { clamp } from '@/lib/units'
import type { Nowcast } from '@/model/nowcast'

/**
 * The next two hours from radar-assimilated data. Only appears when there is
 * something to say — a dry afternoon does not need a banner about it.
 */
export function NowcastBanner({ nowcast }: { nowcast: Nowcast }) {
  const { rainingNow, startsInMin, stopsInMin, steps, peakMm } = nowcast
  if (!rainingNow && startsInMin == null) return null

  const headline = rainingNow
    ? stopsInMin != null
      ? `Raining now — easing in about ${round5(stopsInMin)} minutes`
      : 'Raining now, and not letting up within the hour'
    : `Rain starting in about ${round5(startsInMin!)} minutes`

  return (
    <div className="glass card-sheen flex flex-col gap-3 rounded-card border-amber-400/25 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-400">
          {rainingNow ? <Umbrella size={17} /> : <CloudRain size={17} />}
        </span>
        <div>
          <b className="block text-[0.92rem] font-semibold tracking-tight">{headline}</b>
          <span className="text-[0.78rem] text-ink-3">
            Radar nowcast, 15-minute steps · peak {peakMm.toFixed(1)} mm/h
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-end gap-[3px] sm:justify-end" aria-hidden>
        {steps.map((s) => (
          <span key={s.t} className="flex w-full max-w-8 flex-col items-center gap-1">
            <span className="flex h-8 w-full items-end">
              <i
                className="w-full rounded-sm bg-amber-400/70"
                style={{ height: `${clamp(s.mm * 45 + (s.mm > 0 ? 12 : 3), 3, 100)}%` }}
              />
            </span>
            <span className="text-[0.6rem] text-ink-3">
              {s.minutes <= 0 ? 'now' : `+${s.minutes}`}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

const round5 = (m: number) => Math.max(5, Math.round(m / 5) * 5)
