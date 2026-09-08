import * as RT from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <RT.Provider delayDuration={150} skipDelayDuration={300}>{children}</RT.Provider>
)

export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <RT.Root>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          sideOffset={6}
          className="z-50 max-w-56 rounded-xl border border-line bg-bg/95 px-2.5 py-1.5 text-[0.78rem] text-ink-2 shadow-xl backdrop-blur-xl"
        >
          {label}
          <RT.Arrow className="fill-bg/95" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  )
}
