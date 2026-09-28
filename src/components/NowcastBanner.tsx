import { CloudRain, Umbrella } from 'lucide-react'
import { useT } from '@/i18n'
import { clamp } from '@/lib/units'
import type { Nowcast } from '@/model/nowcast'

/**
 * The next two hours from radar-assimilated data. Only appears when there is
 * something to say — a dry afternoon does not need a banner about it.
 */
export function NowcastBanner({ nowcast }: { nowcast: Nowcast }) {
  const t = useT().nowcast
  const { rainingNow, startsInMin, stopsInMin, steps, peakMm } = nowcast
  if (!rainingNow && startsInMin == null) return null

  const headline = rainingNow
    ? stopsInMin != null
      ? t.rainingEasing(round5(stopsInMin))
      : t.rainingSteady
    : t.starting(round5(startsInMin!))

  return (
    <div className="glass card-sheen flex flex-col gap-3 rounded-card border-amber-400/25 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex items-start gap-3 sm:items-center">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-400 sm:mt-0">
          {rainingNow ? <Umbrella size={17} /> : <CloudRain size={17} />}
        </span>
        <div className="min-w-0">
          <b className="block text-[0.92rem] font-semibold tracking-tight text-pretty">
            {headline}
          </b>
          <span className="text-[0.78rem] text-ink-3">
            {t.source(peakMm)}
          </span>
        </div>
      </div>

      {/* Labelling all nine quarter-hours is unreadable on a phone, so only
          the half-hour marks are named. */}
      <div className="flex flex-1 items-end gap-1 sm:justify-end" aria-hidden>
        {steps.map((s, i) => (
          <span key={s.t} className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:max-w-9">
            <span className="flex h-9 w-full items-end">
              <i
                className="w-full rounded-sm bg-amber-400/70"
                style={{ height: `${clamp(s.mm * 45 + (s.mm > 0 ? 12 : 3), 3, 100)}%` }}
              />
            </span>
            <span className="h-3 text-[0.6rem] leading-3 text-ink-3">
              {i % 2 === 0 ? (s.minutes <= 0 ? t.now : `+${s.minutes}`) : ''}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

const round5 = (m: number) => Math.max(5, Math.round(m / 5) * 5)
