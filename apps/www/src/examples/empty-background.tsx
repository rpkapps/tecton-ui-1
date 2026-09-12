// Synced from shadcn/ui (apps/v4/examples/aria/empty-background.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { BellIcon } from "lucide-react"
import { RefreshCcwIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"

export function EmptyMuted() {
  return (
    <Empty className="h-full bg-muted/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BellIcon />
        </EmptyMedia>
        <EmptyTitle>No Notifications</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">
          You&apos;re all caught up. New notifications will appear here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">
          <RefreshCcwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  )
}
