# Toggle

A two-state button that can be either on or off.

Source: /docs/components/toggle.md  
React Aria docs: https://react-aria.adobe.com/ToggleButton  
React Aria API: https://react-aria.adobe.com/ToggleButton#api

**Example — `toggle-demo`**

```tsx
import { BookmarkIcon } from "lucide-react"

import { Toggle } from "@tecton/react/components/toggle"

export function ToggleDemo() {
  return (
    <Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
      <BookmarkIcon className="group-aria-pressed/toggle:fill-foreground" />
      Bookmark
    </Toggle>
  )
}
```

## Usage

```tsx
import { Toggle } from "@tecton/react/components/toggle"
```

```tsx
<Toggle>Toggle</Toggle>
```

## Outline

Use `variant="outline"` for an outline style.

**Example — `toggle-outline`**

```tsx
import { BoldIcon, ItalicIcon } from "lucide-react"

import { Toggle } from "@tecton/react/components/toggle"

export function ToggleOutline() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle italic">
        <ItalicIcon />
        Italic
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle bold">
        <BoldIcon />
        Bold
      </Toggle>
    </div>
  )
}
```

## With Text

**Example — `toggle-text`**

```tsx
import { ItalicIcon } from "lucide-react"

import { Toggle } from "@tecton/react/components/toggle"

export function ToggleText() {
  return (
    <Toggle aria-label="Toggle italic">
      <ItalicIcon />
      Italic
    </Toggle>
  )
}
```

## Size

Use the `size` prop to change the size of the toggle.

**Example — `toggle-sizes`**

```tsx
import { Toggle } from "@tecton/react/components/toggle"

export function ToggleSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle variant="outline" aria-label="Toggle small" size="sm">
        Small
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle default" size="default">
        Default
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle large" size="lg">
        Large
      </Toggle>
    </div>
  )
}
```

## Disabled

**Example — `toggle-disabled`**

```tsx
import { Toggle } from "@tecton/react/components/toggle"

export function ToggleDisabled() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle aria-label="Toggle disabled" isDisabled>
        Disabled
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle disabled outline" isDisabled>
        Disabled
      </Toggle>
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `toggle-rtl`**

```tsx
"use client"

import * as React from "react"
import { BookmarkIcon } from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Toggle } from "@tecton/react/components/toggle"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      label: "Bookmark",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      label: "إشارة مرجعية",
    },
  },
  he: {
    dir: "rtl",
    values: {
      label: "סימנייה",
    },
  },
}

export function ToggleRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <Toggle aria-label="Toggle bookmark" size="sm" variant="outline" dir={dir}>
      <BookmarkIcon className="group-aria-pressed/toggle:fill-foreground" />
      {t.label}
    </Toggle>
  )
}
```

## API Reference

See the [React Aria ToggleButton](https://react-aria.adobe.com/ToggleButton#api) documentation.
