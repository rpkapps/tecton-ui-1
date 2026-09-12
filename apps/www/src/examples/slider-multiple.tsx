// Synced from shadcn/ui (apps/v4/examples/aria/slider-multiple.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Slider } from "@tecton/react/components/slider"

export function SliderMultiple() {
  return (
    <Slider
      aria-label="Multiple slider"
      defaultValue={[10, 20, 70]}
      maxValue={100}
      step={10}
      className="mx-auto w-full max-w-xs"
    />
  )
}
