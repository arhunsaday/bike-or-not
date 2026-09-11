import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, children, ...rest }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('glass card-sheen rounded-card p-5 sm:p-7', className)}
      {...rest}
    >
      {children}
    </section>
  )
}

export function CardHead({ title, note }: { title: string; note?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h2 className="text-[1.02rem] font-semibold tracking-tight">{title}</h2>
      {note && <p className="text-[0.83rem] text-ink-3">{note}</p>}
    </div>
  )
}

export function IconButton({ className, children, ...rest }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-card text-ink-2 sm:size-9',
        'transition hover:bg-card-2 hover:text-ink active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
