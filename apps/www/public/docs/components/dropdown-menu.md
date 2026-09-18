# Dropdown Menu

Displays a menu to the user — such as a set of actions or functions — triggered by a button.

Source: /docs/components/dropdown-menu.md  
React Aria docs: https://react-aria.adobe.com/Menu  
React Aria API: https://react-aria.adobe.com/Menu#api

**Example — `dropdown-menu-demo`**

```tsx
"use client"

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

export function DropdownMenuDemo() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu className="w-40" placement="bottom start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>

            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>More...</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>GitHub</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem isDisabled>API</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
```

```tsx showLineNumbers
<DropdownMenuTrigger>
  <Button variant="outline">Open</Button>
  <DropdownMenu>
    <DropdownMenuGroup>
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Billing</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>Team</DropdownMenuItem>
      <DropdownMenuItem>Subscription</DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenu>
</DropdownMenuTrigger>
```

## Composition

Use the following composition to build a `DropdownMenu`:

```text
DropdownMenuTrigger
├── Button
└── DropdownMenu
    ├── DropdownMenuGroup
    │   ├── DropdownMenuLabel
    │   ├── DropdownMenuItem
    │   └── DropdownMenuItem
    ├── DropdownMenuSeparator
    ├── DropdownMenuGroup
    │   ├── DropdownMenuLabel
    │   ├── DropdownMenuItem
    │   └── DropdownMenuItem
    └── DropdownMenuSub
        ├── DropdownMenuSubTrigger
        └── DropdownMenuSubContent
            └── DropdownMenuGroup
                ├── DropdownMenuLabel
                ├── DropdownMenuItem
                └── DropdownMenuItem
```

## Basic

A basic dropdown menu with labels and separators.

**Example — `dropdown-menu-basic`**

```tsx
"use client"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuBasic() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuItem isDisabled>API</DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Submenu

Use `DropdownMenuSub` to nest secondary actions.

**Example — `dropdown-menu-submenu`**

```tsx
"use client"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuSubmenu() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu>
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>

            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Message</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>

                <DropdownMenuSubContent>
                  <DropdownMenuItem>Calendly</DropdownMenuItem>
                  <DropdownMenuItem>Slack</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Webhook</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Advanced...</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Shortcuts

Add `DropdownMenuShortcut` to show keyboard hints.

**Example — `dropdown-menu-shortcuts`**

```tsx
"use client"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuShortcuts() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Icons

Combine icons with labels for quick scanning.

**Example — `dropdown-menu-icons`**

```tsx
"use client"

import {
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuIcons() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu>
        <DropdownMenuItem>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCardIcon />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Checkboxes

Use `selectionMode="multiple"` for toggles.

**Example — `dropdown-menu-checkboxes`**

```tsx
"use client"

import * as React from "react"
import type { Selection } from "react-aria-components"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuCheckboxes() {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set(["status-bar"])
  )

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu className="w-40">
        <DropdownMenuGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        >
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuItem id="status-bar">Status Bar</DropdownMenuItem>
          <DropdownMenuItem id="activity-bar" isDisabled>
            Activity Bar
          </DropdownMenuItem>
          <DropdownMenuItem id="panel">Panel</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Checkboxes Icons

Add icons to checkbox items.

**Example — `dropdown-menu-checkboxes-icons`**

```tsx
"use client"

import * as React from "react"
import { BellIcon, MailIcon, MessageSquareIcon } from "lucide-react"
import type { Selection } from "react-aria-components"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuCheckboxesIcons() {
  const [notifications, setNotifications] = React.useState<Selection>(
    new Set(["email", "push"])
  )

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Notifications</Button>
      <DropdownMenu className="w-48">
        <DropdownMenuGroup
          selectionMode="multiple"
          selectedKeys={notifications}
          onSelectionChange={setNotifications}
        >
          <DropdownMenuLabel>Notification Preferences</DropdownMenuLabel>
          <DropdownMenuItem id="email">
            <MailIcon />
            Email notifications
          </DropdownMenuItem>
          <DropdownMenuItem id="sms">
            <MessageSquareIcon />
            SMS notifications
          </DropdownMenuItem>
          <DropdownMenuItem id="push">
            <BellIcon />
            Push notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Radio Group

Use `selectionMode="single"` for exclusive choices.

**Example — `dropdown-menu-radio-group`**

```tsx
"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuRadioGroupDemo() {
  const [position, setPosition] = React.useState("bottom")

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Open</Button>
      <DropdownMenu className="w-32">
        <DropdownMenuGroup
          selectionMode="single"
          selectedKeys={[position]}
          onSelectionChange={(keys) => setPosition([...keys][0] as string)}
        >
          <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
          <DropdownMenuItem id="top">Top</DropdownMenuItem>
          <DropdownMenuItem id="bottom">Bottom</DropdownMenuItem>
          <DropdownMenuItem id="right">Right</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Radio Icons

Show radio options with icons.

**Example — `dropdown-menu-radio-icons`**

```tsx
"use client"

import * as React from "react"
import { Building2Icon, CreditCardIcon, WalletIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuRadioIcons() {
  const [paymentMethod, setPaymentMethod] = React.useState("card")

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Payment Method</Button>
      <DropdownMenu className="min-w-56">
        <DropdownMenuGroup
          selectionMode="single"
          selectedKeys={[paymentMethod]}
          onSelectionChange={(keys) => setPaymentMethod([...keys][0] as string)}
        >
          <DropdownMenuLabel>Select Payment Method</DropdownMenuLabel>
          <DropdownMenuItem id="card">
            <CreditCardIcon />
            Credit Card
          </DropdownMenuItem>
          <DropdownMenuItem id="paypal">
            <WalletIcon />
            PayPal
          </DropdownMenuItem>
          <DropdownMenuItem id="bank">
            <Building2Icon />
            Bank Transfer
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Destructive

Use `variant="destructive"` for irreversible actions.

**Example — `dropdown-menu-destructive`**

```tsx
"use client"

import { PencilIcon, ShareIcon, TrashIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuDestructive() {
  return (
    <DropdownMenuTrigger>
      <Button variant="outline">Actions</Button>
      <DropdownMenu>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShareIcon />
            Share
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Avatar

An account switcher dropdown triggered by an avatar.

**Example — `dropdown-menu-avatar`**

```tsx
"use client"

import {
  BadgeCheckIcon,
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tecton/react/components/avatar"
import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export function DropdownMenuAvatar() {
  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
      </Button>
      <DropdownMenu placement="bottom end">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## Complex

A richer example combining groups, icons, and submenus.

**Example — `dropdown-menu-complex`**

```tsx
"use client"

import * as React from "react"
import {
  BellIcon,
  CreditCardIcon,
  DownloadIcon,
  EyeIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderSearchIcon,
  HelpCircleIcon,
  KeyboardIcon,
  LanguagesIcon,
  LayoutIcon,
  LogOutIcon,
  MailIcon,
  MonitorIcon,
  MoonIcon,
  MoreHorizontalIcon,
  PaletteIcon,
  SaveIcon,
  SettingsIcon,
  ShieldIcon,
  SunIcon,
  UserIcon,
} from "lucide-react"
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
            <FileIcon />
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
                  <FileCodeIcon />
                  Project Alpha
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileCodeIcon />
                  Project Beta
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <MoreHorizontalIcon />
                    More Projects
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>
                      <FileCodeIcon />
                      Project Gamma
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileCodeIcon />
                      Project Delta
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <FolderSearchIcon />
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
            <EyeIcon />
            Show Sidebar
          </DropdownMenuItem>
          <DropdownMenuItem id="sms">
            <LayoutIcon />
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
                  <SunIcon />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem id="dark">
                  <MoonIcon />
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
            <UserIcon />
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
                  <LanguagesIcon />
                  Language
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <BellIcon />
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
                        <BellIcon />
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
            <HelpCircleIcon />
            Help & Support
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileTextIcon />
            Documentation
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <LogOutIcon />
            Sign Out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `dropdown-menu-rtl`**

```tsx
"use client"

import * as React from "react"
import { CreditCardIcon, SettingsIcon, UserIcon } from "lucide-react"
import type { Selection } from "react-aria-components"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
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

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      open: "Open",
      account: "Account",
      profile: "Profile",
      billing: "Billing",
      settings: "Settings",
      logout: "Log out",
      team: "Team",
      inviteUsers: "Invite users",
      email: "Email",
      message: "Message",
      more: "More",
      calendar: "Calendar",
      chat: "Chat",
      webhook: "Webhook",
      advanced: "Advanced...",
      newTeam: "New Team",
      view: "View",
      statusBar: "Status Bar",
      activityBar: "Activity Bar",
      panel: "Panel",
      position: "Position",
      top: "Top",
      bottom: "Bottom",
      right: "Right",
      left: "Left",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      open: "افتح القائمة",
      account: "الحساب",
      profile: "الملف الشخصي",
      billing: "الفوترة",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      team: "الفريق",
      inviteUsers: "دعوة المستخدمين",
      email: "البريد الإلكتروني",
      message: "رسالة",
      more: "المزيد",
      calendar: "تقويم",
      chat: "دردشة",
      webhook: "خطاف ويب",
      advanced: "متقدم...",
      newTeam: "فريق جديد",
      view: "عرض",
      statusBar: "شريط الحالة",
      activityBar: "شريط النشاط",
      panel: "اللوحة",
      position: "الموضع",
      top: "أعلى",
      bottom: "أسفل",
      right: "يمين",
      left: "يسار",
    },
  },
  he: {
    dir: "rtl",
    values: {
      open: "פתח תפריט",
      account: "חשבון",
      profile: "פרופיל",
      billing: "חיוב",
      settings: "הגדרות",
      logout: "התנתק",
      team: "הצוות",
      inviteUsers: "הזמן משתמשים",
      email: "אימייל",
      message: "הודעה",
      more: "עוד",
      calendar: "יומן",
      chat: "צ'אט",
      webhook: "Webhook",
      advanced: "מתקדם...",
      newTeam: "צוות חדש",
      view: "תצוגה",
      statusBar: "שורת סטטוס",
      activityBar: "שורת פעילות",
      panel: "לוח",
      position: "מיקום",
      top: "למעלה",
      bottom: "למטה",
      right: "ימין",
      left: "שמאל",
    },
  },
}

export function DropdownMenuRtl() {
  const { dir, language, t } = useTranslation(translations, "ar")
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set(["status-bar"])
  )
  const [position, setPosition] = React.useState("bottom")

  return (
    <DropdownMenuTrigger>
      <Button variant="outline">{t.open}</Button>
      <DropdownMenu
        placement={dir === "rtl" ? "bottom end" : "bottom start"}
        dir={dir}
        className="w-36"
        data-lang={dir === "rtl" ? language : undefined}
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t.account}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              dir={dir}
              data-lang={dir === "rtl" ? language : undefined}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserIcon />
                  {t.profile}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCardIcon />
                  {t.billing}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon />
                  {t.settings}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t.team}</DropdownMenuLabel>
          <DropdownMenuItem>{t.team}</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t.inviteUsers}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              dir={dir}
              data-lang={dir === "rtl" ? language : undefined}
            >
              <DropdownMenuItem>{t.email}</DropdownMenuItem>
              <DropdownMenuItem>{t.message}</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>{t.more}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  dir={dir}
                  data-lang={dir === "rtl" ? language : undefined}
                >
                  <DropdownMenuItem>{t.calendar}</DropdownMenuItem>
                  <DropdownMenuItem>{t.chat}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{t.webhook}</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t.advanced}</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            {t.newTeam}
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        >
          <DropdownMenuLabel>{t.view}</DropdownMenuLabel>
          <DropdownMenuItem id="status-bar">{t.statusBar}</DropdownMenuItem>
          <DropdownMenuItem id="activity-bar">{t.activityBar}</DropdownMenuItem>
          <DropdownMenuItem id="panel">{t.panel}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup
          selectionMode="single"
          selectedKeys={[position]}
          onSelectionChange={(keys) => setPosition([...keys][0] as string)}
        >
          <DropdownMenuLabel>{t.position}</DropdownMenuLabel>
          <DropdownMenuItem id="top">{t.top}</DropdownMenuItem>
          <DropdownMenuItem id="bottom">{t.bottom}</DropdownMenuItem>
          <DropdownMenuItem id="right">{t.right}</DropdownMenuItem>
          <DropdownMenuItem id="left">{t.left}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">{t.logout}</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
```

## API Reference

See the [React Aria documentation](https://react-aria.adobe.com/Menu) for the full API reference.
