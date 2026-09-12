"use client"

import * as React from "react"
import { cn } from "cn"
import {
  BugIcon,
  CircleHelpIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@tecton/react/components/dropdown-menu"
import {
  AppFinder,
  AppFinderGroup,
  AppFinderInput,
  AppFinderItem,
  AppFinderList,
  AppFinderMenu,
  AppFinderTrigger,
} from "@tecton/react/tecton/app-finder"
import { AppShellHeader, AppShellNav } from "@tecton/react/tecton/app-shell"
import {
  ShellAction,
  ShellActions,
  ShellCommandTrigger,
  ShellDivider,
  ShellUserMenu,
} from "@tecton/react/tecton/shell-actions"

import { ShellCommandPalette } from "./shell-command-palette"
import {
  apps as defaultApps,
  currentUser,
  groupApps,
  recentAppIds as defaultRecentAppIds,
} from "../data"
import type { ShellApp, ShellUser } from "../data"

type ShellHeaderProps = Omit<
  React.ComponentProps<typeof AppShellHeader>,
  "children"
> & {
  apps?: ShellApp[]
  /** Id of the mounted application. */
  appId?: string
  onAppChange?: (app: ShellApp) => void
  user?: ShellUser
  /** Ids of recently used apps, listed first in the finder. */
  recentAppIds?: string[]
  /** Context shown after the home button: breadcrumb, workspace tabs, etc. */
  children?: React.ReactNode
}

/**
 * The host's top bar: app finder, home, application context and the
 * global action cluster. The mounted application only renders inside
 * `children` (its context) and the main region below.
 */
function ShellHeader({
  className,
  apps = defaultApps,
  appId,
  onAppChange,
  user = currentUser,
  recentAppIds = defaultRecentAppIds,
  children,
  ...props
}: ShellHeaderProps) {
  const [internalAppId, setInternalAppId] = React.useState(apps[0]?.id)
  const currentId = appId ?? internalAppId
  const current = apps.find((app) => app.id === currentId) ?? apps[0]
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const recent = recentAppIds
    .map((id) => apps.find((item) => item.id === id))
    .filter((item): item is ShellApp => Boolean(item))
  const groups = groupApps(apps)

  const selectApp = (app: ShellApp) => {
    setInternalAppId(app.id)
    onAppChange?.(app)
  }

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <AppShellHeader
      data-slot="shell-header"
      className={cn("gap-2 px-2", className)}
      {...props}
    >
      <AppFinder>
        <AppFinderTrigger
          aria-label={`Switch application, current: ${current.name}`}
        >
          {current.code}
        </AppFinderTrigger>
        <AppFinderMenu>
          <AppFinderInput />
          <AppFinderList
            onAction={(key) => {
              const id = String(key).replace(/^recent-/, "")
              const app = apps.find((item) => item.id === id)
              if (app) selectApp(app)
            }}
          >
            {recent.length ? (
              <AppFinderGroup heading="Recent">
                {recent.map((app) => (
                  <AppFinderItem
                    key={`recent-${app.id}`}
                    id={`recent-${app.id}`}
                    icon={app.code}
                    name={app.name}
                    description={app.description}
                    keywords={[app.code, app.category]}
                    isCurrent={app.id === current.id}
                  />
                ))}
              </AppFinderGroup>
            ) : null}
            {groups.map((group) => (
              <AppFinderGroup key={group.category} heading={group.category}>
                {group.apps.map((app) => (
                  <AppFinderItem
                    key={app.id}
                    id={app.id}
                    icon={app.code}
                    name={app.name}
                    description={app.description}
                    keywords={[app.code, app.category]}
                    isCurrent={app.id === current.id}
                  />
                ))}
              </AppFinderGroup>
            ))}
          </AppFinderList>
        </AppFinderMenu>
      </AppFinder>
      <ShellDivider />
      <Button variant="ghost" size="icon-sm" aria-label="Home">
        <HomeIcon />
      </Button>
      <AppShellNav>{children}</AppShellNav>
      <ShellActions>
        <ShellCommandTrigger onPress={() => setPaletteOpen(true)}>
          Search or jump to…
        </ShellCommandTrigger>
        <ShellAction label="Help" shortcut="?">
          <CircleHelpIcon />
        </ShellAction>
        <ShellAction label="What's new">
          <SparklesIcon />
        </ShellAction>
        <ShellAction label="Report a bug">
          <BugIcon />
        </ShellAction>
        <ShellAction label="Settings">
          <SettingsIcon />
        </ShellAction>
        <ShellUserMenu user={user}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="grid leading-tight">
                <span className="truncate font-medium text-foreground">
                  {user.name}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem textValue="Profile">
              <UserIcon /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem textValue="Preferences">
              <SettingsIcon /> Preferences
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem textValue="Sign out">
              <LogOutIcon /> Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </ShellUserMenu>
      </ShellActions>
      <ShellCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        apps={apps}
        onSelectApp={selectApp}
      />
    </AppShellHeader>
  )
}

export { ShellHeader }
export type { ShellHeaderProps }
