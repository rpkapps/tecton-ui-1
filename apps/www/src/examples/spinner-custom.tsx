// Synced from shadcn/ui (apps/v4/examples/aria/spinner-custom.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { cn } from "cn"
import { ProgressActivityIcon } from "@tecton/react/icons"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <ProgressActivityIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export function SpinnerCustom() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  )
}
