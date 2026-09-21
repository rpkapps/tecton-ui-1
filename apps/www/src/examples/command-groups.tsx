// Synced from shadcn/ui (apps/v4/examples/aria/command-groups.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { CalculateIcon, CalendarMonthIcon, CreditCardIcon, PersonIcon, SentimentSatisfiedIcon, SettingsIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@tecton/react/components/command"

export function CommandWithGroups() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList
            renderEmptyState={() => (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          >
            <CommandGroup heading="Suggestions">
              <CommandItem textValue="Calendar">
                <CalendarMonthIcon />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem textValue="Search Emoji">
                <SentimentSatisfiedIcon />
                <span>Search Emoji</span>
              </CommandItem>
              <CommandItem textValue="Calculator">
                <CalculateIcon />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem textValue="Profile">
                <PersonIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Billing">
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Settings">
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
