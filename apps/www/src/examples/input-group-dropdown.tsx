// Synced from shadcn/ui (apps/v4/examples/aria/input-group-dropdown.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { ChevronDownIcon, MoreHorizIcon } from "@tecton/react/icons"

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@tecton/react/components/input-group"

export function InputGroupDropdown() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupInput placeholder="Enter file name" />
        <InputGroupAddon align="inline-end">
          <DropdownMenuTrigger>
            <InputGroupButton variant="ghost" aria-label="More" size="icon-xs">
              <MoreHorizIcon />
            </InputGroupButton>
            <DropdownMenu placement="bottom end" offset={8} crossOffset={-4}>
              <DropdownMenuGroup>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Copy path</DropdownMenuItem>
                <DropdownMenuItem>Open location</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="Enter search query" />
        <InputGroupAddon align="inline-end">
          <DropdownMenuTrigger>
            <InputGroupButton variant="ghost" className="pr-1.5! text-xs">
              Search In... <ChevronDownIcon className="size-3" />
            </InputGroupButton>
            <DropdownMenu placement="bottom end" offset={8} crossOffset={-4}>
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Blog Posts</DropdownMenuItem>
                <DropdownMenuItem>Changelog</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
