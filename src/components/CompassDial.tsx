import { useRef } from 'react'
import { compassPoint } from '@/lib/geo'

interface Props {
  bearing: number | null
  onChange: (bearing: number | null) => void
}

/** Manual heading, for when you would rather not name your address. */
export function CompassDial({ bearing, onChange }: Props) {
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const setFromPointer = (e: React.PointerEvent) => {
    const svg = ref.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    if (Math.hypot(x, y) < 8) return
    const deg = (Math.atan2(x, -y) * 180) / Math.PI
    onChange((Math.round(((deg % 360) + 360) % 360 / 5) * 5) % 360)
  }

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = ((i * 15 - 90) * Math.PI) / 180
    const major = i % 3 === 0
    const r1 = major ? 68 : 74
    return (
      <line
        key={i}
        x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)}
        x2={100 + 79 * Math.cos(a)} y2={100 + 79 * Math.sin(a)}
        stroke="var(--line)" strokeWidth="1.5" opacity={major ? 1 : 0.45}
      />
    )
  })

  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg
        ref={ref}
        viewBox="0 0 200 200"
        tabIndex={0}
        role="slider"
        aria-label="Outbound bearing"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(bearing ?? 0)}
        className="w-36 shrink-0 cursor-grab touch-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict rounded-full"
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          setFromPointer(e)
        }}
        onPointerMove={(e) => dragging.current && setFromPointer(e)}
        onPointerUp={() => { dragging.current = false }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 45 : 5
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(((bearing ?? 0) + step) % 360)
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(((bearing ?? 0) - step + 360) % 360)
          else return
          e.preventDefault()
        }}
      >
        <circle cx="100" cy="100" r="86" fill="var(--card-2)" stroke="var(--line)" strokeWidth="1.5" />
        {ticks}
        <g fill="var(--color-ink-3)" fontSize="12" fontWeight="600" textAnchor="middle">
          <text x="100" y="28">N</text>
          <text x="176" y="106">E</text>
          <text x="100" y="182">S</text>
          <text x="24" y="106">W</text>
        </g>
        <g
          className="transition-transform duration-300"
          style={{ transformOrigin: '100px 100px', transform: `rotate(${bearing ?? 0}deg)`, opacity: bearing == null ? 0.25 : 1 }}
        >
          <path d="M100 30 L110 100 L100 92 L90 100 Z" fill="var(--verdict)" />
          <circle cx="100" cy="100" r="6" fill="var(--bg)" stroke="var(--verdict)" strokeWidth="2" />
        </g>
      </svg>

      <div className="flex min-w-[8rem] flex-1 flex-col items-start gap-2">
        <p className="flex items-baseline gap-2">
          <b className="font-display text-2xl font-bold tracking-tighter"
             style={{ fontVariationSettings: "'wdth' 112" }}>
            {bearing == null ? 'Any' : compassPoint(bearing)}
          </b>
          <span className="text-[0.82rem] text-ink-3">
            {bearing == null ? 'direction unset' : `${Math.round(bearing)}°`}
          </span>
        </p>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-full border border-line px-3 py-1.5 text-[0.82rem] font-semibold text-ink-2 transition hover:bg-card"
        >
          I'd rather not say
        </button>
        <p className="text-[0.74rem] text-ink-3 text-pretty">
          Without a bearing every wind is treated as half headwind, half cross.
        </p>
      </div>
    </div>
  )
}
