import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { LatLon } from '@/lib/geo'
import { fetchConditions, fetchConsensus, fetchElevations } from './open-meteo'
import { searchPlaces } from './geocode'
import { fetchCyclingRoute } from './routing'

/** Round the key so tiny coordinate jitter does not blow the cache. */
const key = (p: LatLon) => [p.lat.toFixed(3), p.lon.toFixed(3)]

export function useConditions(point: LatLon | null) {
  return useQuery({
    queryKey: ['conditions', point && key(point)],
    queryFn: ({ signal }) => fetchConditions(point!, signal),
    enabled: point != null,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}

/** Elevation changes on geological timescales; cache it effectively forever. */
export function useElevations(points: LatLon[]) {
  return useQuery({
    queryKey: ['elevation', points.map(key)],
    queryFn: ({ signal }) => fetchElevations(points, signal),
    enabled: points.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
}

export function usePlaceSearch(query: string, near?: LatLon | null) {
  return useQuery({
    queryKey: ['places', query.trim(), near && key(near)],
    queryFn: ({ signal }) => searchPlaces(query, near, signal),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

/** Model agreement. Purely additive — the page works without it. */
export function useConsensus(point: LatLon | null) {
  return useQuery({
    queryKey: ['consensus', point && key(point)],
    queryFn: ({ signal }) => fetchConsensus(point!, signal),
    enabled: point != null,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  })
}

/** A real cycling route. Roads don't move; cache it for the session. */
export function useCyclingRoute(from: LatLon | null, to: LatLon | null) {
  return useQuery({
    queryKey: ['route', from && key(from), to && key(to)],
    queryFn: ({ signal }) => fetchCyclingRoute(from!, to!, signal),
    enabled: from != null && to != null,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  })
}
