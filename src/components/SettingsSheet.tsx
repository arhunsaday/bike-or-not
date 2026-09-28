import { LANGS, useT, type Lang } from '@/i18n'
import { PROFILES } from '@/model/profiles'
import type { ProfileKey, RideSettings, ThemeChoice } from '@/model/types'
import type { Units } from '@/lib/units'
import { fmtDist, fmtSpeed } from '@/lib/units'
import { useSettings } from '@/store/settings'
import { CompassDial } from './CompassDial'
import { Dialog } from './ui/Dialog'
import { Segmented } from './ui/Segmented'
import { Slider } from './ui/Slider'
import { Switch } from './ui/Switch'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: RideSettings
  hasRoute: boolean
}

export function SettingsSheet({ open, onOpenChange, settings, hasRoute }: Props) {
  const t = useT()
  const st = t.settings
  const patch = useSettings((s) => s.patch)
  const resetPreferences = useSettings((s) => s.resetPreferences)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={st.title}
            description={st.description}>
      <div className="flex flex-col gap-7">
        <Field legend={st.rider} hint={st.riderHint}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
            {(Object.keys(PROFILES) as ProfileKey[]).map((key) => {
              const p = t.profiles[key]
              const active = settings.profile === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => patch({ profile: key })}
                  className="flex flex-col gap-0.5 rounded-2xl border bg-card-2 px-3 py-3 text-left transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict"
                  style={active
                    ? { borderColor: 'var(--verdict)', background: 'color-mix(in srgb, var(--verdict) 12%, transparent)' }
                    : { borderColor: 'var(--line-soft)' }}
                >
                  <b className="text-[0.88rem] font-semibold">{p.label}</b>
                  <span className="text-[0.75rem] text-ink-3 text-pretty">{p.blurb}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field legend={st.times}>
          <div className="flex flex-wrap gap-3">
            <TimeInput label={st.leaveHome} value={settings.outTime}
                       onChange={(v) => patch({ outTime: v })} />
            <TimeInput label={st.headBack} value={settings.backTime}
                       onChange={(v) => patch({ backTime: v })} />
          </div>
          <Slider
            label={st.speed} min={10} max={32}
            value={settings.speedKmh}
            display={fmtSpeed(settings.speedKmh, settings.units)}
            onChange={(v) => patch({ speedKmh: v })}
          />
        </Field>

        {!hasRoute && (
          <Field
            legend={st.direction}
            hint={st.directionHint}
          >
            <CompassDial
              bearing={settings.manualBearing}
              onChange={(b) => patch({ manualBearing: b })}
            />
            <Slider
              label={st.distance} min={1} max={40} step={0.5}
              value={settings.manualDistanceKm}
              display={fmtDist(settings.manualDistanceKm, settings.units, settings.lang)}
              onChange={(v) => patch({ manualDistanceKm: v })}
            />
          </Field>
        )}

        <Field legend={st.gear}>
          <div className="flex flex-col gap-3">
            <Switch checked={settings.fenders} onCheckedChange={(v) => patch({ fenders: v })}
                    label={st.fenders} hint={st.fendersHint} />
            <Switch checked={settings.lights} onCheckedChange={(v) => patch({ lights: v })}
                    label={st.lights} hint={st.lightsHint} />
            <Switch
              checked={settings.ebike}
              onCheckedChange={(v) => patch(
                v && settings.speedKmh <= 19 ? { ebike: v, speedKmh: 24 } : { ebike: v },
              )}
              label={st.ebike} hint={st.ebikeHint}
            />
          </div>
        </Field>

        <Field legend={st.display}>
          <Segmented<Lang>
            ariaLabel={st.language} value={settings.lang} onChange={(v) => patch({ lang: v })}
            options={LANGS}
          />
          <div className="flex flex-wrap gap-3">
            <Segmented<Units>
              ariaLabel={st.units} value={settings.units} onChange={(v) => patch({ units: v })}
              options={[{ value: 'metric', label: '°C · km' }, { value: 'imperial', label: '°F · mi' }]}
              className="flex-1"
            />
            <Segmented<'24' | '12'>
              ariaLabel={st.clock} value={settings.clock12 ? '12' : '24'}
              onChange={(v) => patch({ clock12: v === '12' })}
              options={[{ value: '24', label: '24h' }, { value: '12', label: '12h' }]}
              className="flex-1"
            />
          </div>
          <Segmented<ThemeChoice>
            ariaLabel={st.theme} value={settings.theme} onChange={(v) => patch({ theme: v })}
            options={[
              { value: 'auto', label: st.themeAuto },
              { value: 'dark', label: st.themeDark },
              { value: 'light', label: st.themeLight },
            ]}
          />
        </Field>

        <button
          type="button"
          onClick={resetPreferences}
          className="self-start rounded-full border border-line px-4 py-2 text-[0.85rem] font-semibold text-ink-2 transition hover:bg-card"
          title={st.resetHint}
        >
          {st.reset}
        </button>
      </div>
    </Dialog>
  )
}

function Field({ legend, hint, children }: {
  legend: string; hint?: string; children: React.ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <legend className="text-[0.73rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
        {legend}
      </legend>
      {hint && <p className="text-[0.82rem] text-ink-3 text-pretty">{hint}</p>}
      {children}
    </fieldset>
  )
}

function TimeInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <label className="flex min-w-[9rem] flex-1 flex-col gap-1.5 text-[0.82rem] text-ink-3">
      {label}
      <input
        type="time"
        step={900}
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="rounded-xl border border-line bg-card px-3 py-2.5 text-ink outline-none focus-visible:ring-2 focus-visible:ring-verdict"
      />
    </label>
  )
}
