import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { useMemo } from 'react'
import { dayLabel, fmtClock, hourOf, isoAt, toHHMM } from '@/lib/time'
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
        label: isNow ? 'now' : fmtClock(`${iso.slice(11, 13)}:00`, settings.clock12),
        score: leg.score,
        colour: scoreColor(leg.score),
        temp: rec.temp,
        code: rec.code,
        isDay: rec.isDay,
        isCommute: commuteHours.has(iso),
        isNow,
      }]
    })
  }, [model, commute, settings, geo, consensusMap, isToday, nowKey])

  const note = useMemo(() => {
    const curve = dayCurve(model, commute.date, settings, geo, consensusMap)
      .filter((c) => !isToday || c.iso.slice(0, 13) >= nowKey)
    if (!curve.length) return 'Scored hour by hour.'

    const win = bestWindow(curve, { from: isToday ? hourOf(model.now) : 5, to: 23 })
    const label = dayLabel(commute.date, model.today, true)
    const when = isToday ? 'left today' : label === 'Tomorrow' ? 'tomorrow' : `on ${label}`

    if (!win || win.avg < 45) {
      return isToday
        ? 'Nothing good left today — check tomorrow morning.'
        : `No good window ${when}.`
    }
    const from = fmtClock(toHHMM(win.start), settings.clock12)
    const to = win.end >= 23 ? 'midnight' : fmtClock(toHHMM(win.end + 1), settings.clock12)
    return win.n === 1
      ? `Best hour ${when}: around ${from} (${win.avg}/100).`
      : `Best stretch ${when}: ${from}–${to}, averaging ${win.avg}/100.`
  }, [model, commute.date, settings, geo, consensusMap, isToday, nowKey])

  return (
    <Card>
      <CardHead title="Ride window" note={note} />

      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <div style={{ minWidth: Math.max(rows.length * 42, 320), height: 168 }}>
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
                  const info = weatherInfo(r.code)
                  const Icon = weatherIcon(info.group, r.isDay)
                  return (
                    <div className="rounded-xl border border-line bg-bg/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                      <p className="flex items-center gap-1.5 text-[0.8rem] font-semibold">
                        <Icon size={14} className="text-ink-3" />
                        {r.label === 'now' ? 'Right now' : r.label}
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
        <Legend colour="#e11d48" label="don't" />
        <Legend colour="#facc15" label="marginal" />
        <Legend colour="#34d399" label="go" />
        <span className="sm:ml-auto">Outlined bars are your commute hours. Bars are scored for your outbound direction.</span>
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
