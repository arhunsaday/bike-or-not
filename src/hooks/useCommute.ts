import { useMemo } from 'react'
import { useConditions, useConsensus, useCyclingRoute, useElevations } from '@/api/queries'
import { initialBearing, midpoint, routeDistanceKm, type LatLon } from '@/lib/geo'
import { buildNowcast } from '@/model/nowcast'
import { buildModel, scoreCommute, weekOutlook, type RouteGeometry } from '@/model/score'
import type { RideSettings } from '@/model/types'
import { commuteConfidence, buildConsensus } from '@/model/consensus'
import { DEMO_POINT, useSettings } from '@/store/settings'
import { parseHHMM } from '@/lib/time'

/** Everything the page needs, derived from the route and one weather fetch. */
export function useCommute(activeDate: string | null) {
  const settings = useSettings()
  const { from, to } = settings

  // Ask for the weather halfway along the route — more representative than
  // either endpoint once the ride is more than a few kilometres.
  const point: LatLon = useMemo(
    () => (from && to ? midpoint(from, to) : from ?? DEMO_POINT),
    [from, to],
  )

  const conditions = useConditions(point)
  const consensus = useConsensus(point)
  const route = useCyclingRoute(from, to)

  // Endpoint elevations are only needed when the router could not help.
  const elevationPoints = useMemo(
    () => (from && to && route.isError ? [from, to] : []),
    [from, to, route.isError],
  )
  const elevations = useElevations(elevationPoints)

  const geo: RouteGeometry = useMemo(() => {
    if (from && to) {
      if (route.data) {
        return {
          bearing: initialBearing(from, to),
          distanceKm: route.data.distanceKm,
          segments: route.data.segments,
          ascentM: route.data.ascentM,
          descentM: route.data.descentM,
          source: 'route',
        }
      }
      // No router: straight line, and elevation only where the route ends.
      const [a, b] = elevations.data ?? []
      const net = a != null && b != null ? b - a : 0
      return {
        bearing: initialBearing(from, to),
        distanceKm: routeDistanceKm(from, to),
        segments: null,
        ascentM: Math.max(0, net),
        descentM: Math.max(0, -net),
        source: 'straight',
      }
    }
    return {
      bearing: settings.manualBearing,
      distanceKm: settings.manualDistanceKm,
      segments: null,
      ascentM: 0,
      descentM: 0,
      source: 'manual',
    }
  }, [from, to, route.data, elevations.data, settings.manualBearing, settings.manualDistanceKm])

  const nowcast = useMemo(
    () => (conditions.data ? buildNowcast(conditions.data.forecast) : null),
    [conditions.data],
  )

  const model = useMemo(() => {
    if (!conditions.data) return null
    return buildModel(conditions.data.forecast, conditions.data.air, conditions.dataUpdatedAt)
  }, [conditions.data, conditions.dataUpdatedAt])

  // A date only counts if this location's forecast actually covers it. Moving
  // the route to another timezone can leave the previously selected day in the
  // past — and `past_days: 1` means it would quietly score against yesterday's
  // weather instead of failing.
  const date = model
    ? (activeDate && model.days.some((d) => d.date === activeDate)
        ? activeDate
        : defaultDate(model.now, model.today, model.days.map((d) => d.date), settings))
    : null

  const consensusMap = useMemo(
    () => (consensus.data ? buildConsensus(consensus.data) : undefined),
    [consensus.data],
  )

  const commute = useMemo(
    () => (model && date ? scoreCommute(model, date, settings, geo, consensusMap) : null),
    [model, date, settings, geo, consensusMap],
  )

  const confidence = useMemo(() => {
    if (!consensusMap || !commute) return null
    return commuteConfidence(consensusMap, [commute.out.iso, commute.back.iso], settings.lang)
  }, [consensusMap, commute, settings.lang])

  const week = useMemo(
    () => (model ? weekOutlook(model, settings, geo, consensusMap) : []),
    [model, settings, geo, consensusMap],
  )

  return {
    settings,
    point,
    geo,
    model,
    date,
    commute,
    week,
    confidence,
    consensusMap,
    nowcast,
    routePending: from != null && to != null && route.isPending,
    routeFailed: route.isError,
    isDemo: !from,
    hasRoute: Boolean(from && to),

    isLoading: conditions.isPending,
    isFetching: conditions.isFetching,
    error: conditions.error,
    refetch: conditions.refetch,
  }
}

/** Today, unless the ride home has already happened. */
function defaultDate(now: string, today: string, dates: string[], s: RideSettings) {
  const nowHour = Number(now.slice(11, 13)) + Number(now.slice(14, 16)) / 60
  if (nowHour < parseHHMM(s.backTime) + 0.5) return today
  return dates[1] ?? today
}
