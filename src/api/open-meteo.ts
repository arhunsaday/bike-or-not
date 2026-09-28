/* Open-Meteo clients. No API key, no account, generous free tier. */

import type { z } from 'zod'
import type { Lang } from '@/i18n/detect'
import type { LatLon, Place } from '@/lib/geo'
import {
  AirQualitySchema, ConsensusSchema, ElevationSchema, ForecastSchema, GeocodeSchema,
} from './schemas'

const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const GEO = 'https://geocoding-api.open-meteo.com/v1/search'
const ELEVATION = 'https://api.open-meteo.com/v1/elevation'

const HOURLY = [
  'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
  'precipitation_probability', 'precipitation', 'snowfall', 'weather_code',
  'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m',
  'wind_gusts_10m', 'uv_index', 'is_day',
].join(',')

const DAILY = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
  'precipitation_probability_max', 'wind_speed_10m_max', 'wind_gusts_10m_max',
  'wind_direction_10m_dominant', 'sunrise', 'sunset', 'uv_index_max',
].join(',')

const CURRENT = ['temperature_2m', 'apparent_temperature', 'is_day', 'weather_code'].join(',')

/* Radar-assimilated short range: what is going to happen in the next two
   hours, at the resolution an hourly forecast smears away. */
const MINUTELY = ['precipitation', 'precipitation_probability', 'weather_code'].join(',')

async function getJSON<T extends z.ZodType>(
  url: string,
  params: Record<string, string | number>,
  schema: T,
  signal?: AbortSignal,
): Promise<z.infer<T>> {
  const res = await fetch(`${url}?${new URLSearchParams(params as Record<string, string>)}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!res.ok) throw new Error(`Open-Meteo replied ${res.status}`)
  const body: unknown = await res.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const reason = (body as { reason?: string })?.reason
    throw new Error(reason ?? 'Unexpected response from Open-Meteo')
  }
  return parsed.data
}

/**
 * Weather plus air quality for one point. Always requested in metric and
 * converted at render time, so switching units never triggers a refetch.
 */
export async function fetchConditions(point: LatLon, signal?: AbortSignal) {
  const common = { latitude: point.lat, longitude: point.lon, timezone: 'auto' }

  const forecast = getJSON(FORECAST, {
    ...common,
    hourly: HOURLY,
    daily: DAILY,
    current: CURRENT,
    minutely_15: MINUTELY,
    forecast_days: 7,
    past_days: 1, // wet-road memory: was it raining before you left?
    wind_speed_unit: 'kmh',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
  }, ForecastSchema, signal)

  // Air quality is a nice-to-have; never let it sink the whole request. It is
  // asked for the full week, but CAMS only actually reaches about five days —
  // the model marks the hours it has no data for rather than scoring them as
  // clean air.
  const air = getJSON(AIR, {
    ...common,
    hourly: 'pm2_5,european_aqi,us_aqi',
    forecast_days: 7,
  }, AirQualitySchema, signal).catch(() => null)

  return Promise.all([forecast, air]).then(([f, a]) => ({ forecast: f, air: a }))
}

/** Ground elevation for a set of points, for the gradient of a route. */
export async function fetchElevations(points: LatLon[], signal?: AbortSignal) {
  if (!points.length) return []
  const { elevation } = await getJSON(ELEVATION, {
    latitude: points.map((p) => p.lat.toFixed(5)).join(','),
    longitude: points.map((p) => p.lon.toFixed(5)).join(','),
  }, ElevationSchema, signal)
  return elevation
}

/** Town-level fallback for when Photon is unreachable. See api/geocode.ts. */
export async function searchPlacesOpenMeteo(
  query: string,
  lang: Lang,
  signal?: AbortSignal,
): Promise<Place[]> {
  if (query.trim().length < 2) return []
  const body = await getJSON(GEO, {
    name: query.trim(), count: 8, language: lang, format: 'json',
  }, GeocodeSchema, signal)

  return (body.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    context: [r.admin1, r.country].filter(Boolean).join(', ') || undefined,
    lat: r.latitude,
    lon: r.longitude,
  }))
}

/** Browser geolocation, promisified. Only ever called on an explicit tap. */
export function locateMe(timeout = 10_000): Promise<LatLon> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is unavailable'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Location request denied')),
      { enableHighAccuracy: false, timeout, maximumAge: 5 * 60 * 1000 },
    )
  })
}

/**
 * Independent numerical weather models, queried together so we can see where
 * they disagree. Open-Meteo's default "best match" is already a curated blend;
 * this is not a replacement for it but a measure of how much to trust it.
 */
export const MODELS = [
  { id: 'ecmwf_ifs025', name: 'ECMWF', centre: 'European Centre' },
  { id: 'icon_seamless', name: 'ICON', centre: 'Deutscher Wetterdienst' },
  { id: 'gfs_seamless', name: 'GFS', centre: 'NOAA' },
  { id: 'gem_seamless', name: 'GEM', centre: 'Environment Canada' },
  { id: 'ukmo_seamless', name: 'UKMO', centre: 'UK Met Office' },
  { id: 'meteofrance_seamless', name: 'ARPEGE', centre: 'Météo-France' },
] as const

export const CONSENSUS_VARIABLES = ['precipitation', 'temperature_2m', 'wind_speed_10m'] as const

export async function fetchConsensus(point: LatLon, signal?: AbortSignal) {
  return getJSON(FORECAST, {
    latitude: point.lat,
    longitude: point.lon,
    timezone: 'auto',
    hourly: CONSENSUS_VARIABLES.join(','),
    models: MODELS.map((m) => m.id).join(','),
    forecast_days: 7,
    wind_speed_unit: 'kmh',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
  }, ConsensusSchema, signal)
}
