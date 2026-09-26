// Synced from shadcn/ui (apps/v4/examples/base/spinner-button.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/components/button"
import { Spinner } from "@tecton/react/components/spinner"

export function SpinnerButton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button disabled size="sm">
        <Spinner data-icon="inline-start" />
        Loading...
      </Button>
      <Button variant="outline" disabled size="sm">
        <Spinner data-icon="inline-start" />
        Please wait
      </Button>
      <Button variant="secondary" disabled size="sm">
        <Spinner data-icon="inline-start" />
        Processing
      </Button>
    </div>
  )
}
