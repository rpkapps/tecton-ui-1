"use client"

import * as React from "react"
import { AppWindowIcon, CommandIcon } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
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
  commands?: ShellCommand[]
  onSelectApp?: (app: ShellApp) => void
  onRunCommand?: (command: ShellCommand) => void
}

/**
 * Shell command palette: switch application or run a global action.
 * Opened with ⌘K / Ctrl+K from anywhere in the shell.
 */
function ShellCommandPalette({
  open,
  onOpenChange,
  apps = defaultApps,
  commands = defaultCommands,
  onSelectApp,
  onRunCommand,
}: ShellCommandPaletteProps) {
  const groups = React.useMemo(() => {
    const byGroup = new Map<ShellCommand["group"], ShellCommand[]>()
    for (const command of commands) {
      byGroup.set(command.group, [
        ...(byGroup.get(command.group) ?? []),
        command,
      ])
    }
    return [...byGroup.entries()]
  }, [commands])

  const close = () => onOpenChange(false)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search apps and commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groupApps(apps).map((group) => (
          <CommandGroup key={group.category} heading={group.category}>
            {group.apps.map((app) => (
              <CommandItem
                key={app.id}
                id={`app-${app.id}`}
                textValue={`${app.code} ${app.name} ${app.category}`}
                onAction={() => {
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
        {groups.map(([group, items]) => (
          <React.Fragment key={group}>
            <CommandSeparator />
            <CommandGroup heading={group}>
              {items.map((command) => (
                <CommandItem
                  key={command.id}
                  id={command.id}
                  textValue={command.label}
                  onAction={() => {
                    onRunCommand?.(command)
                    close()
                  }}
                >
                  <CommandIcon />
                  <span>{command.label}</span>
                  {command.shortcut ? (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export { ShellCommandPalette }
export type { ShellCommandPaletteProps }
