# Collapsible

An interactive component which expands/collapses a panel.

Source: /docs/components/collapsible.md  
React Aria docs: https://react-aria.adobe.com/Disclosure  
React Aria API: https://react-aria.adobe.com/Disclosure#api

**Example — `collapsible-demo`**

```tsx
"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"

export default function CollapsibleDemo() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible
      isExpanded={isOpen}
      onExpandedChange={setIsOpen}
      className="flex w-[350px] flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-4 px-4">
        <h4 className="text-sm font-semibold">Order #4189</h4>
        <Button slot="trigger" variant="ghost" size="icon" className="size-8">
          <ChevronsUpDown />
          <span className="sr-only">Toggle details</span>
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className="font-medium">Shipped</span>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-2">
          <div className="rounded-md border px-4 py-2 text-sm">
            <p className="font-medium">Shipping address</p>
            <p className="text-muted-foreground">
              100 Market St, San Francisco
            </p>
          </div>
          <div className="rounded-md border px-4 py-2 text-sm">
            <p className="font-medium">Items</p>
            <p className="text-muted-foreground">2x Studio Headphones</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

## Usage

```tsx showLineNumbers
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
```

```tsx showLineNumbers
<Collapsible>
  <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
  <CollapsibleContent>
    Yes. Free to use for personal and commercial projects. No attribution
    required.
  </CollapsibleContent>
</Collapsible>
```

## Composition

Use the following composition to build a `Collapsible`:

```text
Collapsible
├── CollapsibleTrigger
└── CollapsibleContent
```

## Controlled State

Use the `isExpanded` and `onExpandedChange` props to control the state.

```tsx showLineNumbers
import * as React from "react"

export function Example() {
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible isExpanded={open} onExpandedChange={setOpen}>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>Content</CollapsibleContent>
    </Collapsible>
  )
}
```

## Settings Panel

Use a trigger button to reveal additional settings.

**Example — `collapsible-settings`**

```tsx
"use client"

import * as React from "react"
import { MaximizeIcon, MinimizeIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function CollapsibleSettings() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Card className="mx-auto w-full max-w-xs" size="sm">
      <CardHeader>
        <CardTitle>Radius</CardTitle>
        <CardDescription>Set the corner radius of the element.</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible
          isExpanded={isOpen}
          onExpandedChange={setIsOpen}
          className="flex items-start gap-2"
        >
          <FieldGroup className="grid w-full grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="radius-x" className="sr-only">
                Radius X
              </FieldLabel>
              <Input id="radius" placeholder="0" defaultValue={0} />
            </Field>
            <Field>
              <FieldLabel htmlFor="radius-y" className="sr-only">
                Radius Y
              </FieldLabel>
              <Input id="radius" placeholder="0" defaultValue={0} />
            </Field>
            <CollapsibleContent>
              <div className="col-span-full grid grid-cols-subgrid gap-2">
                <Field>
                  <FieldLabel htmlFor="radius-x" className="sr-only">
                    Radius X
                  </FieldLabel>
                  <Input id="radius" placeholder="0" defaultValue={0} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="radius-y" className="sr-only">
                    Radius Y
                  </FieldLabel>
                  <Input id="radius" placeholder="0" defaultValue={0} />
                </Field>
              </div>
            </CollapsibleContent>
          </FieldGroup>
          <Button slot="trigger" variant="outline" size="icon">
            {isOpen ? <MinimizeIcon /> : <MaximizeIcon />}
          </Button>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
```

## File Tree

Use nested collapsibles to build a file tree.

**Example — `collapsible-file-tree`**

```tsx
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Card, CardContent, CardHeader } from "@tecton/react/components/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

type FileTreeItem = { name: string } | { name: string; items: FileTreeItem[] }

export function CollapsibleFileTree() {
  const fileTree: FileTreeItem[] = [
    {
      name: "components",
      items: [
        {
          name: "ui",
          items: [
            { name: "button.tsx" },
            { name: "card.tsx" },
            { name: "dialog.tsx" },
            { name: "input.tsx" },
            { name: "select.tsx" },
            { name: "table.tsx" },
          ],
        },
        { name: "login-form.tsx" },
        { name: "register-form.tsx" },
      ],
    },
    {
      name: "lib",
      items: [{ name: "utils.ts" }, { name: "cn.ts" }, { name: "api.ts" }],
    },
    {
      name: "hooks",
      items: [
        { name: "use-media-query.ts" },
        { name: "use-debounce.ts" },
        { name: "use-local-storage.ts" },
      ],
    },
    {
      name: "types",
      items: [{ name: "index.d.ts" }, { name: "api.d.ts" }],
    },
    {
      name: "public",
      items: [
        { name: "favicon.ico" },
        { name: "logo.svg" },
        { name: "images" },
      ],
    },
    { name: "app.tsx" },
    { name: "layout.tsx" },
    { name: "globals.css" },
    { name: "package.json" },
    { name: "tsconfig.json" },
    { name: "README.md" },
    { name: ".gitignore" },
  ]

  const renderItem = (fileItem: FileTreeItem) => {
    if ("items" in fileItem) {
      return (
        <Collapsible key={fileItem.name}>
          <Button
            slot="trigger"
            variant="ghost"
            size="sm"
            className="group w-full justify-start transition-none hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
            <FolderIcon />
            {fileItem.name}
          </Button>
          <CollapsibleContent>
            <div className="mt-1 ml-5 flex flex-col gap-1 style-lyra:ml-4">
              {fileItem.items.map((child) => renderItem(child))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )
    }
    return (
      <Button
        key={fileItem.name}
        variant="link"
        size="sm"
        className="w-full justify-start gap-2 text-foreground"
      >
        <FileIcon />
        <span>{fileItem.name}</span>
      </Button>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-[16rem] gap-2" size="sm">
      <CardHeader>
        <Tabs defaultSelectedKey="explorer">
          <TabsList className="w-full">
            <TabsTrigger id="explorer">Explorer</TabsTrigger>
            <TabsTrigger id="settings">Outline</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          {fileTree.map((item) => renderItem(item))}
        </div>
      </CardContent>
    </Card>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `collapsible-rtl`**

```tsx
"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      orderNumber: "Order #4189",
      status: "Status",
      shipped: "Shipped",
      shippingAddress: "Shipping address",
      address: "100 Market St, San Francisco",
      items: "Items",
      itemsDescription: "2x Studio Headphones",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      orderNumber: "الطلب #4189",
      status: "الحالة",
      shipped: "تم الشحن",
      shippingAddress: "عنوان الشحن",
      address: "100 Market St, San Francisco",
      items: "العناصر",
      itemsDescription: "2x سماعات الاستوديو",
    },
  },
  he: {
    dir: "rtl",
    values: {
      orderNumber: "הזמנה #4189",
      status: "סטטוס",
      shipped: "נשלח",
      shippingAddress: "כתובת משלוח",
      address: "100 Market St, San Francisco",
      items: "פריטים",
      itemsDescription: "2x אוזניות סטודיו",
    },
  },
}

export function CollapsibleRtl() {
  const { dir, t } = useTranslation(translations, "ar")
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible
      isExpanded={isOpen}
      onExpandedChange={setIsOpen}
      className="flex w-[350px] flex-col gap-2"
      dir={dir}
    >
      <div className="flex items-center justify-between gap-4 px-4">
        <h4 className="text-sm font-semibold">{t.orderNumber}</h4>
        <Button slot="trigger" variant="ghost" size="icon" className="size-8">
          <ChevronsUpDown />
          <span className="sr-only">Toggle details</span>
        </Button>
      </div>
      <div className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
        <span className="text-muted-foreground">{t.status}</span>
        <span className="font-medium">{t.shipped}</span>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-2">
          <div className="rounded-md border px-4 py-2 text-sm">
            <p className="font-medium">{t.shippingAddress}</p>
            <p className="text-muted-foreground">{t.address}</p>
          </div>
          <div className="rounded-md border px-4 py-2 text-sm">
            <p className="font-medium">{t.items}</p>
            <p className="text-muted-foreground">{t.itemsDescription}</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/Disclosure#api) documentation for more information.
