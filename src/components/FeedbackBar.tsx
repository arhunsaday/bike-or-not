import { CloudDrizzle, Sun, ThumbsUp } from 'lucide-react'
import { routeKey, useSettings, type FeedbackAnswer } from '@/store/settings'
import type { Commute } from '@/model/types'

interface Option {
  answer: FeedbackAnswer
  /** Full phrasing, once there is room for it. */
  label: string
  /** Phones get three buttons in a row; the long labels wrapped to three lines. */
  short: string
  icon: typeof Sun
}

const OPTIONS: Option[] = [
  { answer: 'harsh', label: 'Better than it said', short: 'Better', icon: Sun },
  { answer: 'right', label: 'About right', short: 'Spot on', icon: ThumbsUp },
  { answer: 'optimistic', label: 'Worse than it said', short: 'Worse', icon: CloudDrizzle },
]

/**
 * Collected now, used later. Four fixed rider profiles are a blunt instrument;
 * a record of where the score was wrong for this particular rider is what it
 * would take to replace them with something personal.
 */
export function FeedbackBar({ commute, verdict }: { commute: Commute; verdict: string }) {
  const { from, to, feedback } = useSettings()
  const record = useSettings((s) => s.recordFeedback)

  const routeId = routeKey({ from, to })
  const existing = feedback.find((f) => f.date === commute.date && f.routeId === routeId)

  return (
    <div className="glass card-sheen flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card px-4 py-3 sm:px-5">
      <p className="text-[0.85rem] text-ink-2">
        {existing ? 'Thanks — noted for next time.' : 'How did that ride actually go?'}
      </p>

      <div className="flex w-full gap-1.5 sm:ml-auto sm:w-auto">
        {OPTIONS.map(({ answer, label, short, icon: Icon }) => {
          const chosen = existing?.answer === answer
          return (
            <button
              key={answer}
              type="button"
              aria-pressed={chosen}
              title={label}
              onClick={() => record({
                date: commute.date,
                routeId,
                verdict,
                score: commute.combined,
                answer,
              })}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border bg-card-2 px-3 text-[0.79rem] transition hover:bg-card sm:min-h-9 sm:flex-none"
              style={chosen
                ? { borderColor: 'var(--verdict)', color: 'var(--verdict)' }
                : { borderColor: 'var(--line-soft)', color: 'var(--color-ink-2)' }}
            >
              <Icon size={13} className="shrink-0" />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
