// Synced from shadcn/ui (apps/v4/examples/base/spinner-size.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerSize() {
  return (
    <div className="flex items-center gap-6">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  )
}
