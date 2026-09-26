// Synced from shadcn/ui (apps/v4/examples/aria/sonner-description.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { toast } from "sonner"

import { Button } from "@tecton/react/components/button"

export function SonnerDescription() {
  return (
    <Button
      onPress={() =>
        toast("Event has been created", {
          description: "Monday, January 3rd at 6:00pm",
        })
      }
      variant="outline"
      className="w-fit"
    >
      Show Toast
    </Button>
  )
}
