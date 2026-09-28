import { Command } from 'cmdk'
import { Bike, LocateFixed, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { reverseGeocode } from '@/api/geocode'
import { locateMe } from '@/api/open-meteo'
import { usePlaceSearch } from '@/api/queries'
import type { Place } from '@/lib/geo'
import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import { Dialog } from './ui/Dialog'

/**
 * First run. The app is worthless without knowing where the rider rides, so it
 * asks properly instead of showing a city they have never been to and hoping
 * they notice a toast.
 */
export function LocationPrompt({ open }: { open: boolean }) {
  const t = useT()
  const lang = useSettings((s) => s.lang)
  const setEndpoint = useSettings((s) => s.setEndpoint)
  const markAsked = useSettings((s) => s.markLocationAsked)

  const [query, setQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const { data: results = [], isFetching } = usePlaceSearch(query)

  function choose(place: Place) {
    setEndpoint('from', place)
    markAsked()
  }

  async function useMyLocation() {
    setLocating(true)
    try {
      const point = await locateMe()
      const found = await reverseGeocode(point, lang)
      choose(found ?? {
        id: `geo:${point.lat.toFixed(3)},${point.lon.toFixed(3)}`,
        name: t.place.myLocation,
        context: `${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`,
        ...point,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.place.locateFailed, {
        description: t.firstRun.searchInstead,
      })
    } finally {
      setLocating(false)
    }
  }

  return (
    <Dialog
      open={open}
      // Dismissing without choosing is allowed, but it still counts as asked.
      onOpenChange={(next) => { if (!next) markAsked() }}
      title={t.firstRun.title}
      description={t.firstRun.description}
    >
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border border-verdict/40 bg-verdict/10 px-4 py-3 text-[0.95rem] font-semibold text-verdict transition hover:bg-verdict/15 disabled:opacity-60"
        >
          <LocateFixed size={18} />
          {locating ? t.place.locating : t.place.useLocation}
        </button>

        <div className="flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.12em] text-ink-3">
          <span className="h-px flex-1 bg-line" />
          {t.firstRun.orSearch}
          <span className="h-px flex-1 bg-line" />
        </div>

        <Command shouldFilter={false} className="flex flex-col">
          <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-line bg-card px-3">
            <Search size={16} className="shrink-0 text-ink-3" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={t.firstRun.placeholder}
              className="w-full bg-transparent py-3 text-[0.95rem] outline-none placeholder:text-ink-3"
            />
          </div>

          <Command.List className="mt-1.5 max-h-56 overflow-y-auto">
            {query.trim().length < 2 ? (
              <p className="px-1 py-3 text-[0.83rem] text-ink-3">
                {t.firstRun.typeMore}
              </p>
            ) : isFetching && results.length === 0 ? (
              <p className="px-1 py-3 text-[0.83rem] text-ink-3">{t.place.searching}</p>
            ) : (
              <Command.Empty className="px-1 py-3 text-[0.83rem] text-ink-3">
                {t.place.nothingFound(query.trim())}
              </Command.Empty>
            )}

            {results.map((place) => (
              <Command.Item
                key={place.id}
                value={place.id}
                onSelect={() => choose(place)}
                className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 data-[selected=true]:bg-card"
              >
                <MapPin size={14} className="shrink-0 text-ink-3" />
                <span className="min-w-0">
                  <b className="block truncate text-[0.9rem] font-medium">{place.name}</b>
                  {place.context && (
                    <span className="block truncate text-[0.78rem] text-ink-3">
                      {place.context}
                    </span>
                  )}
                </span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>

        <button
          type="button"
          onClick={markAsked}
          className="flex items-center justify-center gap-2 self-center rounded-full px-3 py-2 text-[0.83rem] text-ink-3 transition hover:text-ink"
        >
          <Bike size={14} />
          {t.firstRun.demo(t.demoCity)}
        </button>
      </div>
    </Dialog>
  )
}
