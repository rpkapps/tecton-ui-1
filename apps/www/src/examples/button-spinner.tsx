// Synced from shadcn/ui (apps/v4/examples/aria/button-spinner.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/components/button"
import { Spinner } from "@tecton/react/components/spinner"

export default function ButtonLoading() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" isDisabled>
        <Spinner data-icon="inline-start" />
        Generating
      </Button>
      <Button variant="secondary" isDisabled>
        Downloading
        <Spinner data-icon="inline-start" />
      </Button>
    </div>
  )
}
