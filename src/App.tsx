import { Bike, RefreshCw, Settings2 } from 'lucide-react'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FeedbackBar } from '@/components/FeedbackBar'
import { KitList } from '@/components/KitList'
import { LocationPrompt } from '@/components/LocationPrompt'
import { NowcastBanner } from '@/components/NowcastBanner'
import { LegCard } from '@/components/LegCard'
import { Precipitation } from '@/components/Precipitation'
import { RouteBar } from '@/components/RouteBar'
import { SettingsSheet } from '@/components/SettingsSheet'
import { Sky } from '@/components/Sky'
import { VerdictCard } from '@/components/VerdictCard'
import { WeekOutlook } from '@/components/WeekOutlook'
import { IconButton } from '@/components/ui/Card'
import { useCommute } from '@/hooks/useCommute'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { scoreColor } from '@/lib/units'
import { topFactor, verdict } from '@/model/score'
import { useSettings } from '@/store/settings'

/** Stagger the reveal without making visibility depend on JavaScript. */
// Recharts is roughly two thirds of the bundle; it loads on its own.
const RideWindow = lazy(() =>
  import('@/components/RideWindow').then((m) => ({ default: m.RideWindow })),
)

const rise = (i: number) => ({ className: 'rise', style: { animationDelay: `${i * 50}ms` } })

export default function App() {
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    settings, geo, model, date, commute, week, confidence, consensusMap, nowcast,
    isDemo, hasRoute, routePending, routeFailed, isLoading, isFetching, error, refetch,
  } = useCommute(activeDate)

  const t = useT()
  const dark = useThemeClass(settings.theme)
  useDocumentLanguage(settings.lang, t.documentTitle)
  useShortcuts(() => setSettingsOpen(true), () => void refetch())

  const locationAsked = useSettings((s) => s.locationAsked)

  const routeWarned = useRef(false)
  useEffect(() => {
    if (!routeFailed || routeWarned.current) return
    routeWarned.current = true
    toast(t.app.routeUnavailable, {
      description: t.app.routeUnavailableDetail,
      duration: 7000,
    })
  }, [routeFailed, t])

  const accent = commute ? scoreColor(commute.combined) : '#34d399'
  const placeLabel = hasRoute && settings.from && settings.to
    ? `${settings.from.name} → ${settings.to.name}`
    : settings.from?.name ?? t.demoCity

  return (
    <>
      <Sky rec={commute?.out.rec ?? null} dark={dark} accent={accent} />
      <Precipitation rec={commute?.out.rec ?? null} />

      <header className="sticky top-0 z-30 mx-auto flex max-w-[71rem] items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-line bg-card text-verdict transition-colors duration-500">
            <Bike size={19} />
          </span>
          <span className="font-display text-[1.06rem] font-extrabold tracking-tight"
                style={{ fontVariationSettings: "'wdth' 112" }}>
            bike<em className="px-0.5 font-medium not-italic text-ink-3">or</em>not
          </span>
        </div>

        <div className="ml-auto flex gap-2">
          <IconButton onClick={() => void refetch()} title={t.app.refresh} aria-label={t.app.refresh}>
            <RefreshCw size={16} className={cn(isFetching && 'animate-spin')} />
          </IconButton>
          <IconButton onClick={() => setSettingsOpen(true)} title={t.app.settings} aria-label={t.app.settings}>
            <Settings2 size={16} />
          </IconButton>
        </div>
      </header>

      <main className="mx-auto flex max-w-[71rem] flex-col gap-4 px-4 pb-[max(4rem,calc(env(safe-area-inset-bottom)+3rem))] sm:px-8">
        <div {...rise(0)}>
          <RouteBar settings={settings} geo={geo} hasRoute={hasRoute}
                    routePending={routePending} />
        </div>

        {error && (
          <Card tone="error">
            <b className="block text-[1.05rem] font-semibold">{t.app.forecastError}</b>
            <p className="mt-1 text-ink-2">{error.message}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-full border border-line bg-card px-4 py-2 text-[0.88rem] font-semibold transition hover:bg-card-2"
            >
              {t.app.tryAgain}
            </button>
          </Card>
        )}

        {isLoading && !model && <Skeleton />}

        {model && commute && date && (
          <>
            {date === model.today && nowcast && (
              <div {...rise(1)}>
                <NowcastBanner nowcast={nowcast} />
              </div>
            )}

            <div {...rise(1)}>
              <VerdictCard
                model={model} commute={commute} settings={settings} geo={geo}
                placeLabel={placeLabel}
                day={model.days.find((d) => d.date === date)}
                confidence={confidence}
              />
            </div>

            <div className="rise grid gap-4 md:grid-cols-2" style={{ animationDelay: '100ms' }}>
              <LegCard model={model} commute={commute} which="out" settings={settings} geo={geo}
                       consensusMap={consensusMap} />
              <LegCard model={model} commute={commute} which="back" settings={settings} geo={geo}
                       consensusMap={consensusMap} />
            </div>

            <div {...rise(3)}>
              <Suspense fallback={<div className="glass h-72 animate-pulse rounded-card" />}>
                <RideWindow model={model} commute={commute} settings={settings} geo={geo}
                            consensusMap={consensusMap} />
              </Suspense>
            </div>

            <div {...rise(4)}>
              <KitList commute={commute} settings={settings} />
            </div>

            <div {...rise(5)}>
              <WeekOutlook
                model={model} week={week} settings={settings}
                activeDate={date} onPick={setActiveDate}
              />
            </div>

            {date === model.today && (
              <div {...rise(6)}>
                <FeedbackBar
                  commute={commute}
                  verdict={verdict(commute.combined, settings.lang, commute.blockers, topFactor(commute)).word}
                />
              </div>
            )}

            <footer className="pt-2 text-center text-[0.79rem] text-ink-3">
              <p>
                {t.app.sourcesBefore}{' '}
                <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer"
                   className="underline decoration-ink-3 underline-offset-2">Open-Meteo</a>.
                {' '}{t.app.updated(new Date(model.fetchedAt).toLocaleTimeString(t.locale, {
                  hour: '2-digit', minute: '2-digit', hour12: settings.clock12,
                }))}
              </p>
              <p className="mt-1 opacity-70">
                {t.app.disclaimer}
              </p>
            </footer>
          </>
        )}
      </main>

      <LocationPrompt open={isDemo && !locationAsked} />

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen}
                     settings={settings} hasRoute={hasRoute} />
    </>
  )
}

function Card({ children, tone }: { children: React.ReactNode; tone?: 'error' }) {
  return (
    <div className={cn(
      'glass card-sheen rounded-card p-6',
      tone === 'error' && 'border-rose-400/30',
    )}>
      {children}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="glass h-56 animate-pulse rounded-card" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass h-44 animate-pulse rounded-card" />
        <div className="glass h-44 animate-pulse rounded-card" />
      </div>
      <div className="glass h-64 animate-pulse rounded-card" />
    </div>
  )
}

/** Applies the theme class and reports whether we are currently dark. */
function useThemeClass(theme: 'auto' | 'dark' | 'light') {
  const [systemDark, setSystemDark] = useState(
    () => !matchMedia('(prefers-color-scheme: light)').matches,
  )

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setSystemDark(!mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const dark = theme === 'dark' || (theme === 'auto' && systemDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return dark
}

function useDocumentLanguage(lang: string, title: string) {
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = title
  }, [lang, title])
}

function useShortcuts(openSettings: () => void, refresh: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.matches('input, textarea, [contenteditable]')) return
      if (e.key === ',') { e.preventDefault(); openSettings() }
      if (e.key === 'r') refresh()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [openSettings, refresh])
}
