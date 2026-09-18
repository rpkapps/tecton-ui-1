# Hover Card

A popover that appears on hover, focus, or long press to preview content available behind a link.

Source: /docs/components/hover-card.md  
React Aria docs: https://react-aria.adobe.com/PreviewTrigger  
React Aria API: https://react-aria.adobe.com/PreviewTrigger#api

**Example — `hover-card-demo`**

```tsx
"use client"

import { Button } from "@tecton/react/components/button"
import { HoverCard, HoverCardTrigger } from "@tecton/react/components/hover-card"

export default function HoverCardDemo() {
  return (
    <HoverCardTrigger delay={10} closeDelay={100}>
      <Button variant="link">Hover Here</Button>
      <HoverCard className="flex w-64 flex-col gap-0.5">
        <div className="font-semibold">@nextjs</div>
        <div>The React Framework – created and maintained by @vercel.</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Joined December 2021
        </div>
      </HoverCard>
    </HoverCardTrigger>
  )
}
```

## Usage

```tsx showLineNumbers
import { HoverCard, HoverCardTrigger } from "@tecton/react/components/hover-card"
```

```tsx showLineNumbers
<HoverCardTrigger>
  <Button variant="link">Hover</Button>
  <HoverCard>
    The React Framework – created and maintained by @vercel.
  </HoverCard>
</HoverCardTrigger>
```

## Composition

Use the following composition to build a `HoverCard`:

```text
HoverCardTrigger
├── Button
└── HoverCard
```

## Trigger Delays

Use `delay` and `closeDelay` on the `HoverCardTrigger` to control when the card
opens and closes.

```tsx showLineNumbers
<HoverCardTrigger delay={100} closeDelay={200}>
  <Button variant="link">Hover</Button>
  <HoverCard>Content</HoverCard>
</HoverCardTrigger>
```

## Positioning

Use the `placement` prop on `HoverCard` to control placement.

```tsx showLineNumbers
<HoverCardTrigger>
  <Button variant="link">Hover</Button>
  <HoverCard placement="top">Content</HoverCard>
</HoverCardTrigger>
```

## Basic

**Example — `hover-card-demo`**

```tsx
"use client"

import { Button } from "@tecton/react/components/button"
import { HoverCard, HoverCardTrigger } from "@tecton/react/components/hover-card"

export default function HoverCardDemo() {
  return (
    <HoverCardTrigger delay={10} closeDelay={100}>
      <Button variant="link">Hover Here</Button>
      <HoverCard className="flex w-64 flex-col gap-0.5">
        <div className="font-semibold">@nextjs</div>
        <div>The React Framework – created and maintained by @vercel.</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Joined December 2021
        </div>
      </HoverCard>
    </HoverCardTrigger>
  )
}
```

## Sides

**Example — `hover-card-sides`**

```tsx
"use client"

import { Button } from "@tecton/react/components/button"
import { HoverCard, HoverCardTrigger } from "@tecton/react/components/hover-card"

const HOVER_CARD_PLACEMENTS = ["left", "top", "bottom", "right"] as const

export function HoverCardSides() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {HOVER_CARD_PLACEMENTS.map((placement) => (
        <HoverCardTrigger key={placement} delay={100} closeDelay={100}>
          <Button variant="outline" className="capitalize">
            {placement}
          </Button>
          <HoverCard placement={placement}>
            <div className="flex flex-col gap-1">
              <h4 className="font-medium">Hover Card</h4>
              <p>
                This hover card appears on the {placement} side of the trigger.
              </p>
            </div>
          </HoverCard>
        </HoverCardTrigger>
      ))}
    </div>
  )
}
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](https://ui.shadcn.com/docs/rtl).

**Example — `hover-card-rtl`**

```tsx
"use client"

import {
  useTranslation,
  type Translations,
} from "@/components/language-selector"
import { Button } from "@tecton/react/components/button"
import {
  HoverCard,
  HoverCardTrigger,
} from "@tecton/react/components/hover-card"

const translations: Translations = {
  en: {
    dir: "ltr",
    values: {
      name: "Wireless Headphones",
      price: "$99.99",
      start: "Start",
      left: "Left",
      top: "Top",
      bottom: "Bottom",
      right: "Right",
      end: "End",
    },
  },
  ar: {
    dir: "rtl",
    values: {
      name: "سماعات لاسلكية",
      price: "٩٩.٩٩ $",
      start: "بداية السطر",
      left: "يسار",
      top: "أعلى",
      bottom: "أسفل",
      right: "يمين",
      end: "نهاية السطر",
    },
  },
  he: {
    dir: "rtl",
    values: {
      name: "אוזניות אלחוטיות",
      price: "99.99 $",
      start: "תחילת השורה",
      left: "שמאל",
      top: "למעלה",
      bottom: "למטה",
      right: "ימין",
      end: "סוף השורה",
    },
  },
}

const physicalSides = ["left", "top", "bottom", "right"] as const
const logicalPlacements = ["start", "end"] as const

export function HoverCardRtl() {
  const { dir, t } = useTranslation(translations, "ar")

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {physicalSides.map((side) => (
          <HoverCardTrigger key={side} delay={10} closeDelay={100}>
            <Button variant="outline">{t[side]}</Button>
            <HoverCard
              placement={side}
              dir={dir}
              className="flex w-64 flex-col gap-1"
            >
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-muted-foreground">{t.price}</div>
            </HoverCard>
          </HoverCardTrigger>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {logicalPlacements.map((placement) => (
          <HoverCardTrigger key={placement} delay={10} closeDelay={100}>
            <Button variant="outline">{t[placement]}</Button>
            <HoverCard
              placement={placement}
              dir={dir}
              className="flex w-64 flex-col gap-1"
            >
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-muted-foreground">{t.price}</div>
            </HoverCard>
          </HoverCardTrigger>
        ))}
      </div>
    </div>
  )
}
```

## API Reference

See the [React Aria](https://react-aria.adobe.com/PreviewTrigger#api) documentation for more information.
