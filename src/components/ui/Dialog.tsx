import * as RD from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, title, description, children, className }: Props) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]" />
        <RD.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2',
            'max-h-[88dvh] overflow-hidden rounded-card border border-line bg-bg/92 shadow-2xl backdrop-blur-2xl',
            'focus:outline-none',
            className,
          )}
        >
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4 sm:px-7">
            <div>
              <RD.Title className="text-[1.05rem] font-semibold tracking-tight">{title}</RD.Title>
              {description && (
                <RD.Description className="mt-0.5 text-[0.82rem] text-ink-3">
                  {description}
                </RD.Description>
              )}
            </div>
            <RD.Close
              aria-label="Close"
              className="grid size-9 place-items-center rounded-xl border border-line bg-card text-ink-2 transition hover:text-ink active:scale-95"
            >
              <X size={17} />
            </RD.Close>
          </div>
          <div className="max-h-[calc(88dvh-4.5rem)] overflow-y-auto px-5 py-6 sm:px-7">
            {children}
          </div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}
