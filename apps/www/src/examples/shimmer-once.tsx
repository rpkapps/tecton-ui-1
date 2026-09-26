// Synced from shadcn/ui (apps/v4/examples/aria/shimmer-once.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"

export function ShimmerOnce() {
  const [key, setKey] = React.useState(0)

  return (
    <div className="flex flex-col items-center gap-4">
      <p
        key={key}
        className="shimmer text-sm text-muted-foreground shimmer-duration-1100 shimmer-once"
      >
        Generating response&hellip;
      </p>
      <Button
        variant="outline"
        size="sm"
        onPress={() => setKey((value) => value + 1)}
      >
        Replay
      </Button>
    </div>
  )
}
