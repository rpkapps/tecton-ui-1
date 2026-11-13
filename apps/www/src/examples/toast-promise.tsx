// Synced from shadcn/ui (apps/v4/examples/base/toast-promise.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { Button } from "@tecton/react/button"
import { toast } from "@tecton/react/toast"

export function ToastPromise() {
  function showToast() {
    toast.promise(
      new Promise<{ name: string }>((resolve) => {
        window.setTimeout(() => resolve({ name: "Event" }), 2000)
      }),
      {
        loading: "Creating event…",
        success: (data) => `${data.name} created.`,
        error: "Could not create event.",
      }
    )
  }

  return (
    <Button variant="outline" onClick={showToast}>
      Create Event
    </Button>
  )
}
