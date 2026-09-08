/*
 * Cycling routes.
 *
 * Valhalla's public FOSSGIS instance routes bicycles, is keyless and
 * CORS-enabled. It replaces three approximations at once: the straight-line
 * distance with a detour fudge factor, the single great-circle bearing, and
 * elevation measured only between the two endpoints.
 *
 * If it is unreachable the app degrades to the straight line it used before.
 */

import { z } from 'zod'
import {
  decodePolyline, elevationProfile, haversineKm, pathSegments, samplePath,
  type LatLon, type RouteSegment,
} from '@/lib/geo'
import { fetchElevations } from './open-meteo'

const VALHALLA = 'https://valhalla1.openstreetmap.de/route'

/** Elevation is sampled at this many points along the route. */
const ELEVATION_SAMPLES = 48

const RouteSchema = z.object({
  trip: z.object({
    summary: z.object({ length: z.number(), time: z.number() }),
    legs: z.array(z.object({ shape: z.string() })).min(1),
  }),
})

export interface CyclingRoute {
  distanceKm: number
  points: LatLon[]
  segments: RouteSegment[]
  ascentM: number
  descentM: number
  netM: number
  /** Valhalla's own estimate, kept only as a sanity check against ours. */
  routerMinutes: number
}

export async function fetchCyclingRoute(
  from: LatLon,
  to: LatLon,
  signal?: AbortSignal,
): Promise<CyclingRoute> {
  const query = new URLSearchParams({
    json: JSON.stringify({
      locations: [
        { lat: from.lat, lon: from.lon },
        { lat: to.lat, lon: to.lon },
      ],
      costing: 'bicycle',
      costing_options: { bicycle: { bicycle_type: 'Hybrid' } },
      directions_options: { units: 'kilometers' },
    }),
  })

  const res = await fetch(`${VALHALLA}?${query}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!res.ok) throw new Error(`Router replied ${res.status}`)

  const { trip } = RouteSchema.parse(await res.json())
  const points = decodePolyline(trip.legs[0].shape)
  if (points.length < 2) throw new Error('Router returned an empty route')

  const elevations = await fetchElevations(samplePath(points, ELEVATION_SAMPLES), signal)
  const profile = elevationProfile(elevations)

  return {
    distanceKm: trip.summary.length,
    points,
    segments: pathSegments(points),
    ascentM: profile.ascent,
    descentM: profile.descent,
    netM: profile.net,
    routerMinutes: Math.round(trip.summary.time / 60),
  }
}

/** Distance between two points as the crow flies, for the fallback path. */
export const straightLineKm = haversineKm
