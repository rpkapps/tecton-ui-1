// Synced from shadcn/ui (apps/v4/examples/aria/separator-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Separator } from "@tecton/react/components/separator"

export default function SeparatorDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1.5">
        <div className="leading-none font-medium">Tecton UI</div>
        <div className="text-muted-foreground">
          The Tecton design system for React
        </div>
      </div>
      <Separator />
      <div>
        Components, icons and blocks that carry the Tecton look in every application.
      </div>
    </div>
  )
}
