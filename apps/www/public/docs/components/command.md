# Command

Command menu for search and quick actions.

Source: /docs/components/command.md  
React Aria docs: https://react-aria.adobe.com/Autocomplete  
React Aria API: https://react-aria.adobe.com/Autocomplete#api

**Example — `command-demo`**

```tsx
"use client"

import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@tecton/react/components/command"

export function CommandDemo() {
  return (
    <Command className="max-w-sm rounded-lg border">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList
        renderEmptyState={() => <CommandEmpty>No results found.</CommandEmpty>}
      >
        <CommandGroup heading="Suggestions">
          <CommandItem textValue="Calendar">
            <Calendar />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem textValue="Search Emoji">
            <Smile />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem textValue="Calculator" isDisabled>
            <Calculator />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem textValue="Profile">
            <User />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem textValue="Billing">
            <CreditCard />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem textValue="Settings">
            <Settings />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@tecton/react/components/command"
```

```tsx showLineNumbers
<Command className="max-w-sm rounded-lg border">
  <CommandInput placeholder="Type a command or search..." />
  <CommandList
    renderEmptyState={() => <CommandEmpty>No results found.</CommandEmpty>}
  >
    <CommandGroup heading="Suggestions">
      <CommandItem>Calendar</CommandItem>
      <CommandItem>Search Emoji</CommandItem>
      <CommandItem>Calculator</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Settings">
      <CommandItem>Profile</CommandItem>
      <CommandItem>Billing</CommandItem>
      <CommandItem>Settings</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

## Composition

Use the following composition to build a `Command`:

```text
Command
├── CommandInput
└── CommandList
    ├── CommandGroup
    │   ├── CommandItem
    │   └── CommandItem
    ├── CommandSeparator
    └── CommandGroup
        ├── CommandItem
        └── CommandItem
```

## Basic

A simple command menu in a dialog.

**Example — `command-basic`**

```tsx
"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@tecton/react/components/command"

export function CommandBasic() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList
            renderEmptyState={() => (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          >
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
              <CommandItem>Calculator</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
```

## Shortcuts

**Example — `command-shortcuts`**

```tsx
"use client"

import * as React from "react"
import { CreditCardIcon, SettingsIcon, UserIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@tecton/react/components/command"

export function CommandWithShortcuts() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList
            renderEmptyState={() => (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          >
            <CommandGroup heading="Settings">
              <CommandItem textValue="Profile">
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Billing">
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Settings">
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
```

## Groups

A command menu with groups, icons and separators.

**Example — `command-groups`**

```tsx
"use client"

import * as React from "react"
import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@tecton/react/components/command"

export function CommandWithGroups() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList
            renderEmptyState={() => (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          >
            <CommandGroup heading="Suggestions">
              <CommandItem textValue="Calendar">
                <CalendarIcon />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem textValue="Search Emoji">
                <SmileIcon />
                <span>Search Emoji</span>
              </CommandItem>
              <CommandItem textValue="Calculator">
                <CalculatorIcon />
                <span>Calculator</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem textValue="Profile">
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Billing">
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Settings">
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
```

## Scrollable

Scrollable command menu with multiple items.

**Example — `command-scrollable`**

```tsx
"use client"

import * as React from "react"
import {
  BellIcon,
  CalculatorIcon,
  CalendarIcon,
  ClipboardPasteIcon,
  CodeIcon,
  CopyIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  ScissorsIcon,
  SettingsIcon,
  TrashIcon,
  UserIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@tecton/react/components/command"

export function CommandManyItems() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList
            renderEmptyState={() => (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
          >
            <CommandGroup heading="Navigation">
              <CommandItem textValue="Home">
                <HomeIcon />
                <span>Home</span>
                <CommandShortcut>⌘H</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Inbox">
                <InboxIcon />
                <span>Inbox</span>
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Documents">
                <FileTextIcon />
                <span>Documents</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Folders">
                <FolderIcon />
                <span>Folders</span>
                <CommandShortcut>⌘F</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem textValue="New File">
                <PlusIcon />
                <span>New File</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="New Folder">
                <FolderPlusIcon />
                <span>New Folder</span>
                <CommandShortcut>⇧⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Copy">
                <CopyIcon />
                <span>Copy</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Cut">
                <ScissorsIcon />
                <span>Cut</span>
                <CommandShortcut>⌘X</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Paste">
                <ClipboardPasteIcon />
                <span>Paste</span>
                <CommandShortcut>⌘V</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Delete">
                <TrashIcon />
                <span>Delete</span>
                <CommandShortcut>⌫</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="View">
              <CommandItem textValue="Grid View">
                <LayoutGridIcon />
                <span>Grid View</span>
              </CommandItem>
              <CommandItem textValue="List View">
                <ListIcon />
                <span>List View</span>
              </CommandItem>
              <CommandItem textValue="Zoom In">
                <ZoomInIcon />
                <span>Zoom In</span>
                <CommandShortcut>⌘+</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Zoom Out">
                <ZoomOutIcon />
                <span>Zoom Out</span>
                <CommandShortcut>⌘-</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem textValue="Profile">
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Billing">
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Settings">
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem textValue="Notifications">
                <BellIcon />
                <span>Notifications</span>
              </CommandItem>
              <CommandItem textValue="Help & Support">
                <HelpCircleIcon />
                <span>Help & Support</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Tools">
              <CommandItem textValue="Calculator">
                <CalculatorIcon />
                <span>Calculator</span>
              </CommandItem>
              <CommandItem textValue="Calendar">
                <CalendarIcon />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem textValue="Image Editor">
                <ImageIcon />
                <span>Image Editor</span>
              </CommandItem>
              <CommandItem textValue="Code Editor">
                <CodeIcon />
                <span>Code Editor</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `command-rtl`**

```tsx
"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@tecton/react/components/command"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      placeholder: "Type a command or search...",
      empty: "No results found.",
      suggestions: "Suggestions",
      calendar: "Calendar",
      searchEmoji: "Search Emoji",
      calculator: "Calculator",
      settings: "Settings",
      profile: "Profile",
      billing: "Billing",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      placeholder: "اكتب أمرًا أو ابحث...",
      empty: "لم يتم العثور على نتائج.",
      suggestions: "اقتراحات",
      calendar: "التقويم",
      searchEmoji: "البحث عن الرموز التعبيرية",
      calculator: "الآلة الحاسبة",
      settings: "الإعدادات",
      profile: "الملف الشخصي",
      billing: "الفوترة",
    },
  },
  he: {
    dir: "rtl",
    values: {
      placeholder: "הקלד פקודה או חפש...",
      empty: "לא נמצאו תוצאות.",
      suggestions: "הצעות",
      calendar: "לוח שנה",
      searchEmoji: "חפש אמוג'י",
      calculator: "מחשבון",
      settings: "הגדרות",
      profile: "פרופיל",
      billing: "חיוב",
    },
  },
}

export function CommandRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <Command className="max-w-sm rounded-lg border" dir={dir}>
      <CommandInput placeholder={t.placeholder} dir={dir} />
      <CommandList
        renderEmptyState={() => <CommandEmpty>{t.empty}</CommandEmpty>}
      >
        <CommandGroup heading={t.suggestions}>
          <CommandItem textValue={t.calendar}>
            <Calendar />
            <span>{t.calendar}</span>
          </CommandItem>
          <CommandItem textValue={t.searchEmoji}>
            <Smile />
            <span>{t.searchEmoji}</span>
          </CommandItem>
          <CommandItem textValue={t.calculator} isDisabled>
            <Calculator />
            <span>{t.calculator}</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t.settings}>
          <CommandItem textValue={t.profile}>
            <User />
            <span>{t.profile}</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem textValue={t.billing}>
            <CreditCard />
            <span>{t.billing}</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem textValue={t.settings}>
            <Settings />
            <span>{t.settings}</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/Autocomplete) documentation for more information.
