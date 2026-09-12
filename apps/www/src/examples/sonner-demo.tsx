// Synced from shadcn/ui (apps/v4/examples/aria/sonner-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { toast } from "sonner"

import { Button } from "@tecton/react/components/button"

export function SonnerDemo() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
      }
    >
      Show Toast
    </Button>
  )
}
