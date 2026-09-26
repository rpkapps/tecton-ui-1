import {
  BugIcon,
  CircleHelpIcon,
  LogOutIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@tecton/react/components/dropdown-menu"
import {
  AppShell,
  AppShellAction,
  AppShellActions,
  AppShellBrand,
  AppShellCommandTrigger,
  AppShellHeader,
  AppShellUserMenu,
} from "@tecton/react/tecton/app-shell"

export default function AppShellActionsExample() {
  return (
    <AppShell className="h-auto w-full max-w-3xl overflow-visible rounded-lg border">
      <AppShellHeader className="rounded-lg border-b-0">
        <AppShellBrand>Tecton</AppShellBrand>
        <AppShellActions>
          <AppShellCommandTrigger shortcut="⌘K">
            Search or jump to…
          </AppShellCommandTrigger>
          <AppShellAction label="Help" shortcut="?">
            <CircleHelpIcon />
          </AppShellAction>
          <AppShellAction label="What's new">
            <SparklesIcon />
          </AppShellAction>
          <AppShellAction label="Report a bug">
            <BugIcon />
          </AppShellAction>
          <AppShellAction label="Settings">
            <SettingsIcon />
          </AppShellAction>
          <AppShellUserMenu user={{ name: "Sarah Elliott", initials: "SE" }}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sarah Elliott</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOutIcon /> Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </AppShellUserMenu>
        </AppShellActions>
      </AppShellHeader>
    </AppShell>
  )
}
