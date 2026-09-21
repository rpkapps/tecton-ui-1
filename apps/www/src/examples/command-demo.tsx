// Synced from shadcn/ui (apps/v4/examples/aria/command-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { CalculateIcon, CalendarMonthIcon, CreditCardIcon, PersonIcon, SentimentSatisfiedIcon, SettingsIcon } from "@tecton/react/icons"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@tecton/react/components/command"

export function CommandDemo() {
  return (
    <Command className="max-w-sm rounded-lg border">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList
        renderEmptyState={() => <CommandEmpty>No results found.</CommandEmpty>}
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
          <CommandItem textValue="Calculator" isDisabled>
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
  )
}
