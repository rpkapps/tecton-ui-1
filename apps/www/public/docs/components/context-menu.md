# Context Menu

Displays a menu of actions triggered by a right click.

Source: /docs/components/context-menu.md  
React Aria docs: https://react-aria.adobe.com/Menu  
React Aria API: https://react-aria.adobe.com/Menu#api

**Example — `context-menu-demo`**

```tsx
"use client"

import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuDemo() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu className="w-48">
        <ContextMenuGroup>
          <ContextMenuItem>
            Back
            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem isDisabled>
            Forward
            <ContextMenuShortcut>⌘]</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Reload
            <ContextMenuShortcut>⌘R</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-44">
              <ContextMenuGroup>
                <ContextMenuItem>Save Page...</ContextMenuItem>
                <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                <ContextMenuItem>Name Window...</ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem>Developer Tools</ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup
          selectionMode="multiple"
          defaultSelectedKeys={["bookmarks"]}
        >
          <ContextMenuItem id="bookmarks">Show Bookmarks</ContextMenuItem>
          <ContextMenuItem id="urls">Show Full URLs</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup
          selectionMode="single"
          defaultSelectedKeys={["pedro"]}
        >
          <ContextMenuLabel>People</ContextMenuLabel>
          <ContextMenuItem id="pedro">Pedro Duarte</ContextMenuItem>
          <ContextMenuItem id="colm">Colm Tuite</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"
```

```tsx showLineNumbers
<ContextMenuTrigger>
  <Pressable>
    <div role="button">Right click here</div>
  </Pressable>
  <ContextMenu>
    <ContextMenuItem>Profile</ContextMenuItem>
    <ContextMenuItem>Billing</ContextMenuItem>
    <ContextMenuItem>Team</ContextMenuItem>
    <ContextMenuItem>Subscription</ContextMenuItem>
  </ContextMenu>
</ContextMenuTrigger>
```

## Composition

Use the following composition to build a `ContextMenu`:

```text
ContextMenuTrigger
├── Pressable
└── ContextMenuContent
    ├── ContextMenuGroup
    │   ├── ContextMenuLabel
    │   ├── ContextMenuItem
    │   └── ContextMenuItem
    ├── ContextMenuSeparator
    ├── ContextMenuGroup
    │   ├── ContextMenuLabel
    │   ├── ContextMenuItem
    │   └── ContextMenuItem
    └── ContextMenuSub
        ├── ContextMenuSubTrigger
        └── ContextMenuSubContent
            └── ContextMenuGroup
                ├── ContextMenuItem
                └── ContextMenuItem
```

## Basic

A simple context menu with a few actions.

**Example — `context-menu-basic`**

```tsx
"use client"

import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuBasic() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup>
          <ContextMenuItem>Back</ContextMenuItem>
          <ContextMenuItem isDisabled>Forward</ContextMenuItem>
          <ContextMenuItem>Reload</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Submenu

Use `ContextMenuSub` to nest secondary actions.

**Example — `context-menu-submenu`**

```tsx
"use client"

import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuSubmenu() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup>
          <ContextMenuItem>
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Cut
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSub>
          <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuGroup>
              <ContextMenuItem>Save Page...</ContextMenuItem>
              <ContextMenuItem>Create Shortcut...</ContextMenuItem>
              <ContextMenuItem>Name Window...</ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem>Developer Tools</ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Shortcuts

Add `ContextMenuShortcut` to show keyboard hints.

**Example — `context-menu-shortcuts`**

```tsx
"use client"

import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuShortcuts() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup>
          <ContextMenuItem>
            Back
            <ContextMenuShortcut>⌘[</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem isDisabled>
            Forward
            <ContextMenuShortcut>⌘]</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Reload
            <ContextMenuShortcut>⌘R</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem>
            Save
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Save As...
            <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Groups

Group related actions and separate them with dividers.

**Example — `context-menu-groups`**

```tsx
"use client"

import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuGroups() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup>
          <ContextMenuLabel>File</ContextMenuLabel>
          <ContextMenuItem>
            New File
            <ContextMenuShortcut>⌘N</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Open File
            <ContextMenuShortcut>⌘O</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Save
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>Edit</ContextMenuLabel>
          <ContextMenuItem>
            Undo
            <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Redo
            <ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem>
            Cut
            <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Paste
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive">
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Icons

Combine icons with labels for quick scanning.

**Example — `context-menu-icons`**

```tsx
"use client"

import {
  ClipboardPasteIcon,
  CopyIcon,
  ScissorsIcon,
  TrashIcon,
} from "lucide-react"
import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuIcons() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup>
          <ContextMenuItem>
            <CopyIcon />
            Copy
          </ContextMenuItem>
          <ContextMenuItem>
            <ScissorsIcon />
            Cut
          </ContextMenuItem>
          <ContextMenuItem>
            <ClipboardPasteIcon />
            Paste
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive">
            <TrashIcon />
            Delete
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Checkboxes

Use `selectionMode="multiple"` for toggles.

**Example — `context-menu-checkboxes`**

```tsx
"use client"

import { useState } from "react"
import { Pressable, type Selection } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuCheckboxes() {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(
    new Set(["bookmarks-bar", "developer-tools"])
  )

  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        >
          <ContextMenuItem id="bookmarks-bar">
            Show Bookmarks Bar
          </ContextMenuItem>
          <ContextMenuItem>Show Full URLs</ContextMenuItem>
          <ContextMenuItem id="developer-tools">
            Show Developer Tools
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Radio

Use `selectionMode="single"` for exclusive choices.

**Example — `context-menu-radio`**

```tsx
"use client"

import * as React from "react"
import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuRadio() {
  const [user, setUser] = React.useState("pedro")
  const [theme, setTheme] = React.useState("light")

  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup
          selectionMode="single"
          selectedKeys={[user]}
          onSelectionChange={(keys) =>
            setUser(
              keys === "all" ? "pedro" : (keys.values().next().value as string)
            )
          }
        >
          <ContextMenuLabel>People</ContextMenuLabel>
          <ContextMenuItem id="pedro">Pedro Duarte</ContextMenuItem>
          <ContextMenuItem id="colm">Colm Tuite</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup
          selectionMode="single"
          selectedKeys={[theme]}
          onSelectionChange={(keys) =>
            setTheme(
              keys === "all" ? "system" : (keys.values().next().value as string)
            )
          }
        >
          <ContextMenuLabel>Theme</ContextMenuLabel>
          <ContextMenuItem id="light">Light</ContextMenuItem>
          <ContextMenuItem id="dark">Dark</ContextMenuItem>
          <ContextMenuItem id="system">System</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Destructive

Use `variant="destructive"` to style the menu item as destructive.

**Example — `context-menu-destructive`**

```tsx
"use client"

import { ArchiveIcon, PencilIcon, ShareIcon, TrashIcon } from "lucide-react"
import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuDestructive() {
  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            Right click here
          </span>
          <span className="hidden pointer-coarse:inline-block">
            Long press here
          </span>
        </div>
      </Pressable>
      <ContextMenu>
        <ContextMenuGroup>
          <ContextMenuItem>
            <PencilIcon />
            Edit
          </ContextMenuItem>
          <ContextMenuItem>
            <ShareIcon />
            Share
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive">
            <TrashIcon />
            Delete
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

## Placement

Control submenu placement with the `placement` prop.

**Example — `context-menu-sides`**

```tsx
"use client"

import { Pressable } from "react-aria-components"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

export function ContextMenuSides() {
  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-4">
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (top)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (top)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="top start">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (right)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (right)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="right top">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (bottom)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (bottom)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="bottom start">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
      <ContextMenuTrigger>
        <Pressable>
          <div
            role="button"
            className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
          >
            <span className="hidden pointer-fine:inline-block">
              Right click (left)
            </span>
            <span className="hidden pointer-coarse:inline-block">
              Long press (left)
            </span>
          </div>
        </Pressable>
        <ContextMenu placement="left top">
          <ContextMenuGroup>
            <ContextMenuItem>Back</ContextMenuItem>
            <ContextMenuItem>Forward</ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      </ContextMenuTrigger>
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `context-menu-rtl`**

```tsx
"use client"

import * as React from "react"
import { ArrowLeftIcon, ArrowRightIcon, RotateCwIcon } from "lucide-react"
import { Pressable, type Selection } from "react-aria-components"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@tecton/react/components/context-menu"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      rightClick: "Right click here",
      longPress: "Long press here",
      navigation: "Navigation",
      back: "Back",
      forward: "Forward",
      reload: "Reload",
      moreTools: "More Tools",
      savePage: "Save Page...",
      createShortcut: "Create Shortcut...",
      nameWindow: "Name Window...",
      developerTools: "Developer Tools",
      delete: "Delete",
      showBookmarks: "Show Bookmarks",
      showFullUrls: "Show Full URLs",
      people: "People",
      pedro: "Pedro Duarte",
      colm: "Colm Tuite",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      rightClick: "انقر بزر الماوس الأيمن هنا",
      longPress: "اضغط مطولاً هنا",
      navigation: "التنقل",
      back: "رجوع",
      forward: "تقدم",
      reload: "إعادة تحميل",
      moreTools: "المزيد من الأدوات",
      savePage: "حفظ الصفحة...",
      createShortcut: "إنشاء اختصار...",
      nameWindow: "تسمية النافذة...",
      developerTools: "أدوات المطور",
      delete: "حذف",
      showBookmarks: "إظهار الإشارات المرجعية",
      showFullUrls: "إظهار عناوين URL الكاملة",
      people: "الأشخاص",
      pedro: "Pedro Duarte",
      colm: "Colm Tuite",
    },
  },
  he: {
    dir: "rtl",
    values: {
      rightClick: "לחץ לחיצה ימנית כאן",
      longPress: "לחץ לחיצה ארוכה כאן",
      navigation: "ניווט",
      back: "חזור",
      forward: "קדימה",
      reload: "רענן",
      moreTools: "כלים נוספים",
      savePage: "שמור עמוד...",
      createShortcut: "צור קיצור דרך...",
      nameWindow: "שם חלון...",
      developerTools: "כלי מפתח",
      delete: "מחק",
      showBookmarks: "הצג סימניות",
      showFullUrls: "הצג כתובות URL מלאות",
      people: "אנשים",
      pedro: "Pedro Duarte",
      colm: "Colm Tuite",
    },
  },
}

export function ContextMenuRtl() {
  const { dir, t, language } = useTranslation(translations, "ar")
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set(["bookmarks"])
  )
  const [people, setPeople] = React.useState("pedro")

  return (
    <ContextMenuTrigger>
      <Pressable>
        <div
          role="button"
          className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          <span className="hidden pointer-fine:inline-block">
            {t.rightClick}
          </span>
          <span className="hidden pointer-coarse:inline-block">
            {t.longPress}
          </span>
        </div>
      </Pressable>
      <ContextMenu
        className="w-48"
        dir={dir}
        data-lang={dir === "rtl" ? language : undefined}
      >
        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{t.navigation}</ContextMenuSubTrigger>
            <ContextMenuSubContent
              className="w-44"
              dir={dir}
              data-lang={dir === "rtl" ? language : undefined}
            >
              <ContextMenuGroup>
                <ContextMenuItem>
                  <ArrowLeftIcon />
                  {t.back}
                  <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem isDisabled>
                  <ArrowRightIcon />
                  {t.forward}
                  <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  <RotateCwIcon />
                  {t.reload}
                  <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>{t.moreTools}</ContextMenuSubTrigger>
            <ContextMenuSubContent
              className="w-44"
              dir={dir}
              data-lang={dir === "rtl" ? language : undefined}
            >
              <ContextMenuGroup>
                <ContextMenuItem>{t.savePage}</ContextMenuItem>
                <ContextMenuItem>{t.createShortcut}</ContextMenuItem>
                <ContextMenuItem>{t.nameWindow}</ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem>{t.developerTools}</ContextMenuItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuItem variant="destructive">
                  {t.delete}
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        >
          <ContextMenuItem id="bookmarks">{t.showBookmarks}</ContextMenuItem>
          <ContextMenuItem id="urls">{t.showFullUrls}</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup
          selectionMode="single"
          selectedKeys={[people]}
          onSelectionChange={(keys) =>
            setPeople(
              keys === "all" ? "pedro" : (keys.values().next().value as string)
            )
          }
        >
          <ContextMenuItem id="pedro">{t.pedro}</ContextMenuItem>
          <ContextMenuItem id="colm">{t.colm}</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenu>
    </ContextMenuTrigger>
  )
}
```

Use `placement="end"` to place the menu on the logical end side of the trigger.

```tsx showLineNumbers
<ContextMenuTrigger>
  <Pressable>
    <div role="button">Right click here</div>
  </Pressable>
  <ContextMenu placement="end">
    <ContextMenuItem>Profile</ContextMenuItem>
    <ContextMenuItem>Billing</ContextMenuItem>
    <ContextMenuItem>Team</ContextMenuItem>
    <ContextMenuItem>Subscription</ContextMenuItem>
  </ContextMenu>
</ContextMenuTrigger>
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/Menu#api) documentation for more information.
