import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { useMemo } from 'react'
import { useT } from '@/i18n'
import { addDays, dayLabel, fmtClock, hourOf, isoAt, toHHMM } from '@/lib/time'
import { fmtTemp, scoreColor } from '@/lib/units'
import { weatherIcon, weatherInfo } from '@/lib/weather-codes'
import {
  bestWindow, dayCurve, scoreHour, type ConsensusMap, type RouteGeometry,
} from '@/model/score'
import type { Commute, RideSettings, WeatherModel } from '@/model/types'
import { Card, CardHead } from './ui/Card'

interface Row {
  iso: string
  label: string
  score: number
  colour: string
  temp: number
  code: number
  isDay: boolean
  isCommute: boolean
  isNow: boolean
}

interface Props {
  model: WeatherModel
  commute: Commute
  settings: RideSettings
  geo: RouteGeometry
  consensusMap?: ConsensusMap
}

export function RideWindow({ model, commute, settings, geo, consensusMap }: Props) {
  const t = useT()
  const rw = t.rideWindow
  const isToday = commute.date === model.today
  const nowKey = model.now.slice(0, 13)

  const rows = useMemo<Row[]>(() => {
    // Today runs from this hour forward; any other day gets its own
    // midnight-to-midnight strip, so the bars always belong to the day on show.
    const times = isToday
      ? model.allTimes.filter((t) => t.slice(0, 13) >= nowKey).slice(0, 26)
      : Array.from({ length: 24 }, (_, h) => isoAt(commute.date, h))

    const commuteHours = new Set([commute.out.iso, commute.back.iso])

    return times.flatMap((iso, i) => {
      const rec = model.hours.get(iso)
      if (!rec) return []
      const leg = scoreHour(rec, 'out', geo, settings, consensusMap)
      const isNow = isToday && i === 0
      return [{
        iso,
        label: isNow ? rw.now : fmtClock(`${iso.slice(11, 13)}:00`, settings.clock12),
        score: leg.score,
        colour: scoreColor(leg.score),
        temp: rec.temp,
        code: rec.code,
        isDay: rec.isDay,
        isCommute: commuteHours.has(iso),
        isNow,
      }]
    })
  }, [model, commute, settings, geo, consensusMap, isToday, nowKey, rw])

  const note = useMemo(() => {
    const curve = dayCurve(model, commute.date, settings, geo, consensusMap)
      .filter((c) => !isToday || c.iso.slice(0, 13) >= nowKey)
    if (!curve.length) return rw.hourly

    const win = bestWindow(curve, { from: isToday ? hourOf(model.now) : 5, to: 23 })
    const when = isToday ? rw.whenToday
      : commute.date === addDays(model.today, 1) ? rw.whenTomorrow
        : rw.whenDay(dayLabel(commute.date, model.today, settings.lang, true))

    if (!win || win.avg < 45) {
      return isToday ? rw.nothingToday : rw.noWindow(when)
    }
    const from = fmtClock(toHHMM(win.start), settings.clock12)
    const to = win.end >= 23 ? rw.midnight : fmtClock(toHHMM(win.end + 1), settings.clock12)
    return win.n === 1
      ? rw.bestHour(when, from, win.avg)
      : rw.bestStretch(when, from, to, win.avg)
  }, [model, commute.date, settings, geo, consensusMap, isToday, nowKey, rw])

  return (
    <Card>
      <CardHead title={rw.title} note={note} />

      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        {/* Narrower bars on a phone: 42px each meant only eight of the next
            twenty-four hours were on screen at once. */}
        <div
          className="h-[168px] min-w-[max(20rem,calc(var(--bars)*2.15rem))] sm:min-w-[max(20rem,calc(var(--bars)*2.6rem))]"
          style={{ '--bars': rows.length } as React.CSSProperties}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 6, right: 0, bottom: 0, left: 0 }} barCategoryGap={3}>
              <XAxis
                dataKey="label"
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-ink-3)', fontSize: 10 }}
                height={20}
              />
              <YAxis hide domain={[0, 100]} />
              <RTooltip
                cursor={{ fill: 'var(--color-card-2)', radius: 8 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const r = payload[0].payload as Row
                  const info = weatherInfo(r.code, t)
                  const Icon = weatherIcon(info.group, r.isDay)
                  return (
                    <div className="rounded-xl border border-line bg-bg/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                      <p className="flex items-center gap-1.5 text-[0.8rem] font-semibold">
                        <Icon size={14} className="text-ink-3" />
                        {r.isNow ? rw.rightNow : r.label}
                      </p>
                      <p className="mt-0.5 text-[0.76rem] text-ink-3">
                        {info.label} · {fmtTemp(r.temp, settings.units)}
                      </p>
                      <p className="mt-1 text-[0.8rem]" style={{ color: r.colour }}>
                        <b className="font-semibold">{r.score}</b>
                        <span className="text-ink-3">/100</span>
                      </p>
                    </div>
                  )
                }}
              />
              {/* Bar growth is animation-frame driven; a tab without frames would
                  render every bar at zero height. The card already animates in. */}
              <Bar dataKey="score" radius={[6, 6, 3, 3]} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell
                    key={r.iso}
                    fill={r.colour}
                    fillOpacity={r.isDay ? 1 : 0.72}
                    stroke={r.isCommute || r.isNow ? 'var(--color-ink)' : undefined}
                    strokeOpacity={r.isCommute ? 0.55 : 0.25}
                    strokeWidth={r.isCommute || r.isNow ? 1.5 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-soft pt-3 text-[0.76rem] text-ink-3">
        <Legend colour="#e11d48" label={rw.dont} />
        <Legend colour="#facc15" label={rw.marginal} />
        <Legend colour="#34d399" label={rw.go} />
        <span className="sm:ml-auto">{rw.legend}</span>
      </div>
    </Card>
  )
}

const Legend = ({ colour, label }: { colour: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <i className="size-2 rounded-full" style={{ background: colour }} />
    {label}
  </span>
)
