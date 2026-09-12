// Synced from shadcn/ui (apps/v4/examples/aria/slider-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Slider } from "@tecton/react/components/slider"

export function SliderDemo() {
  return (
    <Slider
      aria-label="Slider"
      defaultValue={[75]}
      maxValue={100}
      step={1}
      className="mx-auto w-full max-w-xs"
    />
  )
}
