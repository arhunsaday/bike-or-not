import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { ChevronsUpDown, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { usePlaceSearch } from '@/api/queries'
import { locateMe } from '@/api/open-meteo'
import { reverseGeocode } from '@/api/geocode'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import type { LatLon, Place } from '@/lib/geo'
import { useSettings } from '@/store/settings'

interface Props {
  label: string
  value: Place | null
  onChange: (place: Place | null) => void
  placeholder: string
  icon: React.ReactNode
  /** Offer a "use my location" shortcut (only makes sense for the start). */
  allowLocate?: boolean
  /** Bias results toward here — usually the other end of the route. */
  near?: LatLon | null
}

export function PlaceCombobox({
  label, value, onChange, placeholder, icon, allowLocate = false, near,
}: Props) {
  const t = useT()
  const lang = useSettings((s) => s.lang)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const { data: results = [], isFetching } = usePlaceSearch(query, near)

  async function useMyLocation() {
    setLocating(true)
    try {
      const point = await locateMe()
      const found = await reverseGeocode(point, lang)
      onChange(found ?? {
        id: `geo:${point.lat.toFixed(3)},${point.lon.toFixed(3)}`,
        name: t.place.myLocation,
        context: `${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`,
        ...point,
      })
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.place.locateFailed)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <span className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-2xl border border-line bg-card px-3 py-2.5 text-left',
              'transition hover:bg-card-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict',
            )}
          >
            <span className="text-ink-3">{icon}</span>
            <span className="min-w-0 flex-1 truncate text-[0.92rem] font-medium">
              {value ? value.name : <span className="text-ink-3">{placeholder}</span>}
            </span>
            {value ? (
              <span
                role="button"
                tabIndex={0}
                aria-label={t.place.clear(label)}
                onClick={(e) => { e.stopPropagation(); onChange(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange(null) } }}
                className="rounded-md p-0.5 text-ink-3 transition hover:text-ink"
              >
                <X size={14} />
              </span>
            ) : (
              <ChevronsUpDown size={14} className="text-ink-3" />
            )}
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-bg/95 shadow-2xl backdrop-blur-2xl"
          >
            <Command shouldFilter={false} className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-line-soft px-3">
                <Search size={15} className="shrink-0 text-ink-3" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder={t.place.searchPlaceholder}
                  className="w-full bg-transparent py-3 text-[0.9rem] outline-none placeholder:text-ink-3"
                />
              </div>

              <Command.List className="max-h-64 overflow-y-auto p-1.5">
                {allowLocate && (
                  <Command.Item
                    value="__locate"
                    onSelect={useMyLocation}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-[0.88rem] data-[selected=true]:bg-card"
                  >
                    <LocateFixed size={15} className="text-verdict" />
                    {locating ? t.place.locating : t.place.useLocation}
                  </Command.Item>
                )}

                {query.trim().length < 2 ? (
                  <p className="px-2.5 py-3 text-[0.82rem] text-ink-3">
                    {t.place.typeMore}
                  </p>
                ) : isFetching && results.length === 0 ? (
                  <p className="px-2.5 py-3 text-[0.82rem] text-ink-3">{t.place.searching}</p>
                ) : (
                  <Command.Empty className="px-2.5 py-3 text-[0.82rem] text-ink-3">
                    {t.place.nothingFound(query.trim())}
                  </Command.Empty>
                )}

                {results.map((place) => (
                  <Command.Item
                    key={place.id}
                    value={place.id}
                    onSelect={() => { onChange(place); setOpen(false); setQuery('') }}
                    className="flex cursor-pointer items-baseline gap-2 rounded-xl px-2.5 py-2 data-[selected=true]:bg-card"
                  >
                    <MapPin size={13} className="shrink-0 translate-y-0.5 text-ink-3" />
                    <span className="shrink-0 text-[0.88rem] font-medium">{place.name}</span>
                    <span className="truncate text-[0.78rem] text-ink-3">{place.context}</span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
