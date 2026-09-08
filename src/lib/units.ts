export type Units = 'metric' | 'imperial'

const cToF = (c: number) => (c * 9) / 5 + 32
const kmhToMph = (k: number) => k * 0.621371
const kmToMi = (k: number) => k * 0.621371
const mToFt = (m: number) => m * 3.28084

export const round = (v: number, d = 0) => {
  const m = 10 ** d
  return Math.round(v * m) / m
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const isMetric = (u: Units) => u === 'metric'

export const fmtTemp = (c: number | null | undefined, u: Units, d = 0) =>
  c == null ? '–' : `${round(isMetric(u) ? c : cToF(c), d)}°`

export const fmtSpeed = (k: number | null | undefined, u: Units) =>
  k == null ? '–' : `${Math.round(isMetric(u) ? k : kmhToMph(k))} ${isMetric(u) ? 'km/h' : 'mph'}`

export const fmtSpeedValue = (k: number, u: Units) =>
  `${Math.round(isMetric(u) ? k : kmhToMph(k))}`

export const fmtDist = (km: number, u: Units) =>
  isMetric(u) ? `${round(km, 1)} km` : `${round(kmToMi(km), 1)} mi`

export const fmtElevation = (m: number, u: Units) =>
  isMetric(u) ? `${Math.round(m)} m` : `${Math.round(mToFt(m))} ft`

/** Continuous red → teal ramp, used everywhere a score is drawn. */
const STOPS: [number, [number, number, number]][] = [
  [0, [225, 29, 72]],
  [30, [249, 115, 22]],
  [50, [250, 204, 21]],
  [70, [163, 230, 53]],
  [85, [52, 211, 153]],
  [100, [45, 212, 191]],
]

const hex = (rgb: number[]) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`

export function scoreColor(score: number): string {
  const s = clamp(score, 0, 100)
  for (let i = 1; i < STOPS.length; i++) {
    const [hi, cHi] = STOPS[i]
    if (s <= hi) {
      const [lo, cLo] = STOPS[i - 1]
      const t = (s - lo) / (hi - lo)
      return hex(cLo.map((c, k) => Math.round(lerp(c, cHi[k], t))))
    }
  }
  return hex(STOPS[STOPS.length - 1][1])
}
