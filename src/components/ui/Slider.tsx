import * as RS from '@radix-ui/react-slider'

interface Props {
  value: number
  min: number
  max: number
  step?: number
  label: string
  display: string
  onChange: (value: number) => void
}

export function Slider({ value, min, max, step = 1, label, display, onChange }: Props) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-[0.82rem] text-ink-3">
        {label}
        <b className="font-semibold text-ink">{display}</b>
      </span>
      <RS.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      >
        <RS.Track className="relative h-[5px] w-full grow rounded-full bg-line">
          <RS.Range className="absolute h-full rounded-full bg-verdict/70" />
        </RS.Track>
        <RS.Thumb className="block size-[17px] rounded-full border-2 border-bg bg-verdict shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-verdict focus-visible:ring-offset-2 focus-visible:ring-offset-bg" />
      </RS.Root>
    </label>
  )
}
