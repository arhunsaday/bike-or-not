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
  const patch = useSettings((s) => s.patch)
  const resetPreferences = useSettings((s) => s.resetPreferences)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Your ride"
            description="Everything here changes the score, not just the display.">
      <div className="flex flex-col gap-7">
        <Field legend="Rider" hint="How much weather are you actually willing to eat?">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
            {(Object.keys(PROFILES) as ProfileKey[]).map((key) => {
              const p = PROFILES[key]
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

        <Field legend="Times">
          <div className="flex flex-wrap gap-3">
            <TimeInput label="Leave home" value={settings.outTime}
                       onChange={(v) => patch({ outTime: v })} />
            <TimeInput label="Head back" value={settings.backTime}
                       onChange={(v) => patch({ backTime: v })} />
          </div>
          <Slider
            label="Cruising speed" min={10} max={32}
            value={settings.speedKmh}
            display={fmtSpeed(settings.speedKmh, settings.units)}
            onChange={(v) => patch({ speedKmh: v })}
          />
        </Field>

        {!hasRoute && (
          <Field
            legend="Direction out"
            hint="No destination set, so tell us which way you point in the morning — this is what splits a wind into a shove and a wall. The ride home gets the opposite."
          >
            <CompassDial
              bearing={settings.manualBearing}
              onChange={(b) => patch({ manualBearing: b })}
            />
            <Slider
              label="Distance one way" min={1} max={40} step={0.5}
              value={settings.manualDistanceKm}
              display={fmtDist(settings.manualDistanceKm, settings.units)}
              onChange={(v) => patch({ manualDistanceKm: v })}
            />
          </Field>
        )}

        <Field legend="Bike & gear">
          <div className="flex flex-col gap-3">
            <Switch checked={settings.fenders} onCheckedChange={(v) => patch({ fenders: v })}
                    label="Mudguards fitted" hint="softens the penalty for light rain" />
            <Switch checked={settings.lights} onCheckedChange={(v) => patch({ lights: v })}
                    label="Lights on the bike" hint="darkness costs 4 points instead of 24" />
            <Switch
              checked={settings.ebike}
              onCheckedChange={(v) => patch(
                v && settings.speedKmh <= 19 ? { ebike: v, speedKmh: 24 } : { ebike: v },
              )}
              label="It's an e-bike" hint="halves headwinds, flattens hills"
            />
          </div>
        </Field>

        <Field legend="Display">
          <div className="flex flex-wrap gap-3">
            <Segmented<Units>
              ariaLabel="Units" value={settings.units} onChange={(v) => patch({ units: v })}
              options={[{ value: 'metric', label: '°C · km' }, { value: 'imperial', label: '°F · mi' }]}
              className="flex-1"
            />
            <Segmented<'24' | '12'>
              ariaLabel="Clock" value={settings.clock12 ? '12' : '24'}
              onChange={(v) => patch({ clock12: v === '12' })}
              options={[{ value: '24', label: '24h' }, { value: '12', label: '12h' }]}
              className="flex-1"
            />
          </div>
          <Segmented<ThemeChoice>
            ariaLabel="Theme" value={settings.theme} onChange={(v) => patch({ theme: v })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        </Field>

        <button
          type="button"
          onClick={resetPreferences}
          className="self-start rounded-full border border-line px-4 py-2 text-[0.85rem] font-semibold text-ink-2 transition hover:bg-card"
          title="Saved routes and past feedback are kept"
        >
          Reset preferences
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
