// Synced from shadcn/ui (apps/v4/examples/base/progress-label.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@tecton/react/components/progress"

export function ProgressWithLabel() {
  return (
    <Progress value={56} className="w-full max-w-sm">
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>
  )
}
