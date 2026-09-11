import { dayLabel } from '@/lib/time'
import { fmtTemp, scoreColor } from '@/lib/units'
import { weatherIcon, weatherInfo } from '@/lib/weather-codes'
import { verdict } from '@/model/score'
import type { Commute, DayRecord, RideSettings, WeatherModel } from '@/model/types'
import { Card, CardHead } from './ui/Card'

interface Props {
  model: WeatherModel
  week: (DayRecord & { commute: Commute })[]
  settings: RideSettings
  activeDate: string
  onPick: (date: string) => void
}

export function WeekOutlook({ model, week, settings, activeDate, onPick }: Props) {
  // Air-quality models run out well before the weather forecast does; days
  // past that point are scored without an air term, and should say so.
  const lastScored = week[week.length - 1]?.date
  const airNote = model.airUntil && lastScored && model.airUntil < lastScored
    ? `Air quality is only forecast to ${dayLabel(model.airUntil, model.today, true)} —`
      + ' later days are scored without it.'
    : null

  return (
    <Card>
      <CardHead title="Week ahead" note="Scored for your commute hours, both legs." />
      {airNote && <p className="-mt-2 mb-3 text-[0.78rem] text-ink-3">{airNote}</p>}

      {/* Seven days never divide evenly into a phone-width grid — three
          columns leaves a lone orphan on the last row. A snapping strip shows
          them in order and lets the thumb do the work. */}
      <ol className="no-scrollbar week-strip -mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 sm:pb-0 lg:grid-cols-7">
        {week.map((day) => {
          const c = day.commute
          const colour = scoreColor(c.combined)
          const info = weatherInfo(day.code)
          const Icon = weatherIcon(info.group, true)
          const active = day.date === activeDate

          return (
            <li key={day.date} className="min-w-[4.9rem] flex-1 snap-start sm:min-w-0">
              <button
                type="button"
                onClick={() => onPick(day.date)}
                aria-pressed={active}
                className="flex w-full flex-col items-center gap-1.5 rounded-2xl border bg-card-2 px-2 py-3 transition hover:-translate-y-0.5 hover:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict"
                style={{ borderColor: active ? colour : 'var(--line-soft)' }}
              >
                <span className="text-[0.72rem] uppercase tracking-[0.06em] text-ink-3">
                  {dayLabel(day.date, model.today)}
                </span>
                <Icon size={22} className="text-ink-2" />
                <span
                  className="score-ink font-display text-xl font-bold tracking-tighter"
                  style={{ color: colour, fontVariationSettings: "'wdth' 106" }}
                >
                  {c.combined}
                </span>
                <span className="flex w-full gap-[3px]" aria-hidden>
                  <i className="h-1 flex-1 rounded-full" style={{ background: scoreColor(c.out.score) }} />
                  <i className="h-1 flex-1 rounded-full" style={{ background: scoreColor(c.back.score) }} />
                </span>
                <span className="text-[0.73rem] text-ink-3">
                  <b className="font-semibold text-ink-2">{fmtTemp(day.tmax, settings.units)}</b>
                  {' / '}{fmtTemp(day.tmin, settings.units)}
                </span>
                <span className="whitespace-nowrap rounded-full bg-card px-2 py-0.5 text-[0.68rem] text-ink-2">
                  {verdict(c.combined, c.blockers).word}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
