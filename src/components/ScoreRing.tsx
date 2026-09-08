import { scoreColor } from '@/lib/units'

const R = 56
const C = 2 * Math.PI * R

/**
 * The sweep is a CSS animation and the colour a CSS transition, so the ring is
 * correct the moment it paints. Driving either from JavaScript means a tab
 * that is not receiving animation frames renders the wrong colour or an empty
 * ring — the two things this component exists to communicate.
 */
export function ScoreRing({ score }: { score: number }) {
  const colour = scoreColor(score)
  return (
    <div className="relative aspect-square w-[clamp(6.5rem,22vw,9.4rem)] shrink-0">
      <svg viewBox="0 0 132 132" className="size-full overflow-visible" role="img"
           aria-label={`Bikeability ${score} out of 100`}>
        <circle cx="66" cy="66" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
        <circle
          className="ring-sweep"
          cx="66" cy="66" r={R}
          fill="none"
          stroke={colour}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - score / 100)}
          transform="rotate(-90 66 66)"
          style={{ filter: `drop-shadow(0 0 12px ${colour}88)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="block font-display text-[clamp(1.9rem,6vw,2.4rem)] font-bold leading-none tracking-tighter"
              style={{ fontVariationSettings: "'wdth' 108" }}>
          {score}
        </span>
        <span className="text-[0.58rem] uppercase tracking-[0.14em] text-ink-3 sm:text-[0.63rem]">bikeability</span>
      </div>
    </div>
  )
}
