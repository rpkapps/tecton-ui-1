// Synced from shadcn/ui (apps/v4/examples/aria/dropdown-menu-avatar.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { CreditCardIcon, LogoutIcon, NotificationsIcon, VerifiedIcon } from "@tecton/react/icons"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tecton/react/components/avatar"
import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuAvatar() {
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
      </Button>
      <DropdownMenu placement="bottom end">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <VerifiedIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <NotificationsIcon />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
