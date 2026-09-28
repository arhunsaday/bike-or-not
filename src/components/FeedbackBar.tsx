import { CloudDrizzle, Sun, ThumbsUp } from 'lucide-react'
import { routeKey, useSettings, type FeedbackAnswer } from '@/store/settings'
import { useT } from '@/i18n'
import type { Commute } from '@/model/types'

/** Each answer has a full label and, because phones get three buttons in a
 *  row and the long labels wrapped to three lines, a short one. */
const OPTIONS: { answer: FeedbackAnswer; icon: typeof Sun }[] = [
  { answer: 'harsh', icon: Sun },
  { answer: 'right', icon: ThumbsUp },
  { answer: 'optimistic', icon: CloudDrizzle },
]

/**
 * Collected now, used later. Four fixed rider profiles are a blunt instrument;
 * a record of where the score was wrong for this particular rider is what it
 * would take to replace them with something personal.
 */
export function FeedbackBar({ commute, verdict }: { commute: Commute; verdict: string }) {
  const t = useT().feedback
  const { from, to, feedback } = useSettings()
  const record = useSettings((s) => s.recordFeedback)

  const routeId = routeKey({ from, to })
  const existing = feedback.find((f) => f.date === commute.date && f.routeId === routeId)

  return (
    <div className="glass card-sheen flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card px-4 py-3 sm:px-5">
      <p className="text-[0.85rem] text-ink-2">
        {existing ? t.thanks : t.ask}
      </p>

      <div className="flex w-full gap-1.5 sm:ml-auto sm:w-auto">
        {OPTIONS.map(({ answer, icon: Icon }) => {
          const { label, short } = t[answer]
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
