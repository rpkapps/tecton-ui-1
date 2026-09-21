// Synced from shadcn/ui (apps/v4/examples/aria/dropdown-menu-destructive.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { DeleteIcon, EditSquareIcon, ShareIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuDestructive() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Actions</Button>
      <DropdownMenu>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <EditSquareIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShareIcon />
            Share
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <DeleteIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
