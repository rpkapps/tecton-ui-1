// Synced from shadcn/ui (apps/v4/examples/aria/dropdown-menu-complex.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { CodeBlocksIcon, CreditCardIcon, DarkModeIcon, DescriptionIcon, DownloadIcon, DraftIcon, FolderIcon, FolderMatchIcon, FolderOpenIcon, HelpIcon, KeyboardIcon, LightModeIcon, LogoutIcon, MailIcon, MonitorIcon, MoreHorizIcon, NotificationsIcon, PaletteIcon, PersonIcon, SaveIcon, SettingsIcon, ShieldIcon, SpaceDashboardIcon, TranslateIcon, VisibilityIcon } from "@tecton/react/icons"
import type { Selection } from "react-aria-components"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuComplex() {
  const [notifications, setNotifications] = React.useState<Selection>(
    new Set(["email", "push"])
  )
  const [theme, setTheme] = React.useState("light")

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Complex Menu</Button>
      <DropdownMenu className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>File</DropdownMenuLabel>
          <DropdownMenuItem>
            <DraftIcon />
            New File
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderIcon />
            New Folder
            <DropdownMenuShortcut>⇧⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderOpenIcon />
              Open Recent
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Recent Projects</DropdownMenuLabel>
                <DropdownMenuItem>
                  <CodeBlocksIcon />
                  Project Alpha
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CodeBlocksIcon />
                  Project Beta
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <MoreHorizIcon />
                    More Projects
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>
                      <CodeBlocksIcon />
                      Project Gamma
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CodeBlocksIcon />
                      Project Delta
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <FolderMatchIcon />
                  Browse...
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <SaveIcon />
            Save
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DownloadIcon />
            Export
            <DropdownMenuShortcut>⇧⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup
          selectionMode="multiple"
          selectedKeys={notifications}
          onSelectionChange={setNotifications}
        >
          <DropdownMenuLabel>View</DropdownMenuLabel>
          <DropdownMenuItem id="email">
            <VisibilityIcon />
            Show Sidebar
          </DropdownMenuItem>
          <DropdownMenuItem id="sms">
            <SpaceDashboardIcon />
            Show Status Bar
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <PaletteIcon />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuGroup
                selectionMode="single"
                selectedKeys={[theme]}
                onSelectionChange={(keys) => setTheme([...keys][0] as string)}
              >
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuItem id="light">
                  <LightModeIcon />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem id="dark">
                  <DarkModeIcon />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem id="system">
                  <MonitorIcon />
                  System
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <PersonIcon />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SettingsIcon />
              Settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Preferences</DropdownMenuLabel>
                <DropdownMenuItem>
                  <KeyboardIcon />
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <TranslateIcon />
                  Language
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <NotificationsIcon />
                    Notifications
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuGroup
                      selectionMode="multiple"
                      selectedKeys={notifications}
                      onSelectionChange={setNotifications}
                    >
                      <DropdownMenuLabel>Notification Types</DropdownMenuLabel>
                      <DropdownMenuItem id="push">
                        <NotificationsIcon />
                        Push Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem id="email">
                        <MailIcon />
                        Email Notifications
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <ShieldIcon />
                  Privacy & Security
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <HelpIcon />
            Help & Support
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DescriptionIcon />
            Documentation
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <LogoutIcon />
            Sign Out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
