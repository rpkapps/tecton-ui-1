// Synced from shadcn/ui (apps/v4/examples/base/toast-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { Button } from "@tecton/react/button"
import { toast } from "@tecton/react/toast"

export function ToastDemo() {
  function showToast() {
    const id = toast.add({
      title: "Event created",
      description: "Sunday, December 3 at 9:00 AM",
      actionProps: {
        children: "Undo",
        onClick() {
          toast.close(id)
        },
      },
    })
  }

  return (
    <Button variant="outline" onClick={showToast}>
      Show Toast
    </Button>
  )
}
