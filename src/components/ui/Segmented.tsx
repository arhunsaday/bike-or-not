import * as RT from '@radix-ui/react-toggle-group'
import { cn } from '@/lib/cn'

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  ariaLabel: string
  className?: string
}

export function Segmented<T extends string>({
  value, onChange, options, ariaLabel, className,
}: Props<T>) {
  return (
    <RT.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className={cn('flex gap-[3px] rounded-full border border-line-soft bg-card-2 p-[3px]', className)}
    >
      {options.map((o) => (
        <RT.Item
          key={o.value}
          value={o.value}
          className="flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.83rem] font-semibold text-ink-3 transition data-[state=on]:bg-card data-[state=on]:text-ink hover:text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict"
        >
          {o.label}
        </RT.Item>
      ))}
    </RT.Root>
  )
}
