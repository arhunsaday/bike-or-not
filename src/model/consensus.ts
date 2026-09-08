/*
 * How much the world's forecasting centres actually agree.
 *
 * A single forecast gives you a number with no error bar. Six independent
 * models give you something better: a measure of how settled the situation is.
 * When ECMWF, ICON, GFS, GEM, UKMO and ARPEGE all put rain on your 08:00, that
 * is a different fact from four of them doing so — and the verdict should say
 * which one you are looking at.
 *
 * This never silently rewrites the score. It reports confidence alongside it.
 */

import type { z } from 'zod'
import type { ConsensusSchema } from '@/api/schemas'
import { MODELS } from '@/api/open-meteo'
import { clamp } from '@/lib/units'

type ConsensusPayload = z.infer<typeof ConsensusSchema>

export interface HourConsensus {
  /** Models that returned usable data for this hour. */
  models: number
  /** How many of them put measurable rain on it. */
  wetVotes: number
  tempSpread: number
  windSpread: number
  /** 0 (models contradict each other) → 1 (unanimous). */
  agreement: number
}

const WET_MM = 0.1

export function buildConsensus(payload: ConsensusPayload): Map<string, HourConsensus> {
  const hourly = payload.hourly
  const times = hourly.time as string[]
  const series = (variable: string, model: string) =>
    hourly[`${variable}_${model}`] as (number | null)[] | undefined

  const out = new Map<string, HourConsensus>()
  if (!Array.isArray(times)) return out

  times.forEach((t, i) => {
    const precip: number[] = []
    const temp: number[] = []
    const wind: number[] = []

    for (const m of MODELS) {
      const p = series('precipitation', m.id)?.[i]
      const tv = series('temperature_2m', m.id)?.[i]
      const w = series('wind_speed_10m', m.id)?.[i]
      // A model only votes if it actually covers this point and hour.
      if (p == null && tv == null && w == null) continue
      if (p != null) precip.push(p)
      if (tv != null) temp.push(tv)
      if (w != null) wind.push(w)
    }

    const models = Math.max(precip.length, temp.length, wind.length)
    if (models < 2) return

    const wetVotes = precip.filter((v) => v >= WET_MM).length
    const tempSpread = spread(temp)
    const windSpread = spread(wind)

    // Wet-or-dry is the call people actually care about, so it decides the
    // grade. A 50/50 split scores zero; unanimity either way scores one.
    // Temperature and wind spread can only shade it — six models agreeing on
    // rain is a confident forecast even if they argue about two degrees.
    const wetFraction = precip.length ? wetVotes / precip.length : 0.5
    const precipAgree = Math.abs(wetFraction - 0.5) * 2
    const spreadPenalty = clamp(tempSpread / 8, 0, 1) * 0.1 + clamp(windSpread / 25, 0, 1) * 0.1

    out.set(t, {
      models,
      wetVotes,
      tempSpread,
      windSpread,
      agreement: clamp(precipAgree - spreadPenalty, 0, 1),
    })
  })

  return out
}

const spread = (xs: number[]) => (xs.length < 2 ? 0 : Math.max(...xs) - Math.min(...xs))

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface Confidence {
  level: ConfidenceLevel
  pct: number
  headline: string
  detail: string
}

/** Confidence across both commute hours — reported at its weakest. */
export function commuteConfidence(
  map: Map<string, HourConsensus>,
  isos: string[],
): Confidence | null {
  const hours = isos.map((t) => map.get(t)).filter((h): h is HourConsensus => h != null)
  if (!hours.length) return null

  // Headline and grade must describe the same hour, or the chip contradicts
  // itself — "all six say rain" in the amber of a shaky forecast. We report
  // the hour we are least sure about, since that is the one that will catch
  // you out.
  const weakest = hours.reduce((a, b) => (a.agreement <= b.agreement ? a : b))
  const level: ConfidenceLevel =
    weakest.agreement >= 0.8 ? 'high' : weakest.agreement >= 0.5 ? 'medium' : 'low'

  const n = weakest.models
  const headline =
    weakest.wetVotes === 0 ? `All ${n} models say dry`
      : weakest.wetVotes === n ? `All ${n} models say rain`
        : `${weakest.wetVotes} of ${n} models expect rain`

  const other = hours.find((h) => h !== weakest)
  const bothAgree = !other || other.wetVotes === weakest.wetVotes

  const detail =
    `${headline}${bothAgree ? ' on both legs' : ` on the less certain leg (${other.wetVotes} of ${other.models} on the other)`}. ` +
    `Spread across models: ${weakest.tempSpread.toFixed(1)}° and ` +
    `${Math.round(weakest.windSpread)} km/h. ` +
    `Checked against ${MODELS.map((m) => m.name).join(', ')}.`

  return { level, pct: Math.round(weakest.agreement * 100), headline, detail }
}
