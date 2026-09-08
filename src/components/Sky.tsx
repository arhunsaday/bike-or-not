import { useEffect } from 'react'
import { skyPalette, weatherInfo } from '@/lib/weather-codes'
import type { HourRecord } from '@/model/types'

/**
 * The page takes on the colour of the actual sky. Painting CSS variables on
 * <html> lets every surface tint together with one transition.
 */
export function Sky({ rec, dark, accent }: { rec: HourRecord | null; dark: boolean; accent: string }) {
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--verdict', accent)
  }, [accent])

  useEffect(() => {
    if (!rec) return
    const { group } = weatherInfo(rec.code)
    const [a, b, c] = skyPalette(group, rec.isDay, dark)
    const root = document.documentElement.style
    root.setProperty('--sky-1', a)
    root.setProperty('--sky-2', b)
    root.setProperty('--sky-3', c)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', b)
  }, [rec, dark])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{
          background:
            'radial-gradient(120% 80% at 78% -8%, var(--sky-3) 0%, transparent 62%),' +
            'radial-gradient(100% 70% at 12% 0%, var(--sky-1) 0%, transparent 58%),' +
            'linear-gradient(178deg, var(--sky-1) 0%, var(--sky-2) 55%, var(--bg) 100%)',
        }}
      />
      <div
        className="absolute inset-x-[-10%] -top-[20%] h-[70vh] opacity-[0.13] blur-3xl transition-[background] duration-1000"
        style={{ background: 'radial-gradient(60% 60% at 50% 20%, var(--verdict) 0%, transparent 70%)' }}
      />
    </div>
  )
}
