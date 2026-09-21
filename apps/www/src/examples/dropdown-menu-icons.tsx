// Synced from shadcn/ui (apps/v4/examples/aria/dropdown-menu-icons.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { CreditCardIcon, LogoutIcon, PersonIcon, SettingsIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuIcons() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu>
        <DropdownMenuItem>
          <PersonIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCardIcon />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogoutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
