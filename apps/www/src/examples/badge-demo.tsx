// Synced from shadcn/ui (apps/v4/examples/base/badge-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Badge } from "@tecton/react/components/badge"

export default function BadgeDemo() {
  return (
    <div className="flex w-full flex-wrap justify-center gap-2">
      <Badge>Badge</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  )
}
