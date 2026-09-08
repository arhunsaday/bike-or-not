import { useEffect, useRef } from 'react'
import { clamp } from '@/lib/units'
import { isSnowy, isWet, weatherInfo } from '@/lib/weather-codes'
import type { HourRecord } from '@/model/types'

interface Drop { x: number; y: number; z: number; w: number }

/** Rain and snow on a canvas behind the content. Purely atmospheric. */
export function Precipitation({ rec }: { rec: HourRecord | null }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !rec) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    ctx.clearRect(0, 0, innerWidth, innerHeight)

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { group } = weatherInfo(rec.code)
    const snow = isSnowy(group)
    const rain = isWet(group)
    if (!snow && !rain) return

    const intensity = clamp(rec.precip * 1.6 + 0.35, 0.35, 2.2)
    const count = Math.round((snow ? 70 : 130) * intensity * (innerWidth / 1400 + 0.6))
    // The east/west component of the wind decides which way the streaks lean.
    const tilt = clamp(Math.sin((rec.windDir * Math.PI) / 180) * -rec.wind * 0.045, -2.6, 2.6)

    const spawn = (top = false): Drop => ({
      x: Math.random() * (innerWidth + 200) - 100,
      y: top ? -20 : Math.random() * innerHeight,
      z: 0.35 + Math.random() * 0.8,
      w: Math.random() * Math.PI * 2,
    })
    const drops = Array.from({ length: count }, () => spawn())

    ctx.lineCap = 'round'
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      ctx.clearRect(0, 0, innerWidth, innerHeight)

      for (const d of drops) {
        if (snow) {
          d.w += 0.02 * dt
          d.y += (0.55 + d.z * 0.9) * dt
          d.x += (tilt * d.z * 0.7 + Math.sin(d.w) * 0.5) * dt
          ctx.beginPath()
          ctx.fillStyle = `rgba(255,255,255,${0.12 + d.z * 0.2})`
          ctx.arc(d.x, d.y, d.z * 1.7, 0, Math.PI * 2)
          ctx.fill()
        } else {
          const speed = (7 + d.z * 12) * dt
          d.y += speed
          d.x += tilt * d.z * dt * 2.2
          ctx.beginPath()
          ctx.strokeStyle = `rgba(190,215,255,${0.07 + d.z * 0.13})`
          ctx.lineWidth = d.z * 1.1
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - tilt * d.z * 5, d.y - speed * 1.5)
          ctx.stroke()
        }
        if (d.y > innerHeight + 20 || d.x < -140 || d.x > innerWidth + 140) {
          Object.assign(d, spawn(true))
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
    }
  }, [rec])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />
}
