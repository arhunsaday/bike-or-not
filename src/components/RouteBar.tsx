import { ArrowLeftRight, Flag, Home, MoveRight, Mountain, Navigation, Route } from 'lucide-react'
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
  const setEndpoint = useSettings((s) => s.setEndpoint)
  const swapRoute = useSettings((s) => s.swapRoute)

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <PlaceCombobox
          label="From"
          value={settings.from}
          onChange={(p) => setEndpoint('from', p)}
          placeholder="Where you set off"
          icon={<Home size={15} />}
          allowLocate
          near={settings.to}
        />

        {/* Vertical between stacked fields on a phone, horizontal beside them
            on a wider screen — the same button either way. */}
        <IconButton
          onClick={swapRoute}
          aria-label="Swap start and destination"
          title="Swap start and destination"
          className="mb-0.5 self-center sm:self-end"
        >
          <ArrowLeftRight size={15} className="rotate-90 sm:rotate-0" />
        </IconButton>

        <PlaceCombobox
          label="To"
          value={settings.to}
          onChange={(p) => setEndpoint('to', p)}
          placeholder="Where you're heading"
          icon={<Flag size={15} />}
          near={settings.from}
        />
      </div>

      {hasRoute ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line-soft pt-3 text-[0.8rem] text-ink-2">
          <Tooltip
            label={geo.source === 'route'
              ? 'Distance along an actual cycling route, from OpenStreetMap via Valhalla.'
              : 'Router unavailable — straight-line distance with a 25% allowance for real streets.'}
          >
            <span className="flex items-center gap-1.5">
              <Route size={13} className="text-ink-3" />
              <b className="font-semibold text-ink">
                {routePending ? '…' : fmtDist(geo.distanceKm, settings.units)}
              </b>
              each way
              {geo.source === 'straight' && <span className="text-ink-3">(estimated)</span>}
            </span>
          </Tooltip>

          <Tooltip label={geo.segments
            ? `Wind is resolved across ${geo.segments.length} segments of the real route, not one average heading.`
            : 'The compass bearing you ride out on. The evening leg gets the reciprocal.'}>
            <span className="flex items-center gap-1.5">
              <Navigation
                size={13}
                className="text-ink-3"
                style={{ transform: `rotate(${geo.bearing ?? 0}deg)` }}
              />
              heading <b className="font-semibold text-ink">{compassPoint(geo.bearing ?? 0)}</b>
              <span className="text-ink-3">({Math.round(geo.bearing ?? 0)}°)</span>
            </span>
          </Tooltip>

          <Tooltip label={geo.source === 'route'
            ? 'Every metre climbed along the route, sampled at 48 points — not just the difference between the two ends. The ride home trades ascent for descent.'
            : 'Height difference between the two ends. Without a route we cannot see the hills in between.'}>
            <span className="flex items-center gap-1.5">
              <Mountain size={13} className="text-ink-3" />
              {routePending ? (
                <span className="text-ink-3">measuring climb…</span>
              ) : geo.ascentM < 5 && geo.descentM < 5 ? (
                <span>essentially flat</span>
              ) : (
                <>
                  <b className="font-semibold text-ink">
                    ↑{fmtElevation(geo.ascentM, settings.units)}
                  </b>
                  <span className="text-ink-3">
                    ↓{fmtElevation(geo.descentM, settings.units)} out
                  </span>
                </>
              )}
            </span>
          </Tooltip>
        </div>
      ) : (
        <p className="mt-3.5 flex items-start gap-2 border-t border-line-soft pt-3 text-[0.8rem] text-ink-3">
          <MoveRight size={14} className="mt-0.5 shrink-0" />
          Add a destination and every wind gets split into a shove and a wall — plus the real
          route, its climb and your journey time.
        </p>
      )}

      <SavedRoutes />
    </Card>
  )
}
