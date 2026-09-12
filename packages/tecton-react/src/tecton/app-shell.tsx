import * as React from "react"
import { cn } from "cn"

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

function AppShellHeader({ className, ...props }: React.ComponentProps<"header">) {
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
      className={cn("flex items-center gap-2 font-medium [&_svg]:size-5", className)}
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

function AppShellHeaderActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-header-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-1", className)}
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

function AppShellSidebar({ className, ...props }: React.ComponentProps<"aside">) {
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

export {
  AppShell,
  AppShellHeader,
  AppShellBrand,
  AppShellNav,
  AppShellHeaderActions,
  AppShellBody,
  AppShellSidebar,
  AppShellMain,
  AppShellAside,
}
