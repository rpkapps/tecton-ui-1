import { CircularProgress } from "@tecton/react/tecton/circular-progress"

export default function CircularProgressIndeterminate() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <CircularProgress size="sm" isIndeterminate aria-label="Loading well logs" />
      Loading well logs…
    </div>
  )
}
