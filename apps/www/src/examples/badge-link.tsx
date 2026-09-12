// Synced from shadcn/ui (apps/v4/examples/aria/badge-link.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { ArrowUpRightIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"

export function BadgeAsLink() {
  return (
    <Badge render={(props) => <a {...props} href="#link" />}>
      Open Link <ArrowUpRightIcon data-icon="inline-end" />
    </Badge>
  )
}
