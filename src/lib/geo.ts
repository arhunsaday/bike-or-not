/* Spherical geometry for turning two addresses into a bearing and a distance. */

export interface LatLon {
  lat: number
  lon: number
}

export interface Place extends LatLon {
  id: string
  /** "1 Rue Saglio" for an address, "Strasbourg" for a town. */
  name: string
  /** Everything that disambiguates it: "Strasbourg, Grand Est, France". */
  context?: string
}

const R_KM = 6371.0088
const toRad = (d: number) => (d * Math.PI) / 180
const toDeg = (r: number) => (r * 180) / Math.PI
const norm360 = (d: number) => ((d % 360) + 360) % 360

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R_KM * Math.asin(Math.sqrt(s))
}

/**
 * Real roads are not straight. Urban route distance runs about 20–30% longer
 * than the crow flies; 1.25 is the usual planning figure and it keeps the
 * journey-time estimate honest without needing a routing engine.
 */
export const DETOUR_FACTOR = 1.25
export const routeDistanceKm = (a: LatLon, b: LatLon) => haversineKm(a, b) * DETOUR_FACTOR

/** Initial great-circle bearing from a to b, in degrees clockwise from north. */
export function initialBearing(a: LatLon, b: LatLon): number {
  const φ1 = toRad(a.lat)
  const φ2 = toRad(b.lat)
  const Δλ = toRad(b.lon - a.lon)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return norm360(toDeg(Math.atan2(y, x)))
}

/** Halfway along the great circle — where we ask for the weather. */
export function midpoint(a: LatLon, b: LatLon): LatLon {
  const φ1 = toRad(a.lat)
  const λ1 = toRad(a.lon)
  const φ2 = toRad(b.lat)
  const Δλ = toRad(b.lon - a.lon)
  const Bx = Math.cos(φ2) * Math.cos(Δλ)
  const By = Math.cos(φ2) * Math.sin(Δλ)
  const φ3 = Math.atan2(
    Math.sin(φ1) + Math.sin(φ2),
    Math.sqrt((Math.cos(φ1) + Bx) ** 2 + By ** 2),
  )
  const λ3 = λ1 + Math.atan2(By, Math.cos(φ1) + Bx)
  return { lat: toDeg(φ3), lon: norm360(toDeg(λ3) + 180) - 180 }
}

/** `points` is a sixteen-point compass, clockwise from north, in the rider's language. */
export const compassPoint = (deg: number, points: readonly string[]) =>
  points[Math.round(norm360(deg) / 22.5) % 16]

export const reciprocal = (deg: number) => norm360(deg + 180)

export interface WindComponents {
  /** Positive pushes back against you, negative is a shove from behind. */
  head: number
  /** Always positive — the sideways part that shoves you toward the kerb. */
  cross: number
  /** True when no bearing is known and the split is a 50/50 guess. */
  unknown: boolean
}

/**
 * Split a wind vector relative to a direction of travel.
 * `fromDeg` is meteorological: the direction the wind blows *from*.
 */
export function windComponents(
  speed: number,
  fromDeg: number,
  bearing: number | null,
): WindComponents {
  if (bearing == null) return { head: speed * 0.5, cross: speed * 0.5, unknown: true }
  const theta = toRad(norm360(fromDeg - bearing))
  return { head: speed * Math.cos(theta), cross: Math.abs(speed * Math.sin(theta)), unknown: false }
}

/* ------------------------------------------------------------ route paths */

/**
 * Decode an encoded polyline. Valhalla uses six decimal places, unlike the
 * five that Google's original format assumed.
 */
export function decodePolyline(encoded: string, precision = 6): LatLon[] {
  const factor = 10 ** precision
  const points: LatLon[] = []
  let index = 0
  let lat = 0
  let lon = 0

  while (index < encoded.length) {
    for (let axis = 0; axis < 2; axis++) {
      let result = 0
      let shift = 0
      let byte: number
      do {
        byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (axis === 0) lat += delta
      else lon += delta
    }
    points.push({ lat: lat / factor, lon: lon / factor })
  }
  return points
}

export interface RouteSegment {
  bearing: number
  km: number
}

/**
 * Reduce a dense polyline to segments of roughly `targetKm`, each with its own
 * bearing. Twenty-metre steps carry every wobble in the OSM geometry; a few
 * hundred metres captures the turns that actually change your wind exposure.
 */
export function pathSegments(points: LatLon[], targetKm = 0.3): RouteSegment[] {
  if (points.length < 2) return []
  const segments: RouteSegment[] = []
  let anchor = points[0]
  let run = 0

  for (let i = 1; i < points.length; i++) {
    run += haversineKm(points[i - 1], points[i])
    const last = i === points.length - 1
    if (run >= targetKm || last) {
      if (run > 0) segments.push({ bearing: initialBearing(anchor, points[i]), km: run })
      anchor = points[i]
      run = 0
    }
  }
  return segments
}

/**
 * Wind resolved along a whole route rather than a single straight-line
 * bearing. A commute that runs east then north meets the same wind two
 * different ways; weighting each segment by its length is the honest average.
 */
export function windAlongRoute(
  speed: number,
  fromDeg: number,
  segments: RouteSegment[],
  reverse = false,
): WindComponents {
  const total = segments.reduce((sum, s) => sum + s.km, 0)
  if (!total) return { head: speed * 0.5, cross: speed * 0.5, unknown: true }

  let head = 0
  let cross = 0
  for (const seg of segments) {
    const bearing = reverse ? norm360(seg.bearing + 180) : seg.bearing
    const c = windComponents(speed, fromDeg, bearing)
    head += c.head * seg.km
    cross += c.cross * seg.km
  }
  return { head: head / total, cross: cross / total, unknown: false }
}

/** Evenly spaced points along a path, for sampling elevation. */
export function samplePath(points: LatLon[], n: number): LatLon[] {
  if (points.length <= n) return points
  const cumulative = [0]
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + haversineKm(points[i - 1], points[i]))
  }
  const total = cumulative[cumulative.length - 1]
  const out: LatLon[] = []
  let j = 0
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1)
    while (j < cumulative.length - 1 && cumulative[j + 1] < target) j++
    out.push(points[j])
  }
  return out
}

export interface ElevationProfile {
  ascent: number
  descent: number
  net: number
}

/**
 * Total climbing along a profile, not just the difference between the ends.
 * A terrain model wobbles by a metre or two between samples, so changes below
 * `threshold` are treated as noise rather than hills — otherwise a flat route
 * accumulates phantom ascent.
 */
export function elevationProfile(elevations: number[], threshold = 2): ElevationProfile {
  if (elevations.length < 2) return { ascent: 0, descent: 0, net: 0 }
  let ascent = 0
  let descent = 0
  let reference = elevations[0]

  for (const e of elevations.slice(1)) {
    const delta = e - reference
    if (Math.abs(delta) < threshold) continue
    if (delta > 0) ascent += delta
    else descent -= delta
    reference = e
  }
  return { ascent, descent, net: elevations[elevations.length - 1] - elevations[0] }
}
