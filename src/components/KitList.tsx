import { buildKit } from '@/model/kit'
import type { Commute, RideSettings } from '@/model/types'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'
import { Card, CardHead } from './ui/Card'

export function KitList({ commute, settings }: { commute: Commute; settings: RideSettings }) {
  const t = useT()
  const { kit, notes } = buildKit(commute, settings)

  return (
    <Card>
      <CardHead
        title={t.kitList.title}
        note={t.kitList.note(commute.out.minutes, commute.back.minutes)}
      />

      <ul className="grid grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] gap-2">
        {kit.map(({ icon: Icon, label, note, tone }) => (
          <li
            key={label}
            className={cn(
              'flex items-start gap-2.5 rounded-2xl border bg-card-2 px-3 py-2.5',
              tone === 'warn' ? 'border-amber-400/25'
                : tone === 'bad' ? 'border-rose-400/30' : 'border-line-soft',
            )}
          >
            <Icon
              size={17}
              className={cn(
                'mt-0.5 shrink-0',
                tone === 'warn' ? 'text-amber-400' : tone === 'bad' ? 'text-rose-400' : 'text-ink-3',
              )}
            />
            <div className="min-w-0">
              <b className="block text-[0.87rem] font-semibold tracking-tight">{label}</b>
              {note && <span className="block text-[0.77rem] text-ink-3 text-pretty">{note}</span>}
            </div>
          </li>
        ))}
      </ul>

      {notes.length > 0 && (
        <ul className="mt-3.5 flex flex-col gap-1.5">
          {notes.map((n) => (
            <li key={n} className="flex gap-2 text-[0.83rem] text-ink-2">
              <span className="text-ink-3">→</span>{n}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
