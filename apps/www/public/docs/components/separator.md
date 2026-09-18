# Separator

Visually or semantically separates content.

Source: /docs/components/separator.md  
React Aria docs: https://react-aria.adobe.com/Separator  
React Aria API: https://react-aria.adobe.com/Separator#api

**Example — `separator-demo`**

```tsx
import { Separator } from "@tecton/react/components/separator"

export default function SeparatorDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4 text-sm">
      <div className="flex flex-col gap-1.5">
        <div className="leading-none font-medium">shadcn/ui</div>
        <div className="text-muted-foreground">
          The Foundation for your Design System
        </div>
      </div>
      <Separator />
      <div>
        A set of beautifully designed components that you can customize, extend,
        and build on.
      </div>
    </div>
  )
}
```

## Usage

```tsx showLineNumbers
import { Separator } from "@tecton/react/components/separator"
```

```tsx showLineNumbers
<Separator />
```

## Vertical

Use `orientation="vertical"` for a vertical separator.

**Example — `separator-vertical`**

```tsx
import { Separator } from "@tecton/react/components/separator"

export function SeparatorVertical() {
  return (
    <div className="flex h-5 items-center gap-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
    </div>
  )
}
```

## Menu

Vertical separators between menu items with descriptions.

**Example — `separator-menu`**

```tsx
import { Separator } from "@tecton/react/components/separator"

export function SeparatorMenu() {
  return (
    <div className="flex items-center gap-2 text-sm md:gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-medium">Settings</span>
        <span className="text-xs text-muted-foreground">
          Manage preferences
        </span>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col gap-1">
        <span className="font-medium">Account</span>
        <span className="text-xs text-muted-foreground">
          Profile & security
        </span>
      </div>
      <Separator orientation="vertical" className="hidden md:block" />
      <div className="hidden flex-col gap-1 md:flex">
        <span className="font-medium">Help</span>
        <span className="text-xs text-muted-foreground">Support & docs</span>
      </div>
    </div>
  )
}
```

## List

Horizontal separators between list items.

**Example — `separator-list`**

```tsx
import { Separator } from "@tecton/react/components/separator"

export function SeparatorList() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2 text-sm">
      <dl className="flex items-center justify-between">
        <dt>Item 1</dt>
        <dd className="text-muted-foreground">Value 1</dd>
      </dl>
      <Separator />
      <dl className="flex items-center justify-between">
        <dt>Item 2</dt>
        <dd className="text-muted-foreground">Value 2</dd>
      </dl>
      <Separator />
      <dl className="flex items-center justify-between">
        <dt>Item 3</dt>
        <dd className="text-muted-foreground">Value 3</dd>
      </dl>
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `separator-rtl`**

```tsx
"use client"

import * as React from "react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Separator } from "@tecton/react/components/separator"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      title: "shadcn/ui",
      subtitle: "The Foundation for your Design System",
      description:
        "A set of beautifully designed components that you can customize, extend, and build on.",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      title: "shadcn/ui",
      subtitle: "الأساس لنظام التصميم الخاص بك",
      description:
        "مجموعة من المكونات المصممة بشكل جميل يمكنك تخصيصها وتوسيعها والبناء عليها.",
    },
  },
  he: {
    dir: "rtl",
    values: {
      title: "shadcn/ui",
      subtitle: "הבסיס למערכת העיצוב שלך",
      description:
        "סט של רכיבים מעוצבים בצורה יפה שאתה יכול להתאים אישית, להרחיב ולבנות עליהם.",
    },
  },
}

export function SeparatorRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="flex max-w-sm flex-col gap-4 text-sm" dir={dir}>
      <div className="flex flex-col gap-1.5">
        <div className="leading-none font-medium">{t.title}</div>
        <div className="text-muted-foreground">{t.subtitle}</div>
      </div>
      <Separator />
      <div>{t.description}</div>
    </div>
  )
}
```

## Emphasis

Use the `emphasis` prop for the three Tecton divider levels: `subtle`, `default` and `strong`. It works for both orientations.

**Example — `separator-emphasis`**

```tsx
import { Separator } from "@tecton/react/components/separator"

const emphases = ["subtle", "default", "strong"] as const

export default function SeparatorEmphasis() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-4 text-sm">
        {emphases.map((emphasis) => (
          <div key={emphasis} className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              emphasis="{emphasis}"
            </span>
            <Separator emphasis={emphasis} />
          </div>
        ))}
      </div>
      <div className="flex h-8 items-center gap-4 text-sm">
        <span>Subtle</span>
        <Separator orientation="vertical" emphasis="subtle" />
        <span>Default</span>
        <Separator orientation="vertical" emphasis="default" />
        <span>Strong</span>
        <Separator orientation="vertical" emphasis="strong" />
      </div>
    </div>
  )
}
```

## With label

A labelled divider is a `role="separator"` flex row with a `Separator` on each side of the text.

**Example — `separator-label`**

```tsx
import { Separator } from "@tecton/react/components/separator"

export default function SeparatorLabel() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 text-sm">
      <p>Alternative A — 3 wells, 2 templates</p>
      <div
        role="separator"
        className="flex items-center gap-3 text-xs text-muted-foreground"
      >
        <Separator emphasis="subtle" className="flex-1" />
        or
        <Separator emphasis="subtle" className="flex-1" />
      </div>
      <p>Alternative B — 4 wells, 1 template</p>
      <div
        role="separator"
        className="flex items-center gap-3 text-xs text-muted-foreground"
      >
        <Separator emphasis="strong" className="flex-1" />
        Archived alternatives
        <Separator emphasis="strong" className="flex-1" />
      </div>
    </div>
  )
}
```

## API Reference

See the [React Aria Separator](https://react-aria.adobe.com/Separator#api) documentation.
