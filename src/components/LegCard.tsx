import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { useT } from '@/i18n'
import { compassPoint } from '@/lib/geo'
import { fmtClock } from '@/lib/time'
import { fmtSpeed, scoreColor } from '@/lib/units'
import type { ConsensusMap, RouteGeometry } from '@/model/score'
import { legBearing, suggestShift } from '@/model/score'
import type { Commute, LegScore, RideSettings, WeatherModel } from '@/model/types'
import { toHHMM } from '@/lib/time'
import { FactorBars } from './FactorBars'
import { WindRose } from './WindRose'
import { Card } from './ui/Card'

interface Props {
  model: WeatherModel
  commute: Commute
  which: 'out' | 'back'
  settings: RideSettings
  geo: RouteGeometry
  consensusMap?: ConsensusMap
}

export function LegCard({ model, commute, which, settings, geo, consensusMap }: Props) {
  const t = useT()
  const out = which === 'out'
  const leg: LegScore = out ? commute.out : commute.back
  const bearing = legBearing(geo, which)
  const time = out ? settings.outTime : settings.backTime
  const colour = scoreColor(leg.score)

  const w = leg.wind
  const kind = w.unknown ? 'wind'
    : w.head > 2 ? 'headwind'
      : w.head < -2 ? 'tailwind' : 'crosswind'
  const magnitude = w.unknown ? leg.rec.wind
    : Math.abs(w.head) > w.cross ? Math.abs(w.head) : w.cross

  const shift = suggestShift(model, leg, geo, settings, consensusMap)

  return (
    <Card className="flex flex-col gap-4" style={{ color: 'var(--color-ink)' }}>
      <header className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-xl border border-line-soft bg-card-2 text-ink-2">
          {out ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        </span>
        <div className="flex flex-col">
          <b className="text-[0.95rem] font-semibold tracking-tight">
            {out ? t.leg.out : t.leg.back} · {fmtClock(time, settings.clock12)}
          </b>
          <span className="text-[0.79rem] text-ink-3">
            {out ? t.leg.toWork : t.leg.homeAgain} · ≈{leg.minutes} min
          </span>
        </div>
        <span
          className="score-ink ml-auto flex items-baseline gap-0.5 font-display text-2xl font-bold tracking-tighter"
          style={{ color: colour, fontVariationSettings: "'wdth' 106" }}
        >
          {leg.score}
          <i className="font-sans text-[0.7rem] font-medium not-italic text-ink-3">/100</i>
        </span>
      </header>

      <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-4">
        <div style={{ color: colour }}>
          <WindRose leg={leg} bearing={bearing} />
        </div>
        <div>
          <p className="mb-2 text-[0.86rem] text-ink-2">
            {w.unknown ? (
              <>
                <b className="font-semibold text-ink">{fmtSpeed(leg.rec.wind, settings.units)}</b>{' '}
                {t.leg.fromDir(compassPoint(leg.rec.windDir, t.compass))} — {t.leg.splitHint}
              </>
            ) : (
              <>
                <b className="font-semibold text-ink">
                  {t.leg.windOf(fmtSpeed(magnitude, settings.units), t.leg.kind[kind])}
                </b>{' '}
                {t.leg.fromDir(compassPoint(leg.rec.windDir, t.compass))}
                {w.cross > 12 && kind !== 'crosswind' && t.leg.across(Math.round(w.cross))}
              </>
            )}
          </p>
          <FactorBars leg={leg} />
        </div>
      </div>

      {shift && (
        <p className="flex items-start gap-2 rounded-xl border border-line-soft bg-card-2 px-3 py-2.5 text-[0.82rem] text-ink-2">
          <Clock size={15} className="mt-0.5 shrink-0 text-verdict" />
          <span>
            {t.leg.shiftLead(shift.delta)}
            <b className="font-semibold text-ink">
              {fmtClock(toHHMM(Number(shift.iso.slice(11, 13))), settings.clock12)}
            </b>
            {t.leg.shiftMid}<b className="font-semibold text-ink">{shift.score}</b>
            {t.leg.shiftTail(shift.gain)}
          </span>
        </p>
      )}
    </Card>
  )
}
