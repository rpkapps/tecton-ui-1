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
  AppShellBrand,
  AppShellHeader,
} from "@tecton/react/tecton/app-shell"
import {
  ShellAction,
  ShellActions,
  ShellCommandTrigger,
  ShellUserMenu,
} from "@tecton/react/tecton/shell-actions"

export default function ShellActionsDemo() {
  return (
    <AppShell className="h-auto w-full max-w-3xl overflow-visible rounded-lg border">
      <AppShellHeader className="rounded-lg border-b-0">
        <AppShellBrand>Tecton</AppShellBrand>
        <ShellActions>
          <ShellCommandTrigger>Search or jump to…</ShellCommandTrigger>
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
          <ShellUserMenu user={{ name: "Sarah Elliott", initials: "SE" }}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sarah Elliott</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem textValue="Profile">
                <UserIcon /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem textValue="Sign out">
                <LogOutIcon /> Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </ShellUserMenu>
        </ShellActions>
      </AppShellHeader>
    </AppShell>
  )
}
