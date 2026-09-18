# Badge

Displays a badge or a component that looks like a badge.

Source: /docs/components/badge.md

**Example — `badge-demo`**

```tsx
import { Badge } from "@tecton/react/components/badge"

export default function BadgeDemo() {
  return (
    <div className="flex w-full flex-wrap justify-center gap-2">
      <Badge>Badge</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  )
}
```

## Usage

```tsx
import { Badge } from "@tecton/react/components/badge"
```

```tsx
<Badge variant="default | outline | secondary | destructive">Badge</Badge>
```

## Variants

Use the `variant` prop to change the variant of the badge.

**Example — `badge-variants`**

```tsx
import { Badge } from "@tecton/react/components/badge"

export function BadgeVariants() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  )
}
```

## With Icon

You can render an icon inside the badge. Use `data-icon="inline-start"` to render the icon on the left and `data-icon="inline-end"` to render the icon on the right.

**Example — `badge-icon`**

```tsx
import { BadgeCheck, BookmarkIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"

export function BadgeWithIconLeft() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">
        <BadgeCheck data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="outline">
        Bookmark
        <BookmarkIcon data-icon="inline-end" />
      </Badge>
    </div>
  )
}
```

## With Spinner

You can render a spinner inside the badge. Remember to add the `data-icon="inline-start"` or `data-icon="inline-end"` prop to the spinner.

**Example — `badge-spinner`**

```tsx
import { Badge } from "@tecton/react/components/badge"
import { Spinner } from "@tecton/react/components/spinner"

export function BadgeWithSpinner() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="destructive">
        <Spinner data-icon="inline-start" />
        Deleting
      </Badge>
      <Badge variant="secondary">
        Generating
        <Spinner data-icon="inline-end" />
      </Badge>
    </div>
  )
}
```

## Link

Use the `render` prop to render a link as a badge.

**Example — `badge-link`**

```tsx
import { ArrowUpRightIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"

export function BadgeAsLink() {
  return (
    <Badge render={(props) => <a {...props} href="#link" />}>
      Open Link <ArrowUpRightIcon data-icon="inline-end" />
    </Badge>
  )
}
```

## Custom Colors

You can customize the colors of a badge by adding [palette](/docs/theming.md#palette) classes such as `bg-green-120 text-green-830` to the `Badge` component (a step is a contrast level, so no `dark:` variant is needed).

**Example — `badge-colors`**

```tsx
import { Badge } from "@tecton/react/components/badge"

export function BadgeCustomColors() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-120 text-blue-830">
        Blue
      </Badge>
      <Badge className="bg-green-120 text-green-830">
        Green
      </Badge>
      <Badge className="bg-azure-120 text-azure-830">
        Sky
      </Badge>
      <Badge className="bg-orchid-120 text-orchid-830">
        Purple
      </Badge>
      <Badge className="bg-red-120 text-red-830">
        Red
      </Badge>
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `badge-rtl`**

```tsx
"use client"

import * as React from "react"
import { BadgeCheck, BookmarkIcon } from "lucide-react"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Badge } from "@tecton/react/components/badge"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      badge: "Badge",
      secondary: "Secondary",
      destructive: "Destructive",
      outline: "Outline",
      verified: "Verified",
      bookmark: "Bookmark",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      badge: "شارة",
      secondary: "ثانوي",
      destructive: "مدمر",
      outline: "مخطط",
      verified: "متحقق",
      bookmark: "إشارة مرجعية",
    },
  },
  he: {
    dir: "rtl",
    values: {
      badge: "תג",
      secondary: "משני",
      destructive: "הרסני",
      outline: "קווי מתאר",
      verified: "מאומת",
      bookmark: "סימנייה",
    },
  },
}

export function BadgeRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="flex w-full flex-wrap justify-center gap-2" dir={dir}>
      <Badge>{t.badge}</Badge>
      <Badge variant="secondary">{t.secondary}</Badge>
      <Badge variant="destructive">{t.destructive}</Badge>
      <Badge variant="outline">{t.outline}</Badge>
      <Badge variant="secondary">
        <BadgeCheck data-icon="inline-start" />
        {t.verified}
      </Badge>
      <Badge variant="outline">
        {t.bookmark}
        <BookmarkIcon data-icon="inline-end" />
      </Badge>
    </div>
  )
}
```

## Status colours

The Tecton style overlay adds `variant="success" | "warning" | "info"` next to `destructive`, and an `appearance="outline"` for a transparent badge with a coloured border and text. The interactive, selectable and removable variant of the badge is the Tecton [Chip](/docs/tecton/chip.md), which reuses the same `variant`, `appearance` and `size` props.

**Example — `badge-status`**

```tsx
import { Badge } from "@tecton/react/components/badge"

const variants = ["success", "warning", "info", "destructive"] as const

export default function BadgeStatus() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {variants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {variants.map((variant) => (
          <Badge key={variant} variant={variant} appearance="outline">
            {variant}
          </Badge>
        ))}
      </div>
    </div>
  )
}
```

## Sizes

Use `size="default" | "md" | "lg"` (20 / 24 / 28 px); icons scale with the size.

**Example — `badge-sizes`**

```tsx
import { MapPinIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"

export default function BadgeSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="lg">
        <MapPinIcon data-icon="inline-start" />
        Large
      </Badge>
      <Badge size="md">
        <MapPinIcon data-icon="inline-start" />
        Medium
      </Badge>
      <Badge>
        <MapPinIcon data-icon="inline-start" />
        Default
      </Badge>
    </div>
  )
}
```

## API Reference

### Badge

The `Badge` component displays a badge or a component that looks like a badge.

| Prop        | Type                                                                          | Default     |
| ----------- | ----------------------------------------------------------------------------- | ----------- |
| `variant`   | `"default" \| "secondary" \| "destructive" \| "outline" \| "ghost" \| "link"` | `"default"` |
| `className` | `string`                                                                      | -           |
