import * as RS from '@radix-ui/react-switch'

interface Props {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  hint?: string
}

export function Switch({ checked, onCheckedChange, label, hint }: Props) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <RS.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-[23px] w-10 shrink-0 rounded-full border border-line bg-line transition-colors data-[state=checked]:bg-verdict/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdict focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <RS.Thumb className="block size-[17px] translate-x-0.5 rounded-full bg-ink-2 transition-transform will-change-transform data-[state=checked]:translate-x-[19px] data-[state=checked]:bg-white" />
      </RS.Root>
      <span className="text-[0.9rem]">
        {label}
        {hint && <span className="block text-[0.76rem] text-ink-3">{hint}</span>}
      </span>
    </label>
  )
}
