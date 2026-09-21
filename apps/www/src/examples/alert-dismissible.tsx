"use client"

import * as React from "react"
import { CheckCircleIcon, CloseIcon } from "@tecton/react/icons"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
import { Button } from "@tecton/react/components/button"

export default function AlertDismissible() {
  const [open, setOpen] = React.useState(true)

  if (!open) {
    return (
      <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
        Show alert
      </Button>
    )
  }

  return (
    <Alert variant="success" className="max-w-md">
      <CheckCircleIcon />
      <AlertTitle>Three FDA alternatives ranked</AlertTitle>
      <AlertDescription>
        Alternative B has the lowest cost per barrel.
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="xs">
          View
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onPress={() => setOpen(false)}
        >
          <CloseIcon />
        </Button>
      </AlertAction>
    </Alert>
  )
}
