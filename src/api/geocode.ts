/*
 * Geocoding.
 *
 * Open-Meteo's geocoder only knows populated places, so it can find
 * "Strasbourg" but never "1 rue Saglio" — and it has no reverse lookup at all,
 * which is why an earlier version of this app labelled coordinates from their
 * timezone and cheerfully called Strasbourg "Paris".
 *
 * Photon (Komoot's OpenStreetMap geocoder) is built for search-as-you-type,
 * resolves house numbers, and does reverse. It is keyless and CORS-enabled.
 * Open-Meteo stays as a fallback so town search still works if Photon is down.
 */

import { z } from 'zod'
import type { Lang } from '@/i18n/detect'
import type { LatLon, Place } from '@/lib/geo'
import { searchPlacesOpenMeteo } from './open-meteo'

const PHOTON = 'https://photon.komoot.io'

const FeatureSchema = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    osm_id: z.number().optional(),
    osm_type: z.string().optional(),
    name: z.string().optional(),
    housenumber: z.string().optional(),
    street: z.string().optional(),
    postcode: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    county: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
})

const PhotonSchema = z.object({ features: z.array(FeatureSchema) })

function toPlace(f: z.infer<typeof FeatureSchema>): Place {
  const p = f.properties
  const [lon, lat] = f.geometry.coordinates

  const street = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street
  const name = street ?? p.name ?? p.city ?? p.county ?? 'Unnamed place'

  // Everything below the name that helps tell it apart, without repeating it.
  const context = [p.district, p.city, p.state, p.country]
    .filter((v): v is string => Boolean(v) && v !== name)
    .filter((v, i, all) => all.indexOf(v) === i)
    .slice(0, 3)
    .join(', ')

  return {
    id: p.osm_id ? `${p.osm_type ?? 'n'}${p.osm_id}` : `${lat},${lon}`,
    name,
    context: context || undefined,
    lat,
    lon,
  }
}

async function photon(path: string, params: Record<string, string | number>, signal?: AbortSignal) {
  const res = await fetch(`${PHOTON}${path}?${new URLSearchParams(params as Record<string, string>)}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!res.ok) throw new Error(`Photon replied ${res.status}`)
  return PhotonSchema.parse(await res.json())
}

/**
 * Address-level search. `near` biases results toward a point — with a start
 * already set, typing a street name finds the one in your own town rather than
 * the identically named one four hundred kilometres away.
 */
export async function searchPlaces(
  query: string,
  lang: Lang,
  near?: LatLon | null,
  signal?: AbortSignal,
): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []

  try {
    const body = await photon('/api/', {
      q,
      limit: 8,
      lang,
      ...(near ? { lat: near.lat.toFixed(4), lon: near.lon.toFixed(4) } : {}),
    }, signal)
    // OSM often holds the same address as several objects (a node and a way,
    // or one per street segment). They are the same destination to a cyclist.
    const seen = new Set<string>()
    const places = body.features.map(toPlace).filter((p) => {
      const fingerprint = `${p.name}|${p.context ?? ''}`.toLowerCase()
      if (seen.has(fingerprint)) return false
      seen.add(fingerprint)
      return true
    })
    if (places.length) return places
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    // fall through to the town-level geocoder
  }
  return searchPlacesOpenMeteo(q, lang, signal)
}

/** Coordinates → the nearest named thing. Used by "use my current location". */
export async function reverseGeocode(
  point: LatLon, lang: Lang, signal?: AbortSignal,
): Promise<Place | null> {
  try {
    const body = await photon('/reverse', {
      lat: point.lat.toFixed(5),
      lon: point.lon.toFixed(5),
      lang,
      limit: 1,
    }, signal)
    const first = body.features[0]
    if (!first) return null
    const place = toPlace(first)
    // Prefer the town over whatever building happens to be nearest.
    const locality = first.properties.city ?? first.properties.district
    return locality ? { ...place, name: locality, context: contextBelow(first, locality) } : place
  } catch {
    return null
  }
}

function contextBelow(f: z.infer<typeof FeatureSchema>, name: string) {
  const p = f.properties
  return [p.state, p.country].filter((v): v is string => Boolean(v) && v !== name).join(', ') || undefined
}
