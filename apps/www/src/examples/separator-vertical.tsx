// Synced from shadcn/ui (apps/v4/examples/base/separator-vertical.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Separator } from "@tecton/react/components/separator"

export function SeparatorVertical() {
  return (
    <div className="flex h-5 items-center gap-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
    </div>
  )
}
