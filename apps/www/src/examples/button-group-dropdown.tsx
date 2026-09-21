// Synced from shadcn/ui (apps/v4/examples/aria/button-group-dropdown.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { CheckIcon, ChevronDownIcon, CopyIcon, DeleteIcon, PersonRemoveIcon, ShareIcon, VolumeOffIcon, WarningIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export default function ButtonGroupDropdown() {
  return (
    <ButtonGroup>
      <Button variant="outline">Follow</Button>
      <DropdownMenuTrigger>
        <Button variant="outline" className="pl-2!">
          <ChevronDownIcon />
        </Button>
        <DropdownMenu placement="bottom end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <VolumeOffIcon />
              Mute Conversation
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckIcon />
              Mark as Read
            </DropdownMenuItem>
            <DropdownMenuItem>
              <WarningIcon />
              Report Conversation
            </DropdownMenuItem>
            <DropdownMenuItem>
              <PersonRemoveIcon />
              Block User
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ShareIcon />
              Share Conversation
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CopyIcon />
              Copy Conversation
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">
              <DeleteIcon />
              Delete Conversation
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenu>
      </DropdownMenuTrigger>
    </ButtonGroup>
  )
}
