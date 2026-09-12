// Synced from shadcn/ui (apps/v4/examples/aria/badge-variants.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Badge } from "@tecton/react/components/badge"

export function BadgeVariants() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  )
}
