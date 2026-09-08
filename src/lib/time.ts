import { addDays as addDaysFn, format, parseISO } from 'date-fns'
import { clamp } from './units'

/** Open-Meteo local ISO strings ("2026-09-05T08:00") carry no zone — the API
 *  has already converted to the location's own clock, so we treat the text as
 *  wall time and never let a Date object drag a timezone into it. */
export const dayOf = (iso: string) => iso.slice(0, 10)
export const hourOf = (iso: string) => Number(iso.slice(11, 13))

export const isoAt = (date: string, hour: number) =>
  `${date}T${String(clamp(Math.round(hour), 0, 23)).padStart(2, '0')}:00`

export const addDays = (date: string, n: number) =>
  format(addDaysFn(parseISO(`${date}T12:00:00`), n), 'yyyy-MM-dd')

/** "08:30" → 8.5 */
export function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

/** 8.5 → "08:30" */
export function toHHMM(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtClock(hhmm: string, clock12: boolean): string {
  const d = parseISO(`2000-01-01T${hhmm.length === 5 ? hhmm : `${hhmm}:00`}`)
  if (!clock12) return format(d, 'HH:mm')
  return format(d, d.getMinutes() === 0 ? 'ha' : 'h:mma').toLowerCase()
}

export function dayLabel(date: string, today: string, long = false): string {
  if (date === today) return 'Today'
  if (date === addDays(today, 1)) return long ? 'Tomorrow' : 'Tmrw'
  return format(parseISO(`${date}T12:00:00`), long ? 'EEEE' : 'EEE')
}
