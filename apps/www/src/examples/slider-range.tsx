// Synced from shadcn/ui (apps/v4/examples/aria/slider-range.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Slider } from "@tecton/react/components/slider"

export function SliderRange() {
  return (
    <Slider
      aria-label="Range"
      defaultValue={[25, 50]}
      maxValue={100}
      step={5}
      className="mx-auto w-full max-w-xs"
    />
  )
}
