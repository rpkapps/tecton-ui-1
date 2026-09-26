"use client"

import * as React from "react"
import { AppWindowIcon, CommandIcon } from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@tecton/react/components/command"

import {
  apps as defaultApps,
  commands as defaultCommands,
  groupApps,
} from "../data"
import type { ShellApp, ShellCommand } from "../data"

type ShellCommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  apps?: ShellApp[]
  /** Host commands, listed under their groups. */
  commands?: ShellCommand[]
  onSelectApp?: (app: ShellApp) => void
  onRunCommand?: (command: ShellCommand) => void
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const group = key(item)
    map.set(group, [...(map.get(group) ?? []), item])
  }
  return [...map.entries()]
}

/**
 * Shell command palette: switch application or run a host command. Opened
 * from the header's search trigger.
 */
function ShellCommandPalette({
  open,
  onOpenChange,
  apps = defaultApps,
  commands = defaultCommands,
  onSelectApp,
  onRunCommand,
}: ShellCommandPaletteProps) {
  const commandGroups = React.useMemo(
    () => groupBy(commands, (command) => command.group),
    [commands]
  )

  const close = () => onOpenChange(false)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-none bg-transparent">
        <CommandInput placeholder="Search apps and commands…" />
        <CommandList className="max-h-[60svh]">
          <CommandEmpty>No results found.</CommandEmpty>
          {groupApps(apps).map((group) => (
            <CommandGroup key={group.category} heading={group.category}>
              {group.apps.map((app) => (
                <CommandItem
                  key={app.id}
                  value={`${app.code} ${app.name} ${app.category}`}
                  onSelect={() => {
                    onSelectApp?.(app)
                    close()
                  }}
                >
                  <AppWindowIcon />
                  <span>{app.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {app.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {commandGroups.map(([group, items]) => (
            <React.Fragment key={`commands-${group}`}>
              <CommandSeparator />
              <CommandGroup heading={group}>
                {items.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.label}
                    onSelect={() => {
                      onRunCommand?.(command)
                      close()
                    }}
                  >
                    <CommandIcon />
                    <span>{command.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

export { ShellCommandPalette }
export type { ShellCommandPaletteProps }
