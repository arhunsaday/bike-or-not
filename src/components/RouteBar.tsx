import { ArrowLeftRight, Flag, Home, MoveRight, Mountain, Navigation, Route } from 'lucide-react'
import { useT } from '@/i18n'
import { compassPoint } from '@/lib/geo'
import { fmtDist, fmtElevation } from '@/lib/units'
import type { RouteGeometry } from '@/model/score'
import type { RideSettings } from '@/model/types'
import { useSettings } from '@/store/settings'
import { PlaceCombobox } from './PlaceCombobox'
import { SavedRoutes } from './SavedRoutes'
import { Card, IconButton } from './ui/Card'
import { Tooltip } from './ui/Tooltip'

interface Props {
  settings: RideSettings
  geo: RouteGeometry
  hasRoute: boolean
  routePending: boolean
}

export function RouteBar({ settings, geo, hasRoute, routePending }: Props) {
  const t = useT()
  const r = t.route
  const setEndpoint = useSettings((s) => s.setEndpoint)
  const swapRoute = useSettings((s) => s.swapRoute)

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <PlaceCombobox
          label={r.from}
          value={settings.from}
          onChange={(p) => setEndpoint('from', p)}
          placeholder={r.fromPlaceholder}
          icon={<Home size={15} />}
          allowLocate
          near={settings.to}
        />

        {/* Vertical between stacked fields on a phone, horizontal beside them
            on a wider screen — the same button either way. */}
        <IconButton
          onClick={swapRoute}
          aria-label={r.swap}
          title={r.swap}
          className="mb-0.5 self-center sm:self-end"
        >
          <ArrowLeftRight size={15} className="rotate-90 sm:rotate-0" />
        </IconButton>

        <PlaceCombobox
          label={r.to}
          value={settings.to}
          onChange={(p) => setEndpoint('to', p)}
          placeholder={r.toPlaceholder}
          icon={<Flag size={15} />}
          near={settings.from}
        />
      </div>

      {hasRoute ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line-soft pt-3 text-[0.8rem] text-ink-2">
          <Tooltip
            label={geo.source === 'route'
              ? r.distanceRouted
              : r.distanceStraight}
          >
            <span className="flex items-center gap-1.5">
              <Route size={13} className="text-ink-3" />
              <b className="font-semibold text-ink">
                {routePending ? '…' : fmtDist(geo.distanceKm, settings.units, settings.lang)}
              </b>
              {r.eachWay}
              {geo.source === 'straight' && <span className="text-ink-3">{r.estimated}</span>}
            </span>
          </Tooltip>

          <Tooltip label={geo.segments
            ? r.segments(geo.segments.length)
            : r.bearingHint}>
            <span className="flex items-center gap-1.5">
              <Navigation
                size={13}
                className="text-ink-3"
                style={{ transform: `rotate(${geo.bearing ?? 0}deg)` }}
              />
              {r.heading} <b className="font-semibold text-ink">{compassPoint(geo.bearing ?? 0, t.compass)}</b>
              <span className="text-ink-3">({Math.round(geo.bearing ?? 0)}°)</span>
            </span>
          </Tooltip>

          <Tooltip label={geo.source === 'route'
            ? r.climbRouted
            : r.climbStraight}>
            <span className="flex items-center gap-1.5">
              <Mountain size={13} className="text-ink-3" />
              {routePending ? (
                <span className="text-ink-3">{r.measuring}</span>
              ) : geo.ascentM < 5 && geo.descentM < 5 ? (
                <span>{r.flat}</span>
              ) : (
                <>
                  <b className="font-semibold text-ink">
                    ↑{fmtElevation(geo.ascentM, settings.units)}
                  </b>
                  <span className="text-ink-3">
                    {r.descentOut(fmtElevation(geo.descentM, settings.units))}
                  </span>
                </>
              )}
            </span>
          </Tooltip>
        </div>
      ) : (
        <p className="mt-3.5 flex items-start gap-2 border-t border-line-soft pt-3 text-[0.8rem] text-ink-3">
          <MoveRight size={14} className="mt-0.5 shrink-0" />
          {r.noDestination}
        </p>
      )}

      <SavedRoutes />
    </Card>
  )
}
