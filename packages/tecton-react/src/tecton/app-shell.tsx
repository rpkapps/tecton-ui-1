"use client"

import * as React from "react"
import { cn } from "cn"
import { EllipsisVerticalIcon, SearchIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tecton/react/components/avatar"
import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Kbd } from "@tecton/react/components/kbd"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@tecton/react/components/resizable"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"
import { ShortcutKeys } from "@tecton/react/tecton/shortcuts"

/**
 * Tecton AppShell — the application frame: a solid top navigation bar,
 * an optional left rail/sidebar, the main work area and an optional right
 * aside for tool panels. Pure layout; combine with `Sidebar` for the
 * collapsible navigation or with `Panel` for the aside.
 */
function AppShell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell"
      className={cn(
        "grid h-svh w-full grid-rows-[auto_1fr] overflow-hidden bg-background text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AppShellHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="app-shell-header"
      className={cn(
        "flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle bg-card px-3 text-sm",
        className
      )}
      {...props}
    />
  )
}

function AppShellBrand({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-brand"
      className={cn(
        "flex items-center gap-2 font-medium [&_svg]:size-5",
        className
      )}
      {...props}
    />
  )
}

function AppShellNav({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="app-shell-nav"
      className={cn("flex min-w-0 flex-1 items-center gap-1", className)}
      {...props}
    />
  )
}

function AppShellBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-body"
      className={cn("flex min-h-0 w-full overflow-hidden", className)}
      {...props}
    />
  )
}

function AppShellSidebar({
  className,
  ...props
}: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="app-shell-sidebar"
      className={cn(
        "flex w-64 shrink-0 flex-col overflow-auto border-r border-border-subtle bg-sidebar text-sidebar-foreground",
        className
      )}
      {...props}
    />
  )
}

function AppShellMain({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="app-shell-main"
      className={cn("relative min-w-0 flex-1 overflow-auto", className)}
      {...props}
    />
  )
}

function AppShellAside({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="app-shell-aside"
      className={cn(
        "flex w-80 shrink-0 flex-col overflow-auto border-l border-border-subtle bg-card",
        className
      )}
      {...props}
    />
  )
}

/**
 * The global action cluster at the end of the shell header: command
 * palette trigger, icon actions (help, settings, release notes, bug
 * report) and the user menu. These are owned by the shell, not by the
 * mounted application.
 */
function AppShellActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  )
}

type AppShellActionProps = React.ComponentProps<typeof Button> & {
  /** Accessible name, also shown as the tooltip. */
  label: string
  /**
   * Optional shortcut hint rendered in the tooltip, in `shortcuts` key
   * syntax (`"mod+k"`, `"?"`, `"g w"`).
   */
  shortcut?: string
}

function AppShellAction({
  label,
  shortcut,
  className,
  children,
  ...props
}: AppShellActionProps) {
  return (
    <TooltipTrigger>
      <Button
        data-slot="app-shell-action"
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        className={cn("text-muted-foreground hover:text-foreground", className)}
        {...props}
      >
        {children}
      </Button>
      <Tooltip placement="bottom">
        {label}
        {shortcut ? <ShortcutKeys keys={shortcut} className="ms-1" /> : null}
      </Tooltip>
    </TooltipTrigger>
  )
}

type AppShellCommandTriggerProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  children?: React.ReactNode
  /** Shortcut hint shown at the end of the trigger. */
  shortcut?: React.ReactNode
}

/**
 * Command palette trigger: a search-styled field on `md` and up, an icon
 * button below it.
 */
function AppShellCommandTrigger({
  className,
  children = "Search",
  shortcut = "⌘K",
  ...props
}: AppShellCommandTriggerProps) {
  const label = typeof children === "string" ? children : "Search"
  return (
    <Button
      data-slot="app-shell-command-trigger"
      variant="outline"
      size="sm"
      aria-label={label}
      className={cn(
        "h-7 w-7 justify-center gap-2 border-transparent bg-transparent px-0 font-normal text-muted-foreground hover:text-foreground md:mr-1 md:w-40 md:justify-start md:border-border md:bg-muted/40 md:px-2 lg:w-56",
        className
      )}
      {...props}
    >
      <SearchIcon className="size-4 md:size-3.5" />
      <span className="hidden flex-1 truncate text-left md:inline">
        {children}
      </span>
      {shortcut ? (
        <Kbd className="pointer-events-none hidden lg:inline-flex">
          {shortcut}
        </Kbd>
      ) : null}
    </Button>
  )
}

function AppShellDivider({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      data-slot="app-shell-divider"
      className={cn("mx-1 h-4 w-px bg-border", className)}
      {...props}
    />
  )
}

type AppShellOverflowProps = Omit<
  React.ComponentProps<typeof DropdownMenuTrigger>,
  "children"
> & {
  /** Accessible name of the trigger (default "More"). */
  label?: string
  /** Menu contents (`DropdownMenuGroup`, `DropdownMenuItem`, …). */
  children: React.ReactNode
  className?: string
}

/**
 * Overflow menu for actions that do not fit a narrow header. Pair it with
 * responsive classes: hide the icon actions below a breakpoint and show
 * this menu instead.
 */
function AppShellOverflow({
  label = "More",
  className,
  children,
  ...props
}: AppShellOverflowProps) {
  return (
    <DropdownMenuTrigger data-slot="app-shell-overflow" {...props}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        className={cn("text-muted-foreground hover:text-foreground", className)}
      >
        <EllipsisVerticalIcon />
      </Button>
      <DropdownMenu placement="bottom end" className="min-w-48 rounded-lg">
        {children}
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}

type AppShellUserMenuProps = Omit<
  React.ComponentProps<typeof DropdownMenuTrigger>,
  "children"
> & {
  user: { name: string; initials: string; image?: string }
  /** Menu contents (`DropdownMenuGroup`, `DropdownMenuItem`, …). */
  children: React.ReactNode
  className?: string
}

function AppShellUserMenu({
  user,
  className,
  children,
  ...props
}: AppShellUserMenuProps) {
  return (
    <DropdownMenuTrigger data-slot="app-shell-user-menu" {...props}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Account: ${user.name}`}
        className={cn("ml-1 rounded-full", className)}
      >
        <Avatar size="sm">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </Button>
      <DropdownMenu placement="bottom end" className="min-w-56 rounded-lg">
        {children}
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}

/**
 * Resizable split inside the body: wrap the main area and a full-height
 * aside (or sidebar) in `AppShellSplit`, each in an `AppShellSplitPanel`,
 * with an `AppShellSplitHandle` between them. Sizes accept the
 * react-resizable-panels units (`"320px"`, `"25%"`, `"20rem"`).
 */
function AppShellSplit({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof ResizablePanelGroup>) {
  return (
    <ResizablePanelGroup
      data-slot="app-shell-split"
      orientation={orientation}
      className={cn("min-h-0 min-w-0 flex-1", className)}
      {...props}
    />
  )
}

function AppShellSplitPanel({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePanel>) {
  return (
    <ResizablePanel
      data-slot="app-shell-split-panel"
      className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden", className)}
      {...props}
    />
  )
}

function AppShellSplitHandle({
  className,
  ...props
}: React.ComponentProps<typeof ResizableHandle>) {
  return (
    <ResizableHandle
      data-slot="app-shell-split-handle"
      className={cn(
        "bg-border-subtle transition-colors after:z-10 after:w-1.5 hover:bg-primary/60 focus-visible:bg-primary active:bg-primary",
        className
      )}
      {...props}
    />
  )
}

/**
 * True once the viewport is at least `minWidth` pixels wide (false during
 * SSR). Use it to decide whether a full-height aside is rendered at all.
 */
function useMinWidth(minWidth: number) {
  const query = `(min-width: ${minWidth}px)`
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    [query]
  )
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

export {
  AppShell,
  AppShellHeader,
  AppShellBrand,
  AppShellNav,
  AppShellBody,
  AppShellSidebar,
  AppShellMain,
  AppShellAside,
  AppShellActions,
  AppShellAction,
  AppShellCommandTrigger,
  AppShellDivider,
  AppShellOverflow,
  AppShellUserMenu,
  AppShellSplit,
  AppShellSplitPanel,
  AppShellSplitHandle,
  useMinWidth,
}
export type {
  AppShellActionProps,
  AppShellCommandTriggerProps,
  AppShellOverflowProps,
  AppShellUserMenuProps,
}
