// Synced from shadcn/ui (apps/v4/examples/aria/badge-icon.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { BookmarkIcon, VerifiedIcon } from "@tecton/react/icons"

import { Badge } from "@tecton/react/components/badge"

export function BadgeWithIconLeft() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">
        <VerifiedIcon data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="outline">
        Bookmark
        <BookmarkIcon data-icon="inline-end" />
      </Badge>
    </div>
  )
}
