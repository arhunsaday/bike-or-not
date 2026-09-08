/*
 * The bikeability model.
 *
 * Everything starts at 100 and loses points. Penalties are additive but each
 * one is capped individually, so a single bad factor can spoil a ride without
 * a mild-but-broad day collapsing to zero. A short list of hard blockers —
 * lightning, ice, violent gusts — overrides the arithmetic entirely.
 *
 * What makes this more than a rain check is that it knows your route. Wind is
 * resolved into head and cross components against the bearing from home to
 * work, and back again in the evening; elevation is resolved into a climb one
 * way and a descent the other. A 30 km/h wind is a gift going out and a wall
 * coming home, and no generic forecast will tell you which.
 */

import type { AirQuality, Forecast } from '@/api/schemas'
import { reciprocal, windAlongRoute, windComponents, type RouteSegment } from '@/lib/geo'
import { dayOf, hourOf, isoAt, parseHHMM } from '@/lib/time'
import { clamp } from '@/lib/units'
import type { HourConsensus } from './consensus'
import { PROFILES } from './profiles'
import type {
  Commute, DayRecord, Factor, HourRecord, LegDirection, LegScore, RideSettings, WeatherModel,
} from './types'

const STORM_CODES = new Set([95, 96, 99])
const FREEZING_CODES = new Set([56, 57, 66, 67])

const num = (a: (number | null)[] | undefined, i: number, fallback = 0) => a?.[i] ?? fallback

/* ------------------------------------------------------------------- model */

export function buildModel(
  forecast: Forecast,
  air: AirQuality | null,
  fetchedAt: number,
): WeatherModel {
  const h = forecast.hourly
  const times = h.time

  const airIdx = new Map<string, number>()
  air?.hourly.time.forEach((t, i) => airIdx.set(t, i))

  const hours = new Map<string, HourRecord>()
  times.forEach((t, i) => {
    const ai = airIdx.get(t)
    const eu = ai != null ? air?.hourly.european_aqi?.[ai] ?? null : null
    const us = ai != null ? air?.hourly.us_aqi?.[ai] ?? null : null
    hours.set(t, {
      t,
      temp: num(h.temperature_2m, i),
      feels: num(h.apparent_temperature, i, num(h.temperature_2m, i)),
      rh: num(h.relative_humidity_2m, i, 60),
      precipProb: num(h.precipitation_probability, i),
      precip: num(h.precipitation, i),
      snow: num(h.snowfall, i),
      code: num(h.weather_code, i),
      vis: h.visibility?.[i] ?? null,
      wind: num(h.wind_speed_10m, i),
      windDir: num(h.wind_direction_10m, i),
      gust: num(h.wind_gusts_10m, i, num(h.wind_speed_10m, i)),
      uv: num(h.uv_index, i),
      isDay: num(h.is_day, i) === 1,
      pm25: ai != null ? air?.hourly.pm2_5?.[ai] ?? null : null,
      aqi: eu ?? us,
      aqiScale: eu != null ? 'EU' : 'US',
      wet3: 0,
    })
  })

  // Wet-road memory: rain from three hours ago still means spray, slick paint
  // and greasy manhole covers even under a clear sky.
  times.forEach((t, i) => {
    let wet = 0
    for (let k = Math.max(0, i - 3); k < i; k++) wet += num(h.precipitation, k)
    hours.get(t)!.wet3 = wet
  })

  const now = forecast.current.time
  const today = dayOf(now)

  const days: DayRecord[] = []
  const d = forecast.daily
  d.time.forEach((date, i) => {
    if (date < today) return // past_days=1 gives us yesterday, needed only for wet3
    days.push({
      date,
      code: num(d.weather_code, i),
      tmax: num(d.temperature_2m_max, i),
      tmin: num(d.temperature_2m_min, i),
      precip: num(d.precipitation_sum, i),
      windMax: num(d.wind_speed_10m_max, i),
      gustMax: num(d.wind_gusts_10m_max, i),
      sunrise: d.sunrise[i] ?? null,
      sunset: d.sunset[i] ?? null,
    })
  })

  // CAMS stops well before the seven-day weather forecast does. Remember where
  // it ends so the UI can say so instead of quietly scoring later days as if
  // the air were clean.
  let airUntil: string | null = null
  for (const [t, rec] of hours) {
    if (rec.pm25 != null && (airUntil == null || t.slice(0, 10) > airUntil)) {
      airUntil = t.slice(0, 10)
    }
  }

  return {
    hours, allTimes: times, days, today, now,
    timezone: forecast.timezone, fetchedAt, airUntil,
  }
}

/* ----------------------------------------------------------------- scoring */

export interface RouteGeometry {
  /** Overall bearing from home to work; null when we only know one end. */
  bearing: number | null
  distanceKm: number
  /** Per-segment bearings from a real route, when we have one. */
  segments: RouteSegment[] | null
  /** Metres climbed and dropped on the outbound leg; the return swaps them. */
  ascentM: number
  descentM: number
  source: 'route' | 'straight' | 'manual'
}

/** Wind chill (JAG/TI) below 10 °C, humidity-aware apparent temp above it. */
function rideFeel(rec: HourRecord, airSpeed: number): number {
  const T = rec.temp
  if (T <= 10 && airSpeed >= 4.8) {
    const p = airSpeed ** 0.16
    return 13.12 + 0.6215 * T - 11.37 * p + 0.3965 * T * p
  }
  const relief = T > 22 ? clamp((airSpeed - 5) * 0.06, 0, 2.5) : 0
  return rec.feels - relief
}

/**
 * Journey time with wind and gradient taken into account. A headwind costs
 * roughly a third of its speed off yours; a tailwind gives back less than it
 * takes, and a 1% grade is worth about 1.6 km/h at commuting power.
 */
function estimateMinutes(
  s: RideSettings, distanceKm: number, head: number, gradient: number, wet: boolean,
): number {
  const base = s.speedKmh
  const drag = head > 0 ? head * (s.ebike ? 0.16 : 0.33) : head * 0.18
  const hill = gradient > 0
    ? gradient * (s.ebike ? 0.7 : 1.6)
    : gradient * 0.8
  const effective = clamp(base - drag - hill - (wet ? 1.5 : 0), 6, base * 1.4)
  return Math.max(1, Math.round((distanceKm / effective) * 60))
}

export type ConsensusMap = Map<string, HourConsensus>

export const legBearing = (geo: RouteGeometry, direction: LegDirection) =>
  geo.bearing == null ? null : direction === 'out' ? geo.bearing : reciprocal(geo.bearing)

export function scoreHour(
  rec: HourRecord,
  direction: LegDirection,
  geo: RouteGeometry,
  s: RideSettings,
  consensus?: ConsensusMap,
): LegScore {
  const P = PROFILES[s.profile]
  const back = direction === 'back'

  // With a real route the wind is resolved segment by segment; without one we
  // fall back to a single bearing, or to a 50/50 guess with no bearing at all.
  const resolve = (speed: number) => (geo.segments
    ? windAlongRoute(speed, rec.windDir, geo.segments, back)
    : windComponents(speed, rec.windDir, legBearing(geo, direction)))

  const wind = resolve(rec.wind)
  const gustComp = resolve(rec.gust)
  const airSpeed = Math.hypot(s.speedKmh + wind.head, wind.cross)
  const feel = rideFeel(rec, airSpeed)

  // You climb every metre of the ascent whichever way the ends compare, and
  // the return leg trades one for the other.
  const ascentM = back ? geo.descentM : geo.ascentM
  const descentM = back ? geo.ascentM : geo.descentM
  const gradient = geo.distanceKm > 0 ? (ascentM / (geo.distanceKm * 1000)) * 100 : 0
  const dropGradient = geo.distanceKm > 0 ? (descentM / (geo.distanceKm * 1000)) * 100 : 0

  const factors: Factor[] = []
  const add = (key: string, label: string, points: number, note: string) => {
    if (Math.abs(points) >= 0.5) factors.push({ key, label, points, note })
  }

  /* temperature */
  const [lo, hi] = P.band
  if (feel < lo) {
    add('cold', 'Cold', clamp((lo - feel) ** 1.25 * 1.5 / P.cold, 0, 42),
      `feels like ${Math.round(feel)}° at ${Math.round(s.speedKmh)} km/h`)
  } else if (feel > hi) {
    const humid = rec.rh > 70 ? 1.25 : 1
    add('heat', 'Heat', clamp((feel - hi) ** 1.2 * 1.8 * humid / P.heat, 0, 32),
      rec.rh > 70 ? `${Math.round(feel)}° and humid` : `feels like ${Math.round(feel)}°`)
  }

  /* precipitation */
  //
  // The headline forecast is a single model's view. When several independent
  // models put rain on this hour and the headline does not, we take the more
  // cautious of the two: an unused jacket costs you nothing, a soaking costs
  // you the day. The vote fraction is a legitimate probability in its own
  // right — it is how ensemble forecasting has always worked.
  const agreed = consensus?.get(rec.t)
  const votedProb = agreed && agreed.models >= 3 ? agreed.wetVotes / agreed.models : 0
  const headlineProb = (rec.precipProb || (rec.precip > 0.05 ? 80 : 0)) / 100
  const prob = Math.max(headlineProb, votedProb)
  const outvoted = votedProb > headlineProb + 0.15
  const mm = rec.precip
  const intensity = mm <= 0.05 ? 0 : mm < 0.4 ? 0.3 : mm < 1.2 ? 0.55 : mm < 3 ? 0.8 : 1
  let wetPts = 56 * prob * (0.38 + 0.62 * intensity)
  if (s.fenders && mm < 2) wetPts *= 0.85
  wetPts /= P.rain
  if (rec.snow > 0) wetPts += 14 + rec.snow * 9
  wetPts = clamp(wetPts, 0, 62)

  if (wetPts >= 0.5) {
    const note = rec.snow > 0
      ? `${rec.snow.toFixed(1)} cm of snow`
      : outvoted && agreed
        ? `${agreed.wetVotes} of ${agreed.models} models say rain`
        : mm > 0.05
          ? `${Math.round(prob * 100)}% chance, ${mm.toFixed(1)} mm/h`
          : `${Math.round(prob * 100)}% chance of rain`
    add('wet', rec.snow > 0 ? 'Snow' : 'Rain', wetPts, note)
  } else if (rec.wet3 > 0.3) {
    add('damp', 'Wet roads', clamp(rec.wet3 * 2.5, 0, 7), 'recent rain, surfaces still slick')
  }

  /* wind */
  let windPts = 0
  let windNote = ''
  if (wind.head > 3) {
    windPts += clamp(((wind.head - 3) / 2.6) ** 1.35 * (s.ebike ? 0.5 : 1) / P.wind, 0, 30)
    windNote = `${Math.round(wind.head)} km/h headwind`
  } else if (wind.head < -3) {
    windPts -= clamp((-wind.head - 3) * 0.25, 0, 5)
    windNote = `${Math.round(-wind.head)} km/h tailwind`
  }
  const gustDelta = gustComp.head - wind.head
  if (gustDelta > 12) {
    windPts += clamp((gustDelta - 12) * 0.85 / P.wind, 0, 16)
    windNote = `gusting to ${Math.round(rec.gust)} km/h`
  }
  if (wind.cross > 22) {
    windPts += clamp((wind.cross - 22) * 0.55 / P.wind, 0, 12)
    if (!windNote) windNote = `${Math.round(wind.cross)} km/h crosswind`
  }
  if (windPts > 0) add('wind', 'Wind', windPts, windNote || 'blustery')
  else if (windPts < 0) add('tailwind', 'Tailwind', windPts, windNote)

  /* gradient — a rolling route earns both a penalty and a credit */
  if (gradient > 0.4) {
    add('hill', 'Climb', clamp((gradient - 0.4) ** 1.15 * 6 * (s.ebike ? 0.35 : 1) / P.hill, 0, 18),
      `${Math.round(ascentM)} m of climbing at ${gradient.toFixed(1)}%`)
  }
  if (dropGradient > 0.6) {
    add('descent', 'Descent', -clamp((dropGradient - 0.6) * 2.2, 0, 6),
      `${Math.round(descentM)} m of free height`)
  }

  /* light and visibility */
  if (!rec.isDay) {
    add('dark', 'Darkness', s.lights ? 4 : clamp(24 / P.dark, 0, 26),
      s.lights ? 'dark, but you have lights' : 'dark and you have no lights')
  }
  if (rec.vis != null) {
    const v = rec.vis
    const pts = v < 400 ? 22 : v < 1200 ? 15 : v < 3000 ? 8 : v < 6000 ? 3 : 0
    if (pts) add('vis', 'Visibility', pts, `only ${(v / 1000).toFixed(1)} km of it`)
  }

  /* air and sun */
  if (rec.pm25 != null) {
    const pts = clamp((rec.pm25 - 12) * 0.9, 0, 24)
    if (pts) add('air', 'Air quality', pts, `PM2.5 ${Math.round(rec.pm25)} µg/m³`)
  }
  if (rec.isDay && rec.uv >= 8) {
    add('uv', 'UV', clamp((rec.uv - 8) * 2, 0, 8), `UV index ${rec.uv.toFixed(0)}`)
  }

  /* ice */
  const icy = rec.temp <= 1.5 &&
    (rec.wet3 > 0.1 || rec.precip > 0.05 || FREEZING_CODES.has(rec.code))
  if (icy) add('ice', 'Ice risk', 30, `${rec.temp.toFixed(0)}° with moisture on the road`)

  const blockers: string[] = []
  if (STORM_CODES.has(rec.code)) blockers.push('Thunderstorms in the area')
  if (rec.snow >= 1) blockers.push('Heavy snowfall')
  if (icy && rec.temp <= 0.5) blockers.push('Black-ice conditions')
  if (rec.gust >= 65) blockers.push(`Dangerous gusts (${Math.round(rec.gust)} km/h)`)
  if (rec.vis != null && rec.vis < 250) blockers.push('Near-zero visibility')

  const total = factors.reduce((sum, f) => sum + f.points, 0)
  let score = clamp(100 - total, 0, 100)
  if (blockers.length) score = Math.min(score, 10)

  factors.sort((a, b) => b.points - a.points)

  return {
    iso: rec.t,
    direction,
    rec,
    score: Math.round(score),
    feel,
    wind,
    factors,
    blockers,
    ascentM,
    descentM,
    gradient,
    minutes: estimateMinutes(s, geo.distanceKm, wind.head, gradient - dropGradient, rec.precip > 0.4),
  }
}

/* --------------------------------------------------------------- commutes */

/** Nearest available forecast hour at or after a wall-clock time on a date. */
export function hourAt(model: WeatherModel, date: string, hhmm: string): string | null {
  const base = Math.round(parseHHMM(hhmm))
  for (let i = 0; i < 6; i++) {
    const t = isoAt(date, base + i)
    if (model.hours.has(t)) return t
  }
  return null
}

export function scoreCommute(
  model: WeatherModel, date: string, s: RideSettings, geo: RouteGeometry,
  consensus?: ConsensusMap,
): Commute | null {
  const outIso = hourAt(model, date, s.outTime)
  const backIso = hourAt(model, date, s.backTime)
  if (!outIso || !backIso) return null

  const out = scoreHour(model.hours.get(outIso)!, 'out', geo, s, consensus)
  const back = scoreHour(model.hours.get(backIso)!, 'back', geo, s, consensus)

  const worst = Math.min(out.score, back.score)
  const best = Math.max(out.score, back.score)
  const blockers = [...new Set([...out.blockers, ...back.blockers])]

  // The worse leg carries most of the weight — a glorious ride home does not
  // undo a soaking on the way in. A blocker on either leg caps the whole day.
  let combined = Math.round(0.62 * worst + 0.38 * best)
  if (blockers.length) combined = Math.min(combined, 18)

  return { date, out, back, combined, blockers }
}

const TIERS: [number, string, string][] = [
  [88, 'Send it', 'Textbook commuting weather'],
  [72, 'Ride it', 'Nothing out there to stop you'],
  [56, 'Kit up', 'Rideable with the right layers'],
  [40, 'Your call', 'Doable, but you will feel it'],
  [24, 'Rough one', 'Only if you really want to'],
  [0, 'Not today', 'Take the bus and keep your dignity'],
]

/**
 * Turn a score plus its worst factor into a headline. Once a factor is worth
 * ten points it gets named even on a good day — "ride it, but it is going to
 * rain" is more use than a compliment about the weather.
 */
export function verdict(score: number, blockers: string[] = [], top?: Factor) {
  if (blockers.length) return { word: 'Not today', sub: blockers[0], score }
  const [, word, fallback] = TIERS.find(([min]) => score >= min)!
  const sub = top && top.points >= 10 ? `${top.label.toLowerCase()} — ${top.note}` : fallback
  return { word, sub, score }
}

export const topFactor = (c: Commute): Factor | undefined =>
  [...c.out.factors, ...c.back.factors].sort((a, b) => b.points - a.points)[0]

/* ---------------------------------------------------------------- windows */

/** Every forecast hour of a date, scored for the outbound direction. */
export function dayCurve(
  model: WeatherModel, date: string, s: RideSettings, geo: RouteGeometry,
  consensus?: ConsensusMap,
): LegScore[] {
  const out: LegScore[] = []
  for (let h = 0; h < 24; h++) {
    const rec = model.hours.get(isoAt(date, h))
    if (rec) out.push(scoreHour(rec, 'out', geo, s, consensus))
  }
  return out
}

export interface Window { start: number; end: number; avg: number; n: number }

/** Longest run of good hours in a window — "best stretch left today". */
export function bestWindow(
  curve: LegScore[], { from = 5, to = 23, minScore = 60 } = {},
): Window | null {
  const inRange = curve.filter((c) => hourOf(c.iso) >= from && hourOf(c.iso) <= to)
  if (!inRange.length) return null
  const peak = Math.max(...inRange.map((c) => c.score))
  const threshold = Math.max(minScore, peak - 12)

  let best: Window | null = null
  let run: Window | null = null
  for (const c of inRange) {
    const hour = hourOf(c.iso)
    if (c.score >= threshold) {
      run = run ?? { start: hour, end: hour, avg: 0, n: 0 }
      run.end = hour
      run.avg += c.score
      run.n += 1
    } else if (run) {
      if (!best || run.n > best.n) best = run
      run = null
    }
  }
  if (run && (!best || run.n > best.n)) best = run
  return best ? { ...best, avg: Math.round(best.avg / best.n) } : null
}

/**
 * If the chosen hour is poor, look for a nearby one that is clearly better.
 * Deliberately kept to a two-hour window: a suggestion nobody would act on is
 * just noise, and the ride-window chart already shows the whole day.
 */
export function suggestShift(
  model: WeatherModel, leg: LegScore, geo: RouteGeometry, s: RideSettings,
  consensus?: ConsensusMap, span = 2,
) {
  if (leg.score >= 70) return null
  const date = dayOf(leg.iso)
  const hour = hourOf(leg.iso)
  let best: (LegScore & { delta: number; gain: number }) | null = null

  for (let d = -span; d <= span; d++) {
    if (d === 0 || hour + d < 0 || hour + d > 23) continue
    const t = isoAt(date, hour + d)
    const rec = model.hours.get(t)
    if (!rec || t < model.now.slice(0, 13)) continue
    const candidate = scoreHour(rec, leg.direction, geo, s, consensus)
    if (candidate.score - leg.score >= 15 && (!best || candidate.score > best.score)) {
      best = { ...candidate, delta: d, gain: candidate.score - leg.score }
    }
  }
  return best
}

export function weekOutlook(
  model: WeatherModel, s: RideSettings, geo: RouteGeometry, consensus?: ConsensusMap,
) {
  return model.days
    .map((day) => {
      const commute = scoreCommute(model, day.date, s, geo, consensus)
      return commute ? { ...day, commute } : null
    })
    .filter((d): d is DayRecord & { commute: Commute } => d !== null)
}
