import { CloudDrizzle, Sun, ThumbsUp } from 'lucide-react'
import { routeKey, useSettings, type FeedbackAnswer } from '@/store/settings'
import type { Commute } from '@/model/types'

const OPTIONS: { answer: FeedbackAnswer; label: string; icon: typeof Sun }[] = [
  { answer: 'harsh', label: 'Better than it said', icon: Sun },
  { answer: 'right', label: 'About right', icon: ThumbsUp },
  { answer: 'optimistic', label: 'Worse than it said', icon: CloudDrizzle },
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

      <div className="flex flex-wrap gap-1.5 sm:ml-auto">
        {OPTIONS.map(({ answer, label, icon: Icon }) => {
          const chosen = existing?.answer === answer
          return (
            <button
              key={answer}
              type="button"
              aria-pressed={chosen}
              onClick={() => record({
                date: commute.date,
                routeId,
                verdict,
                score: commute.combined,
                answer,
              })}
              className="flex items-center gap-1.5 rounded-full border bg-card-2 px-2.5 py-1.5 text-[0.79rem] transition hover:bg-card"
              style={chosen
                ? { borderColor: 'var(--verdict)', color: 'var(--verdict)' }
                : { borderColor: 'var(--line-soft)', color: 'var(--color-ink-2)' }}
            >
              <Icon size={13} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
