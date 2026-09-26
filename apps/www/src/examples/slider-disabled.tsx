// Synced from shadcn/ui (apps/v4/examples/base/slider-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Slider } from "@tecton/react/components/slider"

export function SliderDisabled() {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      disabled
      className="mx-auto w-full max-w-xs"
    />
  )
}
