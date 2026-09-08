import type { Place, WindComponents } from '@/lib/geo'
import type { Units } from '@/lib/units'

export interface HourRecord {
  t: string
  temp: number
  feels: number
  rh: number
  precipProb: number
  precip: number
  snow: number
  code: number
  vis: number | null
  wind: number
  windDir: number
  gust: number
  uv: number
  isDay: boolean
  pm25: number | null
  aqi: number | null
  aqiScale: 'EU' | 'US'
  /** Rain that fell in the previous three hours — the road is still wet. */
  wet3: number
}

export interface DayRecord {
  date: string
  code: number
  tmax: number
  tmin: number
  precip: number
  windMax: number
  gustMax: number
  sunrise: string | null
  sunset: string | null
}

export interface WeatherModel {
  hours: Map<string, HourRecord>
  allTimes: string[]
  days: DayRecord[]
  today: string
  now: string
  timezone: string
  fetchedAt: number
  /** Last date with any air-quality data — CAMS runs out before the forecast. */
  airUntil: string | null
}

export interface Factor {
  key: string
  label: string
  /** Positive is a penalty, negative is a credit. */
  points: number
  note: string
}

export type LegDirection = 'out' | 'back'

export interface LegScore {
  iso: string
  direction: LegDirection
  rec: HourRecord
  score: number
  /** Wind chill at riding speed, including the headwind you are riding into. */
  feel: number
  wind: WindComponents
  factors: Factor[]
  blockers: string[]
  /** Metres actually climbed on this leg, not the difference between the ends. */
  ascentM: number
  descentM: number
  /** Average climbing gradient, as a percentage. */
  gradient: number
  minutes: number
}

export interface Commute {
  date: string
  out: LegScore
  back: LegScore
  combined: number
  blockers: string[]
}

export type ProfileKey = 'fair' | 'regular' | 'all' | 'hardened'
export type ThemeChoice = 'auto' | 'dark' | 'light'

export interface RideSettings {
  from: Place | null
  to: Place | null
  /** Used only when there is no destination to derive a bearing from. */
  manualBearing: number | null
  manualDistanceKm: number
  outTime: string
  backTime: string
  speedKmh: number
  profile: ProfileKey
  units: Units
  clock12: boolean
  theme: ThemeChoice
  fenders: boolean
  lights: boolean
  ebike: boolean
}
