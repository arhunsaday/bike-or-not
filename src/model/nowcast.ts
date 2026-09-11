/*
 * The next two hours, at fifteen-minute resolution.
 *
 * An hourly forecast smears a shower that runs 08:20 to 08:40 across the whole
 * of 08:00. When you are standing at the door with a hand on the bike, that is
 * exactly the detail you need.
 */

import { differenceInMinutes, parseISO } from 'date-fns'
import type { Forecast } from '@/api/schemas'

const WET_MM = 0.1
const HORIZON_MIN = 120

export interface NowcastStep {
  t: string
  minutes: number
  mm: number
  prob: number
  code: number
}

export interface Nowcast {
  steps: NowcastStep[]
  rainingNow: boolean
  /** Minutes until rain starts, if it is dry now. */
  startsInMin: number | null
  /** Minutes until it stops, if it is raining now. */
  stopsInMin: number | null
  peakMm: number
}

export function buildNowcast(forecast: Forecast): Nowcast | null {
  const block = forecast.minutely_15
  if (!block) return null

  const now = parseISO(forecast.current.time)
  const all: NowcastStep[] = block.time.map((t, i) => ({
    t,
    minutes: differenceInMinutes(parseISO(t), now),
    mm: block.precipitation[i] ?? 0,
    prob: block.precipitation_probability[i] ?? 0,
    code: block.weather_code[i] ?? 0,
  }))

  // Exactly one step is "now" — the quarter-hour we are currently inside. On
  // the stroke of the quarter hour two steps qualify as non-future, and
  // keeping both labelled the strip with "now" twice.
  const current = all.findLastIndex((s) => s.minutes <= 0)
  const start = current === -1 ? all.findIndex((s) => s.minutes > 0) : current
  if (start === -1) return null

  const steps = all.slice(start).filter((s) => s.minutes <= HORIZON_MIN)
  if (steps.length < 2) return null

  const rainingNow = steps[0].mm >= WET_MM
  const firstWet = steps.find((s) => s.minutes > 0 && s.mm >= WET_MM)
  const firstDry = steps.find((s) => s.minutes > 0 && s.mm < WET_MM)

  return {
    steps,
    rainingNow,
    startsInMin: !rainingNow && firstWet ? firstWet.minutes : null,
    stopsInMin: rainingNow && firstDry ? firstDry.minutes : null,
    peakMm: Math.max(...steps.map((s) => s.mm)),
  }
}
