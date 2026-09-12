import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { StatusAlert } from "@tecton/react/tecton/status-alert"

export default function StatusAlertDismissible() {
  const [open, setOpen] = React.useState(true)

  if (!open) {
    return (
      <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
        Show alert
      </Button>
    )
  }

  return (
    <StatusAlert
      className="max-w-md"
      severity="success"
      title="Three FDA alternatives ranked"
      description="Alternative B has the lowest cost per barrel."
      action={
        <Button variant="ghost" size="sm">
          View
        </Button>
      }
      onDismiss={() => setOpen(false)}
    />
  )
}
