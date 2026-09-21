// Synced from shadcn/ui (apps/v4/examples/aria/dropdown-menu-checkboxes-icons.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { ChatIcon, MailIcon, NotificationsIcon } from "@tecton/react/icons"
import type { Selection } from "react-aria-components"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuCheckboxesIcons() {
  const [notifications, setNotifications] = React.useState<Selection>(
    new Set(["email", "push"])
  )

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Notifications</Button>
      <DropdownMenu className="w-48">
        <DropdownMenuGroup
          selectionMode="multiple"
          selectedKeys={notifications}
          onSelectionChange={setNotifications}
        >
          <DropdownMenuLabel>Notification Preferences</DropdownMenuLabel>
          <DropdownMenuItem id="email">
            <MailIcon />
            Email notifications
          </DropdownMenuItem>
          <DropdownMenuItem id="sms">
            <ChatIcon />
            SMS notifications
          </DropdownMenuItem>
          <DropdownMenuItem id="push">
            <NotificationsIcon />
            Push notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
