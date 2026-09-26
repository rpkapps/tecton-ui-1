// Synced from shadcn/ui (apps/v4/examples/base/badge-colors.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Badge } from "@tecton/react/components/badge"

export function BadgeCustomColors() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-120 text-blue-830">
        Blue
      </Badge>
      <Badge className="bg-green-120 text-green-830">
        Green
      </Badge>
      <Badge className="bg-azure-120 text-azure-830">
        Sky
      </Badge>
      <Badge className="bg-orchid-120 text-orchid-830">
        Purple
      </Badge>
      <Badge className="bg-red-120 text-red-830">
        Red
      </Badge>
    </div>
  )
}
