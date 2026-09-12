"use client"

import * as React from "react"
import { cn } from "cn"
import {
  Dialog as DialogPrimitive,
  DialogTrigger as DialogTriggerPrimitive,
  Popover as PopoverPrimitive,
  type Key,
} from "react-aria-components"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@tecton/react/components/command"

/**
 * Tecton AppFinder — the shell's application switcher. The trigger shows
 * the current app as a compact badge in the top bar; the menu is a
 * searchable, category-grouped list built on `Command`, so it stays
 * usable with a hundred registered micro-frontends. Typing filters
 * across every group; `onAction` on `AppFinderList` receives the chosen
 * app id and the popover closes.
 */

const AppFinderContext = React.createContext<{ close: () => void }>({
  close: () => {},
})

function AppFinder({
  ...props
}: React.ComponentProps<typeof DialogTriggerPrimitive>) {
  return <DialogTriggerPrimitive data-slot="app-finder" {...props} />
}

function AppFinderTrigger({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  children?: React.ReactNode
}) {
  return (
    <Button
      data-slot="app-finder-trigger"
      variant="secondary"
      size="sm"
      className={cn(
        "gap-1.5 rounded-full pr-1.5 pl-2 font-medium tracking-wide uppercase",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-icon="inline-end"
        className="size-3 text-muted-foreground"
      />
    </Button>
  )
}

type AppFinderMenuProps = Omit<
  React.ComponentProps<typeof PopoverPrimitive>,
  "children" | "className"
> & {
  className?: string
  /** `AppFinderInput`, `AppFinderList`, … */
  children: React.ReactNode
  /** Accessible name of the palette. */
  "aria-label"?: string
}

function AppFinderMenu({
  className,
  children,
  placement = "bottom start",
  offset = 6,
  "aria-label": ariaLabel = "Applications",
  ...props
}: AppFinderMenuProps) {
  return (
    <PopoverPrimitive
      data-slot="app-finder-menu"
      placement={placement}
      offset={offset}
      className={cn(
        "z-50 w-[28rem] max-w-[calc(100vw-1rem)] origin-(--trigger-anchor-point) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-entering:animate-in data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:fade-out-0 data-exiting:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2",
        className
      )}
      {...props}
    >
      <DialogPrimitive aria-label={ariaLabel} className="outline-none">
        {({ close }) => (
          <AppFinderContext.Provider value={{ close }}>
            <Command className="rounded-lg!">{children}</Command>
          </AppFinderContext.Provider>
        )}
      </DialogPrimitive>
    </PopoverPrimitive>
  )
}

function AppFinderInput({
  placeholder = "Search applications…",
  ...props
}: React.ComponentProps<typeof CommandInput>) {
  return (
    <CommandInput
      data-slot="app-finder-input"
      placeholder={placeholder}
      {...props}
    />
  )
}

type AppFinderListProps = Omit<
  React.ComponentProps<typeof CommandList>,
  "onAction" | "renderEmptyState"
> & {
  /** Called with the `id` of the chosen app; the menu closes afterwards. */
  onAction?: (key: Key) => void
  /** Shown when the search matches nothing. */
  emptyMessage?: React.ReactNode
}

function AppFinderList({
  className,
  onAction,
  emptyMessage = "No applications match.",
  ...props
}: AppFinderListProps) {
  const { close } = React.useContext(AppFinderContext)
  return (
    <CommandList
      data-slot="app-finder-list"
      className={cn("max-h-[min(24rem,60vh)]", className)}
      renderEmptyState={() => <CommandEmpty>{emptyMessage}</CommandEmpty>}
      onAction={(key) => {
        onAction?.(key)
        close()
      }}
      {...props}
    />
  )
}

function AppFinderGroup({
  ...props
}: React.ComponentProps<typeof CommandGroup>) {
  return <CommandGroup data-slot="app-finder-group" {...props} />
}

type AppFinderItemProps = Omit<
  React.ComponentProps<typeof CommandItem>,
  "children" | "textValue"
> & {
  /** Leading glyph or short code of the app. */
  icon?: React.ReactNode
  /** Display name; also the `textValue` used by the filter. */
  name: string
  description?: React.ReactNode
  /** Extra words the filter should match (short code, aliases). */
  keywords?: string[]
  /** Marks the app the shell is currently showing. */
  isCurrent?: boolean
}

function AppFinderItem({
  className,
  icon,
  name,
  description,
  keywords,
  isCurrent,
  ...props
}: AppFinderItemProps) {
  return (
    <CommandItem
      data-slot="app-finder-item"
      data-current={isCurrent || undefined}
      textValue={[name, ...(keywords ?? [])].join(" ")}
      className={cn("items-start gap-3 rounded-md px-2 py-2", className)}
      {...props}
    >
      {icon ? (
        <span
          data-slot="app-finder-item-icon"
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-medium text-foreground [&_svg:not([class*='size-'])]:size-4"
        >
          {icon}
        </span>
      ) : null}
      <span className="grid min-w-0 flex-1 gap-0.5 leading-tight">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {isCurrent ? (
            <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
              Current
            </span>
          ) : null}
        </span>
        {description ? (
          <span className="truncate text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </CommandItem>
  )
}

export {
  AppFinder,
  AppFinderTrigger,
  AppFinderMenu,
  AppFinderInput,
  AppFinderList,
  AppFinderGroup,
  AppFinderItem,
}
export type { AppFinderItemProps, AppFinderListProps, AppFinderMenuProps }
